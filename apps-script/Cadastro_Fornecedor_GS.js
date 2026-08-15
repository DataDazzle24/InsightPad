// ===================================================================================================================================================
// FUNÇÃO: CADASTRAR NOVO FORNECEDOR
// ===================================================================================================================================================

function cadastrarNovoFornecedor(
  razaosocial,
  codinterno,
  nomefantasia,
  cnpj,
  cpf,
  cep,
  uf,
  cidade,
  bairro,
  endereco,
  numero,
  complemento,
  representante,
  telefone1,
  telefone2,
  email,
  segmento,
  tipoPagamento,
  prazoPagamento,
  tempoentrega,
  observacao
){
    
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Fornecedor", "CADASTRAR");
        if (!auth.sucesso) return auth;

        // REFERENCIA A PLANILHA =========================================================================
        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadFornecedor = planilha.getSheetByName("CAD_FORNECEDOR");
        
        // Verifica se a aba existe
        if (!guiaCadFornecedor) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_FORNECEDOR não encontrada!"
            };
        }


        
        // VERIFICA SE O FORNECEDOR JÁ EXISTE =============================================================
        var ultimaLinha = guiaCadFornecedor.getLastRow();
        
        if (ultimaLinha > 1) {
            // Busca todos os nomes de filiais existentes (coluna B)
            var fornecedoresExistentes = guiaCadFornecedor.getRange(2, 2, ultimaLinha - 1, 1).getValues();
            
            // Percorre e verifica duplicidade
            for (var i = 0; i < fornecedoresExistentes.length; i++) {
                if (fornecedoresExistentes[i][0].toString().toUpperCase() === razaosocial) {
                    return {
                        sucesso: false,
                        mensagem: "Este fornecedor já existe!"
                    };
                }
            }
        }
        


        // GERA NOVO ID SEQUENCIAL =========================================================================
        var novoId = 1; // ID padrão se for a primeira linha
        
        if (ultimaLinha > 1) {
            // Busca todos os IDs existentes (coluna A)
            var ids = guiaCadFornecedor.getRange(2, 1, ultimaLinha - 1, 1).getValues();
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
        


        // OBTÉM DATA E HORA ATUAL FORMATADA ================================================================
        var dataHoraAtual = Utilities.formatDate(
            new Date(), 
            Session.getScriptTimeZone(), 
            "dd/MM/yyyy HH:mm:ss"
        );
        


        // PREPARA DADOS PARA INSERÇÃO =======================================================================
        var novaLinha = [
            novoId,             // 1
            razaosocial,        // 2
            codinterno,         // 3
            nomefantasia,       // 4
            cnpj,               // 5
            cpf,                // 6
            cep,                // 7
            uf,                 // 8
            cidade,             // 9
            bairro,             // 10
            endereco,           // 11
            numero,             // 12
            complemento,        // 13
            representante,      // 14
            telefone1,          // 15
            telefone2,          // 16
            email,              // 17
            segmento,           // 18
            tipoPagamento,      // 19
            prazoPagamento,     // 20
            tempoentrega,       // 21
            observacao,         // 22
            dataHoraAtual,      // 23
            dataHoraAtual,      // 24
            "S"                 // 25 STATUS_ATIVACAO
        ];
        


        // INSERE NA PRÓXIMA LINHA DISPONÍVEL =================================================================
        var proximaLinha = guiaCadFornecedor.getLastRow() + 1;
        
        // Insere os 12 valores em uma linha (colunas A até L)
        guiaCadFornecedor.getRange(proximaLinha, 1, 1, 25).setValues([novaLinha]);
        
        // Log de sucesso
        console.log("Fornecedor cadastrado com sucesso:", novaLinha);
        
        // Retorna sucesso
        return {
            sucesso: true,
            mensagem: "Fornecedor cadastrado com sucesso!",
            dados: novaLinha
        };
        
    } catch (erro) {
        // Log de erro
        console.error("Erro ao cadastrar fornecedor:", erro.toString());
        
        // Retorna erro
        return {
            sucesso: false,
            mensagem: "Erro ao cadastrar: " + erro.toString()
        };
    }
}














// ==================================================================================================================================================
// FUNÇÃO: BUSCAR DADOS ATUALIZADOS
// ==================================================================================================================================================

function buscarDadosAtualizadosForn() {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Fornecedor", "ACESSAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadFornecedor = planilha.getSheetByName("CAD_FORNECEDOR");

        if (!guiaCadFornecedor) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_FORNECEDOR não encontrada!"
            };
        }

        var ultimaLinha = guiaCadFornecedor.getLastRow() - 1;

        if (ultimaLinha <= 0) {
            return {
                sucesso: true,
                fornecedores: [],
                dadosCompletos: []
            };
        }

        var todosOsDados = guiaCadFornecedor.getRange(2, 1, ultimaLinha, 25).getDisplayValues();

        // filtra somente ativos
        var dadosAtivos = todosOsDados.filter(function(linha) {
            var status = (linha[24] || "").toString().trim().toUpperCase();
            return status !== "N";
        });

        var fornecedoresUnicos = dadosAtivos
            .map(function(r) { return r[1]; }) // razão social
            .filter(function(item) {
                return item && item.toString().trim() !== '';
            });

        fornecedoresUnicos = Array.from(new Set(fornecedoresUnicos));
        fornecedoresUnicos.sort();

        return {
            sucesso: true,
            fornecedores: fornecedoresUnicos,
            dadosCompletos: dadosAtivos
        };

    } catch (erro) {
        console.error("Erro ao buscar dados:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao buscar dados: " + erro.toString()
        };
    }
}
















// ===========================================================================================================================================
// FUNÇÃO: EXCLUIR FORNECEDOR
// ===========================================================================================================================================

function excluirFornecedor(idFornecedor) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Fornecedor", "EXCLUIR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadFornecedor = planilha.getSheetByName("CAD_FORNECEDOR");

        if (!guiaCadFornecedor) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_FORNECEDOR não encontrada!"
            };
        }

        var ultimaLinha = guiaCadFornecedor.getLastRow();
        var ids = guiaCadFornecedor.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhaParaInativar = -1;

        for (var i = 0; i < ids.length; i++) {
            if (ids[i][0].toString() === idFornecedor.toString()) {
                linhaParaInativar = i + 2;
                break;
            }
        }

        if (linhaParaInativar === -1) {
            return {
                sucesso: false,
                mensagem: "Fornecedor não encontrado!"
            };
        }

        var dataHoraAtual = Utilities.formatDate(
            new Date(),
            Session.getScriptTimeZone(),
            "dd/MM/yyyy HH:mm:ss"
        );

        // coluna X = EDITADO_EM (24)
        guiaCadFornecedor.getRange(linhaParaInativar, 24).setValue(dataHoraAtual);

        // coluna Y = STATUS_ATIVACAO (25)
        guiaCadFornecedor.getRange(linhaParaInativar, 25).setValue("N");

        console.log("Fornecedor com ID", idFornecedor, "inativado na linha", linhaParaInativar);

        return {
            sucesso: true,
            mensagem: "Fornecedor inativado com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao inativar fornecedor:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao inativar: " + erro.toString()
        };
    }
}

function excluirFornecedoresEmLote(idsFornecedores) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Fornecedor", "EXCLUIR");
        if (!auth.sucesso) return auth;

        idsFornecedores = Array.isArray(idsFornecedores) ? idsFornecedores : [idsFornecedores];
        idsFornecedores = idsFornecedores
            .map(function(id) { return String(id || "").trim(); })
            .filter(function(id) { return id !== ""; });

        if (!idsFornecedores.length) {
            return {
                sucesso: false,
                mensagem: "Nenhum fornecedor informado para inativação."
            };
        }

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadFornecedor = planilha.getSheetByName("CAD_FORNECEDOR");

        if (!guiaCadFornecedor) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_FORNECEDOR não encontrada!"
            };
        }

        var ultimaLinha = guiaCadFornecedor.getLastRow();
        if (ultimaLinha < 2) {
            return {
                sucesso: false,
                mensagem: "Nenhum fornecedor cadastrado."
            };
        }

        var mapaIds = {};
        idsFornecedores.forEach(function(id) {
            mapaIds[id] = true;
        });

        var ids = guiaCadFornecedor.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhasParaInativar = [];

        for (var i = 0; i < ids.length; i++) {
            if (mapaIds[String(ids[i][0])]) {
                linhasParaInativar.push(i + 2);
            }
        }

        if (!linhasParaInativar.length) {
            return {
                sucesso: false,
                mensagem: "Nenhum fornecedor selecionado foi encontrado."
            };
        }

        var dataHoraAtual = Utilities.formatDate(
            new Date(),
            Session.getScriptTimeZone(),
            "dd/MM/yyyy HH:mm:ss"
        );

        linhasParaInativar.forEach(function(linha) {
            guiaCadFornecedor.getRange(linha, 24).setValue(dataHoraAtual);
            guiaCadFornecedor.getRange(linha, 25).setValue("N");
        });

        return {
            sucesso: true,
            mensagem: linhasParaInativar.length === 1 ? "Fornecedor inativado com sucesso!" : "Fornecedores inativados com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao inativar fornecedores:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao inativar: " + erro.toString()
        };
    }
}















// ==================================================================================================================================================
// FUNÇÃO: EDITAR FORNECEDOR
// ==================================================================================================================================================

function editarFornecedor(
  idFornecedor,
  novorazaosocial,
  novocodinterno,
  novonomefantasia,
  novocnpj,
  novocpf,
  novocep,
  novauf,
  novacidade,
  novobairro,
  novoendereco,
  novonumero,
  novocomplemento,
  novorepresentante,
  novotelefone1,
  novotelefone2,
  novoemail,
  novosegmento,
  novotipoPagamento,
  novoprazoPagamento,
  novotempoentrega,
  novoobservacao
) {

    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Fornecedor", "EDITAR");
        if (!auth.sucesso) return auth;

        // REFERENCIA A PLANILHA =======================================================================================
        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadFornecedor = planilha.getSheetByName("CAD_FORNECEDOR");
        
        // Verifica se a aba existe
        if (!guiaCadFornecedor) {
            return {
                sucesso: false,
                mensagem: "Aba CAD_FORNECEDOR não encontrada!"
            };
        }
        
        var ultimaLinha = guiaCadFornecedor.getLastRow();
        


        // PROCURA A LINHA COM O ID CORRESPONDENTE =====================================================================
        var ids = guiaCadFornecedor.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhaParaEditar = -1;
        
        for (var i = 0; i < ids.length; i++) {
            if (ids[i][0].toString() === idFornecedor.toString()) {
                linhaParaEditar = i + 2;
                break;
            }
        }
        
        // Verifica se encontrou
        if (linhaParaEditar === -1) {
            return {
                sucesso: false,
                mensagem: "Fornecedor não encontrado!"
            };
        }
        


        // VERIFICA SE JÁ EXISTE OUTRA FILIAL COM ESSE NOME =============================================================
        var nomes = guiaCadFornecedor.getRange(2, 2, ultimaLinha - 1, 1).getValues();
        
        for (var i = 0; i < nomes.length; i++) {
            var linhaAtual = i + 2;
            // Se não for a linha atual E tiver o mesmo nome
            if (linhaAtual !== linhaParaEditar && nomes[i][0].toString().toUpperCase() === novorazaosocial) {
                return {
                    sucesso: false,
                    mensagem: "Já existe um fornecedor com este nome!"
                };
            }
        }
        


        // OBTÉM DATA E HORA ATUAL =======================================================================================
        var dataHoraAtual = Utilities.formatDate(
            new Date(), 
            Session.getScriptTimeZone(), 
            "dd/MM/yyyy HH:mm:ss"
        );


        
        // ATUALIZA OS DADOS ==============================================================================================
        guiaCadFornecedor.getRange(linhaParaEditar, 2).setValue(novorazaosocial);      // B
        guiaCadFornecedor.getRange(linhaParaEditar, 3).setValue(novocodinterno);       // C
        guiaCadFornecedor.getRange(linhaParaEditar, 4).setValue(novonomefantasia);     // D
        guiaCadFornecedor.getRange(linhaParaEditar, 5).setValue(novocnpj);             // E
        guiaCadFornecedor.getRange(linhaParaEditar, 6).setValue(novocpf);              // F
        guiaCadFornecedor.getRange(linhaParaEditar, 7).setValue(novocep);              // G
        guiaCadFornecedor.getRange(linhaParaEditar, 8).setValue(novauf);               // H
        guiaCadFornecedor.getRange(linhaParaEditar, 9).setValue(novacidade);           // I
        guiaCadFornecedor.getRange(linhaParaEditar, 10).setValue(novobairro);          // J
        guiaCadFornecedor.getRange(linhaParaEditar, 11).setValue(novoendereco);        // K
        guiaCadFornecedor.getRange(linhaParaEditar, 12).setValue(novonumero);          // L
        guiaCadFornecedor.getRange(linhaParaEditar, 13).setValue(novocomplemento);     // M
        guiaCadFornecedor.getRange(linhaParaEditar, 14).setValue(novorepresentante);   // N
        guiaCadFornecedor.getRange(linhaParaEditar, 15).setValue(novotelefone1);       // O
        guiaCadFornecedor.getRange(linhaParaEditar, 16).setValue(novotelefone2);       // P
        guiaCadFornecedor.getRange(linhaParaEditar, 17).setValue(novoemail);           // Q
        guiaCadFornecedor.getRange(linhaParaEditar, 18).setValue(novosegmento);        // R
        guiaCadFornecedor.getRange(linhaParaEditar, 19).setValue(novotipoPagamento);   // S
        guiaCadFornecedor.getRange(linhaParaEditar, 20).setValue(novoprazoPagamento);  // T
        guiaCadFornecedor.getRange(linhaParaEditar, 21).setValue(novotempoentrega);    // U
        guiaCadFornecedor.getRange(linhaParaEditar, 22).setValue(novoobservacao);      // V
        guiaCadFornecedor.getRange(linhaParaEditar, 24).setValue(dataHoraAtual);       // X
        guiaCadFornecedor.getRange(linhaParaEditar, 25).setValue("S");                 // Y
        
        // Log de sucesso
        console.log("Fornecedor com ID", idFornecedor, "editado na linha", linhaParaEditar);
        
        return {
            sucesso: true,
            mensagem: "Fornecedor editado com sucesso!"
        };
        
    } catch (erro) {
        console.error("Erro ao editar fornecedor:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao editar: " + erro.toString()
        };
    }
}
