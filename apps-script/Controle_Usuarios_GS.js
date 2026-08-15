// ==================================================================================================================================================
// CONTROLE DE USUARIOS
// ==================================================================================================================================================

function controleUsuariosValidarMaster_() {
  var token = authExtrairTokenArgumentos_(arguments);
  var sessao = validarSessao(token);

  if (!sessao || !sessao.autenticado || !sessao.autorizado) {
    return {
      sucesso: false,
      autorizado: false,
      mensagem: "Sessao invalida ou expirada."
    };
  }

  var nivel = String(sessao.usuario && sessao.usuario.nivelUsuario || "").trim().toUpperCase();
  if (nivel !== "MASTER") {
    return {
      sucesso: false,
      autorizado: false,
      mensagem: "Apenas usuarios MASTER podem acessar o controle de usuarios."
    };
  }

  return {
    sucesso: true,
    autorizado: true,
    usuario: sessao.usuario
  };
}

function controleUsuariosMapaClientes_() {
  var sheet = authObterSheet_(AUTH_ABAS_.CLIENTE_SISTEMA);
  var ultimaLinha = sheet.getLastRow();
  var retorno = {};
  if (ultimaLinha < 2) return retorno;

  sheet.getRange(2, 1, ultimaLinha - 1, 2).getDisplayValues().forEach(function(row) {
    var id = String(row[0] || "").trim();
    var nome = String(row[1] || "").trim();
    if (id && nome) retorno[id] = nome;
  });
  return retorno;
}

function controleUsuariosListaClientes_() {
  var mapa = controleUsuariosMapaClientes_();
  return Object.keys(mapa).map(function(id) {
    return {
      id: id,
      nome: mapa[id]
    };
  }).sort(function(a, b) {
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

function controleUsuariosMapaPerfis_() {
  var sheet = authObterSheet_(AUTH_ABAS_.PERFIL);
  var ultimaLinha = sheet.getLastRow();
  var retorno = {};
  if (ultimaLinha < 2) return retorno;

  sheet.getRange(2, 1, ultimaLinha - 1, 8).getDisplayValues().forEach(function(row) {
    if (!authAtivo_(row[7])) return;
    var id = String(row[0] || "").trim();
    var nome = String(row[2] || "").trim();
    if (id && nome) retorno[id] = nome;
  });
  return retorno;
}

function controleUsuariosListaPerfis_() {
  var mapa = controleUsuariosMapaPerfis_();
  return Object.keys(mapa).map(function(id) {
    return {
      id: id,
      nome: mapa[id]
    };
  }).sort(function(a, b) {
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

function controleUsuariosNivelPorPerfil_(idPerfil) {
  var mapaPerfis = controleUsuariosMapaPerfis_();
  var nome = String(mapaPerfis[String(idPerfil || "").trim()] || "").trim().toUpperCase();
  if (nome === "MASTER") return "MASTER";
  if (nome === "ADMIN") return "ADMIN";
  return "COLABORADOR";
}

function controleUsuariosBuscarUsuarios_() {
  var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
  var ultimaLinha = sheet.getLastRow();
  var clientes = controleUsuariosMapaClientes_();
  var perfis = controleUsuariosMapaPerfis_();
  if (ultimaLinha < 2) return [];

  return sheet.getRange(2, 1, ultimaLinha - 1, 18).getDisplayValues().map(function(row) {
    var status = String(row[17] || "S").trim().toUpperCase() === "N" ? "N" : "S";
    return {
      idUsuario: String(row[0] || "").trim(),
      idClienteSistema: String(row[1] || "").trim(),
      nomeCliente: clientes[String(row[1] || "").trim()] || String(row[1] || "").trim(),
      nome: String(row[2] || "").trim(),
      email: String(row[3] || "").trim(),
      login: String(row[4] || "").trim(),
      nivelUsuario: String(row[7] || "").trim(),
      idPerfil: String(row[8] || "").trim(),
      nomePerfil: perfis[String(row[8] || "").trim()] || String(row[8] || "").trim(),
      criadoEm: String(row[13] || "").trim(),
      editadoEm: String(row[14] || "").trim(),
      statusAtivacao: status
    };
  }).filter(function(usuario) {
    return usuario.idUsuario && usuario.statusAtivacao !== "N";
  }).sort(function(a, b) {
    return String(b.editadoEm || b.criadoEm).localeCompare(String(a.editadoEm || a.criadoEm), "pt-BR");
  });
}

function controleUsuariosMontarDados_() {
  return {
    usuarios: controleUsuariosBuscarUsuarios_(),
    listas: {
      clientes: controleUsuariosListaClientes_(),
      perfis: controleUsuariosListaPerfis_()
    }
  };
}

function buscarDadosAtualizadosControleUsuarios() {
  var validacao = controleUsuariosValidarMaster_.apply(null, arguments);
  if (!validacao.sucesso) return validacao;

  var dados = controleUsuariosMontarDados_();
  return {
    sucesso: true,
    usuarios: dados.usuarios,
    listas: dados.listas
  };
}

function controleUsuariosPayload_(payload) {
  payload = payload || {};
  return {
    idUsuario: String(payload.idUsuario || "").trim(),
    idClienteSistema: String(payload.idClienteSistema || "").trim(),
    nome: String(payload.nome || "").trim().toUpperCase(),
    email: String(payload.email || "").trim().toLowerCase(),
    login: String(payload.login || payload.email || "").trim().toLowerCase(),
    idPerfil: String(payload.idPerfil || "").trim(),
    senha: String(payload.senha || "")
  };
}

function controleUsuariosEmailValido_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function controleUsuariosLoginExiste_(login, idIgnorar) {
  var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return false;

  var loginNormalizado = authNormalizarLogin_(login);
  var dados = sheet.getRange(2, 1, ultimaLinha - 1, 18).getValues();

  return dados.some(function(row) {
    if (String(row[0]) === String(idIgnorar || "")) return false;
    if (!authAtivo_(row[17])) return false;
    return authNormalizarLogin_(row[4]) === loginNormalizado || authNormalizarLogin_(row[3]) === loginNormalizado;
  });
}

function cadastrarUsuarioControle(payload) {
  var inicioLog = Date.now();
  var validacao = null;
  var novoId = "";

  try {
    validacao = controleUsuariosValidarMaster_.apply(null, arguments);
    if (!validacao.sucesso) return validacao;

    var dados = controleUsuariosPayload_(payload);
    if (!dados.nome || !dados.email || !dados.login || !dados.idClienteSistema || !dados.idPerfil || !dados.senha) {
      return { sucesso: false, mensagem: "Preencha todos os campos obrigatorios." };
    }

    if (!controleUsuariosEmailValido_(dados.email)) {
      return { sucesso: false, mensagem: "Informe um e-mail valido." };
    }

    if (dados.senha.length < 8) {
      return { sucesso: false, mensagem: "A senha deve ter pelo menos 8 caracteres." };
    }

    if (!controleUsuariosMapaClientes_()[dados.idClienteSistema]) {
      return { sucesso: false, mensagem: "Cliente do sistema invalido." };
    }

    if (!controleUsuariosMapaPerfis_()[dados.idPerfil]) {
      return { sucesso: false, mensagem: "Perfil invalido." };
    }

    if (controleUsuariosLoginExiste_(dados.login, "")) {
      return { sucesso: false, mensagem: "Ja existe usuario ativo com este login ou e-mail." };
    }

    var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
    novoId = authGerarNovoId_(sheet, 1);
    var agora = authDataHoraAtual_();
    var salt = authGerarSalt_();
    var senhaHash = authHashSenha_(dados.senha, salt);
    var nivel = controleUsuariosNivelPorPerfil_(dados.idPerfil);

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, 18).setValues([[
      novoId,
      dados.idClienteSistema,
      dados.nome,
      dados.email,
      dados.login,
      senhaHash,
      salt,
      nivel,
      dados.idPerfil,
      "N",
      0,
      "",
      "",
      agora,
      agora,
      validacao.usuario.idUsuario || "",
      validacao.usuario.idUsuario || "",
      "S"
    ]]);

    authRegistrarLogAcesso_(validacao.usuario.idUsuario, validacao.usuario.login, "CRIAR_USUARIO", "Controle_Usuarios", true, "Usuario criado: " + novoId);
    registrarLogSistema_({
      usuario: validacao.usuario,
      modulo: "USUARIOS",
      pagina: "Controle_Usuarios",
      acao: "CADASTRAR",
      funcao: "cadastrarUsuarioControle",
      tabelaAfetada: AUTH_ABAS_.USUARIO,
      idRegistro: novoId,
      resumo: "Usuario cadastrado: " + dados.login,
      sucesso: true,
      tempoExecucaoMs: Date.now() - inicioLog,
      qtdLeituras: 4,
      qtdEscritas: 1,
      qtdLinhasLidas: sheet.getLastRow(),
      qtdLinhasEscritas: 1,
      origem: "BACKEND"
    });
    return {
      sucesso: true,
      mensagem: "Usuario cadastrado com sucesso."
    };
  } catch (erro) {
    console.error("Erro ao cadastrar usuario:", erro);
    registrarLogSistema_({
      usuario: validacao && validacao.usuario,
      modulo: "USUARIOS",
      pagina: "Controle_Usuarios",
      acao: "CADASTRAR",
      funcao: "cadastrarUsuarioControle",
      tabelaAfetada: AUTH_ABAS_.USUARIO,
      idRegistro: novoId,
      resumo: "Erro ao cadastrar usuario.",
      sucesso: false,
      erro: erro.toString(),
      tempoExecucaoMs: Date.now() - inicioLog,
      origem: "BACKEND"
    });
    return {
      sucesso: false,
      mensagem: "Erro ao cadastrar usuario: " + erro.toString()
    };
  }
}

function editarUsuarioControle(payload) {
  var inicioLog = Date.now();
  var validacao = null;
  var idRegistroLog = "";

  try {
    validacao = controleUsuariosValidarMaster_.apply(null, arguments);
    if (!validacao.sucesso) return validacao;

    var dados = controleUsuariosPayload_(payload);
    idRegistroLog = dados.idUsuario;
    if (!dados.idUsuario || !dados.nome || !dados.email || !dados.login || !dados.idClienteSistema || !dados.idPerfil) {
      return { sucesso: false, mensagem: "Preencha todos os campos obrigatorios." };
    }

    if (!controleUsuariosEmailValido_(dados.email)) {
      return { sucesso: false, mensagem: "Informe um e-mail valido." };
    }

    if (dados.senha && dados.senha.length < 8) {
      return { sucesso: false, mensagem: "A nova senha deve ter pelo menos 8 caracteres." };
    }

    if (!controleUsuariosMapaClientes_()[dados.idClienteSistema]) {
      return { sucesso: false, mensagem: "Cliente do sistema invalido." };
    }

    if (!controleUsuariosMapaPerfis_()[dados.idPerfil]) {
      return { sucesso: false, mensagem: "Perfil invalido." };
    }

    if (controleUsuariosLoginExiste_(dados.login, dados.idUsuario)) {
      return { sucesso: false, mensagem: "Ja existe usuario ativo com este login ou e-mail." };
    }

    var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
    var ultimaLinha = sheet.getLastRow();
    if (ultimaLinha < 2) return { sucesso: false, mensagem: "Usuario nao encontrado." };

    var dadosSheet = sheet.getRange(2, 1, ultimaLinha - 1, 18).getValues();
    var rowIndex = 0;

    for (var i = 0; i < dadosSheet.length; i++) {
      if (String(dadosSheet[i][0]) === String(dados.idUsuario)) {
        rowIndex = i + 2;
        break;
      }
    }

    if (!rowIndex) return { sucesso: false, mensagem: "Usuario nao encontrado." };

    var nivel = controleUsuariosNivelPorPerfil_(dados.idPerfil);
    var agora = authDataHoraAtual_();
    sheet.getRange(rowIndex, 2, 1, 4).setValues([[dados.idClienteSistema, dados.nome, dados.email, dados.login]]);
    sheet.getRange(rowIndex, 8, 1, 2).setValues([[nivel, dados.idPerfil]]);
    sheet.getRange(rowIndex, 15).setValue(agora);
    sheet.getRange(rowIndex, 17).setValue(validacao.usuario.idUsuario || "");

    if (dados.senha) {
      var salt = authGerarSalt_();
      var senhaHash = authHashSenha_(dados.senha, salt);
      sheet.getRange(rowIndex, 6, 1, 2).setValues([[senhaHash, salt]]);
      sheet.getRange(rowIndex, 11).setValue(0);
      sheet.getRange(rowIndex, 12).setValue("");
    }

    authInvalidarCachesUsuario_(dados.idUsuario);

    authRegistrarLogAcesso_(validacao.usuario.idUsuario, validacao.usuario.login, "EDITAR_USUARIO", "Controle_Usuarios", true, "Usuario editado: " + dados.idUsuario);
    registrarLogSistema_({
      usuario: validacao.usuario,
      modulo: "USUARIOS",
      pagina: "Controle_Usuarios",
      acao: "EDITAR",
      funcao: "editarUsuarioControle",
      tabelaAfetada: AUTH_ABAS_.USUARIO,
      idRegistro: dados.idUsuario,
      resumo: "Usuario editado: " + dados.login,
      sucesso: true,
      tempoExecucaoMs: Date.now() - inicioLog,
      qtdLeituras: 4,
      qtdEscritas: dados.senha ? 6 : 3,
      qtdLinhasLidas: ultimaLinha,
      qtdLinhasEscritas: 1,
      origem: "BACKEND"
    });
    return {
      sucesso: true,
      mensagem: "Usuario editado com sucesso."
    };
  } catch (erro) {
    console.error("Erro ao editar usuario:", erro);
    registrarLogSistema_({
      usuario: validacao && validacao.usuario,
      modulo: "USUARIOS",
      pagina: "Controle_Usuarios",
      acao: "EDITAR",
      funcao: "editarUsuarioControle",
      tabelaAfetada: AUTH_ABAS_.USUARIO,
      idRegistro: idRegistroLog,
      resumo: "Erro ao editar usuario.",
      sucesso: false,
      erro: erro.toString(),
      tempoExecucaoMs: Date.now() - inicioLog,
      origem: "BACKEND"
    });
    return {
      sucesso: false,
      mensagem: "Erro ao editar usuario: " + erro.toString()
    };
  }
}

function inativarUsuarioControle(idUsuario) {
  var inicioLog = Date.now();
  var validacao = null;
  var idRegistroLog = String(idUsuario || "").trim();

  try {
    validacao = controleUsuariosValidarMaster_.apply(null, arguments);
    if (!validacao.sucesso) return validacao;

    idUsuario = String(idUsuario || "").trim();
    if (!idUsuario) return { sucesso: false, mensagem: "Usuario nao informado." };

    if (String(idUsuario) === String(validacao.usuario.idUsuario)) {
      return { sucesso: false, mensagem: "Voce nao pode inativar o proprio usuario logado." };
    }

    var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
    var ultimaLinha = sheet.getLastRow();
    if (ultimaLinha < 2) return { sucesso: false, mensagem: "Usuario nao encontrado." };

    var ids = sheet.getRange(2, 1, ultimaLinha - 1, 1).getDisplayValues();
    var rowIndex = 0;

    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === idUsuario) {
        rowIndex = i + 2;
        break;
      }
    }

    if (!rowIndex) return { sucesso: false, mensagem: "Usuario nao encontrado." };

    sheet.getRange(rowIndex, 15).setValue(authDataHoraAtual_());
    sheet.getRange(rowIndex, 17).setValue(validacao.usuario.idUsuario || "");
    sheet.getRange(rowIndex, 18).setValue("N");

    authInvalidarCachesUsuario_(idUsuario);

    authRegistrarLogAcesso_(validacao.usuario.idUsuario, validacao.usuario.login, "INATIVAR_USUARIO", "Controle_Usuarios", true, "Usuario inativado: " + idUsuario);
    registrarLogSistema_({
      usuario: validacao.usuario,
      modulo: "USUARIOS",
      pagina: "Controle_Usuarios",
      acao: "INATIVAR",
      funcao: "inativarUsuarioControle",
      tabelaAfetada: AUTH_ABAS_.USUARIO,
      idRegistro: idUsuario,
      resumo: "Usuario inativado.",
      sucesso: true,
      tempoExecucaoMs: Date.now() - inicioLog,
      qtdLeituras: 2,
      qtdEscritas: 3,
      qtdLinhasLidas: ultimaLinha,
      qtdLinhasEscritas: 1,
      origem: "BACKEND"
    });
    return {
      sucesso: true,
      mensagem: "Usuario inativado com sucesso."
    };
  } catch (erro) {
    console.error("Erro ao inativar usuario:", erro);
    registrarLogSistema_({
      usuario: validacao && validacao.usuario,
      modulo: "USUARIOS",
      pagina: "Controle_Usuarios",
      acao: "INATIVAR",
      funcao: "inativarUsuarioControle",
      tabelaAfetada: AUTH_ABAS_.USUARIO,
      idRegistro: idRegistroLog,
      resumo: "Erro ao inativar usuario.",
      sucesso: false,
      erro: erro.toString(),
      tempoExecucaoMs: Date.now() - inicioLog,
      origem: "BACKEND"
    });
    return {
      sucesso: false,
      mensagem: "Erro ao inativar usuario: " + erro.toString()
    };
  }
}

function inativarUsuariosControleEmLote(idsUsuarios) {
  var inicioLog = Date.now();
  var validacao = null;

  try {
    validacao = controleUsuariosValidarMaster_.apply(null, arguments);
    if (!validacao.sucesso) return validacao;

    idsUsuarios = Array.isArray(idsUsuarios) ? idsUsuarios : [idsUsuarios];
    idsUsuarios = idsUsuarios
      .map(function(id) { return String(id || "").trim(); })
      .filter(function(id) { return id !== ""; });

    if (!idsUsuarios.length) {
      return { sucesso: false, mensagem: "Nenhum usuário informado para inativação." };
    }

    var idUsuarioLogado = String(validacao.usuario.idUsuario || "");
    if (idsUsuarios.indexOf(idUsuarioLogado) >= 0) {
      return { sucesso: false, mensagem: "Você não pode inativar o próprio usuário logado." };
    }

    var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
    var ultimaLinha = sheet.getLastRow();
    if (ultimaLinha < 2) return { sucesso: false, mensagem: "Usuários não encontrados." };

    var mapaIds = {};
    idsUsuarios.forEach(function(id) {
      mapaIds[id] = true;
    });

    var ids = sheet.getRange(2, 1, ultimaLinha - 1, 1).getDisplayValues();
    var linhasParaInativar = [];
    var idsEncontrados = [];

    for (var i = 0; i < ids.length; i++) {
      var idLinha = String(ids[i][0]);
      if (mapaIds[idLinha]) {
        linhasParaInativar.push(i + 2);
        idsEncontrados.push(idLinha);
      }
    }

    if (!linhasParaInativar.length) {
      return { sucesso: false, mensagem: "Nenhum usuário selecionado foi encontrado." };
    }

    var agora = authDataHoraAtual_();
    linhasParaInativar.forEach(function(rowIndex) {
      sheet.getRange(rowIndex, 15).setValue(agora);
      sheet.getRange(rowIndex, 17).setValue(validacao.usuario.idUsuario || "");
      sheet.getRange(rowIndex, 18).setValue("N");
    });

    idsEncontrados.forEach(function(id) {
      authInvalidarCachesUsuario_(id);
    });

    authRegistrarLogAcesso_(validacao.usuario.idUsuario, validacao.usuario.login, "INATIVAR_USUARIOS_LOTE", "Controle_Usuarios", true, "Usuários inativados: " + idsEncontrados.join(", "));
    registrarLogSistema_({
      usuario: validacao.usuario,
      modulo: "USUARIOS",
      pagina: "Controle_Usuarios",
      acao: "INATIVAR_LOTE",
      funcao: "inativarUsuariosControleEmLote",
      tabelaAfetada: AUTH_ABAS_.USUARIO,
      idRegistro: idsEncontrados.join(","),
      resumo: "Usuários inativados em lote.",
      sucesso: true,
      tempoExecucaoMs: Date.now() - inicioLog,
      qtdLeituras: 2,
      qtdEscritas: linhasParaInativar.length * 3,
      qtdLinhasLidas: ultimaLinha,
      qtdLinhasEscritas: linhasParaInativar.length,
      origem: "BACKEND"
    });

    return {
      sucesso: true,
      mensagem: linhasParaInativar.length === 1 ? "Usuário inativado com sucesso." : "Usuários inativados com sucesso."
    };
  } catch (erro) {
    console.error("Erro ao inativar usuários:", erro);
    registrarLogSistema_({
      usuario: validacao && validacao.usuario,
      modulo: "USUARIOS",
      pagina: "Controle_Usuarios",
      acao: "INATIVAR_LOTE",
      funcao: "inativarUsuariosControleEmLote",
      tabelaAfetada: AUTH_ABAS_.USUARIO,
      resumo: "Erro ao inativar usuários em lote.",
      sucesso: false,
      erro: erro.toString(),
      tempoExecucaoMs: Date.now() - inicioLog,
      origem: "BACKEND"
    });
    return {
      sucesso: false,
      mensagem: "Erro ao inativar usuários: " + erro.toString()
    };
  }
}
