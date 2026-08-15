var ID_PLANILHA_FONTE_INSIGHT_PAD = "1QGf-7I_zADLNvpUPbCjdRekCch4D3Xpj0S2H6DybLP0";

function dashboardOperacionalObterPlanilhaFonte_() {
  if (ID_PLANILHA_FONTE_INSIGHT_PAD) {
    return SpreadsheetApp.openById(ID_PLANILHA_FONTE_INSIGHT_PAD);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;

  throw new Error("Planilha fonte do Insight Pad nao encontrada.");
}

function dashboardOperacionalValores_(sheet, colunas) {
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, colunas).getDisplayValues();
}

function dashboardOperacionalTabelaComCabecalho_(sheet) {
  if (!sheet) return { headers: [], rows: [] };
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return { headers: [], rows: [] };

  var values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  return {
    headers: values[0] || [],
    rows: values.slice(1)
  };
}

function dashboardOperacionalIndiceCabecalho_(headers, nomes) {
  var mapa = {};
  headers.forEach(function(header, index) {
    var key = String(header || "")
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (key) mapa[key] = index;
  });

  for (var i = 0; i < nomes.length; i++) {
    var nome = String(nomes[i] || "")
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (Object.prototype.hasOwnProperty.call(mapa, nome)) return mapa[nome];
  }

  return -1;
}

function dashboardOperacionalIdCanonico_(valor) {
  var texto = String(valor || "").trim();
  if (!texto) return "";

  var numerico = texto.replace(",", ".");
  if (/^\d+(?:\.0+)?$/.test(numerico)) {
    return String(parseInt(numerico, 10));
  }

  return texto.toUpperCase();
}

function dashboardOperacionalNumero_(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  var texto = String(valor || "")
    .replace(/\u00A0/g, " ")
    .replace(/[Rr]\$\s*/g, "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!texto || !/[0-9]/.test(texto)) return 0;

  var lastComma = texto.lastIndexOf(",");
  var lastDot = texto.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    texto = lastComma > lastDot
      ? texto.replace(/\./g, "").replace(",", ".")
      : texto.replace(/,/g, "");
  } else if (lastComma > -1) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  }

  var numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function dashboardOperacionalParseData_(valor) {
  if (Object.prototype.toString.call(valor) === "[object Date]" && !isNaN(valor.getTime())) {
    return valor;
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

  var isoData = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoData) {
    var dataIso = new Date(
      Number(isoData[1]),
      Number(isoData[2]) - 1,
      Number(isoData[3]),
      Number(isoData[4] || 0),
      Number(isoData[5] || 0),
      Number(isoData[6] || 0)
    );
    return isNaN(dataIso.getTime()) ? null : dataIso;
  }

  var data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
}

function dashboardOperacionalDataLabel_(data) {
  if (!data) return "";
  return Utilities.formatDate(data, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
}

function dashboardOperacionalDiaKey_(data) {
  if (!data) return "";
  return Utilities.formatDate(data, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function dashboardOperacionalMesKey_(data) {
  if (!data) return "";
  return Utilities.formatDate(data, Session.getScriptTimeZone(), "yyyy-MM");
}

function dashboardOperacionalMapaSimples_(rows, idIndex, nomeIndex, statusIndex) {
  var mapa = {};
  rows.forEach(function(row) {
    var id = String(row[idIndex] || "").trim();
    var status = statusIndex >= 0 ? String(row[statusIndex] || "S").trim().toUpperCase() : "S";
    if (!id || status === "N") return;
    mapa[id] = String(row[nomeIndex] || "").trim();
  });
  return mapa;
}

function buscarPacoteDashboardOperacionalInterno_() {
  try {
    if (typeof sincronizarStatusPromocoes_ === "function") {
      sincronizarStatusPromocoes_();
    }

    var ss = dashboardOperacionalObterPlanilhaFonte_();
    var shProduto = ss.getSheetByName("CAD_PRODUTO");
    var shCategoria = ss.getSheetByName("CAD_CATEGORIAS");
    var shSubcategoria = ss.getSheetByName("CAD_SUBCATEGORIAS");
    var shFornecedor = ss.getSheetByName("CAD_FORNECEDOR");
    var shFilial = ss.getSheetByName("CAD_FILIAL");
    var shCarrinho = ss.getSheetByName("VENDA_CARRINHO");
    var shProdutoVenda = ss.getSheetByName("VENDA_PRODUTO");
    var shMovEstoque = ss.getSheetByName("EST_MOVIMENTACOES");
    var shNfsEstoque = ss.getSheetByName("EST_NFs");
    var shCliente = ss.getSheetByName("CAD_CLIENTE");

    var categoriasRaw = dashboardOperacionalValores_(shCategoria, 4);
    var subcategoriasRaw = dashboardOperacionalValores_(shSubcategoria, 5);
    var fornecedoresRaw = dashboardOperacionalValores_(shFornecedor, 25);
    var filiaisRaw = dashboardOperacionalValores_(shFilial, 14);
    var produtosRaw = dashboardOperacionalValores_(shProduto, 22);
    var carrinhosRaw = dashboardOperacionalValores_(shCarrinho, 13);
    var produtosVendaRaw = dashboardOperacionalValores_(shProdutoVenda, 6);
    var movimentacoesRaw = dashboardOperacionalValores_(shMovEstoque, 14);
    var nfsTabela = dashboardOperacionalTabelaComCabecalho_(shNfsEstoque);

    var mapaCategorias = dashboardOperacionalMapaSimples_(categoriasRaw, 0, 1, -1);
    var mapaFornecedores = dashboardOperacionalMapaSimples_(fornecedoresRaw, 0, 1, 24);
    var mapaFiliais = dashboardOperacionalMapaSimples_(filiaisRaw, 0, 1, 13);
    var mapaSubcategorias = {};

    subcategoriasRaw.forEach(function(row) {
      var id = String(row[0] || "").trim();
      if (!id) return;
      mapaSubcategorias[id] = String(row[2] || "").trim();
    });

    var produtos = [];
    var mapaProdutos = {};

    produtosRaw.forEach(function(row) {
      var status = String(row[21] || "S").trim().toUpperCase();
      var idProduto = String(row[0] || "").trim();
      if (!idProduto || status === "N") return;

      var idCategoria = String(row[5] || "").trim();
      var idSubcategoria = String(row[6] || "").trim();
      var idFornecedor = String(row[12] || "").trim();
      var produto = {
        idProduto: idProduto,
        nome: String(row[3] || "").trim(),
        idCategoria: idCategoria,
        categoria: mapaCategorias[idCategoria] || idCategoria || "SEM CATEGORIA",
        idSubcategoria: idSubcategoria,
        subcategoria: mapaSubcategorias[idSubcategoria] || idSubcategoria || "SEM SUBCATEGORIA",
        idFornecedor: idFornecedor,
        fornecedor: mapaFornecedores[idFornecedor] || idFornecedor || "SEM FORNECEDOR",
        estMaximo: dashboardOperacionalNumero_(row[13]),
        estMinimo: dashboardOperacionalNumero_(row[14]),
        precoVenda: dashboardOperacionalNumero_(row[15]),
        precoCusto: dashboardOperacionalNumero_(row[16])
      };

      produtos.push(produto);
      mapaProdutos[idProduto] = produto;
    });

    var clientes = [];
    var cidadesClientes = {};
    var bairrosClientes = {};

    if (shCliente && shCliente.getLastRow() > 1) {
      var qtdClientes = shCliente.getLastRow() - 1;
      var clientesBase = shCliente.getRange(2, 1, qtdClientes, 3).getDisplayValues();
      var clientesLocal = shCliente.getRange(2, 13, qtdClientes, 2).getDisplayValues();
      var clientesStatus = shCliente.getRange(2, 26, qtdClientes, 1).getDisplayValues();

      clientesBase.forEach(function(row, idx) {
        var idCliente = String(row[0] || "").trim();
        var statusCliente = String(clientesStatus[idx][0] || "S").trim().toUpperCase();
        if (!idCliente || statusCliente === "N") return;

        var cidade = String(clientesLocal[idx][0] || "").trim();
        var bairro = String(clientesLocal[idx][1] || "").trim();
        clientes.push({
          idCliente: idCliente,
          nome: String(row[1] || "").trim() || idCliente,
          dataNascimento: String(row[2] || "").trim(),
          cidade: cidade,
          bairro: bairro
        });
        if (cidade) cidadesClientes[cidade] = cidade;
        if (bairro) bairrosClientes[bairro] = bairro;
      });
    }

    clientes.sort(function(a, b) {
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

    var vendas = [];
    var mapaVendas = {};
    var periodoMin = "";
    var periodoMax = "";

    carrinhosRaw.forEach(function(row) {
      var status = String(row[12] || "S").trim().toUpperCase();
      var idCarrinho = String(row[0] || "").trim();
      if (!idCarrinho || status === "N") return;

      var data = dashboardOperacionalParseData_(row[11]);
      var ts = data ? data.getTime() : 0;
      var idFilial = String(row[10] || "").trim();
      var venda = {
        idCarrinho: idCarrinho,
        idCliente: String(row[1] || "").trim(),
        idFilial: idFilial,
        filial: mapaFiliais[idFilial] || idFilial || "SEM FILIAL",
        totalVenda: dashboardOperacionalNumero_(row[2]),
        desconto: dashboardOperacionalNumero_(row[3]),
        faturamento: dashboardOperacionalNumero_(row[4]),
        forma1: String(row[5] || "").trim(),
        valor1: dashboardOperacionalNumero_(row[6]),
        forma2: String(row[7] || "").trim(),
        valor2: dashboardOperacionalNumero_(row[8]),
        troco: dashboardOperacionalNumero_(row[9]),
        dataVenda: dashboardOperacionalDataLabel_(data),
        dataTS: ts,
        diaKey: dashboardOperacionalDiaKey_(data),
        mesKey: dashboardOperacionalMesKey_(data)
      };

      if (ts) {
        if (!periodoMin || ts < periodoMin) periodoMin = ts;
        if (!periodoMax || ts > periodoMax) periodoMax = ts;
      }

      vendas.push(venda);
      mapaVendas[idCarrinho] = venda;
    });

    var itensVenda = [];
    var receitaProdutoVenda = {};
    produtosVendaRaw.forEach(function(row) {
      var status = String(row[5] || "S").trim().toUpperCase();
      var idCarrinho = String(row[1] || "").trim();
      var idProduto = String(row[2] || "").trim();
      if (!idCarrinho || !idProduto || status === "N" || !mapaVendas[idCarrinho]) return;

      var produto = mapaProdutos[idProduto] || {};
      var qtd = dashboardOperacionalNumero_(row[4]);
      var valorVenda = dashboardOperacionalNumero_(row[3]);
      var custoTotal = dashboardOperacionalNumero_(produto.precoCusto) * qtd;
      var chaveReceita = idCarrinho + "||" + idProduto;
      receitaProdutoVenda[chaveReceita] = (receitaProdutoVenda[chaveReceita] || 0) + valorVenda;

      itensVenda.push({
        idVendaProduto: String(row[0] || "").trim(),
        idCarrinho: idCarrinho,
        idProduto: idProduto,
        valorVenda: valorVenda,
        qtd: qtd,
        custoTotal: custoTotal
      });
    });

    var nfsEstoque = [];
    var mapaNfsEstoque = {};
    var idxNfId = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["ID_NF"]);
    var idxFrete = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["FRETE_TRANSPORTE", "FRETE"]);
    var idxSeguro = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["SEGURO"]);
    var idxIcms = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["ICMS"]);
    var idxIcmsSt = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["ICMS_ST", "ICMS ST"]);
    var idxIpi = dashboardOperacionalIndiceCabecalho_(nfsTabela.headers, ["IPI"]);

    nfsTabela.rows.forEach(function(row) {
      var idNf = String(row[idxNfId >= 0 ? idxNfId : 0] || "").trim();
      if (!idNf) return;

      var nf = {
        idNf: idNf,
        freteTransporte: dashboardOperacionalNumero_(idxFrete >= 0 ? row[idxFrete] : row[4]),
        icms: dashboardOperacionalNumero_(idxIcms >= 0 ? row[idxIcms] : row[6]),
        icmsSt: dashboardOperacionalNumero_(idxIcmsSt >= 0 ? row[idxIcmsSt] : row[7]),
        seguro: dashboardOperacionalNumero_(idxSeguro >= 0 ? row[idxSeguro] : row[5]),
        ipi: dashboardOperacionalNumero_(idxIpi >= 0 ? row[idxIpi] : row[8])
      };
      nf.outrasCustas = nf.icms + nf.icmsSt + nf.seguro + nf.ipi;

      nfsEstoque.push(nf);
      mapaNfsEstoque[idNf] = nf;
      mapaNfsEstoque[dashboardOperacionalIdCanonico_(idNf)] = nf;
    });

    var movimentacoesEstoque = [];
    movimentacoesRaw.forEach(function(row) {
      var status = String(row[13] || "S").trim().toUpperCase();
      var idMovimentacao = String(row[0] || "").trim();
      var idProdutoMov = String(row[5] || "").trim();
      if (!idMovimentacao || !idProdutoMov || status === "N") return;

      var dataMov = dashboardOperacionalParseData_(row[10]);
      var qtdMov = dashboardOperacionalNumero_(row[6]);
      var valorUnitarioMov = dashboardOperacionalNumero_(row[7]);
      var idNfMov = String(row[1] || "").trim();
      var idVendaMov = String(row[4] || "").trim();
      var tipoMov = String(row[2] || "").trim();
      var valorTotalMov = qtdMov * valorUnitarioMov;
      var receitaVendaMov = idVendaMov ? Number(receitaProdutoVenda[idVendaMov + "||" + idProdutoMov] || 0) : 0;
      var nfMov = mapaNfsEstoque[idNfMov] || mapaNfsEstoque[dashboardOperacionalIdCanonico_(idNfMov)] || {};
      var idFilialMov = String(row[9] || "").trim();

      movimentacoesEstoque.push({
        idMovimentacao: idMovimentacao,
        idNf: idNfMov,
        tipoMov: tipoMov,
        idTransferencia: String(row[3] || "").trim(),
        idVenda: idVendaMov,
        idProduto: idProdutoMov,
        qtd: qtdMov,
        valorUnitario: valorUnitarioMov,
        valorTotal: valorTotalMov,
        receitaVenda: receitaVendaMov,
        lucroVenda: receitaVendaMov - valorTotalMov,
        idFilial: idFilialMov,
        filial: mapaFiliais[idFilialMov] || idFilialMov || "SEM FILIAL",
        dataMov: dashboardOperacionalDataLabel_(dataMov),
        dataTS: dataMov ? dataMov.getTime() : 0,
        diaKey: dashboardOperacionalDiaKey_(dataMov),
        mesKey: dashboardOperacionalMesKey_(dataMov),
        freteTransporte: dashboardOperacionalNumero_(nfMov.freteTransporte),
        outrasCustas: dashboardOperacionalNumero_(nfMov.outrasCustas)
      });
    });

    return {
      sucesso: true,
      atualizadoEm: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss"),
      periodoMin: periodoMin ? dashboardOperacionalDataLabel_(new Date(periodoMin)) : "",
      periodoMax: periodoMax ? dashboardOperacionalDataLabel_(new Date(periodoMax)) : "",
      vendas: vendas,
      itensVenda: itensVenda,
      movimentacoesEstoque: movimentacoesEstoque,
      nfsEstoque: nfsEstoque,
      produtos: produtos,
      clientes: clientes,
      filtros: {
        produtos: produtos.map(function(produto) {
          return { id: produto.idProduto, nome: produto.nome };
        }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
        fornecedores: Object.keys(mapaFornecedores).map(function(id) {
          return { id: id, nome: mapaFornecedores[id] };
        }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
        categorias: Object.keys(mapaCategorias).map(function(id) {
          return { id: id, nome: mapaCategorias[id] };
        }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
        subcategorias: Object.keys(mapaSubcategorias).map(function(id) {
          return { id: id, nome: mapaSubcategorias[id] };
        }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
        filiais: Object.keys(mapaFiliais).map(function(id) {
          return { id: id, nome: mapaFiliais[id] };
        }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
        clientes: clientes.map(function(cliente) {
          return { id: cliente.idCliente, nome: cliente.nome };
        }),
        cidadesClientes: Object.keys(cidadesClientes).map(function(nome) {
          return { id: nome, nome: nome };
        }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
        bairrosClientes: Object.keys(bairrosClientes).map(function(nome) {
          return { id: nome, nome: nome };
        }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
        classesClientes: [
          { id: "A", nome: "Clientes A" },
          { id: "B", nome: "Clientes B" },
          { id: "C", nome: "Clientes C" }
        ]
      }
    };
  } catch (erro) {
    console.error("Erro ao montar pacote do dashboard operacional:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao montar pacote do dashboard operacional: " + erro.toString(),
      atualizadoEm: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss"),
      vendas: [],
      itensVenda: [],
      movimentacoesEstoque: [],
      nfsEstoque: [],
      produtos: [],
      clientes: [],
      filtros: { produtos: [], fornecedores: [], categorias: [], subcategorias: [], filiais: [], clientes: [], cidadesClientes: [], bairrosClientes: [], classesClientes: [] }
    };
  }
}

function buscarPacoteDashboardOperacional() {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Dashboard_Relatorios_Operacionais", "ACESSAR");
    if (!auth.sucesso) return auth;

    var modo = String(arguments[0] || "").trim().toUpperCase();
    var opcoes = arguments[1] && typeof arguments[1] === "object" ? arguments[1] : {};

    if (modo === "VENDAS") return buscarResumoDashboardVendasInterno_(opcoes);
    if (modo === "ESTOQUE") return buscarResumoDashboardEstoqueInterno_(opcoes);
    if (modo === "CLIENTES") return buscarResumoDashboardClientesInterno_(opcoes);
    if (modo === "CATEGORIAS") return buscarResumoDashboardCategoriasInterno_(opcoes);
    if (modo === "BRUTO" || modo === "DADOS_BRUTOS") return buscarPacoteDashboardOperacionalInterno_();

    return buscarPacoteInicialDashboardOperacionalInterno_();
  } catch (erro) {
    console.error("Erro ao buscar pacote do dashboard operacional:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao buscar pacote do dashboard operacional: " + erro.toString()
    };
  }
}

// ===================================================================================================================================================
// PACOTES AGREGADOS - DASHBOARD OPERACIONAL
// ===================================================================================================================================================

function dashboardOperacionalAgora_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
}

function dashboardOperacionalNormalizarFiltro_(valor) {
  return String(valor || "").trim();
}

function dashboardOperacionalMapearDimensoes_(incluirClientes) {
  var ss = dashboardOperacionalObterPlanilhaFonte_();
  var shProduto = ss.getSheetByName("CAD_PRODUTO");
  var shCategoria = ss.getSheetByName("CAD_CATEGORIAS");
  var shSubcategoria = ss.getSheetByName("CAD_SUBCATEGORIAS");
  var shFornecedor = ss.getSheetByName("CAD_FORNECEDOR");
  var shFilial = ss.getSheetByName("CAD_FILIAL");
  var shCliente = incluirClientes ? ss.getSheetByName("CAD_CLIENTE") : null;

  var categoriasRaw = dashboardOperacionalValores_(shCategoria, 4);
  var subcategoriasRaw = dashboardOperacionalValores_(shSubcategoria, 5);
  var fornecedoresRaw = [];
  if (shFornecedor && shFornecedor.getLastRow() > 1) {
    var qtdFornecedores = shFornecedor.getLastRow() - 1;
    var fornecedoresBase = shFornecedor.getRange(2, 1, qtdFornecedores, 2).getDisplayValues();
    var fornecedoresStatus = shFornecedor.getRange(2, 25, qtdFornecedores, 1).getDisplayValues();
    fornecedoresRaw = fornecedoresBase.map(function(row, idx) {
      return [row[0], row[1], fornecedoresStatus[idx][0]];
    });
  }

  var filiaisRaw = [];
  if (shFilial && shFilial.getLastRow() > 1) {
    var qtdFiliais = shFilial.getLastRow() - 1;
    var filiaisBase = shFilial.getRange(2, 1, qtdFiliais, 2).getDisplayValues();
    var filiaisStatus = shFilial.getRange(2, 14, qtdFiliais, 1).getDisplayValues();
    filiaisRaw = filiaisBase.map(function(row, idx) {
      return [row[0], row[1], filiaisStatus[idx][0]];
    });
  }

  var produtosRaw = [];
  if (shProduto && shProduto.getLastRow() > 1) {
    var qtdProdutos = shProduto.getLastRow() - 1;
    var produtosBase = shProduto.getRange(2, 1, qtdProdutos, 17).getDisplayValues();
    var produtosStatus = shProduto.getRange(2, 22, qtdProdutos, 1).getDisplayValues();
    produtosRaw = produtosBase.map(function(row, idx) {
      var copia = row.slice();
      copia[21] = produtosStatus[idx][0];
      return copia;
    });
  }

  var mapaCategorias = dashboardOperacionalMapaSimples_(categoriasRaw, 0, 1, -1);
  var mapaFornecedores = dashboardOperacionalMapaSimples_(fornecedoresRaw, 0, 1, 2);
  var mapaFiliais = dashboardOperacionalMapaSimples_(filiaisRaw, 0, 1, 2);
  var mapaSubcategorias = {};

  subcategoriasRaw.forEach(function(row) {
    var id = String(row[0] || "").trim();
    if (!id) return;
    mapaSubcategorias[id] = String(row[2] || "").trim();
  });

  var produtos = [];
  var mapaProdutos = {};

  produtosRaw.forEach(function(row) {
    var status = String(row[21] || "S").trim().toUpperCase();
    var idProduto = String(row[0] || "").trim();
    if (!idProduto || status === "N") return;

    var idCategoria = String(row[5] || "").trim();
    var idSubcategoria = String(row[6] || "").trim();
    var idFornecedor = String(row[12] || "").trim();
    var produto = {
      idProduto: idProduto,
      nome: String(row[3] || "").trim(),
      idCategoria: idCategoria,
      categoria: mapaCategorias[idCategoria] || idCategoria || "SEM CATEGORIA",
      idSubcategoria: idSubcategoria,
      subcategoria: mapaSubcategorias[idSubcategoria] || idSubcategoria || "SEM SUBCATEGORIA",
      idFornecedor: idFornecedor,
      fornecedor: mapaFornecedores[idFornecedor] || idFornecedor || "SEM FORNECEDOR",
      estMaximo: dashboardOperacionalNumero_(row[13]),
      estMinimo: dashboardOperacionalNumero_(row[14]),
      precoCusto: dashboardOperacionalNumero_(row[16])
    };

    produtos.push(produto);
    mapaProdutos[idProduto] = produto;
  });

  produtos.sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });

  var clientes = [];
  var mapaClientes = {};
  var cidadesClientes = {};
  var bairrosClientes = {};

  if (shCliente && shCliente.getLastRow() > 1) {
    var qtdClientes = shCliente.getLastRow() - 1;
    var clientesBase = shCliente.getRange(2, 1, qtdClientes, 3).getDisplayValues();
    var clientesLocal = shCliente.getRange(2, 13, qtdClientes, 2).getDisplayValues();
    var clientesStatus = shCliente.getRange(2, 26, qtdClientes, 1).getDisplayValues();

    clientesBase.forEach(function(row, idx) {
      var idCliente = String(row[0] || "").trim();
      var statusCliente = String(clientesStatus[idx][0] || "S").trim().toUpperCase();
      if (!idCliente || statusCliente === "N") return;

      var cidade = String(clientesLocal[idx][0] || "").trim();
      var bairro = String(clientesLocal[idx][1] || "").trim();
      var cliente = {
        idCliente: idCliente,
        nome: String(row[1] || "").trim() || idCliente,
        dataNascimento: String(row[2] || "").trim(),
        cidade: cidade,
        bairro: bairro
      };

      clientes.push(cliente);
      mapaClientes[idCliente] = cliente;
      if (cidade) cidadesClientes[cidade] = cidade;
      if (bairro) bairrosClientes[bairro] = bairro;
    });
  }

  clientes.sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });

  return {
    produtos: produtos,
    mapaProdutos: mapaProdutos,
    mapaFiliais: mapaFiliais,
    clientes: clientes,
    mapaClientes: mapaClientes,
    filtros: {
      produtos: produtos.map(function(p) { return { id: p.idProduto, nome: p.nome }; }),
      fornecedores: Object.keys(mapaFornecedores).map(function(id) {
        return { id: id, nome: mapaFornecedores[id] };
      }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
      categorias: Object.keys(mapaCategorias).map(function(id) {
        return { id: id, nome: mapaCategorias[id] };
      }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
      subcategorias: Object.keys(mapaSubcategorias).map(function(id) {
        return { id: id, nome: mapaSubcategorias[id] };
      }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
      filiais: Object.keys(mapaFiliais).map(function(id) {
        return { id: id, nome: mapaFiliais[id] };
      }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
      clientes: clientes.map(function(c) { return { id: c.idCliente, nome: c.nome }; }),
      cidadesClientes: Object.keys(cidadesClientes).map(function(nome) {
        return { id: nome, nome: nome };
      }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
      bairrosClientes: Object.keys(bairrosClientes).map(function(nome) {
        return { id: nome, nome: nome };
      }).sort(function(a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }),
      classesClientes: [
        { id: "A", nome: "Clientes A" },
        { id: "B", nome: "Clientes B" },
        { id: "C", nome: "Clientes C" }
      ]
    }
  };
}

function dashboardOperacionalPeriodoFiltro_(texto) {
  var bruto = String(texto || "").trim();
  if (!bruto) return { inicioTS: 0, fimTS: 0 };

  var partes = bruto.split(/\s+-\s+/).filter(Boolean);
  var inicio = dashboardOperacionalParseData_(partes[0]);
  var fim = dashboardOperacionalParseData_(partes[1] || partes[0]);

  return {
    inicioTS: inicio ? new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate(), 0, 0, 0, 0).getTime() : 0,
    fimTS: fim ? new Date(fim.getFullYear(), fim.getMonth(), fim.getDate(), 23, 59, 59, 999).getTime() : 0
  };
}

function dashboardOperacionalPassaFiltroProduto_(produto, filtros) {
  if (!produto) return false;
  if (filtros.produto && String(produto.idProduto) !== filtros.produto) return false;
  if (filtros.fornecedor && String(produto.idFornecedor) !== filtros.fornecedor) return false;
  if (filtros.categoria && String(produto.idCategoria) !== filtros.categoria) return false;
  if (filtros.subcategoria && String(produto.idSubcategoria) !== filtros.subcategoria) return false;
  return true;
}

function dashboardOperacionalOrdenarTabela_(lista, sort, campoPadrao) {
  sort = sort || {};
  var campo = sort.campo || campoPadrao || "";
  var direcao = sort.direcao || "desc";
  if (!campo) return lista;

  return lista.sort(function(a, b) {
    var va = a[campo];
    var vb = b[campo];
    var r = (typeof va === "number" || typeof vb === "number")
      ? Number(va || 0) - Number(vb || 0)
      : String(va || "").localeCompare(String(vb || ""), "pt-BR", { numeric: true });
    return direcao === "asc" ? r : -r;
  });
}

function dashboardOperacionalUltimoMesFechado_() {
  var hoje = new Date();
  return Utilities.formatDate(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1), Session.getScriptTimeZone(), "yyyy-MM");
}

function dashboardOperacionalCompostosVendas_(vendas, custoPorVenda) {
  var porMes = new Map();
  vendas.forEach(function(venda) {
    if (!venda.mesKey) return;
    if (!porMes.has(venda.mesKey)) porMes.set(venda.mesKey, { key: venda.mesKey, volume: 0, lucro: 0 });
    var item = porMes.get(venda.mesKey);
    item.volume += 1;
    item.lucro += Number(venda.faturamento || 0) - Number(custoPorVenda.get(String(venda.idCarrinho)) || 0);
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

function buscarResumoDashboardVendasInterno_(opcoes) {
  opcoes = opcoes || {};

  try {
    if (typeof buscarResumoDashboardVendasAnalitico_ === "function") {
      var resumoAnalitico = buscarResumoDashboardVendasAnalitico_(opcoes);
      if (resumoAnalitico && resumoAnalitico.sucesso) return resumoAnalitico;
    }
  } catch (erroAnalitico) {
    console.warn("Resumo analitico de vendas indisponivel. Usando base operacional.", erroAnalitico);
  }

  var filtros = opcoes.filtros || {};
  var periodo = dashboardOperacionalPeriodoFiltro_(filtros.periodo);
  var agrupamento = opcoes.periodoGrafico === "dia" ? "dia" : "mes";
  var periodoSelecionado = dashboardOperacionalNormalizarFiltro_(opcoes.periodoSelecionado);
  var itemSelecionado = dashboardOperacionalNormalizarFiltro_(opcoes.itemSelecionado);

  var ss = dashboardOperacionalObterPlanilhaFonte_();
  var dimensoes = opcoes._dimensoes || dashboardOperacionalMapearDimensoes_();
  var mapaProdutos = dimensoes.mapaProdutos;
  var carrinhosRaw = dashboardOperacionalValores_(ss.getSheetByName("VENDA_CARRINHO"), 13);
  var produtosVendaRaw = dashboardOperacionalValores_(ss.getSheetByName("VENDA_PRODUTO"), 6);

  var vendasTodas = [];
  var mapaVendas = {};
  carrinhosRaw.forEach(function(row) {
    var status = String(row[12] || "S").trim().toUpperCase();
    var idCarrinho = String(row[0] || "").trim();
    if (!idCarrinho || status === "N") return;
    var data = dashboardOperacionalParseData_(row[11]);
    var idFilial = String(row[10] || "").trim();
    var venda = {
      idCarrinho: idCarrinho,
      idFilial: idFilial,
      faturamento: dashboardOperacionalNumero_(row[4]),
      dataTS: data ? data.getTime() : 0,
      diaKey: dashboardOperacionalDiaKey_(data),
      mesKey: dashboardOperacionalMesKey_(data)
    };
    vendasTodas.push(venda);
    mapaVendas[idCarrinho] = venda;
  });

  var custoPorVendaTodos = new Map();
  var custoPorVendaFiltrado = new Map();
  var vendasPermitidas = new Set();
  var tabelaProdutos = new Map();

  produtosVendaRaw.forEach(function(row) {
    var status = String(row[5] || "S").trim().toUpperCase();
    var idCarrinho = String(row[1] || "").trim();
    var idProduto = String(row[2] || "").trim();
    if (!idCarrinho || !idProduto || status === "N") return;

    var venda = mapaVendas[idCarrinho];
    var produto = mapaProdutos[idProduto];
    if (!venda || !produto) return;

    var qtd = dashboardOperacionalNumero_(row[4]);
    var valorVenda = dashboardOperacionalNumero_(row[3]);
    var custo = Number(produto.precoCusto || 0) * qtd;
    custoPorVendaTodos.set(idCarrinho, (custoPorVendaTodos.get(idCarrinho) || 0) + custo);

    if (!dashboardOperacionalPassaFiltroProduto_(produto, filtros)) return;
    if (filtros.filial && String(venda.idFilial) !== String(filtros.filial)) return;
    if (periodo.inicioTS && Number(venda.dataTS || 0) < periodo.inicioTS) return;
    if (periodo.fimTS && Number(venda.dataTS || 0) > periodo.fimTS) return;
    if (periodoSelecionado) {
      var chavePeriodo = agrupamento === "mes" ? venda.mesKey : venda.diaKey;
      if (chavePeriodo !== periodoSelecionado) return;
    }
    if (itemSelecionado && String(idProduto) !== itemSelecionado) return;

    vendasPermitidas.add(idCarrinho);
    custoPorVendaFiltrado.set(idCarrinho, (custoPorVendaFiltrado.get(idCarrinho) || 0) + custo);

    if (!tabelaProdutos.has(idProduto)) {
      tabelaProdutos.set(idProduto, {
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

    var item = tabelaProdutos.get(idProduto);
    item.volume += qtd;
    item.faturamento += valorVenda;
    item.lucro += valorVenda - custo;
    item.qtdLinhas += 1;
  });

  var vendas = vendasTodas.filter(function(venda) {
    return vendasPermitidas.has(String(venda.idCarrinho));
  });

  var custoTotal = 0;
  vendas.forEach(function(venda) {
    custoTotal += Number(custoPorVendaFiltrado.get(String(venda.idCarrinho)) || 0);
  });
  var faturamento = vendas.reduce(function(acc, venda) { return acc + Number(venda.faturamento || 0); }, 0);
  var lucro = faturamento - custoTotal;
  var margem = faturamento ? (lucro / faturamento) * 100 : 0;

  var grafico = new Map();
  vendas.forEach(function(venda) {
    var key = agrupamento === "mes" ? venda.mesKey : venda.diaKey;
    if (!key) return;
    if (!grafico.has(key)) {
      grafico.set(key, {
        key: key,
        label: agrupamento === "mes" ? dashboardOperacionalFormatarMes_(key) : dashboardOperacionalFormatarDia_(key),
        volume: 0,
        faturamento: 0,
        lucro: 0
      });
    }
    var agg = grafico.get(key);
    agg.volume += 1;
    agg.faturamento += Number(venda.faturamento || 0);
    agg.lucro += Number(venda.faturamento || 0) - Number(custoPorVendaFiltrado.get(String(venda.idCarrinho)) || 0);
  });

  var tabela = Array.from(tabelaProdutos.values()).map(function(item) {
    item.lucroMedio = item.qtdLinhas ? item.lucro / item.qtdLinhas : 0;
    item.margemMedia = item.faturamento ? (item.lucro / item.faturamento) * 100 : 0;
    return item;
  });

  dashboardOperacionalOrdenarTabela_(tabela, opcoes.sort, "faturamento");

  return {
    sucesso: true,
    atualizadoEm: dashboardOperacionalAgora_(),
    cards: {
      carrinhos: vendas.length,
      faturamento: faturamento,
      lucro: lucro,
      margem: margem,
      ticket: vendas.length ? faturamento / vendas.length : 0
    },
    compostos: dashboardOperacionalCompostosVendas_(vendasTodas, custoPorVendaTodos),
    grafico: Array.from(grafico.values()).sort(function(a, b) { return a.key.localeCompare(b.key); }),
    tabela: tabela
  };
}

function dashboardOperacionalFormatarMes_(key) {
  var partes = String(key || "").split("-");
  if (partes.length !== 2) return key;
  var meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return meses[Number(partes[1]) - 1] + "/" + partes[0].slice(2);
}

function dashboardOperacionalFormatarDia_(key) {
  var partes = String(key || "").split("-");
  if (partes.length !== 3) return key;
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function dashboardOperacionalTipoEstoque_(tipo) {
  var texto = String(tipo || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (texto.indexOf("ENTRADA") >= 0) return "entrada";
  if (texto.indexOf("PERDA") >= 0) return "saidaPerda";
  if (texto.indexOf("VENDA") >= 0) return "saidaVenda";
  return "";
}

function buscarResumoDashboardEstoqueInterno_(opcoes) {
  opcoes = opcoes || {};

  try {
    if (typeof buscarResumoDashboardEstoqueAnalitico_ === "function") {
      var resumoAnalitico = buscarResumoDashboardEstoqueAnalitico_(opcoes);
      if (resumoAnalitico && resumoAnalitico.sucesso) return resumoAnalitico;
    }
  } catch (erroAnalitico) {
    console.warn("Resumo analitico de estoque indisponivel. Usando base operacional.", erroAnalitico);
  }

  var filtros = opcoes.filtros || {};
  var periodo = dashboardOperacionalPeriodoFiltro_(filtros.periodo);
  var agrupamento = opcoes.periodoGrafico === "dia" ? "dia" : "mes";
  var periodoSelecionado = dashboardOperacionalNormalizarFiltro_(opcoes.periodoSelecionado);
  var itemSelecionado = dashboardOperacionalNormalizarFiltro_(opcoes.itemSelecionado);

  var ss = dashboardOperacionalObterPlanilhaFonte_();
  var dimensoes = opcoes._dimensoes || dashboardOperacionalMapearDimensoes_();
  var mapaProdutos = dimensoes.mapaProdutos;
  var movimentacoesRaw = dashboardOperacionalValores_(ss.getSheetByName("EST_MOVIMENTACOES"), 14);
  var carrinhosRaw = dashboardOperacionalValores_(ss.getSheetByName("VENDA_CARRINHO"), 13);
  var produtosVendaRaw = dashboardOperacionalValores_(ss.getSheetByName("VENDA_PRODUTO"), 6);
  var nfsTabela = dashboardOperacionalTabelaComCabecalho_(ss.getSheetByName("EST_NFs"));

  var receitaProdutoVenda = {};
  var mapaVendas = {};
  var custoPorVenda = new Map();

  carrinhosRaw.forEach(function(row) {
    var status = String(row[12] || "S").trim().toUpperCase();
    var idCarrinho = String(row[0] || "").trim();
    if (!idCarrinho || status === "N") return;
    mapaVendas[idCarrinho] = {
      idCarrinho: idCarrinho,
      faturamento: dashboardOperacionalNumero_(row[4])
    };
  });

  produtosVendaRaw.forEach(function(row) {
    var status = String(row[5] || "S").trim().toUpperCase();
    if (status === "N") return;
    var idCarrinho = String(row[1] || "").trim();
    var idProduto = String(row[2] || "").trim();
    if (!idCarrinho || !idProduto || !mapaVendas[idCarrinho]) return;
    var chave = idCarrinho + "||" + idProduto;
    var produtoVenda = mapaProdutos[idProduto] || {};
    var qtdVenda = dashboardOperacionalNumero_(row[4]);
    receitaProdutoVenda[chave] = (receitaProdutoVenda[chave] || 0) + dashboardOperacionalNumero_(row[3]);
    custoPorVenda.set(idCarrinho, (custoPorVenda.get(idCarrinho) || 0) + (dashboardOperacionalNumero_(produtoVenda.precoCusto) * qtdVenda));
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
      freteTransporte: dashboardOperacionalNumero_(idxFrete >= 0 ? row[idxFrete] : row[4]),
      outrasCustas: dashboardOperacionalNumero_(idxIcms >= 0 ? row[idxIcms] : row[6]) +
        dashboardOperacionalNumero_(idxIcmsSt >= 0 ? row[idxIcmsSt] : row[7]) +
        dashboardOperacionalNumero_(idxSeguro >= 0 ? row[idxSeguro] : row[5]) +
        dashboardOperacionalNumero_(idxIpi >= 0 ? row[idxIpi] : row[8])
    };
    mapaNfs[idNf] = nf;
    mapaNfs[dashboardOperacionalIdCanonico_(idNf)] = nf;
  });

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
  var tabelaProdutos = new Map();
  var nfsSomadas = new Set();
  var vendasSaida = new Set();

  movimentacoesRaw.forEach(function(row) {
    var status = String(row[13] || "S").trim().toUpperCase();
    var idMov = String(row[0] || "").trim();
    var idProduto = String(row[5] || "").trim();
    if (!idMov || !idProduto || status === "N") return;

    var produto = mapaProdutos[idProduto];
    if (!dashboardOperacionalPassaFiltroProduto_(produto, filtros)) return;

    var idFilial = String(row[9] || "").trim();
    var dataMov = dashboardOperacionalParseData_(row[10]);
    var dataTS = dataMov ? dataMov.getTime() : 0;
    if (filtros.filial && String(idFilial) !== String(filtros.filial)) return;
    if (periodo.inicioTS && dataTS < periodo.inicioTS) return;
    if (periodo.fimTS && dataTS > periodo.fimTS) return;

    var key = agrupamento === "mes" ? dashboardOperacionalMesKey_(dataMov) : dashboardOperacionalDiaKey_(dataMov);
    if (periodoSelecionado && key !== periodoSelecionado) return;
    if (itemSelecionado && String(idProduto) !== itemSelecionado) return;

    var tipo = dashboardOperacionalTipoEstoque_(row[2]);
    if (!tipo) return;

    var qtd = dashboardOperacionalNumero_(row[6]);
    var valorTotal = qtd * dashboardOperacionalNumero_(row[7]);
    var idVenda = String(row[4] || "").trim();
    var receitaVenda = idVenda ? Number(receitaProdutoVenda[idVenda + "||" + idProduto] || 0) : 0;
    var lucroVenda = receitaVenda - valorTotal;
    var idNf = String(row[1] || "").trim();
    var nf = mapaNfs[idNf] || mapaNfs[dashboardOperacionalIdCanonico_(idNf)] || {};

    if (!grafico.has(key)) {
      grafico.set(key, {
        key: key,
        label: agrupamento === "mes" ? dashboardOperacionalFormatarMes_(key) : dashboardOperacionalFormatarDia_(key),
        entrada_volume: 0,
        entrada_faturamento: 0,
        saidaVenda_volume: 0,
        saidaVenda_faturamento: 0,
        saidaPerda_volume: 0,
        saidaPerda_faturamento: 0
      });
    }

    var g = grafico.get(key);
    g[tipo + "_volume"] += qtd;
    g[tipo + "_faturamento"] += valorTotal;

    if (!tabelaProdutos.has(idProduto)) {
      tabelaProdutos.set(idProduto, {
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

    var item = tabelaProdutos.get(idProduto);
    if (tipo === "entrada") {
      cards.qtdEntrada += qtd;
      cards.valorEntrada += valorTotal;
      item.qtdEntrada += qtd;
      item.valorEntrada += valorTotal;
      item.saldo += qtd;
      if (idNf && !nfsSomadas.has(idNf)) {
        nfsSomadas.add(idNf);
        cards.frete += Number(nf.freteTransporte || 0);
        cards.outrasCustas += Number(nf.outrasCustas || 0);
      }
    }
    if (tipo === "saidaVenda") {
      cards.qtdSaidaVenda += qtd;
      cards.custoSaidaVenda += valorTotal;
      if (idVenda) vendasSaida.add(idVenda);
      item.qtdSaidaVenda += qtd;
      item.custoSaidaVenda += valorTotal;
      item.lucroSaidaVenda += lucroVenda;
      item.saldo -= qtd;
    }
    if (tipo === "saidaPerda") {
      cards.qtdSaidaPerda += qtd;
      cards.valorSaidaPerda += valorTotal;
      item.qtdSaidaPerda += qtd;
      item.valorSaidaPerda += valorTotal;
      item.saldo -= qtd;
    }
  });

  if (vendasSaida.size) {
    cards.lucroSaidaVenda = Array.from(vendasSaida).reduce(function(acc, idVenda) {
      var venda = mapaVendas[String(idVenda)];
      if (!venda) return acc;
      return acc + Number(venda.faturamento || 0) - Number(custoPorVenda.get(String(idVenda)) || 0);
    }, 0);
  }

  var tabela = Array.from(tabelaProdutos.values());
  dashboardOperacionalOrdenarTabela_(tabela, opcoes.sort, "valorEntrada");

  return {
    sucesso: true,
    atualizadoEm: dashboardOperacionalAgora_(),
    cards: cards,
    grafico: Array.from(grafico.values()).sort(function(a, b) { return a.key.localeCompare(b.key); }),
    tabela: tabela
  };
}

function buscarResumoDashboardCategoriasInterno_(opcoes) {
  opcoes = opcoes || {};
  var filtros = opcoes.filtros || {};
  var periodo = dashboardOperacionalPeriodoFiltro_(filtros.periodo);

  var ss = dashboardOperacionalObterPlanilhaFonte_();
  var dimensoes = opcoes._dimensoes || dashboardOperacionalMapearDimensoes_();
  var mapaProdutos = dimensoes.mapaProdutos || {};
  var carrinhosRaw = dashboardOperacionalValores_(ss.getSheetByName("VENDA_CARRINHO"), 13);
  var produtosVendaRaw = dashboardOperacionalValores_(ss.getSheetByName("VENDA_PRODUTO"), 6);

  var mapaVendas = {};
  carrinhosRaw.forEach(function(row) {
    var status = String(row[12] || "S").trim().toUpperCase();
    var idCarrinho = String(row[0] || "").trim();
    if (!idCarrinho || status === "N") return;

    var data = dashboardOperacionalParseData_(row[11]);
    var idFilial = String(row[10] || "").trim();
    mapaVendas[idCarrinho] = {
      idCarrinho: idCarrinho,
      idFilial: idFilial,
      dataTS: data ? data.getTime() : 0,
      mesKey: dashboardOperacionalMesKey_(data)
    };
  });

  function criarAgg(id, nome) {
    return {
      id: id || nome || "-",
      nome: nome || "-",
      volume: 0,
      faturamento: 0,
      lucro: 0,
      margem: 0,
      qtdLinhas: 0
    };
  }

  function acumular(mapa, chave, nome, qtd, faturamento, lucro) {
    if (!mapa.has(chave)) mapa.set(chave, criarAgg(chave, nome));
    var item = mapa.get(chave);
    item.volume += qtd;
    item.faturamento += faturamento;
    item.lucro += lucro;
    item.qtdLinhas += 1;
  }

  function finalizar(lista) {
    return lista.map(function(item) {
      item.margem = item.faturamento ? (item.lucro / item.faturamento) * 100 : 0;
      return item;
    });
  }

  var categorias = new Map();
  var subcategorias = new Map();
  var crescimentoAtual = new Map();
  var crescimentoAnterior = new Map();
  var crescimentoAtualSub = new Map();
  var crescimentoAnteriorSub = new Map();
  var nomesCategoriasCrescimento = new Map();
  var ultimoMesFechado = dashboardOperacionalUltimoMesFechado_();
  var partesMes = ultimoMesFechado.split("-");
  var mesAnterior = Utilities.formatDate(new Date(Number(partesMes[0]), Number(partesMes[1]) - 2, 1), Session.getScriptTimeZone(), "yyyy-MM");

  produtosVendaRaw.forEach(function(row) {
    var statusItem = String(row[5] || "S").trim().toUpperCase();
    var idCarrinho = String(row[1] || "").trim();
    var idProduto = String(row[2] || "").trim();
    if (!idCarrinho || !idProduto || statusItem === "N") return;

    var venda = mapaVendas[idCarrinho];
    var produto = mapaProdutos[idProduto];
    if (!venda || !produto) return;

    if (filtros.filial && String(venda.idFilial) !== String(filtros.filial)) return;
    if (filtros.categoria && String(produto.idCategoria) !== String(filtros.categoria)) return;
    if (filtros.subcategoria && String(produto.idSubcategoria) !== String(filtros.subcategoria)) return;

    var qtd = dashboardOperacionalNumero_(row[4]);
    var faturamento = dashboardOperacionalNumero_(row[3]);
    var custo = dashboardOperacionalNumero_(produto.precoCusto) * qtd;
    var lucro = faturamento - custo;
    var idCategoria = String(produto.idCategoria || produto.categoria || "SEM CATEGORIA");
    var idSubcategoria = String(produto.idSubcategoria || produto.subcategoria || "SEM SUBCATEGORIA");
    nomesCategoriasCrescimento.set(idCategoria, produto.categoria || idCategoria);

    if (venda.mesKey === ultimoMesFechado) {
      crescimentoAtual.set(idCategoria, (crescimentoAtual.get(idCategoria) || 0) + qtd);
      crescimentoAtualSub.set(idSubcategoria, (crescimentoAtualSub.get(idSubcategoria) || 0) + qtd);
    }
    if (venda.mesKey === mesAnterior) {
      crescimentoAnterior.set(idCategoria, (crescimentoAnterior.get(idCategoria) || 0) + qtd);
      crescimentoAnteriorSub.set(idSubcategoria, (crescimentoAnteriorSub.get(idSubcategoria) || 0) + qtd);
    }

    if (periodo.inicioTS && Number(venda.dataTS || 0) < periodo.inicioTS) return;
    if (periodo.fimTS && Number(venda.dataTS || 0) > periodo.fimTS) return;

    acumular(categorias, idCategoria, produto.categoria || idCategoria, qtd, faturamento, lucro);
    acumular(subcategorias, idSubcategoria, produto.subcategoria || idSubcategoria, qtd, faturamento, lucro);
    subcategorias.get(idSubcategoria).categoria = produto.categoria || idCategoria;
  });

  var listaCategorias = finalizar(Array.from(categorias.values()));
  var listaSubcategorias = finalizar(Array.from(subcategorias.values()));
  var totalVolumeCat = listaCategorias.reduce(function(acc, item) { return acc + Number(item.volume || 0); }, 0);

  function maiorPor(lista, campo) {
    return (lista || []).slice().sort(function(a, b) {
      return Number(b[campo] || 0) - Number(a[campo] || 0);
    })[0] || { nome: "-", valor: 0 };
  }

  function cardPercentual(item, total, campo) {
    return {
      nome: item.nome || "-",
      valor: total ? (Number(item[campo] || 0) / total) * 100 : 0
    };
  }

  var topCategoria = maiorPor(listaCategorias, "volume");
  var topSubcategoria = maiorPor(listaSubcategorias, "volume");
  var melhorMargem = maiorPor(listaCategorias, "margem");
  var maiorFaturamento = maiorPor(listaCategorias, "faturamento");
  var maiorLucro = maiorPor(listaCategorias, "lucro");
  var totalVolumeSub = listaSubcategorias.reduce(function(acc, item) { return acc + Number(item.volume || 0); }, 0);

  var maiorCrescimento = { nome: "-", valor: 0 };
  var idsCrescimento = {};
  crescimentoAtual.forEach(function(_, id) { idsCrescimento[id] = true; });
  crescimentoAnterior.forEach(function(_, id) { idsCrescimento[id] = true; });
  Object.keys(idsCrescimento).forEach(function(id) {
    var atual = Number(crescimentoAtual.get(String(id)) || 0);
    var anterior = Number(crescimentoAnterior.get(String(id)) || 0);
    var crescimento = anterior ? ((atual - anterior) / anterior) * 100 : (atual > 0 ? 100 : 0);
    if (crescimento > Number(maiorCrescimento.valor || 0)) {
      maiorCrescimento = { nome: nomesCategoriasCrescimento.get(String(id)) || String(id), valor: crescimento };
    }
  });

  function aplicarCrescimento(lista, mapaAtual, mapaAnterior) {
    return (lista || []).map(function(item) {
      var atual = Number(mapaAtual.get(String(item.id)) || 0);
      var anterior = Number(mapaAnterior.get(String(item.id)) || 0);
      item.crescimento = anterior ? ((atual - anterior) / anterior) * 100 : (atual > 0 ? 100 : 0);
      return item;
    });
  }

  aplicarCrescimento(listaCategorias, crescimentoAtual, crescimentoAnterior);
  aplicarCrescimento(listaSubcategorias, crescimentoAtualSub, crescimentoAnteriorSub);

  return {
    sucesso: true,
    atualizadoEm: dashboardOperacionalAgora_(),
    cards: {
      topCategoria: cardPercentual(topCategoria, totalVolumeCat, "volume"),
      topSubcategoria: cardPercentual(topSubcategoria, totalVolumeSub, "volume"),
      melhorMargem: { nome: melhorMargem.nome || "-", valor: Number(melhorMargem.margem || 0) },
      maiorCrescimento: maiorCrescimento,
      maiorFaturamento: { nome: maiorFaturamento.nome || "-", valor: Number(maiorFaturamento.faturamento || 0) },
      maiorLucro: { nome: maiorLucro.nome || "-", valor: Number(maiorLucro.lucro || 0) }
    },
    categorias: listaCategorias.sort(function(a, b) { return Number(b.volume || 0) - Number(a.volume || 0); }),
    subcategorias: listaSubcategorias.sort(function(a, b) { return Number(b.volume || 0) - Number(a.volume || 0); })
  };
}

function dashboardOperacionalNormalizarTextoComparacao_(valor) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function dashboardOperacionalPassaFiltroCliente_(cliente, filtros) {
  filtros = filtros || {};
  if (!cliente) return false;
  if (filtros.cliente && String(cliente.idCliente) !== String(filtros.cliente)) return false;
  if (filtros.cidade && dashboardOperacionalNormalizarTextoComparacao_(cliente.cidade) !== dashboardOperacionalNormalizarTextoComparacao_(filtros.cidade)) return false;
  if (filtros.bairro && dashboardOperacionalNormalizarTextoComparacao_(cliente.bairro) !== dashboardOperacionalNormalizarTextoComparacao_(filtros.bairro)) return false;
  return true;
}

function dashboardOperacionalQtdMesesDistintos_(vendas) {
  var meses = {};
  (vendas || []).forEach(function(venda) {
    if (venda.mesKey) meses[venda.mesKey] = true;
  });
  return Math.max(1, Object.keys(meses).length);
}

function dashboardOperacionalDataCurta_(data) {
  if (!data) return "";
  return Utilities.formatDate(data, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

function dashboardOperacionalInfoAniversario_(valor, hoje) {
  var data = dashboardOperacionalParseData_(valor);
  if (!data) return null;

  var dia = data.getDate();
  var mes = data.getMonth();
  var proximo = new Date(hoje.getFullYear(), mes, dia, 0, 0, 0, 0);
  if (proximo.getTime() < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime()) {
    proximo = new Date(hoje.getFullYear() + 1, mes, dia, 0, 0, 0, 0);
  }

  return {
    label: Utilities.formatDate(new Date(2000, mes, dia), Session.getScriptTimeZone(), "dd/MM"),
    proximoTS: proximo.getTime()
  };
}

function buscarResumoDashboardClientesInterno_(opcoes) {
  opcoes = opcoes || {};
  var filtros = opcoes.filtros || {};
  var periodo = dashboardOperacionalPeriodoFiltro_(filtros.periodo);
  var temPeriodo = !!(periodo.inicioTS || periodo.fimTS);
  var metricaAbc = String(opcoes.metricaAbc || "volume").trim().toLowerCase();
  if (["volume", "faturamento", "lucro"].indexOf(metricaAbc) < 0) metricaAbc = "volume";

  var ss = dashboardOperacionalObterPlanilhaFonte_();
  var dimensoes = opcoes._dimensoes || dashboardOperacionalMapearDimensoes_(true);
  var mapaClientes = dimensoes.mapaClientes || {};
  var mapaProdutos = dimensoes.mapaProdutos || {};
  var carrinhosRaw = dashboardOperacionalValores_(ss.getSheetByName("VENDA_CARRINHO"), 13);
  var produtosVendaRaw = dashboardOperacionalValores_(ss.getSheetByName("VENDA_PRODUTO"), 6);

  var vendasHistoricas = [];
  var mapaVendaCliente = {};
  var primeiraCompraTS = {};

  carrinhosRaw.forEach(function(row) {
    var status = String(row[12] || "S").trim().toUpperCase();
    var idCarrinho = String(row[0] || "").trim();
    var idCliente = String(row[1] || "").trim();
    if (!idCarrinho || !idCliente || status === "N") return;

    var cliente = mapaClientes[idCliente] || {
      idCliente: idCliente,
      nome: idCliente,
      dataNascimento: "",
      cidade: "",
      bairro: ""
    };
    if (!dashboardOperacionalPassaFiltroCliente_(cliente, filtros)) return;

    var data = dashboardOperacionalParseData_(row[11]);
    var dataTS = data ? data.getTime() : 0;
    var venda = {
      idCarrinho: idCarrinho,
      idCliente: idCliente,
      cliente: cliente,
      faturamento: dashboardOperacionalNumero_(row[4]),
      lucro: dashboardOperacionalNumero_(row[4]),
      dataTS: dataTS,
      mesKey: dashboardOperacionalMesKey_(data)
    };

    vendasHistoricas.push(venda);
    mapaVendaCliente[idCarrinho] = venda;
    if (dataTS && (!primeiraCompraTS[idCliente] || dataTS < primeiraCompraTS[idCliente])) {
      primeiraCompraTS[idCliente] = dataTS;
    }
  });

  var custoPorVenda = new Map();
  produtosVendaRaw.forEach(function(row) {
    var statusProdutoVenda = String(row[5] || "S").trim().toUpperCase();
    var idCarrinho = String(row[1] || "").trim();
    var idProduto = String(row[2] || "").trim();
    if (!idCarrinho || !idProduto || statusProdutoVenda === "N" || !mapaVendaCliente[idCarrinho]) return;

    var produto = mapaProdutos[idProduto] || {};
    var qtd = dashboardOperacionalNumero_(row[4]);
    var custo = dashboardOperacionalNumero_(produto.precoCusto) * qtd;
    custoPorVenda.set(idCarrinho, (custoPorVenda.get(idCarrinho) || 0) + custo);
  });

  vendasHistoricas.forEach(function(venda) {
    venda.lucro = Number(venda.faturamento || 0) - Number(custoPorVenda.get(String(venda.idCarrinho)) || 0);
  });

  var vendasContexto = vendasHistoricas.filter(function(venda) {
    if (periodo.inicioTS && Number(venda.dataTS || 0) < periodo.inicioTS) return false;
    if (periodo.fimTS && Number(venda.dataTS || 0) > periodo.fimTS) return false;
    return true;
  });

  var regioesMunicipio = new Map();
  var regioesBairro = new Map();
  var ultimaCompraPorCliente = new Map();

  vendasContexto.forEach(function(venda) {
    var municipio = String(venda.cliente.cidade || "SEM MUNICIPIO").trim() || "SEM MUNICIPIO";
    var bairro = String(venda.cliente.bairro || "SEM BAIRRO").trim() || "SEM BAIRRO";

    function acumularRegiao(mapa, nome) {
      if (!mapa.has(nome)) mapa.set(nome, { nome: nome, volume: 0, faturamento: 0, lucro: 0 });
      var itemRegiao = mapa.get(nome);
      itemRegiao.volume += 1;
      itemRegiao.faturamento += Number(venda.faturamento || 0);
      itemRegiao.lucro += Number(venda.lucro || 0);
    }

    acumularRegiao(regioesMunicipio, municipio);
    acumularRegiao(regioesBairro, bairro);

    var idClienteVenda = String(venda.idCliente);
    var atual = ultimaCompraPorCliente.get(idClienteVenda);
    if (!atual || Number(venda.dataTS || 0) > Number(atual.dataTS || 0)) {
      ultimaCompraPorCliente.set(idClienteVenda, venda);
    }
  });

  var hojeBase = new Date();
  var hojeInicio = new Date(hojeBase.getFullYear(), hojeBase.getMonth(), hojeBase.getDate(), 0, 0, 0, 0).getTime();
  var aniversariantes = (dimensoes.clientes || []).filter(function(cliente) {
    return dashboardOperacionalPassaFiltroCliente_(cliente, filtros);
  }).map(function(cliente) {
    var infoAniversario = dashboardOperacionalInfoAniversario_(cliente.dataNascimento, hojeBase);
    if (!infoAniversario) return null;
    return {
      idCliente: cliente.idCliente,
      nome: cliente.nome || cliente.idCliente,
      cidade: cliente.cidade || "",
      aniversario: infoAniversario.label,
      proximoTS: infoAniversario.proximoTS
    };
  }).filter(function(item) {
    return !!item;
  }).sort(function(a, b) {
    return Number(a.proximoTS || 0) - Number(b.proximoTS || 0);
  });

  var semComprar = Array.from(ultimaCompraPorCliente.values()).map(function(venda) {
    var dataUltima = venda.dataTS ? new Date(venda.dataTS) : null;
    return {
      idCliente: venda.idCliente,
      nome: venda.cliente.nome || venda.idCliente,
      cidade: venda.cliente.cidade || "",
      bairro: venda.cliente.bairro || "",
      ultimaCompra: dashboardOperacionalDataCurta_(dataUltima),
      ultimaCompraTS: Number(venda.dataTS || 0),
      diasSemComprar: venda.dataTS ? Math.max(0, Math.floor((hojeInicio - new Date(dataUltima.getFullYear(), dataUltima.getMonth(), dataUltima.getDate()).getTime()) / 86400000)) : 0
    };
  }).sort(function(a, b) {
    return Number(b.diasSemComprar || 0) - Number(a.diasSemComprar || 0);
  });

  var tabelaBaseMap = new Map();
  vendasContexto.forEach(function(venda) {
    var idCliente = String(venda.idCliente);
    if (!tabelaBaseMap.has(idCliente)) {
      tabelaBaseMap.set(idCliente, {
        idCliente: idCliente,
        nome: venda.cliente.nome || idCliente,
        cidade: venda.cliente.cidade || "",
        bairro: venda.cliente.bairro || "",
        qtdCompras: 0,
        faturamento: 0,
        lucro: 0,
        meses: {}
      });
    }

    var item = tabelaBaseMap.get(idCliente);
    item.qtdCompras += 1;
    item.faturamento += Number(venda.faturamento || 0);
    item.lucro += Number(venda.lucro || 0);
    if (venda.mesKey) item.meses[venda.mesKey] = true;
  });

  function valorMetricaCliente_(item, metrica) {
    if (metrica === "faturamento") return Number(item.faturamento || 0);
    if (metrica === "lucro") return Number(item.lucro || 0);
    return Number(item.qtdCompras || 0);
  }

  var tabelaBase = Array.from(tabelaBaseMap.values());

  tabelaBase.forEach(function(item) {
    var mesesCliente = Math.max(1, Object.keys(item.meses || {}).length);
    item.ticketMedio = item.qtdCompras ? item.faturamento / item.qtdCompras : 0;
    item.frequenciaMensal = item.qtdCompras / mesesCliente;
    item.classesPorMetrica = {};
    item.valoresMetricaAbc = {
      volume: Number(item.qtdCompras || 0),
      faturamento: Number(item.faturamento || 0),
      lucro: Number(item.lucro || 0)
    };
    delete item.meses;
  });

  function calcularAbcClientesPorMetrica_(lista, metrica) {
    var ordenada = lista.slice().sort(function(a, b) {
      return valorMetricaCliente_(b, metrica) - valorMetricaCliente_(a, metrica);
    });
    var totalMetrica = ordenada.reduce(function(acc, item) {
      return acc + Math.max(0, valorMetricaCliente_(item, metrica));
    }, 0);
    var acumulado = 0;
    var abcMetrica = {
      A: { clientes: 0, faturamento: 0, metrica: 0 },
      B: { clientes: 0, faturamento: 0, metrica: 0 },
      C: { clientes: 0, faturamento: 0, metrica: 0 }
    };

    ordenada.forEach(function(item) {
      var valorParticipacao = Math.max(0, valorMetricaCliente_(item, metrica));
      var percAntes = totalMetrica ? acumulado / totalMetrica : 1;
      var classe = "C";
      if (totalMetrica > 0 && percAntes < 0.8) classe = "A";
      else if (totalMetrica > 0 && percAntes < 0.95) classe = "B";

      item.classesPorMetrica[metrica] = classe;
      abcMetrica[classe].clientes += 1;
      abcMetrica[classe].faturamento += Number(item.faturamento || 0);
      abcMetrica[classe].metrica += valorParticipacao;
      acumulado += valorParticipacao;
    });

    Object.keys(abcMetrica).forEach(function(classe) {
      abcMetrica[classe].percentBase = ordenada.length ? (abcMetrica[classe].clientes / ordenada.length) * 100 : 0;
      abcMetrica[classe].percentMetrica = totalMetrica ? (abcMetrica[classe].metrica / totalMetrica) * 100 : 0;
    });

    return abcMetrica;
  }

  var abcPorMetrica = {
    volume: calcularAbcClientesPorMetrica_(tabelaBase, "volume"),
    faturamento: calcularAbcClientesPorMetrica_(tabelaBase, "faturamento"),
    lucro: calcularAbcClientesPorMetrica_(tabelaBase, "lucro")
  };

  tabelaBase.forEach(function(item) {
    item.classe = item.classesPorMetrica[metricaAbc] || "C";
    item.valorMetricaAbc = valorMetricaCliente_(item, metricaAbc);
  });

  var classeFiltro = String(filtros.classe || "").trim().toUpperCase();
  var idsClassePermitida = {};
  var tabela = tabelaBase.filter(function(item) {
    var passa = !classeFiltro || (item.classesPorMetrica[metricaAbc] || item.classe) === classeFiltro;
    if (passa) idsClassePermitida[item.idCliente] = true;
    return passa;
  });

  var vendasCards = vendasContexto.filter(function(venda) {
    return !classeFiltro || idsClassePermitida[String(venda.idCliente)];
  });
  var clientesAtivosSet = {};
  var carrinhos = 0;
  var faturamento = 0;
  var lucro = 0;
  vendasCards.forEach(function(venda) {
    clientesAtivosSet[String(venda.idCliente)] = true;
    carrinhos += 1;
    faturamento += Number(venda.faturamento || 0);
    lucro += Number(venda.lucro || 0);
  });

  var novosClientes = 0;
  Object.keys(primeiraCompraTS).forEach(function(idCliente) {
    if (classeFiltro && !idsClassePermitida[String(idCliente)]) return;
    var tsPrimeira = Number(primeiraCompraTS[idCliente] || 0);
    if (!tsPrimeira) return;
    if (!temPeriodo || ((!periodo.inicioTS || tsPrimeira >= periodo.inicioTS) && (!periodo.fimTS || tsPrimeira <= periodo.fimTS))) {
      novosClientes += 1;
    }
  });

  var clientesInativos = 0;
  if (temPeriodo) {
    Object.keys(primeiraCompraTS).forEach(function(idCliente) {
      if (classeFiltro && !idsClassePermitida[String(idCliente)]) return;
      if (periodo.inicioTS && Number(primeiraCompraTS[idCliente] || 0) >= periodo.inicioTS) return;
      if (!clientesAtivosSet[String(idCliente)]) clientesInativos += 1;
    });
  }

  var abc = abcPorMetrica[metricaAbc] || abcPorMetrica.volume;

  var qtdClientesAtivos = Object.keys(clientesAtivosSet).length;
  var mesesFrequencia = temPeriodo ? 1 : dashboardOperacionalQtdMesesDistintos_(vendasCards);
  var frequenciaMedia = qtdClientesAtivos ? carrinhos / qtdClientesAtivos / mesesFrequencia : 0;

  dashboardOperacionalOrdenarTabela_(tabela, opcoes.sort, "faturamento");

  return {
    sucesso: true,
    atualizadoEm: dashboardOperacionalAgora_(),
    filtros: dimensoes.filtros,
    cards: {
      clientesAtivos: qtdClientesAtivos,
      novosClientes: novosClientes,
      clientesInativos: temPeriodo ? clientesInativos : 0,
      clientesInativosMensagem: temPeriodo ? "" : "selecione um periodo",
      ticketMedio: carrinhos ? faturamento / carrinhos : 0,
      frequenciaMedia: frequenciaMedia,
      frequenciaLabel: temPeriodo ? "Compras por cliente no periodo" : "Media mensal por cliente"
    },
    totais: {
      carrinhos: carrinhos,
      faturamento: faturamento,
      lucro: lucro,
      metricaAbc: metricaAbc
    },
    abc: abc,
    abcPorMetrica: abcPorMetrica,
    regioes: {
      municipio: Array.from(regioesMunicipio.values()).sort(function(a, b) { return Number(b.volume || 0) - Number(a.volume || 0); }),
      bairro: Array.from(regioesBairro.values()).sort(function(a, b) { return Number(b.volume || 0) - Number(a.volume || 0); })
    },
    aniversariantes: aniversariantes,
    semComprar: semComprar,
    tabela: tabela
  };
}

function buscarPacoteInicialDashboardOperacionalInterno_() {
  try {
    var dimensoes = dashboardOperacionalMapearDimensoes_();
    return {
      sucesso: true,
      atualizadoEm: dashboardOperacionalAgora_(),
      filtros: dimensoes.filtros,
      vendasResumo: buscarResumoDashboardVendasInterno_({ filtros: {}, periodoGrafico: "mes", sort: { campo: "faturamento", direcao: "desc" }, _dimensoes: dimensoes }),
      estoqueResumo: null,
      clientesResumo: null,
      categoriasResumo: null,
      modoAgregado: true
    };
  } catch (erro) {
    console.error("Erro ao montar pacote inicial agregado:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao montar pacote inicial do dashboard: " + erro.toString(),
      atualizadoEm: dashboardOperacionalAgora_(),
      filtros: { produtos: [], fornecedores: [], categorias: [], subcategorias: [], filiais: [], clientes: [], cidadesClientes: [], bairrosClientes: [], classesClientes: [] },
      vendasResumo: null,
      estoqueResumo: null,
      clientesResumo: null,
      categoriasResumo: null,
      modoAgregado: true
    };
  }
}

function buscarResumoDashboardVendas(opcoes) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Dashboard_Relatorios_Operacionais", "ACESSAR");
    if (!auth.sucesso) return auth;
    return buscarResumoDashboardVendasInterno_(opcoes || {});
  } catch (erro) {
    console.error("Erro ao buscar resumo de vendas:", erro);
    return { sucesso: false, mensagem: "Erro ao buscar resumo de vendas: " + erro.toString() };
  }
}

function buscarResumoDashboardEstoque(opcoes) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Dashboard_Relatorios_Operacionais", "ACESSAR");
    if (!auth.sucesso) return auth;
    return buscarResumoDashboardEstoqueInterno_(opcoes || {});
  } catch (erro) {
    console.error("Erro ao buscar resumo de estoque:", erro);
    return { sucesso: false, mensagem: "Erro ao buscar resumo de estoque: " + erro.toString() };
  }
}

function buscarResumoDashboardClientes(opcoes) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Dashboard_Relatorios_Operacionais", "ACESSAR");
    if (!auth.sucesso) return auth;
    return buscarResumoDashboardClientesInterno_(opcoes || {});
  } catch (erro) {
    console.error("Erro ao buscar resumo de clientes:", erro);
    return { sucesso: false, mensagem: "Erro ao buscar resumo de clientes: " + erro.toString() };
  }
}

function buscarResumoDashboardCategorias(opcoes) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Dashboard_Relatorios_Operacionais", "ACESSAR");
    if (!auth.sucesso) return auth;
    return buscarResumoDashboardCategoriasInterno_(opcoes || {});
  } catch (erro) {
    console.error("Erro ao buscar resumo de categorias:", erro);
    return { sucesso: false, mensagem: "Erro ao buscar resumo de categorias: " + erro.toString() };
  }
}
