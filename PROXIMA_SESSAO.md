# Ponto de retomada do AcadIA

Em 25/09/2026, lembrar ao usuário deste avanço quando ele retomar o projeto:

- A importação manual do boletim escolar em PDF do SUAP/IFPB foi implementada na aba **Visão geral**.
- O fluxo permite revisar disciplinas, notas, faltas e vínculos antes de confirmar. A matrícula do PDF é conferida com o perfil, e o arquivo original não é armazenado.
- O PDF de exemplo foi reconhecido com 13 disciplinas e nenhuma linha descartada.
- Passaram 31 testes, lint, checagem de tipos e build.
- Próxima validação útil: testar o salvamento pela interface com uma conta autenticada e banco de dados ativo.
