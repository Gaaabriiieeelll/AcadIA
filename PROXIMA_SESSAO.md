# Ponto de retomada do Conecta Campus

## Atualização em 08/10/2026

- O usuário confirmou que o teste do boletim e a revisão da experiência no celular já foram feitos. Não repetir essas pendências.
- O usuário não pretende produzir o vídeo de verificação OAuth.
- Implementadas localmente, na ordem solicitada: projeção de nota necessária nas disciplinas; antecedência de lembretes de 0 a 30 dias; busca, filtros e ordenação de materiais.
- Notas: estimativa por média simples entre 2 ou 4 bimestres, usando a meta dos alertas; médias oficiais preservadas.
- Lembretes: preferência persistida no banco e usada na central e nos jobs. O job Web Push agora recalcula os alertas antes de enviar.
- Validação: 58 testes, TypeScript, lint e build passaram. O build usou uma URL local fictícia de banco apenas para carregar o cliente Prisma, sem conexão a banco real.
- Antes de publicar: aplicar a migração `20261009000000_alert_reminder_days` com `npm run db:deploy` no ambiente configurado e validar a nova preferência com conta autenticada. Este checkout não possui `DATABASE_URL`/`DIRECT_URL` configuradas; não houve migração remota, envio de notificações ou deploy nesta sessão.

## Registro anterior

Em 25/09/2026, lembrar ao usuário deste avanço quando ele retomar o projeto:

- A importação manual do boletim escolar em PDF do SUAP/IFPB foi implementada na aba **Visão geral**.
- O fluxo permite revisar disciplinas, notas, faltas e vínculos antes de confirmar. A matrícula do PDF é conferida com o perfil, e o arquivo original não é armazenado.
- O PDF de exemplo foi reconhecido com 13 disciplinas e nenhuma linha descartada.
- Passaram 31 testes, lint, checagem de tipos e build.
- Próxima validação útil: testar o salvamento pela interface com uma conta autenticada e banco de dados ativo.
