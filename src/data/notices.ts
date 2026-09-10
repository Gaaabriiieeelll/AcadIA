import "server-only";

import { db } from "@/lib/db";
import type {
  NoticeChecklistStateDTO,
  NoticeDTO,
  NoticeScheduleItemDTO,
  NoticeStatus,
} from "@/types/notices";

import { requireCurrentIdentity } from "./current-user";

type NoticeStatusDetails = Pick<
  NoticeDTO,
  "status" | "statusLabel" | "statusDetail" | "statusDate"
>;

type NoticeDefinition = Omit<
  NoticeDTO,
  "status" | "statusLabel" | "statusDetail" | "statusDate" | "schedule"
> & {
  resolveStatus: (today: string) => NoticeStatusDetails;
  schedule: Array<Omit<NoticeScheduleItemDTO, "highlighted">>;
};

const OFFICIAL_NOTICES_URL = "https://www.ifpb.edu.br/campus/joaopessoa/editais";

function resolveIvsStatus(today: string): NoticeStatusDetails {
  if (today <= "2026-08-23") {
    return {
      status: "open",
      statusLabel: "Inscrições abertas",
      statusDetail: "Envie a solicitação e todos os documentos pelo SUAP.",
      statusDate: "2026-08-23",
    };
  }
  if (today <= "2026-09-04") {
    return {
      status: "review",
      statusLabel: "Em análise",
      statusDetail: "A CAEST está analisando as solicitações enviadas.",
      statusDate: "2026-09-08",
    };
  }
  if (today <= "2026-09-11") {
    return {
      status: "action",
      statusLabel: "Acompanhe a entrevista",
      statusDetail: "Confira o cronograma e compareça se houver convocação.",
      statusDate: "2026-09-11",
    };
  }
  if (today < "2026-09-14") {
    return {
      status: "review",
      statusLabel: "Aguardando resultado",
      statusDetail: "O resultado preliminar está previsto para 14 de setembro.",
      statusDate: "2026-09-14",
    };
  }
  if (today <= "2026-09-17") {
    return {
      status: "action",
      statusLabel: "Resultado e recursos",
      statusDetail: "Confira o resultado preliminar e, se necessário, recorra pelo SUAP.",
      statusDate: "2026-09-17",
    };
  }
  if (today < "2026-09-23") {
    return {
      status: "review",
      statusLabel: "Recursos em análise",
      statusDetail: "O resultado final está previsto para 23 de setembro.",
      statusDate: "2026-09-23",
    };
  }
  return {
    status: "result",
    statusLabel: "Resultado final previsto",
    statusDetail: "Consulte o resultado oficial e confirme a situação do seu IVS no SUAP.",
    statusDate: "2026-09-23",
  };
}

function resolveFoodStatus(today: string): NoticeStatusDetails {
  if (today <= "2026-08-20") {
    return {
      status: "open",
      statusLabel: "Inscrições abertas",
      statusDetail: "Escolha almoço ou jantar e finalize a inscrição pelo SUAP.",
      statusDate: "2026-08-20",
    };
  }
  if (today <= "2026-08-26") {
    return {
      status: "action",
      statusLabel: "Resultado e recursos",
      statusDetail: "Confira o resultado preliminar e recorra pelo SUAP, se necessário.",
      statusDate: "2026-08-26",
    };
  }
  if (today < "2026-09-01") {
    return {
      status: "result",
      statusLabel: "Resultado final publicado",
      statusDetail: "Consulte a lista oficial antes do início do atendimento.",
      statusDate: "2026-08-28",
    };
  }
  if (today <= "2026-12-31") {
    return {
      status: "active",
      statusLabel: "Programa em vigência",
      statusDetail: "O atendimento ocorre no Restaurante Estudantil até dezembro de 2026.",
      statusDate: "2026-12-31",
    };
  }
  return {
    status: "closed",
    statusLabel: "Encerrado",
    statusDetail: "A vigência indicada no edital terminou em dezembro de 2026.",
    statusDate: null,
  };
}

function resolvePapeStatus(today: string): NoticeStatusDetails {
  if (today <= "2026-08-23") {
    return {
      status: "open",
      statusLabel: "Inscrições abertas",
      statusDetail: "Inscreva-se no PAPE pelo SUAP usando seu IVS válido.",
      statusDate: "2026-08-23",
    };
  }
  if (today <= "2026-08-27") {
    return {
      status: "action",
      statusLabel: "Resultado e recursos",
      statusDetail: "Confira o resultado preliminar e recorra pelo SUAP, se necessário.",
      statusDate: "2026-08-27",
    };
  }
  if (today < "2026-08-31") {
    return {
      status: "review",
      statusLabel: "Resultado final em 31 ago",
      statusDetail: "A análise dos recursos foi concluída; acompanhe a publicação oficial.",
      statusDate: "2026-08-31",
    };
  }
  if (today <= "2026-09-08") {
    return {
      status: "action",
      statusLabel: "Cadastre sua conta",
      statusDetail: "Se você foi classificado, confirme uma conta bancária de sua titularidade no SUAP.",
      statusDate: "2026-09-08",
    };
  }
  if (today <= "2026-12-31") {
    return {
      status: "active",
      statusLabel: "Programa em vigência",
      statusDetail: "O auxílio previsto neste edital segue até dezembro de 2026.",
      statusDate: "2026-12-31",
    };
  }
  return {
    status: "closed",
    statusLabel: "Encerrado",
    statusDetail: "A vigência indicada no edital terminou em dezembro de 2026.",
    statusDate: null,
  };
}

function resolveInnovationStatus(today: string): NoticeStatusDetails {
  if (today <= "2026-08-31") {
    return {
      status: "open",
      statusLabel: "Propostas até 31 ago",
      statusDetail: "A submissão agora é feita por servidor coordenador; a seleção discente vem depois.",
      statusDate: "2026-08-31",
    };
  }
  if (today <= "2026-09-10") {
    return {
      status: "review",
      statusLabel: "Propostas em avaliação",
      statusDetail: "Acompanhe o resultado final dos projetos em 10 de setembro.",
      statusDate: "2026-09-10",
    };
  }
  if (today <= "2026-09-16") {
    return {
      status: "action",
      statusLabel: "Seleção de bolsistas",
      statusDetail: "Os projetos aprovados selecionam estudantes entre 11 e 16 de setembro.",
      statusDate: "2026-09-16",
    };
  }
  if (today <= "2027-01-29") {
    return {
      status: "active",
      statusLabel: "Projetos em execução",
      statusDetail: "As atividades dos projetos selecionados seguem até janeiro de 2027.",
      statusDate: "2027-01-29",
    };
  }
  return {
    status: "closed",
    statusLabel: "Encerrado",
    statusDetail: "O período de atividades deste edital foi concluído.",
    statusDate: null,
  };
}

const noticeDefinitions: NoticeDefinition[] = [
  {
    id: "edital-33-2026-inovacao",
    number: "Edital 33/2026",
    title: "Pesquisa e Inovação Aplicada",
    category: "research",
    summary: "Seleciona seis projetos de inovação do Campus João Pessoa. Servidores submetem as propostas e os projetos aprovados realizam depois uma seleção simplificada de estudantes bolsistas.",
    audience: "Estudantes dos cursos superiores, técnicos integrados, técnicos subsequentes ou FIC do Campus João Pessoa podem participar da seleção de bolsistas dos projetos aprovados.",
    benefit: "Bolsa por cinco meses: R$ 700 mensais para um estudante de curso superior ou duas bolsas de R$ 300 mensais para estudantes de cursos técnicos/FIC, conforme a composição de cada projeto.",
    eligibility: [
      "Estar regularmente matriculado no Campus João Pessoa.",
      "Ser indicado ou participar da seleção simplificada do projeto aprovado.",
      "Ter disponibilidade para as atividades propostas.",
      "Para receber bolsa, não possuir emprego nem outra bolsa de monitoria, pesquisa ou extensão de mesma natureza durante a vigência.",
    ],
    documents: [
      "Currículo Lattes cadastrado e atualizado.",
      "Carta de motivação ou informações para entrevista técnica, caso o projeto use esses instrumentos.",
      "Documentos adicionais que forem definidos na seleção simplificada de cada projeto.",
    ],
    steps: [
      "Acompanhe o resultado final dos projetos no portal oficial.",
      "Entre 11 e 16 de setembro, procure as seleções divulgadas pelos projetos aprovados.",
      "Leia o instrumento específico da seleção e envie o que for solicitado.",
      "Se for escolhido, aceite a participação no módulo Pesquisa do SUAP.",
    ],
    schedule: [
      { label: "Inscrições das propostas", dateLabel: "26 a 31 de agosto", startDate: "2026-08-26", endDate: "2026-08-31" },
      { label: "Resultado final dos projetos", dateLabel: "10 de setembro", startDate: "2026-09-10" },
      { label: "Seleção de estudantes bolsistas", dateLabel: "11 a 16 de setembro", startDate: "2026-09-11", endDate: "2026-09-16" },
      { label: "Início das atividades", dateLabel: "18 de setembro", startDate: "2026-09-18" },
      { label: "Fim das atividades", dateLabel: "29 de janeiro de 2027", startDate: "2027-01-29" },
    ],
    checklist: [
      { id: "atualizar-lattes", label: "Atualizei meu currículo Lattes" },
      { id: "acompanhar-projetos", label: "Vou conferir quais projetos foram aprovados em 10/09" },
      { id: "buscar-selecao", label: "Verifiquei as seleções de bolsistas entre 11 e 16/09" },
      { id: "revisar-disponibilidade", label: "Confirmei minha disponibilidade e compatibilidade de bolsas" },
    ],
    caution: "O estudante não submete a proposta principal deste edital. A entrada como bolsista ocorre na seleção simplificada conduzida por um projeto aprovado.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/edital-n-o-33-2026-direcao-geral",
    publishedAt: "2026-08-24",
    verifiedAt: "2026-08-30",
    resolveStatus: resolveInnovationStatus,
  },
  {
    id: "edital-28-2026-pape",
    number: "Edital 28/2026",
    title: "Programa de Apoio à Permanência do Estudante - PAPE",
    category: "assistance",
    summary: "Oferece auxílio financeiro para apoiar despesas de permanência, como transporte, moradia, alimentação e material didático-pedagógico.",
    audience: "Estudantes regularmente matriculados em curso técnico presencial integrado, técnico subsequente ou graduação do Campus João Pessoa.",
    benefit: "120 vagas, com auxílios mensais de R$ 500, R$ 300 ou R$ 200, classificados pelo IVS, para a vigência de agosto a dezembro de 2026.",
    eligibility: [
      "Ter matrícula regular em curso presencial do Campus João Pessoa.",
      "Possuir renda familiar per capita de até um salário mínimo.",
      "Ter IVS válido no momento da inscrição.",
      "Não possuir pendência de prestação de contas em auxílio anterior.",
    ],
    documents: [
      "Conta bancária de titularidade do estudante, a confirmar no SUAP após a classificação.",
      "Laudo médico com as informações exigidas, para quem concorreu às vagas reservadas a pessoas com deficiência.",
      "Declaração do coordenador/orientador para estudante em situação de matrícula vínculo.",
    ],
    steps: [
      "Consulte o resultado final na página oficial.",
      "Se classificado, confirme ou atualize no SUAP uma conta bancária em seu nome entre 1º e 8 de setembro.",
      "Anexe laudo ou declaração específica no prazo indicado, se essa exigência se aplicar a você.",
      "Acompanhe as notificações e mantenha matrícula regular e frequência mínima de 75%.",
    ],
    schedule: [
      { label: "Inscrições", dateLabel: "12 a 23 de agosto", startDate: "2026-08-12", endDate: "2026-08-23" },
      { label: "Resultado preliminar", dateLabel: "25 de agosto", startDate: "2026-08-25" },
      { label: "Recursos", dateLabel: "26 e 27 de agosto", startDate: "2026-08-26", endDate: "2026-08-27" },
      { label: "Resultado final", dateLabel: "31 de agosto", startDate: "2026-08-31" },
      { label: "Cadastro da conta no SUAP", dateLabel: "1º a 8 de setembro", startDate: "2026-09-01", endDate: "2026-09-08" },
    ],
    checklist: [
      { id: "conferir-resultado", label: "Conferi o resultado final oficial" },
      { id: "preparar-conta", label: "Tenho uma conta bancária em meu nome" },
      { id: "atualizar-conta-suap", label: "Confirmei ou atualizei os dados bancários no SUAP" },
      { id: "documento-especifico", label: "Enviei laudo ou declaração de matrícula vínculo, se aplicável" },
    ],
    caution: "O AcadIA explica o processo, mas não calcula classificação nem confirma direito ao auxílio. A decisão válida é a publicada pelo IFPB.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/edital-n-o-28-2026-direcao-geral",
    publishedAt: "2026-08-11",
    verifiedAt: "2026-08-30",
    resolveStatus: resolvePapeStatus,
  },
  {
    id: "edital-26-2026-ivs",
    number: "Edital 26/2026",
    title: "Análise do Índice de Vulnerabilidade Social - IVS",
    category: "assistance",
    summary: "Analisa as condições socioeconômicas do estudante e gera a pontuação de IVS usada como critério em programas da Assistência Estudantil.",
    audience: "Qualquer estudante regularmente matriculado em curso presencial integrado, subsequente ou de graduação do Campus João Pessoa.",
    benefit: "O IVS deferido fica vinculado ao CPF, tem validade de dois anos e permite participar de seleções da Política de Assistência Estudantil que usam esse índice.",
    eligibility: [
      "Estar regularmente matriculado em curso presencial do Campus João Pessoa.",
      "Enviar a solicitação pelo SUAP dentro do período do edital.",
      "Apresentar documentos legíveis, completos e atualizados para o estudante e o grupo familiar.",
    ],
    documents: [
      "Comprovante de residência do grupo familiar de um dos três meses anteriores ao edital.",
      "Documentos de identificação de todas as pessoas do grupo familiar.",
      "CTPS Digital completa e atualizada, ou declaração negativa, para pessoas maiores de 18 anos.",
      "Comprovante de renda de cada adulto ou jovem aprendiz, conforme a situação de trabalho.",
      "Declarações e comprovantes específicos de moradia, transporte, saúde ou outras condições informadas.",
    ],
    steps: [
      "Acompanhe a análise e a publicação do cronograma de entrevistas.",
      "Compareça à entrevista e apresente informações adicionais, se for convocado.",
      "Confira o resultado preliminar em 14 de setembro.",
      "Se houver erro, apresente recurso fundamentado pelo SUAP entre 15 e 17 de setembro.",
      "Consulte o resultado final em 23 de setembro.",
    ],
    schedule: [
      { label: "Análise da documentação", dateLabel: "24 de agosto a 4 de setembro", startDate: "2026-08-24", endDate: "2026-09-04" },
      { label: "Cronograma e local das entrevistas", dateLabel: "8 de setembro", startDate: "2026-09-08" },
      { label: "Entrevistas", dateLabel: "9 a 11 de setembro", startDate: "2026-09-09", endDate: "2026-09-11" },
      { label: "Resultado preliminar", dateLabel: "14 de setembro", startDate: "2026-09-14" },
      { label: "Recursos", dateLabel: "15 a 17 de setembro", startDate: "2026-09-15", endDate: "2026-09-17" },
      { label: "Resultado final", dateLabel: "23 de setembro", startDate: "2026-09-23" },
    ],
    checklist: [
      { id: "acompanhar-entrevista", label: "Vou conferir o cronograma de entrevistas em 08/09" },
      { id: "guardar-documentos", label: "Mantive os documentos originais organizados" },
      { id: "conferir-preliminar", label: "Conferi o resultado preliminar" },
      { id: "avaliar-recurso", label: "Avaliei se preciso apresentar recurso pelo SUAP" },
      { id: "conferir-final", label: "Conferi o resultado final e a validade do IVS" },
    ],
    caution: "A lista completa varia conforme a composição e a renda familiar. Consulte os quadros de documentos e anexos do edital oficial antes de enviar ou complementar informações.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/edital-n-o-26-2026-direcao-geral",
    publishedAt: "2026-08-06",
    verifiedAt: "2026-08-30",
    resolveStatus: resolveIvsStatus,
  },
  {
    id: "edital-27-2026-alimentacao",
    number: "Edital 27/2026",
    title: "Programa de Alimentação",
    category: "assistance",
    summary: "Oferece acesso gratuito a almoço ou jantar no Restaurante Estudantil, conforme a modalidade escolhida na inscrição.",
    audience: "Estudantes regularmente matriculados em curso técnico presencial integrado, técnico subsequente ou graduação do Campus João Pessoa, com IVS válido.",
    benefit: "800 refeições por dia, sendo 600 almoços e 200 jantares, de setembro a dezembro de 2026.",
    eligibility: [
      "Ter matrícula regular em curso presencial do Campus João Pessoa.",
      "Possuir IVS válido verificado automaticamente pelo SUAP.",
      "Ter escolhido almoço ou jantar no momento da inscrição.",
    ],
    documents: [
      "Laudo médico com as informações exigidas, para inscrição nas vagas reservadas a pessoas com deficiência.",
      "Declaração do coordenador/orientador para estudante em situação de matrícula vínculo.",
      "Não há uma lista geral de documentos para ampla concorrência além dos dados verificados no SUAP.",
    ],
    steps: [
      "Consulte o resultado final publicado na página oficial.",
      "Se contemplado, acompanhe as orientações para acesso ao Restaurante Estudantil por QR Code.",
      "Use somente a refeição escolhida na inscrição; o edital não permite trocar depois entre almoço e jantar.",
      "Mantenha matrícula, frequência acadêmica mínima de 75% e acompanhe eventuais convocações.",
    ],
    schedule: [
      { label: "Resultado final", dateLabel: "28 de agosto", startDate: "2026-08-28" },
      { label: "Atendimento no restaurante", dateLabel: "Setembro a dezembro de 2026", startDate: "2026-09-01", endDate: "2026-12-31" },
    ],
    checklist: [
      { id: "conferir-resultado", label: "Conferi meu nome no resultado final" },
      { id: "confirmar-refeicao", label: "Confirmei se minha modalidade é almoço ou jantar" },
      { id: "acompanhar-qrcode", label: "Acompanhei as orientações de acesso por QR Code" },
      { id: "documento-especifico", label: "Enviei laudo ou declaração de matrícula vínculo, se aplicável" },
    ],
    caution: "As refeições são disponibilizadas por ordem de chegada e dentro do limite diário. Consulte o resultado e as orientações oficiais do campus.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/copy_of_edital-n-o-26-2026-direcao-geral",
    publishedAt: "2026-08-10",
    verifiedAt: "2026-08-30",
    resolveStatus: resolveFoodStatus,
  },
];

function todayInSaoPaulo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function decorateSchedule(
  schedule: NoticeDefinition["schedule"],
  today: string,
): NoticeScheduleItemDTO[] {
  const activeIndex = schedule.findIndex((item) =>
    today >= item.startDate && today <= (item.endDate ?? item.startDate));
  const nextIndex = activeIndex >= 0
    ? activeIndex
    : schedule.findIndex((item) => item.startDate >= today);

  return schedule.map((item, index) => ({
    ...item,
    highlighted: index === nextIndex,
  }));
}

const statusPriority: Record<NoticeStatus, number> = {
  open: 0,
  action: 1,
  review: 2,
  result: 3,
  active: 4,
  closed: 5,
};

export function getOfficialNotices(now = new Date()): NoticeDTO[] {
  const today = todayInSaoPaulo(now);

  return noticeDefinitions
    .map(({ resolveStatus, schedule, ...notice }) => ({
      ...notice,
      ...resolveStatus(today),
      schedule: decorateSchedule(schedule, today),
    }))
    .sort((a, b) => {
      const byStatus = statusPriority[a.status] - statusPriority[b.status];
      if (byStatus !== 0) return byStatus;
      return (a.statusDate ?? "9999-12-31").localeCompare(b.statusDate ?? "9999-12-31");
    });
}

export function isKnownNoticeChecklistItem(noticeKey: string, itemKey: string) {
  return noticeDefinitions.some((notice) =>
    notice.id === noticeKey && notice.checklist.some((item) => item.id === itemKey));
}

async function requireNoticeUser() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true },
  });

  if (!user) throw new Error("Usuário autenticado não encontrado.");
  return user;
}

export async function getCurrentNoticeChecklistState(): Promise<NoticeChecklistStateDTO> {
  const user = await requireNoticeUser();
  const records = await db.noticeChecklistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { noticeKey: true, itemKey: true },
  });

  return records.reduce<NoticeChecklistStateDTO>((state, record) => {
    const items = state[record.noticeKey] ?? [];
    items.push(record.itemKey);
    state[record.noticeKey] = items;
    return state;
  }, {});
}

export async function setCurrentNoticeChecklistItem(
  noticeKey: string,
  itemKey: string,
  completed: boolean,
) {
  if (!isKnownNoticeChecklistItem(noticeKey, itemKey)) {
    throw new Error("Item de checklist inválido.");
  }

  const user = await requireNoticeUser();
  const key = { userId_noticeKey_itemKey: { userId: user.id, noticeKey, itemKey } };

  if (completed) {
    await db.noticeChecklistItem.upsert({
      where: key,
      create: { userId: user.id, noticeKey, itemKey },
      update: { completedAt: new Date() },
      select: { id: true },
    });
    return;
  }

  await db.noticeChecklistItem.deleteMany({
    where: { userId: user.id, noticeKey, itemKey },
  });
}

export { OFFICIAL_NOTICES_URL };
