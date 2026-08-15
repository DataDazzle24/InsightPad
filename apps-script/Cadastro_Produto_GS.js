// ==================================================================================================================================================
// PROMOÇÕES - FUNÇÕES AUXILIARES
// ==================================================================================================================================================

var STATUS_PROMOCAO_FINALIZADA_ = "0";
var STATUS_PROMOCAO_AGENDADA_ = "1";
var STATUS_PROMOCAO_EM_ANDAMENTO_ = "2";

function formatarDataHoraBR_(data) {
  return Utilities.formatDate(data, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
}

function parseDataHoraBR_(texto) {
  var valor = String(texto || "").trim();
  if (!valor) return null;

  var partes = valor.split(" ");
  var dataParte = partes[0] || "";
  var horaParte = partes[1] || "00:00:00";

  var d = dataParte.split("/");
  if (d.length !== 3) return null;

  var h = horaParte.split(":");
  var dia = parseInt(d[0], 10);
  var mes = parseInt(d[1], 10) - 1;
  var ano = parseInt(d[2], 10);
  var hora = parseInt(h[0] || 0, 10);
  var minuto = parseInt(h[1] || 0, 10);
  var segundo = parseInt(h[2] || 0, 10);

  var dt = new Date(ano, mes, dia, hora, minuto, segundo);
  return isNaN(dt.getTime()) ? null : dt;
}

function parseDateTimeLocal_(texto) {
  var valor = String(texto || "").trim();
  if (!valor) return null;

  var partes = valor.split("T");
  if (partes.length !== 2) return null;

  var data = partes[0].split("-");
  var hora = partes[1].split(":");

  if (data.length !== 3) return null;

  var ano = parseInt(data[0], 10);
  var mes = parseInt(data[1], 10) - 1;
  var dia = parseInt(data[2], 10);
  var hh = parseInt(hora[0] || 0, 10);
  var mm = parseInt(hora[1] || 0, 10);

  var dt = new Date(ano, mes, dia, hh, mm, 0);
  return isNaN(dt.getTime()) ? null : dt;
}

function parseMoedaBR_(valor) {
  return parseFloat(
    String(valor || "")
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  ) || 0;
}

function obterIndiceLinhaPorId_(sheet, id, colunaId) {
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return -1;

  var ids = sheet.getRange(2, colunaId, ultimaLinha - 1, 1).getValues();

  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      return i + 2;
    }
  }
  return -1;
}

function gerarNovoIdSequencial_(sheet, colunaId) {
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return 1;

  var valores = sheet.getRange(2, colunaId, ultimaLinha - 1, 1).getValues();
  var maior = 0;

  valores.forEach(function(row) {
    var n = parseInt(row[0], 10);
    if (!isNaN(n) && n > maior) maior = n;
  });

  return maior + 1;
}

function agruparLinhasContiguas_(linhas) {
  if (!linhas || !linhas.length) return [];

  var ordenadas = linhas.slice().sort(function(a, b) { return a - b; });
  var grupos = [];

  var inicio = ordenadas[0];
  var fim = ordenadas[0];

  for (var i = 1; i < ordenadas.length; i++) {
    var atual = ordenadas[i];

    if (atual === fim + 1) {
      fim = atual;
    } else {
      grupos.push({
        inicio: inicio,
        quantidade: (fim - inicio) + 1
      });
      inicio = atual;
      fim = atual;
    }
  }

  grupos.push({
    inicio: inicio,
    quantidade: (fim - inicio) + 1
  });

  return grupos;
}

function calcularStatusPromocaoPorPeriodo_(inicioDate, fimDate, agoraDate) {
  if (!inicioDate || !fimDate) return STATUS_PROMOCAO_FINALIZADA_;

  if (agoraDate.getTime() > fimDate.getTime()) {
    return STATUS_PROMOCAO_FINALIZADA_;
  }

  if (agoraDate.getTime() < inicioDate.getTime()) {
    return STATUS_PROMOCAO_AGENDADA_;
  }

  return STATUS_PROMOCAO_EM_ANDAMENTO_;
}

function obterPromocoesAbertasPorStatus_(guiaPromo) {
  var ultimaLinhaPromo = guiaPromo.getLastRow();
  if (ultimaLinhaPromo < 2) return [];

  // lê só a coluna STATUS primeiro
  var statusRows = guiaPromo.getRange(2, 8, ultimaLinhaPromo - 1, 1).getDisplayValues();
  var linhasAbertas = [];

  for (var i = 0; i < statusRows.length; i++) {
    var status = String(statusRows[i][0] || "").trim();
    if (status === STATUS_PROMOCAO_AGENDADA_ || status === STATUS_PROMOCAO_EM_ANDAMENTO_) {
      linhasAbertas.push(i + 2);
    }
  }

  if (!linhasAbertas.length) return [];

  var blocos = agruparLinhasContiguas_(linhasAbertas);
  var promocoes = [];

  blocos.forEach(function(bloco) {
    var dados = guiaPromo.getRange(bloco.inicio, 1, bloco.quantidade, 8).getDisplayValues();

    dados.forEach(function(row, idx) {
      promocoes.push({
        rowIndex: bloco.inicio + idx,
        values: row
      });
    });
  });

  return promocoes;
}

function validarSobreposicaoPromocao_(guiaPromo, idProduto, inicioDate, fimDate, idPromocaoIgnorar) {
  var ultimaLinha = guiaPromo.getLastRow();
  if (ultimaLinha < 2) return { valido: true };

  var dados = guiaPromo.getRange(2, 1, ultimaLinha - 1, 8).getDisplayValues();

  for (var i = 0; i < dados.length; i++) {
    var idPromocao = String(dados[i][0] || "").trim();
    var idProdutoLinha = String(dados[i][1] || "").trim();
    var statusLinha = String(dados[i][7] || "").trim();

    if (statusLinha !== STATUS_PROMOCAO_AGENDADA_ && statusLinha !== STATUS_PROMOCAO_EM_ANDAMENTO_) continue;
    if (idProdutoLinha !== String(idProduto)) continue;
    if (idPromocaoIgnorar && idPromocao === String(idPromocaoIgnorar)) continue;

    var inicioExistente = parseDataHoraBR_(dados[i][3]);
    var fimExistente = parseDataHoraBR_(dados[i][4]);

    if (!inicioExistente || !fimExistente) continue;

    var sobrepoe = inicioDate.getTime() <= fimExistente.getTime() &&
                   fimDate.getTime() >= inicioExistente.getTime();

    if (sobrepoe) {
      return {
        valido: false,
        mensagem: "Já existe uma promoção para este produto com período sobreposto."
      };
    }
  }

  return { valido: true };
}

function sincronizarStatusPromocoes_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var guiaProd = planilha.getSheetByName("CAD_PRODUTO");
  var guiaPromo = planilha.getSheetByName("CAD_PROMOCAO");

  if (!guiaProd || !guiaPromo) return;

  var ultimaLinhaProd = guiaProd.getLastRow();
  if (ultimaLinhaProd < 2) return;

  var agora = new Date();

  // PRODUTOS: lê só o que a sincronização precisa
  var idsProduto = guiaProd.getRange(2, 1, ultimaLinhaProd - 1, 1).getDisplayValues();
  var promocaoAtualProduto = guiaProd.getRange(2, 2, ultimaLinhaProd - 1, 2).getDisplayValues();
  var statusAtivacaoProduto = guiaProd.getRange(2, 22, ultimaLinhaProd - 1, 1).getDisplayValues();

  // PROMOÇÕES: lê detalhe completo só das linhas status 1/2
  var promocoesAbertas = obterPromocoesAbertasPorStatus_(guiaPromo);

  var atualizacoesStatusPromo = [];
  var mapaPromocaoVigentePorProduto = {};

  promocoesAbertas.forEach(function(item) {
    var row = item.values;
    var rowIndex = item.rowIndex;

    var idPromocao = String(row[0] || "").trim();
    var idProduto = String(row[1] || "").trim();
    var inicio = parseDataHoraBR_(row[3]);
    var fim = parseDataHoraBR_(row[4]);
    var statusAtual = String(row[7] || "").trim();

    var novoStatus = calcularStatusPromocaoPorPeriodo_(inicio, fim, agora);

    if (novoStatus !== statusAtual) {
      atualizacoesStatusPromo.push({
        rowIndex: rowIndex,
        status: novoStatus
      });
    }

    if (novoStatus === STATUS_PROMOCAO_EM_ANDAMENTO_ && idPromocao && idProduto) {
      if (!mapaPromocaoVigentePorProduto[idProduto]) {
        mapaPromocaoVigentePorProduto[idProduto] = {
          idPromocao: idPromocao,
          inicio: inicio
        };
      } else if (inicio && mapaPromocaoVigentePorProduto[idProduto].inicio &&
                 inicio.getTime() > mapaPromocaoVigentePorProduto[idProduto].inicio.getTime()) {
        mapaPromocaoVigentePorProduto[idProduto] = {
          idPromocao: idPromocao,
          inicio: inicio
        };
      }
    }
  });

  // atualiza apenas as promoções abertas que mudaram de status
  atualizacoesStatusPromo.forEach(function(item) {
    guiaPromo.getRange(item.rowIndex, 8).setValue(item.status);
  });

  // atualiza apenas os produtos que realmente mudaram
  var atualizacoesProduto = [];

  for (var i = 0; i < idsProduto.length; i++) {
    var rowIndexProd = i + 2;
    var idProduto = String(idsProduto[i][0] || "").trim();
    var emPromocaoAtual = String(promocaoAtualProduto[i][0] || "").trim();
    var idPromocaoAtual = String(promocaoAtualProduto[i][1] || "").trim();
    var statusAtivacao = String(statusAtivacaoProduto[i][0] || "").trim().toUpperCase();

    var novoEmPromocao = "NÃO";
    var novoIdPromocao = "";

    if (statusAtivacao !== "N") {
      var promoVigente = mapaPromocaoVigentePorProduto[idProduto];
      if (promoVigente) {
        novoEmPromocao = "SIM";
        novoIdPromocao = promoVigente.idPromocao;
      }
    }

    if (emPromocaoAtual !== novoEmPromocao || idPromocaoAtual !== novoIdPromocao) {
      atualizacoesProduto.push({
        rowIndex: rowIndexProd,
        values: [novoEmPromocao, novoIdPromocao]
      });
    }
  }

  atualizacoesProduto.forEach(function(item) {
    guiaProd.getRange(item.rowIndex, 2, 1, 2).setValues([item.values]);
  });
}

function validarTipoETamanhoProduto_(tipoTamanho, tamanho) {
  var tipo = String(tipoTamanho || "").trim().toUpperCase();
  var valorTamanho = String(tamanho || "").trim().toUpperCase();

  if (!tipo && !valorTamanho) return { valido: true };

  var tamanhosPorTipo = {
    "LETRA": ["PP", "P", "M", "G", "GG", "XG", "XXG", "XXXG", "XS", "S", "L", "XL", "XXL", "XXXL"],
    "NUMERICO": ["34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56"],
    "KILO": [
      "1 G", "2 G", "5 G", "10 G", "15 G", "20 G", "25 G", "30 G", "40 G", "50 G",
      "75 G", "80 G", "100 G", "120 G", "125 G", "150 G", "180 G", "200 G", "250 G", "300 G",
      "350 G", "400 G", "450 G", "500 G", "600 G", "700 G", "750 G", "800 G", "900 G", "1 KG",
      "1,2 KG", "1,5 KG", "2 KG", "2,5 KG", "3 KG", "4 KG", "5 KG", "10 KG", "15 KG", "20 KG"
    ],
    "LITRO": [
      "10 ML", "20 ML", "30 ML", "50 ML", "60 ML", "75 ML", "80 ML", "100 ML", "120 ML", "125 ML",
      "150 ML", "180 ML", "200 ML", "250 ML", "300 ML", "330 ML", "350 ML", "400 ML", "473 ML", "500 ML",
      "550 ML", "600 ML", "700 ML", "750 ML", "800 ML", "900 ML", "1 L", "1,2 L", "1,5 L", "1,75 L",
      "2 L", "2,5 L", "3 L", "4 L", "5 L", "6 L", "10 L", "15 L", "20 L", "25 L"
    ],
    "OUTRO": ["ÚNICO", "SOB MEDIDA"]
  };

  if (!tamanhosPorTipo[tipo]) {
    return { valido: false, mensagem: "Selecione um tipo de tamanho disponível na lista." };
  }

  if (tamanhosPorTipo[tipo].indexOf(valorTamanho) === -1) {
    return { valido: false, mensagem: "Selecione um tamanho disponível na lista do tipo escolhido." };
  }

  return { valido: true };
}












// ===================================================================================================================================================
// FUNÇÃO: CADASTRAR NOVO FORNECEDOR
// ===================================================================================================================================================

function cadastrarNovoProduto(
  nomeproduto,
  codigoInterno,
  codigoCategoria,
  codigoSubcategoria,
  ean,
  marca,
  tipoTamanho,
  tamanho,
  cor,
  codigoFornecedor,
  estmaximo,
  estminimo,
  precovenda,
  precocusto,
  produtocombo,
  observacao,
  prodsaida1, qtdsaida1, valorsaida1,
  prodsaida2, qtdsaida2, valorsaida2,
  prodsaida3, qtdsaida3, valorsaida3
) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "CADASTRAR");
    if (!auth.sucesso) return auth;

    var validacaoTamanho = validarTipoETamanhoProduto_(tipoTamanho, tamanho);
    if (!validacaoTamanho.valido) {
      return { sucesso: false, mensagem: validacaoTamanho.mensagem };
    }

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadProduto = planilha.getSheetByName("CAD_PRODUTO");
    var guiaCadSaida = planilha.getSheetByName("CAD_SAIDA_EST");

    var ultimaLinha = guiaCadProduto.getLastRow();

    if (ultimaLinha > 1) {
      var produtosExistentes = guiaCadProduto.getRange(2, 4, ultimaLinha - 1, 1).getValues();

      for (var i = 0; i < produtosExistentes.length; i++) {
        if (produtosExistentes[i][0].toString().toUpperCase() === nomeproduto) {
          return {
            sucesso: false,
            mensagem: "Este produto já existe!"
          };
        }
      }
    }

    var novoId = 1;

    if (ultimaLinha > 1) {
      var ids = guiaCadProduto.getRange(2, 1, ultimaLinha - 1, 1).getValues();
      var maiorId = 0;

      ids.forEach(function(row) {
        var id = parseInt(row[0], 10);
        if (!isNaN(id) && id > maiorId) {
          maiorId = id;
        }
      });

      novoId = maiorId + 1;
    }

    var dataHoraAtual = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "dd/MM/yyyy HH:mm:ss"
    );

    var novaLinhaProd = [
      novoId,
      "NÃO",
      "",
      nomeproduto,
      codigoInterno,
      codigoCategoria,
      codigoSubcategoria,
      ean,
      marca,
      tipoTamanho,
      tamanho,
      cor,
      codigoFornecedor,
      estmaximo,
      estminimo,
      precovenda,
      precocusto,
      observacao,
      produtocombo,
      dataHoraAtual,
      dataHoraAtual,
      "S"
    ];

    guiaCadProduto.getRange(guiaCadProduto.getLastRow() + 1, 1, 1, 22).setValues([novaLinhaProd]);

    function buscarCodigoProduto(nome) {
      if (!nome) return null;

      var ultima = guiaCadProduto.getLastRow();
      if (ultima < 2) return null;

      var nomes = guiaCadProduto.getRange(2, 4, ultima - 1, 1).getValues();

      for (var j = 0; j < nomes.length; j++) {
        if (nomes[j][0].toString().toUpperCase() === nome.toUpperCase()) {
          return guiaCadProduto.getRange(j + 2, 1).getValue();
        }
      }
      return null;
    }

    var saidas = [
      { prod: prodsaida1, qtd: qtdsaida1, valor: valorsaida1 },
      { prod: prodsaida2, qtd: qtdsaida2, valor: valorsaida2 },
      { prod: prodsaida3, qtd: qtdsaida3, valor: valorsaida3 }
    ];

    var saidasValidas = saidas.filter(function(s) {
      return s.prod && s.prod.toString().trim() !== "";
    });

    var ultimaLinhaSaida = guiaCadSaida.getLastRow();
    var novoIdSaida = 1;

    if (ultimaLinhaSaida > 1) {
      var idsSaida = guiaCadSaida.getRange(2, 1, ultimaLinhaSaida - 1, 1).getValues();
      var maiorIdSaida = 0;

      idsSaida.forEach(function(row) {
        var id = parseInt(row[0], 10);
        if (!isNaN(id) && id > maiorIdSaida) maiorIdSaida = id;
      });

      novoIdSaida = maiorIdSaida + 1;
    }

    if (produtocombo === "NÃO" || saidasValidas.length === 0) {
      var novaLinhaSaida = [
        novoIdSaida,
        novoId,
        novoId,
        1,
        precovenda
      ];
      guiaCadSaida.appendRow(novaLinhaSaida);
    } else {
      var linhasSaida = [];

      for (var k = 0; k < saidasValidas.length; k++) {
        var s = saidasValidas[k];
        var codigoProdSaida = buscarCodigoProduto(s.prod);

        if (codigoProdSaida) {
          linhasSaida.push([
            novoIdSaida + k,
            novoId,
            codigoProdSaida,
            s.qtd || 0,
            s.valor || 0
          ]);
        }
      }

      if (linhasSaida.length > 0) {
        guiaCadSaida.getRange(guiaCadSaida.getLastRow() + 1, 1, linhasSaida.length, 5).setValues(linhasSaida);
      }
    }

    return {
      sucesso: true,
      mensagem: "Produto e saídas cadastrados com sucesso!",
      produtoId: novoId
    };

  } catch (erro) {
    console.error("Erro ao cadastrar produto:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao cadastrar: " + erro.toString()
    };
  }
}













// ==================================================================================================================================================
// FUNÇÃO: BUSCAR DADOS ATUALIZADOS
// ==================================================================================================================================================

function buscarDadosAtualizadosProd() {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "ACESSAR");
    if (!auth.sucesso) return auth;

    sincronizarStatusPromocoes_();

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadProduto = planilha.getSheetByName("CAD_PRODUTO");
    var guiaCadSaida = planilha.getSheetByName("CAD_SAIDA_EST");

    var ultimaLinhaProd = guiaCadProduto.getLastRow() - 1;
    var ultimaLinhaSaida = guiaCadSaida.getLastRow() - 1;

    var dadosCompletosProd = [];
    var dadosCompletosSaida = [];

    if (ultimaLinhaProd > 0) {
      var todosOsDadosProd = guiaCadProduto.getRange(2, 1, ultimaLinhaProd, 22).getDisplayValues();

      var dadosAtivosProd = todosOsDadosProd.filter(function(linha) {
        var status = (linha[21] || "").toString().trim().toUpperCase();
        return status !== "N";
      });

      dadosCompletosProd = dadosAtivosProd.map(function(linha) {
        return linha.slice(0, 21);
      });
    }

    if (ultimaLinhaSaida > 0) {
      dadosCompletosSaida = guiaCadSaida.getRange(2, 2, ultimaLinhaSaida, 4).getDisplayValues()
        .filter(function(linha) {
          return linha.some(function(valor) {
            return String(valor || "").trim() !== "";
          });
        });
    }

    return {
      sucesso: true,
      dadosCompletosProd: dadosCompletosProd,
      dadosCompletosSaida: dadosCompletosSaida
    };

  } catch (erro) {
    console.error("Erro ao buscar dados atualizados:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao buscar dados: " + erro.toString()
    };
  }
}
















// ===========================================================================================================================================
// FUNÇÃO: EXCLUIR
// ===========================================================================================================================================

function excluirProduto(idProduto) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "EXCLUIR");
    if (!auth.sucesso) return auth;

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadProd = planilha.getSheetByName("CAD_PRODUTO");

    var ultimaLinhaProd = guiaCadProd.getLastRow();
    var idsProd = guiaCadProd.getRange(2, 1, ultimaLinhaProd - 1, 1).getValues();

    var linhaParaInativar = -1;

    for (var i = 0; i < idsProd.length; i++) {
      if (idsProd[i][0].toString() === idProduto.toString()) {
        linhaParaInativar = i + 2;
        break;
      }
    }

    if (linhaParaInativar === -1) {
      return {
        sucesso: false,
        mensagem: "Produto não encontrado!"
      };
    }

    var dataHoraAtual = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "dd/MM/yyyy HH:mm:ss"
    );

    // EDITADO_EM = coluna 21
    guiaCadProd.getRange(linhaParaInativar, 21).setValue(dataHoraAtual);

    // STATUS_ATIVAÇÃO = coluna 22
    guiaCadProd.getRange(linhaParaInativar, 22).setValue("N");

    return {
      sucesso: true,
      mensagem: "Produto inativado com sucesso!"
    };

  } catch (erro) {
    console.error("Erro ao inativar produto:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao inativar: " + erro.toString()
    };
  }
}

function excluirProdutosEmLote(idsProdutos) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "EXCLUIR");
    if (!auth.sucesso) return auth;

    idsProdutos = Array.isArray(idsProdutos) ? idsProdutos : [idsProdutos];
    idsProdutos = idsProdutos
      .map(function(id) { return String(id || "").trim(); })
      .filter(function(id) { return id !== ""; });

    if (!idsProdutos.length) {
      return {
        sucesso: false,
        mensagem: "Nenhum produto informado para inativação."
      };
    }

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadProd = planilha.getSheetByName("CAD_PRODUTO");
    var ultimaLinhaProd = guiaCadProd.getLastRow();

    if (ultimaLinhaProd < 2) {
      return {
        sucesso: false,
        mensagem: "Nenhum produto cadastrado."
      };
    }

    var mapaIds = {};
    idsProdutos.forEach(function(id) {
      mapaIds[id] = true;
    });

    var idsProd = guiaCadProd.getRange(2, 1, ultimaLinhaProd - 1, 1).getValues();
    var linhasParaInativar = [];

    for (var i = 0; i < idsProd.length; i++) {
      if (mapaIds[String(idsProd[i][0])]) {
        linhasParaInativar.push(i + 2);
      }
    }

    if (!linhasParaInativar.length) {
      return {
        sucesso: false,
        mensagem: "Nenhum produto selecionado foi encontrado."
      };
    }

    var dataHoraAtual = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "dd/MM/yyyy HH:mm:ss"
    );

    linhasParaInativar.forEach(function(linha) {
      guiaCadProd.getRange(linha, 21).setValue(dataHoraAtual);
      guiaCadProd.getRange(linha, 22).setValue("N");
    });

    return {
      sucesso: true,
      mensagem: linhasParaInativar.length === 1 ? "Produto inativado com sucesso!" : "Produtos inativados com sucesso!"
    };

  } catch (erro) {
    console.error("Erro ao inativar produtos:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao inativar: " + erro.toString()
    };
  }
}














// ==================================================================================================================================================
// FUNÇÃO: EDITAR
// ==================================================================================================================================================

function editarProduto(
  idProduto,
  novonomeproduto,
  novocodigoInterno,
  novocodigoCategoria,
  novocodigoSubcategoria,
  novoean,
  novomarca,
  novotipoTamanho,
  novotamanho,
  novacor,
  novocodigoFornecedor,
  novoestmaximo,
  novoestminimo,
  novoprecovenda,
  novoprecocusto,
  novoprodutocombo,
  novoobservacao,
  novoprodsaida1, novoqtdsaida1, novovalorsaida1,
  novoprodsaida2, novoqtdsaida2, novovalorsaida2,
  novoprodsaida3, novoqtdsaida3, novovalorsaida3
) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "EDITAR");
    if (!auth.sucesso) return auth;

    var validacaoTamanho = validarTipoETamanhoProduto_(novotipoTamanho, novotamanho);
    if (!validacaoTamanho.valido) {
      return { sucesso: false, mensagem: validacaoTamanho.mensagem };
    }

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaCadProd = planilha.getSheetByName("CAD_PRODUTO");
    var guiaCadSaida = planilha.getSheetByName("CAD_SAIDA_EST");

    var linhaParaEditar = obterIndiceLinhaPorId_(guiaCadProd, idProduto, 1);
    if (linhaParaEditar === -1) {
      return {
        sucesso: false,
        mensagem: "Produto não encontrado!"
      };
    }

    var dataHoraAtual = formatarDataHoraBR_(new Date());

    // Preserva colunas 2 e 3 (EM_PROMOCAO e ID_PROMOCAO_VIGENTE)
    var linhaAtual = guiaCadProd.getRange(linhaParaEditar, 1, 1, 22).getDisplayValues()[0];
    var emPromocaoAtual = linhaAtual[1] || "NÃO";
    var idPromocaoAtual = linhaAtual[2] || "";

    var novaLinhaProd = [
      emPromocaoAtual,         // 2 EM_PROMOCAO
      idPromocaoAtual,         // 3 ID_PROMOCAO_VIGENTE
      novonomeproduto,         // 4 NOME_PRODUTO
      novocodigoInterno,       // 5 COD_INTERNO_PROD
      novocodigoCategoria,     // 6 ID_CATEGORIA
      novocodigoSubcategoria,  // 7 ID_SUBCATEGORIA
      novoean,                 // 8 EAN
      novomarca,               // 9 MARCA
      novotipoTamanho,         // 10 TIPO_TAMANHO
      novotamanho,             // 11 TAMANHO
      novacor,                 // 12 COR
      novocodigoFornecedor,    // 13 ID_FORNECEDOR
      novoestmaximo,           // 14 EST_MAXIMO
      novoestminimo,           // 15 EST_MINIMO
      novoprecovenda,          // 16 PRECO_VENDA
      novoprecocusto,          // 17 PRECO_CUSTO
      novoobservacao,          // 18 OBSERVACAO
      novoprodutocombo         // 19 COMBO
    ];

    guiaCadProd.getRange(linhaParaEditar, 2, 1, 18).setValues([novaLinhaProd]);
    guiaCadProd.getRange(linhaParaEditar, 21).setValue(dataHoraAtual);
    guiaCadProd.getRange(linhaParaEditar, 22).setValue("S");

    // Remove saídas antigas
    var ultimaLinhaSaida = guiaCadSaida.getLastRow();
    if (ultimaLinhaSaida > 1) {
      var todasSaidas = guiaCadSaida.getRange(2, 2, ultimaLinhaSaida - 1, 1).getValues();
      var linhasParaExcluir = [];

      for (var j = 0; j < todasSaidas.length; j++) {
        if (String(todasSaidas[j][0]) === String(idProduto)) {
          linhasParaExcluir.push(j + 2);
        }
      }

      for (var k = linhasParaExcluir.length - 1; k >= 0; k--) {
        guiaCadSaida.deleteRow(linhasParaExcluir[k]);
      }
    }

    // Recria saídas
    var maiorIdSaida = gerarNovoIdSequencial_(guiaCadSaida, 1) - 1;

    function buscarCodigoProdutoPorNome(nome) {
      if (!nome) return null;

      var ultima = guiaCadProd.getLastRow();
      if (ultima < 2) return null;

      var nomes = guiaCadProd.getRange(2, 4, ultima - 1, 1).getValues();

      for (var x = 0; x < nomes.length; x++) {
        if (String(nomes[x][0]).toUpperCase() === String(nome).toUpperCase()) {
          return guiaCadProd.getRange(x + 2, 1).getValue();
        }
      }
      return null;
    }

    var novasSaidas = [];

    function adicionarSaida(prod, qtd, val) {
      if (prod && String(prod).trim() !== "") {
        var codigo = buscarCodigoProdutoPorNome(prod);
        if (codigo) {
          maiorIdSaida++;
          novasSaidas.push([maiorIdSaida, idProduto, codigo, qtd, val]);
        }
      }
    }

    if (novoprodutocombo === "NÃO") {
      maiorIdSaida++;
      novasSaidas.push([maiorIdSaida, idProduto, idProduto, 1, novoprecovenda]);
    } else {
      adicionarSaida(novoprodsaida1, novoqtdsaida1, novovalorsaida1);
      adicionarSaida(novoprodsaida2, novoqtdsaida2, novovalorsaida2);
      adicionarSaida(novoprodsaida3, novoqtdsaida3, novovalorsaida3);
    }

    if (novasSaidas.length > 0) {
      guiaCadSaida.getRange(guiaCadSaida.getLastRow() + 1, 1, novasSaidas.length, 5).setValues(novasSaidas);
    }

    sincronizarStatusPromocoes_();

    return {
      sucesso: true,
      mensagem: "Produto editado com sucesso!"
    };

  } catch (erro) {
    console.error("Erro ao editar produto:", erro.toString());
    return {
      sucesso: false,
      mensagem: "Erro ao editar: " + erro.toString()
    };
  }
}

























// ==================================================================================================================================================
// PROMOÇÕES - BUSCAR / CADASTRAR / EDITAR / EXCLUIR
// ==================================================================================================================================================

function buscarPromocaoPorId(payload) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "ACESSAR");
    if (!auth.sucesso) return auth;

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaPromo = planilha.getSheetByName("CAD_PROMOCAO");
    var guiaProd = planilha.getSheetByName("CAD_PRODUTO");

    var idPromocao = String((payload && payload.idPromocao) || "").trim();
    var idProduto = String((payload && payload.idProduto) || "").trim();

    var ultimaLinhaPromo = guiaPromo.getLastRow();
    if (ultimaLinhaPromo < 2) {
      return { sucesso: false, mensagem: "Nenhuma promoção encontrada." };
    }

    var promocoes = guiaPromo.getRange(2, 1, ultimaLinhaPromo - 1, 8).getDisplayValues();
    var promoEncontrada = null;

    for (var i = 0; i < promocoes.length; i++) {
      var row = promocoes[i];
      if (idPromocao && String(row[0]) === idPromocao) {
        promoEncontrada = row;
        break;
      }
    }

    if (!promoEncontrada && idProduto) {
      for (var j = promocoes.length - 1; j >= 0; j--) {
        var statusLinha = String(promocoes[j][7] || "").trim();
        if (String(promocoes[j][1]) === idProduto &&
            (statusLinha === STATUS_PROMOCAO_AGENDADA_ || statusLinha === STATUS_PROMOCAO_EM_ANDAMENTO_)) {
          promoEncontrada = promocoes[j];
          break;
        }
      }
    }

    if (!promoEncontrada) {
      return { sucesso: false, mensagem: "Promoção não encontrada." };
    }

    var nomeProduto = "";
    var linhaProd = obterIndiceLinhaPorId_(guiaProd, promoEncontrada[1], 1);
    if (linhaProd !== -1) {
      nomeProduto = guiaProd.getRange(linhaProd, 4).getDisplayValue();
    }

    return {
      sucesso: true,
      promocao: {
        idPromocao: promoEncontrada[0],
        idProduto: promoEncontrada[1],
        nomeProduto: nomeProduto,
        precoPromocao: promoEncontrada[2],
        inicioPromocao: promoEncontrada[3],
        fimPromocao: promoEncontrada[4],
        criadoEm: promoEncontrada[5],
        editadoEm: promoEncontrada[6],
        status: promoEncontrada[7]
      }
    };

  } catch (erro) {
    console.error("Erro ao buscar promoção:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao buscar promoção: " + erro.toString()
    };
  }
}

function cadastrarPromocao(payload) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "CADASTRAR");
    if (!auth.sucesso) return auth;

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaPromo = planilha.getSheetByName("CAD_PROMOCAO");
    var guiaProd = planilha.getSheetByName("CAD_PRODUTO");

    var idProduto = String((payload && payload.idProduto) || "").trim();
    var precoPromocaoTexto = String((payload && payload.precoPromocao) || "").trim();
    var inicioTexto = String((payload && payload.inicioPromocao) || "").trim();
    var fimTexto = String((payload && payload.fimPromocao) || "").trim();

    if (!idProduto) {
      return { sucesso: false, mensagem: "Produto inválido para promoção." };
    }

    var linhaProduto = obterIndiceLinhaPorId_(guiaProd, idProduto, 1);
    if (linhaProduto === -1) {
      return { sucesso: false, mensagem: "Produto não encontrado." };
    }

    var statusAtivacao = String(guiaProd.getRange(linhaProduto, 22).getDisplayValue() || "").trim().toUpperCase();
    if (statusAtivacao === "N") {
      return { sucesso: false, mensagem: "Não é possível criar promoção para produto inativado." };
    }

    var precoPromocao = parseMoedaBR_(precoPromocaoTexto);
    if (precoPromocao <= 0) {
      return { sucesso: false, mensagem: "Preço promocional inválido." };
    }

    var inicioDate = parseDateTimeLocal_(inicioTexto);
    var fimDate = parseDateTimeLocal_(fimTexto);

    if (!inicioDate || !fimDate) {
      return { sucesso: false, mensagem: "Período da promoção inválido." };
    }

    if (fimDate.getTime() <= inicioDate.getTime()) {
      return { sucesso: false, mensagem: "A data/hora final deve ser maior que a inicial." };
    }

    var validacaoSobreposicao = validarSobreposicaoPromocao_(guiaPromo, idProduto, inicioDate, fimDate, "");
    if (!validacaoSobreposicao.valido) {
      return validacaoSobreposicao;
    }

    var novoIdPromocao = gerarNovoIdSequencial_(guiaPromo, 1);
    var agora = new Date();
    var agoraTexto = formatarDataHoraBR_(agora);
    var statusPromocao = calcularStatusPromocaoPorPeriodo_(inicioDate, fimDate, agora);

    var novaLinha = [
      novoIdPromocao,
      idProduto,
      precoPromocaoTexto,
      formatarDataHoraBR_(inicioDate),
      formatarDataHoraBR_(fimDate),
      agoraTexto,
      agoraTexto,
      statusPromocao
    ];

    guiaPromo.getRange(guiaPromo.getLastRow() + 1, 1, 1, 8).setValues([novaLinha]);

    sincronizarStatusPromocoes_();

    return {
      sucesso: true,
      mensagem: "Promoção cadastrada com sucesso!",
      idPromocao: novoIdPromocao
    };

  } catch (erro) {
    console.error("Erro ao cadastrar promoção:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao cadastrar promoção: " + erro.toString()
    };
  }
}

function editarPromocao(payload) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "EDITAR");
    if (!auth.sucesso) return auth;

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaPromo = planilha.getSheetByName("CAD_PROMOCAO");
    var guiaProd = planilha.getSheetByName("CAD_PRODUTO");

    var idPromocao = String((payload && payload.idPromocao) || "").trim();
    var idProduto = String((payload && payload.idProduto) || "").trim();
    var precoPromocaoTexto = String((payload && payload.precoPromocao) || "").trim();
    var inicioTexto = String((payload && payload.inicioPromocao) || "").trim();
    var fimTexto = String((payload && payload.fimPromocao) || "").trim();

    if (!idPromocao || !idProduto) {
      return { sucesso: false, mensagem: "Promoção inválida para edição." };
    }

    var linhaPromocao = obterIndiceLinhaPorId_(guiaPromo, idPromocao, 1);
    if (linhaPromocao === -1) {
      return { sucesso: false, mensagem: "Promoção não encontrada." };
    }

    var linhaProduto = obterIndiceLinhaPorId_(guiaProd, idProduto, 1);
    if (linhaProduto === -1) {
      return { sucesso: false, mensagem: "Produto não encontrado." };
    }

    var statusAtivacao = String(guiaProd.getRange(linhaProduto, 22).getDisplayValue() || "").trim().toUpperCase();
    if (statusAtivacao === "N") {
      return { sucesso: false, mensagem: "Não é possível manter promoção em produto inativado." };
    }

    var precoPromocao = parseMoedaBR_(precoPromocaoTexto);
    if (precoPromocao <= 0) {
      return { sucesso: false, mensagem: "Preço promocional inválido." };
    }

    var inicioDate = parseDateTimeLocal_(inicioTexto);
    var fimDate = parseDateTimeLocal_(fimTexto);

    if (!inicioDate || !fimDate) {
      return { sucesso: false, mensagem: "Período da promoção inválido." };
    }

    if (fimDate.getTime() <= inicioDate.getTime()) {
      return { sucesso: false, mensagem: "A data/hora final deve ser maior que a inicial." };
    }

    var validacaoSobreposicao = validarSobreposicaoPromocao_(guiaPromo, idProduto, inicioDate, fimDate, idPromocao);
    if (!validacaoSobreposicao.valido) {
      return validacaoSobreposicao;
    }

    var agora = new Date();
    var agoraTexto = formatarDataHoraBR_(agora);
    var statusPromocao = calcularStatusPromocaoPorPeriodo_(inicioDate, fimDate, agora);

    var criadoEmAtual = guiaPromo.getRange(linhaPromocao, 6).getDisplayValue() || agoraTexto;

    var novaLinhaPromo = [
      idProduto,
      precoPromocaoTexto,
      formatarDataHoraBR_(inicioDate),
      formatarDataHoraBR_(fimDate),
      criadoEmAtual,
      agoraTexto,
      statusPromocao
    ];

    guiaPromo.getRange(linhaPromocao, 2, 1, 7).setValues([novaLinhaPromo]);

    sincronizarStatusPromocoes_();

    return {
      sucesso: true,
      mensagem: "Promoção editada com sucesso!"
    };

  } catch (erro) {
    console.error("Erro ao editar promoção:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao editar promoção: " + erro.toString()
    };
  }
}

function excluirPromocao(payload) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "EXCLUIR");
    if (!auth.sucesso) return auth;

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaPromo = planilha.getSheetByName("CAD_PROMOCAO");

    var idPromocao = String((payload && payload.idPromocao) || "").trim();
    if (!idPromocao) {
      return { sucesso: false, mensagem: "Promoção inválida para exclusão." };
    }

    var linhaPromocao = obterIndiceLinhaPorId_(guiaPromo, idPromocao, 1);
    if (linhaPromocao === -1) {
      return { sucesso: false, mensagem: "Promoção não encontrada." };
    }

    guiaPromo.deleteRow(linhaPromocao);

    sincronizarStatusPromocoes_();

    return {
      sucesso: true,
      mensagem: "Promoção excluída com sucesso!"
    };

  } catch (erro) {
    console.error("Erro ao excluir promoção:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao excluir promoção: " + erro.toString()
    };
  }
}


// ==================================================================================================================================================
// PROMOÇÕES - EXTRAÇÃO DO HISTÓRICO EM CSV
// ==================================================================================================================================================

function parseDataBRExtracaoPromocao_(texto, fimDoDia) {
  var valor = String(texto || "").trim();
  if (!valor) return null;

  var partes = valor.split("/");
  if (partes.length !== 3) return null;

  var dia = parseInt(partes[0], 10);
  var mes = parseInt(partes[1], 10) - 1;
  var ano = parseInt(partes[2], 10);
  var hora = fimDoDia ? 23 : 0;
  var minuto = fimDoDia ? 59 : 0;
  var segundo = fimDoDia ? 59 : 0;

  var data = new Date(ano, mes, dia, hora, minuto, segundo);
  return isNaN(data.getTime()) ? null : data;
}

function parseRangeExtracaoPromocao_(texto) {
  var valor = String(texto || "").trim();
  if (!valor) return null;

  var partes = valor.split("-").map(function(parte) {
    return String(parte || "").trim();
  });

  if (partes.length < 2) return null;

  var inicio = parseDataBRExtracaoPromocao_(partes[0], false);
  var fim = parseDataBRExtracaoPromocao_(partes[1], true);

  if (!inicio || !fim) return null;

  return {
    inicio: inicio,
    fim: fim
  };
}

function montarMapaNomeProdutoPromocao_(guiaProd) {
  var mapa = {};
  var ultimaLinhaProd = guiaProd ? guiaProd.getLastRow() : 0;

  if (ultimaLinhaProd < 2) return mapa;

  var produtos = guiaProd.getRange(2, 1, ultimaLinhaProd - 1, 4).getDisplayValues();

  produtos.forEach(function(row) {
    var id = String(row[0] || "").trim();
    var nome = String(row[3] || "").trim();
    if (id) mapa[id] = nome || ("ID " + id);
  });

  return mapa;
}

function buscarProdutosHistoricoPromocoes() {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "ACESSAR");
    if (!auth.sucesso) return auth;

    sincronizarStatusPromocoes_();

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaPromo = planilha.getSheetByName("CAD_PROMOCAO");
    var guiaProd = planilha.getSheetByName("CAD_PRODUTO");

    if (!guiaPromo || !guiaProd) {
      return {
        sucesso: false,
        mensagem: "Abas de promoções ou produtos não encontradas."
      };
    }

    var ultimaLinhaPromo = guiaPromo.getLastRow();
    if (ultimaLinhaPromo < 2) {
      return {
        sucesso: true,
        produtos: []
      };
    }

    var mapaProdutos = montarMapaNomeProdutoPromocao_(guiaProd);
    var promocoes = guiaPromo.getRange(2, 2, ultimaLinhaPromo - 1, 1).getDisplayValues();
    var nomes = {};

    promocoes.forEach(function(row) {
      var idProduto = String(row[0] || "").trim();
      if (!idProduto) return;

      var nomeProduto = mapaProdutos[idProduto] || ("ID " + idProduto);
      if (nomeProduto) nomes[nomeProduto] = true;
    });

    var produtos = Object.keys(nomes).sort(function(a, b) {
      return a.localeCompare(b, "pt-BR");
    });

    return {
      sucesso: true,
      produtos: produtos
    };

  } catch (erro) {
    console.error("Erro ao buscar produtos do histórico de promoções:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao buscar produtos do histórico: " + erro.toString()
    };
  }
}

function extrairHistoricoPromocoesCSV(payload) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Produto", "EXPORTAR");
    if (!auth.sucesso) return auth;

    sincronizarStatusPromocoes_();

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var guiaPromo = planilha.getSheetByName("CAD_PROMOCAO");
    var guiaProd = planilha.getSheetByName("CAD_PRODUTO");

    if (!guiaPromo || !guiaProd) {
      return {
        sucesso: false,
        mensagem: "Abas de promoções ou produtos não encontradas."
      };
    }

    var extrairTudo = !!(payload && payload.extrairTudo);
    var produtoFiltro = String((payload && payload.produto) || "").trim().toUpperCase();
    var periodoFiltro = String((payload && payload.periodo) || "").trim();
    var range = extrairTudo ? null : parseRangeExtracaoPromocao_(periodoFiltro);

    if (!extrairTudo && !produtoFiltro && !range) {
      return {
        sucesso: false,
        mensagem: "Informe um produto, um período ou marque a opção EXTRAIR TUDO."
      };
    }

    var ultimaLinhaPromo = guiaPromo.getLastRow();
    if (ultimaLinhaPromo < 2) {
      return {
        sucesso: true,
        cabecalho: ["ID_PROMOCAO", "PRODUTO", "PRECO_PROMOCAO", "INICIO_PROMOCAO", "FIM_PROMOCAO", "CRIADO_EM", "EDITADO_EM", "STATUS"],
        linhas: []
      };
    }

    var mapaProdutos = montarMapaNomeProdutoPromocao_(guiaProd);
    var promocoes = guiaPromo.getRange(2, 1, ultimaLinhaPromo - 1, 8).getDisplayValues();
    var linhas = [];

    promocoes.forEach(function(row) {
      var idProduto = String(row[1] || "").trim();
      var nomeProduto = mapaProdutos[idProduto] || ("ID " + idProduto);

      if (!extrairTudo && produtoFiltro && String(nomeProduto || "").trim().toUpperCase() !== produtoFiltro) {
        return;
      }

      if (!extrairTudo && range) {
        var inicioPromo = parseDataHoraBR_(row[3]);
        var fimPromo = parseDataHoraBR_(row[4]);

        if (!inicioPromo || !fimPromo) return;

        var sobrepoePeriodo = inicioPromo.getTime() <= range.fim.getTime() &&
                              fimPromo.getTime() >= range.inicio.getTime();

        if (!sobrepoePeriodo) return;
      }

      linhas.push([
        row[0],
        nomeProduto,
        row[2],
        row[3],
        row[4],
        row[5],
        row[6],
        row[7]
      ]);
    });

    return {
      sucesso: true,
      cabecalho: ["ID_PROMOCAO", "PRODUTO", "PRECO_PROMOCAO", "INICIO_PROMOCAO", "FIM_PROMOCAO", "CRIADO_EM", "EDITADO_EM", "STATUS"],
      linhas: linhas
    };

  } catch (erro) {
    console.error("Erro ao extrair histórico de promoções:", erro);
    return {
      sucesso: false,
      mensagem: "Erro ao extrair histórico de promoções: " + erro.toString()
    };
  }
}
