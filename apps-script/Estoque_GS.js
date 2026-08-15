// ===================================================================================================================================================
// FUNCOES DE APOIO - ESTOQUE
// ===================================================================================================================================================

function obterProximoIdEstoque_(guiaCadEstoque) {
  var ultimaLinha = guiaCadEstoque.getLastRow();
  var novoId = 1;

  if (ultimaLinha > 1) {
    var ids = guiaCadEstoque.getRange(2, 1, ultimaLinha - 1, 1).getValues();
    ids.forEach(function(row) {
      var id = parseInt(row[0], 10);
      if (!isNaN(id) && id >= novoId) novoId = id + 1;
    });
  }

  return novoId;
}

function obterProximoIdNfEstoque_(guiaNfs) {
  var ultimaLinha = guiaNfs.getLastRow();
  var novoId = 1;

  if (ultimaLinha > 1) {
    var ids = guiaNfs.getRange(2, 1, ultimaLinha - 1, 1).getValues();
    ids.forEach(function(row) {
      var id = parseInt(row[0], 10);
      if (!isNaN(id) && id >= novoId) novoId = id + 1;
    });
  }

  return novoId;
}

function obterProximoIdTransferencia_(guiaCadEstoque) {
  var ultimaLinha = guiaCadEstoque.getLastRow();
  var novoId = 1;

  if (ultimaLinha > 1) {
    var ids = guiaCadEstoque.getRange(2, 4, ultimaLinha - 1, 1).getValues();
    ids.forEach(function(row) {
      var id = parseInt(row[0], 10);
      if (!isNaN(id) && id >= novoId) novoId = id + 1;
    });
  }

  return novoId;
}

function obterDataHoraAtualEstoque_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "dd/MM/yyyy HH:mm:ss"
  );
}

function obterDataAtualEstoque_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "dd/MM/yyyy"
  );
}

function localizarLinhaMovimentacao_(guiaCadEstoque, idMov) {
  var ultimaLinha = guiaCadEstoque.getLastRow();
  if (ultimaLinha <= 1) return -1;

  var ids = guiaCadEstoque.getRange(2, 1, ultimaLinha - 1, 1).getValues();

  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0].toString() === idMov.toString()) return i + 2;
  }

  return -1;
}

function localizarLinhaNfEstoque_(guiaNfs, idNf) {
  var ultimaLinha = guiaNfs.getLastRow();
  if (ultimaLinha <= 1 || !idNf) return -1;

  var ids = guiaNfs.getRange(2, 1, ultimaLinha - 1, 1).getValues();

  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(idNf).trim()) return i + 2;
  }

  return -1;
}

function normalizarPayloadEstoque_(tipo, codigoProduto, qtd, valor, codigoFilial, movimentacao) {
  if (tipo && typeof tipo === "object" && !Array.isArray(tipo)) return tipo;

  return {
    tipo: tipo,
    filial: codigoFilial,
    dataMovimentacao: movimentacao,
    nfHabilitada: false,
    nf: {},
    itens: [{
      codigoProduto: codigoProduto,
      qtd: qtd,
      valorUnitario: valor,
      substituirCusto: false
    }]
  };
}

function obterValorPayload_(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

function formatarValorBancoEstoque_(valor) {
  if (valor === null || valor === undefined || valor === "") return "";

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor.toFixed(2).replace(".", ",") : "";
  }

  var texto = String(valor).trim();
  if (!texto) return "";

  var numero;
  if (texto.indexOf(",") >= 0) {
    numero = parseFloat(texto.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  } else {
    numero = parseFloat(texto.replace(/[^\d.-]/g, ""));
  }

  return Number.isFinite(numero) ? numero.toFixed(2).replace(".", ",") : "";
}

function obterNumeroValorBancoEstoque_(valor) {
  var texto = formatarValorBancoEstoque_(valor);
  if (!texto) return 0;
  return parseFloat(texto.replace(",", ".")) || 0;
}

function montarDadosEstoqueParaInterface_(linha) {
  return [
    linha[0],
    linha[1],
    linha[2],
    linha[3],
    linha[4],
    linha[5],
    linha[6],
    linha[7],
    linha[8],
    linha[9],
    linha[10],
    linha[11],
    linha[12]
  ];
}

// ===================================================================================================================================================
// CARGA OTIMIZADA DA PAGINA DE ESTOQUE
// - A abertura e os filtros trabalham com paginas de 100 movimentacoes.
// - O front recebe apenas NFs relacionadas as linhas carregadas.
// - Produto/filial sao carregados uma vez como listas auxiliares para dropdowns e de-para.
// ===================================================================================================================================================

function obterValoresEstoque_(sheet, colunas) {
  if (!sheet) return [];
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return [];
  return sheet.getRange(2, 1, ultimaLinha - 1, colunas).getDisplayValues();
}

function obterTimestampEstoque_(valor) {
  if (!valor) return 0;

  if (Object.prototype.toString.call(valor) === "[object Date]" && !isNaN(valor.getTime())) {
    return valor.getTime();
  }

  var texto = String(valor || "").trim();
  var m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (m) {
    return new Date(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1]),
      Number(m[4] || 0),
      Number(m[5] || 0),
      Number(m[6] || 0)
    ).getTime();
  }

  var data = new Date(texto);
  return isNaN(data.getTime()) ? 0 : data.getTime();
}

function obterTimestampFiltroEstoque_(valor, fimDoDia) {
  var texto = String(valor || "").trim();
  if (!texto) return 0;

  var m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return new Date(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1]),
      fimDoDia ? 23 : 0,
      fimDoDia ? 59 : 0,
      fimDoDia ? 59 : 0
    ).getTime();
  }

  return obterTimestampEstoque_(texto);
}

function normalizarTextoEstoque_(valor) {
  return String(valor || "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function obterQuantidadeEstoque_(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  var texto = String(valor || "").replace(/\u00A0/g, " ").replace(/\s/g, "").trim();
  if (!texto) return 0;
  var numero = Number(texto.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numero) ? numero : 0;
}

function montarMapasBasicosEstoque_(shProduto, shFilial) {
  var produtos = [];
  if (shProduto && shProduto.getLastRow() > 1) {
    var qtdProdutos = shProduto.getLastRow() - 1;
    var dadosBase = shProduto.getRange(2, 1, qtdProdutos, 4).getDisplayValues();
    var custos = shProduto.getRange(2, 17, qtdProdutos, 1).getDisplayValues();
    var combos = shProduto.getRange(2, 19, qtdProdutos, 1).getDisplayValues();
    var statusProdutos = shProduto.getRange(2, 22, qtdProdutos, 1).getDisplayValues();

    for (var i = 0; i < qtdProdutos; i++) {
      var status = String(statusProdutos[i][0] || "").trim().toUpperCase();
      var produto = {
        codigo: String(dadosBase[i][0] || "").trim(),
        nome: String(dadosBase[i][3] || "").trim(),
        precoCusto: custos[i][0],
        combo: String(combos[i][0] || "").trim()
      };

      if (produto.codigo && produto.nome && status !== "N") produtos.push(produto);
    }
  }

  var filiais = obterValoresEstoque_(shFilial, 2).map(function(r) {
    return {
      codigo: String(r[0] || "").trim(),
      nome: String(r[1] || "").trim()
    };
  }).filter(function(f) {
    return f.codigo && f.nome;
  });

  produtos = Array.from(new Map(produtos.map(function(p) { return [p.codigo, p]; })).values())
    .sort(function(a, b) { return a.nome.localeCompare(b.nome); });
  filiais = Array.from(new Map(filiais.map(function(f) { return [f.codigo, f]; })).values())
    .sort(function(a, b) { return a.nome.localeCompare(b.nome); });

  return {
    produtos: produtos,
    filiais: filiais,
    mapaProdutos: new Map(produtos.map(function(p) { return [p.codigo, p]; })),
    mapaFiliais: new Map(filiais.map(function(f) { return [f.codigo, f]; }))
  };
}

function filtrarMovimentacoesEstoque_(linhas, filtros) {
  filtros = filtros || {};
  var tipos = String(filtros.tipo || "").split(";").map(function(v) { return normalizarTextoEstoque_(v); }).filter(Boolean);
  var produtos = String(filtros.produto || "").split(";").map(function(v) { return String(v || "").trim(); }).filter(Boolean);
  var filiais = String(filtros.filial || "").split(";").map(function(v) { return String(v || "").trim(); }).filter(Boolean);
  var dataMovInicial = obterTimestampFiltroEstoque_(filtros.dataMovInicial, false);
  var dataMovFinal = obterTimestampFiltroEstoque_(filtros.dataMovFinal, true);
  var dataCadInicial = obterTimestampFiltroEstoque_(filtros.dataCadInicial, false);
  var dataCadFinal = obterTimestampFiltroEstoque_(filtros.dataCadFinal, true);

  return (linhas || []).filter(function(linha) {
    if (tipos.length && tipos.indexOf(normalizarTextoEstoque_(linha[2])) < 0) return false;
    if (produtos.length && produtos.indexOf(String(linha[5] || "").trim()) < 0) return false;
    if (filiais.length && filiais.indexOf(String(linha[9] || "").trim()) < 0) return false;

    if (dataMovInicial || dataMovFinal) {
      var tsMov = obterTimestampEstoque_(linha[10]);
      if (dataMovInicial && (!tsMov || tsMov < dataMovInicial)) return false;
      if (dataMovFinal && (!tsMov || tsMov > dataMovFinal)) return false;
    }

    if (dataCadInicial || dataCadFinal) {
      var tsCad = obterTimestampEstoque_(linha[11]);
      if (dataCadInicial && (!tsCad || tsCad < dataCadInicial)) return false;
      if (dataCadFinal && (!tsCad || tsCad > dataCadFinal)) return false;
    }

    return true;
  });
}

function buscarNfsPorIdsEstoque_(shNfs, idsNf) {
  if (!shNfs || !idsNf || !idsNf.size || shNfs.getLastRow() < 2) return [];

  return shNfs.getRange(2, 1, shNfs.getLastRow() - 1, 12).getDisplayValues()
    .filter(function(linha) {
      return idsNf.has(String(linha[0] || "").trim());
    });
}

function montarPacoteEstoquePaginado_(opcoes) {
  opcoes = opcoes || {};
  var offset = Math.max(0, Number(opcoes.offset || 0));
  var limite = Math.min(Math.max(Number(opcoes.limite || 100), 1), 300);
  var filtros = opcoes.filtros || {};

  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var shEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");
  var shProduto = planilha.getSheetByName("CAD_PRODUTO");
  var shFilial = planilha.getSheetByName("CAD_FILIAL");
  var shNfs = planilha.getSheetByName("EST_NFs");

  if (!shEstoque || !shProduto || !shFilial) {
    return { sucesso: false, mensagem: "Uma ou mais abas do estoque nao foram encontradas." };
  }

  var mapas = montarMapasBasicosEstoque_(shProduto, shFilial);
  var movimentos = obterValoresEstoque_(shEstoque, 14)
    .filter(function(linha) {
      return String(linha[13] || "S").trim().toUpperCase() !== "N";
    });

  var tipos = Array.from(new Set(movimentos.map(function(linha) { return String(linha[2] || "").trim(); }).filter(Boolean)))
    .sort(function(a, b) { return a.localeCompare(b); });

  movimentos = filtrarMovimentacoesEstoque_(movimentos, filtros);
  movimentos.sort(function(a, b) {
    var tsA = obterTimestampEstoque_(a[12]) || obterTimestampEstoque_(a[11]) || obterTimestampEstoque_(a[10]);
    var tsB = obterTimestampEstoque_(b[12]) || obterTimestampEstoque_(b[11]) || obterTimestampEstoque_(b[10]);
    return tsB - tsA || Number(b[0] || 0) - Number(a[0] || 0);
  });

  var total = movimentos.length;
  var pagina = movimentos.slice(offset, offset + limite).map(function(linha) {
    return montarDadosEstoqueParaInterface_(linha);
  });

  var idsNf = new Set();
  pagina.forEach(function(linha) {
    var idNf = String(linha[1] || "").trim();
    if (idNf) idsNf.add(idNf);
  });

  return {
    sucesso: true,
    dadosCompletos: pagina,
    dadosNfs: buscarNfsPorIdsEstoque_(shNfs, idsNf),
    itensProd: opcoes.apenasPagina ? [] : mapas.produtos,
    itensFil: opcoes.apenasPagina ? [] : mapas.filiais,
    listasFiltros: opcoes.apenasPagina ? {} : {
      tipos: tipos,
      produtos: mapas.produtos.map(function(p) { return p.nome; }),
      filiais: mapas.filiais.map(function(f) { return f.nome; })
    },
    paginacao: {
      offset: offset,
      limite: limite,
      retornados: pagina.length,
      total: total,
      temMais: offset + limite < total
    }
  };
}

function montarLinhaMovimentacaoEstoque_(idMov, idNf, tipo, idTransferencia, idVenda, codigoProduto, qtd, valor, valorCalculado, codigoFilial, dataMovimentacao, criadoEm, editadoEm) {
  return [
    idMov,
    idNf || "",
    tipo || "",
    idTransferencia || "",
    idVenda || "",
    codigoProduto || "",
    qtd || "",
    formatarValorBancoEstoque_(valor),
    formatarValorBancoEstoque_(valorCalculado),
    codigoFilial || "",
    dataMovimentacao || "",
    criadoEm || "",
    editadoEm || "",
    "S"
  ];
}

function salvarOuAtualizarNfEstoque_(guiaNfs, payload, idNfExistente) {
  if (!payload || !payload.nfHabilitada) return "";

  var nf = payload.nf || {};
  var idNf = idNfExistente || obterProximoIdNfEstoque_(guiaNfs);
  var linha = [
    idNf,
    obterValorPayload_(nf.numero),
    obterValorPayload_(nf.emissao),
    formatarValorBancoEstoque_(nf.valor),
    formatarValorBancoEstoque_(nf.frete),
    formatarValorBancoEstoque_(nf.seguro),
    formatarValorBancoEstoque_(nf.icms),
    formatarValorBancoEstoque_(nf.icmsSt),
    formatarValorBancoEstoque_(nf.ipi),
    obterValorPayload_(nf.cpf),
    obterValorPayload_(nf.cnpj),
    obterValorPayload_(nf.estado)
  ];

  var linhaNf = localizarLinhaNfEstoque_(guiaNfs, idNf);
  if (linhaNf === -1) {
    guiaNfs.appendRow(linha);
  } else {
    guiaNfs.getRange(linhaNf, 1, 1, 12).setValues([linha]);
  }

  return idNf;
}

function atualizarCustosProdutosEstoque_(planilha, itens) {
  if (!Array.isArray(itens) || itens.length === 0) return;

  var guiaProdutos = planilha.getSheetByName("CAD_PRODUTO");
  if (!guiaProdutos) return;

  var ultimaLinha = guiaProdutos.getLastRow();
  if (ultimaLinha <= 1) return;

  var ids = guiaProdutos.getRange(2, 1, ultimaLinha - 1, 1).getValues();
  var editadoEm = obterDataHoraAtualEstoque_();

  itens.forEach(function(item) {
    if (!item || !item.substituirCusto || !item.codigoProduto) return;

    var novoCusto = obterValorPayload_(item.custoAtual);
    if (!novoCusto) return;

    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === String(item.codigoProduto).trim()) {
        guiaProdutos.getRange(i + 2, 17).setValue(novoCusto); // PRECO_CUSTO
        guiaProdutos.getRange(i + 2, 21).setValue(editadoEm); // EDITADO_EM
        break;
      }
    }
  });
}

function inativarMovimentacoesPorNf_(guiaCadEstoque, idNf, dataHoraAtual) {
  var ultimaLinha = guiaCadEstoque.getLastRow();
  if (ultimaLinha <= 1 || !idNf) return false;

  var dados = guiaCadEstoque.getRange(2, 1, ultimaLinha - 1, 14).getValues();
  var encontrou = false;

  dados.forEach(function(linha, idx) {
    var mesmoIdNf = String(linha[1] || "").trim() === String(idNf).trim();
    var ativo = String(linha[13] || "S").trim().toUpperCase() !== "N";

    if (mesmoIdNf && ativo) {
      encontrou = true;
      guiaCadEstoque.getRange(idx + 2, 13).setValue(dataHoraAtual);
      guiaCadEstoque.getRange(idx + 2, 14).setValue("N");
    }
  });

  return encontrou;
}

// ===================================================================================================================================================
// FUNCAO: CADASTRAR NOVA MOVIMENTACAO
// ===================================================================================================================================================

function cadastrarEstoque(tipo, codigoProduto, qtd, valor, codigoFilial, movimentacao) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Estoque", "CADASTRAR");
    if (!auth.sucesso) return auth;

    var payload = normalizarPayloadEstoque_(tipo, codigoProduto, qtd, valor, codigoFilial, movimentacao);
    var itens = Array.isArray(payload.itens) ? payload.itens : [];

    if (!payload.tipo || !payload.filial || !payload.dataMovimentacao || itens.length === 0) {
      return {
        sucesso: false,
        mensagem: "Preencha tipo, filial, data e ao menos um produto."
      };
    }

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");
    var guiaNfs = planilha.getSheetByName("EST_NFs");

    var novoId = obterProximoIdEstoque_(guiaCadEstoque);
    var dataHoraAtual = obterDataHoraAtualEstoque_();
    var idNf = "";

    if (String(payload.tipo || "").trim().toUpperCase() === "ENTRADA" && guiaNfs) {
      idNf = salvarOuAtualizarNfEstoque_(guiaNfs, payload, "");
    }

    var linhas = [];
    itens.forEach(function(item) {
      if (!item || !item.codigoProduto || !item.qtd) return;
      linhas.push(montarLinhaMovimentacaoEstoque_(
        novoId++,
        idNf,
        payload.tipo,
        "",
        "",
        item.codigoProduto,
        item.qtd,
        item.valorUnitario || item.custoAtual || "",
        item.custoAtual || item.valorUnitario || "",
        payload.filial,
        payload.dataMovimentacao,
        dataHoraAtual,
        dataHoraAtual
      ));
    });

    if (linhas.length === 0) {
      return {
        sucesso: false,
        mensagem: "Informe produtos e quantidades validos."
      };
    }

    guiaCadEstoque.getRange(guiaCadEstoque.getLastRow() + 1, 1, linhas.length, 14).setValues(linhas);

    if (idNf) atualizarCustosProdutosEstoque_(planilha, itens);

    return {
      sucesso: true,
      mensagem: "Movimentacao cadastrada com sucesso!",
      idNf: idNf,
      idsMovimentacoes: linhas.map(function(linha) { return linha[0]; }),
      idMovimentacao: linhas[0] ? linhas[0][0] : ""
    };

  } catch (erro) {
    console.error("Erro ao cadastrar movimentacao:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao cadastrar: " + erro.toString()
    };
  }
}

// ==================================================================================================================================================
// FUNCAO: BUSCAR DADOS ATUALIZADOS
// ==================================================================================================================================================

function buscarDadosAtualizadosEstoque() {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Estoque", "ACESSAR");
    if (!auth.sucesso) return auth;

    // Rota leve usada pela tela de saldo.
    // Mantemos a chamada pelo metodo publico antigo porque ele ja esta exposto no google.script.run
    // em todos os carregamentos da pagina de estoque.
    var modoConsulta = String(arguments[0] || "").trim().toUpperCase();
    if (modoConsulta === "SALDO") {
      return buscarSaldoEstoque(authExtrairTokenArgumentos_(arguments));
    }

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");
    var guiaNfs = planilha.getSheetByName("EST_NFs");

    var ultimaLinha = guiaCadEstoque.getLastRow() - 1;
    var dadosAtivos = [];
    var dadosNfs = [];

    if (ultimaLinha > 0) {
      var dados = guiaCadEstoque.getRange(2, 1, ultimaLinha, 14).getDisplayValues();
      dadosAtivos = dados
        .filter(function(linha) {
          var status = String(linha[13] || "S").trim().toUpperCase();
          return status !== "N";
        })
        .map(function(linha) {
          return montarDadosEstoqueParaInterface_(linha);
        });
    }

    if (guiaNfs && guiaNfs.getLastRow() > 1) {
      dadosNfs = guiaNfs.getRange(2, 1, guiaNfs.getLastRow() - 1, 12).getDisplayValues();
    }

    return {
      sucesso: true,
      dadosCompletos: dadosAtivos,
      dadosNfs: dadosNfs
    };

  } catch (erro) {
    console.error("Erro ao buscar dados:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao buscar dados: " + erro.toString()
    };
  }
}

function buscarPaginaEstoque(offset, limite, tipo, produto, filial, dataMovInicial, dataMovFinal, dataCadInicial, dataCadFinal, tokenSessao) {
  try {
    var auth = validarPermissaoOuFalhar(tokenSessao || authExtrairTokenArgumentos_(arguments), "Estoque", "ACESSAR");
    if (!auth.sucesso) return auth;

    return montarPacoteEstoquePaginado_({
      offset: Number(offset || 0),
      limite: Number(limite || 100),
      filtros: {
        tipo: tipo || "",
        produto: produto || "",
        filial: filial || "",
        dataMovInicial: dataMovInicial || "",
        dataMovFinal: dataMovFinal || "",
        dataCadInicial: dataCadInicial || "",
        dataCadFinal: dataCadFinal || ""
      },
      apenasPagina: true
    });
  } catch (erro) {
    console.error("Erro ao buscar pagina de estoque:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao buscar pagina de estoque: " + erro.toString()
    };
  }
}

// Calcula o saldo no backend para evitar que o front precise carregar todo o historico
// apenas para abrir a visao de saldo.
function buscarSaldoEstoque(tokenSessao) {
  try {
    var auth = validarPermissaoOuFalhar(tokenSessao || authExtrairTokenArgumentos_(arguments), "Estoque", "ACESSAR");
    if (!auth.sucesso) return auth;

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var shEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");
    var shProduto = planilha.getSheetByName("CAD_PRODUTO");
    var shFilial = planilha.getSheetByName("CAD_FILIAL");

    if (!shEstoque || !shProduto || !shFilial) {
      return { sucesso: false, mensagem: "Uma ou mais abas do estoque nao foram encontradas." };
    }

    var mapas = montarMapasBasicosEstoque_(shProduto, shFilial);
    var saldos = new Map();

    obterValoresEstoque_(shEstoque, 14).forEach(function(linha) {
      var status = String(linha[13] || "S").trim().toUpperCase();
      if (status === "N") return;

      var tipo = normalizarTextoEstoque_(linha[2]);
      var produto = String(linha[5] || "").trim();
      var filial = String(linha[9] || "").trim();
      var qtd = obterQuantidadeEstoque_(linha[6]);

      if (!produto || !filial || !qtd) return;

      var fator = 0;
      if (tipo.indexOf("ENTRADA") >= 0) fator = 1;
      if (tipo.indexOf("SAIDA") >= 0) fator = -1;
      if (!fator) return;

      var chave = filial + "||" + produto;
      var atual = saldos.get(chave) || {
        filial: mapas.mapaFiliais.get(filial) ? mapas.mapaFiliais.get(filial).nome : filial,
        produto: mapas.mapaProdutos.get(produto) ? mapas.mapaProdutos.get(produto).nome : produto,
        saldo: 0
      };

      atual.saldo += qtd * fator;
      saldos.set(chave, atual);
    });

    var dadosSaldo = Array.from(saldos.values()).sort(function(a, b) {
      var filial = a.filial.localeCompare(b.filial);
      if (filial !== 0) return filial;
      return a.produto.localeCompare(b.produto);
    });

    return {
      sucesso: true,
      dadosSaldo: dadosSaldo
    };
  } catch (erro) {
    console.error("Erro ao buscar saldo de estoque:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao buscar saldo de estoque: " + erro.toString()
    };
  }
}

// Usado quando o usuario abre edicao/exclusao de uma movimentacao com NF.
// Assim a tabela principal nao precisa carregar todas as NFs nem todos os itens de cada NF.
function buscarNfComMovimentacoesEstoque(idNf, tokenSessao) {
  try {
    var auth = validarPermissaoOuFalhar(tokenSessao || authExtrairTokenArgumentos_(arguments), "Estoque", "ACESSAR");
    if (!auth.sucesso) return auth;

    idNf = String(idNf || "").trim();
    if (!idNf) return { sucesso: false, mensagem: "ID da NF nao informado." };

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var shEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");
    var shNfs = planilha.getSheetByName("EST_NFs");

    if (!shEstoque) return { sucesso: false, mensagem: "Aba EST_MOVIMENTACOES nao encontrada." };

    var movimentos = obterValoresEstoque_(shEstoque, 14)
      .filter(function(linha) {
        return String(linha[1] || "").trim() === idNf
          && String(linha[13] || "S").trim().toUpperCase() !== "N";
      })
      .map(function(linha) {
        return montarDadosEstoqueParaInterface_(linha);
      });

    var nf = [];
    if (shNfs && shNfs.getLastRow() > 1) {
      nf = shNfs.getRange(2, 1, shNfs.getLastRow() - 1, 12).getDisplayValues()
        .find(function(linha) { return String(linha[0] || "").trim() === idNf; }) || [];
    }

    return {
      sucesso: true,
      nf: nf,
      movimentacoes: movimentos
    };
  } catch (erro) {
    console.error("Erro ao buscar dados da NF:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao buscar dados da NF: " + erro.toString()
    };
  }
}

// Usado quando o usuario abre uma transferencia cuja composicao completa
// pode nao estar na pagina de 100 movimentacoes atualmente renderizada.
function buscarMovimentacoesTransferenciaEstoque(idTransferencia, tokenSessao) {
  try {
    var auth = validarPermissaoOuFalhar(tokenSessao || authExtrairTokenArgumentos_(arguments), "Estoque", "ACESSAR");
    if (!auth.sucesso) return auth;

    idTransferencia = String(idTransferencia || "").trim();
    if (!idTransferencia) return { sucesso: false, mensagem: "ID da transferencia nao informado." };

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var shEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");
    if (!shEstoque) return { sucesso: false, mensagem: "Aba EST_MOVIMENTACOES nao encontrada." };

    var movimentos = obterValoresEstoque_(shEstoque, 14)
      .filter(function(linha) {
        return String(linha[3] || "").trim() === idTransferencia
          && String(linha[13] || "S").trim().toUpperCase() !== "N";
      })
      .map(function(linha) {
        return montarDadosEstoqueParaInterface_(linha);
      });

    return {
      sucesso: true,
      movimentacoes: movimentos
    };
  } catch (erro) {
    console.error("Erro ao buscar transferencia:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao buscar transferencia: " + erro.toString()
    };
  }
}

// ===========================================================================================================================================
// FUNCAO: EXCLUIR ESTOQUE - EXCLUSAO LOGICA
// ===========================================================================================================================================

function excluirEstoque(idMov) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Estoque", "EXCLUIR");
    if (!auth.sucesso) return auth;

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");
    var linhaParaExcluir = localizarLinhaMovimentacao_(guiaCadEstoque, idMov);

    if (linhaParaExcluir === -1) {
      return {
        sucesso: false,
        mensagem: "Movimentacao nao encontrada!"
      };
    }

    var dataHoraAtual = obterDataHoraAtualEstoque_();
    var dadosLinha = guiaCadEstoque.getRange(linhaParaExcluir, 1, 1, 14).getValues()[0];
    var idNf = String(dadosLinha[1] || "").trim();
    var idTransferencia = String(dadosLinha[3] || "").trim();

    if (idNf) {
      inativarMovimentacoesPorNf_(guiaCadEstoque, idNf, dataHoraAtual);
    } else if (idTransferencia) {
      var ultimaLinha = guiaCadEstoque.getLastRow();
      var dadosTransferencia = guiaCadEstoque.getRange(2, 1, ultimaLinha - 1, 14).getValues();

      dadosTransferencia.forEach(function(linha, idx) {
        if (String(linha[3] || "").trim() === idTransferencia) {
          guiaCadEstoque.getRange(idx + 2, 13).setValue(dataHoraAtual);
          guiaCadEstoque.getRange(idx + 2, 14).setValue("N");
        }
      });
    } else {
      guiaCadEstoque.getRange(linhaParaExcluir, 13).setValue(dataHoraAtual);
      guiaCadEstoque.getRange(linhaParaExcluir, 14).setValue("N");
    }

    return {
      sucesso: true,
      mensagem: "Movimentacao excluida com sucesso!"
    };

  } catch (erro) {
    console.error("Erro ao excluir movimentacao:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao excluir: " + erro.toString()
    };
  }
}

// ===========================================================================================================================================
// FUNCAO: EXCLUIR APENAS UM PRODUTO DA NF - EXCLUSAO LOGICA
// ===========================================================================================================================================

function excluirProdutoNfEstoque(idMov) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Estoque", "EXCLUIR");
    if (!auth.sucesso) return auth;

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");
    var linhaParaExcluir = localizarLinhaMovimentacao_(guiaCadEstoque, idMov);

    if (linhaParaExcluir === -1) {
      return {
        sucesso: false,
        mensagem: "Movimentacao nao encontrada!"
      };
    }

    var dadosLinha = guiaCadEstoque.getRange(linhaParaExcluir, 1, 1, 14).getValues()[0];
    var idNf = String(dadosLinha[1] || "").trim();
    var statusAtual = String(dadosLinha[13] || "S").trim().toUpperCase();

    if (!idNf) {
      return {
        sucesso: false,
        mensagem: "Esta movimentacao nao possui NF vinculada."
      };
    }

    if (statusAtual === "N") {
      return {
        sucesso: false,
        mensagem: "Esta movimentacao ja esta inativa."
      };
    }

    var dataHoraAtual = obterDataHoraAtualEstoque_();
    guiaCadEstoque.getRange(linhaParaExcluir, 13).setValue(dataHoraAtual);
    guiaCadEstoque.getRange(linhaParaExcluir, 14).setValue("N");

    return {
      sucesso: true,
      mensagem: "Produto excluido da NF com sucesso!"
    };

  } catch (erro) {
    console.error("Erro ao excluir produto da NF:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao excluir produto da NF: " + erro.toString()
    };
  }
}

// ==================================================================================================================================================
// FUNCAO: EDITAR ESTOQUE
// ==================================================================================================================================================

function editarEstoque(idMov, novotipo, novocodigoProduto, novaqtd, novovalor, novocodigoFilial, novadata) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Estoque", "EDITAR");
    if (!auth.sucesso) return auth;

    var payload = normalizarPayloadEstoque_(novotipo, novocodigoProduto, novaqtd, novovalor, novocodigoFilial, novadata);
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");
    var guiaNfs = planilha.getSheetByName("EST_NFs");
    var linhaParaEditar = localizarLinhaMovimentacao_(guiaCadEstoque, idMov);

    if (linhaParaEditar === -1) {
      return {
        sucesso: false,
        mensagem: "Movimentacao nao encontrada!"
      };
    }

    var dados = guiaCadEstoque.getRange(linhaParaEditar, 1, 1, 14).getValues()[0];
    var status = String(dados[13] || "S").trim().toUpperCase();
    var idNfOriginal = String(dados[1] || "").trim();
    var idTransferencia = String(dados[3] || "").trim();

    if (status === "N") {
      return {
        sucesso: false,
        mensagem: "Movimentacao inativa nao pode ser editada!"
      };
    }

    if (idTransferencia) {
      return {
        sucesso: false,
        mensagem: "Movimentacoes de transferencia nao podem ser editadas diretamente!"
      };
    }

    var dataHoraAtual = obterDataHoraAtualEstoque_();
    var tipoPayload = String(payload.tipo || "").trim().toUpperCase();
    var itens = Array.isArray(payload.itens) ? payload.itens : [];

    if (tipoPayload === "ENTRADA" && payload.nfHabilitada) {
      var idNf = guiaNfs ? salvarOuAtualizarNfEstoque_(guiaNfs, payload, idNfOriginal) : idNfOriginal;
      if (idNfOriginal) {
        inativarMovimentacoesPorNf_(guiaCadEstoque, idNfOriginal, dataHoraAtual);
      } else {
        guiaCadEstoque.getRange(linhaParaEditar, 13).setValue(dataHoraAtual);
        guiaCadEstoque.getRange(linhaParaEditar, 14).setValue("N");
      }

      var novoIdMov = obterProximoIdEstoque_(guiaCadEstoque);
      var linhas = [];
      itens.forEach(function(item) {
        if (!item || !item.codigoProduto || !item.qtd) return;
        linhas.push(montarLinhaMovimentacaoEstoque_(
          novoIdMov++,
          idNf,
          payload.tipo,
          "",
          "",
          item.codigoProduto,
          item.qtd,
          item.valorUnitario || item.custoAtual || "",
          item.custoAtual || item.valorUnitario || "",
          payload.filial,
          payload.dataMovimentacao,
          dataHoraAtual,
          dataHoraAtual
        ));
      });

      if (linhas.length === 0) {
        return {
          sucesso: false,
          mensagem: "Informe produtos e quantidades validos."
        };
      }

      guiaCadEstoque.getRange(guiaCadEstoque.getLastRow() + 1, 1, linhas.length, 14).setValues(linhas);
      atualizarCustosProdutosEstoque_(planilha, itens);
    } else {
      var itemUnico = itens[0] || {};
      guiaCadEstoque.getRange(linhaParaEditar, 2).setValue("");
      guiaCadEstoque.getRange(linhaParaEditar, 3).setValue(payload.tipo);
      guiaCadEstoque.getRange(linhaParaEditar, 6).setValue(itemUnico.codigoProduto || "");
      guiaCadEstoque.getRange(linhaParaEditar, 7).setValue(itemUnico.qtd || "");
      guiaCadEstoque.getRange(linhaParaEditar, 8).setValue(formatarValorBancoEstoque_(itemUnico.valorUnitario || itemUnico.custoAtual || ""));
      guiaCadEstoque.getRange(linhaParaEditar, 9).setValue(formatarValorBancoEstoque_(itemUnico.custoAtual || itemUnico.valorUnitario || ""));
      guiaCadEstoque.getRange(linhaParaEditar, 10).setValue(payload.filial);
      guiaCadEstoque.getRange(linhaParaEditar, 11).setValue(payload.dataMovimentacao);
      guiaCadEstoque.getRange(linhaParaEditar, 13).setValue(dataHoraAtual);
    }

    return {
      sucesso: true,
      mensagem: "Movimentacao editada com sucesso!"
    };

  } catch (erro) {
    console.error("Erro ao editar movimentacao:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao editar: " + erro.toString()
    };
  }
}

// ==================================================================================================================================================
// FUNCAO: CADASTRAR TRANSFERENCIA DE ESTOQUE
// ==================================================================================================================================================

function cadastrarTransferenciaEstoque(codigoFilialOrigem, codigoFilialDestino, itensTransferencia) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Estoque", "CADASTRAR");
    if (!auth.sucesso) return auth;

    if (!codigoFilialOrigem || !codigoFilialDestino || codigoFilialOrigem === codigoFilialDestino) {
      return {
        sucesso: false,
        mensagem: "Informe filiais de origem e destino diferentes."
      };
    }

    if (!Array.isArray(itensTransferencia) || itensTransferencia.length === 0) {
      return {
        sucesso: false,
        mensagem: "Informe ao menos um produto para transferencia."
      };
    }

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");

    var novoIdMov = obterProximoIdEstoque_(guiaCadEstoque);
    var novoIdTransferencia = obterProximoIdTransferencia_(guiaCadEstoque);
    var dataHoraAtual = obterDataHoraAtualEstoque_();
    var dataMovimentacao = obterDataAtualEstoque_();
    var linhas = [];

    itensTransferencia.forEach(function(item) {
      var codigoProduto = String(item.codigoProduto || "").trim();
      var qtd = String(item.qtd || "").trim();

      if (!codigoProduto || !qtd) return;

      linhas.push(montarLinhaMovimentacaoEstoque_(
        novoIdMov++,
        "",
        "SAIDA TRANSFERENCIA",
        novoIdTransferencia,
        "",
        codigoProduto,
        qtd,
        "",
        "",
        codigoFilialOrigem,
        dataMovimentacao,
        dataHoraAtual,
        dataHoraAtual
      ));

      linhas.push(montarLinhaMovimentacaoEstoque_(
        novoIdMov++,
        "",
        "ENTRADA TRANSFERENCIA",
        novoIdTransferencia,
        "",
        codigoProduto,
        qtd,
        "",
        "",
        codigoFilialDestino,
        dataMovimentacao,
        dataHoraAtual,
        dataHoraAtual
      ));
    });

    if (linhas.length === 0) {
      return {
        sucesso: false,
        mensagem: "Informe produtos e quantidades validos para transferencia."
      };
    }

    guiaCadEstoque.getRange(guiaCadEstoque.getLastRow() + 1, 1, linhas.length, 14).setValues(linhas);

    return {
      sucesso: true,
      mensagem: "Transferencia cadastrada com sucesso!",
      idTransferencia: novoIdTransferencia
    };

  } catch (erro) {
    console.error("Erro ao cadastrar transferencia:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao cadastrar transferencia: " + erro.toString()
    };
  }
}

// ==================================================================================================================================================
// FUNCAO: EDITAR TRANSFERENCIA DE ESTOQUE
// ==================================================================================================================================================

function editarTransferenciaEstoque(idTransferencia, codigoFilialOrigem, codigoFilialDestino, itensTransferencia) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Estoque", "EDITAR");
    if (!auth.sucesso) return auth;

    if (!idTransferencia) {
      return {
        sucesso: false,
        mensagem: "Transferencia nao encontrada para edicao."
      };
    }

    if (!codigoFilialOrigem || !codigoFilialDestino || codigoFilialOrigem === codigoFilialDestino) {
      return {
        sucesso: false,
        mensagem: "Informe filiais de origem e destino diferentes."
      };
    }

    if (!Array.isArray(itensTransferencia) || itensTransferencia.length === 0) {
      return {
        sucesso: false,
        mensagem: "Informe ao menos um produto para transferencia."
      };
    }

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadEstoque = planilha.getSheetByName("EST_MOVIMENTACOES");
    var ultimaLinha = guiaCadEstoque.getLastRow();

    if (ultimaLinha <= 1) {
      return {
        sucesso: false,
        mensagem: "Transferencia nao encontrada."
      };
    }

    var dataHoraAtual = obterDataHoraAtualEstoque_();
    var dataMovimentacao = obterDataAtualEstoque_();
    var dados = guiaCadEstoque.getRange(2, 1, ultimaLinha - 1, 14).getValues();
    var encontrou = false;

    dados.forEach(function(linha, idx) {
      var mesmoId = String(linha[3] || "").trim() === String(idTransferencia).trim();
      var ativo = String(linha[13] || "S").trim().toUpperCase() !== "N";

      if (mesmoId && ativo) {
        encontrou = true;
        guiaCadEstoque.getRange(idx + 2, 13).setValue(dataHoraAtual);
        guiaCadEstoque.getRange(idx + 2, 14).setValue("N");
      }
    });

    if (!encontrou) {
      return {
        sucesso: false,
        mensagem: "Transferencia ativa nao encontrada."
      };
    }

    var novoIdMov = obterProximoIdEstoque_(guiaCadEstoque);
    var linhas = [];

    itensTransferencia.forEach(function(item) {
      var codigoProduto = String(item.codigoProduto || "").trim();
      var qtd = String(item.qtd || "").trim();

      if (!codigoProduto || !qtd) return;

      linhas.push(montarLinhaMovimentacaoEstoque_(
        novoIdMov++,
        "",
        "SAIDA TRANSFERENCIA",
        idTransferencia,
        "",
        codigoProduto,
        qtd,
        "",
        "",
        codigoFilialOrigem,
        dataMovimentacao,
        dataHoraAtual,
        dataHoraAtual
      ));

      linhas.push(montarLinhaMovimentacaoEstoque_(
        novoIdMov++,
        "",
        "ENTRADA TRANSFERENCIA",
        idTransferencia,
        "",
        codigoProduto,
        qtd,
        "",
        "",
        codigoFilialDestino,
        dataMovimentacao,
        dataHoraAtual,
        dataHoraAtual
      ));
    });

    if (linhas.length === 0) {
      return {
        sucesso: false,
        mensagem: "Informe produtos e quantidades validos para transferencia."
      };
    }

    guiaCadEstoque.getRange(guiaCadEstoque.getLastRow() + 1, 1, linhas.length, 14).setValues(linhas);

    return {
      sucesso: true,
      mensagem: "Transferencia editada com sucesso!"
    };

  } catch (erro) {
    console.error("Erro ao editar transferencia:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao editar transferencia: " + erro.toString()
    };
  }
}
