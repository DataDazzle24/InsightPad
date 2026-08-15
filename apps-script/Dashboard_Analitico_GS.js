// ===================================================================================================================================================
// BANCO ANALITICO DO DASHBOARD OPERACIONAL
// ===================================================================================================================================================

var ID_PLANILHA_DASHBOARD_ANALITICO = "1MuWcmLEMGm3UqaWFy2aTYszVHrdVM9cLWOz7ghuy4fI";

var DASH_ANALITICO_ABAS_ = {
  VENDAS_DIA: "DASH_VENDAS_DIA",
  VENDAS_PRODUTO_DIA: "DASH_VENDAS_PRODUTO_DIA",
  ESTOQUE_DIA: "DASH_ESTOQUE_DIA",
  ESTOQUE_PRODUTO_DIA: "DASH_ESTOQUE_PRODUTO_DIA",
  PENDENCIAS: "DASH_PENDENCIAS",
  CONTROLE: "DASH_CONTROLE"
};

var DASH_ANALITICO_HEADERS_ = {
  DASH_VENDAS_DIA: ["CHAVE", "DATA", "ID_FILIAL", "QTD_CARRINHOS", "FATURAMENTO", "CUSTO_TOTAL", "LUCRO", "QTD_ITENS", "ATUALIZADO_EM"],
  DASH_VENDAS_PRODUTO_DIA: ["CHAVE", "DATA", "ID_FILIAL", "ID_PRODUTO", "QTD_CARRINHOS", "QTD_VENDIDA", "FATURAMENTO_PRODUTO", "CUSTO_PRODUTO", "LUCRO_PRODUTO", "ATUALIZADO_EM"],
  DASH_ESTOQUE_DIA: ["CHAVE", "DATA", "ID_FILIAL", "TIPO_MOV", "QTD_MOVIMENTADA", "VALOR_TOTAL", "FRETE_TRANSPORTE", "OUTRAS_CUSTAS", "LUCRO_SAIDA_VENDA", "ATUALIZADO_EM"],
  DASH_ESTOQUE_PRODUTO_DIA: ["CHAVE", "DATA", "ID_FILIAL", "ID_PRODUTO", "TIPO_MOV", "QTD_MOVIMENTADA", "VALOR_TOTAL", "LUCRO_SAIDA_VENDA", "ATUALIZADO_EM"],
  DASH_PENDENCIAS: ["ID_PENDENCIA", "ORIGEM", "ID_ORIGEM", "ACAO", "STATUS", "TENTATIVAS", "MENSAGEM_ERRO", "CRIADO_EM", "PROCESSADO_EM"],
  DASH_CONTROLE: ["CHAVE", "VALOR", "ATUALIZADO_EM", "OBSERVACAO"]
};

function dashboardAnaliticoObterPlanilha_() {
  return SpreadsheetApp.openById(ID_PLANILHA_DASHBOARD_ANALITICO);
}

function dashboardAnaliticoObterAba_(nome) {
  var ss = dashboardAnaliticoObterPlanilha_();
  var sheet = ss.getSheetByName(nome);
  if (!sheet) sheet = ss.insertSheet(nome);

  var headers = DASH_ANALITICO_HEADERS_[nome];
  if (headers && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function dashboardAnaliticoAgora_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
}

function dashboardAnaliticoDataKey_(valor) {
  var data = dashboardOperacionalParseData_(valor);
  return data ? Utilities.formatDate(data, Session.getScriptTimeZone(), "yyyy-MM-dd") : "";
}

function dashboardAnaliticoNormalizarDataKey_(valor) {
  if (Object.prototype.toString.call(valor) === "[object Date]" && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  var texto = String(valor || "").trim();
  if (!texto) return "";

  var iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];

  var br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return br[3] + "-" + br[2] + "-" + br[1];

  return dashboardAnaliticoDataKey_(valor);
}

function dashboardAnaliticoDataLabel_(key) {
  key = dashboardAnaliticoNormalizarDataKey_(key);
  var partes = String(key || "").split("-");
  if (partes.length !== 3) return key || "";
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function dashboardAnaliticoTipoMov_(tipo) {
  var texto = String(tipo || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (texto.indexOf("ENTRADA") >= 0) return "ENTRADA";
  if (texto.indexOf("PERDA") >= 0) return "SAIDA PERDA";
  if (texto.indexOf("VENDA") >= 0) return "SAIDA VENDA";
  return String(tipo || "").trim().toUpperCase();
}

function dashboardAnaliticoLimparAba_(sheet, headers) {
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function dashboardAnaliticoEscreverLinhas_(sheet, rows, headers) {
  dashboardAnaliticoLimparAba_(sheet, headers);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function dashboardAnaliticoLerAba_(nome) {
  var sheet = dashboardAnaliticoObterAba_(nome);
  var last = sheet.getLastRow();
  var headers = DASH_ANALITICO_HEADERS_[nome] || [];
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, headers.length).getValues();
}

function dashboardAnaliticoNumero_(valor) {
  return dashboardOperacionalNumero_(valor);
}

function dashboardAnaliticoMontarBaseVendas_() {
  var ss = dashboardOperacionalObterPlanilhaFonte_();
  var dimensoes = dashboardOperacionalMapearDimensoes_();
  var mapaProdutos = dimensoes.mapaProdutos;
  var carrinhosRaw = dashboardOperacionalValores_(ss.getSheetByName("VENDA_CARRINHO"), 13);
  var produtosVendaRaw = dashboardOperacionalValores_(ss.getSheetByName("VENDA_PRODUTO"), 6);

  var mapaVendas = {};
  carrinhosRaw.forEach(function(row) {
    var status = String(row[12] || "S").trim().toUpperCase();
    var idCarrinho = String(row[0] || "").trim();
    if (!idCarrinho || status === "N") return;

    var dataKey = dashboardAnaliticoDataKey_(row[11]);
    var idFilial = String(row[10] || "").trim();
    if (!dataKey || !idFilial) return;

    mapaVendas[idCarrinho] = {
      idCarrinho: idCarrinho,
      data: dataKey,
      idFilial: idFilial,
      faturamento: dashboardAnaliticoNumero_(row[4]),
      custoTotal: 0,
      qtdItens: 0
    };
  });

  var itens = [];
  produtosVendaRaw.forEach(function(row) {
    var status = String(row[5] || "S").trim().toUpperCase();
    var idCarrinho = String(row[1] || "").trim();
    var idProduto = String(row[2] || "").trim();
    var venda = mapaVendas[idCarrinho];
    if (!idCarrinho || !idProduto || status === "N" || !venda) return;

    var produto = mapaProdutos[idProduto] || {};
    var qtd = dashboardAnaliticoNumero_(row[4]);
    var faturamentoProduto = dashboardAnaliticoNumero_(row[3]);
    var custoProduto = dashboardAnaliticoNumero_(produto.precoCusto) * qtd;

    venda.custoTotal += custoProduto;
    venda.qtdItens += qtd;

    itens.push({
      idCarrinho: idCarrinho,
      data: venda.data,
      idFilial: venda.idFilial,
      idProduto: idProduto,
      qtd: qtd,
      faturamentoProduto: faturamentoProduto,
      custoProduto: custoProduto
    });
  });

  return {
    vendas: Object.keys(mapaVendas).map(function(id) { return mapaVendas[id]; }),
    itens: itens
  };
}

function dashboardAnaliticoMontarBaseEstoque_() {
  var ss = dashboardOperacionalObterPlanilhaFonte_();
  var dimensoes = dashboardOperacionalMapearDimensoes_();
  var mapaProdutos = dimensoes.mapaProdutos;
  var movimentacoesRaw = dashboardOperacionalValores_(ss.getSheetByName("EST_MOVIMENTACOES"), 14);
  var nfsTabela = dashboardOperacionalTabelaComCabecalho_(ss.getSheetByName("EST_NFs"));
  var baseVendas = dashboardAnaliticoMontarBaseVendas_();

  var mapaVendas = {};
  baseVendas.vendas.forEach(function(venda) {
    mapaVendas[venda.idCarrinho] = venda;
  });

  var receitaProdutoVenda = {};
  baseVendas.itens.forEach(function(item) {
    receitaProdutoVenda[item.idCarrinho + "||" + item.idProduto] =
      (receitaProdutoVenda[item.idCarrinho + "||" + item.idProduto] || 0) + item.faturamentoProduto;
  });

  var idxNfId = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["ID_NF"]);
  var idxFrete = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["FRETE_TRANSPORTE", "FRETE"]);
  var idxSeguro = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["SEGURO"]);
  var idxIcms = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["ICMS"]);
  var idxIcmsSt = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["ICMS_ST", "ICMS ST"]);
  var idxIpi = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["IPI"]);
  var mapaNfs = {};

  nfsTabela.rows.forEach(function(row) {
    var idNf = String(row[idxNfId >= 0 ? idxNfId : 0] || "").trim();
    if (!idNf) return;

    var nf = {
      freteTransporte: dashboardAnaliticoNumero_(idxFrete >= 0 ? row[idxFrete] : row[4]),
      outrasCustas: dashboardAnaliticoNumero_(idxIcms >= 0 ? row[idxIcms] : row[6]) +
        dashboardAnaliticoNumero_(idxIcmsSt >= 0 ? row[idxIcmsSt] : row[7]) +
        dashboardAnaliticoNumero_(idxSeguro >= 0 ? row[idxSeguro] : row[5]) +
        dashboardAnaliticoNumero_(idxIpi >= 0 ? row[idxIpi] : row[8])
    };

    mapaNfs[idNf] = nf;
    mapaNfs[dashboardOperacionalIdCanonico_(idNf)] = nf;
  });

  var movimentos = [];
  movimentacoesRaw.forEach(function(row) {
    var status = String(row[13] || "S").trim().toUpperCase();
    var idMov = String(row[0] || "").trim();
    var idProduto = String(row[5] || "").trim();
    if (!idMov || !idProduto || status === "N") return;

    var dataKey = dashboardAnaliticoDataKey_(row[10]);
    var idFilial = String(row[9] || "").trim();
    var tipo = dashboardAnaliticoTipoMov_(row[2]);
    if (!dataKey || !idFilial || !tipo) return;

    var qtd = dashboardAnaliticoNumero_(row[6]);
    var valorTotal = qtd * dashboardAnaliticoNumero_(row[7]);
    var idVenda = String(row[4] || "").trim();
    var venda = mapaVendas[idVenda] || {};
    var receitaProduto = idVenda ? Number(receitaProdutoVenda[idVenda + "||" + idProduto] || 0) : 0;
    var lucroProdutoVenda = receitaProduto - valorTotal;
    var lucroCarrinho = idVenda && venda.idCarrinho ? Number(venda.faturamento || 0) - Number(venda.custoTotal || 0) : 0;
    var idNf = String(row[1] || "").trim();
    var nf = mapaNfs[idNf] || mapaNfs[dashboardOperacionalIdCanonico_(idNf)] || {};

    movimentos.push({
      idMov: idMov,
      data: dataKey,
      idFilial: idFilial,
      idProduto: idProduto,
      tipo: tipo,
      qtd: qtd,
      valorTotal: valorTotal,
      idVenda: idVenda,
      lucroProdutoVenda: lucroProdutoVenda,
      lucroCarrinho: lucroCarrinho,
      idNf: idNf,
      freteTransporte: Number(nf.freteTransporte || 0),
      outrasCustas: Number(nf.outrasCustas || 0)
    });
  });

  return { movimentos: movimentos, mapaProdutos: mapaProdutos };
}

function reconstruirDashboardAnaliticoInterno_() {
  try {
    var agora = dashboardAnaliticoAgora_();
    var baseVendas = dashboardAnaliticoMontarBaseVendas_();
    var vendasDia = new Map();
    var vendasProdutoDia = new Map();

    baseVendas.vendas.forEach(function(venda) {
      var chave = venda.data + "|" + venda.idFilial;
      if (!vendasDia.has(chave)) {
        vendasDia.set(chave, {
          chave: chave,
          data: venda.data,
          idFilial: venda.idFilial,
          qtdCarrinhos: 0,
          faturamento: 0,
          custoTotal: 0,
          lucro: 0,
          qtdItens: 0
        });
      }

      var item = vendasDia.get(chave);
      item.qtdCarrinhos += 1;
      item.faturamento += venda.faturamento;
      item.custoTotal += venda.custoTotal;
      item.lucro += venda.faturamento - venda.custoTotal;
      item.qtdItens += venda.qtdItens;
    });

    baseVendas.itens.forEach(function(itemVenda) {
      var chave = itemVenda.data + "|" + itemVenda.idFilial + "|" + itemVenda.idProduto;
      if (!vendasProdutoDia.has(chave)) {
        vendasProdutoDia.set(chave, {
          chave: chave,
          data: itemVenda.data,
          idFilial: itemVenda.idFilial,
          idProduto: itemVenda.idProduto,
          carrinhos: new Set(),
          qtdVendida: 0,
          faturamentoProduto: 0,
          custoProduto: 0,
          lucroProduto: 0
        });
      }

      var prod = vendasProdutoDia.get(chave);
      prod.carrinhos.add(String(itemVenda.idCarrinho));
      prod.qtdVendida += itemVenda.qtd;
      prod.faturamentoProduto += itemVenda.faturamentoProduto;
      prod.custoProduto += itemVenda.custoProduto;
      prod.lucroProduto += itemVenda.faturamentoProduto - itemVenda.custoProduto;
    });

    var baseEstoque = dashboardAnaliticoMontarBaseEstoque_();
    var estoqueDia = new Map();
    var estoqueProdutoDia = new Map();

    baseEstoque.movimentos.forEach(function(mov) {
      var chaveDia = mov.data + "|" + mov.idFilial + "|" + mov.tipo;
      if (!estoqueDia.has(chaveDia)) {
        estoqueDia.set(chaveDia, {
          chave: chaveDia,
          data: mov.data,
          idFilial: mov.idFilial,
          tipo: mov.tipo,
          qtd: 0,
          valorTotal: 0,
          frete: 0,
          outrasCustas: 0,
          lucroSaidaVenda: 0,
          nfsSomadas: new Set(),
          vendasSomadas: new Set()
        });
      }

      var dia = estoqueDia.get(chaveDia);
      dia.qtd += mov.qtd;
      dia.valorTotal += mov.valorTotal;

      if (mov.tipo === "ENTRADA" && mov.idNf && !dia.nfsSomadas.has(mov.idNf)) {
        dia.nfsSomadas.add(mov.idNf);
        dia.frete += mov.freteTransporte;
        dia.outrasCustas += mov.outrasCustas;
      }

      if (mov.tipo === "SAIDA VENDA" && mov.idVenda && !dia.vendasSomadas.has(mov.idVenda)) {
        dia.vendasSomadas.add(mov.idVenda);
        dia.lucroSaidaVenda += mov.lucroCarrinho;
      }

      var chaveProd = mov.data + "|" + mov.idFilial + "|" + mov.idProduto + "|" + mov.tipo;
      if (!estoqueProdutoDia.has(chaveProd)) {
        estoqueProdutoDia.set(chaveProd, {
          chave: chaveProd,
          data: mov.data,
          idFilial: mov.idFilial,
          idProduto: mov.idProduto,
          tipo: mov.tipo,
          qtd: 0,
          valorTotal: 0,
          lucroSaidaVenda: 0
        });
      }

      var prodEst = estoqueProdutoDia.get(chaveProd);
      prodEst.qtd += mov.qtd;
      prodEst.valorTotal += mov.valorTotal;
      if (mov.tipo === "SAIDA VENDA") prodEst.lucroSaidaVenda += mov.lucroProdutoVenda;
    });

    var rowsVendasDia = Array.from(vendasDia.values()).map(function(item) {
      return [item.chave, item.data, item.idFilial, item.qtdCarrinhos, item.faturamento, item.custoTotal, item.lucro, item.qtdItens, agora];
    });

    var rowsVendasProdutoDia = Array.from(vendasProdutoDia.values()).map(function(item) {
      return [item.chave, item.data, item.idFilial, item.idProduto, item.carrinhos.size, item.qtdVendida, item.faturamentoProduto, item.custoProduto, item.lucroProduto, agora];
    });

    var rowsEstoqueDia = Array.from(estoqueDia.values()).map(function(item) {
      return [item.chave, item.data, item.idFilial, item.tipo, item.qtd, item.valorTotal, item.frete, item.outrasCustas, item.lucroSaidaVenda, agora];
    });

    var rowsEstoqueProdutoDia = Array.from(estoqueProdutoDia.values()).map(function(item) {
      return [item.chave, item.data, item.idFilial, item.idProduto, item.tipo, item.qtd, item.valorTotal, item.lucroSaidaVenda, agora];
    });

    dashboardAnaliticoEscreverLinhas_(dashboardAnaliticoObterAba_(DASH_ANALITICO_ABAS_.VENDAS_DIA), rowsVendasDia, DASH_ANALITICO_HEADERS_.DASH_VENDAS_DIA);
    dashboardAnaliticoEscreverLinhas_(dashboardAnaliticoObterAba_(DASH_ANALITICO_ABAS_.VENDAS_PRODUTO_DIA), rowsVendasProdutoDia, DASH_ANALITICO_HEADERS_.DASH_VENDAS_PRODUTO_DIA);
    dashboardAnaliticoEscreverLinhas_(dashboardAnaliticoObterAba_(DASH_ANALITICO_ABAS_.ESTOQUE_DIA), rowsEstoqueDia, DASH_ANALITICO_HEADERS_.DASH_ESTOQUE_DIA);
    dashboardAnaliticoEscreverLinhas_(dashboardAnaliticoObterAba_(DASH_ANALITICO_ABAS_.ESTOQUE_PRODUTO_DIA), rowsEstoqueProdutoDia, DASH_ANALITICO_HEADERS_.DASH_ESTOQUE_PRODUTO_DIA);

    dashboardAnaliticoRegistrarControle_("ULTIMA_RECONSTRUCAO_GERAL", "OK", "Reconstrucao completa concluida.");

    return {
      sucesso: true,
      mensagem: "Banco analitico reconstruido com sucesso.",
      vendasDia: rowsVendasDia.length,
      vendasProdutoDia: rowsVendasProdutoDia.length,
      estoqueDia: rowsEstoqueDia.length,
      estoqueProdutoDia: rowsEstoqueProdutoDia.length
    };
  } catch (erro) {
    console.error("Erro ao reconstruir dashboard analitico:", erro);
    dashboardAnaliticoRegistrarPendencia_("SISTEMA", "RECONSTRUCAO", "RECONSTRUIR", erro.toString());
    return { sucesso: false, mensagem: "Erro ao reconstruir dashboard analitico: " + erro.toString() };
  }
}

function reconstruirDashboardAnalitico() {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Dashboard_Relatorios_Operacionais", "ACESSAR");
    if (!auth.sucesso) return auth;
    return reconstruirDashboardAnaliticoInterno_();
  } catch (erro) {
    console.error("Erro ao autenticar reconstrucao do dashboard analitico:", erro);
    return { sucesso: false, mensagem: "Erro ao reconstruir dashboard analitico: " + erro.toString() };
  }
}

function reconstruirDashboardAnaliticoManual() {
  var resultado = reconstruirDashboardAnaliticoInterno_();
  console.log("Resultado da reconstrucao manual do dashboard analitico:");
  console.log(JSON.stringify(resultado));
  return resultado;
}

function diagnosticarDashboardAnaliticoManual() {
  try {
    var fonte = dashboardOperacionalObterPlanilhaFonte_();
    var analitico = dashboardAnaliticoObterPlanilha_();
    var abasFonte = [
      "VENDA_CARRINHO",
      "VENDA_PRODUTO",
      "EST_MOVIMENTACOES",
      "EST_NFs",
      "CAD_PRODUTO",
      "CAD_FILIAL"
    ];
    var abasAnaliticas = Object.keys(DASH_ANALITICO_ABAS_).map(function(chave) {
      return DASH_ANALITICO_ABAS_[chave];
    });

    var diagnostico = {
      sucesso: true,
      planilhaFonte: fonte.getId(),
      planilhaAnalitica: analitico.getId(),
      abasFonte: {},
      abasAnaliticas: {}
    };

    abasFonte.forEach(function(nome) {
      var sheet = fonte.getSheetByName(nome);
      diagnostico.abasFonte[nome] = sheet ? Math.max(0, sheet.getLastRow() - 1) : "NAO ENCONTRADA";
    });

    abasAnaliticas.forEach(function(nome) {
      var sheet = analitico.getSheetByName(nome);
      diagnostico.abasAnaliticas[nome] = sheet ? Math.max(0, sheet.getLastRow() - 1) : "NAO ENCONTRADA";
    });

    console.log("Diagnostico do dashboard analitico:");
    console.log(JSON.stringify(diagnostico));
    return diagnostico;
  } catch (erro) {
    console.error("Erro no diagnostico do dashboard analitico:", erro);
    return { sucesso: false, mensagem: erro.toString() };
  }
}

function dashboardAnaliticoRegistrarControle_(chave, valor, observacao) {
  var sheet = dashboardAnaliticoObterAba_(DASH_ANALITICO_ABAS_.CONTROLE);
  var last = sheet.getLastRow();
  var dados = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues() : [];
  var row = -1;
  for (var i = 0; i < dados.length; i++) {
    if (String(dados[i][0] || "").trim() === String(chave || "").trim()) {
      row = i + 2;
      break;
    }
  }
  var linha = [chave, valor, dashboardAnaliticoAgora_(), observacao || ""];
  if (row > -1) sheet.getRange(row, 1, 1, 4).setValues([linha]);
  else sheet.appendRow(linha);
}

function dashboardAnaliticoRegistrarPendencia_(origem, idOrigem, acao, erro) {
  try {
    var sheet = dashboardAnaliticoObterAba_(DASH_ANALITICO_ABAS_.PENDENCIAS);
    var id = sheet.getLastRow();
    sheet.appendRow([
      id,
      String(origem || "").trim(),
      String(idOrigem || "").trim(),
      String(acao || "REPROCESSAR").trim(),
      "PENDENTE",
      0,
      String(erro || "").slice(0, 500),
      dashboardAnaliticoAgora_(),
      ""
    ]);
  } catch (e) {
    console.error("Erro ao registrar pendencia analitica:", e);
  }
}

function dashboardAnaliticoSubstituirResumo_(nomeAba, headers, deveRemover, novasLinhas) {
  var sheet = dashboardAnaliticoObterAba_(nomeAba);
  var atuais = dashboardAnaliticoLerAba_(nomeAba);
  var mantidas = atuais.filter(function(row) { return !deveRemover(row); });
  dashboardAnaliticoEscreverLinhas_(sheet, mantidas.concat(novasLinhas || []), headers);
}

function dashboardAnaliticoLocalizarVenda_(idCarrinho) {
  var ss = dashboardOperacionalObterPlanilhaFonte_();
  var rows = dashboardOperacionalValores_(ss.getSheetByName("VENDA_CARRINHO"), 13);
  var alvo = String(idCarrinho || "").trim();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0] || "").trim() !== alvo) continue;
    return {
      data: dashboardAnaliticoDataKey_(rows[i][11]),
      idFilial: String(rows[i][10] || "").trim()
    };
  }
  return null;
}

function dashboardAnaliticoLocalizarMovimento_(idOrigem) {
  var ss = dashboardOperacionalObterPlanilhaFonte_();
  var rows = dashboardOperacionalValores_(ss.getSheetByName("EST_MOVIMENTACOES"), 14);
  var alvo = String(idOrigem || "").trim();
  var alvoCanonico = dashboardOperacionalIdCanonico_(alvo);

  for (var i = 0; i < rows.length; i++) {
    var idMov = String(rows[i][0] || "").trim();
    var idNf = String(rows[i][1] || "").trim();
    var idVenda = String(rows[i][4] || "").trim();
    if (
      idMov === alvo ||
      idNf === alvo ||
      idVenda === alvo ||
      dashboardOperacionalIdCanonico_(idNf) === alvoCanonico
    ) {
      return {
        data: dashboardAnaliticoDataKey_(rows[i][10]),
        idFilial: String(rows[i][9] || "").trim()
      };
    }
  }

  return null;
}

function dashboardAnaliticoMontarRowsVendasDiaFilial_(dataKey, idFilial, agora) {
  var base = dashboardAnaliticoMontarBaseVendas_();
  var vendasDia = new Map();
  var vendasProdutoDia = new Map();

  base.vendas.forEach(function(venda) {
    if (venda.data !== dataKey || String(venda.idFilial) !== String(idFilial)) return;
    var chave = venda.data + "|" + venda.idFilial;
    if (!vendasDia.has(chave)) {
      vendasDia.set(chave, {
        chave: chave,
        data: venda.data,
        idFilial: venda.idFilial,
        qtdCarrinhos: 0,
        faturamento: 0,
        custoTotal: 0,
        lucro: 0,
        qtdItens: 0
      });
    }

    var item = vendasDia.get(chave);
    item.qtdCarrinhos += 1;
    item.faturamento += venda.faturamento;
    item.custoTotal += venda.custoTotal;
    item.lucro += venda.faturamento - venda.custoTotal;
    item.qtdItens += venda.qtdItens;
  });

  base.itens.forEach(function(itemVenda) {
    if (itemVenda.data !== dataKey || String(itemVenda.idFilial) !== String(idFilial)) return;
    var chave = itemVenda.data + "|" + itemVenda.idFilial + "|" + itemVenda.idProduto;
    if (!vendasProdutoDia.has(chave)) {
      vendasProdutoDia.set(chave, {
        chave: chave,
        data: itemVenda.data,
        idFilial: itemVenda.idFilial,
        idProduto: itemVenda.idProduto,
        carrinhos: new Set(),
        qtdVendida: 0,
        faturamentoProduto: 0,
        custoProduto: 0,
        lucroProduto: 0
      });
    }

    var prod = vendasProdutoDia.get(chave);
    prod.carrinhos.add(String(itemVenda.idCarrinho));
    prod.qtdVendida += itemVenda.qtd;
    prod.faturamentoProduto += itemVenda.faturamentoProduto;
    prod.custoProduto += itemVenda.custoProduto;
    prod.lucroProduto += itemVenda.faturamentoProduto - itemVenda.custoProduto;
  });

  return {
    vendasDia: Array.from(vendasDia.values()).map(function(item) {
      return [item.chave, item.data, item.idFilial, item.qtdCarrinhos, item.faturamento, item.custoTotal, item.lucro, item.qtdItens, agora];
    }),
    vendasProdutoDia: Array.from(vendasProdutoDia.values()).map(function(item) {
      return [item.chave, item.data, item.idFilial, item.idProduto, item.carrinhos.size, item.qtdVendida, item.faturamentoProduto, item.custoProduto, item.lucroProduto, agora];
    })
  };
}

function dashboardAnaliticoMontarRowsEstoqueDiaFilial_(dataKey, idFilial, agora) {
  var base = dashboardAnaliticoMontarBaseEstoque_();
  var estoqueDia = new Map();
  var estoqueProdutoDia = new Map();

  base.movimentos.forEach(function(mov) {
    if (mov.data !== dataKey || String(mov.idFilial) !== String(idFilial)) return;

    var chaveDia = mov.data + "|" + mov.idFilial + "|" + mov.tipo;
    if (!estoqueDia.has(chaveDia)) {
      estoqueDia.set(chaveDia, {
        chave: chaveDia,
        data: mov.data,
        idFilial: mov.idFilial,
        tipo: mov.tipo,
        qtd: 0,
        valorTotal: 0,
        frete: 0,
        outrasCustas: 0,
        lucroSaidaVenda: 0,
        nfsSomadas: new Set(),
        vendasSomadas: new Set()
      });
    }

    var dia = estoqueDia.get(chaveDia);
    dia.qtd += mov.qtd;
    dia.valorTotal += mov.valorTotal;

    if (mov.tipo === "ENTRADA" && mov.idNf && !dia.nfsSomadas.has(mov.idNf)) {
      dia.nfsSomadas.add(mov.idNf);
      dia.frete += mov.freteTransporte;
      dia.outrasCustas += mov.outrasCustas;
    }

    if (mov.tipo === "SAIDA VENDA" && mov.idVenda && !dia.vendasSomadas.has(mov.idVenda)) {
      dia.vendasSomadas.add(mov.idVenda);
      dia.lucroSaidaVenda += mov.lucroCarrinho;
    }

    var chaveProd = mov.data + "|" + mov.idFilial + "|" + mov.idProduto + "|" + mov.tipo;
    if (!estoqueProdutoDia.has(chaveProd)) {
      estoqueProdutoDia.set(chaveProd, {
        chave: chaveProd,
        data: mov.data,
        idFilial: mov.idFilial,
        idProduto: mov.idProduto,
        tipo: mov.tipo,
        qtd: 0,
        valorTotal: 0,
        lucroSaidaVenda: 0
      });
    }

    var prod = estoqueProdutoDia.get(chaveProd);
    prod.qtd += mov.qtd;
    prod.valorTotal += mov.valorTotal;
    if (mov.tipo === "SAIDA VENDA") prod.lucroSaidaVenda += mov.lucroProdutoVenda;
  });

  return {
    estoqueDia: Array.from(estoqueDia.values()).map(function(item) {
      return [item.chave, item.data, item.idFilial, item.tipo, item.qtd, item.valorTotal, item.frete, item.outrasCustas, item.lucroSaidaVenda, agora];
    }),
    estoqueProdutoDia: Array.from(estoqueProdutoDia.values()).map(function(item) {
      return [item.chave, item.data, item.idFilial, item.idProduto, item.tipo, item.qtd, item.valorTotal, item.lucroSaidaVenda, agora];
    })
  };
}

function dashboardAnaliticoAtualizarVendasDiaFilial_(dataKey, idFilial) {
  if (!dataKey || !idFilial) return { sucesso: false, mensagem: "Venda sem data ou filial para atualizar resumo." };

  var agora = dashboardAnaliticoAgora_();
  var rows = dashboardAnaliticoMontarRowsVendasDiaFilial_(dataKey, idFilial, agora);

  dashboardAnaliticoSubstituirResumo_(
    DASH_ANALITICO_ABAS_.VENDAS_DIA,
    DASH_ANALITICO_HEADERS_.DASH_VENDAS_DIA,
    function(row) { return dashboardAnaliticoNormalizarDataKey_(row[1]) === dataKey && String(row[2] || "") === String(idFilial); },
    rows.vendasDia
  );

  dashboardAnaliticoSubstituirResumo_(
    DASH_ANALITICO_ABAS_.VENDAS_PRODUTO_DIA,
    DASH_ANALITICO_HEADERS_.DASH_VENDAS_PRODUTO_DIA,
    function(row) { return dashboardAnaliticoNormalizarDataKey_(row[1]) === dataKey && String(row[2] || "") === String(idFilial); },
    rows.vendasProdutoDia
  );

  dashboardAnaliticoRegistrarControle_("ULTIMA_ATUALIZACAO_VENDAS", dataKey + "|" + idFilial, "Atualizacao pontual de vendas.");
  return { sucesso: true };
}

function dashboardAnaliticoAtualizarEstoqueDiaFilial_(dataKey, idFilial) {
  if (!dataKey || !idFilial) return { sucesso: false, mensagem: "Movimento sem data ou filial para atualizar resumo." };

  var agora = dashboardAnaliticoAgora_();
  var rows = dashboardAnaliticoMontarRowsEstoqueDiaFilial_(dataKey, idFilial, agora);

  dashboardAnaliticoSubstituirResumo_(
    DASH_ANALITICO_ABAS_.ESTOQUE_DIA,
    DASH_ANALITICO_HEADERS_.DASH_ESTOQUE_DIA,
    function(row) { return dashboardAnaliticoNormalizarDataKey_(row[1]) === dataKey && String(row[2] || "") === String(idFilial); },
    rows.estoqueDia
  );

  dashboardAnaliticoSubstituirResumo_(
    DASH_ANALITICO_ABAS_.ESTOQUE_PRODUTO_DIA,
    DASH_ANALITICO_HEADERS_.DASH_ESTOQUE_PRODUTO_DIA,
    function(row) { return dashboardAnaliticoNormalizarDataKey_(row[1]) === dataKey && String(row[2] || "") === String(idFilial); },
    rows.estoqueProdutoDia
  );

  dashboardAnaliticoRegistrarControle_("ULTIMA_ATUALIZACAO_ESTOQUE", dataKey + "|" + idFilial, "Atualizacao pontual de estoque.");
  return { sucesso: true };
}

function dashboardAnaliticoAtualizarPontual_(origem, idOrigem) {
  var origemNorm = String(origem || "").trim().toUpperCase();
  var alvo = String(idOrigem || "").trim();
  if (!alvo) return { sucesso: false, mensagem: "Origem sem identificador para atualizacao analitica." };

  if (origemNorm === "VENDA") {
    var venda = dashboardAnaliticoLocalizarVenda_(alvo);
    if (!venda) return { sucesso: false, mensagem: "Venda nao encontrada para atualizacao analitica." };
    dashboardAnaliticoAtualizarVendasDiaFilial_(venda.data, venda.idFilial);
    dashboardAnaliticoAtualizarEstoqueDiaFilial_(venda.data, venda.idFilial);
    return { sucesso: true };
  }

  if (origemNorm === "ESTOQUE") {
    var mov = dashboardAnaliticoLocalizarMovimento_(alvo);
    if (!mov) return { sucesso: false, mensagem: "Movimentacao nao encontrada para atualizacao analitica." };
    return dashboardAnaliticoAtualizarEstoqueDiaFilial_(mov.data, mov.idFilial);
  }

  return { sucesso: false, mensagem: "Origem analitica nao reconhecida." };
}

function atualizarDashboardAnaliticoSegundoPlano(origem, idOrigem, acao) {
  try {
    var token = authExtrairTokenArgumentos_(arguments);
    var sessao = validarSessao(token, "Menu", "");
    if (!sessao || !sessao.autenticado) {
      return { sucesso: false, mensagem: "Sessao invalida para atualizacao analitica." };
    }

    var resultado = dashboardAnaliticoAtualizarPontual_(origem, idOrigem);
    if (!resultado || !resultado.sucesso) {
      dashboardAnaliticoRegistrarPendencia_(origem, idOrigem, acao || "REPROCESSAR", resultado ? resultado.mensagem : "");
      return { sucesso: true, mensagem: "Atualizacao analitica registrada como pendente." };
    }

    return { sucesso: true, mensagem: "Atualizacao analitica concluida em segundo plano." };
  } catch (erro) {
    console.error("Erro ao registrar atualizacao analitica:", erro);
    dashboardAnaliticoRegistrarPendencia_(origem, idOrigem, acao || "REPROCESSAR", erro.toString());
    return { sucesso: false, mensagem: "Erro ao registrar atualizacao analitica: " + erro.toString() };
  }
}

function dashboardAnaliticoTemFiltroProduto_(opcoes) {
  opcoes = opcoes || {};
  var filtros = opcoes.filtros || {};
  return !!(
    filtros.produto ||
    filtros.fornecedor ||
    filtros.categoria ||
    filtros.subcategoria ||
    opcoes.itemSelecionado
  );
}

function dashboardAnaliticoBaseDisponivel_() {
  try {
    var rows = dashboardAnaliticoLerAba_(DASH_ANALITICO_ABAS_.CONTROLE);
    return rows.some(function(row) {
      return String(row[0] || "").trim() === "ULTIMA_RECONSTRUCAO_GERAL" &&
        String(row[1] || "").trim().toUpperCase() === "OK";
    });
  } catch (erro) {
    console.warn("Controle do banco analitico indisponivel.", erro);
    return false;
  }
}

function dashboardAnaliticoDataPassaFiltros_(dataKey, idFilial, filtros, periodoSelecionado, agrupamento) {
  filtros = filtros || {};
  dataKey = dashboardAnaliticoNormalizarDataKey_(dataKey);
  if (!dataKey) return false;
  var periodo = dashboardOperacionalPeriodoFiltro_(filtros.periodo);
  var ts = dashboardOperacionalParseData_(dashboardAnaliticoDataLabel_(dataKey));
  var dataTS = ts ? ts.getTime() : 0;

  if (filtros.filial && String(idFilial) !== String(filtros.filial)) return false;
  if (periodo.inicioTS && dataTS < periodo.inicioTS) return false;
  if (periodo.fimTS && dataTS > periodo.fimTS) return false;
  if (periodoSelecionado) {
    var chavePeriodo = agrupamento === "mes" ? String(dataKey || "").slice(0, 7) : String(dataKey || "");
    if (chavePeriodo !== periodoSelecionado) return false;
  }

  return true;
}

function dashboardAnaliticoLabelPeriodo_(key, agrupamento) {
  return agrupamento === "mes" ? dashboardOperacionalFormatarMes_(key) : dashboardOperacionalFormatarDia_(key);
}

function dashboardAnaliticoCompostosVendas_(rowsVendasDia) {
  var porMes = new Map();

  rowsVendasDia.forEach(function(row) {
    var dataKey = dashboardAnaliticoNormalizarDataKey_(row[1]);
    var key = dataKey.slice(0, 7);
    if (!key) return;
    if (!porMes.has(key)) porMes.set(key, { key: key, volume: 0, lucro: 0 });
    var item = porMes.get(key);
    item.volume += dashboardAnaliticoNumero_(row[3]);
    item.lucro += dashboardAnaliticoNumero_(row[6]);
  });

  var ultimoMesFechado = dashboardOperacionalUltimoMesFechado_();
  if (!porMes.has(ultimoMesFechado)) porMes.set(ultimoMesFechado, { key: ultimoMesFechado, volume: 0, lucro: 0 });

  var fechados = Array.from(porMes.values()).filter(function(item) {
    return item.key <= ultimoMesFechado;
  }).sort(function(a, b) { return a.key.localeCompare(b.key); });

  var janela = fechados.slice(-12);
  var ultimo = janela.filter(function(item) { return item.key === ultimoMesFechado; })[0] || { volume: 0, lucro: 0 };

  function resumo(campo) {
    var soma = janela.reduce(function(acc, item) { return acc + Number(item[campo] || 0); }, 0);
    var media = janela.length ? soma / janela.length : 0;
    var valorUltimo = Number(ultimo[campo] || 0);
    return {
      ultimo: valorUltimo,
      media: media,
      crescimento: media ? ((valorUltimo - media) / media) * 100 : 0,
      qtdMeses: janela.length
    };
  }

  return {
    volume: resumo("volume"),
    lucro: resumo("lucro")
  };
}

function buscarResumoDashboardVendasAnalitico_(opcoes) {
  if (dashboardAnaliticoTemFiltroProduto_(opcoes)) return null;
  if (!dashboardAnaliticoBaseDisponivel_()) return null;

  opcoes = opcoes || {};
  var filtros = opcoes.filtros || {};
  var agrupamento = opcoes.periodoGrafico === "dia" ? "dia" : "mes";
  var periodoSelecionado = String(opcoes.periodoSelecionado || "").trim();
  var dimensoes = opcoes._dimensoes || dashboardOperacionalMapearDimensoes_();
  var mapaProdutos = dimensoes.mapaProdutos;
  var rowsDia = dashboardAnaliticoLerAba_(DASH_ANALITICO_ABAS_.VENDAS_DIA);
  var rowsProduto = dashboardAnaliticoLerAba_(DASH_ANALITICO_ABAS_.VENDAS_PRODUTO_DIA);

  if (!rowsDia.length && !rowsProduto.length) return null;

  var rowsDiaFiltradas = rowsDia.filter(function(row) {
    return dashboardAnaliticoDataPassaFiltros_(row[1], String(row[2] || ""), filtros, periodoSelecionado, agrupamento);
  });

  var cards = rowsDiaFiltradas.reduce(function(acc, row) {
    acc.carrinhos += dashboardAnaliticoNumero_(row[3]);
    acc.faturamento += dashboardAnaliticoNumero_(row[4]);
    acc.custoTotal += dashboardAnaliticoNumero_(row[5]);
    acc.lucro += dashboardAnaliticoNumero_(row[6]);
    return acc;
  }, { carrinhos: 0, faturamento: 0, custoTotal: 0, lucro: 0 });
  cards.margem = cards.faturamento ? (cards.lucro / cards.faturamento) * 100 : 0;
  cards.ticket = cards.carrinhos ? cards.faturamento / cards.carrinhos : 0;

  var grafico = new Map();
  rowsDiaFiltradas.forEach(function(row) {
    var dataKey = dashboardAnaliticoNormalizarDataKey_(row[1]);
    var key = agrupamento === "mes" ? dataKey.slice(0, 7) : dataKey;
    if (!key) return;
    if (!grafico.has(key)) {
      grafico.set(key, { key: key, label: dashboardAnaliticoLabelPeriodo_(key, agrupamento), volume: 0, faturamento: 0, lucro: 0 });
    }
    var item = grafico.get(key);
    item.volume += dashboardAnaliticoNumero_(row[3]);
    item.faturamento += dashboardAnaliticoNumero_(row[4]);
    item.lucro += dashboardAnaliticoNumero_(row[6]);
  });

  var tabela = new Map();
  rowsProduto.forEach(function(row) {
    var dataKey = dashboardAnaliticoNormalizarDataKey_(row[1]);
    var idFilial = String(row[2] || "");
    var idProduto = String(row[3] || "");
    if (!dashboardAnaliticoDataPassaFiltros_(dataKey, idFilial, filtros, periodoSelecionado, agrupamento)) return;
    var produto = mapaProdutos[idProduto] || {};
    if (!tabela.has(idProduto)) {
      tabela.set(idProduto, {
        idProduto: idProduto,
        nome: produto.nome || idProduto,
        categoria: produto.categoria || "",
        subcategoria: produto.subcategoria || "",
        volume: 0,
        faturamento: 0,
        lucro: 0,
        qtdLinhas: 0
      });
    }
    var agg = tabela.get(idProduto);
    agg.volume += dashboardAnaliticoNumero_(row[5]);
    agg.faturamento += dashboardAnaliticoNumero_(row[6]);
    agg.lucro += dashboardAnaliticoNumero_(row[8]);
    agg.qtdLinhas += dashboardAnaliticoNumero_(row[4]);
  });

  var listaTabela = Array.from(tabela.values()).map(function(item) {
    item.lucroMedio = item.qtdLinhas ? item.lucro / item.qtdLinhas : 0;
    item.margemMedia = item.faturamento ? (item.lucro / item.faturamento) * 100 : 0;
    return item;
  });
  dashboardOperacionalOrdenarTabela_(listaTabela, opcoes.sort, "faturamento");

  return {
    sucesso: true,
    fonteAnalitica: true,
    atualizadoEm: dashboardAnaliticoAgora_(),
    cards: cards,
    compostos: dashboardAnaliticoCompostosVendas_(rowsDia),
    grafico: Array.from(grafico.values()).sort(function(a, b) { return a.key.localeCompare(b.key); }),
    tabela: listaTabela
  };
}

function buscarResumoDashboardEstoqueAnalitico_(opcoes) {
  if (dashboardAnaliticoTemFiltroProduto_(opcoes)) return null;
  if (!dashboardAnaliticoBaseDisponivel_()) return null;

  opcoes = opcoes || {};
  var filtros = opcoes.filtros || {};
  var agrupamento = opcoes.periodoGrafico === "dia" ? "dia" : "mes";
  var periodoSelecionado = String(opcoes.periodoSelecionado || "").trim();
  var dimensoes = opcoes._dimensoes || dashboardOperacionalMapearDimensoes_();
  var mapaProdutos = dimensoes.mapaProdutos;
  var rowsDia = dashboardAnaliticoLerAba_(DASH_ANALITICO_ABAS_.ESTOQUE_DIA);
  var rowsProduto = dashboardAnaliticoLerAba_(DASH_ANALITICO_ABAS_.ESTOQUE_PRODUTO_DIA);

  if (!rowsDia.length && !rowsProduto.length) return null;

  var cards = {
    qtdEntrada: 0,
    valorEntrada: 0,
    frete: 0,
    outrasCustas: 0,
    qtdSaidaVenda: 0,
    custoSaidaVenda: 0,
    lucroSaidaVenda: 0,
    qtdSaidaPerda: 0,
    valorSaidaPerda: 0
  };
  var grafico = new Map();

  rowsDia.forEach(function(row) {
    var dataKey = dashboardAnaliticoNormalizarDataKey_(row[1]);
    var idFilial = String(row[2] || "");
    var tipo = dashboardAnaliticoTipoMov_(row[3]);
    if (!dashboardAnaliticoDataPassaFiltros_(dataKey, idFilial, filtros, periodoSelecionado, agrupamento)) return;
    var key = agrupamento === "mes" ? dataKey.slice(0, 7) : dataKey;
    if (!grafico.has(key)) {
      grafico.set(key, {
        key: key,
        label: dashboardAnaliticoLabelPeriodo_(key, agrupamento),
        entrada_volume: 0,
        entrada_faturamento: 0,
        saidaVenda_volume: 0,
        saidaVenda_faturamento: 0,
        saidaPerda_volume: 0,
        saidaPerda_faturamento: 0
      });
    }
    var g = grafico.get(key);
    var qtd = dashboardAnaliticoNumero_(row[4]);
    var valor = dashboardAnaliticoNumero_(row[5]);
    if (tipo === "ENTRADA") {
      cards.qtdEntrada += qtd;
      cards.valorEntrada += valor;
      cards.frete += dashboardAnaliticoNumero_(row[6]);
      cards.outrasCustas += dashboardAnaliticoNumero_(row[7]);
      g.entrada_volume += qtd;
      g.entrada_faturamento += valor;
    }
    if (tipo === "SAIDA VENDA") {
      cards.qtdSaidaVenda += qtd;
      cards.custoSaidaVenda += valor;
      cards.lucroSaidaVenda += dashboardAnaliticoNumero_(row[8]);
      g.saidaVenda_volume += qtd;
      g.saidaVenda_faturamento += valor;
    }
    if (tipo === "SAIDA PERDA") {
      cards.qtdSaidaPerda += qtd;
      cards.valorSaidaPerda += valor;
      g.saidaPerda_volume += qtd;
      g.saidaPerda_faturamento += valor;
    }
  });

  var tabela = new Map();
  rowsProduto.forEach(function(row) {
    var dataKey = dashboardAnaliticoNormalizarDataKey_(row[1]);
    var idFilial = String(row[2] || "");
    var idProduto = String(row[3] || "");
    var tipo = dashboardAnaliticoTipoMov_(row[4]);
    if (!dashboardAnaliticoDataPassaFiltros_(dataKey, idFilial, filtros, periodoSelecionado, agrupamento)) return;
    var produto = mapaProdutos[idProduto] || {};
    if (!tabela.has(idProduto)) {
      tabela.set(idProduto, {
        idProduto: idProduto,
        nome: produto.nome || idProduto,
        categoria: produto.categoria || "",
        subcategoria: produto.subcategoria || "",
        estMinimo: Number(produto.estMinimo || 0),
        estMaximo: Number(produto.estMaximo || 0),
        qtdEntrada: 0,
        valorEntrada: 0,
        qtdSaidaVenda: 0,
        custoSaidaVenda: 0,
        lucroSaidaVenda: 0,
        qtdSaidaPerda: 0,
        valorSaidaPerda: 0,
        saldo: 0
      });
    }
    var item = tabela.get(idProduto);
    var qtd = dashboardAnaliticoNumero_(row[5]);
    var valor = dashboardAnaliticoNumero_(row[6]);
    if (tipo === "ENTRADA") {
      item.qtdEntrada += qtd;
      item.valorEntrada += valor;
      item.saldo += qtd;
    }
    if (tipo === "SAIDA VENDA") {
      item.qtdSaidaVenda += qtd;
      item.custoSaidaVenda += valor;
      item.lucroSaidaVenda += dashboardAnaliticoNumero_(row[7]);
      item.saldo -= qtd;
    }
    if (tipo === "SAIDA PERDA") {
      item.qtdSaidaPerda += qtd;
      item.valorSaidaPerda += valor;
      item.saldo -= qtd;
    }
  });

  var listaTabela = Array.from(tabela.values());
  dashboardOperacionalOrdenarTabela_(listaTabela, opcoes.sort, "valorEntrada");

  return {
    sucesso: true,
    fonteAnalitica: true,
    atualizadoEm: dashboardAnaliticoAgora_(),
    cards: cards,
    grafico: Array.from(grafico.values()).sort(function(a, b) { return a.key.localeCompare(b.key); }),
    tabela: listaTabela
  };
}
