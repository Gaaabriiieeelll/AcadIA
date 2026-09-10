# Planejamento do Projeto — Plataforma Acadêmica Inteligente do IFPB

## 1. Visão geral

Desenvolver uma plataforma web independente, dedicada inicialmente aos estudantes do IFPB Campus João Pessoa, que centralize informações acadêmicas e institucionais em um ambiente simples, acessível e personalizado.

A plataforma deverá integrar, mediante autorização e disponibilidade técnica:

- SUAP;
- Portal do Aluno/Estudante;
- Google Sala de Aula;
- Google Calendar;
- YouTube;
- calendário acadêmico do IFPB;
- editais e oportunidades institucionais.

Uma inteligência artificial auxiliará o estudante na interpretação de seu desempenho, na organização dos estudos e na compreensão de editais e oportunidades.

## 2. Situação inicial

- Projeto de autoria própria.
- Destinado ao uso real.
- Campus inicial: IFPB João Pessoa.
- Primeiro teste realizado somente com os dados do autor.
- Ainda não apresentado à coordenação ou ao setor de TI.
- Sem prazo final definido.
- Desenvolvimento organizado por marcos e versões.

## 3. Problema identificado

O estudante precisa acessar diferentes sistemas para acompanhar:

- notas e frequência;
- atividades e materiais;
- eventos e datas acadêmicas;
- estágios e oportunidades;
- editais e programas sociais;
- contatos dos setores de atendimento.

Essa fragmentação dificulta a organização e pode fazer com que o aluno perca prazos, materiais, oportunidades ou sinais de queda em seu desempenho.

Além disso, editais institucionais geralmente são longos e complexos, tornando informações importantes pouco acessíveis.

## 4. Objetivo geral

Criar uma plataforma acadêmica inteligente que centralize os serviços digitais utilizados pelos estudantes e transforme dados acadêmicos em orientações claras, personalizadas e úteis.

## 5. Objetivos específicos

- Reunir notas, frequência, atividades e eventos.
- Apresentar a evolução acadêmica anual.
- Identificar disciplinas que precisam de atenção.
- Criar planos personalizados de estudo.
- Recomendar materiais do Google Sala de Aula.
- Pesquisar videoaulas relevantes no YouTube.
- Organizar eventos, feriados e encerramentos de bimestre.
- Divulgar estágios e oportunidades.
- Simplificar a leitura de editais.
- Reunir contatos dos setores de atendimento.
- Melhorar a autonomia e a organização do estudante.

## 6. Público-alvo

Inicialmente:

- estudantes regularmente matriculados no IFPB Campus João Pessoa.

Primeira validação:

- um único usuário, utilizando somente os próprios dados acadêmicos.

Expansão futura:

- pequeno grupo voluntário de estudantes;
- outros cursos;
- outros campi, mediante autorização e adaptação.

## 7. Funcionalidades

### 7.1 Acesso e perfil

- Login com e-mail acadêmico por Google OAuth.
- Associação da matrícula ao perfil.
- Cadastro de curso, turma, período e campus.
- Preferências de notificações.
- Controle das permissões concedidas.
- Exportação e exclusão dos dados pessoais.

A plataforma não deverá armazenar senhas do SUAP, Portal do Aluno ou Google.

### 7.2 Painel acadêmico

- Média geral.
- Notas por disciplina e bimestre.
- Frequência geral e por disciplina.
- Evolução anual do desempenho.
- Atividades entregues, pendentes e atrasadas.
- Próximas provas e compromissos.
- Alertas acadêmicos explicáveis.
- Comparação do estudante somente com seu próprio histórico.

### 7.3 Assistente de estudos com IA

A IA poderá:

- identificar disciplinas que precisam de atenção;
- explicar os fatores utilizados na análise;
- criar planos semanais de estudo;
- sugerir horários de revisão;
- explicar conteúdos;
- resumir materiais autorizados;
- produzir exercícios de revisão;
- recomendar materiais do Google Sala de Aula;
- encontrar videoaulas relevantes.

A IA não deverá rotular o estudante, garantir aprovação ou apresentar previsões como certezas.

### 7.4 Recomendações do YouTube

As videoaulas poderão ser classificadas considerando:

- correspondência com o assunto estudado;
- nível de ensino;
- idioma;
- ano de publicação;
- número de visualizações;
- curtidas disponíveis;
- quantidade e qualidade do engajamento;
- duração;
- credibilidade do canal;
- acessibilidade, como presença de legendas.

A popularidade será apenas um dos critérios. Relevância e qualidade pedagógica terão maior importância.

### 7.5 Google Sala de Aula

Após autorização do estudante:

- listagem das disciplinas;
- materiais publicados;
- atividades e prazos;
- identificação de pendências;
- relação entre materiais e dificuldades acadêmicas;
- recomendações de conteúdos já oferecidos pelo professor.

### 7.6 Calendário

- Calendário editável dentro da plataforma.
- Integração opcional com o Google Calendar.
- Feriados.
- Eventos institucionais.
- Início e encerramento dos bimestres.
- Provas e atividades.
- Prazos de editais.
- Lembretes pessoais.
- Visualização diária, semanal e mensal.

### 7.7 Editais e programas sociais

- Resumo em linguagem simples.
- Identificação do público-alvo.
- Documentos necessários.
- Datas e prazos.
- Passo a passo da inscrição.
- Checklist de documentos.
- Perguntas frequentes.
- Link para o edital original.
- Aviso sobre possíveis atualizações.

Para programas como o IVS, a IA apenas explicará o processo. Ela não decidirá a elegibilidade nem prometerá aprovação.

### 7.8 Estágios e oportunidades

- Oportunidades disponibilizadas pelo SUAP e portais autorizados.
- Filtros por curso, modalidade e localização.
- Datas de inscrição.
- Requisitos.
- Documentos exigidos.
- Favoritos.
- Lembretes.
- Explicação do motivo da recomendação.

### 7.9 Central de atendimento

Cada setor deverá apresentar:

- nome;
- finalidade;
- e-mail;
- telefone ou WhatsApp;
- localização;
- horário de funcionamento;
- data da última verificação;
- botões para entrar em contato.

Exemplo:

> **Coordenação de Assistência ao Estudante — CAEST**  
> E-mail: caest.jp@ifpb.edu.br  
> Telefone/WhatsApp: (83) 93612-1374  
> Atendimento presencial: sala da CAEST, de segunda a sexta-feira, das 7h às 20h.

## 8. Proposta visual

A interface deverá ser limpa, acolhedora e acessível, evitando uma aparência punitiva ou excessivamente burocrática.

As especificações completas de cores, tipografia, espaçamento, componentes e acessibilidade estão registradas em [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md). O documento foi elaborado a partir das referências visuais disponíveis na pasta `D:\Projetos DEV\Prints`.

### 8.1 Estrutura do painel principal

```text
┌───────────────────────────────────────────────────────────────┐
│ Olá, estudante!            Próximo evento: fim do bimestre    │
├───────────────────────────────────────────────────────────────┤
│ Média geral │ Frequência │ Pendências │ Próximo compromisso   │
├───────────────────────────────┬───────────────────────────────┤
│ Evolução anual das notas      │ Frequência por disciplina     │
│ [gráfico de linhas]           │ [barras percentuais]          │
├───────────────────────────────┼───────────────────────────────┤
│ Disciplinas que merecem       │ Agenda da semana              │
│ atenção                       │ Provas, atividades e eventos   │
├───────────────────────────────┴───────────────────────────────┤
│ Recomendações da IA: plano de estudos, vídeos e materiais     │
└───────────────────────────────────────────────────────────────┘
```

### 8.2 Navegação principal

- Início;
- Desempenho;
- Disciplinas;
- Agenda;
- Oportunidades;
- Editais;
- Atendimento;
- Configurações.

### 8.3 Identidade visual

- Verde como cor principal, inspirado na identidade visual do IFPB.
- Fundo claro e áreas bem separadas.
- Modo claro e escuro.
- Tipografia simples e legível.
- Cantos levemente arredondados.
- Ícones acompanhados por textos.
- Espaçamento confortável.
- Uso moderado de animações.

Enquanto não houver autorização institucional, o site deverá informar que é um projeto independente e não utilizar a identidade oficial de maneira que sugira vínculo formal.

### 8.4 Cards de resumo

O topo do painel terá quatro indicadores:

1. Média geral;
2. frequência total;
3. atividades pendentes;
4. próximo compromisso.

Cada card mostrará:

- valor principal;
- pequena explicação;
- tendência recente;
- botão para visualizar detalhes.

### 8.5 Gráficos

- Linhas para evolução das notas ao longo do ano.
- Barras para frequência por disciplina.
- Progresso circular para metas pessoais.
- Linha do tempo para eventos e prazos.
- Filtros por disciplina e bimestre.

Os gráficos deverão possuir descrição textual para estudantes que utilizam leitores de tela.

### 8.6 Sistema de alertas

- Azul: informação.
- Verde: progresso ou atividade concluída.
- Amarelo: atenção.
- Vermelho: prazo ou situação urgente.

A cor nunca será o único indicador. Cada alerta também terá ícone, título e explicação.

Exemplo:

> Matemática merece atenção nesta semana. Existem duas atividades pendentes e sua média atual está abaixo da meta definida por você.

### 8.7 Área da IA

A IA aparecerá como assistente acadêmica, mas sem esconder os dados usados na análise.

Cada recomendação deverá informar:

- o que foi identificado;
- quais dados foram considerados;
- qual ação é recomendada;
- quais materiais podem ajudar;
- possibilidade de ignorar ou ajustar a recomendação.

### 8.8 Visual dos editais

Os editais serão apresentados em uma estrutura menos burocrática:

```text
┌────────────────────────────────────────┐
│ Auxílio estudantil — inscrições abertas│
│ Prazo: 10 a 24 de setembro             │
├────────────────────────────────────────┤
│ Posso participar?                      │
│ Documentos necessários                 │
│ Como realizar a inscrição              │
│ Cronograma                             │
│ Checklist pessoal                      │
├────────────────────────────────────────┤
│ Acessar edital oficial                 │
└────────────────────────────────────────┘
```

### 8.9 Responsividade

No celular:

- os cards serão exibidos verticalmente;
- o menu ficará na parte inferior ou em menu lateral;
- os gráficos terão versões simplificadas;
- as ações mais importantes ficarão ao alcance do polegar;
- prazos e pendências aparecerão primeiro.

### 8.10 Acessibilidade

- Contraste adequado.
- Navegação pelo teclado.
- Compatibilidade com leitores de tela.
- Textos alternativos.
- Redimensionamento de fonte.
- Linguagem simples.
- Não depender exclusivamente de cores.
- Respeitar a configuração de redução de movimento do dispositivo.

## 9. MVP — Primeira versão

A primeira versão utilizará somente os dados do autor e terá:

- login com Google;
- perfil acadêmico;
- inserção manual de notas e frequência;
- painel visual de desempenho;
- gráficos anuais;
- calendário editável;
- importação do calendário acadêmico público;
- diretório de atendimento;
- plano de estudos criado pela IA;
- busca de videoaulas;
- estrutura inicial para editais simplificados.

Essa versão não dependerá inicialmente da integração automática com o SUAP ou Portal do Aluno.

## 10. Etapas de desenvolvimento

### Etapa 1 — Pesquisa e viabilidade

- Investigar APIs e permissões.
- Identificar responsáveis institucionais.
- Mapear os dados necessários.
- Documentar riscos.
- Preparar proposta para o IFPB.

### Etapa 2 — Design e protótipo

- Criar mapa de navegação.
- Construir wireframes.
- Definir identidade visual.
- Prototipar painel, desempenho, calendário e editais.
- Testar a navegação.

### Etapa 3 — MVP individual

- Desenvolver autenticação.
- Criar banco de dados.
- Implementar painel.
- Implementar calendário.
- Adicionar notas e frequência.
- Criar recomendações iniciais.
- Integrar a busca do YouTube.

### Etapa 4 — Integrações Google

- Google Sala de Aula.
- Google Calendar.
- Controle de permissões.
- Importação de atividades e materiais.

### Etapa 5 — Integrações institucionais

Após autorização:

- SUAP;
- Portal do Aluno;
- estágios e oportunidades;
- comunicados e eventos.

### Etapa 6 — Piloto controlado

- Selecionar estudantes voluntários.
- Obter consentimento.
- Avaliar usabilidade.
- Verificar respostas da IA.
- Corrigir falhas.
- Preparar expansão.

## 11. Tecnologia sugerida

- **Front-end:** Next.js e TypeScript.
- **Interface:** Tailwind CSS.
- **Back-end:** Next.js ou NestJS.
- **Banco de dados:** PostgreSQL.
- **Autenticação:** Google OAuth.
- **Integrações:** APIs do Google e YouTube.
- **IA:** modelo conectado apenas aos dados autorizados.
- **Hospedagem inicial:** Vercel e banco de dados gerenciado.
- **Protótipo visual:** Figma.

## 12. Segurança e privacidade

- Coletar apenas dados necessários.
- Solicitar consentimento para cada integração.
- Permitir revogação de acesso.
- Não armazenar senhas externas.
- Criptografar dados sensíveis.
- Manter registro de acessos.
- Possibilitar exportação e exclusão dos dados.
- Preparar política de privacidade.
- Avaliar as exigências da LGPD.
- Considerar regras específicas para alunos menores de idade.

## 13. Critérios de sucesso do MVP

O MVP será considerado bem-sucedido quando:

- o usuário conseguir registrar e visualizar seu desempenho;
- os gráficos forem fáceis de compreender;
- a IA explicar corretamente os motivos das recomendações;
- o calendário organizar eventos acadêmicos e pessoais;
- as videoaulas recomendadas forem relevantes;
- os editais forem apresentados de maneira mais clara;
- a plataforma funcionar adequadamente no computador e no celular;
- os dados pessoais permanecerem protegidos.

## 14. Próximos passos

1. Definir o nome provisório e a proposta de valor.
2. Especificar as personas e a jornada do estudante.
3. Detalhar os requisitos funcionais e não funcionais.
4. Criar o mapa de telas.
5. Desenvolver o protótipo visual do painel.
6. Modelar o banco de dados.
7. Definir a arquitetura técnica.
8. Organizar o backlog por prioridade.

---

Este documento constitui o planejamento-base aprovado para o projeto.
