// Essa função é responsável por renderizar as telas HTML, e tornar capaz que o código seja visto como um App Web
function doGet(e) {
  e = e || { parameter: {} };
  var pageSolicitada = String((e.parameter && e.parameter.page) || "Menu").trim() || "Menu";

  // O parâmetro 'page' na URL irá determinar qual página será exibida.
  // Exemplo de URL: https://script.google.com/macros/s/SEU_ID/exec?page=FormVendedor
  // Usaremos isso para criar condicionais que dirão qual HTML será renderizado

  if (authPaginaPublica_(pageSolicitada)) {
    var templateLogin = HtmlService.createTemplateFromFile('Login');
    templateLogin.tituloPagina = "LOGIN";
    templateLogin.urlWebApp = ScriptApp.getService().getUrl();

    return templateLogin.evaluate()
      .setTitle("Insight Pad")
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var paginaMenuPrincipal = String(pageSolicitada || "Menu").toUpperCase() === "MENU";

  if (!paginaMenuPrincipal) {
    var codigoRenderizacao = String((e.parameter && e.parameter.renderCode) || "").trim();
    var renderizacaoAutorizada = authConsumirCodigoRenderizacao_(codigoRenderizacao, pageSolicitada);

    if (!renderizacaoAutorizada.sucesso) {
      return montarGateSessao_(pageSolicitada);
    }
  }

  
  // Vamos chamar a página inicial do nosso app, ou seja, quando clicarmos no link, essa página irá renderizar por padrão
  var template = HtmlService.createTemplateFromFile('Menu');

  // Se o parâmetro 'page' estiver na URL, o template a ser servido será o 'FormVendedor'.
  if (e.parameter.page == 'MenuCadastro') {

    // Chamando a página do link
    template = HtmlService.createTemplateFromFile('MenuCadastro');

    // Define título dinâmico
    template.tituloPagina = "MENU DE CADASTRO";
    
  }



  if (e.parameter.page == 'Cadastro_Categoria') {

    // Chamando a página do link
    template = HtmlService.createTemplateFromFile('Cadastro_Categoria');

    // Define título dinâmico
    template.tituloPagina = "CADASTRO DE CATEGORIAS";

    // Esse trecho é usado para renderizar os valores na lista suspensa assim que a página abrir, é diferente do anterior, pois aqui os valores precisam ser únicos
    // refreenciando a planilha
    var planilha = SpreadsheetApp.getActiveSpreadsheet();

    // referenciando as abas
    var guiaCadCat = planilha.getSheetByName("CAD_CATEGORIAS");

    // referenciando a última linha de cada aba
    var ultimaLinhaCadCat = guiaCadCat.getLastRow() - 1;

    // a quantidade de linhas não pode ser 0
    if (ultimaLinhaCadCat <= 0) ultimaLinhaCadCat = 1;

    // Pegando os valores dos cadastros
    var categoriasCadastradas = guiaCadCat.getRange(2, 1, ultimaLinhaCadCat, 2).getValues();

    // Vamos pegar o nome da atividade e o código, pois na tabela fato vamos armazenar o código
    categoriasCadastradas = categoriasCadastradas.map(function(r) {
      return { codigo: r[0], nome: r[1] };
    });
    

    // Remove duplicados com base no nome (opcional)
    categoriasCadastradas = Array.from(new Map(categoriasCadastradas.map(obj => [obj.nome, obj])).values());


    // Ordena alfabeticamente pelo nome da atividade
    categoriasCadastradas.sort((a, b) => a.nome.localeCompare(b.nome));


    // Pegando TODOS os dados para preencher a tabela (4 colunas)
    var todosOsDados = guiaCadCat.getRange(2, 1, ultimaLinhaCadCat, 4).getDisplayValues();

    // Passando os dados capturados para o tamplate (HTML)
    template.categoriasCadastradas = categoriasCadastradas;
    template.dadosTabela = todosOsDados;

  }








  if (e.parameter.page == 'Cadastro_Subcat') {

    // Chamando a página do link
    template = HtmlService.createTemplateFromFile('Cadastro_Subcat');

    // Define título dinâmico
    template.tituloPagina = "CADASTRO DE SUBCATEGORIAS";

    // Esse trecho é usado para renderizar os valores na lista suspensa assim que a página abrir, é diferente do anterior, pois aqui os valores precisam ser únicos
    // refreenciando a planilha
    var planilha = SpreadsheetApp.getActiveSpreadsheet();

    // referenciando as abas
    var guiaCadCat = planilha.getSheetByName("CAD_CATEGORIAS");
    var guiaCadSubcat = planilha.getSheetByName("CAD_SUBCATEGORIAS");

    // referenciando a última linha de cada aba
    var ultimaLinhaCadCat = guiaCadCat.getLastRow() - 1;
    var ultimaLinhaCadSubcat = guiaCadSubcat.getLastRow() - 1;

    // a quantidade de linhas não pode ser 0
    if (ultimaLinhaCadCat <= 0) ultimaLinhaCadCat = 1;
    if (ultimaLinhaCadSubcat <= 0) ultimaLinhaCadSubcat = 1;

    // Pegando os valores dos cadastros
    var categoriasCadastradas = guiaCadCat.getRange(2, 1, ultimaLinhaCadCat, 2).getValues();

    categoriasCadastradas = categoriasCadastradas.map(function(r) {
      return { codigo: r[0], nome: r[1] };
    });

    // Remove duplicados com base no nome (opcional)
    categoriasCadastradas = Array.from(new Map(categoriasCadastradas.map(obj => [obj.nome, obj])).values());

    // Ordena alfabeticamente pelo nome da atividade
    categoriasCadastradas.sort((a, b) => a.nome.localeCompare(b.nome));

    // Pegando TODOS os dados para preencher a tabela (4 colunas)
    var todosOsDados = guiaCadSubcat.getRange(2, 1, ultimaLinhaCadSubcat, 5).getDisplayValues();

    // Passando os dados capturados para o tamplate (HTML)
    template.categoriasCadastradas = categoriasCadastradas;
    template.dadosTabela = todosOsDados;

  }








  if (e.parameter.page == 'Cadastro_Filial') {

    // Chamando a página do link
    template = HtmlService.createTemplateFromFile('Cadastro_Filial');

    // Define título dinâmico
    template.tituloPagina = "CADASTRO DE FILIAL";

    // Esse trecho é usado para renderizar os valores na lista suspensa assim que a página abrir, é diferente do anterior, pois aqui os valores precisam ser únicos
    // refreenciando a planilha
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    // referenciando a aba
    var guiaCadFil = planilha.getSheetByName("CAD_FILIAL");
    // referenciando a última linha
    var ultimaLinha = guiaCadFil.getLastRow() - 1;
    // a quantidade de linhas não pode ser 0
    if (ultimaLinha <= 0) ultimaLinha = 1;

    // Pegando TODOS os dados para preencher a tabela (4 colunas)
    var todosOsDados = guiaCadFil.getRange(2, 1, ultimaLinha, 14).getDisplayValues();

    todosOsDados = todosOsDados.filter(function(linha) {
      var status = (linha[13] || "").toString().trim().toUpperCase(); // coluna N
      return status !== "N";
    });

    // envia só as 13 colunas visíveis para a interface
    todosOsDados = todosOsDados.map(function(linha) {
      return linha.slice(0, 13);
    });

    template.dadosTabela = todosOsDados;

  }








  if (e.parameter.page == 'Cadastro_Fornecedor') {

    // Chamando a página do link
    template = HtmlService.createTemplateFromFile('Cadastro_Fornecedor');

    // Define título dinâmico
    template.tituloPagina = "CADASTRO DE FORNECEDOR";

    // refreenciando a planilha
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    // referenciando a aba
    var guiaCadForn = planilha.getSheetByName("CAD_FORNECEDOR");
    // referenciando a última linha
    var ultimaLinha = guiaCadForn.getLastRow() - 1;
    // a quantidade de linhas não pode ser 0
    if (ultimaLinha <= 0) ultimaLinha = 1;

    // Pegando TODOS os dados para preencher a tabela (12 colunas)
    var todosOsDados = guiaCadForn.getRange(2, 1, ultimaLinha, 25).getDisplayValues();

    todosOsDados = todosOsDados.filter(function(linha) {
      var status = (linha[24] || "").toString().trim().toUpperCase();
      return status !== "N";
    });
    
    template.dadosTabela = todosOsDados;

  }










  if (e.parameter.page == 'Cadastro_Cliente') {

    // Chamando a página do link
    template = HtmlService.createTemplateFromFile('Cadastro_Cliente');

    // Define título dinâmico
    template.tituloPagina = "CADASTRO DE CLIENTE";

    // refreenciando a planilha
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    // referenciando a aba
    var guiaCadCli = planilha.getSheetByName("CAD_CLIENTE");
    // referenciando a última linha
    var ultimaLinha = guiaCadCli.getLastRow() - 1;
    // a quantidade de linhas não pode ser 0
    if (ultimaLinha <= 0) ultimaLinha = 1;

    // Pegando TODOS os dados para preencher a tabela (12 colunas)
    var todosOsDados = guiaCadCli.getRange(2, 1, ultimaLinha, 26).getDisplayValues();

    todosOsDados = todosOsDados.filter(function(linha) {
      var status = (linha[25] || "").toString().trim().toUpperCase();
      return status !== "N";
    });

    var dadosTabelaInterface = todosOsDados.map(function(linha) {
      return linha.slice(0, 25);
    });
    
    template.dadosTabela = dadosTabelaInterface;

  }










  if (e.parameter.page == 'Cadastro_Produto') { 

    sincronizarStatusPromocoes_();

    template = HtmlService.createTemplateFromFile('Cadastro_Produto');
    template.tituloPagina = "CADASTRO DE PRODUTO";

    var planilha = SpreadsheetApp.getActiveSpreadsheet();

    var guiaCadProd = planilha.getSheetByName("CAD_PRODUTO");
    var guiaCadSaida = planilha.getSheetByName("CAD_SAIDA_EST");
    var guiaCadCat = planilha.getSheetByName("CAD_CATEGORIAS");
    var guiaCadSubcat = planilha.getSheetByName("CAD_SUBCATEGORIAS");
    var guiaCadForn = planilha.getSheetByName("CAD_FORNECEDOR");
    
    var ultimaLinhaProd = guiaCadProd.getLastRow() - 1;
    var ultimaLinhaCat = guiaCadCat.getLastRow() - 1;
    var ultimaLinhaSubcat = guiaCadSubcat.getLastRow() - 1;
    var ultimaLinhaForn = guiaCadForn.getLastRow() - 1;
    var ultimaLinhaSaida = guiaCadSaida.getLastRow() - 1;

    var itensCat = [];
    var itensSubcat = [];
    var itensForn = [];

    if (ultimaLinhaCat > 0) {
      itensCat = guiaCadCat.getRange(2, 1, ultimaLinhaCat, 2).getValues()
        .map(function(r) {
          return { codigo: r[0], nome: r[1] };
        });
    }

    if (ultimaLinhaSubcat > 0) {
      itensSubcat = guiaCadSubcat.getRange(2, 1, ultimaLinhaSubcat, 3).getValues()
        .map(function(r) {
          return {
            codigo: r[0],
            categoriaMae: r[1],
            nome: r[2]
          };
        });
    }

    if (ultimaLinhaForn > 0) {
      itensForn = guiaCadForn.getRange(2, 1, ultimaLinhaForn, 2).getValues()
        .map(function(r) {
          return { codigo: r[0], nome: r[1] };
        });
    }

    itensCat = Array.from(new Map(itensCat.map(function(obj) {
      return [obj.nome, obj];
    })).values());

    itensForn = Array.from(new Map(itensForn.map(function(obj) {
      return [obj.nome, obj];
    })).values());

    itensSubcat = Array.from(new Map(itensSubcat.map(function(obj) {
      return [obj.categoriaMae + "|" + obj.nome, obj];
    })).values());

    itensCat.sort(function(a, b) { return a.nome.localeCompare(b.nome); });
    itensForn.sort(function(a, b) { return a.nome.localeCompare(b.nome); });
    itensSubcat.sort(function(a, b) { return a.nome.localeCompare(b.nome); });

    var dadosTabelaProdInterface = [];

    if (ultimaLinhaProd > 0) {
      var todosOsDadosProd = guiaCadProd.getRange(2, 1, ultimaLinhaProd, 22).getDisplayValues();

      var dadosAtivosProd = todosOsDadosProd.filter(function(linha) {
        var status = (linha[21] || "").toString().trim().toUpperCase();
        return status !== "N";
      });

      dadosTabelaProdInterface = dadosAtivosProd.map(function(linha) {
        return linha.slice(0, 21);
      });
    }

    var todosOsDadosSaida = [];

    if (ultimaLinhaSaida > 0) {
      todosOsDadosSaida = guiaCadSaida.getRange(2, 2, ultimaLinhaSaida, 4).getDisplayValues()
        .filter(function(linha) {
          return linha.some(function(valor) {
            return String(valor || "").trim() !== "";
          });
        });
    }

    template.itensCat = itensCat;
    template.itensSubcat = itensSubcat;
    template.itensForn = itensForn;
    template.dadosTabelaProd = dadosTabelaProdInterface;
    template.dadosTabelaSaida = todosOsDadosSaida;
  }




  if (e.parameter.page == 'Estoque') {

    template = HtmlService.createTemplateFromFile('Estoque');
    template.tituloPagina = "ESTOQUE";

    // Carga inicial enxuta: o backend centraliza a primeira pagina, listas auxiliares
    // e NFs apenas das movimentacoes exibidas.
    var pacoteEstoque = montarPacoteEstoquePaginado_({ offset: 0, limite: 100, filtros: {} });

    template.itensProd = pacoteEstoque.itensProd || [];
    template.itensFil = pacoteEstoque.itensFil || [];
    template.dadosTabela = pacoteEstoque.dadosCompletos || [];
    template.dadosNfs = pacoteEstoque.dadosNfs || [];
    template.listasFiltrosEstoque = pacoteEstoque.listasFiltros || {};
    template.paginacaoEstoque = pacoteEstoque.paginacao || {};

  }





  if (e.parameter.page == 'MenuVendas') {

    // Chamando a página do link
    template = HtmlService.createTemplateFromFile('MenuVendas');

    // Define título dinâmico
    template.tituloPagina = "MENU DE VENDAS";
    
  }


  if (e.parameter.page == 'MenuDashboard') {

    template = HtmlService.createTemplateFromFile('MenuDashboard');
    template.tituloPagina = "MENU DE DASHBOARD";

  }

  if (e.parameter.page == 'Dashboard_Relatorios_Operacionais') {

    template = HtmlService.createTemplateFromFile('Dashboard_Relatorios_Operacionais');
    template.tituloPagina = "RELATORIOS OPERACIONAIS";
    template.pacoteDashboardOperacional = JSON.stringify(buscarPacoteInicialDashboardOperacionalInterno_()).replace(/<\//g, '<\\/');

  }


  if (e.parameter.page == 'Gestao_Acessos') {

    template = HtmlService.createTemplateFromFile('Gestao_Acessos');
    template.tituloPagina = "GESTÃO DE ACESSOS";

  }






  if (e.parameter.page == 'Controle_Usuarios') {

    template = HtmlService.createTemplateFromFile('Controle_Usuarios');
    template.tituloPagina = "CONTROLE DE USUÁRIOS";
    template.dadosTabelaUsuarios = [];
    template.listasControleUsuarios = {
      clientes: [],
      perfis: []
    };

  }

  if (e.parameter.page == 'Caixa') {

    sincronizarStatusPromocoes_();

    // Chamando a página do link
    template = HtmlService.createTemplateFromFile('Caixa');

    // Define título dinâmico
    template.tituloPagina = "FRENTE DE CAIXA";

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    // referenciando as abas
    var guiaCadProd = planilha.getSheetByName("CAD_PRODUTO");
    var guiaCadSaida = planilha.getSheetByName("CAD_SAIDA_EST");
    var guiaCadFil = planilha.getSheetByName("CAD_FILIAL");
    var guiaPromo = planilha.getSheetByName("CAD_PROMOCAO");

    var ultimaLinhaSai = guiaCadSaida.getLastRow() - 1;
    var ultimaLinhaFil = guiaCadFil.getLastRow() - 1;

    // a quantidade de linhas não pode ser 0
    if (ultimaLinhaSai <= 0) ultimaLinhaSai = 1;
    if (ultimaLinhaFil <= 0) ultimaLinhaFil = 1;

    // Pegando a lista de valores da página referenciada
    var itensProd = buscarProdutosBasicosCaixa_(guiaCadProd);
    var itensSaiRaw = guiaCadSaida.getRange(2, 2, ultimaLinhaSai, 4).getValues();
    var itensFilRaw = guiaCadFil.getRange(2, 1, ultimaLinhaFil, 2).getValues();
    var itensPromo = buscarPromocoesAtivasCaixa_(guiaPromo);

      var itensSaida = itensSaiRaw.map(function(r) {
        return {
          codigoprod: (r[0] == null ? '' : String(r[0]).trim()),
          codigosaida:   (r[1] == null ? '' : String(r[1]).trim()),
          qtd:   (r[2] == null ? '' : String(r[2]).trim()),
          preco:   (r[3] == null ? '' : String(r[3]).trim())
        };
      }).filter(function(obj){
        return obj.codigoprod !== ''; // remove vazios (opcional, mas recomendado)
      });


      var itensFil = itensFilRaw.map(function(r) {
        return {
          codigo: (r[0] == null ? '' : String(r[0]).trim()),
          nome:   (r[1] == null ? '' : String(r[1]).trim())
        };
      }).filter(function(obj){
        return obj.nome !== '';
      });

        // Remove duplicados com base no nome (opcional)
    itensFil = Array.from(new Map(itensFil.map(obj => [obj.nome, obj])).values());

    // Ordena alfabeticamente pelo nome
    itensFil.sort((a, b) => a.nome.localeCompare(b.nome));
    
    template.itensProd = itensProd;
    template.itensSaida = itensSaida;
    template.itensFil = itensFil;
    template.itensEst = [];
    template.itensPromo = itensPromo;
    template.itensCli = [];
    template.resumoClientesVenda = {};

  }





  // Vamos retornar o tamplate ativado, por padrão será o HTML "Menu", no entanto se cair em alguma condicional no caminho retorna o tamplate da condição 
  if (e.parameter.page == 'Gestao_Vendas') {

    template = HtmlService.createTemplateFromFile('Gestao_Vendas');
    template.tituloPagina = "GESTÃO DE VENDAS";

    var dadosGestaoVendas = montarDadosGestaoVendasPaginado_({ offset: 0, limite: 100, filtros: {} });

    template.dadosVendas = dadosGestaoVendas.dadosVendas || [];
    template.dadosProdutosVenda = dadosGestaoVendas.dadosProdutosVenda || [];
    template.itensProd = dadosGestaoVendas.itensProd || [];
    template.itensSaida = dadosGestaoVendas.itensSaida || [];
    template.itensFil = dadosGestaoVendas.itensFil || [];
    template.itensCli = dadosGestaoVendas.itensCli || [];
    template.listasFiltros = dadosGestaoVendas.listasFiltros || {};
    template.paginacao = dadosGestaoVendas.paginacao || {};

  }

  return template.evaluate()
    // Colocando o título do site
    .setTitle("Insight Pad")
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
}






// Processa o login por POST para manter a navegação como ação real do usuário no sandbox do Apps Script.
function montarGateSessao_(pageSolicitada) {
  var templateGate = HtmlService.createTemplateFromFile("Sessao_Gate");
  templateGate.pageDestino = String(pageSolicitada || "Menu").trim() || "Menu";
  templateGate.urlWebApp = ScriptApp.getService().getUrl();

  return templateGate.evaluate()
    .setTitle("Insight Pad")
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function carregarLoginPublico() {
  var templateLogin = HtmlService.createTemplateFromFile("Login");
  templateLogin.tituloPagina = "LOGIN";
  templateLogin.urlWebApp = ScriptApp.getService().getUrl();
  return templateLogin.evaluate().getContent();
}

function doPost(e) {
  e = e || { parameter: {} };
  var parametros = e.parameter || {};

  if (String(parametros.acao || "").trim() === "login") {
    return processarLoginPost_(parametros);
  }

  return doGet({ parameter: { page: "Login" } });
}

function processarLoginPost_(parametros) {
  var urlWebApp = ScriptApp.getService().getUrl();
  var proximaPagina = String(parametros.next || "Menu").trim() || "Menu";

  if (proximaPagina === "Login") proximaPagina = "Menu";
  if (!/^[A-Za-z0-9_]+$/.test(proximaPagina)) proximaPagina = "Menu";

  var resultado = loginUsuario({
    login: parametros.login || "",
    senha: parametros.senha || "",
    userAgent: parametros.userAgent || "",
    idDispositivo: parametros.idDispositivo || ""
  });

  if (!resultado || !resultado.sucesso || !resultado.token) {
    var mensagemErro = (resultado && resultado.mensagem) ? resultado.mensagem : "Não foi possível realizar o login.";
    var urlErro = urlWebApp + "?page=Login&erroLogin=" + encodeURIComponent(mensagemErro);

    return HtmlService
      .createHtmlOutput(montarHtmlPonteLogin_(urlErro, null))
      .setTitle("Insight Pad");
  }

  var destino = urlWebApp + "?page=" + encodeURIComponent(proximaPagina);
  if (resultado.codigoAcesso) {
    destino += "&authCode=" + encodeURIComponent(resultado.codigoAcesso);
  }

  return HtmlService
    .createHtmlOutput(montarHtmlPonteLogin_(destino, {
      token: resultado.token || "",
      expiraEm: resultado.expiraEm || "",
      usuario: resultado.usuario || {},
      permissoes: resultado.permissoes || {}
    }))
    .setTitle("Insight Pad");
}

function montarHtmlPonteLogin_(destino, sessao) {
  var sessaoJson = JSON.stringify(sessao || null);
  var destinoJson = JSON.stringify(destino || ScriptApp.getService().getUrl() + "?page=Login");

  return '<!DOCTYPE html>' +
    '<html><head><base target="_top"><meta charset="UTF-8"><title>Insight Pad</title>' +
    '<style>' +
    'html,body{margin:0;width:100%;height:100%;background:#000;color:#fff;font-family:Arial,sans-serif;overflow:hidden}' +
    '.box{width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px}' +
    '.spinner{width:74px;height:74px;border:4px solid rgba(66,220,250,.16);border-top-color:#42DCFA;border-radius:50%;animation:girar 1s linear infinite}' +
    '.txt{font-weight:800;letter-spacing:.04em;color:#fff}' +
    '@keyframes girar{to{transform:rotate(360deg)}}' +
    '</style></head><body>' +
    '<div class="box"><div class="spinner"></div><div class="txt">ACESSANDO O SISTEMA...</div></div>' +
    '<script>' +
    '(function(){' +
    'var sessao=' + sessaoJson + ';' +
    'if(sessao){' +
    'localStorage.setItem("insightpad_auth_token",sessao.token||"");' +
    'localStorage.setItem("insightpad_auth_expira",sessao.expiraEm||"");' +
    'localStorage.setItem("insightpad_auth_usuario",JSON.stringify(sessao.usuario||{}));' +
    'localStorage.setItem("insightpad_auth_permissoes",JSON.stringify(sessao.permissoes||{}));' +
    '}' +
    'window.location.replace(' + destinoJson + ');' +
    '})();' +
    '</script></body></html>';
}

// Essa função será utilizada nos arquios de HTML para conseguirmos importar o código de outras abas para nosso HTML principal, como a estilização, como o GS, e o JS ----------------------------------------------------------------------------------------------------------------------------------------------------------
function Chamar(Arquivo, data){

    // O parametro data, será utilizado quando puxarmos um HTML para dentro de outro e esse HTML incorporado tiver funções dentro dele, por exemplo o cabeçalho
    // Para esses casos, o parametro data será o nome da função que o HTML incorporado possui
    if (data) {
      // Se passou dados, processa como template
      var t = HtmlService.createTemplateFromFile(Arquivo);
      Object.keys(data).forEach(function(k) {
        t[k] = data[k];
      });
      return t.evaluate().getContent();
    } else {
      // Se não passou dados, só puxa o conteúdo cru (CSS, JS, etc.)
      return HtmlService.createHtmlOutputFromFile(Arquivo).getContent();
    }

}
