
// =================================================================================================================================================================
// FUNÇÃO DE CADASTRO 
// =================================================================================================================================================================

function obterCategoriasMaeCadastradas_(planilha) {
    var guiaCategorias = planilha.getSheetByName("CAD_CATEGORIAS");
    if (!guiaCategorias) return null;

    var ultimaLinha = guiaCategorias.getLastRow();
    if (ultimaLinha < 2) return new Set();

    var nomes = guiaCategorias.getRange(2, 2, ultimaLinha - 1, 1).getDisplayValues();
    return new Set(nomes.map(function(row) {
        return String(row[0] || "").trim().toUpperCase();
    }).filter(function(nome) {
        return nome !== "";
    }));
}

function cadastrarSubcategoria(nomeCategoria, nomeSubcat) { //
    
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Subcat", "CADASTRAR");
        if (!auth.sucesso) return auth;

        // Referenciando a planilha
        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaSubcat = planilha.getSheetByName("CAD_SUBCATEGORIAS");
        var categoriasMae = obterCategoriasMaeCadastradas_(planilha);

        if (!categoriasMae || !categoriasMae.has(String(nomeCategoria || "").trim().toUpperCase())) {
            return {
                sucesso: false,
                mensagem: "A categoria mãe informada não existe. Selecione uma categoria cadastrada."
            };
        }
        
        // Vamos pegar a última linha da aba 
        var ultimaLinha = guiaSubcat.getLastRow();

        // Vamos verificar se a subcategoria ja existe
        if (ultimaLinha > 1) {

            var subcategoriasExistentes = guiaSubcat.getRange(2, 3, ultimaLinha - 1, 1).getValues();
            var categoriasExistentes = guiaSubcat.getRange(2, 2, ultimaLinha - 1, 1).getValues();

            for (var i = 0; i < subcategoriasExistentes.length; i++) {

                if (subcategoriasExistentes[i][0].toString().toUpperCase() === nomeSubcat && categoriasExistentes[i][0].toString().toUpperCase() === nomeCategoria) {
                    return {
                        sucesso: false,
                        mensagem: "Esta subcategoria já existe para esta categoria!"
                    };
                }
            }
        }
        
        // Gerar novo ID (pega o maior ID e adiciona 1)
        var novoId = 1;
        if (ultimaLinha > 1) {
            var ids = guiaSubcat.getRange(2, 1, ultimaLinha - 1, 1).getValues();
            var maiorId = 0;
            ids.forEach(function(row) {
                var id = parseInt(row[0]);
                if (!isNaN(id) && id > maiorId) {
                    maiorId = id;
                }
            });
            novoId = maiorId + 1;
        }
        
        // Obter data e hora atual formatada
        var dataHoraAtual = Utilities.formatDate(
            new Date(), 
            Session.getScriptTimeZone(), 
            "dd/MM/yyyy HH:mm:ss"
        );
        
        // Preparar dados para inserir
        var novaLinha = [
            novoId,              // ID
            nomeCategoria,       // Nome da Categoria
            nomeSubcat,
            dataHoraAtual,       // Data de Criação
            dataHoraAtual        // Data de Alteração
        ];
        
        // Inserir na próxima linha disponível
        var proximaLinha = guiaSubcat.getLastRow() + 1;
        guiaSubcat.getRange(proximaLinha, 1, 1, 5).setValues([novaLinha]);
        
        console.log("Subcategoria cadastrada com sucesso:", novaLinha);
        
        return {
            sucesso: true,
            mensagem: "Subcategoria cadastrada com sucesso!",
            dados: novaLinha
        };
        
    } catch (erro) {
        console.error("Erro ao cadastrar subcategoria:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao cadastrar: " + erro.toString()
        };
    }
}


function cadastrarSubcategoriasEmLote(listaSubcategorias) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Subcat", "CADASTRAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaSubcat = planilha.getSheetByName("CAD_SUBCATEGORIAS");
        var categoriasMae = obterCategoriasMaeCadastradas_(planilha);

        if (!guiaSubcat) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_SUBCATEGORIAS não encontrada!"
            };
        }

        if (!categoriasMae) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_CATEGORIAS não encontrada!"
            };
        }

        if (!listaSubcategorias || !Array.isArray(listaSubcategorias) || listaSubcategorias.length === 0) {
            return {
                sucesso: false,
                mensagem: "Nenhuma subcategoria foi informada para cadastro."
            };
        }

        var itensTratados = listaSubcategorias
            .map(function(item) {
                return {
                    categoria: String(item.categoria || "").trim().toUpperCase(),
                    subcategoria: String(item.subcategoria || "").trim().toUpperCase()
                };
            })
            .filter(function(item) {
                return item.categoria !== "" && item.subcategoria !== "";
            });

        if (itensTratados.length === 0) {
            return {
                sucesso: false,
                mensagem: "Nenhum item válido foi informado."
            };
        }

        var categoriasInvalidas = Array.from(new Set(itensTratados
            .map(function(item) { return item.categoria; })
            .filter(function(categoria) { return !categoriasMae.has(categoria); })));

        if (categoriasInvalidas.length > 0) {
            return {
                sucesso: false,
                mensagem: "As seguintes categorias mãe não existem: " + categoriasInvalidas.join(", ")
            };
        }

        if (itensTratados.length > 20) {
            return {
                sucesso: false,
                mensagem: "O limite máximo por cadastro é de 20 subcategorias."
            };
        }

        var chavesLote = itensTratados.map(function(item) {
            return item.categoria + "|||" + item.subcategoria;
        });

        var chavesLoteUnicas = Array.from(new Set(chavesLote));
        if (chavesLote.length !== chavesLoteUnicas.length) {
            return {
                sucesso: false,
                mensagem: "Existem combinações repetidas de categoria e subcategoria no lote."
            };
        }

        var ultimaLinha = guiaSubcat.getLastRow();

        var idsExistentes = [];
        var chavesBancoSet = new Set();

        if (ultimaLinha > 1) {
            idsExistentes = guiaSubcat.getRange(2, 1, ultimaLinha - 1, 1).getValues()
                .map(function(row) { return parseInt(row[0], 10); })
                .filter(function(id) { return !isNaN(id); });

            var dadosExistentes = guiaSubcat.getRange(2, 2, ultimaLinha - 1, 2).getValues();
            dadosExistentes.forEach(function(row) {
                var categoria = String(row[0] || "").trim().toUpperCase();
                var subcategoria = String(row[1] || "").trim().toUpperCase();
                if (categoria && subcategoria) {
                    chavesBancoSet.add(categoria + "|||" + subcategoria);
                }
            });
        }

        var duplicadasNoBanco = itensTratados.filter(function(item) {
            return chavesBancoSet.has(item.categoria + "|||" + item.subcategoria);
        });

        if (duplicadasNoBanco.length > 0) {
            return {
                sucesso: false,
                mensagem: "Já existem no banco: " + duplicadasNoBanco.map(function(item) {
                    return item.categoria + " / " + item.subcategoria;
                }).join(", ")
            };
        }

        var maiorId = 0;
        if (idsExistentes.length > 0) {
            maiorId = Math.max.apply(null, idsExistentes);
        }

        var dataHoraAtual = Utilities.formatDate(
            new Date(),
            Session.getScriptTimeZone(),
            "dd/MM/yyyy HH:mm:ss"
        );

        var novasLinhas = itensTratados.map(function(item, indice) {
            return [
                maiorId + indice + 1,
                item.categoria,
                item.subcategoria,
                dataHoraAtual,
                dataHoraAtual
            ];
        });

        var proximaLinha = guiaSubcat.getLastRow() + 1;
        guiaSubcat.getRange(proximaLinha, 1, novasLinhas.length, 5).setValues(novasLinhas);

        return {
            sucesso: true,
            mensagem: novasLinhas.length === 1
                ? "Subcategoria cadastrada com sucesso!"
                : novasLinhas.length + " subcategorias cadastradas com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao cadastrar subcategorias em lote:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao cadastrar subcategorias: " + erro.toString()
        };
    }
}
































// =================================================================================================================================================================
// FUNÇÃO DE ATUALIZAÇÃO
// =================================================================================================================================================================

function buscarDadosAtualizadosSubcategoria() {

    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Subcat", "ACESSAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaSubcat = planilha.getSheetByName("CAD_SUBCATEGORIAS");
        
        var ultimaLinha = guiaSubcat.getLastRow() - 1;
        if (ultimaLinha <= 0) ultimaLinha = 1;
        
        // Buscar todos os dados para a tabela
        var dadosCompletos = guiaSubcat.getRange(2, 1, ultimaLinha, 5).getDisplayValues();
        
        return {
            sucesso: true,
            dadosCompletos: dadosCompletos
        };
        
    } catch (erro) {
        console.error("Erro ao buscar dados:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao buscar dados: " + erro.toString()
        };
    }
}

































// =================================================================================================================================================================
// FUNÇÃO DE EXCLUSÃO
// =================================================================================================================================================================

function excluirSubcategoria(idSubcategoria) {

    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Subcat", "EXCLUIR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaSubcat = planilha.getSheetByName("CAD_SUBCATEGORIAS");
        
        var ultimaLinha = guiaSubcat.getLastRow();
        
        // Procurar a linha com o ID correspondente
        var ids = guiaSubcat.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhaParaExcluir = -1;
        
        for (var i = 0; i < ids.length; i++) {
            if (ids[i][0].toString() === idSubcategoria.toString()) {
                linhaParaExcluir = i + 2; // +2 porque começa na linha 2 e o índice é 0-based
                break;
            }
        }
        
        if (linhaParaExcluir === -1) {
            return {
                sucesso: false,
                mensagem: "Subcategoria não encontrada!"
            };
        }
        
        // Excluir a linha inteira
        guiaSubcat.deleteRow(linhaParaExcluir);
        
        return {
            sucesso: true,
            mensagem: "Subcategoria excluída com sucesso!"
        };
        
    } catch (erro) {
        console.error("Erro ao excluir subcategoria:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao excluir: " + erro.toString()
        };
    }
}

function excluirSubcategoriasEmLote(idsSubcategorias) {

    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Subcat", "EXCLUIR");
        if (!auth.sucesso) return auth;

        idsSubcategorias = Array.isArray(idsSubcategorias) ? idsSubcategorias : [idsSubcategorias];
        idsSubcategorias = idsSubcategorias
            .map(function(id) { return String(id || "").trim(); })
            .filter(function(id) { return id !== ""; });

        if (!idsSubcategorias.length) {
            return {
                sucesso: false,
                mensagem: "Nenhuma subcategoria informada para exclusão."
            };
        }

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaSubcat = planilha.getSheetByName("CAD_SUBCATEGORIAS");
        var ultimaLinha = guiaSubcat.getLastRow();

        if (ultimaLinha < 2) {
            return {
                sucesso: false,
                mensagem: "Nenhuma subcategoria cadastrada."
            };
        }

        var mapaIds = {};
        idsSubcategorias.forEach(function(id) {
            mapaIds[id] = true;
        });

        var ids = guiaSubcat.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhasParaExcluir = [];

        for (var i = 0; i < ids.length; i++) {
            if (mapaIds[String(ids[i][0])]) {
                linhasParaExcluir.push(i + 2);
            }
        }

        if (!linhasParaExcluir.length) {
            return {
                sucesso: false,
                mensagem: "Nenhuma subcategoria selecionada foi encontrada."
            };
        }

        for (var j = linhasParaExcluir.length - 1; j >= 0; j--) {
            guiaSubcat.deleteRow(linhasParaExcluir[j]);
        }

        return {
            sucesso: true,
            mensagem: linhasParaExcluir.length === 1 ? "Subcategoria excluída com sucesso!" : "Subcategorias excluídas com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao excluir subcategorias em lote:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao excluir: " + erro.toString()
        };
    }
}



































// =================================================================================================================================================================
// FUNÇÃO DE EDIÇÃO
// =================================================================================================================================================================

function editarSubcategoria(idSubcategoria, novoNomeCategoria, novoNomeSubcategoria) {

    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Subcat", "EDITAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaSubcat = planilha.getSheetByName("CAD_SUBCATEGORIAS");
        var categoriasMae = obterCategoriasMaeCadastradas_(planilha);

        if (!categoriasMae || !categoriasMae.has(String(novoNomeCategoria || "").trim().toUpperCase())) {
            return {
                sucesso: false,
                mensagem: "A categoria mãe informada não existe. Selecione uma categoria cadastrada."
            };
        }
        
        var ultimaLinha = guiaSubcat.getLastRow();
        
        // Procurar a linha com o ID correspondente
        var ids = guiaSubcat.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhaParaEditar = -1;
        
        for (var i = 0; i < ids.length; i++) {
            if (ids[i][0].toString() === idSubcategoria.toString()) {
                linhaParaEditar = i + 2; // +2 porque começa na linha 2 e o índice é 0-based
                break;
            }
        }
        
        if (linhaParaEditar === -1) {
            return {
                sucesso: false,
                mensagem: "Subcategoria não encontrada!"
            };
        }
        
        // Verificar se o novo nome já existe em outra subcategoria
        var nomes = guiaSubcat.getRange(2, 3, ultimaLinha - 1, 1).getValues();
        for (var i = 0; i < nomes.length; i++) {
            var linhaAtual = i + 2;
            if (linhaAtual !== linhaParaEditar && nomes[i][0].toString().toUpperCase() === novoNomeSubcategoria) {
                return {
                    sucesso: false,
                    mensagem: "Já existe uma subcategoria com este nome!"
                };
            }
        }
        
        // Obter data e hora atual formatada
        var dataHoraAtual = Utilities.formatDate(
            new Date(), 
            Session.getScriptTimeZone(), 
            "dd/MM/yyyy HH:mm:ss"
        );
        
        // Editar o nome da subcategoria (coluna C)
        guiaSubcat.getRange(linhaParaEditar, 3).setValue(novoNomeSubcategoria);
        // Editar o nome da categoria (coluna B)
        guiaSubcat.getRange(linhaParaEditar, 2).setValue(novoNomeCategoria);
        // Atualizar a data de alteração (coluna D)
        guiaSubcat.getRange(linhaParaEditar, 5).setValue(dataHoraAtual);
        
        
        return {
            sucesso: true,
            mensagem: "Subcategoria editada com sucesso!"
        };
        
    } catch (erro) {
        console.error("Erro ao editar subcategoria:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao editar: " + erro.toString()
        };
    }
}
