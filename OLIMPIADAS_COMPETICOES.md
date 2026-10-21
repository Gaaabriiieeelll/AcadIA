# Olimpíadas e Competições

Implementação e conferência editorial: 20/10/2026. Rota autenticada: `/olimpiadas`.

## Comportamento implementado

- A navegação compartilhada coloca a aba imediatamente após `schedule` (`/horarios`). O nome do curso continua vindo do perfil/hIFPB; validado com Mecânica II e Informática III.
- Busca sem distinção de acentos/maiúsculas e filtros combináveis por área, campus, nível e situação. Duas seções: datas confirmadas e oportunidades a acompanhar.
- 21 competições; 11 com etapas confirmadas, 10 em acompanhamento editorial; 41 eventos distintos em 2026. Datas passadas continuam consultáveis e nunca são repetidas em outro ano.
- Cada competição guarda fontes, data de conferência, pendências e evidência dos fatos. Cada etapa aponta para sua própria fonte. Campos não confirmados são identificados explicitamente.
- O calendário interno projeta as etapas com categoria e cor próprias. O filtro exibir/ocultar acompanha navegação de mês, semana, dia e atalhos. Não cria nem modifica eventos pessoais.
- Acompanhamento por usuário e edição, lembretes opcionais, adesão separada para etapas de classificados. Acompanhar não inscreve no organizador.
- Lembretes entram na categoria `calendar` já existente; mantêm antecedência, consentimentos, categorias, dispensas e adiamentos existentes. Nenhum canal é habilitado automaticamente. Os jobs já existentes continuam responsáveis pela entrega.
- A exportação de dados da conta inclui acompanhamentos. A exclusão da conta os remove por cascade.

## Fontes e decisões editoriais

Todas as URLs completas, inclusive notícias do IFPB e documentos de cada etapa, estão em `src/data/competitions.ts` e são exibidas nos cartões.

| Competição | Fonte principal consultada | Decisão / pendência |
| --- | --- | --- |
| OBMEP | [Calendário 2026](https://classificados.obmep.org.br/calendario.htm), regulamento e notícia GOMAT/IFPB 2026 | Inscrição escolar, duas provas e divulgação de premiados confirmadas. Medalhas de 2025 não foram tratadas como inscrição atual. |
| OMIF | [Calendário VIII OMIF](https://omif.com.br/images/pdf/calendarioOMIF2026.pdf), regulamento e GOMAT | Segunda fase em 30/10, IFRO Vilhena; classificação local e horário ainda precisam de confirmação. Resultado indicado apenas por mês não gerou evento. |
| OMU | [Portal do organizador](https://www.olimpiada.ime.unicamp.br/), regulamento 2026 e GOMAT | 42ª edição; prorrogação para 26/03 substitui 23/03 do PDF. Fases, premiações e certificados confirmados. Horários por nível dependem do manual do finalista. |
| Canguru | [Organizador](https://www.cangurudematematicabrasil.com.br/), regulamento e premiação IFPB 2026 | Prova 19–25/03; edição com premiações divulgadas. Não foi inferida próxima inscrição. |
| OBI | [Calendário](https://olimpiada.ic.unicamp.br/calendario/), regulamento e POP | Modalidade Programação. Turnos A/B da fase 1 são alternativos. Fase 3 separada por grupos de níveis e horários oficiais. |
| OPI | [UFCG](https://www.dsc.ufcg.edu.br/~opi/) e POP | Provas escolares e universitárias confirmadas. Resultado indicado apenas como outubro não gerou data inventada. |
| Bebras | [Organizador](https://www.bebrasbrasil.com.br/), plataforma de aplicação e POP | Inscrição e prova confirmadas; resultado excluído por inconsistência das datas publicadas. |
| Competição feminina | [POP](https://joaopessoa.ifpb.edu.br/pop/) e destino oficial do seu link, Movimento Meninas Olímpicas/UFSM | Identidade da competição e regulamento atual pendentes. Não foi confundida com CF-OBI. Sem eventos. |
| Maratona POP | [Página detalhada](https://joaopessoa.ifpb.edu.br/pop/maratona/) e agenda POP | Agenda indica 26/09/2026, mas detalhes ainda são de 2025. Sem eventos até confirmação do edital atual. |
| Maratona SBC | [FACOM/UFU — programação oficial](https://maratonasbc.facom.ufu.br/) e POP | Final 07/11, 14h–19h, Arena Sabiazinho, Uberlândia; premiação 19h30–23h30. Apenas classificados; requisitos individuais SBC/ICPC e despesas precisam de conferência com o coach. |
| ONHB | [Comunicado 002/2026](https://www.olimpiadadehistoria.com.br/noticias/ler/394), convocação 10/2026 e ouro de João Pessoa/IFPB | Inscrições e final 29–30/08 confirmadas. O comunicado atual inclui 7º ano (não foram copiadas regras antigas). Regulamento integral não retornou texto; demais restrições pendentes. |
| DHPB | [Calendário](https://dhpb.ifpb.edu.br/calendario) e [regulamento](https://dhpb.ifpb.edu.br/regulamento) | Resultado/convocação **até** 04/11 às 23h59; final 05/12 e premiação 06/12, 8h–12h. Um trecho do regulamento diz 9h para a final; adotado calendário, com aviso para conferir convocação e endereço em Patos. |
| OBR | [Etapa nacional](https://obr.robocup.org.br/etapa-nacional/), manual prático 2026 e GREL/IFPB | Página atual: 23–29/11 no Centro de Convenções de João Pessoa. Manual de março: 23–27/11. Adotado período atual; programação por modalidade pendente. Prêmio do GREL não comprova classificação nacional. |
| Matemática sem Fronteiras | [Regulamento 2026](https://www.matematicasemfronteiras.org/Regulamento_MSF_2026.pdf) | Confirmar adesão, responsável local e aplicação. Sem eventos. |
| OBG | [Regulamento 2026](https://obgeografia.com.br/regulamento/) e organizador | Público e composição confirmados; participação/apoio atual em João Pessoa pendentes. Sem eventos. |
| ONC | [Regulamento 2026](https://www.onciencias.org/regulamento) e comunicado da segunda fase | Público confirmado (inclui 3º ano fundamental e 4º técnico; exclui quem ingressou no superior); adesão local pendente. Sem eventos. |
| OBB | [Butantan: edição 2026](https://butantan.gov.br/butantan-educa/22-a-olimpiada-brasileira-de-biologia-bate-recorde-de-193-mil-inscricoes-e-maior-participacao-feminina) e medalhistas | Ensino médio confirmado; restrições detalhadas, calendário e participação local pendentes. Sem eventos. |
| OPBQ | [Regulamento 2026](https://pb.obquimica.org/regulamento) e resultado estadual | Público confirmado; inscrição terminou em maio. Participação/responsável de João Pessoa não confirmados. Sem eventos. |
| OBA / OBAFOG | [Documentos 2026](https://site.oba.org.br/regulamento-oba-e-obafog), inscrições e notícia IFPB de 2025 | Modalidades distintas. Apoio local atual pendente. A notícia antiga identifica outros campi; não comprova apoio em João Pessoa em 2026. Sem eventos. |
| Quimeninas | [Regulamento](https://quimeninas.obquimica.org/regulamento) e orientações da prova 2026 | Público e gratuidade confirmados; datas divergentes em páginas do programa e apoio local pendente. Sem eventos. |

O GOMAT de João Pessoa foi confirmado na [publicação IFPB de março de 2026](https://www.ifpb.edu.br/campus/joaopessoa/noticias/2026/03/estudantes-do-campus-joao-pessoa-podem-se-inscrever-no-grupo-olimpico-de-matematica). A preparação anunciada não significa inscrição ainda aberta.

## Manutenção

1. Reconferir organizador e evidência local antes de editar. Priorizar retificações posteriores; registrar divergências em `pending`.
2. Manter `id` de competição e de etapa ao corrigir a mesma edição. Criar novos IDs para nova edição. Não copiar datas automaticamente nem remover a edição antiga para simular atualização.
3. Preencher `sources`, `checkedAt`, `sourceIds` dos fatos e `sourceId` de cada etapa. Números de edital ou notícias de medalhas não comprovam inscrição atual.
4. Liberar `calendarReady` somente quando as pendências que impedem a publicação forem resolvidas. Campos acessórios desconhecidos podem continuar explícitos em uma competição com outras etapas confirmadas.
5. Datas são civis `YYYY-MM-DD`, horas `HH:mm`, fuso `America/Sao_Paulo`. Hora ausente gera dia inteiro; prazo com apenas hora final preserva essa informação na descrição. Não definir duração fictícia.
6. `access` distingue público elegível, inscritos e classificados. Inscrição é uma etapa diferente da prova. `deadline` significa **até**, não instante garantido de divulgação.
7. `closesEdition` ou `completion` exige evidência de conclusão; sem isso, o fim da última etapa conhecida não presume fim de toda a edição. A situação de inscrição é calculada pela data/hora atual, inclusive ao voltar à aba do navegador.

Os IDs projetados são `competition:<edition-id>:<stage-id>`. Há deduplicação e uma restrição única de acompanhamento por usuário/edição. O catálogo integra o calendário **interno**; esta alteração não exporta competições para o Google Agenda ou widget Android.

## Banco e publicação

Migration aditiva: `prisma/migrations/20261020190000_competition_subscriptions/migration.sql`. Deve ser aplicada antes de servir a nova versão. O fluxo já existente `build:vercel` executa `db:deploy` em produção. Nenhuma migration foi aplicada no banco de produção e nenhum deploy desta funcionalidade foi executado durante a implementação.

## Validação em 20/10/2026

- `npm test`: 68 testes aprovados, incluindo dez cenários novos do catálogo, filtros, datas, integração e lembretes.
- `npm run lint`, `npm run typecheck`, `npm run build` e `npm run smoke`: aprovados. Smoke inclui redirecionamento de `/olimpiadas` sem autenticação.
- `scripts/competitions-e2e.mjs`: PostgreSQL 18 temporário, todas as migrations e navegador Edge headless com contas sintéticas. Navegação dinâmica, filtros, persistência/reload, unicidade, isolamento, exportação da conta, geração/remoção de alertas, desativação da categoria, calendário e preservação de eventos pessoais aprovados.
- Celular de 390px sem overflow da página; revisão visual desktop/celular; axe WCAG 2 A/AA e 2.1 AA sem violações no conteúdo novo; sem erros JavaScript no navegador. Esta análise automática não substitui avaliação manual completa com leitor de tela.
- Não foram enviados WhatsApp ou Web Push reais. O fluxo usa os jobs e controles de consentimento existentes, com testes de categoria e preferências.

Para repetir o E2E, instalar `embedded-postgres`, `playwright` e `@axe-core/playwright` em uma pasta temporária e definir `COMPETITION_TEST_TOOLS` para essa pasta. Executar após o build: `node scripts/competitions-e2e.mjs`. O teste exige Edge instalado (ou `COMPETITION_TEST_BROWSER` compatível), portas locais 3207/55439 livres e usa o catálogo/situação de outubro de 2026; o cenário de lembrete deve ser atualizado quando esse período passar. As imagens e o relatório axe ficam no diretório temporário informado ao final. Nenhuma dependência dessas ferramentas foi adicionada ao app.
