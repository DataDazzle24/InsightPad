# Encomendas e Comandas — operação

Disponibilidade: implementação na branch de trabalho. Este manual descreve o fluxo
implementado; ainda não representa disponibilidade no DEV servido nem em produção.

## Encomenda

Em Vendas → Encomendas, escolha Nova encomenda. Informe cliente cadastrado,
filial, prazo no horário da empresa e retirada ou entrega. A entrega guarda uma
cópia do endereço e sua taxa na encomenda, sem modificar o cadastro do cliente.
Inclua produtos ou combos, quantidades e especificações. Produtos pesáveis aceitam
até três casas; os demais aceitam inteiros. Valores inválidos exigem correção.
O preço e a composição confirmados ficam preservados. Um novo item usa o catálogo
vigente; preço manual exige a gestão de Caixa já existente.

Escolha reservar agora ou aguardar produção/reposição. Reservar exige todos os
componentes, inclusive os compartilhados entre combo e avulso. Falta de estoque
informa necessário, disponível e faltante; nenhuma reserva parcial será criada.
Uma encomenda em espera pode ser salva sem sinal ou com sinal autorizado.
O sinal registra um recebimento; ele não gera uma venda antecipada.

Use Preparação e Marcar pronta após obter reserva integral. A conclusão exige
Pronta, estoque reservado e pagamento integral. Receber e concluir usa somente o
saldo restante. Se o saldo já estiver quitado, concluir não recebe novamente.
O fechamento cria uma venda vinculada e baixa os componentes uma vez.

Remarcar conserva o prazo anterior no histórico. Editar metadados conserva preços
e reserva; alterar a demanda de uma encomenda pronta exige nova revisão, voltando
a Pendente. Não é permitido reduzir o total abaixo do recebido nem mudar a filial
depois de receber dinheiro.

## Comanda

Em Vendas → Comandas, abra uma comanda com nome/mesa, filial, cliente opcional e
pessoas. Duas comandas podem ter a mesma mesa; cada uma recebe ID e código próprios.
Adicione itens com quantidade, especificações, pessoa e estado de preparo.
Use Preparo para avançar Anotado → Em preparo → Preparado → Servido.

Só receber mantém a comanda aberta. Uma comanda quitada continua podendo receber
novos itens; nesse caso, cobre apenas o novo saldo. Fechar comanda cria a venda
única usando os pagamentos anteriores, sem nova entrada no Caixa.

O recebimento pode ser por valor, divisão igual, itens, pessoa ou item
compartilhado. Confirme um plano e escolha a parcela. Os restos em centavos ficam
nas últimas parcelas: R$ 100 em três partes resulta em 33,33 + 33,33 + 33,34.
Compartilhar pagamento divide dinheiro; não divide artificialmente estoque.
Uma parcela paga não muda por ter sido incluído um novo item.

Recebimentos por valor precisam ser conciliados com itens antes de retirada ou
transferência. Conciliar usa o dinheiro já recebido; não recebe outra vez.
Itens que já possuem pagamento não podem ser retirados ou transferidos diretamente.

Trocar mesa conserva código, itens, pagamentos e estoque. Transferir itens permite
quantidade parcial elegível e conserva preço, preparo, origem e reservas. Nenhum
dinheiro ou estoque físico é movimentado pela transferência. Juntar comandas exige
gestor: a origem fica Incorporada, os vínculos financeiros permanecem e apenas o
destino continua o atendimento. Não reabra a origem incorporada.

## Retirada, perda, cancelamento e devolução

Retirar item Anotado libera a reserva correspondente. Em preparo, Preparado ou
Servido exigem gestor autenticado e escolha explícita: liberar reserva ou perda.
Revise quantidade, estado, motivo e destino. Liberar reserva não aumenta o físico.
Perda baixa o físico uma vez; essa quantidade não será baixada de novo ao fechar.
O histórico registra ator, autorizador, quantidade, preparo e destino.

Cancelar um documento exige motivo e as permissões aplicáveis. No cancelamento
completo da comanda, preparado/servido vira perda e a reserva restante é liberada.
Cancelar não devolve dinheiro: o histórico indica Devolução pendente.

Registrar devolução exige gestão do módulo, acesso ao Caixa, método, valor,
referência e motivo. O Caixa precisa cumprir política, filial, titularidade e saldo.
Para saída em dinheiro acima do limite de um operador sem gestão do Caixa, use
Solicitar aprovação de caixa. Outro gestor autenticado deve decidir na fila de
aprovações do PDV. Na fila atual, a saída aparece como Sangria com a descrição
Devolução e o código do documento. Use Atualizar aprovação e confirme os mesmos dados após a
aprovação. Alterar proposta ou versão invalida o vínculo. Solicitar/aprovar não
devolve dinheiro; apenas a devolução confirmada gera a saída única.

Uma venda de Encomenda/Comanda deve ser cancelada a partir do documento de origem,
também acessível pelo Registro de Vendas. O cancelamento preserva recebimentos e
perdas anteriores, reverte somente componentes vendidos e deixa o reembolso separado.

## Confirmação pendente

Se a resposta se perder, o aplicativo consulta o resultado pelo identificador
original. Enquanto o resultado não puder ser comprovado, novas alterações ficam
bloqueadas. Use Conferir resultado; se continuar desconhecido, o reenvio explícito
usa os mesmos dados e o mesmo identificador. Não crie outro recebimento para
contornar a dúvida. A confirmação é retomável pelo mesmo usuário e empresa depois
de recarregar. Outra identidade não assume a operação pendente.

Depois de uma confirmação positiva seguida de falha de atualização, use Atualizar
dados. Essa ação apenas consulta; não repete o recebimento nem a baixa.

## Consulta e indicadores

Os filtros gerais se compõem com Atrasadas/Prontas e Quitadas a fechar. Lista e
calendário preservam o recorte. +N abre todos os registros do dia com paginação.
O histórico inclui fechadas, canceladas e incorporadas e seus vínculos.

O faturamento considera a venda final, uma vez. Os recebimentos conservam a data,
operador e caixa em que ocorreram. Taxa de entrega integra o total da venda,
separada dos produtos: é excluída do lucro/margem dos produtos. O resultado da
entrega depende de custos de transporte, que este pacote não inventa.
Imprimir comprovante gera documento operacional sem valor fiscal.
