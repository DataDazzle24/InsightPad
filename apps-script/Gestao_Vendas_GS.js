function buscarDadosGestaoVendas(opcoesOuToken, tokenSessao) {
  try {
    var opcoes = opcoesOuToken && typeof opcoesOuToken === "object" ? opcoesOuToken : {};
    var token = tokenSessao || authExtrairTokenArgumentos_(arguments);
    var auth = validarPermissaoOuFalhar(token, "Gestao_Vendas", "ACESSAR");
    if (!auth.sucesso) return auth;

    return montarDadosGestaoVendasPaginado_({
      offset: Number(opcoes.offset || 0),
      limite: Number(opcoes.limite || 100),
      filtros: opcoes.filtros || {},
      apenasPagina: opcoes.apenasPagina === true
    });
  } catch (e) {
    console.error(e);
    return { sucesso: false, mensagem: "Erro ao buscar dados da gestão de vendas: " + (e && e.message ? e.message : e) };
  }
}

function buscarPaginaGestaoVendas(offset, limite, cliente, filial, dataInicial, dataFinal, valorMin, valorMax, tokenSessao) {
  try {
    var token = tokenSessao || authExtrairTokenArgumentos_(arguments);
    var auth = validarPermissaoOuFalhar(token, "Gestao_Vendas", "ACESSAR");
    if (!auth.sucesso) return auth;

    return montarDadosGestaoVendasPaginado_({
      offset: Number(offset || 0),
      limite: Number(limite || 100),
      filtros: {
        cliente: cliente || "",
        filial: filial || "",
        dataInicial: dataInicial || "",
        dataFinal: dataFinal || "",
        valorMin: valorMin,
        valorMax: valorMax
      },
      apenasPagina: true
    });
  } catch (e) {
    console.error(e);
    return { sucesso: false, mensagem: "Erro ao buscar vendas: " + (e && e.message ? e.message : e) };
  }
}

function buscarItensVendaGestao(idCarrinho, tokenSessao) {
  try {
    var auth = validarPermissaoOuFalhar(tokenSessao || authExtrairTokenArgumentos_(arguments), "Gestao_Vendas", "ACESSAR");
    if (!auth.sucesso) return auth;

    idCarrinho = String(idCarrinho || "").trim();
    if (!idCarrinho) return { sucesso: false, mensagem: "ID da venda nao informado." };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shProdutoVenda = ss.getSheetByName("VENDA_PRODUTO");
    if (!shProdutoVenda) return { sucesso: false, mensagem: "Aba VENDA_PRODUTO nao encontrada." };

    return {
      sucesso: true,
      idCarrinho: idCarrinho,
      itens: montarItensVendaGestao_(shProdutoVenda, idCarrinho)
    };
  } catch (e) {
    console.error(e);
    return { sucesso: false, mensagem: "Erro ao buscar itens da venda: " + (e && e.message ? e.message : e) };
  }
}

function excluirVendaGestao(idCarrinho) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Gestao_Vendas", "EXCLUIR");
    if (!auth.sucesso) return auth;

    idCarrinho = String(idCarrinho || "").trim();
    if (!idCarrinho) return { sucesso: false, mensagem: "ID da venda não informado." };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shCarrinho = ss.getSheetByName("VENDA_CARRINHO");
    const shProduto = ss.getSheetByName("VENDA_PRODUTO");
    const shEst = ss.getSheetByName("EST_MOVIMENTACOES");

    if (!shCarrinho || !shProduto || !shEst) {
      return { sucesso: false, mensagem: "Abas de venda/estoque não encontradas." };
    }

    inativarPorColuna_(shCarrinho, 1, idCarrinho, 13);
    inativarPorColuna_(shProduto, 2, idCarrinho, 6);
    inativarPorColuna_(shEst, 5, idCarrinho, 14);

    return { sucesso: true };
  } catch (e) {
    console.error(e);
    return { sucesso: false, mensagem: "Erro ao excluir venda: " + (e && e.message ? e.message : e) };
  }
}

function editarVendaGestao(payload) {
  try {
    var auth = authValidarAcaoPorArgumentos_(arguments, "Gestao_Vendas", "EDITAR");
    if (!auth.sucesso) return auth;

    if (!payload || !payload.idCarrinho || !Array.isArray(payload.produtos)) {
      return { sucesso: false, mensagem: "Payload inválido." };
    }

    const idCarrinho = String(payload.idCarrinho).trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shCarrinho = ss.getSheetByName("VENDA_CARRINHO");
    const shProduto = ss.getSheetByName("VENDA_PRODUTO");
    const shEst = ss.getSheetByName("EST_MOVIMENTACOES");
    const shSaida = ss.getSheetByName("CAD_SAIDA_EST");

    if (!shCarrinho || !shProduto || !shEst || !shSaida) {
      return { sucesso: false, mensagem: "Abas necessárias para edição não encontradas." };
    }

    const linhaCarrinho = localizarLinhaPorColuna_(shCarrinho, 1, idCarrinho);
    if (!linhaCarrinho) return { sucesso: false, mensagem: "Venda não encontrada." };

    shCarrinho.getRange(linhaCarrinho, 2, 1, 11).setValues([[
      String(payload.idCliente || "").trim(),
      Number(payload.totalVenda || 0),
      Number(payload.desconto || 0),
      Number(payload.totalDesconto || 0),
      String(payload.forma1 || "").trim(),
      Number(payload.valor1 || 0),
      String(payload.forma2 || "").trim(),
      Number(payload.valor2 || 0),
      Number(payload.troco || 0),
      String(payload.idFilial || "").trim(),
      obterDataHoraGestaoVendas_()
    ]]);
    shCarrinho.getRange(linhaCarrinho, 13).setValue("S");

    const produtosParaGravar = calcularProdutosLiquidosGestao_(
      payload.produtos,
      Number(payload.desconto || 0),
      Number(payload.totalVenda || 0)
    );

    const mapaLinhasProduto = obterLinhasPorColuna_(shProduto, 2, idCarrinho);
    const produtosExistentes = new Map();
    mapaLinhasProduto.forEach(function(linha) {
      const idVenda = String(shProduto.getRange(linha, 1).getValue()).trim();
      if (idVenda) produtosExistentes.set(idVenda, linha);
    });

    const idsMantidos = new Set();
    let proximoIdVenda = obterProximoIdPorColuna_(shProduto, 1);

    produtosParaGravar.forEach(function(prod) {
      const idVenda = String(prod.idVenda || "").trim();
      const linha = produtosExistentes.get(idVenda);

      if (linha) {
        idsMantidos.add(idVenda);
        shProduto.getRange(linha, 3, 1, 4).setValues([[
          String(prod.idProduto || "").trim(),
          Number(prod.valorLiquido || 0),
          Number(prod.qtd || 0),
          "S"
        ]]);
        return;
      }

      const novoIdVenda = proximoIdVenda++;
      prod.idVenda = String(novoIdVenda);
      idsMantidos.add(String(novoIdVenda));
      shProduto.getRange(shProduto.getLastRow() + 1, 1, 1, 6).setValues([[
        novoIdVenda,
        idCarrinho,
        String(prod.idProduto || "").trim(),
        Number(prod.valorLiquido || 0),
        Number(prod.qtd || 0),
        "S"
      ]]);
    });

    mapaLinhasProduto.forEach(function(linha) {
      const idVenda = String(shProduto.getRange(linha, 1).getValue()).trim();
      if (idVenda && !idsMantidos.has(idVenda)) {
        shProduto.getRange(linha, 6).setValue("N");
      }
    });

    atualizarMovimentosEstoqueVenda_(shEst, shSaida, idCarrinho, produtosParaGravar, payload.idFilial);

    return { sucesso: true };
  } catch (e) {
    console.error(e);
    return { sucesso: false, mensagem: "Erro ao editar venda: " + (e && e.message ? e.message : e) };
  }
}

function montarDadosGestaoVendasPaginado_(opcoes) {
  opcoes = opcoes || {};
  const offset = Math.max(0, Number(opcoes.offset || 0));
  const limite = Math.min(Math.max(Number(opcoes.limite || 100), 1), 300);
  const filtros = opcoes.filtros || {};

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shCarrinho = ss.getSheetByName("VENDA_CARRINHO");
  const shProduto = ss.getSheetByName("CAD_PRODUTO");
  const shFilial = ss.getSheetByName("CAD_FILIAL");
  const shCliente = ss.getSheetByName("CAD_CLIENTE");

  if (!shCarrinho || !shProduto || !shFilial || !shCliente) {
    return { sucesso: false, mensagem: "Uma ou mais abas da gestao de vendas nao foram encontradas." };
  }

  const mapaClientes = montarMapaClientesGestao_(shCliente);
  const mapaFiliais = montarMapaFiliaisGestao_(shFilial);
  const itensCli = Array.from(mapaClientes.values())
    .filter(function(c) { return c.nome; })
    .sort(function(a, b) { return a.nome.localeCompare(b.nome); });
  const itensFil = Array.from(mapaFiliais.values())
    .filter(function(f) { return f.nome; })
    .sort(function(a, b) { return a.nome.localeCompare(b.nome); });
  const itensProd = opcoes.apenasPagina ? [] : buscarProdutosBasicosGestaoVendas_(shProduto);
  const carrinhos = obterValores_(shCarrinho, 13);

  let vendas = carrinhos.map(function(r) {
    const status = String(r[12] || "S").trim().toUpperCase();
    if (status === "N") return null;

    const idCliente = String(r[1] || "").trim();
    const idFilial = String(r[10] || "").trim();
    const cliente = mapaClientes.get(idCliente);
    const filial = mapaFiliais.get(idFilial);

    return {
      idCarrinho: String(r[0] || "").trim(),
      idCliente: idCliente,
      cliente: cliente ? cliente.nome : "",
      idFilial: idFilial,
      filial: filial ? filial.nome : idFilial,
      totalVenda: obterNumeroSeguroGestaoVendas_(r[2]),
      desconto: obterNumeroSeguroGestaoVendas_(r[3]),
      totalDesconto: obterNumeroSeguroGestaoVendas_(r[4]),
      forma1: String(r[5] || "").trim(),
      valor1: obterNumeroSeguroGestaoVendas_(r[6]),
      forma2: String(r[7] || "").trim(),
      valor2: obterNumeroSeguroGestaoVendas_(r[8]),
      troco: obterNumeroSeguroGestaoVendas_(r[9]),
      dataVenda: formatarDataHoraGestaoVendas_(r[11]),
      _tsVenda: obterTimestampGestaoVendas_(r[11])
    };
  }).filter(Boolean);

  vendas = filtrarVendasGestao_(vendas, filtros);
  vendas.sort(function(a, b) {
    return (b._tsVenda || 0) - (a._tsVenda || 0) || Number(b.idCarrinho || 0) - Number(a.idCarrinho || 0);
  });

  const totalRegistros = vendas.length;
  const pagina = vendas.slice(offset, offset + limite).map(function(venda) {
    delete venda._tsVenda;
    return venda;
  });

  return {
    sucesso: true,
    dadosVendas: pagina,
    dadosProdutosVenda: [],
    itensProd: itensProd,
    itensSaida: [],
    itensFil: opcoes.apenasPagina ? [] : itensFil,
    itensCli: opcoes.apenasPagina ? [] : itensCli,
    listasFiltros: opcoes.apenasPagina ? {} : {
      clientes: itensCli.map(function(c) { return c.nome; }).filter(Boolean),
      filiais: itensFil.map(function(f) { return f.nome; }).filter(Boolean)
    },
    paginacao: {
      offset: offset,
      limite: limite,
      retornados: pagina.length,
      total: totalRegistros,
      temMais: offset + limite < totalRegistros
    }
  };
}

function montarMapaClientesGestao_(shCliente) {
  const mapa = new Map();
  if (!shCliente) return mapa;

  const last = shCliente.getLastRow();
  if (last < 2) return mapa;

  const qtd = last - 1;
  const basicos = shCliente.getRange(2, 1, qtd, 8).getDisplayValues();
  const ultimaColuna = shCliente.getLastColumn();
  const status = ultimaColuna >= 26
    ? shCliente.getRange(2, 26, qtd, 1).getDisplayValues()
    : Array(qtd).fill(["S"]);

  for (let i = 0; i < qtd; i++) {
    const st = String(status[i][0] || "S").trim().toUpperCase();
    if (st === "N") continue;

    const id = String(basicos[i][0] || "").trim();
    if (!id) continue;

    mapa.set(id, {
      idCliente: id,
      nome: String(basicos[i][1] || "").trim(),
      dataNascimento: String(basicos[i][2] || "").trim(),
      sexo: String(basicos[i][3] || "").trim(),
      cpf: String(basicos[i][4] || "").trim(),
      email: String(basicos[i][7] || "").trim()
    });
  }

  return mapa;
}

function montarMapaFiliaisGestao_(shFilial) {
  const mapa = new Map();
  const filiais = obterValores_(shFilial, 2);

  filiais.forEach(function(r) {
    const codigo = String(r[0] || "").trim();
    if (!codigo) return;
    mapa.set(codigo, { codigo: codigo, nome: String(r[1] || "").trim() });
  });

  return mapa;
}

function buscarProdutosBasicosGestaoVendas_(shProduto) {
  if (!shProduto) return [];

  const last = shProduto.getLastRow();
  if (last < 2) return [];

  const qtd = last - 1;
  const dadosBase = shProduto.getRange(2, 1, qtd, 4).getValues();
  const eans = shProduto.getRange(2, 8, qtd, 1).getValues();
  const precos = shProduto.getRange(2, 16, qtd, 1).getValues();
  const combos = shProduto.getRange(2, 19, qtd, 1).getValues();
  const status = shProduto.getRange(2, 22, qtd, 1).getValues();
  const itens = [];

  for (let i = 0; i < qtd; i++) {
    const item = {
      codigo: String(dadosBase[i][0] || "").trim(),
      nome: String(dadosBase[i][3] || "").trim(),
      ean: String(eans[i][0] || "").trim(),
      preco: String(precos[i][0] || "").trim(),
      combo: String(combos[i][0] || "").trim(),
      status: String(status[i][0] || "").trim()
    };

    if (item.codigo && item.nome && item.status.toUpperCase() !== "N") itens.push(item);
  }

  return itens.sort(function(a, b) { return a.nome.localeCompare(b.nome); });
}

function montarItensVendaGestao_(shProdutoVenda, idCarrinho) {
  const produtosVenda = obterValores_(shProdutoVenda, 6);
  const alvo = String(idCarrinho || "").trim();

  return produtosVenda.map(function(r) {
    const status = String(r[5] || "S").trim().toUpperCase();
    if (status === "N") return null;
    if (String(r[1] || "").trim() !== alvo) return null;

    return {
      idVenda: String(r[0] || "").trim(),
      idCarrinho: String(r[1] || "").trim(),
      idProduto: String(r[2] || "").trim(),
      valorVenda: obterNumeroSeguroGestaoVendas_(r[3]),
      qtd: obterNumeroSeguroGestaoVendas_(r[4])
    };
  }).filter(Boolean);
}

function filtrarVendasGestao_(vendas, filtros) {
  const idCliente = String((filtros && filtros.cliente) || "").trim();
  const idFilial = String((filtros && filtros.filial) || "").trim();
  const dataInicial = obterTimestampFiltroGestao_(filtros && filtros.dataInicial, false);
  const dataFinal = obterTimestampFiltroGestao_(filtros && filtros.dataFinal, true);
  const valorMin = filtros && filtros.valorMin !== "" && filtros.valorMin != null ? obterNumeroSeguroGestaoVendas_(filtros.valorMin) : null;
  const valorMax = filtros && filtros.valorMax !== "" && filtros.valorMax != null ? obterNumeroSeguroGestaoVendas_(filtros.valorMax) : null;

  return (vendas || []).filter(function(venda) {
    if (idCliente && String(venda.idCliente || "").trim() !== idCliente) return false;
    if (idFilial && String(venda.idFilial || "").trim() !== idFilial) return false;
    if (dataInicial && (!venda._tsVenda || venda._tsVenda < dataInicial)) return false;
    if (dataFinal && (!venda._tsVenda || venda._tsVenda > dataFinal)) return false;

    const total = obterNumeroSeguroGestaoVendas_(venda.totalDesconto);
    if (valorMin != null && Number.isFinite(valorMin) && total < valorMin) return false;
    if (valorMax != null && Number.isFinite(valorMax) && total > valorMax) return false;

    return true;
  });
}

function normalizarTextoGestaoVendas_(valor) {
  return String(valor || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function obterNumeroSeguroGestaoVendas_(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  var texto = String(valor || "")
    .replace(/\u00A0/g, " ")
    .replace(/[Rr]\$\s*/g, "")
    .replace(/\s/g, "")
    .trim();

  if (!texto) return 0;

  var ultimaVirgula = texto.lastIndexOf(",");
  var ultimoPonto = texto.lastIndexOf(".");

  if (ultimaVirgula > -1 && ultimoPonto > -1) {
    texto = ultimaVirgula > ultimoPonto
      ? texto.replace(/\./g, "").replace(",", ".")
      : texto.replace(/,/g, "");
  } else if (ultimaVirgula > -1) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  }

  var numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function obterTimestampFiltroGestao_(valor, fimDoDia) {
  const texto = String(valor || "").trim();
  if (!texto) return 0;

  const m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
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

  return obterTimestampGestaoVendas_(texto);
}

function obterTimestampGestaoVendas_(valor) {
  if (!valor) return 0;

  if (Object.prototype.toString.call(valor) === "[object Date]" && !isNaN(valor.getTime())) {
    return valor.getTime();
  }

  const texto = String(valor).trim();
  const m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
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

  const data = new Date(texto);
  return isNaN(data.getTime()) ? 0 : data.getTime();
}

function montarDadosGestaoVendas_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shCarrinho = ss.getSheetByName("VENDA_CARRINHO");
  const shProdutoVenda = ss.getSheetByName("VENDA_PRODUTO");
  const shProduto = ss.getSheetByName("CAD_PRODUTO");
  const shSaida = ss.getSheetByName("CAD_SAIDA_EST");
  const shFilial = ss.getSheetByName("CAD_FILIAL");
  const shCliente = ss.getSheetByName("CAD_CLIENTE");

  if (!shCarrinho || !shProdutoVenda || !shProduto || !shSaida || !shFilial || !shCliente) {
    return { sucesso: false, mensagem: "Uma ou mais abas da gestão de vendas não foram encontradas." };
  }

  const carrinhos = obterValores_(shCarrinho, 13);
  const produtosVenda = obterValores_(shProdutoVenda, 6);
  const produtos = obterValores_(shProduto, 22);
  const saidas = obterValores_(shSaida, 5);
  const filiais = obterValores_(shFilial, 2);
  const clientes = obterValores_(shCliente, 26);

  const mapaClientes = new Map();
  clientes.forEach(function(r) {
    const status = String(r[25] || "S").trim().toUpperCase();
    if (status === "N") return;
    mapaClientes.set(String(r[0]).trim(), {
      idCliente: String(r[0] || "").trim(),
      nome: String(r[1] || "").trim(),
      dataNascimento: String(r[2] || "").trim(),
      sexo: String(r[3] || "").trim(),
      cpf: String(r[4] || "").trim(),
      email: String(r[7] || "").trim()
    });
  });

  const mapaFiliais = new Map();
  filiais.forEach(function(r) {
    mapaFiliais.set(String(r[0]).trim(), { codigo: String(r[0] || "").trim(), nome: String(r[1] || "").trim() });
  });

  const itensProd = produtos.map(function(r) {
    return {
      codigo: String(r[0] || "").trim(),
      nome: String(r[3] || "").trim(),
      ean: String(r[7] || "").trim(),
      preco: String(r[15] || "").trim(),
      combo: String(r[18] || "").trim(),
      status: String(r[21] || "").trim()
    };
  }).filter(function(p) {
    return p.codigo && p.nome && p.status.toUpperCase() !== "N";
  }).sort(function(a, b) {
    return a.nome.localeCompare(b.nome);
  });

  const itensSaida = saidas.map(function(r) {
    return {
      codigoprod: String(r[1] || "").trim(),
      codigosaida: String(r[2] || "").trim(),
      qtd: String(r[3] || "").trim(),
      preco: String(r[4] || "").trim()
    };
  }).filter(function(s) {
    return s.codigoprod;
  });

  const itensFil = Array.from(mapaFiliais.values()).filter(function(f) {
    return f.nome;
  }).sort(function(a, b) {
    return a.nome.localeCompare(b.nome);
  });

  const itensCli = Array.from(mapaClientes.values()).filter(function(c) {
    return c.nome;
  }).sort(function(a, b) {
    return a.nome.localeCompare(b.nome);
  });

  const dadosVendas = carrinhos.map(function(r) {
    const status = String(r[12] || "S").trim().toUpperCase();
    if (status === "N") return null;

    const idCliente = String(r[1] || "").trim();
    const idFilial = String(r[10] || "").trim();
    const cliente = mapaClientes.get(idCliente);
    const filial = mapaFiliais.get(idFilial);

    return {
      idCarrinho: String(r[0] || "").trim(),
      idCliente: idCliente,
      cliente: cliente ? cliente.nome : "",
      idFilial: idFilial,
      filial: filial ? filial.nome : idFilial,
      totalVenda: Number(r[2] || 0),
      desconto: Number(r[3] || 0),
      totalDesconto: Number(r[4] || 0),
      forma1: String(r[5] || "").trim(),
      valor1: Number(r[6] || 0),
      forma2: String(r[7] || "").trim(),
      valor2: Number(r[8] || 0),
      troco: Number(r[9] || 0),
      dataVenda: formatarDataHoraGestaoVendas_(r[11])
    };
  }).filter(Boolean);

  const dadosProdutosVenda = produtosVenda.map(function(r) {
    const status = String(r[5] || "S").trim().toUpperCase();
    if (status === "N") return null;
    return {
      idVenda: String(r[0] || "").trim(),
      idCarrinho: String(r[1] || "").trim(),
      idProduto: String(r[2] || "").trim(),
      valorVenda: Number(r[3] || 0),
      qtd: Number(r[4] || 0)
    };
  }).filter(Boolean);

  return {
    sucesso: true,
    dadosVendas: dadosVendas,
    dadosProdutosVenda: dadosProdutosVenda,
    itensProd: itensProd,
    itensSaida: itensSaida,
    itensFil: itensFil,
    itensCli: itensCli
  };
}

function calcularProdutosLiquidosGestao_(produtos, desconto, totalVenda) {
  return (produtos || []).map(function(prod, index) {
    return {
      idVenda: String(prod.idVenda || "").trim(),
      idProduto: String(prod.idProduto || "").trim(),
      qtd: Number(prod.qtd || 0),
      valorVenda: Number(prod.valorVenda || 0),
      valorLiquido: Number(prod.valorVenda || 0),
      _index: index
    };
  }).filter(function(prod) {
    return prod.idProduto && prod.qtd > 0;
  });
}

function atualizarMovimentosEstoqueVenda_(shEst, shSaida, idCarrinho, produtos, idFilial) {
  const saidas = obterValores_(shSaida, 5);
  const mapaSaidas = new Map();

  saidas.forEach(function(r) {
    const idProduto = String(r[1] || "").trim();
    if (!idProduto) return;
    if (!mapaSaidas.has(idProduto)) mapaSaidas.set(idProduto, []);
    mapaSaidas.get(idProduto).push({
      idProdutoSaida: String(r[2] || "").trim(),
      qtd: Number(r[3] || 0),
      valorUnitario: Number(r[4] || 0)
    });
  });

  const linhasExistentes = obterLinhasPorColuna_(shEst, 5, idCarrinho);
  let nextId = obterProximoIdPorColuna_(shEst, 1);
  const agora = obterDataHoraGestaoVendas_();
  const data = agora.split(" ")[0];
  const linhas = [];

  produtos.forEach(function(prod) {
    const saidasProd = mapaSaidas.get(String(prod.idProduto || "").trim()) || [{
      idProdutoSaida: String(prod.idProduto || "").trim(),
      qtd: 1,
      valorUnitario: Number(prod.valorLiquido || prod.valorVenda || 0)
    }];
    const linhasProduto = [];

    saidasProd.forEach(function(saida) {
      if (!saida.idProdutoSaida) return;
      var qtdMovimento = Number(saida.qtd || 1) * Number(prod.qtd || 0);
      linhasProduto.push([
        "",
        "SAÍDA VENDA",
        "",
        String(idCarrinho),
        saida.idProdutoSaida,
        qtdMovimento,
        formatarValorBancoEstoque_(Number(saida.valorUnitario || 0)),
        "",
        String(idFilial || "").trim(),
        data,
        agora,
        agora,
        "S"
      ]);
    });

    const valorBruto = Number(prod.valorVenda || 0);
    const valorLiquido = Number(prod.valorLiquido || prod.valorVenda || 0);
    const descontoProduto = Math.max(0, valorBruto - valorLiquido);

    if (descontoProduto > 0 && linhasProduto.length > 0) {
      const somaComponentes = linhasProduto.reduce(function(acc, linha) {
        return acc + (Number(linha[5] || 0) * obterNumeroValorBancoEstoque_(linha[6]));
      }, 0);

      if (somaComponentes > 0) {
        let resto = descontoProduto;
        linhasProduto.forEach(function(linha, index) {
          var qtdMovimento = Number(linha[5] || 0);
          var totalAtualLinha = qtdMovimento * obterNumeroValorBancoEstoque_(linha[6]);
          const descontoLinha = index === linhasProduto.length - 1
            ? resto
            : Math.round((descontoProduto * (totalAtualLinha / somaComponentes)) * 100) / 100;
          var totalLiquidoLinha = Math.max(0, totalAtualLinha - descontoLinha);
          linha[6] = formatarValorBancoEstoque_(qtdMovimento > 0 ? totalLiquidoLinha / qtdMovimento : 0);
          resto = Math.round((resto - descontoLinha) * 100) / 100;
        });
      }
    }

    linhasProduto.forEach(function(linha) {
      linhas.push(linha);
    });
  });

  linhas.forEach(function(linhaMov, index) {
    const linhaExistente = linhasExistentes[index];
    if (linhaExistente) {
      const idMov = shEst.getRange(linhaExistente, 1).getValue();
      shEst.getRange(linhaExistente, 1, 1, 14).setValues([[idMov].concat(linhaMov)]);
    } else {
      shEst.getRange(shEst.getLastRow() + 1, 1, 1, 14).setValues([[nextId++].concat(linhaMov)]);
    }
  });

  for (let i = linhas.length; i < linhasExistentes.length; i++) {
    shEst.getRange(linhasExistentes[i], 14).setValue("N");
  }
}

function obterValores_(sheet, colunas) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, colunas).getValues();
}

function localizarLinhaPorColuna_(sheet, coluna, valor) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const valores = sheet.getRange(2, coluna, last - 1, 1).getValues();
  const alvo = String(valor).trim();
  for (let i = 0; i < valores.length; i++) {
    if (String(valores[i][0]).trim() === alvo) return i + 2;
  }
  return 0;
}

function obterLinhasPorColuna_(sheet, coluna, valor) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const valores = sheet.getRange(2, coluna, last - 1, 1).getValues();
  const alvo = String(valor).trim();
  const linhas = [];
  for (let i = 0; i < valores.length; i++) {
    if (String(valores[i][0]).trim() === alvo) linhas.push(i + 2);
  }
  return linhas;
}

function inativarPorColuna_(sheet, colunaBusca, valor, colunaStatus) {
  const linhas = obterLinhasPorColuna_(sheet, colunaBusca, valor);
  linhas.forEach(function(linha) {
    sheet.getRange(linha, colunaStatus).setValue("N");
  });
}

function obterProximoIdPorColuna_(sheet, coluna) {
  const last = sheet.getLastRow();
  if (last < 2) return 1;
  const valores = sheet.getRange(2, coluna, last - 1, 1).getValues();
  let maior = 0;
  valores.forEach(function(r) {
    const n = Number(r[0]);
    if (Number.isFinite(n) && n > maior) maior = n;
  });
  return maior + 1;
}

function obterDataHoraGestaoVendas_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
}

function formatarDataHoraGestaoVendas_(valor) {
  if (!valor) return "";

  if (Object.prototype.toString.call(valor) === "[object Date]" && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  }

  const texto = String(valor).trim();
  if (!texto) return "";
  if (/^\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?$/.test(texto)) {
    return texto.length === 16 ? texto + ":00" : texto;
  }

  const data = new Date(texto);
  if (!isNaN(data.getTime())) {
    return Utilities.formatDate(data, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  }

  return texto;
}
