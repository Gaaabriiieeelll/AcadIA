import type { Competition, CompetitionFact, CompetitionSource, CompetitionStage } from "@/types/competitions";

// One record per edition. Dates are editorially verified, never extrapolated to another year.
export const COMPETITIONS_CHECKED_AT = "2026-10-20";
const source = (id: string, label: string, url: string): CompetitionSource => ({ id, label, url, checkedAt: COMPETITIONS_CHECKED_AT });
const fact = (text: string, ...sourceIds: string[]): CompetitionFact => ({ text, sourceIds });
const gomat = source("gomat", "IFPB: GOMAT em 2026", "https://www.ifpb.edu.br/campus/joaopessoa/noticias/2026/03/estudantes-do-campus-joao-pessoa-podem-se-inscrever-no-grupo-olimpico-de-matematica");
const pop = source("pop", "IFPB: Projeto Olímpico de Programação 2026", "https://joaopessoa.ifpb.edu.br/pop/");
const gomatSupport = fact("GOMAT · João Pessoa · preparação anunciada para 2026. Coordenação: Djair Paulino. Consulte o grupo sobre novas vagas.", "gomat");
const popSupport = fact("POP · João Pessoa. Contatos e atividades na página do projeto.", "pop");
const base = { checkedAt: COMPETITIONS_CHECKED_AT, year: 2026, campuses: ["João Pessoa"], calendarReady: true, pending: [] as string[] };
const stage = (id: string, title: string, kind: CompetitionStage["kind"], startDate: string, sourceId: string, options: Partial<CompetitionStage> = {}): CompetitionStage => ({
  id, title, kind, startDate, sourceId, access: kind === "registration" ? "eligible" : "registered", location: "Consulte a escola/organização para local e modalidade", ...options,
});

const confirmed: Competition[] = [
  {
    ...base, id: "obmep-2026", name: "Olimpíada Brasileira de Matemática das Escolas Públicas", acronym: "OBMEP", area: "Matemática", edition: "21ª edição · 2026",
    description: "Desafios de matemática em duas fases, com inscrição realizada pela escola.", levels: ["Fundamental", "Médio/Técnico"],
    eligibility: fact("Do 6º ano do fundamental ao ensino médio, em escolas públicas ou privadas; níveis definidos pela escolaridade no regulamento.", "rules"),
    participation: fact("Individual; segunda fase mediante classificação.", "rules"),
    registration: fact("A escola inscreve seus estudantes; procure o professor responsável.", "rules"), support: gomatSupport,
    registrationUrl: "https://www.obmep.org.br/", regulationUrl: "https://classificados.obmep.org.br/regulamento.htm",
    sources: [gomat, source("rules", "Regulamento OBMEP 2026", "https://classificados.obmep.org.br/regulamento.htm"), source("dates", "Calendário OBMEP 2026", "https://classificados.obmep.org.br/calendario.htm")],
    stages: [stage("registration", "Inscrições pela escola", "registration", "2026-02-04", "dates", { endDate: "2026-03-16" }), stage("phase1", "Primeira fase", "exam", "2026-06-09", "dates"), stage("phase2", "Segunda fase", "exam", "2026-10-17", "dates", { access: "qualified" }), stage("results", "Divulgação dos premiados", "result", "2026-12-15", "dates", { closesEdition: true, location: "Portal oficial" })],
  },
  {
    ...base, id: "omif-2026", name: "Olimpíada de Matemática das Instituições Federais", acronym: "OMIF", area: "Matemática", edition: "VIII edição · 2026",
    description: "Olimpíada voltada ao ensino técnico integrado da rede federal.", levels: ["Médio/Técnico", "EJA"],
    eligibility: fact("Ensino médio técnico integrado, inclusive PROEJA, nas instituições da rede federal previstas no regulamento.", "rules"),
    participation: fact("Individual; duas fases, com classificação para a segunda.", "rules"), registration: fact("Inscrição por servidor responsável da instituição.", "rules"), support: gomatSupport,
    registrationUrl: "https://omif.com.br/", regulationUrl: "https://omif.com.br/images/pdf/regulamento_OMIF_2026.pdf",
    sources: [gomat, source("rules", "Regulamento VIII OMIF", "https://omif.com.br/images/pdf/regulamento_OMIF_2026.pdf"), source("dates", "Calendário VIII OMIF 2026", "https://omif.com.br/images/pdf/calendarioOMIF2026.pdf")],
    pending: ["Horário da segunda fase e participação dos classificados de João Pessoa precisam ser confirmados com a coordenação. O calendário só informa o mês da divulgação dos classificados; esse resultado não gera evento."],
    stages: [stage("registration", "Inscrições institucionais", "registration", "2026-04-13", "dates", { endDate: "2026-05-10" }), stage("phase1", "Primeira fase — janela de aplicação", "exam", "2026-05-19", "dates", { endDate: "2026-05-21", location: "Própria instituição" }), stage("phase2", "Segunda fase", "exam", "2026-10-30", "dates", { access: "qualified", location: "Presencial · IFRO, Campus Vilhena" })],
  },
  {
    ...base, completion: { confirmedOn: COMPETITIONS_CHECKED_AT, sourceId: "results" }, id: "canguru-2026", name: "Concurso Canguru de Matemática Brasil", acronym: "Canguru", area: "Matemática", edition: "2026", description: "Problemas de raciocínio matemático por nível escolar.", levels: ["Fundamental", "Médio/Técnico", "EJA"],
    eligibility: fact("Do 3º ano do fundamental ao 3º ano do médio. EJA conforme equivalência prevista no regulamento.", "rules"), participation: fact("Prova individual organizada pela escola.", "rules"), registration: fact("A adesão é feita pela escola; a prova de 2026 já ocorreu.", "rules", "dates"), support: gomatSupport,
    registrationUrl: "https://www.cangurudematematicabrasil.com.br/", regulationUrl: "https://www.cangurudematematicabrasil.com.br/regulamento",
    sources: [gomat, source("rules", "Regulamento Canguru", "https://www.cangurudematematicabrasil.com.br/regulamento"), source("dates", "Organizador: edição 2026", "https://www.cangurudematematicabrasil.com.br/"), source("results", "IFPB: premiações de 2026", "https://www.ifpb.edu.br/campus/joaopessoa/noticias/2026/06/estudantes-do-ifpb-joao-pessoa-conquistam-10-premiacoes-em-olimpiada-de-matematica")],
    pending: ["Premiações já divulgadas pelo campus. Não há nova inscrição confirmada neste catálogo; custo e calendário da próxima edição precisam de nova conferência."],
    stages: [stage("exam", "Janela de aplicação da prova", "exam", "2026-03-19", "dates", { endDate: "2026-03-25" })],
  },
  {
    ...base, id: "obi-2026", name: "Olimpíada Brasileira de Informática — Programação", acronym: "OBI", area: "Programação", edition: "28ª edição · 2026", description: "Resolução individual de problemas por meio de programas.", levels: ["Fundamental", "Médio/Técnico", "Superior"],
    eligibility: fact("Programação: Mirim até 7º ano; Júnior 8º/9º; nível 1 até 1º médio; nível 2 até 3º médio; Sênior 4º técnico ou primeiro ingresso no 1º ano superior. Limite de 20 anos em 1º de julho, exceto Sênior.", "rules"),
    participation: fact("Individual; avanço às fases seguintes por classificação.", "rules"), registration: fact("Inscrição pelo coordenador de escola credenciada. O turno de aplicação é definido pela escola.", "rules"), support: popSupport,
    registrationUrl: "https://olimpiada.ic.unicamp.br/", regulationUrl: "https://olimpiada.ic.unicamp.br/info/regulamento/",
    sources: [pop, source("rules", "Regulamento OBI 2026", "https://olimpiada.ic.unicamp.br/info/regulamento/"), source("dates", "Calendário OBI 2026", "https://olimpiada.ic.unicamp.br/calendario/")],
    pending: ["A escola escolhe uma aplicação da primeira fase; o turno B é alternativo, não uma fase adicional. Confirme seu turno e horário com o POP."],
    stages: [stage("registration", "Inscrições em Programação", "registration", "2026-03-06", "dates", { endDate: "2026-06-08" }), stage("phase1-a", "Fase 1 — turno A", "exam", "2026-06-10", "dates", { endDate: "2026-06-12" }), stage("phase1-b", "Fase 1 — turno B alternativo", "exam", "2026-06-18", "dates", { endDate: "2026-06-19" }), stage("phase2", "Fase 2 — janela de aplicação", "exam", "2026-08-20", "dates", { endDate: "2026-08-21", access: "qualified" }), stage("phase3-morning", "Fase 3 — Mirim, Júnior e nível 1", "exam", "2026-10-03", "dates", { access: "qualified", startTime: "08:00", endTime: "12:00" }), stage("phase3-afternoon", "Fase 3 — níveis 2 e Sênior", "exam", "2026-10-03", "dates", { access: "qualified", startTime: "13:00", endTime: "18:00" })],
  },
  {
    ...base, id: "opi-2026", name: "Olimpíada Paraibana de Informática", acronym: "OPI", area: "Programação", edition: "2026", description: "Modalidades escolares e universitárias de resolução de problemas.", levels: ["Fundamental", "Médio/Técnico", "Superior"],
    eligibility: fact("Iniciação por faixas do fundamental; Programação para 9º ano e médio. Avançado Júnior para universitários que não cursaram nem cursam Estruturas de Dados. Outras categorias têm regras próprias.", "official"),
    participation: fact("Programação escolar individual; Avançado em equipes de três.", "official"), registration: fact("Escola cadastra-se até 13/05; estudantes escolares até 19/05. Consulte a modalidade antes de inscrever-se.", "official"), support: popSupport,
    registrationUrl: "https://www.dsc.ufcg.edu.br/~opi/", regulationUrl: "https://www.dsc.ufcg.edu.br/~opi/",
    sources: [pop, source("official", "UFCG: OPI 2026 — regras e datas", "https://www.dsc.ufcg.edu.br/~opi/")],
    pending: ["O resultado é indicado apenas para outubro, sem dia confirmado; não foi criado evento de resultado. Confira as restrições de cada modalidade na UFCG."],
    stages: [stage("school-exam", "Provas escolares", "exam", "2026-05-19", "official", { location: "Escolas participantes; horário local a confirmar" }), stage("advanced", "Prova Avançado", "exam", "2026-08-08", "official", { startTime: "13:00", location: "Consulte a sede universitária no organizador" })],
  },
  {
    ...base, id: "bebras-2026", name: "Bebras Brasil", acronym: "Bebras", area: "Programação", edition: "2026", description: "Desafio de pensamento computacional, sem exigir programação prévia.", levels: ["Fundamental", "Médio/Técnico"],
    eligibility: fact("Estudantes da educação básica em categorias por escolaridade; o POP divulga a oportunidade para o ensino médio.", "official", "pop"),
    participation: fact("Desafio individual, aplicado pela instituição participante.", "official"), registration: fact("Adesão pela instituição no portal Bebras Brasil.", "official"), support: popSupport,
    registrationUrl: "https://www.bebrasbrasil.com.br/", sources: [pop, source("official", "Bebras Brasil: calendário 2026", "https://www.bebrasbrasil.com.br/"), source("exam", "Bebras: aplicação 2026", "https://treinamento.bebrasbrasil.com.br/app-desafio-bebras")],
    pending: ["A página apresenta datas incompatíveis para resultados; aguardar correção. Taxas e regulamento detalhado devem ser confirmados com a instituição."],
    stages: [stage("registration", "Inscrições institucionais", "registration", "2026-04-20", "official", { endDate: "2026-09-25" }), stage("exam", "Janela do desafio", "exam", "2026-10-01", "exam", { endDate: "2026-10-07", location: "Plataforma on-line, com aplicação institucional" })],
  },
  {
    ...base, id: "dhpb-2026", name: "Desafio de História da Paraíba", acronym: "DHPB", area: "História", edition: "4ª edição · 2026", description: "Investigação da história paraibana em quatro fases on-line e uma final presencial.", levels: ["Fundamental", "Médio/Técnico", "EJA"],
    eligibility: fact("Escolas públicas e privadas da Paraíba: 8º/9º ano, médio (inclusive integrado) e EJA, conforme regulamento.", "rules"),
    participation: fact("Três estudantes da mesma escola e um professor de História; cada estudante integra apenas uma equipe. Fases eliminatórias.", "rules"), registration: fact("Equipe com professor orientador pelo portal DHPB. Final exclusiva para convocados.", "rules"), support: fact("Organização: NEPOHP/IFPB. Não foi confirmado grupo de preparação específico em João Pessoa.", "rules"),
    cost: fact("Inscrição gratuita. Deslocamento, alimentação e hospedagem não são custeados pelo desafio.", "rules"), registrationUrl: "https://dhpb.ifpb.edu.br/", regulationUrl: "https://dhpb.ifpb.edu.br/regulamento",
    sources: [source("rules", "Regulamento DHPB 2026", "https://dhpb.ifpb.edu.br/regulamento"), source("dates", "Calendário oficial DHPB 2026", "https://dhpb.ifpb.edu.br/calendario")],
    pending: ["O calendário informa final das 8h às 12h; um trecho do regulamento menciona 9h. O calendário foi adotado, mas o horário de apresentação e o endereço em Patos devem ser conferidos na convocação."],
    stages: [stage("registration", "Inscrições de equipes", "registration", "2026-07-30", "dates", { endDate: "2026-09-10", endTime: "23:59", location: "On-line · portal DHPB" }),
      ...[["1", "09-14", "09-19"], ["2", "09-21", "09-26"], ["3", "09-28", "10-03"], ["4", "10-05", "10-14"]].map(([n, start, end]) => stage(`phase${n}`, `${n}ª fase`, "phase", `2026-${start}`, "dates", { endDate: `2026-${end}`, startTime: "08:00", endTime: "18:00", location: "On-line · portal DHPB", access: n === "1" ? "registered" : "qualified" })),
      stage("final-call", "Prazo para resultado da 4ª fase e convocação", "result", "2026-11-04", "dates", { deadline: true, endTime: "23:59", location: "Portal DHPB" }),
      stage("final", "Final presencial", "exam", "2026-12-05", "dates", { startTime: "08:00", endTime: "12:00", access: "qualified", location: "Campus Patos · conferir convocação" }),
      stage("award", "Premiação", "award", "2026-12-06", "dates", { startTime: "08:00", endTime: "12:00", access: "qualified", location: "Presencial · conferir convocação", closesEdition: true })],
  },
  {
    ...base, id: "sbc-2026", name: "Maratona SBC de Programação", acronym: "Maratona SBC", area: "Programação", edition: "31ª edição · 2026", description: "Maratona universitária em equipes, com seleção regional para a final brasileira.", levels: ["Superior"],
    eligibility: fact("Universitários elegíveis pelas regras SBC/ICPC; a final é exclusiva para equipes classificadas. Confira limites acadêmicos e histórico de participação com o coach.", "official"),
    participation: fact("Três competidores por time; pode haver reserva. Prova final de cinco horas.", "official"), registration: fact("Inscrição da delegação classificada pela organização e pelo coach; o link do evento não constitui vaga na disputa.", "official"), support: popSupport,
    registrationUrl: "https://maratonasbc.facom.ufu.br/", regulationUrl: "https://maratona.sbc.org.br/",
    sources: [pop, source("official", "FACOM/UFU: final brasileira — programação oficial", "https://maratonasbc.facom.ufu.br/")],
    pending: ["Confirmar elegibilidade individual nas regras SBC/ICPC, custos da delegação e classificação da equipe de João Pessoa. Horários sujeitos a ajustes da organização."],
    stages: [stage("final", "Final brasileira", "exam", "2026-11-07", "official", { startTime: "14:00", endTime: "19:00", access: "qualified", location: "Presencial · Arena Sabiazinho, Uberlândia/MG" }), stage("award", "Cerimônia de premiação", "award", "2026-11-07", "official", { startTime: "19:30", endTime: "23:30", access: "qualified", location: "Estádio Parque do Sabiá, portão 06 · Uberlândia/MG", closesEdition: true })],
  },
  {
    ...base, id: "obr-2026", name: "Olimpíada Brasileira de Robótica — modalidade prática", acronym: "OBR", area: "Robótica", edition: "2026", description: "Construção e programação de robôs em modalidades de desafio prático.", levels: ["Fundamental", "Médio/Técnico"],
    eligibility: fact("Categorias por ano escolar da educação básica. Máximo de 19 anos no ano da competição; consultar os níveis no manual. A presença de universitários no GREL não comprova elegibilidade na OBR.", "rules", "grel"),
    participation: fact("Em equipe, com técnico responsável; composição depende da modalidade e do nível.", "rules"), registration: fact("Inscrições pelo técnico no Sistema Olimpo; nacional mediante classificação.", "rules"),
    support: fact("GREL · João Pessoa: participação na OBR 2026 confirmada pelo IFPB. A notícia de prêmio não confirma vaga na nacional.", "grel"), cost: fact("Inscrição, participação e premiações gratuitas; despesas de viagem não incluídas nesta informação.", "rules"),
    regulationUrl: "https://obr.robocup.org.br/documentos-e-manuais/", registrationUrl: "https://obr.robocup.org.br/",
    sources: [source("grel", "IFPB: GREL na OBR 2026", "https://www.ifpb.edu.br/campus/joaopessoa/noticias/2026/09/equipe-de-robotica-do-ifpb-conquista-premio-inovacao-obr-2026"), source("rules", "Manual de inscrição prática OBR 2026", "https://obr.robocup.org.br/wp-content/uploads/2026/03/OBR2026_MP_Manual-de-Inscricao.pdf%20"), source("national", "OBR: etapa nacional 2026", "https://obr.robocup.org.br/etapa-nacional/")],
    pending: ["A página nacional atual informa 23–29/11; o manual de março indicava 23–27/11. Adotado o período atual do evento; dias e horários específicos de cada modalidade ainda não foram publicados."],
    stages: [stage("national", "Período da etapa nacional", "phase", "2026-11-23", "national", { endDate: "2026-11-29", access: "qualified", location: "Presencial · Centro de Convenções de João Pessoa/PB" })],
  },
];

type WatchInput = Pick<Competition, "id" | "name" | "acronym" | "area" | "description" | "levels" | "sources" | "pending"> & Partial<Competition>;
const watch = (input: WatchInput): Competition => ({
  ...base, edition: "2026 · informações parciais", calendarReady: false, campuses: ["Participação local a confirmar"],
  eligibility: fact("Elegibilidade detalhada da edição atual precisa ser confirmada no regulamento."),
  participation: fact("Formato e composição a confirmar."), registration: fact("Não há inscrição aberta confirmada neste catálogo."),
  support: fact("Apoio atual em João Pessoa não confirmado."), stages: [], ...input,
});
const opportunities: Competition[] = [
  watch({ id: "omu-2026", name: "Olimpíada de Matemática da Unicamp", acronym: "OMU", area: "Matemática", edition: "42ª edição · 2026", calendarReady: true,
    description: "Provas dissertativas em equipes e fase individual adicional para classificados do nível Beta.", campuses: ["João Pessoa"], levels: ["Fundamental", "Médio/Técnico", "EJA"], support: gomatSupport,
    eligibility: fact("Residentes no Brasil: 6º–9º ano (Alfa) e ensino médio (Beta), inclusive profissionalizante e EJA. Quem já concluiu o médio não pode participar.", "rules"),
    participation: fact("Equipes de três estudantes com professor responsável; fases posteriores por classificação.", "rules"), registration: fact("Cadastro, pagamento ou isenção e aceite dos integrantes no sistema do organizador.", "rules"),
    cost: fact("Taxa por equipe e lote: escolas públicas não seletivas R$ 48/60; demais R$ 156/195. Isenções condicionadas ao regulamento; não assumir gratuidade para o IFPB.", "rules"),
    regulationUrl: "https://www.olimpiada.ime.unicamp.br/elementos_visuais/arquivos/regulamento-2026.pdf", registrationUrl: "https://www.olimpiada.ime.unicamp.br/edicao-atual.php",
    sources: [gomat, source("rules", "Regulamento OMU 2026", "https://www.olimpiada.ime.unicamp.br/elementos_visuais/arquivos/regulamento-2026.pdf"), source("dates", "OMU: calendário e prorrogação", "https://www.olimpiada.ime.unicamp.br/"), source("edition", "OMU: edição 2026", "https://www.olimpiada.ime.unicamp.br/omu-edicoes/edicao-2026.php")],
    pending: ["Inscrições prorrogadas para 26/03 no portal, substituindo 23/03 do regulamento. Confirmar horários por nível no manual do finalista; aqui as janelas aparecem como dia inteiro."],
    stages: [stage("registration", "Inscrições — prazo prorrogado", "registration", "2026-02-23", "dates", { endDate: "2026-03-26", location: "Sistema on-line OMU" }),
      stage("phase1", "Primeira fase", "phase", "2026-04-06", "dates", { endDate: "2026-04-12", location: "Remota" }),
      stage("phase2-1", "Fase 2.1", "phase", "2026-05-18", "dates", { endDate: "2026-05-24", access: "qualified", location: "Remota" }),
      stage("phase2-2", "Fase 2.2 — janela de aplicação", "phase", "2026-05-25", "dates", { endDate: "2026-05-31", access: "qualified", location: "Presencial na escola; horário definido localmente" }),
      stage("regional-award", "Cerimônia de destaque regional", "award", "2026-07-24", "dates", { access: "qualified", location: "On-line" }),
      stage("phase3", "Terceira fase — Alfa e Beta", "exam", "2026-09-05", "dates", { access: "qualified", location: "Presencial · Unicamp, Campinas/SP; turnos diferentes por nível" }),
      stage("award", "Cerimônia principal", "award", "2026-09-06", "dates", { access: "qualified", location: "Presencial · Unicamp" }),
      stage("individual", "Fase individual — Beta", "exam", "2026-09-07", "dates", { access: "qualified", location: "Presencial · Unicamp" }),
      stage("individual-award", "Premiação individual e redação", "award", "2026-09-25", "dates", { access: "qualified", location: "On-line" }),
      stage("certificates", "Disponibilização de certificados", "result", "2026-10-25", "rules", { location: "Sistema OMU", closesEdition: true })],
  }),
  watch({ id: "feminina-pop-2026", name: "Competição feminina de programação", acronym: "Competição feminina", area: "Programação", description: "Atividade divulgada pelo POP para ampliar a participação feminina.", campuses: ["João Pessoa"], levels: ["Médio/Técnico"], support: popSupport, sources: [pop, source("organizer", "Destino do link do POP: Movimento Meninas Olímpicas", "https://tfcbr.inf.ufsm.br/")], pending: ["O link do POP leva ao Movimento Meninas Olímpicas, sem regulamento da prova. Confirmar qual competição/edição corresponde à agenda antes de usar a data ou as regras da CF-OBI." ] }),
  watch({ id: "maratona-pop-2026", name: "Maratona de Programação do POP", acronym: "Maratona POP", area: "Programação", description: "Competição local do projeto de programação do campus.", campuses: ["João Pessoa"], levels: ["Médio/Técnico", "Superior"], support: popSupport, sources: [pop, source("details", "Maratona POP: página detalhada (2025)", "https://joaopessoa.ifpb.edu.br/pop/maratona/")], pending: ["A agenda POP 2026 indica 26/09, mas o link detalhado ainda apresenta 2025. Confirmar edital 2026, composição, inscrições e cronograma antes de cadastrar eventos." ] }),
  watch({ id: "onhb-2026", name: "Olimpíada Nacional em História do Brasil", acronym: "ONHB", area: "História", edition: "18ª edição · 2026", calendarReady: true,
    description: "Investigação histórica em equipes; João Pessoa conquistou ouro em 2026.", campuses: ["João Pessoa"], levels: ["Fundamental", "Médio/Técnico"],
    eligibility: fact("O comunicado de 2026 inclui 7º, 8º e 9º anos do fundamental e ensino médio de escolas públicas e privadas. Consulte o regulamento para as demais restrições.", "entry"),
    participation: fact("Três estudantes e um professor de História por equipe.", "entry"), registration: fact("Pelo portal de inscrições da ONHB, com professor orientador. O prazo de 2026 terminou em abril.", "entry"),
    cost: fact("Inscrição gratuita para escolas públicas em 2026; demais custos não incluídos nesta informação.", "entry"),
    support: fact("Participação em 2026 confirmada; orientação da equipe premiada: Fabrício Morais. Novas vagas de preparação não confirmadas.", "local"),
    sources: [source("local", "IFPB: ouro na ONHB 2026", "https://www.ifpb.edu.br/campus/joaopessoa/noticias/2026/09/estudantes-do-ifpb-conquistam-ouro-na-olimpiada-nacional-em-historia-do-brasil"), source("entry", "ONHB: comunicado de inscrições 002/2026", "https://www.olimpiadadehistoria.com.br/noticias/ler/394"), source("final", "ONHB: convocação para a final 10/2026", "https://www.olimpiadadehistoria.com.br/noticias/ler/410"), source("rules", "Regulamento da 18ª ONHB", "https://www.olimpiadadehistoria.com.br/paginas/onhb18/regulamento")],
    regulationUrl: "https://www.olimpiadadehistoria.com.br/paginas/onhb18/regulamento", registrationUrl: "https://inscricoes.olimpiadadehistoria.com.br/",
    pending: ["O regulamento integral não retornou texto na conferência; o público e formato foram confirmados no comunicado de inscrições de 2026. Prazos de certificados devem ser consultados por participantes anteriores, e não representam nova inscrição."],
    stages: [stage("registration", "Inscrições", "registration", "2026-02-15", "entry", { endDate: "2026-04-24", location: "Portal de inscrições ONHB" }), stage("final", "Final nacional presencial", "exam", "2026-08-29", "final", { endDate: "2026-08-30", access: "qualified", location: "Unicamp · Campinas/SP", closesEdition: true })],
  }),
  watch({ id: "msf-2026", name: "Matemática sem Fronteiras", acronym: "OIMSF", area: "Matemática", description: "Desafio colaborativo de matemática entre turmas.", levels: ["Fundamental", "Médio/Técnico"], sources: [source("rules", "Regulamento MSF 2026", "https://www.matematicasemfronteiras.org/Regulamento_MSF_2026.pdf")], regulationUrl: "https://www.matematicasemfronteiras.org/Regulamento_MSF_2026.pdf", pending: ["Confirmar adesão institucional e responsável atual em João Pessoa, composição da turma e calendário de aplicação. Não há inscrição atual confirmada." ] }),
  watch({ id: "obg-2026", name: "Olimpíada Brasileira de Geografia", acronym: "OBG", area: "Geografia", edition: "11ª edição · 2026", description: "Desafios de geografia e ciências da Terra.", levels: ["Fundamental", "Médio/Técnico"],
    eligibility: fact("9º ano do fundamental ao 3º/4º ano do médio, em escolas brasileiras públicas ou privadas.", "rules"), participation: fact("Três estudantes da mesma instituição e professor orientador do corpo docente da escola.", "rules"), registration: fact("Exclusivamente on-line pelo professor orientador.", "rules"),
    sources: [source("official", "OBG 2026", "https://obgeografia.com.br/"), source("rules", "Regulamento OBG", "https://obgeografia.com.br/regulamento/")], regulationUrl: "https://obgeografia.com.br/regulamento/", pending: ["Confirmar participação e responsável em João Pessoa. A final divulgada pelo organizador não confirma classificação de estudantes do campus." ] }),
  watch({ id: "onc-2026", name: "Olimpíada Nacional de Ciências", acronym: "ONC", area: "Ciências", description: "Competição interdisciplinar de ciências.", levels: ["Fundamental", "Médio/Técnico", "EJA"],
    eligibility: fact("3º–9º ano do fundamental, 1º–3º médio, 4º técnico e EJA equivalente; o estudante não pode ter ingressado no ensino superior.", "rules"), registration: fact("Cadastro institucional pelo portal ONC, com responsável da escola e código INEP.", "rules"), cost: fact("Cadastro da escola gratuito; esta informação não cobre despesas pessoais.", "rules"),
    sources: [source("rules", "Regulamento ONC 2026", "https://www.onciencias.org/regulamento"), source("phase2", "ONC: segunda fase 2026", "https://onciencias.org/noticias/2-fase-da-onc-2026-acontece-nos-dias-17-e-18-de-setembro")], regulationUrl: "https://www.onciencias.org/regulamento", pending: ["Confirmar adesão e professor responsável em João Pessoa. A segunda fase de setembro já passou; não é inscrição aberta." ] }),
  watch({ id: "obb-2026", name: "Olimpíada Brasileira de Biologia", acronym: "OBB", area: "Biologia", edition: "22ª edição · 2026", description: "Olimpíada organizada pelo Instituto Butantan.", levels: ["Médio/Técnico"], eligibility: fact("Ensino médio de escolas públicas e privadas brasileiras; demais restrições precisam ser verificadas no regulamento.", "official"), sources: [source("official", "Butantan: 22ª OBB 2026", "https://butantan.gov.br/butantan-educa/22-a-olimpiada-brasileira-de-biologia-bate-recorde-de-193-mil-inscricoes-e-maior-participacao-feminina"), source("results", "Medalhistas OBB 2026", "https://obb-sistema.butantan.gov.br/classificados/2026/medalhistas")], pending: ["A edição 2026 já tem medalhistas. Confirmar regulamento, próxima janela e participação de João Pessoa; notícia de inscrições recordes é histórica." ] }),
  watch({ id: "opbq-2026", name: "Olimpíada Paraibana de Química", acronym: "OPBQ", area: "Química", edition: "XVII edição · 2026", description: "Competição estadual do Programa Nacional Olimpíadas de Química.", levels: ["Fundamental", "Médio/Técnico"], eligibility: fact("9º ano do fundamental, 1º–3º médio ou técnico e 4º técnico em escolas públicas ou privadas da Paraíba.", "rules"), registration: fact("Inscrições de 06/04 a 29/05/2026 no Programa Nacional Olimpíadas de Química; prazo encerrado.", "rules"), regulationUrl: "https://pb.obquimica.org/regulamento", sources: [source("results", "Organizador: resultado OPBQ 2026", "https://pb.obquimica.org/noticias/resultado-opbq-2026"), source("rules", "Regulamento OPBQ 2026", "https://pb.obquimica.org/regulamento")], pending: ["Resultado 2026 publicado. Confirmar participação e responsável em João Pessoa antes de integrar etapas locais. Nova inscrição não confirmada." ] }),
  ...[
    { id: "oba-2026", name: "Olimpíada Brasileira de Astronomia e Astronáutica", acronym: "OBA", area: "Astronomia", description: "Provas de astronomia e astronáutica por nível escolar." },
    { id: "obafog-2026", name: "Olimpíada Brasileira de Foguetes", acronym: "OBAFOG", area: "Astronomia", description: "Construção e lançamento de foguetes em categorias próprias; não é a prova da OBA." },
  ].map((item) => watch({ ...item, levels: ["A confirmar"], sources: [source("rules", "Regulamento OBA e OBAFOG 2026", "https://site.oba.org.br/regulamento-oba-e-obafog"), source("registration", "Organizador: inscrições", "https://site.oba.org.br/inscricoes"), source("history", "IFPB: participação de outros campi em 2025", "https://www.ifpb.edu.br/noticias/2025/07/ifpb-se-destaca-na-olimpiada-brasileira-de-astronomia-e-astronautica-e-na-obafog")], regulationUrl: "https://site.oba.org.br/regulamento-oba-e-obafog", pending: ["Confirmar apoio em João Pessoa e nível/modalidade elegível. A notícia do IFPB refere-se a 2025 e a outros campi (Cabedelo Centro, Campina Grande, Esperança, Itabaiana, Patos e Princesa Isabel), não a apoio atual em João Pessoa." ] })),
  watch({ id: "quimeninas-2026", name: "Olimpíada Quimeninas", acronym: "Quimeninas", area: "Química", description: "Competição de química para meninas.", levels: ["Fundamental", "Médio/Técnico", "EJA"],
    eligibility: fact("Meninas do 9º ano, 1º–3º médio, 4º técnico e equivalentes EJA, conforme regulamento.", "rules"), registration: fact("Inscrição por professor ou diretamente pela estudante quando não houver professor responsável.", "rules"), cost: fact("Gratuita.", "rules"),
    sources: [source("rules", "Regulamento Quimeninas 2026", "https://quimeninas.obquimica.org/regulamento"), source("update", "Orientações de acesso à prova 2026", "https://quimeninas.obquimica.org/noticias/quimeninas-2026-confira-as-orientacoes-para-o-acesso-a-prova")], regulationUrl: "https://quimeninas.obquimica.org/regulamento", pending: ["Confirmar apoio local e retificações do calendário: páginas do programa apresentam datas diferentes de prova. Não há inscrição atual confirmada." ] }),
];

export const competitions: Competition[] = [...confirmed, ...opportunities];
