# Verificação OAuth do Conecta Campus

Estado em 07/10/2026: o projeto Google Cloud `projeto-do-acadia-proprio` está em produção. O login usa apenas `openid email profile`. O Google Sala de Aula e a Agenda pedem autorização separada depois do login. A marca ainda aguarda nova verificação porque a propriedade da página inicial, recém-confirmada no Search Console, não havia se propagado no verificador do Google. A mensagem do Google pede aguardar 24 horas antes de tentar novamente (aproximadamente até 08/10/2026, 22h55, horário de Brasília).

## Endereços públicos

- Página inicial: https://conecta-campus-sandy.vercel.app/login
- Política de privacidade: https://conecta-campus-sandy.vercel.app/privacidade
- Termos: https://conecta-campus-sandy.vercel.app/termos
- O arquivo `public/googlec8c975128ae178ad.html` comprova a propriedade no Google Search Console. Não removê-lo.

## Escopos e uso

| Escopo | Uso no aplicativo |
| --- | --- |
| `openid email profile` | Autenticar o estudante e mostrar nome, foto e e-mail da conta. |
| `classroom.courses.readonly` | Listar turmas do estudante no painel de materiais. |
| `classroom.courseworkmaterials.readonly` | Mostrar materiais e anexos das turmas. |
| `classroom.announcements.readonly` | Mostrar avisos das turmas. |
| `classroom.student-submissions.me.readonly` | Identificar atividades e o estado das próprias entregas para o calendário. |
| `classroom.profile.emails` | Mostrar o e-mail dos professores das turmas do estudante como link de contato. É o escopo sensível que requer justificativa e demonstração. |
| `calendar.app.created` | Criar e atualizar somente o calendário acadêmico criado pelo Conecta Campus na conta Google do estudante. |

O código dos escopos está em `src/lib/google-classroom-scopes.ts`. A tela que mostra os contatos está em `src/app/materiais/page.tsx`; a chamada `courses.teachers.list` e o uso de `teacher.profile.emailAddress` estão em `src/data/google-classroom.ts`. O app não persiste os e-mails dos professores no banco; eles são lidos para montar a resposta da página de materiais.

## Texto pronto para justificar o escopo sensível

> Conecta Campus is an independent student planning app. After a user separately connects Google Classroom, the app reads the teachers of the user's own active courses with the Classroom `courses.teachers.list` endpoint and displays each teacher's name and email address on the Materials page. This gives the student a direct mailto contact for their own teachers. The email addresses are used only to render that page and are not stored in the app database or sent to the AI chat. The narrower `classroom.courses.readonly` scope provides course information but does not provide the `UserProfile.emailAddress` field; `classroom.profile.emails` is required for that field. Users can disconnect Classroom in their profile.

Se o formulário pedir justificativa para outros escopos, usar a tabela acima e descrever a função específica de cada um. Conferir novamente os campos reais do formulário antes de enviar.

## Demonstração solicitada pelo Google

Gravar em ambiente separado, com uma conta de demonstração que tenha ao menos uma turma e um professor no Google Sala de Aula. Ocultar dados pessoais que não precisem aparecer. A gravação deve mostrar, em sequência:

1. A página pública `/login`, o nome Conecta Campus, as funções descritas e a política de privacidade.
2. O login com Google e a tela de consentimento, incluindo o nome do app e o ID do cliente OAuth visível na URL do navegador quando solicitado pelo Google.
3. O acesso à página **Materiais**, o botão de conectar o Google Sala de Aula e a autorização específica.
4. A lista de turmas e o e-mail de um professor como link de contato; mostrar que pertence a uma turma do usuário.
5. A opção de desconectar no perfil. Se o formulário incluir a Agenda na demonstração, mostrar também sua autorização separada e o calendário criado pelo aplicativo.

O Google solicita que o fluxo de concessão seja demonstrado em inglês. Preparar legendas ou narração em inglês, enviar o vídeo ao YouTube como **Não listado** e informar o link apenas no formulário de verificação. Não colocar o vídeo nem tokens no repositório.

## Próximos passos no console

1. Após o prazo de 24 horas, abrir **Google Auth Platform → Branding → Informações e resumo → Ver problemas** no projeto pessoal `projeto-do-acadia-proprio` e solicitar nova verificação da marca. Conferir se a propriedade da página inicial foi reconhecida.
2. Se aprovada, clicar **Publicar marca**. O Google informa que o resultado de conformidade expira após sete dias se não for publicado.
3. Abrir **Central de verificação → Acesso a dados → Preparar para verificação**, conferir todos os escopos, fornecer a justificativa e o vídeo e enviar.
4. Acompanhar a resposta no console e no e-mail de suporte cadastrado. A aprovação do Google não substitui eventuais regras do administrador de contas institucionais.

Fontes: [página inicial](https://support.google.com/cloud/answer/13807376?hl=en), [verificação da marca](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification) e [verificação de escopos sensíveis](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification).
