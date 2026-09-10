export type AcademicCalendarCategory =
  | "holiday"
  | "recess"
  | "milestone"
  | "evaluation"
  | "institutional";

export type AcademicCalendarEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  dateLabel?: string;
  category: AcademicCalendarCategory;
};

export type AcademicCalendarPeriod = {
  id: string;
  title: string;
  subtitle: string;
  months: string[];
};

export const academicCalendarMetadata = {
  title: "Proposta de Calendário Acadêmico",
  campus: "Campus João Pessoa",
  audience: "Cursos Técnicos Integrados (exceto Proeja)",
  academicYear: "2026",
  sourceUpdatedAt: "30/12/2025",
  schoolDays: 200,
} as const;

export const academicCalendarCategories: Record<
  AcademicCalendarCategory,
  { label: string; shortLabel: string }
> = {
  holiday: { label: "Feriados e pontos facultativos", shortLabel: "Feriado" },
  recess: { label: "Recessos e férias", shortLabel: "Recesso ou férias" },
  milestone: { label: "Marcos do período letivo", shortLabel: "Marco letivo" },
  evaluation: { label: "Conselhos e avaliações", shortLabel: "Conselho ou avaliação" },
  institutional: { label: "Ações e eventos institucionais", shortLabel: "Evento institucional" },
};

export const academicCalendarPeriods: AcademicCalendarPeriod[] = [
  {
    id: "semestre-2026-1",
    title: "Semestre 2026.1",
    subtitle: "Fevereiro a julho de 2026",
    months: ["2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"],
  },
  {
    id: "semestre-2026-2",
    title: "Semestre 2026.2",
    subtitle: "Agosto de 2026 a janeiro de 2027",
    months: ["2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01"],
  },
  {
    id: "previsao-2027-1",
    title: "Previsão 2027.1",
    subtitle: "Fevereiro a abril de 2027",
    months: ["2027-02", "2027-03", "2027-04"],
  },
];

export const academicCalendarEvents: AcademicCalendarEvent[] = [
  {
    id: "2026-02-reuniao-responsaveis",
    title: "Reunião com responsáveis pelos discentes ingressantes do ETIM",
    startDate: "2026-02-09",
    category: "institutional",
  },
  {
    id: "2026-02-acolhimento-etim",
    title: "Período de acolhimento aos estudantes ingressantes do ETIM 2026",
    startDate: "2026-02-09",
    endDate: "2026-02-11",
    category: "institutional",
  },
  {
    id: "2026-02-recesso-carnaval",
    title: "Recesso de Carnaval",
    startDate: "2026-02-16",
    endDate: "2026-02-18",
    dateLabel: "16 e 18 fev.",
    category: "recess",
  },
  {
    id: "2026-02-carnaval",
    title: "Carnaval (ponto facultativo)",
    startDate: "2026-02-17",
    category: "holiday",
  },
  {
    id: "2026-02-semana-dialogos",
    title: "Semana de Diálogos 2025",
    startDate: "2026-02-19",
    endDate: "2026-02-24",
    category: "institutional",
  },
  {
    id: "2026-02-inicio-primeiro-bimestre",
    title: "Início do 1º bimestre",
    startDate: "2026-02-25",
    category: "milestone",
  },
  {
    id: "2026-04-recesso-semana-santa",
    title: "Recesso da Semana Santa",
    startDate: "2026-04-02",
    category: "recess",
  },
  {
    id: "2026-04-paixao-cristo",
    title: "Paixão de Cristo (feriado nacional)",
    startDate: "2026-04-03",
    category: "holiday",
  },
  {
    id: "2026-04-pascoa",
    title: "Páscoa",
    startDate: "2026-04-05",
    category: "holiday",
  },
  {
    id: "2026-04-combate-bullying",
    title: "Dia Nacional de Combate ao Bullying e à Violência na Escola",
    startDate: "2026-04-07",
    category: "institutional",
  },
  {
    id: "2026-04-aproveitamento-estudos",
    title: "Prazo final para solicitação de aproveitamento de estudos",
    startDate: "2026-04-10",
    category: "milestone",
  },
  {
    id: "2026-04-sabado-caest",
    title: "Sábado letivo CAEST - Construindo Vínculos Estudante e Família",
    startDate: "2026-04-11",
    category: "institutional",
  },
  {
    id: "2026-04-jogos-18",
    title: "Jogos Escolares",
    startDate: "2026-04-18",
    category: "institutional",
  },
  {
    id: "2026-04-recesso-20",
    title: "Recesso",
    startDate: "2026-04-20",
    category: "recess",
  },
  {
    id: "2026-04-tiradentes",
    title: "Tiradentes (feriado nacional)",
    startDate: "2026-04-21",
    category: "holiday",
  },
  {
    id: "2026-04-jogos-25",
    title: "Jogos Escolares",
    startDate: "2026-04-25",
    category: "institutional",
  },
  {
    id: "2026-04-acompanhamento-caest",
    title: "Período de acompanhamento do ETIM pela CAEST (1º bimestre)",
    startDate: "2026-04-27",
    endDate: "2026-04-30",
    category: "institutional",
  },
  {
    id: "2026-05-dia-trabalhador",
    title: "Dia do Trabalhador (feriado nacional)",
    startDate: "2026-05-01",
    category: "holiday",
  },
  {
    id: "2026-05-inicio-segundo-bimestre",
    title: "Início do 2º bimestre",
    startDate: "2026-05-04",
    category: "milestone",
  },
  {
    id: "2026-05-jogos-09",
    title: "Jogos Escolares",
    startDate: "2026-05-09",
    category: "institutional",
  },
  {
    id: "2026-05-conselhos-primeiro-bimestre",
    title: "Conselhos de classe do 1º bimestre",
    startDate: "2026-05-11",
    endDate: "2026-05-15",
    category: "evaluation",
  },
  {
    id: "2026-05-jogos-16",
    title: "Jogos Escolares",
    startDate: "2026-05-16",
    category: "institutional",
  },
  {
    id: "2026-05-plantao-16",
    title: "Plantão Pedagógico do ETIM",
    startDate: "2026-05-16",
    category: "institutional",
  },
  {
    id: "2026-05-jogos-23",
    title: "Jogos Escolares",
    startDate: "2026-05-23",
    category: "institutional",
  },
  {
    id: "2026-05-plantao-23",
    title: "Plantão Pedagógico do ETIM",
    startDate: "2026-05-23",
    category: "institutional",
  },
  {
    id: "2026-05-jogos-30",
    title: "Jogos Escolares",
    startDate: "2026-05-30",
    category: "institutional",
  },
  {
    id: "2026-05-plantao-30",
    title: "Plantão Pedagógico do ETIM",
    startDate: "2026-05-30",
    category: "institutional",
  },
  {
    id: "2026-06-corpus-christi",
    title: "Corpus Christi (feriado nacional)",
    startDate: "2026-06-04",
    category: "holiday",
  },
  {
    id: "2026-06-recesso-05",
    title: "Recesso",
    startDate: "2026-06-05",
    category: "recess",
  },
  {
    id: "2026-06-sabado-meio-ambiente",
    title: "Sábado letivo relativo à Semana de Meio Ambiente",
    startDate: "2026-06-13",
    category: "institutional",
  },
  {
    id: "2026-06-recesso-sao-joao",
    title: "Recesso de São João",
    startDate: "2026-06-23",
    category: "recess",
  },
  {
    id: "2026-06-sao-joao",
    title: "São João",
    startDate: "2026-06-24",
    category: "holiday",
  },
  {
    id: "2026-07-termino-segundo-bimestre",
    title: "Término do 2º bimestre",
    startDate: "2026-07-06",
    category: "milestone",
  },
  {
    id: "2026-07-acompanhamento-caest",
    title: "Período de acompanhamento do ETIM pela CAEST (2º bimestre)",
    startDate: "2026-07-06",
    endDate: "2026-07-10",
    category: "institutional",
  },
  {
    id: "2026-07-inicio-terceiro-bimestre",
    title: "Início do 3º bimestre",
    startDate: "2026-07-07",
    category: "milestone",
  },
  {
    id: "2026-07-ferias",
    title: "Férias discentes e docentes",
    startDate: "2026-07-13",
    endDate: "2026-07-31",
    category: "recess",
  },
  {
    id: "2026-08-ferias",
    title: "Férias discentes e docentes",
    startDate: "2026-08-01",
    endDate: "2026-08-04",
    category: "recess",
  },
  {
    id: "2026-08-fundacao-paraiba",
    title: "Fundação da Paraíba (feriado estadual)",
    startDate: "2026-08-05",
    category: "holiday",
  },
  {
    id: "2026-08-conselhos-segundo-bimestre",
    title: "Conselhos de classe do 2º bimestre",
    startDate: "2026-08-10",
    endDate: "2026-08-14",
    category: "evaluation",
  },
  {
    id: "2026-09-independencia",
    title: "Independência do Brasil (feriado nacional)",
    startDate: "2026-09-07",
    category: "holiday",
  },
  {
    id: "2026-09-semana-diversidade",
    title: "Semana da Diversidade e Inclusão",
    startDate: "2026-09-21",
    endDate: "2026-09-26",
    category: "institutional",
  },
  {
    id: "2026-09-educacao-profissional",
    title: "Dia Nacional da Educação Profissional e Tecnológica",
    startDate: "2026-09-23",
    category: "institutional",
  },
  {
    id: "2026-09-sabado-inclusao",
    title: "Sábado letivo relativo à Semana da Inclusão",
    startDate: "2026-09-26",
    category: "institutional",
  },
  {
    id: "2026-09-acompanhamento-caest",
    title: "Período de acompanhamento do ETIM pela CAEST (3º bimestre)",
    startDate: "2026-09-28",
    endDate: "2026-09-30",
    category: "institutional",
  },
  {
    id: "2026-09-termino-terceiro-bimestre",
    title: "Término do 3º bimestre",
    startDate: "2026-09-29",
    category: "milestone",
  },
  {
    id: "2026-09-inicio-quarto-bimestre",
    title: "Início do 4º bimestre",
    startDate: "2026-09-30",
    category: "milestone",
  },
  {
    id: "2026-10-acompanhamento-caest",
    title: "Período de acompanhamento do ETIM pela CAEST (3º bimestre)",
    startDate: "2026-10-01",
    endDate: "2026-10-02",
    category: "institutional",
  },
  {
    id: "2026-10-pulsar",
    title: "Pulsar",
    startDate: "2026-10-06",
    endDate: "2026-10-09",
    category: "institutional",
  },
  {
    id: "2026-10-nossa-senhora",
    title: "Nossa Senhora Aparecida (feriado nacional)",
    startDate: "2026-10-12",
    category: "holiday",
  },
  {
    id: "2026-10-conselhos-terceiro-bimestre",
    title: "Conselhos de classe do 3º bimestre",
    startDate: "2026-10-13",
    endDate: "2026-10-16",
    category: "evaluation",
  },
  {
    id: "2026-10-sabado-pulsar",
    title: "Sábado letivo relativo ao Pulsar",
    startDate: "2026-10-17",
    category: "institutional",
  },
  {
    id: "2026-10-aniversario-ifpb",
    title: "Aniversário do IFPB",
    startDate: "2026-10-23",
    category: "institutional",
  },
  {
    id: "2026-10-educacao-profissional",
    title: "Dia Nacional da Educação Profissional e Tecnológica",
    startDate: "2026-10-23",
    category: "institutional",
  },
  {
    id: "2026-10-semana-diversidade",
    title: "Semana de Diversidade e Inclusão",
    startDate: "2026-10-23",
    endDate: "2026-10-27",
    category: "institutional",
  },
  {
    id: "2026-10-servidor-publico",
    title: "Dia do Servidor Público",
    startDate: "2026-10-28",
    category: "holiday",
  },
  {
    id: "2026-11-finados",
    title: "Finados (feriado nacional)",
    startDate: "2026-11-02",
    category: "holiday",
  },
  {
    id: "2026-11-sabado-consciencia-14",
    title: "Sábado letivo referente ao Dia Nacional da Consciência Negra",
    startDate: "2026-11-14",
    category: "institutional",
  },
  {
    id: "2026-11-proclamacao-republica",
    title: "Proclamação da República (feriado nacional)",
    startDate: "2026-11-15",
    category: "holiday",
  },
  {
    id: "2026-11-consciencia-negra",
    title: "Dia Nacional da Consciência Negra e de Zumbi dos Palmares",
    startDate: "2026-11-20",
    category: "holiday",
  },
  {
    id: "2026-11-acompanhamento-caest",
    title: "Período de acompanhamento do ETIM pela CAEST (4º bimestre)",
    startDate: "2026-11-23",
    endDate: "2026-11-27",
    category: "institutional",
  },
  {
    id: "2026-11-sabado-consciencia-28",
    title: "Sábado letivo referente ao Dia Nacional da Consciência Negra",
    startDate: "2026-11-28",
    category: "institutional",
  },
  {
    id: "2026-12-termino-quarto-bimestre",
    title: "Término do 4º bimestre",
    startDate: "2026-12-07",
    category: "milestone",
  },
  {
    id: "2026-12-imaculada-conceicao",
    title: "Imaculada Conceição (feriado municipal)",
    startDate: "2026-12-08",
    category: "holiday",
  },
  {
    id: "2026-12-conselhos-quarto-bimestre",
    title: "Conselhos de classe do 4º bimestre",
    startDate: "2026-12-09",
    endDate: "2026-12-11",
    category: "evaluation",
  },
  {
    id: "2026-12-exames-finais",
    title: "Exames finais",
    startDate: "2026-12-14",
    endDate: "2026-12-16",
    category: "evaluation",
  },
  {
    id: "2026-12-conselhos-finais",
    title: "Conselhos de classe finais",
    startDate: "2026-12-17",
    endDate: "2026-12-18",
    category: "evaluation",
  },
  {
    id: "2026-12-registro-notas",
    title: "Prazo final para o registro de notas",
    startDate: "2026-12-21",
    category: "milestone",
  },
  {
    id: "2026-12-ferias",
    title: "Férias discentes e docentes",
    startDate: "2026-12-22",
    endDate: "2026-12-31",
    category: "recess",
  },
  {
    id: "2026-12-natal",
    title: "Natal (feriado nacional)",
    startDate: "2026-12-25",
    category: "holiday",
  },
  {
    id: "2027-01-confraternizacao",
    title: "Confraternização Universal (feriado nacional)",
    startDate: "2027-01-01",
    category: "holiday",
  },
  {
    id: "2027-01-ferias",
    title: "Férias discentes e docentes",
    startDate: "2027-01-04",
    endDate: "2027-01-31",
    category: "recess",
  },
  {
    id: "2027-02-semana-dialogos",
    title: "Semana de Diálogos 2026",
    startDate: "2027-02-01",
    endDate: "2027-02-05",
    category: "institutional",
  },
  {
    id: "2027-02-recesso-carnaval",
    title: "Recesso de Carnaval",
    startDate: "2027-02-08",
    endDate: "2027-02-10",
    dateLabel: "8 e 10 fev.",
    category: "recess",
  },
  {
    id: "2027-02-carnaval",
    title: "Carnaval (ponto facultativo)",
    startDate: "2027-02-09",
    category: "holiday",
  },
  {
    id: "2027-02-inicio-semestre",
    title: "Início do semestre letivo 2027.1",
    startDate: "2027-02-11",
    category: "milestone",
  },
  {
    id: "2027-03-paixao-cristo",
    title: "Paixão de Cristo (feriado nacional)",
    startDate: "2027-03-26",
    category: "holiday",
  },
  {
    id: "2027-03-pascoa",
    title: "Páscoa",
    startDate: "2027-03-28",
    category: "holiday",
  },
  {
    id: "2027-04-tiradentes",
    title: "Tiradentes (feriado nacional)",
    startDate: "2027-04-21",
    category: "holiday",
  },
];

export function getAcademicCalendarTodayKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getUpcomingAcademicCalendarEvents(today = getAcademicCalendarTodayKey()) {
  return academicCalendarEvents.filter((event) => (event.endDate ?? event.startDate) >= today);
}
