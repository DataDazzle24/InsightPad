// ===================================================================================================================================================
// FUNÇÃO: CADASTRAR NOVO FORNECEDOR
// ===================================================================================================================================================

function cadastrarNovoCliente(
  nome,
  nascimento,
  sexo,
  cpf,
  cnpj,
  receberContato,
  email,
  telefone1,
  telefone2,
  cep,
  estado,
  municipio,
  bairro,
  rua,
  numero,
  complemento,
  tipoRoupaBaixo,
  tamanhoRoupaBaixo,
  tipoRoupaCima,
  tamanhoRoupaCima,
  tamanhoCalcado,
  observacao
) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Cliente", "CADASTRAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCliente = planilha.getSheetByName("CAD_CLIENTE");

        var ultimaLinha = guiaCadCliente.getLastRow();

        if (ultimaLinha > 1) {
            var clientesExistentes = guiaCadCliente.getRange(2, 2, ultimaLinha - 1, 1).getValues();

            for (var i = 0; i < clientesExistentes.length; i++) {
                if (clientesExistentes[i][0].toString().toUpperCase() === nome) {
                    return {
                        sucesso: false,
                        mensagem: "Este cliente já existe!"
                    };
                }
            }
        }

        var novoId = 1;

        if (ultimaLinha > 1) {
            var ids = guiaCadCliente.getRange(2, 1, ultimaLinha - 1, 1).getValues();
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

        var novaLinha = [
            novoId,              // 1 ID_CLIENTE
            nome,                // 2 NOME
            nascimento,          // 3 DATA_NASCIMENTO
            sexo,                // 4 SEXO
            cpf,                 // 5 CPF
            cnpj,                // 6 CNPJ
            receberContato,      // 7 DESEJA_RECEBER_CONTATO
            email,               // 8 EMAIL
            telefone1,           // 9 TEL_1
            telefone2,           // 10 TEL_2
            cep,                 // 11 CEP
            estado,              // 12 ESTADO
            municipio,           // 13 MUNICIPIO
            bairro,              // 14 BAIRRO
            rua,                 // 15 RUA
            numero,              // 16 NUMERO
            complemento,         // 17 COMPLEMENTO
            tipoRoupaBaixo,      // 18 TIPO_ROUPA_BAIXO
            tamanhoRoupaBaixo,   // 19 TAMANHO_ROUPA_BAIXO
            tipoRoupaCima,       // 20 TIPO_ROUPA_CIMA
            tamanhoRoupaCima,    // 21 TAMANHO_ROUPA_CIMA
            tamanhoCalcado,      // 22 TAMANHO_CALÇADO
            observacao,          // 23 OBSERVAÇÃO
            dataHoraAtual,       // 24 CRIADO_EM
            dataHoraAtual,       // 25 EDITADO_EM
            "S"                  // 26 STATUS_ATIVAÇÃO
        ];

        var proximaLinha = guiaCadCliente.getLastRow() + 1;
        guiaCadCliente.getRange(proximaLinha, 1, 1, 26).setValues([novaLinha]);

        return {
            sucesso: true,
            mensagem: "Cliente cadastrado com sucesso!",
            dados: novaLinha
        };

    } catch (erro) {
        console.error("Erro ao cadastrar cliente:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao cadastrar: " + erro.toString()
        };
    }
}














// ==================================================================================================================================================
// FUNÇÃO: BUSCAR DADOS ATUALIZADOS
// ==================================================================================================================================================
function buscarDadosAtualizadosCliente() {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Cliente", "ACESSAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCliente = planilha.getSheetByName("CAD_CLIENTE");

        var ultimaLinha = guiaCadCliente.getLastRow() - 1;

        if (ultimaLinha <= 0) {
            return {
                sucesso: true,
                dadosCompletos: []
            };
        }

        var todosOsDados = guiaCadCliente.getRange(2, 1, ultimaLinha, 26).getDisplayValues();

        var dadosAtivos = todosOsDados.filter(function(linha) {
            var status = (linha[25] || "").toString().trim().toUpperCase();
            return status !== "N";
        });

        var dadosCompletos = dadosAtivos.map(function(linha) {
            return linha.slice(0, 25);
        });

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
















// ===========================================================================================================================================
// FUNÇÃO: EXCLUIR FILIAL
// ===========================================================================================================================================

function excluirCliente(idCliente) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Cliente", "EXCLUIR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCliente = planilha.getSheetByName("CAD_CLIENTE");

        var ultimaLinha = guiaCadCliente.getLastRow();
        var ids = guiaCadCliente.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhaParaInativar = -1;

        for (var i = 0; i < ids.length; i++) {
            if (ids[i][0].toString() === idCliente.toString()) {
                linhaParaInativar = i + 2;
                break;
            }
        }

        if (linhaParaInativar === -1) {
            return {
                sucesso: false,
                mensagem: "Cliente não encontrado!"
            };
        }

        var dataHoraAtual = Utilities.formatDate(
            new Date(),
            Session.getScriptTimeZone(),
            "dd/MM/yyyy HH:mm:ss"
        );

        // EDITADO_EM = coluna 25
        guiaCadCliente.getRange(linhaParaInativar, 25).setValue(dataHoraAtual);

        // STATUS_ATIVAÇÃO = coluna 26
        guiaCadCliente.getRange(linhaParaInativar, 26).setValue("N");

        return {
            sucesso: true,
            mensagem: "Cliente inativado com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao inativar cliente:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao inativar: " + erro.toString()
        };
    }
}

function excluirClientesEmLote(idsClientes) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Cliente", "EXCLUIR");
        if (!auth.sucesso) return auth;

        idsClientes = Array.isArray(idsClientes) ? idsClientes : [idsClientes];
        idsClientes = idsClientes
            .map(function(id) { return String(id || "").trim(); })
            .filter(function(id) { return id !== ""; });

        if (!idsClientes.length) {
            return {
                sucesso: false,
                mensagem: "Nenhum cliente informado para inativação."
            };
        }

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCliente = planilha.getSheetByName("CAD_CLIENTE");
        var ultimaLinha = guiaCadCliente.getLastRow();

        if (ultimaLinha < 2) {
            return {
                sucesso: false,
                mensagem: "Nenhum cliente cadastrado."
            };
        }

        var mapaIds = {};
        idsClientes.forEach(function(id) {
            mapaIds[id] = true;
        });

        var ids = guiaCadCliente.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhasParaInativar = [];

        for (var i = 0; i < ids.length; i++) {
            if (mapaIds[String(ids[i][0])]) {
                linhasParaInativar.push(i + 2);
            }
        }

        if (!linhasParaInativar.length) {
            return {
                sucesso: false,
                mensagem: "Nenhum cliente selecionado foi encontrado."
            };
        }

        var dataHoraAtual = Utilities.formatDate(
            new Date(),
            Session.getScriptTimeZone(),
            "dd/MM/yyyy HH:mm:ss"
        );

        linhasParaInativar.forEach(function(linha) {
            guiaCadCliente.getRange(linha, 25).setValue(dataHoraAtual);
            guiaCadCliente.getRange(linha, 26).setValue("N");
        });

        return {
            sucesso: true,
            mensagem: linhasParaInativar.length === 1 ? "Cliente inativado com sucesso!" : "Clientes inativados com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao inativar clientes:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao inativar: " + erro.toString()
        };
    }
}















// ==================================================================================================================================================
// FUNÇÃO: EDITAR CLIENTE
// ==================================================================================================================================================

function editarCliente(
  idCliente,
  novonome,
  novonascimento,
  novosexo,
  novocpf,
  novocnpj,
  novoreceberContato,
  novoemail,
  novotelefone1,
  novotelefone2,
  novocep,
  novoestado,
  novomunicipio,
  novobairro,
  novorua,
  novonumero,
  novocomplemento,
  novotipoRoupaBaixo,
  novotamanhoRoupaBaixo,
  novotipoRoupaCima,
  novotamanhoRoupaCima,
  novotamanhoCalcado,
  novoobservacao
) {
    try {
        var auth = authValidarAcaoPorArgumentos_(arguments, "Cadastro_Cliente", "EDITAR");
        if (!auth.sucesso) return auth;

        var planilha = SpreadsheetApp.getActiveSpreadsheet();
        var guiaCadCliente = planilha.getSheetByName("CAD_CLIENTE");

        var ultimaLinha = guiaCadCliente.getLastRow();

        var ids = guiaCadCliente.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        var linhaParaEditar = -1;

        for (var i = 0; i < ids.length; i++) {
            if (ids[i][0].toString() === idCliente.toString()) {
                linhaParaEditar = i + 2;
                break;
            }
        }

        if (linhaParaEditar === -1) {
            return {
                sucesso: false,
                mensagem: "Cliente não encontrado!"
            };
        }

        var nomes = guiaCadCliente.getRange(2, 2, ultimaLinha - 1, 1).getValues();

        for (var j = 0; j < nomes.length; j++) {
            var linhaAtual = j + 2;
            if (linhaAtual !== linhaParaEditar && nomes[j][0].toString().toUpperCase() === novonome) {
                return {
                    sucesso: false,
                    mensagem: "Já existe um cliente com este nome!"
                };
            }
        }

        var dataHoraAtual = Utilities.formatDate(
            new Date(),
            Session.getScriptTimeZone(),
            "dd/MM/yyyy HH:mm:ss"
        );

        var novaLinhaEdit = [
            novonome,               // 2
            novonascimento,         // 3
            novosexo,               // 4
            novocpf,                // 5
            novocnpj,               // 6
            novoreceberContato,     // 7
            novoemail,              // 8
            novotelefone1,          // 9
            novotelefone2,          // 10
            novocep,                // 11
            novoestado,             // 12
            novomunicipio,          // 13
            novobairro,             // 14
            novorua,                // 15
            novonumero,             // 16
            novocomplemento,        // 17
            novotipoRoupaBaixo,     // 18
            novotamanhoRoupaBaixo,  // 19
            novotipoRoupaCima,      // 20
            novotamanhoRoupaCima,   // 21
            novotamanhoCalcado,     // 22
            novoobservacao          // 23
        ];

        guiaCadCliente.getRange(linhaParaEditar, 2, 1, 22).setValues([novaLinhaEdit]);

        // EDITADO_EM = coluna 25
        guiaCadCliente.getRange(linhaParaEditar, 25).setValue(dataHoraAtual);

        // STATUS_ATIVAÇÃO = coluna 26
        guiaCadCliente.getRange(linhaParaEditar, 26).setValue("S");

        return {
            sucesso: true,
            mensagem: "Cliente editado com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao editar cliente:", erro.toString());
        return {
            sucesso: false,
            mensagem: "Erro ao editar: " + erro.toString()
        };
    }
}
