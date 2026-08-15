// =================================================================================================
// GS (Apps Script) - SALVAR VENDA PDV
// Recebe um payload do JS e grava em:
// 1) VENDA_CARRINHO
// 2) VENDA_PRODUTO
// 3) EST_MOVIMENTACOES
// =================================================================================================

function salvarVendaPDV(payload) {
  var lock = null;

  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Caixa", "CADASTRAR");
    if (!auth.sucesso) return auth;

    lock = LockService.getScriptLock();
    lock.waitLock(30000);

    return salvarVendaPDVInterno_(payload);
  } catch (e) {
    console.error(e);
    return { sucesso: false, mensagem: "Erro ao salvar venda: " + (e && e.message ? e.message : e) };
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}

function salvarVendaPDVInterno_(payload) {
  try {
    if (!payload || !payload.carrinho || !Array.isArray(payload.produtos) || !Array.isArray(payload.movimentos)) {
      return { sucesso: false, mensagem: "Payload inválido." };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const shCarrinho = ss.getSheetByName("VENDA_CARRINHO");
    const shProduto  = ss.getSheetByName("VENDA_PRODUTO");
    const shEst      = ss.getSheetByName("EST_MOVIMENTACOES");

    if (!shCarrinho || !shProduto || !shEst) {
      return { sucesso: false, mensagem: "Uma ou mais abas não foram encontradas (VENDA_CARRINHO, VENDA_PRODUTO, EST_MOVIMENTACOES)." };
    }

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const getNextId = (sheet) => {
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return 1; // assumindo cabeçalho na linha 1
      const lastVal = sheet.getRange(lastRow, 1).getValue();
      const n = Number(lastVal);
      return Number.isFinite(n) && n > 0 ? n + 1 : 1;
    };

    // ------------------------------------------------------------------
    // 7) VENDA_CARRINHO (1 linha)
    // colunas: [A=idCarrinho, B=idCliente, C=total, D=desconto, E=totalComDesconto,
    //           F=forma1, G=valor1, H=forma2, I=valor2, J=troco, K=filial, L=dataHora, M=status]
    // ------------------------------------------------------------------
    const idCarrinho = getNextId(shCarrinho);
    const c = payload.carrinho;

    const rowCarrinho = [
      idCarrinho,
      String(c.idCliente || "").trim(),
      toNum(c.total),
      toNum(c.desconto),
      toNum(c.totalComDesconto),
      String(c.forma1 || "").trim(),
      toNum(c.valor1),
      String(c.forma2 || "").trim(),
      toNum(c.valor2),
      toNum(c.troco),
      String(c.filial || "").trim(),
      String(c.dataHora || "").trim(),
      "S"
    ];

    shCarrinho.appendRow(rowCarrinho);

    // ------------------------------------------------------------------
    // 8) VENDA_PRODUTO (N linhas)
    // colunas: [A=idVendaProduto, B=idCarrinho, C=codigoprod, D=valor, E=qtd, F=status]
    // e cria mapa soldIndex -> idVendaProduto
    // ------------------------------------------------------------------
    let nextVendaProdId = getNextId(shProduto);

    const produtos = payload.produtos;
    const linhasProduto = [];
    const mapSoldIndexToVendaProdId = new Map();

    produtos.forEach((p) => {
      const soldIndex = Number(p.soldIndex);
      const idVendaProd = nextVendaProdId++;

      mapSoldIndexToVendaProdId.set(soldIndex, idVendaProd);

      linhasProduto.push([
        idVendaProd,
        idCarrinho,
        String(p.codigoprod || "").trim(),
        toNum(p.valor),
        toNum(p.qtd),
        "S"
      ]);
    });

    if (linhasProduto.length > 0) {
      const startRow = shProduto.getLastRow() + 1;
      shProduto.getRange(startRow, 1, linhasProduto.length, linhasProduto[0].length).setValues(linhasProduto);
    }

    // ------------------------------------------------------------------
    // 9) EST_MOVIMENTACOES (N linhas)
    // colunas: [A=idMov, B=idNf, C=tipomov, D=idTransferencia, E=idCarrinho, F=codigosaida,
    //           G=qtd, H=valor bruto, I=valor calculado, J=filial, K=dataMov,
    //           L=dataHoraCriacao, M=dataHoraAlteracao, N=status]
    // obs: idVendaProduto é resolvido pelo soldIndex (pode repetir)
    // ------------------------------------------------------------------
    let nextMovId = getNextId(shEst);

    const movimentos = payload.movimentos;
    const linhasEst = [];

    movimentos.forEach((m) => {
      const soldIndex = Number(m.soldIndex);
      const idVendaProd = mapSoldIndexToVendaProdId.get(soldIndex);

      if (!idVendaProd) {
        // Se não achar vínculo, ignora (ou você pode retornar erro)
        return;
      }

      linhasEst.push([
        nextMovId++,
        "",
        String(m.tipomov || "SAÍDA VENDA").trim(),
        "",
        idCarrinho,
        String(m.codigosaida || "").trim(),
        toNum(m.qtd),
        formatarValorBancoEstoque_(toNum(m.valor)),
        "",
        String(m.filial || "").trim(),
        String(m.dataMov || "").trim(),
        String(m.dataHora || "").trim(),
        String(m.dataHora || "").trim(),
        "S"
      ]);
    });

    if (linhasEst.length > 0) {
      const startRow = shEst.getLastRow() + 1;
      shEst.getRange(startRow, 1, linhasEst.length, linhasEst[0].length).setValues(linhasEst);
    }

    return {
      sucesso: true,
      idCarrinho: idCarrinho,
      qtdProdutos: linhasProduto.length,
      qtdMovimentos: linhasEst.length
    };

  } catch (e) {
    console.error(e);
    return { sucesso: false, mensagem: "Erro ao salvar venda: " + (e && e.message ? e.message : e) };
  }
}

function sincronizarVendasOfflineCaixa(vendas) {
  var lock = null;

  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Caixa", "CADASTRAR");
    if (!auth.sucesso) return auth;

    if (!Array.isArray(vendas) || vendas.length === 0) {
      return { sucesso: true, resultados: [], mensagem: "Nenhuma venda offline pendente." };
    }

    lock = LockService.getScriptLock();
    lock.waitLock(30000);

    const resultados = [];

    vendas.forEach(function(item) {
      const idLocal = item && item.idLocal ? String(item.idLocal).trim() : "";
      const payload = item && item.payload ? item.payload : item;

      try {
        const resp = salvarVendaPDVInterno_(payload);
        resultados.push({
          idLocal: idLocal,
          sucesso: !!(resp && resp.sucesso),
          idCarrinho: resp && resp.idCarrinho ? resp.idCarrinho : "",
          qtdProdutos: resp && resp.qtdProdutos ? resp.qtdProdutos : 0,
          qtdMovimentos: resp && resp.qtdMovimentos ? resp.qtdMovimentos : 0,
          mensagem: resp && resp.mensagem ? resp.mensagem : ""
        });
      } catch (e) {
        resultados.push({
          idLocal: idLocal,
          sucesso: false,
          mensagem: "Erro ao sincronizar venda offline: " + (e && e.message ? e.message : e)
        });
      }
    });

    const qtdSucesso = resultados.filter(function(r) { return r && r.sucesso; }).length;

    return {
      sucesso: true,
      resultados: resultados,
      qtdSucesso: qtdSucesso,
      qtdErro: resultados.length - qtdSucesso
    };
  } catch (e) {
    console.error(e);
    return {
      sucesso: false,
      resultados: [],
      mensagem: "Erro ao sincronizar vendas offline: " + (e && e.message ? e.message : e)
    };
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}

function caixaNumero_(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  var texto = String(valor || "").trim();
  if (!texto) return 0;

  texto = texto
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

function montarSaldosCaixa_(movimentacoes) {
  var mapa = {};

  (Array.isArray(movimentacoes) ? movimentacoes : []).forEach(function(r) {
    var status = String(r[13] == null ? "S" : r[13]).trim().toUpperCase();
    if (status === "N") return;

    var codProduto = String(r[5] == null ? "" : r[5]).trim();
    var filial = String(r[9] == null ? "" : r[9]).trim();
    if (!codProduto || !filial) return;

    var tipo = String(r[2] == null ? "" : r[2]).trim();
    var qtd = caixaNumero_(r[6]);
    if (!qtd) return;

    var tipoNorm = tipo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    var fator = tipoNorm.indexOf("entrada") >= 0 ? 1 : (tipoNorm.indexOf("saida") >= 0 ? -1 : 0);
    if (!fator) return;

    var chave = filial + "||" + codProduto;
    mapa[chave] = (mapa[chave] || 0) + (qtd * fator);
  });

  return Object.keys(mapa).map(function(chave) {
    var partes = chave.split("||");
    return {
      codigoprod: partes[1] || "",
      tipomov: "ENTRADA SALDO",
      qtd: mapa[chave],
      filial: partes[0] || "",
      status: "S"
    };
  }).filter(function(item) {
    return item.codigoprod && item.filial && item.qtd !== 0;
  });
}

function buscarMovimentacoesSaldoCaixa_(guiaEstoque) {
  if (!guiaEstoque) return [];

  var qtdLinhas = guiaEstoque.getLastRow() - 1;
  if (qtdLinhas <= 0) return [];

  var tipos = guiaEstoque.getRange(2, 3, qtdLinhas, 1).getValues();
  var produtos = guiaEstoque.getRange(2, 6, qtdLinhas, 1).getValues();
  var quantidades = guiaEstoque.getRange(2, 7, qtdLinhas, 1).getValues();
  var filiais = guiaEstoque.getRange(2, 10, qtdLinhas, 1).getValues();
  var status = guiaEstoque.getRange(2, 14, qtdLinhas, 1).getValues();
  var linhas = [];

  for (var i = 0; i < qtdLinhas; i++) {
    linhas.push([
      "", "", tipos[i][0], "", "", produtos[i][0], quantidades[i][0], "", "", filiais[i][0], "", "", "", status[i][0]
    ]);
  }

  return linhas;
}

function montarResumoClientesVendaCaixa_(carrinhos) {
  var resumo = {};
  var idsPorCliente = {};

  (Array.isArray(carrinhos) ? carrinhos : []).forEach(function(r) {
    var status = String(r[12] == null ? "S" : r[12]).trim().toUpperCase();
    if (status === "N") return;

    var idCarrinho = String(r[0] == null ? "" : r[0]).trim();
    var idCliente = String(r[1] == null ? "" : r[1]).trim();
    if (!idCarrinho || !idCliente) return;

    if (!resumo[idCliente]) {
      resumo[idCliente] = { qtdCompras: 0, totalCompras: 0 };
      idsPorCliente[idCliente] = {};
    }

    if (!idsPorCliente[idCliente][idCarrinho]) {
      idsPorCliente[idCliente][idCarrinho] = true;
      resumo[idCliente].qtdCompras++;
    }

    resumo[idCliente].totalCompras += caixaNumero_(r[4]);
  });

  return resumo;
}

function buscarCarrinhosResumoClientesCaixa_(guiaCarrinhos) {
  if (!guiaCarrinhos) return [];

  var qtdLinhas = guiaCarrinhos.getLastRow() - 1;
  if (qtdLinhas <= 0) return [];

  var ids = guiaCarrinhos.getRange(2, 1, qtdLinhas, 1).getValues();
  var clientes = guiaCarrinhos.getRange(2, 2, qtdLinhas, 1).getValues();
  var totais = guiaCarrinhos.getRange(2, 5, qtdLinhas, 1).getValues();
  var status = guiaCarrinhos.getRange(2, 13, qtdLinhas, 1).getValues();
  var linhas = [];

  for (var i = 0; i < qtdLinhas; i++) {
    linhas.push([
      ids[i][0], clientes[i][0], "", "", totais[i][0], "", "", "", "", "", "", "", status[i][0]
    ]);
  }

  return linhas;
}

function montarClientesConsultaCaixa_(clientesRaw) {
  return (Array.isArray(clientesRaw) ? clientesRaw : []).map(function(r) {
    var dataNascimento = (r[2] == null ? "" : String(r[2]).trim());

    return {
      idCliente: (r[0] == null ? "" : String(r[0]).trim()),
      nome: (r[1] == null ? "" : String(r[1]).trim()),
      dataNascimento: dataNascimento,
      sexo: (r[3] == null ? "" : String(r[3]).trim()),
      cpf: (r[4] == null ? "" : String(r[4]).trim()),
      email: (r[5] == null ? "" : String(r[5]).trim()),
      idade: calcularIdadeClienteConsultaCaixa_(dataNascimento),
      status: (r[6] == null ? "" : String(r[6]).trim())
    };
  }).filter(function(obj) {
    return obj.idCliente !== "" && obj.nome !== "" && obj.status.toUpperCase() !== "N";
  }).sort(function(a, b) {
    return a.nome.localeCompare(b.nome);
  });
}

function buscarClientesConsultaCaixa_(guiaClientes) {
  if (!guiaClientes) return [];

  var qtdLinhas = guiaClientes.getLastRow() - 1;
  if (qtdLinhas <= 0) return [];

  var basicos = guiaClientes.getRange(2, 1, qtdLinhas, 8).getDisplayValues();
  var status = guiaClientes.getRange(2, 26, qtdLinhas, 1).getDisplayValues();
  var linhas = [];

  for (var i = 0; i < qtdLinhas; i++) {
    linhas.push([
      basicos[i][0], // ID_CLIENTE
      basicos[i][1], // NOME
      basicos[i][2], // DATA_NASCIMENTO
      basicos[i][3], // SEXO
      basicos[i][4], // CPF
      basicos[i][7], // EMAIL
      status[i][0]   // STATUS_ATIVACAO
    ]);
  }

  return linhas;
}

function calcularIdadeClienteConsultaCaixa_(dataNascimento) {
  var texto = String(dataNascimento || "").trim();
  if (!texto) return "";

  var dia, mes, ano;
  var br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  var iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (br) {
    dia = Number(br[1]);
    mes = Number(br[2]);
    ano = Number(br[3]);
  } else if (iso) {
    ano = Number(iso[1]);
    mes = Number(iso[2]);
    dia = Number(iso[3]);
  } else {
    return "";
  }

  var nascimento = new Date(ano, mes - 1, dia);
  if (isNaN(nascimento.getTime())) return "";

  var hoje = new Date();
  if (nascimento > hoje) return "";

  var idade = hoje.getFullYear() - nascimento.getFullYear();
  var antesAniversario = hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());

  if (antesAniversario) idade--;
  return idade >= 0 ? String(idade) : "";
}

function buscarProdutosBasicosCaixa_(guiaProdutos) {
  if (!guiaProdutos) return [];

  var qtdLinhas = guiaProdutos.getLastRow() - 1;
  if (qtdLinhas <= 0) return [];

  var dadosBase = guiaProdutos.getRange(2, 1, qtdLinhas, 4).getValues(); // ID, promocao, promocao vigente, nome
  var eans = guiaProdutos.getRange(2, 8, qtdLinhas, 1).getValues();
  var precos = guiaProdutos.getRange(2, 16, qtdLinhas, 1).getValues();
  var combos = guiaProdutos.getRange(2, 19, qtdLinhas, 1).getValues();
  var status = guiaProdutos.getRange(2, 22, qtdLinhas, 1).getValues();

  var itens = [];

  for (var i = 0; i < qtdLinhas; i++) {
    var obj = {
      codigo: (dadosBase[i][0] == null ? "" : String(dadosBase[i][0]).trim()),
      emPromocao: (dadosBase[i][1] == null ? "" : String(dadosBase[i][1]).trim()),
      idPromocaoVigente: (dadosBase[i][2] == null ? "" : String(dadosBase[i][2]).trim()),
      nome: (dadosBase[i][3] == null ? "" : String(dadosBase[i][3]).trim()),
      ean: (eans[i][0] == null ? "" : String(eans[i][0]).trim()),
      preco: (precos[i][0] == null ? "" : String(precos[i][0]).trim()),
      combo: (combos[i][0] == null ? "" : String(combos[i][0]).trim()),
      status: (status[i][0] == null ? "" : String(status[i][0]).trim())
    };

    if (obj.nome !== "" && obj.status.toUpperCase() !== "N") {
      itens.push(obj);
    }
  }

  itens = Array.from(new Map(itens.map(function(obj) { return [obj.nome, obj]; })).values());
  itens.sort(function(a, b) { return a.nome.localeCompare(b.nome); });

  return itens;
}

function buscarPromocoesAtivasCaixa_(guiaPromocoes) {
  if (!guiaPromocoes) return [];

  var qtdLinhas = guiaPromocoes.getLastRow() - 1;
  if (qtdLinhas <= 0) return [];

  var dadosBase = guiaPromocoes.getRange(2, 1, qtdLinhas, 5).getDisplayValues();
  var status = guiaPromocoes.getRange(2, 8, qtdLinhas, 1).getDisplayValues();
  var itens = [];

  for (var i = 0; i < qtdLinhas; i++) {
    var obj = {
      idPromocao: (dadosBase[i][0] == null ? "" : String(dadosBase[i][0]).trim()),
      idProduto: (dadosBase[i][1] == null ? "" : String(dadosBase[i][1]).trim()),
      precoPromocao: (dadosBase[i][2] == null ? "" : String(dadosBase[i][2]).trim()),
      inicioPromocao: (dadosBase[i][3] == null ? "" : String(dadosBase[i][3]).trim()),
      fimPromocao: (dadosBase[i][4] == null ? "" : String(dadosBase[i][4]).trim()),
      status: (status[i][0] == null ? "" : String(status[i][0]).trim())
    };

    if (obj.idPromocao !== "" && (obj.status === "1" || obj.status === "2")) {
      itens.push(obj);
    }
  }

  return itens;
}

function buscarDadosConsultaCaixa() {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Caixa", "ACESSAR");
    if (!auth.sucesso) return auth;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var guiaEst = ss.getSheetByName("EST_MOVIMENTACOES");
    var guiaCadCli = ss.getSheetByName("CAD_CLIENTE");
    var guiaVendaCarrinho = ss.getSheetByName("VENDA_CARRINHO");

    var itensEstRaw = buscarMovimentacoesSaldoCaixa_(guiaEst);
    var itensVendaCarrinhoRaw = buscarCarrinhosResumoClientesCaixa_(guiaVendaCarrinho);
    var itensCliRaw = buscarClientesConsultaCaixa_(guiaCadCli);

    return {
      sucesso: true,
      itensEst: montarSaldosCaixa_(itensEstRaw),
      itensCli: montarClientesConsultaCaixa_(itensCliRaw),
      resumoClientesVenda: montarResumoClientesVendaCaixa_(itensVendaCarrinhoRaw)
    };
  } catch (e) {
    console.error(e);
    return { sucesso: false, mensagem: "Erro ao buscar dados de consulta da Caixa: " + (e && e.message ? e.message : e) };
  }
}

function buscarDadosAtualizadosCaixa() {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Caixa", "ACESSAR");
    if (!auth.sucesso) return auth;

    if (typeof sincronizarStatusPromocoes_ === "function") {
      sincronizarStatusPromocoes_();
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const guiaCadProd = ss.getSheetByName("CAD_PRODUTO");
    const guiaCadSaida = ss.getSheetByName("CAD_SAIDA_EST");
    const guiaCadFil = ss.getSheetByName("CAD_FILIAL");
    const guiaEst = ss.getSheetByName("EST_MOVIMENTACOES");
    const guiaPromo = ss.getSheetByName("CAD_PROMOCAO");
    const guiaCadCli = ss.getSheetByName("CAD_CLIENTE");
    const guiaVendaCarrinho = ss.getSheetByName("VENDA_CARRINHO");

    if (!guiaCadProd || !guiaCadSaida || !guiaCadFil || !guiaEst) {
      return { sucesso: false, mensagem: "Abas principais da Caixa nao encontradas." };
    }

    const ultimaLinhaSai = Math.max(guiaCadSaida.getLastRow() - 1, 0);
    const ultimaLinhaFil = Math.max(guiaCadFil.getLastRow() - 1, 0);

    const itensSaiRaw = ultimaLinhaSai > 0 ? guiaCadSaida.getRange(2, 2, ultimaLinhaSai, 4).getValues() : [];
    const itensFilRaw = ultimaLinhaFil > 0 ? guiaCadFil.getRange(2, 1, ultimaLinhaFil, 2).getValues() : [];
    const itensEstRaw = buscarMovimentacoesSaldoCaixa_(guiaEst);
    const itensCliRaw = buscarClientesConsultaCaixa_(guiaCadCli);
    const itensVendaCarrinhoRaw = buscarCarrinhosResumoClientesCaixa_(guiaVendaCarrinho);

    const itensProd = buscarProdutosBasicosCaixa_(guiaCadProd);
    const itensPromo = buscarPromocoesAtivasCaixa_(guiaPromo);
    const resumoClientesVenda = montarResumoClientesVendaCaixa_(itensVendaCarrinhoRaw);
    const itensCli = montarClientesConsultaCaixa_(itensCliRaw);

    const itensSaida = itensSaiRaw.map(function(r) {
      return {
        codigoprod: (r[0] == null ? "" : String(r[0]).trim()),
        codigosaida: (r[1] == null ? "" : String(r[1]).trim()),
        qtd: (r[2] == null ? "" : String(r[2]).trim()),
        preco: (r[3] == null ? "" : String(r[3]).trim())
      };
    }).filter(function(obj) {
      return obj.codigoprod !== "";
    });

    let itensFil = itensFilRaw.map(function(r) {
      return {
        codigo: (r[0] == null ? "" : String(r[0]).trim()),
        nome: (r[1] == null ? "" : String(r[1]).trim())
      };
    }).filter(function(obj) {
      return obj.nome !== "";
    });

    const itensEst = montarSaldosCaixa_(itensEstRaw);

    itensFil = Array.from(new Map(itensFil.map(function(obj) { return [obj.nome, obj]; })).values());

    itensFil.sort(function(a, b) { return a.nome.localeCompare(b.nome); });

    return {
      sucesso: true,
      itensProd: itensProd,
      itensSaida: itensSaida,
      itensFil: itensFil,
      itensEst: itensEst,
      itensPromo: itensPromo,
      itensCli: itensCli,
      resumoClientesVenda: resumoClientesVenda
    };

  } catch (e) {
    console.error(e);
    return { sucesso: false, mensagem: "Erro ao atualizar dados da Caixa: " + (e && e.message ? e.message : e) };
  }
}
