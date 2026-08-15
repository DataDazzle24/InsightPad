// ========================================
// FUNÇÃO: CADASTRAR NOVA FILIAL
// ========================================
/**
 * Cadastra uma nova filial na planilha CAD_FILIAL
 * @param {string} nomeFilial - Nome da filial
 * @param {string} uf - UF (2 caracteres)
 * @param {string} cidade - Nome da cidade
 * @param {string} bairro - Nome do bairro
 * @param {string} numero - Número do endereço
 * @param {string} telefone - Telefone com máscara (XX) XXXXX-XXXX
 * @return {object} Objeto com sucesso (boolean) e mensagem
 */
function cadastrarNovaFilial(nomeFilial, codInterno, cep, uf, cidade, bairro, endereco, numero, complemento, telefone) {
    
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Filial", "CADASTRAR");
        if (!auth.sucesso) return auth;

        // ====== REFERENCIA A PLANILHA ======
        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadFilial = planilha.getSheetByName("CAD_FILIAL");
        
        // Verifica se a aba existe
        if (!guiaCadFilial) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_FILIAL não encontrada!"
            };
        }
        
        // ====== VERIFICA SE A FILIAL JÁ EXISTE ======
        var ultimaLinha = guiaCadFilial.getLastRow();
        
        if (ultimaLinha > 1) {
            // Busca todos os nomes de filiais existentes (coluna B)
            var filiaisExistentes = guiaCadFilial.getRange(2, 2, ultimaLinha - 1, 1).getValues();
            
            // Percorre e verifica duplicidade
            for (var i = 0; i < filiaisExistentes.length; i++) {
                if (filiaisExistentes[i][0].toString().toUpperCase() === nomeFilial) {
                    return {
                        sucesso: false,
                        mensagem: "Esta filial já existe!"
                    };
                }
            }
        }
        
        // ====== GERA NOVO ID SEQUENCIAL ======
        var novoId = 1; // ID padrão se for a primeira linha
        
        if (ultimaLinha > 1) {
            // Busca todos os IDs existentes (coluna A)
            var ids = guiaCadFilial.getRange(2, 1, ultimaLinha - 1, 1).getValues();
            var maiorId = 0;
            
            // Encontra o maior ID
            ids.forEach(function(row) {
                var id = parseInt(row[0]);
                if (!isNaN(id) && id > maiorId) {
                    maiorId = id;
                }
            });
            
            // Novo ID = maior ID + 1
            novoId = maiorId + 1;
        }
        
        // ====== OBTÉM DATA E HORA ATUAL FORMATADA ======
        var dataHoraAtual = Utilities.formatDate(
            new Date(), 
            Session.getScriptTimeZone(), 
            "dd/MM/yyyy HH:mm:ss"
        );
        
        // ====== PREPARA DADOS PARA INSERÇÃO ======
        // Estrutura alinhada às 14 colunas da aba CAD_FILIAL.
        var novaLinha = [
            novoId,              // 1 ID
            nomeFilial,          // 2 NOME
            codInterno,          // 3 COD INTERNO
            cep,                 // 4 CEP
            uf,                  // 5 UF
            cidade,              // 6 CIDADE
            bairro,              // 7 BAIRRO
            endereco,            // 8 ENDEREÇO
            numero,              // 9 NUMERO
            complemento,         // 10 COMPLEMENTO
            telefone,            // 11 TELEFONE
            dataHoraAtual,       // 12 CRIADO_EM
            dataHoraAtual,       // 13 EDITADO_EM
            "S"                 // 14 STATUS_ATIVAÇÃO
        ];
        
        // ====== INSERE NA PRÓXIMA LINHA DISPONÍVEL ======
        var proximaLinha = guiaCadFilial.getLastRow() + 1;
        
        // Insere os 14 valores em uma única escrita.
        guiaCadFilial.getRange(proximaLinha, 1, 1, 14).setValues([novaLinha]);
        
        // Log de sucesso
        console.log("Filial cadastrada com sucesso:", novaLinha);
        
        // Retorna sucesso
        return {
            sucesso: true,
            mensagem: "Filial cadastrada com sucesso!",
            dados: novaLinha
        };
        
    } catch (erro) {
        // Log de erro
        console.error("Erro ao cadastrar filial:", erro.toString());
        
        // Retorna erro
        return {
            sucesso: false,
            mensagem: "Erro ao cadastrar: " + erro.toString()
        };
    }
}


// ========================================
// FUNÇÃO: BUSCAR DADOS ATUALIZADOS
// ========================================
/**
 * Busca todos os dados atualizados da planilha
 * Retorna nomes únicos para dropdown e dados completos para tabela
 * @return {object} Objeto com sucesso, array de filiais e dadosCompletos
 */
function buscarDadosAtualizados() {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Filial", "ACESSAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadFilial = planilha.getSheetByName("CAD_FILIAL");

        if (!guiaCadFilial) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_FILIAL não encontrada!"
            };
        }

        var ultimaLinha = guiaCadFilial.getLastRow() - 1;
        if (ultimaLinha <= 0) {
            return {
                sucesso: true,
                filiais: [],
                dadosCompletos: []
            };
        }

        var todosOsDados = guiaCadFilial.getRange(2, 1, ultimaLinha, 14).getDisplayValues();

        var dadosAtivos = todosOsDados.filter(function(linha) {
            var status = (linha[13] || "").toString().trim().toUpperCase();
            return status !== "N";
        });

        var filiaisUnicas = dadosAtivos
            .map(function(r) { return r[1]; }) // coluna B = nome filial
            .filter(function(item) {
                return item && item.toString().trim() !== '';
            });

        filiaisUnicas = Array.from(new Set(filiaisUnicas));
        filiaisUnicas.sort();

        var dadosCompletos = dadosAtivos.map(function(linha) {
            return linha.slice(0, 13);
        });

        return {
            sucesso: true,
            filiais: filiaisUnicas,
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


// ========================================
// FUNÇÃO: EXCLUIR FILIAL
// ========================================
/**
 * Exclui uma filial da planilha baseado no ID
 * @param {string} idFilial - ID da filial a ser excluída
 * @return {object} Objeto com sucesso (boolean) e mensagem
 */
function excluirFilial(idFilial) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Filial", "EXCLUIR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadFilial = planilha.getSheetByName("CAD_FILIAL");

        if (!guiaCadFilial) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_FILIAL não encontrada!"
            };
        }

        var ultimaLinha = guiaCadFilial.getLastRow();
        var ids = guiaCadFilial.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhaParaInativar = -1;

        for (var i = 0; i < ids.length; i++) {
            if (ids[i][0].toString() === idFilial.toString()) {
                linhaParaInativar = i + 2;
                break;
            }
        }

        if (linhaParaInativar === -1) {
            return {
                sucesso: false,
                mensagem: "Filial não encontrada!"
            };
        }

        var dataHoraAtual = Utilities.formatDate(
            new Date(),
            Session.getScriptTimeZone(),
            "dd/MM/yyyy HH:mm:ss"
        );

        // coluna M = última alteração
        guiaCadFilial.getRange(linhaParaInativar, 13).setValue(dataHoraAtual);

        // coluna N = status
        guiaCadFilial.getRange(linhaParaInativar, 14).setValue("N");

        console.log("Filial com ID", idFilial, "inativada na linha", linhaParaInativar);

        return {
            sucesso: true,
            mensagem: "Filial inativada com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao inativar filial:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao inativar: " + erro.toString()
        };
    }
}

function excluirFiliaisEmLote(idsFiliais) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Filial", "EXCLUIR");
        if (!auth.sucesso) return auth;

        idsFiliais = Array.isArray(idsFiliais) ? idsFiliais : [idsFiliais];
        idsFiliais = idsFiliais
            .map(function(id) { return String(id || "").trim(); })
            .filter(function(id) { return id !== ""; });

        if (!idsFiliais.length) {
            return {
                sucesso: false,
                mensagem: "Nenhuma filial informada para inativação."
            };
        }

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadFilial = planilha.getSheetByName("CAD_FILIAL");

        if (!guiaCadFilial) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_FILIAL não encontrada!"
            };
        }

        var ultimaLinha = guiaCadFilial.getLastRow();
        if (ultimaLinha < 2) {
            return {
                sucesso: false,
                mensagem: "Nenhuma filial cadastrada."
            };
        }

        var mapaIds = {};
        idsFiliais.forEach(function(id) {
            mapaIds[id] = true;
        });

        var ids = guiaCadFilial.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhasParaInativar = [];

        for (var i = 0; i < ids.length; i++) {
            if (mapaIds[String(ids[i][0])]) {
                linhasParaInativar.push(i + 2);
            }
        }

        if (!linhasParaInativar.length) {
            return {
                sucesso: false,
                mensagem: "Nenhuma filial selecionada foi encontrada."
            };
        }

        var dataHoraAtual = Utilities.formatDate(
            new Date(),
            Session.getScriptTimeZone(),
            "dd/MM/yyyy HH:mm:ss"
        );

        linhasParaInativar.forEach(function(linha) {
            guiaCadFilial.getRange(linha, 13).setValue(dataHoraAtual);
            guiaCadFilial.getRange(linha, 14).setValue("N");
        });

        return {
            sucesso: true,
            mensagem: linhasParaInativar.length === 1 ? "Filial inativada com sucesso!" : "Filiais inativadas com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao inativar filiais:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao inativar: " + erro.toString()
        };
    }
}


// ========================================
// FUNÇÃO: EDITAR FILIAL
// ========================================
/**
 * Edita dados de uma filial existente
 * @param {string} idFilial - ID da filial
 * @param {string} novoNome - Novo nome da filial
 * @param {string} novaUF - Nova UF
 * @param {string} novaCidade - Nova cidade
 * @param {string} novoBairro - Novo bairro
 * @param {string} novoTelefone - Novo telefone
 * @return {object} Objeto com sucesso (boolean) e mensagem
 */
function editarFilial(idFilial, novoNome, novoCodInterno, novoCep, novaUF, novaCidade, novoBairro, novoEndereco, novoNumero, novoComplemento, novoTelefone){
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Filial", "EDITAR");
        if (!auth.sucesso) return auth;

        // ====== REFERENCIA A PLANILHA ======
        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadFilial = planilha.getSheetByName("CAD_FILIAL");
        
        // Verifica se a aba existe
        if (!guiaCadFilial) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_FILIAL não encontrada!"
            };
        }
        
        var ultimaLinha = guiaCadFilial.getLastRow();
        
        // ====== PROCURA A LINHA COM O ID CORRESPONDENTE ======
        var ids = guiaCadFilial.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhaParaEditar = -1;
        
        for (var i = 0; i < ids.length; i++) {
            if (ids[i][0].toString() === idFilial.toString()) {
                linhaParaEditar = i + 2;
                break;
            }
        }
        
        // Verifica se encontrou
        if (linhaParaEditar === -1) {
            return {
                sucesso: false,
                mensagem: "Filial não encontrada!"
            };
        }
        
        // ====== VERIFICA SE JÁ EXISTE OUTRA FILIAL COM ESSE NOME ======
        var nomes = guiaCadFilial.getRange(2, 2, ultimaLinha - 1, 1).getValues();
        
        for (var i = 0; i < nomes.length; i++) {
            var linhaAtual = i + 2;
            // Se não for a linha atual E tiver o mesmo nome
            if (linhaAtual !== linhaParaEditar && nomes[i][0].toString().toUpperCase() === novoNome) {
                return {
                    sucesso: false,
                    mensagem: "Já existe uma filial com este nome!"
                };
            }
        }
        
        // ====== OBTÉM DATA E HORA ATUAL ======
        var dataHoraAtual = Utilities.formatDate(
            new Date(), 
            Session.getScriptTimeZone(), 
            "dd/MM/yyyy HH:mm:ss"
        );
        
        // ====== ATUALIZA OS DADOS ======
        guiaCadFilial.getRange(linhaParaEditar, 2).setValue(novoNome);           // B
        guiaCadFilial.getRange(linhaParaEditar, 3).setValue(novoCodInterno);     // C
        guiaCadFilial.getRange(linhaParaEditar, 4).setValue(novoCep);            // D
        guiaCadFilial.getRange(linhaParaEditar, 5).setValue(novaUF);             // E
        guiaCadFilial.getRange(linhaParaEditar, 6).setValue(novaCidade);         // F
        guiaCadFilial.getRange(linhaParaEditar, 7).setValue(novoBairro);         // G
        guiaCadFilial.getRange(linhaParaEditar, 8).setValue(novoEndereco);       // H
        guiaCadFilial.getRange(linhaParaEditar, 9).setValue(novoNumero);         // I
        guiaCadFilial.getRange(linhaParaEditar, 10).setValue(novoComplemento);   // J
        guiaCadFilial.getRange(linhaParaEditar, 11).setValue(novoTelefone);      // K
        guiaCadFilial.getRange(linhaParaEditar, 13).setValue(dataHoraAtual);     // M
        guiaCadFilial.getRange(linhaParaEditar, 14).setValue("S");               // N
        
        // Log de sucesso
        console.log("Filial com ID", idFilial, "editada na linha", linhaParaEditar);
        
        return {
            sucesso: true,
            mensagem: "Filial editada com sucesso!"
        };
        
    } catch (erro) {
        console.error("Erro ao editar filial:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao editar: " + erro.toString()
        };
    }
}
