// ==================================================================================================================================================
// GESTAO DE ACESSOS - PERFIS E USUARIOS
// ==================================================================================================================================================

function gestaoAcessosNivel_(valor) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function gestaoAcessosValidarOperador_(token) {
  var sessao = validarSessao(token);

  if (!sessao || !sessao.autenticado || !sessao.autorizado) {
    return {
      sucesso: false,
      autorizado: false,
      mensagem: "Sessao invalida ou expirada."
    };
  }

  var nivel = gestaoAcessosNivel_(sessao.usuario && sessao.usuario.nivelUsuario);

  if (nivel !== "MASTER" && nivel !== "ADMIN") {
    return {
      sucesso: false,
      autorizado: false,
      mensagem: "Voce nao possui permissao para gerenciar acessos."
    };
  }

  return {
    sucesso: true,
    autorizado: true,
    usuario: sessao.usuario,
    nivel: nivel
  };
}

function gestaoAcessosUsuarioEditavel_(operador, usuarioAlvo) {
  var nivelOperador = gestaoAcessosNivel_(operador && operador.nivel);
  var nivelAlvo = gestaoAcessosNivel_(usuarioAlvo && usuarioAlvo.nivelUsuario);

  if (nivelOperador === "MASTER") return true;
  if (nivelOperador === "ADMIN") return nivelAlvo !== "MASTER" && nivelAlvo !== "ADMIN";

  return false;
}

function gestaoAcessosPerfilEditavel_(operador, perfilAlvo) {
  var nivelOperador = gestaoAcessosNivel_(operador && operador.nivel);
  var nomePerfil = gestaoAcessosNivel_(perfilAlvo && (perfilAlvo.nomePerfil || perfilAlvo.nome));

  if (nivelOperador === "MASTER") return true;
  if (nivelOperador === "ADMIN") return nomePerfil !== "MASTER" && nomePerfil !== "ADMIN";

  return false;
}

function gestaoAcessosBuscarUsuarios_() {
  var sheet = authObterSheet_(AUTH_ABAS_.USUARIO);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return [];

  return sheet.getRange(2, 1, ultimaLinha - 1, 18).getValues()
    .filter(function(row) {
      return authAtivo_(row[17]);
    })
    .map(function(row) {
      return {
        idUsuario: String(row[0] || "").trim(),
        nome: String(row[2] || "").trim(),
        email: String(row[3] || "").trim(),
        login: String(row[4] || "").trim(),
        nivelUsuario: String(row[7] || "").trim(),
        idPerfil: String(row[8] || "").trim()
      };
    })
    .filter(function(usuario) {
      return usuario.idUsuario && usuario.nome;
    })
    .sort(function(a, b) {
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
}

function gestaoAcessosBuscarPerfis_() {
  var sheet = authObterSheet_(AUTH_ABAS_.PERFIL);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return [];

  return sheet.getRange(2, 1, ultimaLinha - 1, 8).getValues()
    .filter(function(row) {
      return authAtivo_(row[7]);
    })
    .map(function(row) {
      return {
        idPerfil: String(row[0] || "").trim(),
        nome: String(row[2] || "").trim(),
        nomePerfil: String(row[2] || "").trim()
      };
    })
    .filter(function(perfil) {
      return perfil.idPerfil && perfil.nomePerfil;
    })
    .sort(function(a, b) {
      return a.nomePerfil.localeCompare(b.nomePerfil, "pt-BR");
    });
}

function gestaoAcessosBuscarPaginas_() {
  var paginas = authMapPaginas_();

  return Object.keys(paginas.porId).map(function(idPagina) {
    var pagina = paginas.porId[idPagina];
    return {
      idPagina: pagina.idPagina,
      pageKey: pagina.pageKey,
      nomeExibicao: pagina.nomeExibicao,
      modulo: pagina.modulo,
      ordem: pagina.ordem
    };
  }).sort(function(a, b) {
    var modulo = String(a.modulo || "").localeCompare(String(b.modulo || ""), "pt-BR");
    if (modulo !== 0) return modulo;
    return Number(a.ordem || 0) - Number(b.ordem || 0);
  });
}

function gestaoAcessosBuscarPermissoes_(nomeAba, colunaEntidadeFallback) {
  var sheet = authObterSheet_(nomeAba);
  var ultimaLinha = sheet.getLastRow();
  var retorno = {};

  if (ultimaLinha < 2) return retorno;

  var dados = sheet.getRange(2, 1, ultimaLinha - 1, 12).getValues();

  dados.forEach(function(row) {
    if (!authAtivo_(row[11])) return;

    var idEntidade = String(row[colunaEntidadeFallback - 1] || "").trim();
    var permissao = authPermissaoDeLinha_(row);

    if (!idEntidade || !permissao.idPagina) return;

    if (!retorno[idEntidade]) retorno[idEntidade] = {};
    retorno[idEntidade][permissao.idPagina] = permissao;
  });

  return retorno;
}

function buscarDadosGestaoAcessos() {
  try {
    var token = authExtrairTokenArgumentos_(arguments);
    var operador = gestaoAcessosValidarOperador_(token);

    if (!operador.sucesso) return operador;

    return {
      sucesso: true,
      usuarioAtual: operador.usuario,
      usuarios: gestaoAcessosBuscarUsuarios_(),
      perfis: gestaoAcessosBuscarPerfis_(),
      paginas: gestaoAcessosBuscarPaginas_(),
      permissoesPerfil: gestaoAcessosBuscarPermissoes_(AUTH_ABAS_.PERFIL_PERMISSAO, 2),
      permissoesUsuario: gestaoAcessosBuscarPermissoes_(AUTH_ABAS_.USUARIO_PERMISSAO, 2)
    };

  } catch (erro) {
    console.error("Erro ao buscar dados da gestao de acessos:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao buscar dados da gestao de acessos: " + erro.toString()
    };
  }
}

function gestaoAcessosNormalizarPermissao_(permissao) {
  permissao = permissao || {};

  function sn(valor) {
    return String(valor || "").trim().toUpperCase() === "S" ? "S" : "N";
  }

  return {
    idPagina: String(permissao.idPagina || "").trim(),
    podeAcessar: sn(permissao.podeAcessar),
    podeCadastrar: sn(permissao.podeCadastrar),
    podeEditar: sn(permissao.podeEditar),
    podeExcluir: sn(permissao.podeExcluir),
    podeExportar: sn(permissao.podeExportar),
    podeGerenciar: sn(permissao.podeGerenciar)
  };
}

function gestaoAcessosEncontrarUsuario_(idUsuario) {
  var usuarios = gestaoAcessosBuscarUsuarios_();

  for (var i = 0; i < usuarios.length; i++) {
    if (String(usuarios[i].idUsuario) === String(idUsuario)) return usuarios[i];
  }

  return null;
}

function gestaoAcessosEncontrarPerfil_(idPerfil) {
  var perfis = gestaoAcessosBuscarPerfis_();

  for (var i = 0; i < perfis.length; i++) {
    if (String(perfis[i].idPerfil) === String(idPerfil)) return perfis[i];
  }

  return null;
}

function gestaoAcessosUpsertPermissao_(sheet, idEntidade, permissao, tipoEntidade, usuarioEditor) {
  var ultimaLinha = sheet.getLastRow();
  var dados = ultimaLinha >= 2 ? sheet.getRange(2, 1, ultimaLinha - 1, 12).getValues() : [];
  var rowIndex = 0;

  for (var i = 0; i < dados.length; i++) {
    if (String(dados[i][1]) === String(idEntidade) && String(dados[i][2]) === String(permissao.idPagina)) {
      rowIndex = i + 2;
      break;
    }
  }

  var agora = authDataHoraAtual_();
  var valoresPermissao = [
    idEntidade,
    permissao.idPagina,
    permissao.podeAcessar,
    permissao.podeCadastrar,
    permissao.podeEditar,
    permissao.podeExcluir,
    permissao.podeExportar,
    permissao.podeGerenciar
  ];

  if (rowIndex) {
    sheet.getRange(rowIndex, 2, 1, 8).setValues([valoresPermissao]);
    sheet.getRange(rowIndex, 11).setValue(agora);
    sheet.getRange(rowIndex, 12).setValue("S");
    return;
  }

  var novoId = authGerarNovoId_(sheet, 1);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, 12).setValues([[
    novoId,
    idEntidade,
    permissao.idPagina,
    permissao.podeAcessar,
    permissao.podeCadastrar,
    permissao.podeEditar,
    permissao.podeExcluir,
    permissao.podeExportar,
    permissao.podeGerenciar,
    agora,
    agora,
    "S"
  ]]);
}

function salvarPermissoesGestaoAcessos(payload) {
  var inicioLog = Date.now();
  var operador = null;
  var escopoLog = "";
  var idEntidadeLog = "";

  try {
    var token = authExtrairTokenArgumentos_(arguments);
    operador = gestaoAcessosValidarOperador_(token);

    if (!operador.sucesso) return operador;

    payload = payload || {};

    var escopo = String(payload.escopo || "").trim().toLowerCase();
    var idEntidade = String(payload.idEntidade || "").trim();
    var permissoes = Array.isArray(payload.permissoes) ? payload.permissoes : [];
    escopoLog = escopo;
    idEntidadeLog = idEntidade;

    if (escopo !== "perfil" && escopo !== "usuario") {
      return {
        sucesso: false,
        mensagem: "Tipo de permissao invalido."
      };
    }

    if (!idEntidade) {
      return {
        sucesso: false,
        mensagem: "Registro de permissao nao informado."
      };
    }

    if (!permissoes.length) {
      return {
        sucesso: false,
        mensagem: "Nenhuma permissao informada para salvar."
      };
    }

    if (escopo === "usuario") {
      var usuarioAlvo = gestaoAcessosEncontrarUsuario_(idEntidade);
      if (!usuarioAlvo) {
        return {
          sucesso: false,
          mensagem: "Usuario nao encontrado ou inativo."
        };
      }

      if (!gestaoAcessosUsuarioEditavel_(operador, usuarioAlvo)) {
        return {
          sucesso: false,
          mensagem: "Voce nao possui permissao para editar os acessos deste usuario."
        };
      }

      var sheetUsuarioPerm = authObterSheet_(AUTH_ABAS_.USUARIO_PERMISSAO);
      permissoes.forEach(function(permissao) {
        var item = gestaoAcessosNormalizarPermissao_(permissao);
        if (item.idPagina) gestaoAcessosUpsertPermissao_(sheetUsuarioPerm, idEntidade, item, "usuario", operador.usuario);
      });
      authInvalidarCachesUsuario_(idEntidade);
    }

    if (escopo === "perfil") {
      var perfilAlvo = gestaoAcessosEncontrarPerfil_(idEntidade);
      if (!perfilAlvo) {
        return {
          sucesso: false,
          mensagem: "Perfil nao encontrado ou inativo."
        };
      }

      if (!gestaoAcessosPerfilEditavel_(operador, perfilAlvo)) {
        return {
          sucesso: false,
          mensagem: "Voce nao possui permissao para editar os acessos deste perfil."
        };
      }

      var sheetPerfilPerm = authObterSheet_(AUTH_ABAS_.PERFIL_PERMISSAO);
      permissoes.forEach(function(permissao) {
        var item = gestaoAcessosNormalizarPermissao_(permissao);
        if (item.idPagina) gestaoAcessosUpsertPermissao_(sheetPerfilPerm, idEntidade, item, "perfil", operador.usuario);
      });
      authInvalidarCachesPerfil_(idEntidade);
    }

    authRegistrarLogAcesso_(
      operador.usuario && operador.usuario.idUsuario,
      operador.usuario && operador.usuario.login,
      "GERENCIAR_ACESSOS",
      "Gestao_Acessos",
      true,
      "Permissoes atualizadas para " + escopo + " " + idEntidade + "."
    );

    registrarLogSistema_({
      usuario: operador.usuario,
      modulo: "ACESSOS",
      pagina: "Gestao_Acessos",
      acao: "ALTERAR_PERMISSAO",
      funcao: "salvarPermissoesGestaoAcessos",
      tabelaAfetada: escopo === "perfil" ? AUTH_ABAS_.PERFIL_PERMISSAO : AUTH_ABAS_.USUARIO_PERMISSAO,
      idRegistro: idEntidade,
      resumo: "Permissoes atualizadas para " + escopo + " " + idEntidade + ".",
      sucesso: true,
      tempoExecucaoMs: Date.now() - inicioLog,
      qtdLeituras: 4,
      qtdEscritas: permissoes.length,
      qtdLinhasLidas: permissoes.length,
      qtdLinhasEscritas: permissoes.length,
      origem: "BACKEND"
    });

    return {
      sucesso: true,
      mensagem: "Permissoes salvas com sucesso."
    };

  } catch (erro) {
    console.error("Erro ao salvar permissoes da gestao de acessos:", erro);
    registrarLogSistema_({
      usuario: operador && operador.usuario,
      modulo: "ACESSOS",
      pagina: "Gestao_Acessos",
      acao: "ALTERAR_PERMISSAO",
      funcao: "salvarPermissoesGestaoAcessos",
      tabelaAfetada: escopoLog === "perfil" ? AUTH_ABAS_.PERFIL_PERMISSAO : AUTH_ABAS_.USUARIO_PERMISSAO,
      idRegistro: idEntidadeLog,
      resumo: "Erro ao salvar permissoes.",
      sucesso: false,
      erro: erro.toString(),
      tempoExecucaoMs: Date.now() - inicioLog,
      origem: "BACKEND"
    });
    return {
      sucesso: false,
      mensagem: "Erro ao salvar permissoes: " + erro.toString()
    };
  }
}
