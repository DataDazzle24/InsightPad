# Fonte recuperada e preservação — DEC-017

O candidato parte de `80f21c65a0ed3e07b0f9c29bebd07d2479b0735b`, preservado sem reescrita em `agent/dev-source-recovered-20261019`. Há 16 commits após o baseline histórico `8f4bc9191f9e3597ffe858415b712b67b816c53d`. Nenhuma branch-base recebeu merge ou force-push. O PR #17 permanece como referência anterior, sem liberação.

## Integridade e limites

- Bundle incremental: SHA256 `a88be408b3c7a530f289eaa88ca0170ff62841948003ce984d5ea27a8156bdd4`; validado em clone contendo o baseline requerido.
- Árvore recuperada: `9ea8ac5ce5286c824ceecccf0542ea7816215507`.
- Árvore frontend: `c6554625a0833c36522b0456e1dbf0bf8e51490a`. Também existe no pai `60ee0bed4f05adef9235684394ef9d7d2b3bf49c`; o último commit só acrescenta procedimento de publicação em produção. Esse procedimento não foi executado.
- A reprodução anterior com Node 22.23.3 comparou 25/25 recursos públicos de DEV byte a byte. Isso identifica uma fonte compatível; não comprova um commit único registrado na release nem revisões ativas do backend.

## Verificação antes da publicação pública

Todos os snapshots de arquivos rastreados dos 16 commits foram examinados: 268 blobs únicos, 261 textuais e sete imagens binárias. detect-secrets 1.5.0 offline encontrou zero candidatos. Busca adicional por assinaturas de chaves privadas, tokens GitHub/Google/AWS, credenciais de service account e JWT encontrou zero candidatos. Metadados de commits e os 44 caminhos alterados também foram revisados. Não houve validação de credenciais em serviços externos nem transmissão do conteúdo para scanners remotos.

A detecção estática não garante ausência de segredos. Valores públicos de configuração Firebase não são credenciais administrativas. Arquivos locais de ambiente e artefatos de build permanecem ignorados. Antes do commit reconciliado, a mesma detecção é repetida sobre os arquivos do candidato.

## Reconciliação

O novo PR tem como base a branch de preservação para expor apenas o recorte CI/manifesto/modal/harness e testes/documentação associados. O commit candidato é descendente direto do SHA recuperado. As referências exatas e as execuções de CI ficam no PR e na CORE, evitando autorreferência de SHA dentro do próprio commit.
