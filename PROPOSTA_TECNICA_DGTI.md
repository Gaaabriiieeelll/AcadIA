# Proposta técnica preliminar — Integração do AcadIA com o SUAP/IFPB

**Versão:** 0.3 — minuta para revisão  
**Data:** 30 de agosto de 2026  
**Situação:** documento preliminar, sem autorização institucional concedida

## 1. Identificação

- **Nome do projeto:** AcadIA — Plataforma Acadêmica Inteligente
- **Responsável:** Gabriel de França Mendes
- **Natureza:** projeto pessoal e independente
- **Vínculo de apoio ou orientação:** apoio do professor Valdielio Joaquim Menezes Melo da Silva, docente de Física II
- **Campus inicial:** IFPB Campus João Pessoa
- **Curso:** Técnico em Mecânica Integrado ao Ensino Médio
- **Matrícula:** 20251730018
- **Contato:** franca.mendes@academico.ifpb.edu.br

O professor indicado autorizou sua identificação como apoiador da proposta. Esse apoio não transforma o AcadIA, nesta fase, em produto oficial do IFPB nem representa vinculação formal a um setor institucional.

## 2. Resumo executivo

O AcadIA é uma plataforma web independente de apoio à vida acadêmica do estudante. Sua finalidade é reunir, em uma experiência responsiva e instalável, o acompanhamento de desempenho, a organização de atividades, o planejamento de estudos, o acesso orientado a informações institucionais e o recebimento de alertas. O sistema não substitui o SUAP, o Google Sala de Aula nem os canais oficiais do IFPB; ele organiza informações do próprio usuário e mantém visível a origem dos dados externos.

O MVP atual já funciona sem integração com o SUAP e combina registros locais do estudante, integrações autorizadas de leitura e consultas a fontes públicas. A futura integração solicitada nesta proposta acrescentaria uma fonte institucional confiável para notas, médias, frequência e demais dados acadêmicos autorizados, reduzindo a necessidade de preenchimento manual.

Esta proposta solicita à Diretoria de Gestão de Tecnologia da Informação (DGTI) a análise de viabilidade de uma integração oficial, controlada e exclusivamente de leitura com o SUAP-Ensino. O objetivo inicial é realizar um piloto com aproximadamente 35 estudantes, permitindo que cada participante consulte e sincronize somente os próprios dados acadêmicos, sem fornecer sua senha do SUAP ao AcadIA e sem modificar qualquer informação no sistema institucional.

A execução ficará condicionada à autorização institucional e aos requisitos técnicos, jurídicos, de segurança da informação e de proteção de dados que forem definidos pelo IFPB.

### 2.1 Funcionalidades existentes no MVP

- **visão geral acadêmica:** painel com médias, frequência, avaliações registradas, desempenho por bimestre, disciplinas que exigem atenção, maiores e menores médias e resumo da agenda;
- **disciplinas e desempenho:** cadastro e importação de disciplinas, registro de avaliações, notas, pesos, aulas e faltas, com cálculo de médias e situação acadêmica;
- **agenda e calendário:** criação e acompanhamento de tarefas e eventos, calendário acadêmico público do IFPB e sincronização de atividades do Google Sala de Aula;
- **materiais e horários:** consulta de turmas, avisos e materiais do Google Sala de Aula, além da grade pública da turma de Mecânica II no hIFPB, com aulas, docentes, salas e laboratórios;
- **central de alertas:** avisos explicáveis sobre notas, frequência, prazos e calendário, com preferências por categoria, leitura, adiamento, ocultação, histórico, notificações Web Push e envio opcional pelo WhatsApp;
- **plano de estudos:** organização semanal conforme disponibilidade, meta de tempo, prioridades calculadas a partir de desempenho e atividades, sessões automáticas ou manuais e acompanhamento do progresso;
- **orientação opcional por inteligência artificial:** bate-papo para interpretar notas, priorizar estudos e relacionar conteúdos do Google Sala de Aula a videoaulas do YouTube, somente após consentimento específico;
- **editais e atendimento:** editais do Campus João Pessoa apresentados em linguagem simplificada, com cronogramas, requisitos, documentos, fontes oficiais e checklists individuais, além de uma central pesquisável de setores e canais de atendimento;
- **conta e privacidade:** exportação dos dados em JSON, desconexão local do Google Sala de Aula, revogação do consentimento da IA, controle dos canais de notificação e exclusão permanente da conta.

As funcionalidades acima não significam que exista acesso atual ao SUAP. Não há, até o momento, cliente, credenciais, endpoints ou rota de sincronização do SUAP ativos no AcadIA. Os dados oficiais dessa futura integração somente serão tratados após a tramitação e a autorização institucional correspondentes.

## 3. Problema e justificativa

O acompanhamento acadêmico exige que o estudante consulte diferentes ambientes, como SUAP, Google Sala de Aula, hIFPB, calendários, páginas de editais e páginas de setores, para verificar notas, médias, frequência, atividades, horários, oportunidades e datas importantes. Essa fragmentação dificulta a visualização conjunta do desempenho, aumenta o risco de perda de prazos e torna mais trabalhosa a organização dos estudos.

Atualmente, o AcadIA já reúne parte dessas informações por registro manual, conexão autorizada ao Google Sala de Aula e consulta de fontes públicas do IFPB. A integração oficial com o SUAP reduziria erros de digitação e desatualização nos dados acadêmicos, mantendo uma fonte institucional identificada para cada registro exibido. O projeto pretende transformar os dados em visualizações, alertas e orientações explicáveis, sem substituir o SUAP como fonte oficial nem produzir decisões acadêmicas automáticas.

## 4. Objetivos da integração

1. Consultar dados acadêmicos do próprio estudante autenticado.
2. Sincronizar disciplinas, avaliações, notas, médias e frequência.
3. Identificar claramente a origem e a data de atualização dos registros.
4. Apresentar os dados em painel responsivo para computador e celular.
5. Utilizar os dados autorizados para alimentar, de forma rastreável, o painel, os alertas e o planejamento pessoal do estudante.
6. Reduzir o preenchimento manual sem retirar do usuário o controle sobre sincronização, exportação, revogação e exclusão.
7. Preservar os princípios da finalidade, adequação, necessidade, transparência e segurança, solicitando apenas os dados indispensáveis.

## 5. Público-alvo e piloto proposto

- **Público-alvo futuro:** estudantes regularmente matriculados no IFPB Campus João Pessoa.
- **Piloto inicial:** grupo controlado de estudantes, com participação condicionada às regras e autorizações definidas pelo IFPB.
- **Quantidade estimada:** aproximadamente 35 usuários.
- **Duração sugerida:** dois bimestres letivos após a autorização e a disponibilização de ambiente ou credenciais de teste.
- **Caráter da integração:** piloto temporário, com eventual continuidade condicionada à avaliação e à autorização do IFPB.
- **Expansão:** não ocorrerá automaticamente. Qualquer ampliação além do piloto dependerá de nova avaliação ou das condições definidas pelo IFPB.

O prazo de dois bimestres é uma sugestão para permitir a observação de um período acadêmico significativo e poderá ser ajustado pela DGTI.

## 6. Escopo solicitado

A integração proposta é **somente de leitura**. Não será solicitado acesso para criar, alterar ou excluir dados no SUAP.

### 6.1 Dados solicitados e finalidades

| Dado | Finalidade no AcadIA | Persistência proposta |
|---|---|---|
| Identificador acadêmico ou matrícula | Relacionar a conta ao registro correto do próprio estudante | Durante a participação autorizada |
| Campus, curso, turma e período letivo | Contextualizar o perfil e selecionar os dados do período correto | Durante a participação autorizada |
| Componentes curriculares e códigos | Organizar disciplinas sem duplicidade | Durante o período acadêmico e histórico autorizado |
| Nome dos docentes | Identificar o responsável por cada componente | Durante o período acadêmico |
| Avaliações, notas e pesos | Exibir resultados e calcular ou conferir médias | Durante o período acadêmico e histórico autorizado |
| Médias parciais e finais | Apresentar o desempenho informado pelo sistema oficial | Durante o período acadêmico e histórico autorizado |
| Aulas ministradas, faltas e percentual de frequência | Exibir frequência e alertas de atenção | Durante o período acadêmico e histórico autorizado |
| Situação do componente | Informar andamento, conclusão ou resultado final | Durante o período acadêmico e histórico autorizado |
| Data e hora de atualização | Informar ao usuário a atualidade dos dados | Enquanto o registro relacionado existir |

### 6.2 Dados que não fazem parte do pedido inicial

- CPF, RG, endereço e informações familiares;
- dados financeiros, bancários ou de benefícios;
- informações médicas, sociais ou disciplinares;
- documentos pessoais anexados ao SUAP;
- mensagens privadas ou dados de outros estudantes;
- credenciais, senhas, cookies ou sessões do SUAP;
- qualquer permissão de escrita no sistema institucional.

Se a API retornar campos adicionais, o AcadIA deverá ignorá-los e não armazená-los, salvo nova necessidade formalmente avaliada.

## 7. Funcionamento e autenticação

O AcadIA utiliza atualmente Google OAuth para identidade básica, com os escopos `openid`, `email` e `profile`. Nome, foto e e-mail permanecem na sessão, cuja duração máxima configurada é de quatro horas. O domínio acadêmico está bloqueado no MVP enquanto não houver autorização institucional.

A autenticação perante a API do SUAP será implementada exclusivamente pelo mecanismo oficial definido pela DGTI, preferencialmente com autorização delegada, escopos mínimos e tokens revogáveis. O AcadIA não solicitará nem armazenará a senha do estudante.

Fluxo técnico proposto:

```text
Estudante
    │
    ├── Google OAuth: identidade básica do AcadIA
    │
    ▼
Servidor do AcadIA
    ├── API oficial do SUAP: consulta de leitura autorizada
    └── PostgreSQL: armazenamento mínimo aprovado
             │
             ▼
     Painel, gráficos e alertas do próprio estudante
```

O mecanismo de associação entre a identidade Google e o usuário institucional deverá ser validado pela DGTI. O AcadIA não presumirá que o Google OAuth atual substitui a autenticação exigida pelo SUAP.

## 8. Arquitetura técnica preliminar

| Camada | Tecnologia atual ou proposta |
|---|---|
| Aplicação web | Next.js 16, React 19 e TypeScript, com interface responsiva e recursos de aplicação web instalável (PWA) |
| Processamento no servidor | Rotas e ações de servidor do Next.js |
| Persistência | PostgreSQL acessado por Prisma ORM |
| Autenticação atual | Google OAuth por NextAuth, com lista restrita de contas |
| Validação de entrada | Zod e validação no servidor |
| Google Sala de Aula | Conexão separada e autorizada, somente de leitura, para turmas, materiais, avisos e atividades |
| Fontes públicas do IFPB | Consulta da grade do hIFPB, calendário acadêmico, editais e páginas oficiais de atendimento |
| Plano e alertas | Regras locais explicáveis, tarefas agendadas e preferências individuais |
| Inteligência artificial opcional | OpenAI para orientação de estudos, condicionada a consentimento ativo e com requisições configuradas com `store: false` |
| Recomendações de vídeo | YouTube Data API para localizar videoaulas a partir de pesquisas acadêmicas |
| Notificações | Web Push e WhatsApp por instância própria da Evolution API, ambos ativados pelo usuário |
| Integração SUAP | Adaptador de API a ser criado após autorização e documentação oficial |
| Hospedagem de produção | A definir com o IFPB |
| Monitoramento e auditoria | Verificações de saúde já existentes; trilha específica da integração SUAP a implementar antes do piloto |

Todas as consultas existentes de dados privados são vinculadas ao identificador interno do usuário autenticado. Credenciais de integrações, telefone e material de assinatura Web Push são protegidos no banco por criptografia autenticada. A futura integração deverá manter o mesmo isolamento e adotar o mecanismo de proteção de tokens definido ou aprovado pela DGTI.

## 9. Hospedagem e localização dos dados

O ambiente atual é de desenvolvimento e utiliza banco PostgreSQL gerenciado fora da infraestrutura institucional. A hospedagem definitiva ainda não foi decidida.

Para o piloto, propõem-se as seguintes opções, em ordem de preferência:

1. infraestrutura indicada ou disponibilizada pelo IFPB;
2. infraestrutura externa aprovada formalmente pelo IFPB, com requisitos definidos de região, criptografia, retenção, backup, suboperadores e resposta a incidentes;
3. ambiente externo contendo apenas dados fictícios enquanto não houver aprovação para armazenar dados acadêmicos reais.

Nenhuma decisão de produção será tomada sem informar à DGTI onde os dados serão armazenados e quais prestadores terão acesso técnico à infraestrutura.

## 10. Ciclo de vida dos dados

Fluxo previsto:

1. o estudante autentica-se no AcadIA;
2. inicia ou autoriza a conexão pelo mecanismo oficial do SUAP;
3. o servidor solicita somente os escopos aprovados;
4. os dados são recebidos por conexão protegida;
5. somente os campos necessários são normalizados e persistidos;
6. o usuário visualiza a origem e a última atualização;
7. a revogação interrompe novas sincronizações;
8. a exclusão remove os dados conforme o prazo aprovado.

Propõe-se que, ao fim do piloto ou após solicitação de exclusão, os dados pessoais sejam removidos em até 30 dias, ressalvadas obrigações institucionais que venham a ser determinadas. O prazo definitivo deverá ser validado pelo IFPB.

## 11. Segurança e controle de acesso

### 11.1 Controles existentes no MVP

- autenticação Google com identidade verificada;
- lista restrita de contas autorizadas;
- sessão com duração máxima de quatro horas;
- segredos e conexões mantidos somente no servidor;
- validação de entradas e ações sensíveis no servidor;
- consultas privadas filtradas pelo usuário autenticado;
- criptografia autenticada de tokens do Google Sala de Aula, telefone do WhatsApp e assinaturas Web Push;
- consentimento versionado e revogável para uso da inteligência artificial;
- consentimento específico, verificação e desativação para notificações pelo WhatsApp;
- controles para exportação em JSON, desconexão do Google Sala de Aula e exclusão da conta;
- política de segurança de conteúdo com nonce por requisição e restrição de scripts, frames, objetos e formulários externos;
- jobs de notificação protegidos por segredo, com deduplicação e limite de tentativas;
- verificação de saúde da aplicação e testes automatizados de controles críticos;
- banco com migrações versionadas;
- proibição documental de armazenamento de senhas externas.

### 11.2 Controles necessários antes do piloto

- registro da autorização ou base aplicável à integração SUAP, com versão, finalidade e vigência;
- controle específico para conectar, revogar e remover localmente a integração SUAP;
- inclusão dos dados do SUAP na exportação e na exclusão do titular;
- trilha de auditoria de login, sincronização do SUAP, consulta operacional e exclusão;
- política institucionalmente validada de retenção, descarte e backup;
- comprovação de criptografia em trânsito e em repouso na infraestrutura definitiva;
- procedimento de rotação, revogação e proteção dos segredos da integração SUAP;
- limitação de requisições conforme as cotas da API e proteção contra abuso;
- registro e tratamento de falhas da integração sem exposição de dados ou credenciais;
- plano de resposta a incidentes;
- política de privacidade e termos de uso;
- definição da hospedagem, do acesso operacional e do procedimento de suporte;
- avaliação específica para eventual participação de menores de idade;
- testes adicionais de autorização para impedir acesso horizontal entre usuários e validação de segurança antes do piloto.

## 12. Níveis de acesso

No piloto haverá os seguintes papéis:

- **estudante participante:** visualiza e gerencia somente os próprios dados no AcadIA;
- **responsável técnico:** Gabriel de França Mendes, com acesso ao código e à manutenção do ambiente;
- **apoio docente:** Valdielio Joaquim Menezes Melo da Silva, sem acesso aos dados acadêmicos dos participantes, salvo se houver necessidade, autorização e definição institucional expressas.

Não haverá painel administrativo para consultar notas de estudantes. Qualquer acesso operacional a banco, logs ou infraestrutura deverá ser restrito, justificado e auditável. Os papéis e seus limites poderão ser ajustados conforme orientação do IFPB.

## 13. Compartilhamento e serviços externos

O MVP utiliza ou prevê os serviços abaixo. A eventual utilização de dados provenientes do SUAP em qualquer um deles dependerá de avaliação e autorização específicas do IFPB.

| Serviço ou fonte | Uso atual no AcadIA | Tratamento proposto para dados do SUAP |
|---|---|---|
| Google OAuth | Identidade básica: nome, foto e e-mail | O login, por si só, não envia dados acadêmicos ao Google |
| Google Sala de Aula | Integração separada e somente de leitura para turmas, materiais, avisos e atividades | Permanece uma fonte independente; não receberá dados do SUAP |
| OpenAI | Bate-papo e recomendações de estudo opcionais; recebe nomes de disciplinas, notas e conteúdo textual selecionado do Classroom após consentimento, sem e-mail, matrícula, telefone ou tokens, com `store: false` | Dados originados do SUAP ficarão excluídos durante o piloto, salvo avaliação e autorização expressas em escopo separado |
| YouTube Data API | Busca videoaulas por termos de disciplina ou assunto, sem envio da identidade do estudante | Não receberá registros brutos do SUAP; eventual pesquisa derivada seguirá a regra aprovada pelo IFPB |
| Evolution API e WhatsApp | Envio opcional de alertas ao número informado e verificado pelo usuário | Alertas contendo ou derivados de dados do SUAP somente serão enviados se esse fluxo for expressamente autorizado |
| Serviços Web Push | Entrega opcional de notificações ao navegador cadastrado | A mesma restrição será aplicada a notificações contendo ou derivadas de dados do SUAP |
| hIFPB e páginas oficiais do IFPB | Consulta de horários e reprodução referenciada de calendário, editais e contatos públicos | Fontes públicas, sem compartilhamento de dados pessoais do estudante |
| Hospedagem, PostgreSQL e monitoramento | Execução, persistência e disponibilidade da aplicação | Prestadores, região, acesso, retenção e suboperadores serão informados e submetidos às condições do IFPB |

A autorização de uma integração não será reutilizada para outra finalidade. Em especial, o consentimento atual da funcionalidade de IA não será interpretado como autorização para enviar dados provenientes do SUAP a esse serviço.

## 14. Auditoria e revogação

Antes do piloto, o AcadIA deverá registrar, sem incluir segredos:

- identidade interna que realizou a ação;
- tipo de ação;
- data e hora;
- resultado da sincronização;
- categorias de dados consultadas;
- revogações e exclusões solicitadas.

O estudante deverá poder interromper a sincronização. A revogação deverá invalidar ou remover os tokens conforme o mecanismo definido pela DGTI. Logs não deverão registrar senhas, tokens completos ou conteúdo acadêmico desnecessário.

## 15. URI de retorno e requisitos ainda pendentes

URI atual do Google OAuth em desenvolvimento:

```text
http://localhost:3000/api/auth/callback/google
```

URI proposta para uma eventual integração OAuth com o SUAP em desenvolvimento:

```text
http://localhost:3000/api/integracoes/suap/callback
```

URI planejada para produção:

```text
https://<dominio-a-definir>/api/integracoes/suap/callback
```

A URI de produção somente poderá ser confirmada após a definição do domínio e da hospedagem. Nenhuma rota de integração com o SUAP foi ativada até o momento.

## 16. Informações técnicas solicitadas à DGTI

Caso a proposta seja considerada viável, solicita-se orientação sobre:

- modelo de autenticação e autorização suportado;
- escopos disponíveis e princípio de menor privilégio;
- documentação dos endpoints e contratos de dados;
- ambiente de homologação ou dados de teste;
- processo de cadastro do cliente e das URIs de retorno;
- limites de requisição e frequência permitida de sincronização;
- versionamento, indisponibilidades e tratamento de erros;
- requisitos de logs, auditoria, retenção e revogação;
- restrições de hospedagem e localização dos dados;
- requisitos adicionais de segurança e proteção de dados;
- contato técnico e fluxo de comunicação durante o piloto.

## 17. Plano de execução preliminar

| Fase | Atividade | Previsão inicial |
|---|---|---|
| 0 | Análise institucional, definição de responsáveis e requisitos | Conforme fluxo do IFPB |
| 1 | Adequação dos controles existentes e implementação de privacidade, auditoria e revogação específicas para o SUAP | 4 semanas após requisitos |
| 2 | Desenvolvimento e testes com ambiente de homologação | 4 semanas após acesso técnico |
| 3 | Validação de segurança e correção de inconformidades | Conforme avaliação do IFPB |
| 4 | Piloto controlado com aproximadamente 35 usuários | 2 bimestres letivos |
| 5 | Relatório de resultados, incidentes e recomendação de continuidade | 2 semanas após o piloto |

Os prazos são estimativas e poderão mudar conforme os requisitos institucionais e a disponibilidade técnica.

## 18. Critérios de validação do piloto

- cada usuário acessa apenas os próprios registros;
- a sincronização não altera dados no SUAP;
- as notas, médias e frequências coincidem com a fonte institucional;
- a origem e a data de atualização são visíveis;
- a revogação impede novas sincronizações;
- a exportação e a exclusão funcionam conforme a política aprovada;
- nenhum segredo aparece em interface, logs ou banco;
- falhas e incidentes são documentados e comunicados pelo fluxo definido;
- a experiência funciona em computador e celular.

## 19. Proteção de dados e governança

O projeto reconhece que a autorização individual do estudante não é suficiente, por si só, para viabilizar o acesso aos sistemas institucionais. Não se presume neste documento qual será a base legal aplicável nem a definição final de controlador, operador ou demais responsabilidades.

Solicita-se que essas definições sejam realizadas pelas áreas competentes do IFPB. A implementação seguirá os princípios e procedimentos institucionais que forem estabelecidos, incluindo as condições para consentimento, quando aplicável, direitos do titular, retenção, compartilhamento e participação de menores de idade.

## 20. Riscos e medidas preliminares

| Risco | Medida proposta |
|---|---|
| Acesso indevido a dados de outro estudante | Escopos mínimos, isolamento por usuário e testes de autorização |
| Vazamento de credenciais | Não armazenar senhas, proteger e rotacionar segredos, ocultar tokens em logs |
| Dados desatualizados | Exibir fonte e data da última sincronização |
| Coleta excessiva | Lista fechada de campos e descarte dos campos não autorizados |
| Dependência ou indisponibilidade da API | Tratamento de erros e manutenção temporária dos dados previamente autorizados |
| Hospedagem externa não aprovada | Priorizar infraestrutura institucional ou utilizar somente dados fictícios |
| Recomendações incorretas | Explicar os dados utilizados e não tratar recomendações como decisões oficiais |
| Encerramento da autorização | Revogação, interrupção de sincronização e exclusão conforme política aprovada |

## 21. Solicitação

Solicita-se à DGTI e às áreas competentes:

1. avaliar a viabilidade técnica e institucional do piloto proposto;
2. orientar sobre o setor responsável e a tramitação adequada;
3. indicar os requisitos de segurança e proteção de dados aplicáveis;
4. informar se é necessário um responsável ou patrocinador institucional;
5. definir o modelo de autenticação, os escopos e os dados que poderão ser consultados;
6. avaliar as alternativas de hospedagem;
7. indicar as condições para homologação e eventual execução do piloto.

## 22. Anexos recomendados

- planejamento geral do AcadIA;
- diagrama de arquitetura atualizado;
- inventário e fluxo dos dados;
- modelo lógico do banco, limitado às entidades relevantes;
- imagens das telas atuais;
- relatório dos controles implementados e pendentes;
- plano de testes de autorização e segurança;
- minuta de política de privacidade;
- termo ou documento de ciência do responsável pelo piloto, se solicitado;
- resposta da DGTI que orientou a abertura do processo administrativo.

## 23. Pendências para a versão de protocolo

- confirmar o tipo e o setor de abertura do processo administrativo;
- decidir a hospedagem após orientação do IFPB;
- definir domínio e URI definitiva de produção;
- receber da DGTI os requisitos técnicos e de segurança aplicáveis;
- definir quais funcionalidades complementares poderão tratar dados provenientes do SUAP e quais deverão permanecer isoladas durante o piloto;
- revisar linguagem e anexos antes do protocolo.
