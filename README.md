# AcadIA

Plataforma acadêmica inteligente em desenvolvimento para estudantes do IFPB Campus João Pessoa.

## Estado atual

O acesso com Google OAuth solicita apenas identidade básica: nome, foto e e-mail. Permissões do Google Classroom não fazem parte desta etapa.

Depois do primeiro acesso, o estudante completa o perfil acadêmico com matrícula, campus, curso, período/ano e turma opcional. Esses dados são persistidos no Prisma Postgres. Nome, foto e e-mail permanecem somente na sessão, que expira em até 4 horas.

Enquanto o projeto não tiver autorização institucional, use uma conta Google pessoal de teste. O domínio acadêmico permanece bloqueado por padrão.

## Preparação

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env.local`.
3. Gere uma chave para `AUTH_SECRET`.
4. Crie um cliente OAuth do tipo **Aplicativo da Web** no Google Cloud.
5. Cadastre `http://localhost:3000/api/auth/callback/google` como URI de redirecionamento autorizada.
6. Preencha `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` e `ALLOWED_EMAILS`.
7. Preencha `DATABASE_URL` com a conexão pooled e `DIRECT_URL` com a conexão direta do Prisma Postgres.
8. Execute `npm run db:deploy` para aplicar as migrações existentes.
9. Execute `npm run dev`.
10. Acesse `http://localhost:3000`.

## Banco de dados

- `npm run db:generate`: gera o cliente Prisma.
- `npm run db:migrate -- --name nome_da_migracao`: cria uma migração durante o desenvolvimento.
- `npm run db:deploy`: aplica migrações existentes sem criar novas.
- `npm run db:studio`: abre o Prisma Studio.

As consultas da aplicação usam `DATABASE_URL`. Migrações e ferramentas administrativas usam `DIRECT_URL`.

## Segurança

- Nunca envie `.env.local` ao Git.
- Nunca coloque o segredo OAuth em arquivos do navegador.
- Nunca exponha `DATABASE_URL` ou `DIRECT_URL` no navegador ou em commits.
- Não solicite nem armazene a senha do Google ou do SUAP.
- Não ative `ALLOW_ACADEMIC_EMAIL` sem autorização institucional adequada.

## Privacidade e uso de IA

A página `/perfil` concentra os controles do titular: exportação em JSON,
desconexão local do Google Sala de Aula, revogação do consentimento da IA e
exclusão permanente da conta. A autorização externa concedida ao Classroom
também pode ser revogada na Conta Google.

A análise acadêmica pela OpenAI exige consentimento ativo para a versão de uso
vigente. Quando autorizada, envia nomes de disciplinas, notas, títulos,
descrições e nomes de anexos do Classroom. E-mail, matrícula, telefone e tokens
de acesso não são enviados. As requisições usam `store: false`.

As páginas HTML usam uma Content Security Policy com nonce novo por requisição.
Scripts sem o nonce são bloqueados; frames, objetos e formulários para outras
origens também não são permitidos. Os estilos inline continuam liberados porque
as cores de disciplinas e alertas são calculadas dinamicamente.

## Sincronização do Classroom

Dashboard, Agenda, Calendário e Alertas exibem primeiro os dados locais e fazem
a sincronização do Classroom em segundo plano. A atualização ocorre ao abrir a
área protegida, ao retornar para a aba e a cada dez minutos. O usuário também
pode forçar a consulta pelo botão de atualização. Chamadas ao Google Classroom e
ao endpoint OAuth expiram após 12 segundos para não prender a navegação.

## Compromissos em aberto

Ao criar um evento pessoal no Calendário, deixar **Data final** vazia cria um
compromisso em aberto. Ele permanece ativo até o usuário pressionar **Concluir**
e pode ser reaberto depois. Enquanto estiver aberto, aparece diariamente no
calendário privado do AcadIA no Google Agenda; a conclusão limita a repetição ao
dia em que o compromisso foi encerrado.

## Widget Android (módulo separado)

O módulo em `android/` fornece o widget **AcadIA · Em aberto**. O pareamento usa
um código temporário de uso único, válido por dez minutos. O Android gera um
token aleatório, o servidor persiste somente o hash e o aparelho protege token e
cache com o Android Keystore. Consulte `android/README.md` para gerar o APK,
conectar o celular e adicionar o widget à tela inicial.

O widget fica desativado por padrão na versão web publicada: seu controle não é
carregado no Calendário e as rotas `/api/android-widget/*` respondem com `404`.
Para desenvolver ou publicar o módulo separadamente, defina
`ANDROID_WIDGET_ENABLED=true` exclusivamente no servidor. Na versão atual da
Vercel, mantenha a variável ausente ou com o valor `false`.

## Alertas pelo WhatsApp

O AcadIA envia mensagens de texto pela Evolution API v2. O usuário informa o próprio celular, aceita explicitamente os envios e pode enviar uma mensagem de teste na Central de alertas. O número é criptografado no banco com a chave derivada de `AUTH_SECRET`.

Configure no servidor:

- `EVOLUTION_API_URL`: URL base da Evolution API, sem barra no final.
- `EVOLUTION_API_KEY`: chave global ou da instância.
- `EVOLUTION_INSTANCE_NAME`: nome da instância conectada ao WhatsApp.
- `WHATSAPP_JOB_SECRET`: segredo exclusivo usado pelo agendador.

O job diário deve chamar `GET /api/jobs/whatsapp-alerts` com o cabeçalho `Authorization: Bearer <WHATSAPP_JOB_SECRET>`. O endpoint aceita `?limit=25`, envia somente alertas novos e ativos, evita duplicidade e realiza no máximo cinco tentativas por alerta.

Webhooks da Evolution API não são necessários para iniciar o envio diário. Eles poderão ser adicionados depois para registrar eventos como conexão da instância e atualizações de mensagens.

## Alertas Web Push

Cada navegador ativado na Central de alertas recebe uma assinatura Web Push própria. Endpoint e chaves da assinatura são criptografados no banco com `AUTH_SECRET`; o sistema mantém apenas um hash do endpoint para localizar e remover o dispositivo sem expor a credencial. Assinaturas expiradas são desativadas automaticamente após respostas HTTP 404 ou 410 do serviço push.

Gere um único par VAPID com `npx web-push generate-vapid-keys` e configure:

- `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`: chave pública usada pelo navegador.
- `WEB_PUSH_VAPID_PRIVATE_KEY`: chave privada disponível somente no servidor.
- `WEB_PUSH_VAPID_SUBJECT`: contato `mailto:` ou URL HTTPS do responsável.
- `BROWSER_PUSH_JOB_SECRET`: segredo exclusivo usado pelo agendador.

O agendador deve chamar `GET /api/jobs/browser-push-alerts` com `Authorization: Bearer <BROWSER_PUSH_JOB_SECRET>`. O endpoint aceita `?limit=50`, respeita as categorias escolhidas, evita duplicidade por alerta e dispositivo e tenta cada entrega no máximo cinco vezes. Produção exige HTTPS; no desenvolvimento, teste com `next dev --experimental-https`.

Com o servidor em execução na URL definida por `NEXTAUTH_URL`, rode manualmente com `npm run jobs:browser-push`. Um limite diferente pode ser informado depois de `--`, por exemplo `npm run jobs:browser-push -- 100`. Em produção, configure o agendador do provedor para executar a chamada protegida a cada 5–15 minutos.

## Saúde e integração contínua

`GET /api/health` oferece uma verificação pública de vida do processo, sem
consultar o banco nem expor configuração. A prontidão aprofundada usa
`GET /api/health?ready=1` com `Authorization: Bearer <HEALTHCHECK_SECRET>` e
confere banco e autenticação, além de informar apenas se integrações opcionais
estão configuradas.

`npm run smoke` sobe o build localmente e verifica CSP, nonces, cabeçalhos,
favicon, health check, bloqueio da exportação anônima e redirecionamento das
rotas protegidas. O workflow `.github/workflows/quality.yml` executa auditoria
de dependências, testes, lint, tipos, build e smoke test em pushes e pull
requests.

O override de `deepmerge-ts` para a linha 8.x corrige temporariamente um alerta
transitivo do Prisma 7.10.0. O override de `mysql2` exige a linha 3.22 ou superior,
que desativa por padrão o plugin de autenticação vulnerável ainda fixado pela CLI
do Prisma. Esses overrides podem ser removidos quando o Prisma passar a depender
oficialmente das versões corrigidas.

## Central de atendimento

A rota `/atendimento` reúne contatos oficiais de setores do Campus João Pessoa e permite pesquisar pelo assunto da dúvida. Cada cartão informa finalidade, canais disponíveis, local, horário, fonte oficial e data da última conferência. Quando a fonte não publica sala ou horário, a interface orienta o estudante a confirmar antes do atendimento presencial.

## Editais simplificados

A rota `/editais` acompanha inicialmente quatro processos oficiais de 2026: IVS, Programa de Alimentação, PAPE e Pesquisa e Inovação Aplicada. A página apresenta público, benefício, requisitos, documentos, passo a passo e cronograma em linguagem simples, sem substituir o documento oficial.

O checklist de cada edital é salvo por usuário na tabela `notice_checklist_items`. Depois de atualizar o projeto, aplique a migração com `npm run db:deploy`.
