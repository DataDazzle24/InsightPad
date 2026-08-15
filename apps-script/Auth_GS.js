// ==================================================================================================================================================
// AUTENTICACAO E PERMISSOES - INSIGHT PAD
// ==================================================================================================================================================

var AUTH_ABAS_ = {
  USUARIO: "CAD_USUARIO",
  CLIENTE_SISTEMA: "CAD_CLIENTE_SISTEMA",
  PERFIL: "CAD_PERFIL",
  PAGINA: "CAD_PAGINA",
  PERFIL_PERMISSAO: "PERFIL_PERMISSAO_PAGINA",
  USUARIO_PERMISSAO: "USUARIO_PERMISSAO_PAGINA",
  SESSAO: "AUTH_SESSAO"
};

var AUTH_DIAS_SESSAO_ = 7;
var AUTH_MAX_TENTATIVAS_LOGIN_ = 5;
var AUTH_MINUTOS_BLOQUEIO_LOGIN_ = 15;
var AUTH_CACHE_SESSAO_SEGUNDOS_ = 300;
var AUTH_CACHE_PERMISSOES_SEGUNDOS_ = 1800;

function authPaginaPublica_(pageKey) {
  return String(pageKey || "").trim().toUpperCase() === "LOGIN";
}

function authPaginaAcessoSempreLiberado_(pageKey) {
  return String(pageKey || "Menu").trim().toUpperCase() === "MENU";
}

function obterUrlWebApp() {
  return ScriptApp.getService().getUrl();
}

function authDataHoraAtual_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
}

function authFormatarDataHora_(data) {
  return Utilities.formatDate(data, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
}

function authParseDataHora_(valor) {
  if (Object.prototype.toString.call(valor) === "[object Date]") {
    return isNaN(valor.getTime()) ? null : new Date(valor.getTime());
  }

  if (typeof valor === "number" && isFinite(valor)) {
    var serialMs = Math.round((valor - 25569) * 24 * 60 * 60 * 1000);
    var dataSerial = new Date(serialMs);
    return isNaN(dataSerial.getTime()) ? null : dataSerial;
  }

  var texto = String(valor || "").trim();
  if (!texto) return null;

  var partes = texto.split(" ");
  var data = String(partes[0] || "").split("/");
  var hora = String(partes[1] || "00:00:00").split(":");

  if (data.length === 3) {
    var dtBr = new Date(
      parseInt(data[2], 10),
      parseInt(data[1], 10) - 1,
      parseInt(data[0], 10),
      parseInt(hora[0] || 0, 10),
      parseInt(hora[1] || 0, 10),
      parseInt(hora[2] || 0, 10)
    );

    if (!isNaN(dtBr.getTime())) return dtBr;
  }

  var dtNativo = new Date(texto);

  return isNaN(dtNativo.getTime()) ? null : dtNativo;
}

function authObterSheet_(nomeAba) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomeAba);
  if (!sheet) {
    throw new Error("Aba nao encontrada: " + nomeAba);
  }
  return sheet;
}

function authNormalizarCabecalho_(valor) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function authMapaCabecalho_(sheet) {
  var ultimaColuna = sheet.getLastColumn();
  var cabecalhos = ultimaColuna > 0
    ? sheet.getRange(1, 1, 1, ultimaColuna).getValues()[0]
    : [];
  var mapa = {};

  cabecalhos.forEach(function(nome, indice) {
    var chave = authNormalizarCabecalho_(nome);
    if (chave) mapa[chave] = indice + 1;
  });

  return mapa;
}

function authColunaPorNomes_(mapa, nomes, fallback) {
  for (var i = 0; i < nomes.length; i++) {
    var chave = authNormalizarCabecalho_(nomes[i]);
    if (mapa[chave]) return mapa[chave];
  }

  return fallback || 0;
}

function authValorPorNomes_(row, mapa, nomes, fallbackIndex) {
  var colunaFallback = typeof fallbackIndex === "number" ? fallbackIndex + 1 : 0;
  var coluna = authColunaPorNomes_(mapa, nomes, colunaFallback);
  return coluna ? row[coluna - 1] : "";
}

function authSetValorPorNomes_(row, mapa, nomes, valor, fallbackIndex) {
  var colunaFallback = typeof fallbackIndex === "number" ? fallbackIndex + 1 : 0;
  var coluna = authColunaPorNomes_(mapa, nomes, colunaFallback);
  if (coluna) row[coluna - 1] = valor;
}

function authSetCelulaPorNomes_(sheet, rowIndex, mapa, nomes, valor, fallbackCol) {
  var coluna = authColunaPorNomes_(mapa, nomes, fallbackCol || 0);
  if (coluna) sheet.getRange(rowIndex, coluna).setValue(valor);
}

function authGarantirColuna_(sheet, mapa, nomeColuna) {
  var chave = authNormalizarCabecalho_(nomeColuna);
  if (mapa[chave]) return mapa[chave];

  var novaColuna = sheet.getLastColumn() + 1;
  sheet.getRange(1, novaColuna).setValue(nomeColuna);
  mapa[chave] = novaColuna;
  return novaColuna;
}

function authGerarNovoId_(sheet, colunaId) {
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return 1;

  var valores = sheet.getRange(2, colunaId, ultimaLinha - 1, 1).getValues();
  var maior = 0;

  valores.forEach(function(row) {
    var id = parseInt(row[0], 10);
    if (!isNaN(id) && id > maior) maior = id;
  });

  return maior + 1;
}

function authExcluirLinhasAgrupadas_(sheet, linhas) {
  if (!linhas || !linhas.length) return 0;

  linhas = linhas
    .map(function(linha) { return parseInt(linha, 10); })
    .filter(function(linha) { return !isNaN(linha) && linha > 1; })
    .sort(function(a, b) { return a - b; });

  if (!linhas.length) return 0;

  var grupos = [];
  var inicio = linhas[0];
  var anterior = linhas[0];

  for (var i = 1; i < linhas.length; i++) {
    if (linhas[i] === anterior + 1) {
      anterior = linhas[i];
      continue;
    }

    grupos.push({
      inicio: inicio,
      fim: anterior
    });
    inicio = linhas[i];
    anterior = linhas[i];
  }

  grupos.push({
    inicio: inicio,
    fim: anterior
  });

  for (var g = grupos.length - 1; g >= 0; g--) {
    sheet.deleteRows(grupos[g].inicio, grupos[g].fim - grupos[g].inicio + 1);
  }

  return linhas.length;
}

function authLimparSessoesAntigas_(diasRetencao) {
  diasRetencao = Number(diasRetencao || 30);
  if (!Number.isFinite(diasRetencao) || diasRetencao <= 0) diasRetencao = 30;

  var sheet = authObterSheet_(AUTH_ABAS_.SESSAO);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return 0;

  var mapa = authMapaCabecalho_(sheet);
  var colunaCriadoEm = authColunaPorNomes_(mapa, ["CRIADO_EM"], 4);
  if (!colunaCriadoEm) return 0;

  var limite = new Date();
  limite.setDate(limite.getDate() - diasRetencao);

  var valores = sheet.getRange(2, colunaCriadoEm, ultimaLinha - 1, 1).getValues();
  var linhasExcluir = [];

  valores.forEach(function(row, indice) {
    var dataCriacao = authParseDataHora_(row[0]);
    if (dataCriacao && dataCriacao.getTime() < limite.getTime()) {
      linhasExcluir.push(indice + 2);
    }
  });

  return authExcluirLinhasAgrupadas_(sheet, linhasExcluir);
}

function authDigestHex_(texto) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(texto),
    Utilities.Charset.UTF_8
  );

  return bytes.map(function(byte) {
    var v = byte;
    if (v < 0) v += 256;
    return ("0" + v.toString(16)).slice(-2);
  }).join("");
}

function authGerarSalt_() {
  return Utilities.getUuid() + "-" + new Date().getTime();
}

function authHashSenha_(senha, salt) {
  return authDigestHex_(String(salt || "") + "::" + String(senha || ""));
}

function authGerarToken_() {
  return Utilities.getUuid() + "-" + Utilities.getUuid() + "-" + new Date().getTime();
}

function authHashToken_(token) {
  return authDigestHex_("TOKEN::" + String(token || ""));
}

function authChaveCacheSessaoPorHash_(tokenHash) {
  return "AUTH_CTX_" + String(tokenHash || "");
}

function authChaveCacheSessao_(token) {
  return authChaveCacheSessaoPorHash_(authHashToken_(token));
}

function authChaveCachePermissoesUsuario_(idUsuario) {
  return "AUTH_PERM_USER_" + authDigestHex_(String(idUsuario || ""));
}

function authLerPermissoesUsuarioCache_(idUsuario) {
  var texto = CacheService.getScriptCache().get(authChaveCachePermissoesUsuario_(idUsuario));
  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch (erro) {
    CacheService.getScriptCache().remove(authChaveCachePermissoesUsuario_(idUsuario));
    return null;
  }
}

function authSalvarPermissoesUsuarioCache_(idUsuario, permissoes) {
  try {
    CacheService.getScriptCache().put(
      authChaveCachePermissoesUsuario_(idUsuario),
      JSON.stringify(permissoes || {}),
      AUTH_CACHE_PERMISSOES_SEGUNDOS_
    );
  } catch (erro) {
    console.warn("Nao foi possivel armazenar as permissoes em cache:", erro);
  }
}

function authRemoverCacheSessao_(token) {
  if (!token) return;
  CacheService.getScriptCache().remove(authChaveCacheSessao_(token));
}

function authInvalidarCachesUsuarios_(idsUsuarios) {
  var ids = {};
  (Array.isArray(idsUsuarios) ? idsUsuarios : [idsUsuarios]).forEach(function(idUsuario) {
    var id = String(idUsuario || "").trim();
    if (id) ids[id] = true;
  });
  if (!Object.keys(ids).length) return 0;

  var chaves = Object.keys(ids).map(function(idUsuario) {
    return authChaveCachePermissoesUsuario_(idUsuario);
  });
  var sheet = authObterSheet_(AUTH_ABAS_.SESSAO);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) {
    CacheService.getScriptCache().removeAll(chaves);
    return chaves.length;
  }

  var mapa = authMapaCabecalho_(sheet);
  var colunaIdUsuario = authColunaPorNomes_(mapa, ["ID_USUARIO"], 2);
  var colunaToken = authColunaPorNomes_(mapa, ["TOKEN_HASH"], 3);
  var ultimaColuna = Math.max(colunaIdUsuario, colunaToken);
  var dados = sheet.getRange(2, 1, ultimaLinha - 1, ultimaColuna).getDisplayValues();
  dados.forEach(function(row) {
    if (!ids[String(row[colunaIdUsuario - 1] || "").trim()]) return;
    var tokenHash = String(row[colunaToken - 1] || "").trim();
    if (tokenHash) chaves.push(authChaveCacheSessaoPorHash_(tokenHash));
  });

  if (chaves.length) {
    CacheService.getScriptCache().removeAll(chaves);
  }

  return chaves.length;
}

function authInvalidarCachesUsuario_(idUsuario) {
  return authInvalidarCachesUsuarios_([idUsuario]);
}

function authInvalidarCachesPerfil_(idPerfil) {
  idPerfil = String(idPerfil || "").trim();
  if (!idPerfil) return 0;

  var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return 0;

  var dados = sheet.getRange(2, 1, ultimaLinha - 1, 18).getDisplayValues();
  var idsUsuarios = [];

  dados.forEach(function(row) {
    if (String(row[8] || "").trim() !== idPerfil) return;
    idsUsuarios.push(row[0]);
  });

  return authInvalidarCachesUsuarios_(idsUsuarios);
}

function authLerContextoSessaoCache_(token, idDispositivo) {
  if (!token) return null;

  var cache = CacheService.getScriptCache();
  var chave = authChaveCacheSessao_(token);
  var texto = cache.get(chave);
  if (!texto) return null;

  try {
    var contexto = JSON.parse(texto);
    var expiraTimestamp = Number(contexto.expiraTimestamp || 0);
    var dispositivoSessao = authNormalizarIdDispositivo_(contexto.idDispositivo);
    var dispositivoAtual = authNormalizarIdDispositivo_(idDispositivo);

    if (!expiraTimestamp || expiraTimestamp <= Date.now()) {
      cache.remove(chave);
      return null;
    }

    if (dispositivoSessao && dispositivoAtual && dispositivoSessao !== dispositivoAtual) {
      cache.remove(chave);
      return null;
    }

    return contexto;
  } catch (erro) {
    cache.remove(chave);
    return null;
  }
}

function authSalvarContextoSessaoCache_(token, contexto) {
  if (!token || !contexto) return;

  var segundosAteExpirar = Math.floor((Number(contexto.expiraTimestamp || 0) - Date.now()) / 1000);
  var ttl = Math.min(AUTH_CACHE_SESSAO_SEGUNDOS_, segundosAteExpirar);
  if (ttl <= 0) return;

  try {
    CacheService.getScriptCache().put(
      authChaveCacheSessao_(token),
      JSON.stringify(contexto),
      ttl
    );
  } catch (erro) {
    console.warn("Nao foi possivel armazenar o contexto de sessao em cache:", erro);
  }
}

function authRespostaContextoSessao_(contexto, pageKey) {
  var permissoes = contexto && contexto.permissoes ? contexto.permissoes : {};
  var nivel = String(contexto && contexto.usuario && contexto.usuario.nivelUsuario || "").trim().toUpperCase();

  if (authPaginaPublica_(pageKey)) {
    return {
      sucesso: true,
      autenticado: true,
      autorizado: true,
      paginaPublica: true,
      usuario: contexto.usuario || null,
      permissoes: permissoes
    };
  }

  if (authPaginaAcessoSempreLiberado_(pageKey)) {
    return {
      sucesso: true,
      autenticado: true,
      autorizado: true,
      usuario: contexto.usuario || null,
      permissoes: permissoes
    };
  }

  if (nivel === "MASTER") {
    permissoes.Controle_Usuarios = Object.assign({}, permissoes.Controle_Usuarios || {}, {
      pageKey: "Controle_Usuarios",
      podeAcessar: "S",
      podeCadastrar: "S",
      podeEditar: "S",
      podeExcluir: "S",
      podeExportar: "S",
      podeGerenciar: "S"
    });
  }

  var permissaoPagina = pageKey ? permissoes[pageKey] : null;

  if (pageKey && (!permissaoPagina || permissaoPagina.podeAcessar !== "S")) {
    return {
      sucesso: true,
      autenticado: true,
      autorizado: false,
      mensagem: "Usuario sem permissao para acessar esta pagina.",
      usuario: contexto.usuario || null,
      permissoes: permissoes
    };
  }

  return {
    sucesso: true,
    autenticado: true,
    autorizado: true,
    usuario: contexto.usuario || null,
    permissoes: permissoes
  };
}

function authChaveCodigoLogin_(codigo) {
  return "LOGIN_CODE_" + authDigestHex_(codigo);
}

function authChaveCodigoRenderizacao_(codigo) {
  return "PAGE_RENDER_CODE_" + authDigestHex_(codigo);
}

function authCriarCodigoLogin_(dadosSessao) {
  var codigo = Utilities.getUuid() + "-" + new Date().getTime();
  var payload = {
    token: dadosSessao.token || "",
    expiraEm: dadosSessao.expiraEm || "",
    usuario: dadosSessao.usuario || null
  };

  CacheService.getScriptCache().put(
    authChaveCodigoLogin_(codigo),
    JSON.stringify(payload),
    600
  );

  return codigo;
}

function prepararRenderizacaoPagina(token, pageKey, idDispositivo) {
  var pagina = String(pageKey || "Menu").trim() || "Menu";
  var resultado = validarSessao(token, pagina, idDispositivo);

  if (!resultado || !resultado.autenticado || !resultado.autorizado) {
    return resultado || {
      sucesso: false,
      autenticado: false,
      autorizado: false,
      mensagem: "Nao foi possivel autorizar a pagina."
    };
  }

  var codigo = Utilities.getUuid() + "-" + new Date().getTime();

  CacheService.getScriptCache().put(
    authChaveCodigoRenderizacao_(codigo),
    JSON.stringify({
      pageKey: pagina,
      criadoEm: new Date().getTime()
    }),
    90
  );

  return {
    sucesso: true,
    autenticado: true,
    autorizado: true,
    codigoRenderizacao: codigo,
    usuario: resultado.usuario || null,
    permissoes: resultado.permissoes || {}
  };
}

function authConsumirCodigoRenderizacao_(codigo, pageKey) {
  var codigoNormalizado = String(codigo || "").trim();
  var pagina = String(pageKey || "Menu").trim() || "Menu";

  if (!codigoNormalizado) {
    return { sucesso: false };
  }

  var cache = CacheService.getScriptCache();
  var chave = authChaveCodigoRenderizacao_(codigoNormalizado);
  var payloadTexto = cache.get(chave);

  if (!payloadTexto) {
    return { sucesso: false };
  }

  cache.remove(chave);

  try {
    var payload = JSON.parse(payloadTexto);

    if (String(payload.pageKey || "") !== pagina) {
      return { sucesso: false };
    }

    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false };
  }
}

function carregarPaginaProtegida(token, pageKey, idDispositivo) {
  var pagina = String(pageKey || "Menu").trim() || "Menu";
  var autorizacao = prepararRenderizacaoPagina(token, pagina, idDispositivo);

  if (!autorizacao || !autorizacao.autenticado || !autorizacao.autorizado || !autorizacao.codigoRenderizacao) {
    return autorizacao || {
      sucesso: false,
      autenticado: false,
      autorizado: false,
      mensagem: "Nao foi possivel autorizar a pagina."
    };
  }

  var saida = doGet({
    parameter: {
      page: pagina,
      renderCode: autorizacao.codigoRenderizacao
    }
  });

  return {
    sucesso: true,
    autenticado: true,
    autorizado: true,
    pageKey: pagina,
    html: saida.getContent(),
    usuario: autorizacao.usuario || null,
    permissoes: autorizacao.permissoes || {}
  };
}

function authNormalizarLogin_(valor) {
  return String(valor || "").trim().toLowerCase();
}

function authAtivo_(valor) {
  return String(valor || "S").trim().toUpperCase() !== "N";
}

function authSim_(valor) {
  return String(valor || "").trim().toUpperCase() === "S";
}

function authRegistrarLogAcesso_(idUsuario, loginInformado, acao, pageKey, sucesso, detalhe, userAgent) {
  try {
    registrarLogAcessoExterno_({
      idUsuario: idUsuario || "",
      login: loginInformado || "",
      acao: acao || "",
      pageKey: pageKey || "",
      sucesso: sucesso,
      detalhe: detalhe || "",
      userAgent: userAgent || "",
      origem: "APPS_SCRIPT"
    });
  } catch (erro) {
    console.error("Erro ao registrar log de acesso:", erro);
  }
}

function authBuscarUsuarioPorLogin_(login) {
  var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
  var ultimaLinha = sheet.getLastRow();
  var loginNormalizado = authNormalizarLogin_(login);

  if (ultimaLinha < 2 || !loginNormalizado) return null;

  var celula = sheet.getRange(2, 5, ultimaLinha - 1, 1)
    .createTextFinder(loginNormalizado)
    .matchCase(false)
    .matchEntireCell(true)
    .findNext();

  if (!celula) {
    celula = sheet.getRange(2, 4, ultimaLinha - 1, 1)
      .createTextFinder(loginNormalizado)
      .matchCase(false)
      .matchEntireCell(true)
      .findNext();
  }

  if (celula) {
    var rowIndex = celula.getRow();
    var row = sheet.getRange(rowIndex, 1, 1, 18).getValues()[0];
    if (authAtivo_(row[17])) {
      return { rowIndex: rowIndex, values: row };
    }
  }

  return null;
}

function authExisteMasterAtivo_() {
  var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return false;

  var dados = sheet.getRange(2, 1, ultimaLinha - 1, 18).getValues();

  return dados.some(function(row) {
    return String(row[7] || "").trim().toUpperCase() === "MASTER" && authAtivo_(row[17]);
  });
}

function authObterIdPerfilPorNome_(nomePerfil) {
  var sheet = authObterSheet_(AUTH_ABAS_.PERFIL);
  var ultimaLinha = sheet.getLastRow();
  var alvo = String(nomePerfil || "").trim().toUpperCase();

  if (ultimaLinha < 2 || !alvo) return "";

  var dados = sheet.getRange(2, 1, ultimaLinha - 1, 8).getValues();

  for (var i = 0; i < dados.length; i++) {
    var row = dados[i];
    if (String(row[2] || "").trim().toUpperCase() === alvo && authAtivo_(row[7])) {
      return row[0];
    }
  }

  return "";
}

function criarUsuarioMasterInicial(payload) {
  try {
    payload = payload || {};

    var nome = String(payload.nome || "").trim().toUpperCase();
    var email = String(payload.email || "").trim().toLowerCase();
    var login = String(payload.login || email || "").trim().toLowerCase();
    var senha = String(payload.senha || "");
    var idClienteSistema = String(payload.idClienteSistema || "1").trim();
    var idPerfil = String(payload.idPerfil || authObterIdPerfilPorNome_("MASTER") || "1").trim();

    if (!nome || !email || !login || !senha) {
      return {
        sucesso: false,
        mensagem: "Informe nome, email, login e senha para criar o usuario MASTER inicial."
      };
    }

    if (senha.length < 8) {
      return {
        sucesso: false,
        mensagem: "A senha inicial deve ter pelo menos 8 caracteres."
      };
    }

    if (authExisteMasterAtivo_()) {
      return {
        sucesso: false,
        mensagem: "Ja existe um usuario MASTER ativo. A funcao inicial nao deve criar outro."
      };
    }

    if (authBuscarUsuarioPorLogin_(login)) {
      return {
        sucesso: false,
        mensagem: "Ja existe usuario ativo com este login ou email."
      };
    }

    var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
    var novoId = authGerarNovoId_(sheet, 1);
    var agora = authDataHoraAtual_();
    var salt = authGerarSalt_();
    var senhaHash = authHashSenha_(senha, salt);

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, 18).setValues([[
      novoId,
      idClienteSistema,
      nome,
      email,
      login,
      senhaHash,
      salt,
      "MASTER",
      idPerfil,
      "N",
      0,
      "",
      "",
      agora,
      agora,
      "SISTEMA",
      "SISTEMA",
      "S"
    ]]);

    authRegistrarLogAcesso_(novoId, login, "CRIAR_MASTER_INICIAL", "", true, "Usuario MASTER inicial criado.");

    return {
      sucesso: true,
      mensagem: "Usuario MASTER inicial criado com sucesso.",
      idUsuario: novoId
    };

  } catch (erro) {
    console.error("Erro ao criar usuario MASTER inicial:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao criar usuario MASTER inicial: " + erro.toString()
    };
  }
}

function authCriarSessao_(idUsuario, userAgent, idDispositivo) {
  var sheet = authObterSheet_(AUTH_ABAS_.SESSAO);
  var mapa = authMapaCabecalho_(sheet);
  authGarantirColuna_(sheet, mapa, "DISPOSITIVO");
  authGarantirColuna_(sheet, mapa, "NAVEGADOR");
  authGarantirColuna_(sheet, mapa, "ID_DISPOSITIVO");
  var ultimaColuna = sheet.getLastColumn();
  var novoId = authGerarNovoId_(sheet, 1);
  var token = authGerarToken_();
  var tokenHash = authHashToken_(token);
  var agora = new Date();
  var expira = new Date(agora.getTime() + AUTH_DIAS_SESSAO_ * 24 * 60 * 60 * 1000);
  var agoraTexto = authFormatarDataHora_(agora);
  var expiraTexto = authFormatarDataHora_(expira);
  var novaLinha = new Array(ultimaColuna || 8).fill("");
  var dispositivo = authIdentificarDispositivo_(userAgent);
  var navegador = authIdentificarNavegador_(userAgent);

  authSetValorPorNomes_(novaLinha, mapa, ["ID_SESSAO", "ID_AUTH_SESSAO"], novoId, 0);
  authSetValorPorNomes_(novaLinha, mapa, ["ID_USUARIO"], idUsuario, 1);
  authSetValorPorNomes_(novaLinha, mapa, ["TOKEN_HASH"], tokenHash, 2);
  authSetValorPorNomes_(novaLinha, mapa, ["CRIADO_EM"], agoraTexto, 3);
  authSetValorPorNomes_(novaLinha, mapa, ["EXPIRA_EM"], expiraTexto, 4);
  authSetValorPorNomes_(novaLinha, mapa, ["ULTIMA_ATIVIDADE", "ULTIMA_ATIVIDADE_EM", "ULTIMO_ACESSO", "EDITADO_EM"], agoraTexto, 5);
  authSetValorPorNomes_(novaLinha, mapa, ["USER_AGENT"], userAgent || "", 6);
  authSetValorPorNomes_(novaLinha, mapa, ["DISPOSITIVO"], dispositivo, 0);
  authSetValorPorNomes_(novaLinha, mapa, ["NAVEGADOR"], navegador, 0);
  authSetValorPorNomes_(novaLinha, mapa, ["ID_DISPOSITIVO", "CHAVE_DISPOSITIVO"], idDispositivo || "", 0);
  authSetValorPorNomes_(novaLinha, mapa, ["STATUS", "STATUS_ATIVACAO", "STATUS_ATIVAÇÃO"], "ATIVA", 7);

  sheet.getRange(sheet.getLastRow() + 1, 1, 1, novaLinha.length).setValues([novaLinha]);

  return {
    idSessao: novoId,
    token: token,
    expiraEm: expiraTexto
  };
}

function authIdentificarNavegador_(userAgent) {
  var ua = String(userAgent || "");

  if (/EdgA|EdgiOS|Edg\//i.test(ua)) return "EDGE";
  if (/OPR\/|Opera|OPiOS/i.test(ua)) return "OPERA";
  if (/FxiOS|Firefox\//i.test(ua)) return "FIREFOX";
  if (/SamsungBrowser/i.test(ua)) return "SAMSUNG INTERNET";
  if (/CriOS|Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) return "CHROME";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua) && !/CriOS/i.test(ua)) return "SAFARI";

  return "NAVEGADOR NAO IDENTIFICADO";
}

function authIdentificarDispositivo_(userAgent) {
  var ua = String(userAgent || "");
  var tipo = "COMPUTADOR";
  var modelo = "";

  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))) {
    return "TABLET - IPAD";
  }

  if (/iPhone/i.test(ua)) {
    return "CELULAR - IPHONE";
  }

  if (/Android/i.test(ua)) {
    tipo = /Mobile/i.test(ua) ? "CELULAR" : "TABLET";
    modelo = authExtrairModeloAndroid_(ua);
    return tipo + " - " + (modelo || "ANDROID");
  }

  if (/CrOS/i.test(ua)) return "COMPUTADOR - CHROMEBOOK";
  if (/Windows NT/i.test(ua)) return "COMPUTADOR - WINDOWS";
  if (/Macintosh|Mac OS X/i.test(ua)) return "COMPUTADOR - MAC";
  if (/Linux/i.test(ua)) return "COMPUTADOR - LINUX";

  return "COMPUTADOR - MODELO NAO IDENTIFICADO";
}

function authExtrairModeloAndroid_(userAgent) {
  var ua = String(userAgent || "");
  var match = ua.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build\/|;|\))/i);
  var modelo = match && match[1] ? String(match[1]).trim() : "";

  modelo = modelo
    .replace(/^wv$/i, "")
    .replace(/^Mobile\s+/i, "")
    .replace(/^Tablet\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return modelo ? modelo.toUpperCase() : "";
}

function authNormalizarIdDispositivo_(valor) {
  return String(valor || "").trim();
}

function authSessaoAtivaOutroDispositivo_(idUsuario, idDispositivoAtual) {
  idUsuario = String(idUsuario || "").trim();
  idDispositivoAtual = authNormalizarIdDispositivo_(idDispositivoAtual);
  if (!idUsuario || !idDispositivoAtual) return null;

  var sheet = authObterSheet_(AUTH_ABAS_.SESSAO);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return null;

  var mapa = authMapaCabecalho_(sheet);
  var ultimaColuna = sheet.getLastColumn();
  var colunaIdUsuario = authColunaPorNomes_(mapa, ["ID_USUARIO"], 2);
  var colunaExpira = authColunaPorNomes_(mapa, ["EXPIRA_EM"], 5);
  var colunaStatus = authColunaPorNomes_(mapa, ["STATUS", "STATUS_ATIVACAO", "STATUS_ATIVAÇÃO"], 8);
  var colunaDispositivo = authColunaPorNomes_(mapa, ["ID_DISPOSITIVO", "CHAVE_DISPOSITIVO"], 0);
  var colunaDispositivoTexto = authColunaPorNomes_(mapa, ["DISPOSITIVO"], 0);
  var colunaNavegador = authColunaPorNomes_(mapa, ["NAVEGADOR"], 0);

  if (!colunaDispositivo) return null;

  var dados = sheet.getRange(2, 1, ultimaLinha - 1, ultimaColuna).getValues();
  var agora = new Date();

  for (var i = dados.length - 1; i >= 0; i--) {
    var row = dados[i];
    var idUsuarioSessao = String(row[colunaIdUsuario - 1] || "").trim();
    var status = String(row[colunaStatus - 1] || "").trim().toUpperCase();
    var expiraEm = authParseDataHora_(row[colunaExpira - 1]);
    var idDispositivoSessao = authNormalizarIdDispositivo_(row[colunaDispositivo - 1]);

    if (idUsuarioSessao !== idUsuario) continue;
    if (status !== "ATIVA") continue;
    if (!expiraEm || expiraEm.getTime() <= agora.getTime()) continue;
    if (!idDispositivoSessao || idDispositivoSessao === idDispositivoAtual) continue;

    return {
      rowIndex: i + 2,
      dispositivo: colunaDispositivoTexto ? String(row[colunaDispositivoTexto - 1] || "") : "",
      navegador: colunaNavegador ? String(row[colunaNavegador - 1] || "") : ""
    };
  }

  return null;
}

function authEncerrarSessoesMesmoDispositivo_(idUsuario, idDispositivoAtual) {
  idUsuario = String(idUsuario || "").trim();
  if (!idUsuario) return 0;

  var sheet = authObterSheet_(AUTH_ABAS_.SESSAO);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return 0;

  var mapa = authMapaCabecalho_(sheet);
  var ultimaColuna = sheet.getLastColumn();
  var colunaIdUsuario = authColunaPorNomes_(mapa, ["ID_USUARIO"], 2);
  var colunaStatus = authColunaPorNomes_(mapa, ["STATUS", "STATUS_ATIVACAO", "STATUS_ATIVAÇÃO"], 8);
  var colunaDispositivo = authColunaPorNomes_(mapa, ["ID_DISPOSITIVO", "CHAVE_DISPOSITIVO"], 0);
  if (!colunaStatus) return 0;

  var dados = sheet.getRange(2, 1, ultimaLinha - 1, ultimaColuna).getValues();
  var linhasAtualizar = [];

  dados.forEach(function(row, indice) {
    if (String(row[colunaIdUsuario - 1] || "").trim() !== idUsuario) return;
    if (String(row[colunaStatus - 1] || "").trim().toUpperCase() !== "ATIVA") return;
    linhasAtualizar.push(indice + 2);
  });

  linhasAtualizar.forEach(function(rowIndex) {
    sheet.getRange(rowIndex, colunaStatus).setValue("ENCERRADA_NOVO_LOGIN");
  });

  return linhasAtualizar.length;
}

function loginUsuario(payload) {
  try {
    payload = payload || {};

    var login = authNormalizarLogin_(payload.login);
    var senha = String(payload.senha || "");
    var userAgent = String(payload.userAgent || "");
    var idDispositivo = authNormalizarIdDispositivo_(payload.idDispositivo);

    if (!login || !senha) {
      return {
        sucesso: false,
        mensagem: "Informe login e senha."
      };
    }

    var usuario = authBuscarUsuarioPorLogin_(login);
    if (!usuario) {
      authRegistrarLogAcesso_("", login, "LOGIN", "", false, "Usuario nao encontrado ou inativo.", userAgent);
      return {
        sucesso: false,
        mensagem: "Login ou senha invalido."
      };
    }

    var row = usuario.values;
    var agora = new Date();
    var bloqueadoAte = authParseDataHora_(row[11]);

    if (bloqueadoAte && bloqueadoAte.getTime() > agora.getTime()) {
      authRegistrarLogAcesso_(row[0], login, "LOGIN", "", false, "Usuario temporariamente bloqueado.", userAgent);
      return {
        sucesso: false,
        mensagem: "Usuario temporariamente bloqueado. Tente novamente mais tarde."
      };
    }

    var hashInformado = authHashSenha_(senha, row[6]);
    var hashAtual = String(row[5] || "");

    if (hashInformado !== hashAtual) {
      var tentativas = (parseInt(row[10], 10) || 0) + 1;
      var bloqueio = "";

      if (tentativas >= AUTH_MAX_TENTATIVAS_LOGIN_) {
        bloqueio = authFormatarDataHora_(new Date(agora.getTime() + AUTH_MINUTOS_BLOQUEIO_LOGIN_ * 60 * 1000));
      }

      var sheetUsuario = authObterSheet_(AUTH_ABAS_.USUARIO);
      sheetUsuario.getRange(usuario.rowIndex, 11).setValue(tentativas);
      sheetUsuario.getRange(usuario.rowIndex, 12).setValue(bloqueio);

      authRegistrarLogAcesso_(row[0], login, "LOGIN", "", false, "Senha invalida.", userAgent);

      return {
        sucesso: false,
        mensagem: "Login ou senha invalido."
      };
    }

    if (!idDispositivo) {
      return {
        sucesso: false,
        mensagem: "Nao foi possivel identificar o dispositivo de acesso. Atualize a pagina e tente novamente."
      };
    }

    var sessoesEncerradas = authEncerrarSessoesMesmoDispositivo_(row[0], idDispositivo);
    authInvalidarCachesUsuario_(row[0]);

    var sessao = authCriarSessao_(row[0], userAgent, idDispositivo);
    var agoraTexto = authFormatarDataHora_(agora);
    var sheetUsuarioAtualizar = authObterSheet_(AUTH_ABAS_.USUARIO);
    var permissoes = buscarPermissoesUsuario_(row[0]);
    var nomeClienteSistema = authBuscarNomeClienteSistema_(row[1]);
    var dadosRetorno = {
      token: sessao.token,
      expiraEm: sessao.expiraEm,
      usuario: {
        idUsuario: row[0],
        idClienteSistema: row[1],
        nomeCliente: nomeClienteSistema,
        nome: row[2],
        email: row[3],
        login: row[4],
        nivelUsuario: row[7],
        idPerfil: row[8],
        trocarSenhaProximoLogin: row[9]
      },
      permissoes: permissoes
    };

    authSalvarContextoSessaoCache_(sessao.token, {
      expiraTimestamp: authParseDataHora_(sessao.expiraEm).getTime(),
      idDispositivo: idDispositivo,
      usuario: dadosRetorno.usuario,
      permissoes: dadosRetorno.permissoes
    });

    sheetUsuarioAtualizar.getRange(usuario.rowIndex, 11).setValue(0);
    sheetUsuarioAtualizar.getRange(usuario.rowIndex, 12).setValue("");
    sheetUsuarioAtualizar.getRange(usuario.rowIndex, 13).setValue(agoraTexto);
    sheetUsuarioAtualizar.getRange(usuario.rowIndex, 15).setValue(agoraTexto);

    authRegistrarLogAcesso_(row[0], login, "LOGIN", "", true, "Login realizado com sucesso. Sessoes anteriores encerradas: " + sessoesEncerradas + ".", userAgent);

    return {
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
      token: dadosRetorno.token,
      expiraEm: dadosRetorno.expiraEm,
      usuario: dadosRetorno.usuario,
      permissoes: dadosRetorno.permissoes,
      codigoAcesso: authCriarCodigoLogin_(dadosRetorno)
    };

  } catch (erro) {
    console.error("Erro ao realizar login:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao realizar login: " + erro.toString()
    };
  }
}

function authBuscarSessaoPorToken_(token) {
  var sheet = authObterSheet_(AUTH_ABAS_.SESSAO);
  var ultimaLinha = sheet.getLastRow();
  var mapa = authMapaCabecalho_(sheet);
  var ultimaColuna = sheet.getLastColumn();
  var colunaToken = authColunaPorNomes_(mapa, ["TOKEN_HASH"], 3);
  var tokenHash = authHashToken_(token);

  if (ultimaLinha < 2 || !token) return null;

  var celulaToken = sheet
    .getRange(2, colunaToken, ultimaLinha - 1, 1)
    .createTextFinder(tokenHash)
    .matchEntireCell(true)
    .findNext();

  if (celulaToken) {
    var rowIndex = celulaToken.getRow();
    return {
      rowIndex: rowIndex,
      values: sheet.getRange(rowIndex, 1, 1, ultimaColuna).getValues()[0],
      mapa: mapa
    };
  }

  return null;
}

function consumirCodigoLogin(codigo) {
  try {
    codigo = String(codigo || "").trim();
    if (!codigo) {
      return {
        sucesso: false,
        mensagem: "Codigo de acesso nao informado."
      };
    }

    var cache = CacheService.getScriptCache();
    var chave = authChaveCodigoLogin_(codigo);
    var conteudo = cache.get(chave);

    if (!conteudo) {
      return {
        sucesso: false,
        mensagem: "Codigo de acesso expirado ou invalido."
      };
    }

    cache.remove(chave);

    var payload = JSON.parse(conteudo);
    return {
      sucesso: true,
      token: payload.token || "",
      expiraEm: payload.expiraEm || "",
      usuario: payload.usuario || null,
      permissoes: payload.permissoes || {}
    };

  } catch (erro) {
    console.error("Erro ao consumir codigo de login:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao consumir codigo de login: " + erro.toString()
    };
  }
}

function authBuscarUsuarioPorId_(idUsuario) {
  var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
  var ultimaLinha = sheet.getLastRow();

  if (ultimaLinha < 2) return null;

  var celula = sheet.getRange(2, 1, ultimaLinha - 1, 1)
    .createTextFinder(String(idUsuario || "").trim())
    .matchEntireCell(true)
    .findNext();

  if (celula) {
    var rowIndex = celula.getRow();
    var row = sheet.getRange(rowIndex, 1, 1, 18).getValues()[0];
    if (authAtivo_(row[17])) {
      return { rowIndex: rowIndex, values: row };
    }
  }

  return null;
}

function authBuscarNomeClienteSistema_(idClienteSistema) {
  var idBusca = String(idClienteSistema || "").trim();
  if (!idBusca) return "";

  try {
    var sheet = authObterSheet_(AUTH_ABAS_.CLIENTE_SISTEMA);
    var ultimaLinha = sheet.getLastRow();

    if (ultimaLinha < 2) return "";

    var celula = sheet.getRange(2, 1, ultimaLinha - 1, 1)
      .createTextFinder(idBusca)
      .matchEntireCell(true)
      .findNext();

    if (celula) {
      return String(sheet.getRange(celula.getRow(), 2).getDisplayValue() || "").trim();
    }

    return "";
  } catch (erro) {
    console.warn("Nao foi possivel buscar o cliente do sistema:", erro);
    return "";
  }
}

function authMapPaginas_() {
  var sheet = authObterSheet_(AUTH_ABAS_.PAGINA);
  var ultimaLinha = sheet.getLastRow();
  var mapaPorId = {};
  var mapaPorKey = {};

  if (ultimaLinha < 2) {
    return {
      porId: mapaPorId,
      porKey: mapaPorKey
    };
  }

  var dados = sheet.getRange(2, 1, ultimaLinha - 1, 9).getValues();

  dados.forEach(function(row) {
    if (!authAtivo_(row[8])) return;

    var pagina = {
      idPagina: String(row[0] || "").trim(),
      pageKey: String(row[1] || "").trim(),
      nomeExibicao: String(row[2] || "").trim(),
      modulo: String(row[3] || "").trim(),
      urlPage: String(row[4] || "").trim(),
      icone: String(row[5] || "").trim(),
      ordem: Number(row[6] || 0),
      exigeLogin: String(row[7] || "").trim().toUpperCase()
    };

    if (pagina.idPagina) mapaPorId[pagina.idPagina] = pagina;
    if (pagina.pageKey) mapaPorKey[pagina.pageKey] = pagina;
  });

  return {
    porId: mapaPorId,
    porKey: mapaPorKey
  };
}

function authPermissaoVazia_(idPagina) {
  return {
    idPagina: String(idPagina || "").trim(),
    podeAcessar: "N",
    podeCadastrar: "N",
    podeEditar: "N",
    podeExcluir: "N",
    podeExportar: "N",
    podeGerenciar: "N"
  };
}

function authPermissaoDeLinha_(row) {
  return {
    idPagina: String(row[2] || "").trim(),
    podeAcessar: authSim_(row[3]) ? "S" : "N",
    podeCadastrar: authSim_(row[4]) ? "S" : "N",
    podeEditar: authSim_(row[5]) ? "S" : "N",
    podeExcluir: authSim_(row[6]) ? "S" : "N",
    podeExportar: authSim_(row[7]) ? "S" : "N",
    podeGerenciar: authSim_(row[8]) ? "S" : "N"
  };
}

function buscarPermissoesUsuario_(idUsuario) {
  var permissoesCache = authLerPermissoesUsuarioCache_(idUsuario);
  if (permissoesCache) return permissoesCache;

  var usuario = authBuscarUsuarioPorId_(idUsuario);
  if (!usuario) return {};

  var rowUsuario = usuario.values;
  var idPerfil = String(rowUsuario[8] || "").trim();
  var nivel = String(rowUsuario[7] || "").trim().toUpperCase();
  var paginas = authMapPaginas_();
  var mapa = {};
  var possuiPermissaoExplicita = false;

  Object.keys(paginas.porId).forEach(function(idPagina) {
    mapa[idPagina] = authPermissaoVazia_(idPagina);
  });

  if (idPerfil) {
    var sheetPerfilPerm = authObterSheet_(AUTH_ABAS_.PERFIL_PERMISSAO);
    var ultimaPerfilPerm = sheetPerfilPerm.getLastRow();

    if (ultimaPerfilPerm >= 2) {
      var perfilPerms = sheetPerfilPerm.getRange(2, 1, ultimaPerfilPerm - 1, 12).getValues();

      perfilPerms.forEach(function(row) {
        if (String(row[1]) !== String(idPerfil)) return;
        if (!authAtivo_(row[11])) return;

        var permissao = authPermissaoDeLinha_(row);
        mapa[permissao.idPagina] = permissao;
        possuiPermissaoExplicita = true;
      });
    }
  }

  var sheetUserPerm = authObterSheet_(AUTH_ABAS_.USUARIO_PERMISSAO);
  var ultimaUserPerm = sheetUserPerm.getLastRow();

  if (ultimaUserPerm >= 2) {
    var userPerms = sheetUserPerm.getRange(2, 1, ultimaUserPerm - 1, 12).getValues();

    userPerms.forEach(function(row) {
      if (String(row[1]) !== String(idUsuario)) return;
      if (!authAtivo_(row[11])) return;

      var permissao = authPermissaoDeLinha_(row);
      mapa[permissao.idPagina] = permissao;
      possuiPermissaoExplicita = true;
    });
  }

  if (nivel === "MASTER" && !possuiPermissaoExplicita) {
    Object.keys(mapa).forEach(function(idPagina) {
      mapa[idPagina] = {
        idPagina: idPagina,
        podeAcessar: "S",
        podeCadastrar: "S",
        podeEditar: "S",
        podeExcluir: "S",
        podeExportar: "S",
        podeGerenciar: "S"
      };
    });
  }

  var retorno = {};

  Object.keys(mapa).forEach(function(idPagina) {
    var pagina = paginas.porId[idPagina];
    if (!pagina) return;

    retorno[pagina.pageKey] = Object.assign({}, mapa[idPagina], {
      pageKey: pagina.pageKey,
      nomeExibicao: pagina.nomeExibicao,
      modulo: pagina.modulo,
      urlPage: pagina.urlPage,
      icone: pagina.icone,
      ordem: pagina.ordem
    });
  });

  authSalvarPermissoesUsuarioCache_(idUsuario, retorno);
  return retorno;
}

function validarSessao(token, pageKey, idDispositivo) {
  try {
    if (authPaginaPublica_(pageKey)) {
      return {
        sucesso: true,
        autenticado: false,
        autorizado: true,
        paginaPublica: true,
        usuario: null,
        permissoes: {}
      };
    }

    if (!token) {
      return {
        sucesso: false,
        autenticado: false,
        mensagem: "Sessao nao informada."
      };
    }

    var contextoCache = authLerContextoSessaoCache_(token, idDispositivo);
    if (contextoCache) {
      return authRespostaContextoSessao_(contextoCache, pageKey);
    }

    var sessao = authBuscarSessaoPorToken_(token);
    if (!sessao) {
      return {
        sucesso: false,
        autenticado: false,
        mensagem: "Sessao invalida."
      };
    }

    var rowSessao = sessao.values;
    var mapaSessao = sessao.mapa || {};
    var statusSessao = String(authValorPorNomes_(rowSessao, mapaSessao, ["STATUS", "STATUS_ATIVACAO", "STATUS_ATIVAÇÃO"], 7) || "").trim().toUpperCase();
    var expiraEm = authParseDataHora_(authValorPorNomes_(rowSessao, mapaSessao, ["EXPIRA_EM"], 4));
    var idDispositivoSessao = authNormalizarIdDispositivo_(authValorPorNomes_(rowSessao, mapaSessao, ["ID_DISPOSITIVO", "CHAVE_DISPOSITIVO"], -1));
    var idDispositivoAtual = authNormalizarIdDispositivo_(idDispositivo);
    var agora = new Date();

    if (statusSessao !== "ATIVA" || !expiraEm || expiraEm.getTime() <= agora.getTime()) {
      authSetCelulaPorNomes_(authObterSheet_(AUTH_ABAS_.SESSAO), sessao.rowIndex, mapaSessao, ["STATUS", "STATUS_ATIVACAO", "STATUS_ATIVAÇÃO"], "EXPIRADA", 8);
      return {
        sucesso: false,
        autenticado: false,
        mensagem: "Sessao expirada."
      };
    }

    if (idDispositivoSessao && idDispositivoAtual && idDispositivoSessao !== idDispositivoAtual) {
      authSetCelulaPorNomes_(authObterSheet_(AUTH_ABAS_.SESSAO), sessao.rowIndex, mapaSessao, ["STATUS", "STATUS_ATIVACAO", "STATUS_ATIVAÇÃO"], "DISPOSITIVO_INVALIDO", 8);
      return {
        sucesso: false,
        autenticado: false,
        mensagem: "Sessao invalida para este dispositivo."
      };
    }

    if (!idDispositivoSessao && idDispositivoAtual) {
      authSetCelulaPorNomes_(authObterSheet_(AUTH_ABAS_.SESSAO), sessao.rowIndex, mapaSessao, ["ID_DISPOSITIVO", "CHAVE_DISPOSITIVO"], idDispositivoAtual, 0);
    }

    var usuario = authBuscarUsuarioPorId_(authValorPorNomes_(rowSessao, mapaSessao, ["ID_USUARIO"], 1));
    if (!usuario) {
      return {
        sucesso: false,
        autenticado: false,
        mensagem: "Usuario da sessao nao encontrado ou inativo."
      };
    }

    var rowUsuario = usuario.values;
    var permissoes = buscarPermissoesUsuario_(rowUsuario[0]);
    var nomeClienteSistema = authBuscarNomeClienteSistema_(rowUsuario[1]);
    var nivelUsuarioSessao = String(rowUsuario[7] || "").trim().toUpperCase();

    if (nivelUsuarioSessao === "MASTER") {
      permissoes.Controle_Usuarios = Object.assign({}, permissoes.Controle_Usuarios || {}, {
        pageKey: "Controle_Usuarios",
        podeAcessar: "S",
        podeCadastrar: "S",
        podeEditar: "S",
        podeExcluir: "S",
        podeExportar: "S",
        podeGerenciar: "S"
      });
    }

    authSetCelulaPorNomes_(authObterSheet_(AUTH_ABAS_.SESSAO), sessao.rowIndex, mapaSessao, ["ULTIMA_ATIVIDADE", "ULTIMA_ATIVIDADE_EM", "ULTIMO_ACESSO", "EDITADO_EM"], authDataHoraAtual_(), 6);

    var contexto = {
      expiraTimestamp: expiraEm.getTime(),
      idDispositivo: idDispositivoSessao || idDispositivoAtual,
      usuario: {
        idUsuario: rowUsuario[0],
        idClienteSistema: rowUsuario[1],
        nomeCliente: nomeClienteSistema,
        nome: rowUsuario[2],
        email: rowUsuario[3],
        login: rowUsuario[4],
        nivelUsuario: rowUsuario[7],
        idPerfil: rowUsuario[8],
        trocarSenhaProximoLogin: rowUsuario[9]
      },
      permissoes: permissoes
    };

    authSalvarContextoSessaoCache_(token, contexto);
    return authRespostaContextoSessao_(contexto, pageKey);

  } catch (erro) {
    console.error("Erro ao validar sessao:", erro);
    return {
      sucesso: false,
      autenticado: false,
      autorizado: false,
      mensagem: "Erro ao validar sessao: " + erro.toString()
    };
  }
}

function usuarioTemPermissaoAcao(token, pageKey, acao) {
  var sessao = validarSessao(token, pageKey);
  if (!sessao || !sessao.autenticado || !sessao.autorizado) return false;

  var permissao = sessao.permissoes && sessao.permissoes[pageKey];
  if (!permissao) return false;

  var acaoNormalizada = String(acao || "").trim().toUpperCase();

  if (acaoNormalizada === "ACESSAR") return permissao.podeAcessar === "S";
  if (acaoNormalizada === "CADASTRAR") return permissao.podeCadastrar === "S";
  if (acaoNormalizada === "EDITAR") return permissao.podeEditar === "S";
  if (acaoNormalizada === "EXCLUIR") return permissao.podeExcluir === "S";
  if (acaoNormalizada === "EXPORTAR") return permissao.podeExportar === "S";
  if (acaoNormalizada === "GERENCIAR") return permissao.podeGerenciar === "S";

  return false;
}

function authRespostaAcessoNegado_(acao) {
  return {
    sucesso: false,
    autorizado: false,
    mensagem: "Voce nao possui permissao para " + String(acao || "executar esta acao").toLowerCase() + "."
  };
}

function authExtrairTokenArgumentos_(args) {
  if (!args || !args.length) return "";

  var ultimo = args[args.length - 1];

  if (typeof ultimo === "string") {
    return ultimo;
  }

  if (ultimo && typeof ultimo === "object") {
    return ultimo.authToken || ultimo.tokenSessao || ultimo.token || "";
  }

  return "";
}

function validarPermissaoOuFalhar(token, pageKey, acao) {
  if (!usuarioTemPermissaoAcao(token, pageKey, acao)) {
    return authRespostaAcessoNegado_(acao);
  }

  return {
    sucesso: true,
    autorizado: true
  };
}

function authValidarAcaoPorArgumentos_(args, pageKey, acao) {
  return validarPermissaoOuFalhar(authExtrairTokenArgumentos_(args), pageKey, acao);
}

function logoutUsuario(token) {
  try {
    authRemoverCacheSessao_(token);
    var sessao = authBuscarSessaoPorToken_(token);
    if (!sessao) {
      return {
        sucesso: true,
        mensagem: "Sessao ja encerrada."
      };
    }

    var idUsuario = authValorPorNomes_(sessao.values, sessao.mapa || {}, ["ID_USUARIO"], 1);
    authSetCelulaPorNomes_(authObterSheet_(AUTH_ABAS_.SESSAO), sessao.rowIndex, sessao.mapa || {}, ["STATUS", "STATUS_ATIVACAO", "STATUS_ATIVAÇÃO"], "LOGOUT", 8);
    authRegistrarLogAcesso_(idUsuario, "", "LOGOUT", "", true, "Logout realizado.");

    return {
      sucesso: true,
      mensagem: "Logout realizado com sucesso."
    };

  } catch (erro) {
    console.error("Erro ao realizar logout:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao realizar logout: " + erro.toString()
    };
  }
}
