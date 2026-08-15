// ==================================================================================================================================================
// LOGS EXTERNOS - INSIGHT PAD
// ==================================================================================================================================================

var LOG_PLANILHA_ID_ = "1R5R6TFc0W7LynH81ut1rF15xdP_hELtuV5c9IX_Jhww";
var LOG_ABA_ACESSO_ = "LOG DE ACESSO";
var LOG_ABA_SISTEMA_ = "LOG DE SISTEMA";

var LOG_CABECALHO_ACESSO_ = [
  "ID_LOG",
  "ID_USUARIO",
  "LOGIN",
  "NOME_USUARIO",
  "ID_CLIENTE_SISTEMA",
  "NOME_CLIENTE_SISTEMA",
  "ACAO",
  "PAGE_KEY",
  "SUCESSO",
  "DETALHE",
  "IP_OU_ORIGEM",
  "USER_AGENT",
  "CRIADO_EM"
];

var LOG_CABECALHO_SISTEMA_ = [
  "ID_LOG",
  "ID_USUARIO",
  "NOME_USUARIO",
  "ID_CLIENTE_SISTEMA",
  "NOME_CLIENTE_SISTEMA",
  "MODULO",
  "PAGINA",
  "ACAO",
  "FUNCAO",
  "TABELA_AFETADA",
  "ID_REGISTRO",
  "RESUMO",
  "SUCESSO",
  "ERRO",
  "TEMPO_EXECUCAO_MS",
  "QTD_LEITURAS",
  "QTD_ESCRITAS",
  "QTD_LINHAS_LIDAS",
  "QTD_LINHAS_ESCRITAS",
  "ORIGEM",
  "CRIADO_EM"
];

function logDataHoraAtual_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
}

function logNormalizarCabecalho_(valor) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function logObterSheet_(nomeAba, cabecalhoPadrao) {
  var sheet = SpreadsheetApp.openById(LOG_PLANILHA_ID_).getSheetByName(nomeAba);
  if (!sheet) throw new Error("Aba de log nao encontrada: " + nomeAba);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, cabecalhoPadrao.length).setValues([cabecalhoPadrao]);
  }

  return sheet;
}

function logMapaCabecalho_(sheet) {
  var ultimaColuna = Math.max(sheet.getLastColumn(), 1);
  var cabecalhos = sheet.getRange(1, 1, 1, ultimaColuna).getDisplayValues()[0];
  var mapa = {};

  cabecalhos.forEach(function(nome, indice) {
    var chave = logNormalizarCabecalho_(nome);
    if (chave) mapa[chave] = indice + 1;
  });

  return mapa;
}

function logGerarNovoId_(sheet, mapa) {
  var colunaId = mapa.ID_LOG || 1;
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return 1;

  var maior = parseInt(sheet.getRange(ultimaLinha, colunaId).getValue(), 10);
  if (isNaN(maior)) maior = ultimaLinha - 1;

  return maior + 1;
}

function logParseData_(valor) {
  if (Object.prototype.toString.call(valor) === "[object Date]") {
    return isNaN(valor.getTime()) ? null : new Date(valor.getTime());
  }

  var texto = String(valor || "").trim();
  if (!texto) return null;

  var br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (br) {
    var dataBr = new Date(
      Number(br[3]),
      Number(br[2]) - 1,
      Number(br[1]),
      Number(br[4] || 0),
      Number(br[5] || 0),
      Number(br[6] || 0)
    );
    return isNaN(dataBr.getTime()) ? null : dataBr;
  }

  var data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
}

function logLimparAbaPorData_(nomeAba, cabecalhoPadrao, diasRetencao) {
  var sheet = logObterSheet_(nomeAba, cabecalhoPadrao);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return 0;

  var mapa = logMapaCabecalho_(sheet);
  var colunaData = logValorPorAliases_(mapa, ["CRIADO_EM", "DATA_HORA"]);
  if (!colunaData) return 0;

  var limite = new Date();
  limite.setDate(limite.getDate() - diasRetencao);

  var valores = sheet.getRange(2, colunaData, ultimaLinha - 1, 1).getValues();
  var linhasExcluir = [];

  valores.forEach(function(row, indice) {
    var dataLog = logParseData_(row[0]);
    if (dataLog && dataLog.getTime() < limite.getTime()) {
      linhasExcluir.push(indice + 2);
    }
  });

  return authExcluirLinhasAgrupadas_(sheet, linhasExcluir);
}

function limparLogsExternosAntigos_(diasRetencao) {
  diasRetencao = Number(diasRetencao || 100);
  if (!Number.isFinite(diasRetencao) || diasRetencao <= 0) diasRetencao = 100;

  return {
    acesso: logLimparAbaPorData_(LOG_ABA_ACESSO_, LOG_CABECALHO_ACESSO_, diasRetencao),
    sistema: logLimparAbaPorData_(LOG_ABA_SISTEMA_, LOG_CABECALHO_SISTEMA_, diasRetencao)
  };
}

function executarLimpezaAutomaticaSistema_() {
  var cache = CacheService.getScriptCache();
  var chaveCache = "INSIGHTPAD_LIMPEZA_AUTOMATICA_OK";

  if (cache.get(chaveCache)) return;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;

  try {
    cache.put(chaveCache, "S", 21600);

    try {
      authLimparSessoesAntigas_(30);
    } catch (erroSessao) {
      console.error("Erro ao limpar sessoes antigas:", erroSessao);
    }

    try {
      limparLogsExternosAntigos_(100);
    } catch (erroLog) {
      console.error("Erro ao limpar logs externos antigos:", erroLog);
    }
  } finally {
    lock.releaseLock();
  }
}

function executarManutencaoProgramadaSistema() {
  authLimparSessoesAntigas_(30);
  limparLogsExternosAntigos_(100);
}

function instalarTriggerManutencaoSistema() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "executarManutencaoProgramadaSistema") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger("executarManutencaoProgramadaSistema")
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  return "Trigger diario de manutencao instalado com sucesso.";
}

function logValorPorAliases_(mapa, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    var chave = logNormalizarCabecalho_(aliases[i]);
    if (mapa[chave]) return mapa[chave];
  }

  return 0;
}

function logSet_(linha, mapa, aliases, valor) {
  var coluna = logValorPorAliases_(mapa, aliases);
  if (coluna) linha[coluna - 1] = valor == null ? "" : valor;
}

function logUsuarioPorId_(idUsuario) {
  idUsuario = String(idUsuario || "").trim();
  if (!idUsuario) return {};

  try {
    var usuario = authBuscarUsuarioPorId_(idUsuario);
    if (!usuario) return {};

    var row = usuario.values;
    return {
      idUsuario: row[0] || "",
      idClienteSistema: row[1] || "",
      nomeClienteSistema: authBuscarNomeClienteSistema_(row[1]) || "",
      nome: row[2] || "",
      email: row[3] || "",
      login: row[4] || "",
      nivelUsuario: row[7] || "",
      idPerfil: row[8] || ""
    };
  } catch (erro) {
    console.error("Erro ao buscar usuario para log:", erro);
    return {};
  }
}

function registrarLogAcessoExterno_(dados) {
  dados = dados || {};

  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(5000);

    try {
      var sheet = logObterSheet_(LOG_ABA_ACESSO_, LOG_CABECALHO_ACESSO_);
      var mapa = logMapaCabecalho_(sheet);
      var usuario = dados.usuario || logUsuarioPorId_(dados.idUsuario);
      var totalColunas = Math.max(sheet.getLastColumn(), LOG_CABECALHO_ACESSO_.length);
      var linha = new Array(totalColunas).fill("");

      logSet_(linha, mapa, ["ID_LOG"], logGerarNovoId_(sheet, mapa));
      logSet_(linha, mapa, ["ID_USUARIO"], dados.idUsuario || usuario.idUsuario || "");
      logSet_(linha, mapa, ["LOGIN"], dados.login || usuario.login || "");
      logSet_(linha, mapa, ["NOME_USUARIO"], usuario.nome || "");
      logSet_(linha, mapa, ["ID_CLIENTE_SISTEMA"], usuario.idClienteSistema || "");
      logSet_(linha, mapa, ["NOME_CLIENTE_SISTEMA"], usuario.nomeClienteSistema || "");
      logSet_(linha, mapa, ["ACAO"], dados.acao || "");
      logSet_(linha, mapa, ["PAGE_KEY", "PAGINA"], dados.pageKey || "");
      logSet_(linha, mapa, ["SUCESSO"], dados.sucesso ? "S" : "N");
      logSet_(linha, mapa, ["DETALHE", "RESUMO"], dados.detalhe || "");
      logSet_(linha, mapa, ["IP_OU_ORIGEM", "ORIGEM"], dados.origem || "APPS_SCRIPT");
      logSet_(linha, mapa, ["USER_AGENT"], dados.userAgent || "");
      logSet_(linha, mapa, ["CRIADO_EM", "DATA_HORA"], dados.criadoEm || logDataHoraAtual_());

      sheet.getRange(sheet.getLastRow() + 1, 1, 1, totalColunas).setValues([linha]);
    } finally {
      lock.releaseLock();
    }
  } catch (erro) {
    console.error("Erro ao registrar log externo de acesso:", erro);
  }
}

function registrarLogSistema_(dados) {
  dados = dados || {};

  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(5000);

    try {
      var sheet = logObterSheet_(LOG_ABA_SISTEMA_, LOG_CABECALHO_SISTEMA_);
      var mapa = logMapaCabecalho_(sheet);
      var usuario = dados.usuario || logUsuarioPorId_(dados.idUsuario);
      var totalColunas = Math.max(sheet.getLastColumn(), LOG_CABECALHO_SISTEMA_.length);
      var linha = new Array(totalColunas).fill("");

      logSet_(linha, mapa, ["ID_LOG"], logGerarNovoId_(sheet, mapa));
      logSet_(linha, mapa, ["ID_USUARIO"], dados.idUsuario || usuario.idUsuario || "");
      logSet_(linha, mapa, ["NOME_USUARIO"], usuario.nome || dados.nomeUsuario || "");
      logSet_(linha, mapa, ["ID_CLIENTE_SISTEMA"], usuario.idClienteSistema || dados.idClienteSistema || "");
      logSet_(linha, mapa, ["NOME_CLIENTE_SISTEMA"], usuario.nomeClienteSistema || usuario.nomeCliente || dados.nomeClienteSistema || "");
      logSet_(linha, mapa, ["MODULO"], dados.modulo || "");
      logSet_(linha, mapa, ["PAGINA", "PAGE_KEY"], dados.pagina || dados.pageKey || "");
      logSet_(linha, mapa, ["ACAO"], dados.acao || "");
      logSet_(linha, mapa, ["FUNCAO"], dados.funcao || "");
      logSet_(linha, mapa, ["TABELA_AFETADA", "TABELA"], dados.tabelaAfetada || "");
      logSet_(linha, mapa, ["ID_REGISTRO"], dados.idRegistro || "");
      logSet_(linha, mapa, ["RESUMO", "DETALHE"], dados.resumo || "");
      logSet_(linha, mapa, ["SUCESSO"], dados.sucesso === false ? "N" : "S");
      logSet_(linha, mapa, ["ERRO"], dados.erro || "");
      logSet_(linha, mapa, ["TEMPO_EXECUCAO_MS", "TEMPO_MS"], dados.tempoExecucaoMs || 0);
      logSet_(linha, mapa, ["QTD_LEITURAS"], dados.qtdLeituras || 0);
      logSet_(linha, mapa, ["QTD_ESCRITAS"], dados.qtdEscritas || 0);
      logSet_(linha, mapa, ["QTD_LINHAS_LIDAS"], dados.qtdLinhasLidas || 0);
      logSet_(linha, mapa, ["QTD_LINHAS_ESCRITAS"], dados.qtdLinhasEscritas || 0);
      logSet_(linha, mapa, ["ORIGEM"], dados.origem || "BACKEND");
      logSet_(linha, mapa, ["CRIADO_EM", "DATA_HORA"], dados.criadoEm || logDataHoraAtual_());

      sheet.getRange(sheet.getLastRow() + 1, 1, 1, totalColunas).setValues([linha]);
    } finally {
      lock.releaseLock();
    }
  } catch (erro) {
    console.error("Erro ao registrar log de sistema:", erro);
  }
}

function logModuloPorPagina_(pagina) {
  pagina = String(pagina || "").trim();

  if (pagina.indexOf("Cadastro_") === 0 || pagina === "MenuCadastro") return "CADASTROS";
  if (pagina === "Estoque") return "ESTOQUE";
  if (pagina === "Caixa" || pagina === "Gestao_Vendas" || pagina === "MenuVendas") return "VENDAS";
  if (pagina === "MenuDashboard" || pagina.indexOf("Dashboard_") === 0) return "DASHBOARD";
  if (pagina === "Gestao_Acessos" || pagina === "Controle_Usuarios" || pagina === "Login") return "ACESSOS";
  if (pagina === "Menu") return "MENU";

  return "SISTEMA";
}

function registrarLogChamadaFrontend(payload) {
  try {
    payload = payload || {};

    var token = authExtrairTokenArgumentos_(arguments);
    var sessao = validarSessao(token);

    if (!sessao || !sessao.autenticado || !sessao.usuario) {
      return {
        sucesso: false,
        mensagem: "Sessao invalida para registro de log."
      };
    }

    var pagina = String(payload.pagina || "").trim();
    var funcao = String(payload.funcao || "").trim();
    var sucesso = String(payload.sucesso || "").trim().toUpperCase() !== "N";
    var erro = String(payload.erro || "").trim();
    var resumo = String(payload.resumo || "").trim();

    registrarLogSistema_({
      usuario: sessao.usuario,
      modulo: logModuloPorPagina_(pagina),
      pagina: pagina,
      acao: "EXECUTAR_FUNCAO",
      funcao: funcao,
      tabelaAfetada: "",
      idRegistro: "",
      resumo: resumo || ("Chamada executada pelo front: " + funcao),
      sucesso: sucesso,
      erro: erro,
      tempoExecucaoMs: Number(payload.tempoExecucaoMs || 0),
      qtdLeituras: "",
      qtdEscritas: "",
      qtdLinhasLidas: "",
      qtdLinhasEscritas: "",
      origem: "FRONTEND"
    });

    return {
      sucesso: true
    };
  } catch (erro) {
    console.error("Erro ao registrar chamada frontend:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao registrar chamada frontend: " + erro.toString()
    };
  }
}
