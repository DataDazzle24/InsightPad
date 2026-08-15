function cadastrarNovaCategoria(nomeCategoria) {
    
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Categoria", "CADASTRAR");
        if (!auth.sucesso) return auth;

        // Referenciando a planilha
        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCat = planilha.getSheetByName("CAD_CATEGORIAS");
        
        // Verificar se a aba existe
        if (!guiaCadCat) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_CATEGORIAS não encontrada!"
            };
        }
        
        // Verificar se a categoria já existe
        var ultimaLinha = guiaCadCat.getLastRow();
        if (ultimaLinha > 1) {
            var categoriasExistentes = guiaCadCat.getRange(2, 2, ultimaLinha - 1, 1).getValues();
            for (var i = 0; i < categoriasExistentes.length; i++) {
                if (categoriasExistentes[i][0].toString().toUpperCase() === nomeCategoria) {
                    return {
                        sucesso: false,
                        mensagem: "Esta categoria já existe!"
                    };
                }
            }
        }
        
        // Gerar novo ID (pega o maior ID e adiciona 1)
        var novoId = 1;
        if (ultimaLinha > 1) {
            var ids = guiaCadCat.getRange(2, 1, ultimaLinha - 1, 1).getValues();
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
            dataHoraAtual,       // Data de Criação
            dataHoraAtual        // Data de Alteração
        ];
        
        // Inserir na próxima linha disponível
        var proximaLinha = guiaCadCat.getLastRow() + 1;
        guiaCadCat.getRange(proximaLinha, 1, 1, 4).setValues([novaLinha]);
        
        console.log("Categoria cadastrada com sucesso:", novaLinha);
        
        return {
            sucesso: true,
            mensagem: "Categoria cadastrada com sucesso!",
            dados: novaLinha
        };
        
    } catch (erro) {
        console.error("Erro ao cadastrar categoria:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao cadastrar: " + erro.toString()
        };
    }
}




function cadastrarCategoriasEmLote(listaCategorias) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Categoria", "CADASTRAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCat = planilha.getSheetByName("CAD_CATEGORIAS");

        if (!guiaCadCat) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_CATEGORIAS não encontrada!"
            };
        }

        if (!listaCategorias || !Array.isArray(listaCategorias) || listaCategorias.length === 0) {
            return {
                sucesso: false,
                mensagem: "Nenhuma categoria foi informada para cadastro."
            };
        }

        var categoriasTratadas = listaCategorias
            .map(function(nome) {
                return String(nome || "").trim().toUpperCase();
            })
            .filter(function(nome) {
                return nome !== "";
            });

        if (categoriasTratadas.length === 0) {
            return {
                sucesso: false,
                mensagem: "Nenhuma categoria válida foi informada."
            };
        }

        if (categoriasTratadas.length > 20) {
            return {
                sucesso: false,
                mensagem: "O limite máximo por cadastro é de 20 categorias."
            };
        }

        var categoriasUnicas = Array.from(new Set(categoriasTratadas));

        if (categoriasUnicas.length !== categoriasTratadas.length) {
            return {
                sucesso: false,
                mensagem: "Existem categorias repetidas no lote informado."
            };
        }

        var ultimaLinha = guiaCadCat.getLastRow();

        var categoriasExistentes = [];
        var idsExistentes = [];

        if (ultimaLinha > 1) {
            categoriasExistentes = guiaCadCat.getRange(2, 2, ultimaLinha - 1, 1).getValues()
                .map(function(linha) {
                    return String(linha[0] || "").trim().toUpperCase();
                });

            idsExistentes = guiaCadCat.getRange(2, 1, ultimaLinha - 1, 1).getValues()
                .map(function(linha) {
                    return parseInt(linha[0], 10);
                })
                .filter(function(id) {
                    return !isNaN(id);
                });
        }

        var categoriasExistentesSet = new Set(categoriasExistentes);

        var categoriasDuplicadasNoBanco = categoriasUnicas.filter(function(nome) {
            return categoriasExistentesSet.has(nome);
        });

        if (categoriasDuplicadasNoBanco.length > 0) {
            return {
                sucesso: false,
                mensagem: "As seguintes categorias já existem: " + categoriasDuplicadasNoBanco.join(", ")
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

        var novasLinhas = categoriasUnicas.map(function(nome, indice) {
            return [
                maiorId + indice + 1,
                nome,
                dataHoraAtual,
                dataHoraAtual
            ];
        });

        var proximaLinha = guiaCadCat.getLastRow() + 1;
        guiaCadCat.getRange(proximaLinha, 1, novasLinhas.length, 4).setValues(novasLinhas);

        return {
            sucesso: true,
            mensagem: categoriasUnicas.length === 1
                ? "Categoria cadastrada com sucesso!"
                : categoriasUnicas.length + " categorias cadastradas com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao cadastrar categorias em lote:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao cadastrar categorias: " + erro.toString()
        };
    }
}


















function buscarDadosAtualizadosCad() {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Categoria", "ACESSAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCat = planilha.getSheetByName("CAD_CATEGORIAS");
        
        if (!guiaCadCat) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_CATEGORIAS não encontrada!"
            };
        }
        
        var ultimaLinha = guiaCadCat.getLastRow() - 1;
        if (ultimaLinha <= 0) ultimaLinha = 1;
        
        // Buscar apenas nomes únicos para o dropdown
        var nomesCategoria = guiaCadCat.getRange(2, 2, ultimaLinha, 1).getValues();
        var categoriasUnicas = nomesCategoria
            .map(function(r) { return r[0]; })
            .filter(function(item) { return item && item.toString().trim() !== ''; });
        
        // Remove duplicados e ordena
        categoriasUnicas = Array.from(new Set(categoriasUnicas));
        categoriasUnicas.sort();
        
        // Buscar todos os dados para a tabela
        var dadosCompletos = guiaCadCat.getRange(2, 1, ultimaLinha, 4).getDisplayValues();
        
        return {
            sucesso: true,
            categorias: categoriasUnicas,
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




















function excluirCategoria(idCategoria) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Categoria", "EXCLUIR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCat = planilha.getSheetByName("CAD_CATEGORIAS");
        
        if (!guiaCadCat) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_CATEGORIAS não encontrada!"
            };
        }
        
        var ultimaLinha = guiaCadCat.getLastRow();
        
        // Procurar a linha com o ID correspondente
        var ids = guiaCadCat.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhaParaExcluir = -1;
        
        for (var i = 0; i < ids.length; i++) {
            if (ids[i][0].toString() === idCategoria.toString()) {
                linhaParaExcluir = i + 2; // +2 porque começa na linha 2 e o índice é 0-based
                break;
            }
        }
        
        if (linhaParaExcluir === -1) {
            return {
                sucesso: false,
                mensagem: "Categoria não encontrada!"
            };
        }
        
        // Excluir a linha inteira
        guiaCadCat.deleteRow(linhaParaExcluir);
        
        console.log("Categoria com ID", idCategoria, "excluída da linha", linhaParaExcluir);
        
        return {
            sucesso: true,
            mensagem: "Categoria excluída com sucesso!"
        };
        
    } catch (erro) {
        console.error("Erro ao excluir categoria:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao excluir: " + erro.toString()
        };
    }
}










function editarCategoria(idCategoria, novoNome) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Categoria", "EDITAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCat = planilha.getSheetByName("CAD_CATEGORIAS");
        
        if (!guiaCadCat) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_CATEGORIAS não encontrada!"
            };
        }
        
        var ultimaLinha = guiaCadCat.getLastRow();
        
        // Procurar a linha com o ID correspondente
        var ids = guiaCadCat.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhaParaEditar = -1;
        
        for (var i = 0; i < ids.length; i++) {
            if (ids[i][0].toString() === idCategoria.toString()) {
                linhaParaEditar = i + 2; // +2 porque começa na linha 2 e o índice é 0-based
                break;
            }
        }
        
        if (linhaParaEditar === -1) {
            return {
                sucesso: false,
                mensagem: "Categoria não encontrada!"
            };
        }
        
        // Verificar se o novo nome já existe em outra categoria
        var nomes = guiaCadCat.getRange(2, 2, ultimaLinha - 1, 1).getValues();
        for (var i = 0; i < nomes.length; i++) {
            var linhaAtual = i + 2;
            if (linhaAtual !== linhaParaEditar && nomes[i][0].toString().toUpperCase() === novoNome) {
                return {
                    sucesso: false,
                    mensagem: "Já existe uma categoria com este nome!"
                };
            }
        }
        
        // Obter data e hora atual formatada
        var dataHoraAtual = Utilities.formatDate(
            new Date(), 
            Session.getScriptTimeZone(), 
            "dd/MM/yyyy HH:mm:ss"
        );
        
        // Editar o nome da categoria (coluna B)
        guiaCadCat.getRange(linhaParaEditar, 2).setValue(novoNome);
        
        // Atualizar a data de alteração (coluna D)
        guiaCadCat.getRange(linhaParaEditar, 4).setValue(dataHoraAtual);
        
        console.log("Categoria com ID", idCategoria, "editada na linha", linhaParaEditar);
        
        return {
            sucesso: true,
            mensagem: "Categoria editada com sucesso!"
        };
        
    } catch (erro) {
        console.error("Erro ao editar categoria:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao editar: " + erro.toString()
        };
    }
}

function excluirCategoriasEmLote(idsCategorias) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Categoria", "EXCLUIR");
        if (!auth.sucesso) return auth;

        idsCategorias = Array.isArray(idsCategorias) ? idsCategorias : [idsCategorias];
        idsCategorias = idsCategorias
            .map(function(id) { return String(id || "").trim(); })
            .filter(function(id) { return id !== ""; });

        if (!idsCategorias.length) {
            return {
                sucesso: false,
                mensagem: "Nenhuma categoria informada para exclusão."
            };
        }

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCat = planilha.getSheetByName("CAD_CATEGORIAS");

        if (!guiaCadCat) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_CATEGORIAS não encontrada!"
            };
        }

        var ultimaLinha = guiaCadCat.getLastRow();
        if (ultimaLinha < 2) {
            return {
                sucesso: false,
                mensagem: "Nenhuma categoria cadastrada."
            };
        }

        var mapaIds = {};
        idsCategorias.forEach(function(id) {
            mapaIds[id] = true;
        });

        var ids = guiaCadCat.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhasParaExcluir = [];

        for (var i = 0; i < ids.length; i++) {
            if (mapaIds[String(ids[i][0])]) {
                linhasParaExcluir.push(i + 2);
            }
        }

        if (!linhasParaExcluir.length) {
            return {
                sucesso: false,
                mensagem: "Nenhuma categoria selecionada foi encontrada."
            };
        }

        for (var j = linhasParaExcluir.length - 1; j >= 0; j--) {
            guiaCadCat.deleteRow(linhasParaExcluir[j]);
        }

        return {
            sucesso: true,
            mensagem: linhasParaExcluir.length === 1 ? "Categoria excluída com sucesso!" : "Categorias excluídas com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao excluir categorias em lote:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao excluir: " + erro.toString()
        };
    }
}
