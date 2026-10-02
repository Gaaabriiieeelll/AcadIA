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
  if (today < "2026-09-24") {
    return {
      status: "review",
      statusLabel: "Recursos em análise",
      statusDetail: "Acompanhe a publicação do resultado final na página oficial.",
      statusDate: "2026-09-24",
    };
  }
  return {
    status: "result",
    statusLabel: "Resultado final publicado",
    statusDetail: "O resultado final foi publicado em 24 de setembro. Confira a situação do seu IVS na página oficial e no SUAP.",
    statusDate: "2026-09-24",
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
  if (today < "2026-09-01") {
    return {
      status: "review",
      statusLabel: "Aguardando resultado final",
      statusDetail: "Acompanhe a publicação oficial após a análise dos recursos.",
      statusDate: "2026-09-01",
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
      statusDetail: "Acompanhe a publicação do resultado final dos projetos.",
      statusDate: "2026-09-11",
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

function resolvePape41Status(today: string): NoticeStatusDetails {
  if (today <= "2026-10-08") return {
    status: "open", statusLabel: "Inscrições abertas",
    statusDetail: "Inscreva-se no PAPE IV pelo SUAP até 8 de outubro.", statusDate: "2026-10-08",
  };
  if (today < "2026-10-13") return {
    status: "review", statusLabel: "Em análise",
    statusDetail: "O resultado preliminar está previsto para 13 de outubro.", statusDate: "2026-10-13",
  };
  if (today <= "2026-10-15") return {
    status: "action", statusLabel: "Resultado e recursos",
    statusDetail: "Confira o resultado preliminar e recorra pelo SUAP, se necessário.", statusDate: "2026-10-15",
  };
  if (today < "2026-10-19") return {
    status: "review", statusLabel: "Aguardando resultado final",
    statusDetail: "A publicação do resultado final está prevista para 19 de outubro.", statusDate: "2026-10-19",
  };
  if (today <= "2026-10-25") return {
    status: "action", statusLabel: "Cadastre sua conta",
    statusDetail: "Se classificado, atualize os dados bancários no SUAP até 25 de outubro.", statusDate: "2026-10-25",
  };
  if (today <= "2026-12-31") return {
    status: "active", statusLabel: "Programa em vigência",
    statusDetail: "O auxílio previsto abrange outubro a dezembro de 2026.", statusDate: "2026-12-31",
  };
  return { status: "closed", statusLabel: "Encerrado", statusDetail: "A vigência prevista terminou.", statusDate: null };
}

function resolveEventSupport24Status(today: string): NoticeStatusDetails {
  if (today <= "2026-11-30") return {
    status: "open", statusLabel: "Solicitações em andamento",
    statusDetail: "Solicite pelo SUAP até 30 de novembro e com pelo menos 30 dias de antecedência do evento.",
    statusDate: "2026-11-30",
  };
  if (today <= "2026-12-31") return {
    status: "active", statusLabel: "Eventos em andamento",
    statusDetail: "Acompanhe a participação e a prestação de contas no edital oficial.",
    statusDate: "2026-12-31",
  };
  return { status: "closed", statusLabel: "Encerrado", statusDetail: "O período previsto terminou.", statusDate: null };
}

function resolveHuaweiStatus(today: string): NoticeStatusDetails {
  if (today <= "2026-10-02") return {
    status: "open", statusLabel: "Inscrições até 2 de outubro",
    statusDetail: "Envie a inscrição até 23h59 de 2 de outubro pelo formulário indicado no edital.", statusDate: "2026-10-02",
  };
  if (today < "2026-10-21") return {
    status: "review", statusLabel: "Primeira etapa",
    statusDetail: "Acompanhe a homologação e as avaliações remotas da primeira etapa.", statusDate: "2026-10-21",
  };
  if (today <= "2026-10-22") return {
    status: "action", statusLabel: "Resultado e recurso",
    statusDetail: "Confira o resultado preliminar da primeira etapa e recorra em 22 de outubro, se necessário.", statusDate: "2026-10-22",
  };
  if (today <= "2026-11-04") return {
    status: "action", statusLabel: "Etapa presencial",
    statusDetail: "Confira o resultado final da primeira etapa e prepare-se para a avaliação presencial em Esperança.", statusDate: "2026-11-04",
  };
  return { status: "result", statusLabel: "Resultado previsto", statusDetail: "Consulte o resultado oficial da seleção.", statusDate: null };
}

function resolveScienceFairStatus(today: string): NoticeStatusDetails {
  if (today <= "2026-09-30") return {
    status: "open", statusLabel: "Inscrições abertas",
    statusDetail: "Equipes do ensino técnico integrado podem submeter projetos até 30 de setembro.", statusDate: "2026-09-30",
  };
  if (today < "2026-10-03") return {
    status: "review", statusLabel: "Aguardando lista",
    statusDetail: "A lista de inscrições está prevista para 3 de outubro.", statusDate: "2026-10-03",
  };
  if (today <= "2026-10-04") return {
    status: "action", statusLabel: "Lista e recursos",
    statusDetail: "Confira a lista; o prazo para recurso é 4 de outubro.", statusDate: "2026-10-04",
  };
  if (today <= "2026-10-14") return {
    status: "active", statusLabel: "Preparação dos projetos",
    statusDetail: "Equipes selecionadas elaboram os projetos de 6 a 14 de outubro.", statusDate: "2026-10-14",
  };
  if (today <= "2026-10-17") return {
    status: "active", statusLabel: "Feira em andamento",
    statusDetail: "As apresentações ocorrem em 16 e 17 de outubro.", statusDate: "2026-10-17",
  };
  return { status: "closed", statusLabel: "Encerrado", statusDetail: "A feira foi prevista para 16 e 17 de outubro.", statusDate: null };
}

function resolvePulsarMonitorsStatus(today: string): NoticeStatusDetails {
  if (today <= "2026-09-20") return {
    status: "open", statusLabel: "Inscrições abertas",
    statusDetail: "Estudantes de qualquer curso do campus podem se inscrever.", statusDate: "2026-09-20",
  };
  if (today <= "2026-10-13") return {
    status: "result", statusLabel: "Resultado preliminar publicado",
    statusDetail: "Confira a classificação e as próximas orientações na página oficial do edital.", statusDate: null,
  };
  if (today <= "2026-10-17") return {
    status: "active", statusLabel: "PULSAR em andamento",
    statusDetail: "Monitores selecionados atuam durante o PULSAR 2026.", statusDate: "2026-10-17",
  };
  return { status: "closed", statusLabel: "Encerrado", statusDetail: "O PULSAR foi previsto para 14 a 17 de outubro.", statusDate: null };
}

const noticeDefinitions: NoticeDefinition[] = [
  {
    id: "edital-10-2026-huawei-ict",
    number: "Edital Conjunto 10/2026",
    title: "Seleção interna para a Huawei ICT Competition",
    category: "opportunity",
    summary: "Seleciona estudantes do IFPB e do IFSertãoPB para quatro trilhas de tecnologia: Innovation, Cloud, Network e Computing.",
    audience: "Estudantes regularmente matriculados no IFPB ou IFSertãoPB, de cursos presenciais ou a distância, que atendam aos requisitos do edital.",
    benefit: "Doze estudantes seguem para até nove meses de preparação; a bolsa prevista é de R$ 300 mensais para ensino técnico e R$ 700 para ensino superior ou pós-graduação.",
    eligibility: [
      "Ter 18 anos ou completar 18 até 31 de janeiro de 2027.",
      "Ter disponibilidade de oito horas semanais, domínio de inglês comprovado e disponibilidade para viagens.",
      "A trilha Computing aceita apenas inscrições de estudantes do gênero feminino.",
    ],
    documents: [
      "Declaração de matrícula extraída do SUAP.",
      "Certificado de proficiência em inglês, que pode ser apresentado até o fim da avaliação final da primeira etapa.",
    ],
    steps: [
      "Escolha uma trilha e preencha o formulário indicado no edital até 23h59 de 2 de outubro.",
      "Confira a homologação das inscrições em 5 de outubro.",
      "Participe das avaliações remotas de 6 a 20 de outubro.",
      "Confira o resultado preliminar em 21 de outubro; se necessário, recorra em 22 de outubro.",
      "Se selecionado, participe da etapa presencial no Campus Esperança em 4 de novembro.",
    ],
    schedule: [
      { label: "Inscrições", dateLabel: "26 de setembro a 2 de outubro", startDate: "2026-09-26", endDate: "2026-10-02", calendar: true },
      { label: "Homologação das inscrições", dateLabel: "5 de outubro", startDate: "2026-10-05" },
      { label: "Primeira etapa remota", dateLabel: "6 a 20 de outubro", startDate: "2026-10-06", endDate: "2026-10-20", calendar: true },
      { label: "Resultado preliminar", dateLabel: "21 de outubro", startDate: "2026-10-21" },
      { label: "Recursos", dateLabel: "22 de outubro", startDate: "2026-10-22", calendar: true },
      { label: "Etapa presencial e resultado final", dateLabel: "4 de novembro", startDate: "2026-11-04", calendar: true },
    ],
    checklist: [
      { id: "confirmar-requisitos", label: "Confirmei idade, inglês e disponibilidade" },
      { id: "escolher-trilha", label: "Escolhi minha trilha de competição" },
      { id: "enviar-inscricao", label: "Enviei a inscrição e a declaração de matrícula" },
      { id: "acompanhar-etapas", label: "Acompanhei resultados e avaliações" },
    ],
    faqs: [
      { question: "Preciso apresentar o certificado de inglês no dia da inscrição?", answer: "O edital permite apresentá-lo até o último dia da avaliação final da primeira etapa. Confira também as instruções do formulário de inscrição." },
      { question: "Qualquer estudante pode escolher a trilha Computing?", answer: "Não. A trilha Computing recebe apenas inscrições de estudantes do gênero feminino; as demais trilhas seguem os requisitos gerais do edital." },
      { question: "A segunda etapa é feita pela internet?", answer: "Não. A primeira etapa é remota; a segunda está prevista para 4 de novembro de 2026, presencialmente no Campus Esperança." },
    ],
    caution: "Consulte o edital para regras completas, formulário de inscrição e atualizações. A seleção e a bolsa dependem do resultado oficial.",
    officialUrl: "https://www.ifpb.edu.br/noticias/2026/09/ifpb-e-ifsertaopb-abrem-selecao-interna-para-a-huawei-ict-competition",
    publishedAt: "2026-09-25",
    verifiedAt: "2026-10-02",
    resolveStatus: resolveHuaweiStatus,
  },
  {
    id: "edital-35-2026-feira-ciencias",
    number: "Edital 35/2026, retificado pelo 40/2026",
    title: "II Feira de Ciências do PULSAR 2026",
    category: "opportunity",
    summary: "Equipes de estudantes do ensino técnico integrado apresentam projetos autorais sobre mulheres na ciência e tecnologia.",
    audience: "Equipes de cinco estudantes dos cursos técnicos integrados ao ensino médio do Campus João Pessoa.",
    benefit: "Ajuda de custo de R$ 100 por grupo classificado, limitada a 30 grupos, conforme a retificação; há premiação nas categorias da feira.",
    eligibility: [
      "Formar equipe de cinco estudantes regularmente matriculados no ensino técnico integrado do campus.",
      "Cada estudante pode integrar somente uma equipe; o grupo deve indicar líder e vice-líder.",
      "Apresentar projeto autoral e inédito alinhado ao tema do evento.",
    ],
    documents: [
      "Dados do projeto, disciplinas e docentes responsáveis no formulário de inscrição.",
      "Nomes completos e matrículas dos integrantes da equipe.",
    ],
    steps: [
      "Confira a lista de inscrições em 3 de outubro e recorra em 4 de outubro, se necessário.",
      "Consulte o resultado final previsto para 5 de outubro.",
      "Elabore o projeto de 6 a 14 de outubro e prepare o estande em 15 de outubro.",
      "Apresente o projeto na feira em 16 e 17 de outubro.",
    ],
    schedule: [
      { label: "Lista de inscritos", dateLabel: "3 de outubro", startDate: "2026-10-03" },
      { label: "Recursos", dateLabel: "4 de outubro", startDate: "2026-10-04", calendar: true },
      { label: "Resultado final", dateLabel: "5 de outubro", startDate: "2026-10-05" },
      { label: "Elaboração dos projetos", dateLabel: "6 a 14 de outubro", startDate: "2026-10-06", endDate: "2026-10-14", calendar: true },
      { label: "Montagem dos estandes", dateLabel: "15 de outubro", startDate: "2026-10-15", calendar: true },
      { label: "II Feira de Ciências", dateLabel: "16 e 17 de outubro", startDate: "2026-10-16", endDate: "2026-10-17", calendar: true },
    ],
    checklist: [
      { id: "conferir-lista", label: "Conferi a lista de inscritos" },
      { id: "avaliar-recurso", label: "Avaliei se preciso apresentar recurso" },
      { id: "preparar-projeto", label: "Preparei o projeto e o painel explicativo" },
      { id: "organizar-estande", label: "Organizei a montagem e a apresentação" },
    ],
    faqs: [
      { question: "Posso inscrever um projeto sozinho?", answer: "Não. Cada equipe deve ter cinco estudantes dos cursos técnicos integrados ao ensino médio do Campus João Pessoa." },
      { question: "Qual é o valor da ajuda de custo para a equipe?", answer: "A retificação 40/2026 fixou R$ 100 por grupo classificado, com limite de 30 ajudas de custo, conforme a ordem de classificação." },
    ],
    caution: "As inscrições terminaram em 30 de setembro. Confira o edital, a retificação 40/2026 e as publicações da comissão antes de cada etapa.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/edital-n-o-35-2026-direcao-geral",
    publishedAt: "2026-09-02",
    verifiedAt: "2026-10-02",
    resolveStatus: resolveScienceFairStatus,
  },
  {
    id: "edital-36-2026-monitores-pulsar",
    number: "Edital 36/2026, retificado pelo 39/2026",
    title: "Monitoria do PULSAR 2026",
    category: "opportunity",
    summary: "Seleção de estudantes para apoiar a organização, a recepção e outras atividades do PULSAR 2026.",
    audience: "Estudantes regularmente matriculados em qualquer curso do Campus João Pessoa.",
    benefit: "Apoio de R$ 120 e certificado para selecionados que cumprirem pelo menos 12 horas presenciais, conforme as condições e a disponibilidade orçamentária.",
    eligibility: [
      "Ter matrícula regular em curso do campus.",
      "Cumprir reuniões, treinamento obrigatório e pelo menos 12 horas presenciais para certificação.",
    ],
    documents: [
      "Histórico escolar atualizado e declaração do curso em PDF, exigidos na inscrição encerrada.",
      "Documentos comprobatórios usados nos critérios de pontuação, quando aplicáveis.",
    ],
    steps: [
      "Confira o resultado preliminar e as atualizações na página oficial do edital.",
      "Se selecionado, acompanhe a convocação e confirme as datas de treinamento diretamente com a organização.",
      "Participe das atividades do PULSAR entre 14 e 17 de outubro.",
    ],
    schedule: [
      { label: "Resultado preliminar", dateLabel: "Publicado em 29 de setembro", startDate: "2026-09-29" },
      { label: "Atuação dos monitores no PULSAR", dateLabel: "14 a 17 de outubro", startDate: "2026-10-14", endDate: "2026-10-17", calendar: true },
    ],
    checklist: [
      { id: "conferir-resultado", label: "Conferi o resultado preliminar oficial" },
      { id: "confirmar-convocacao", label: "Confirmei convocação e treinamento com a organização" },
      { id: "planejar-turnos", label: "Planejei meus turnos no PULSAR" },
    ],
    faqs: [
      { question: "Ser monitor voluntário também dá direito a certificado?", answer: "Sim. O edital prevê certificado para monitores selecionados e voluntários que cumprirem pelo menos 12 horas presenciais e as reuniões e treinamentos obrigatórios." },
      { question: "O apoio de R$ 120 é pago a toda pessoa inscrita?", answer: "Não. Ele é destinado aos monitores selecionados que cumprirem pelo menos 12 horas presenciais, após comprovação, conforme a disponibilidade orçamentária." },
    ],
    caution: "As inscrições terminaram em 20 de setembro. A retificação e as publicações oficiais prevalecem; confirme a convocação e o treinamento com a organização.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/edital-n-o-36-2026-direcao-geral",
    publishedAt: "2026-09-10",
    verifiedAt: "2026-10-02",
    resolveStatus: resolvePulsarMonitorsStatus,
  },
  {
    id: "edital-41-2026-pape-iv",
    number: "Edital 41/2026",
    title: "Programa de Apoio à Permanência do Estudante — PAPE IV",
    category: "assistance",
    summary: "Nova seleção do PAPE para estudantes com IVS válido, com auxílio mensal para apoiar a permanência no curso.",
    audience: "Estudantes presenciais dos cursos técnicos integrados, subsequentes e de graduação do Campus João Pessoa.",
    benefit: "200 vagas com auxílios de R$ 200, R$ 300 ou R$ 500 por mês, de outubro a dezembro de 2026, conforme disponibilidade orçamentária.",
    eligibility: [
      "Estar regularmente matriculado em curso presencial do Campus João Pessoa.",
      "Ter renda familiar per capita de até um salário mínimo e IVS válido na inscrição.",
      "Não ter pendência de prestação de contas de auxílio anterior.",
    ],
    documents: [
      "Dados bancários de conta em nome do estudante classificado, para cadastro no SUAP.",
      "Laudo médico no SUAP para contemplados nas vagas reservadas a pessoas com deficiência, no prazo do edital.",
    ],
    steps: [
      "Inscreva-se no SUAP entre 1º e 8 de outubro e selecione a modalidade de concorrência.",
      "Confira o resultado preliminar em 13 de outubro e apresente recurso nos dias 14 ou 15, se necessário.",
      "Confira o resultado final previsto para 19 de outubro.",
      "Se classificado, cadastre ou atualize sua conta bancária no SUAP de 20 a 25 de outubro.",
    ],
    schedule: [
      { label: "Inscrições no SUAP", dateLabel: "1º a 8 de outubro", startDate: "2026-10-01", endDate: "2026-10-08", calendar: true },
      { label: "Resultado preliminar", dateLabel: "13 de outubro", startDate: "2026-10-13" },
      { label: "Recursos no SUAP", dateLabel: "14 e 15 de outubro", startDate: "2026-10-14", endDate: "2026-10-15", calendar: true },
      { label: "Resultado final previsto", dateLabel: "19 de outubro", startDate: "2026-10-19" },
      { label: "Cadastro de dados bancários", dateLabel: "20 a 25 de outubro", startDate: "2026-10-20", endDate: "2026-10-25", calendar: true },
    ],
    checklist: [
      { id: "confirmar-ivs", label: "Confirmei que meu IVS está válido" },
      { id: "inscrever-suap", label: "Fiz minha inscrição pelo SUAP" },
      { id: "conferir-resultado", label: "Conferi o resultado e avaliei se preciso recorrer" },
      { id: "cadastrar-conta", label: "Cadastrei meus dados bancários, se classificado" },
    ],
    faqs: [
      { question: "Posso me inscrever sem IVS válido?", answer: "Não. O SUAP verifica automaticamente se há IVS válido no momento da inscrição. Se não houver, procure o setor de assistência estudantil para saber como solicitar a análise." },
      { question: "Todos os estudantes classificados recebem o mesmo valor?", answer: "Não. O edital prevê faixas de R$ 500, R$ 300 e R$ 200 por mês, conforme o IVS e o número de vagas de cada faixa." },
      { question: "Existe lista de espera para quem ficar fora das vagas?", answer: "Não. O edital informa que estudantes fora do número de vagas precisam se inscrever em um próximo edital do PAPE." },
    ],
    caution: "A classificação depende do resultado oficial do IFPB. Consulte o edital e eventuais retificações antes de cada etapa.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/edital-n-o-41-2026-direcao-geral",
    publishedAt: "2026-09-28",
    verifiedAt: "2026-10-02",
    resolveStatus: resolvePape41Status,
  },
  {
    id: "edital-24-2026-eventos-discentes",
    number: "Edital 24/2026",
    title: "Apoio a estudantes para participação em eventos",
    category: "opportunity",
    summary: "Apoio financeiro para apresentar ou publicar trabalhos em eventos educacionais, científicos ou tecnológicos no segundo semestre de 2026.",
    audience: "Estudantes regularmente matriculados no Campus João Pessoa, inclusive de cursos técnicos, que atendam aos critérios do edital.",
    benefit: "Apoio parcial para despesas de inscrição, transporte, hospedagem e alimentação, sujeito à disponibilidade de recursos.",
    eligibility: [
      "Ter trabalho aceito para apresentação ou publicação em evento entre agosto e dezembro de 2026.",
      "Apresentar a solicitação pelo SUAP com no mínimo 30 dias de antecedência do evento.",
      "Cumprir os requisitos acadêmicos e não ter pendências institucionais descritos no edital.",
    ],
    documents: [
      "Comprovante de matrícula e informações do evento.",
      "Resumo ou texto do trabalho e carta de aceite da organização.",
      "Estimativa das despesas e documentos adicionais exigidos pelo edital, conforme o caso.",
    ],
    steps: [
      "Confira se o evento e seu trabalho atendem às regras do edital.",
      "Abra processo eletrônico no SUAP e anexe os documentos ao menos 30 dias antes do evento.",
      "Envie a solicitação até 30 de novembro de 2026, observado o prazo individual de antecedência.",
      "Se contemplado, apresente certificado e prestação de contas após o evento.",
    ],
    schedule: [
      { label: "Prazo final para solicitar apoio", dateLabel: "Até 30 de novembro; também 30 dias antes do evento", startDate: "2026-11-30", calendar: true },
      { label: "Eventos contemplados", dateLabel: "Agosto a dezembro de 2026", startDate: "2026-08-01", endDate: "2026-12-31" },
    ],
    checklist: [
      { id: "confirmar-evento", label: "Confirmei o aceite do trabalho e a data do evento" },
      { id: "reunir-documentos", label: "Separei comprovantes e estimativa de despesas" },
      { id: "solicitar-suap", label: "Abri o processo no SUAP no prazo" },
      { id: "prestar-contas", label: "Planejei a prestação de contas após o evento" },
    ],
    faqs: [
      { question: "Posso pedir o apoio poucos dias antes do evento?", answer: "Não. O processo eletrônico no SUAP precisa chegar ao DIPPED pelo menos 30 dias antes do evento, além de respeitar o prazo final do edital." },
      { question: "O apoio cobre todas as despesas?", answer: "O edital prevê apoio parcial, sujeito à análise e aos recursos disponíveis. Consulte os itens de despesa aceitos antes de fazer a solicitação." },
    ],
    caution: "O prazo de 30 dias antes do evento pode terminar antes de 30 de novembro. A concessão depende dos recursos e da análise oficial.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/edital-n-o-24-2026-direcao-geral",
    publishedAt: "2026-07-20",
    verifiedAt: "2026-10-02",
    resolveStatus: resolveEventSupport24Status,
  },
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
      { label: "Resultado final dos projetos publicado", dateLabel: "11 de setembro", startDate: "2026-09-11" },
      { label: "Seleção de estudantes bolsistas", dateLabel: "11 a 16 de setembro", startDate: "2026-09-11", endDate: "2026-09-16", calendar: true },
      { label: "Início das atividades", dateLabel: "18 de setembro", startDate: "2026-09-18" },
      { label: "Fim das atividades", dateLabel: "29 de janeiro de 2027", startDate: "2027-01-29" },
    ],
    checklist: [
      { id: "atualizar-lattes", label: "Atualizei meu currículo Lattes" },
      { id: "acompanhar-projetos", label: "Conferi quais projetos foram aprovados" },
      { id: "buscar-selecao", label: "Verifiquei as seleções de bolsistas entre 11 e 16/09" },
      { id: "revisar-disponibilidade", label: "Confirmei minha disponibilidade e compatibilidade de bolsas" },
    ],
    faqs: [
      { question: "O estudante envia o projeto principal neste edital?", answer: "Não. Servidores coordenadores submetem os projetos; a escolha dos estudantes bolsistas ocorre depois, nos projetos aprovados." },
      { question: "Ser indicado para um projeto garante a bolsa?", answer: "Não. A indicação de estudante coautor exige critérios documentados pelo coordenador. A escolha dos bolsistas e o pagamento seguem as demais condições do edital." },
    ],
    caution: "O estudante não submete a proposta principal deste edital. A entrada como bolsista ocorre na seleção simplificada conduzida por um projeto aprovado.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/edital-n-o-33-2026-direcao-geral",
    publishedAt: "2026-08-25",
    verifiedAt: "2026-10-02",
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
      { label: "Inscrições", dateLabel: "12 a 23 de agosto", startDate: "2026-08-12", endDate: "2026-08-23", calendar: true },
      { label: "Resultado preliminar publicado", dateLabel: "26 de agosto", startDate: "2026-08-26" },
      { label: "Recursos", dateLabel: "26 e 27 de agosto", startDate: "2026-08-26", endDate: "2026-08-27", calendar: true },
      { label: "Resultado final publicado", dateLabel: "1º de setembro", startDate: "2026-09-01" },
      { label: "Cadastro da conta no SUAP", dateLabel: "1º a 8 de setembro", startDate: "2026-09-01", endDate: "2026-09-08", calendar: true },
    ],
    checklist: [
      { id: "conferir-resultado", label: "Conferi o resultado final oficial" },
      { id: "preparar-conta", label: "Tenho uma conta bancária em meu nome" },
      { id: "atualizar-conta-suap", label: "Confirmei ou atualizei os dados bancários no SUAP" },
      { id: "documento-especifico", label: "Enviei laudo ou declaração de matrícula vínculo, se aplicável" },
    ],
    faqs: [
      { question: "Estar no resultado final dispensa o cadastro da conta bancária?", answer: "Não. Quem foi classificado deve inserir, confirmar ou atualizar no SUAP uma conta bancária de sua titularidade. A falta desse cadastro no prazo pode suspender o atendimento." },
      { question: "Este é o mesmo processo do PAPE IV?", answer: "Não. O Edital 28/2026 corresponde à seleção anterior, com cronograma próprio; o PAPE IV é o Edital 41/2026. Consulte o resultado ou a inscrição do edital correto." },
    ],
    caution: "O AcadIA explica o processo, mas não calcula classificação nem confirma direito ao auxílio. A decisão válida é a publicada pelo IFPB.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/edital-n-o-28-2026-direcao-geral",
    publishedAt: "2026-08-24",
    verifiedAt: "2026-10-02",
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
      "Consulte o resultado final publicado em 24 de setembro.",
    ],
    schedule: [
      { label: "Análise da documentação", dateLabel: "24 de agosto a 4 de setembro", startDate: "2026-08-24", endDate: "2026-09-04" },
      { label: "Cronograma e local das entrevistas", dateLabel: "8 de setembro", startDate: "2026-09-08" },
      { label: "Entrevistas", dateLabel: "9 a 11 de setembro", startDate: "2026-09-09", endDate: "2026-09-11" },
      { label: "Resultado preliminar", dateLabel: "14 de setembro", startDate: "2026-09-14" },
      { label: "Recursos", dateLabel: "15 a 17 de setembro", startDate: "2026-09-15", endDate: "2026-09-17", calendar: true },
      { label: "Resultado final publicado", dateLabel: "24 de setembro", startDate: "2026-09-24" },
    ],
    checklist: [
      { id: "acompanhar-entrevista", label: "Vou conferir o cronograma de entrevistas em 08/09" },
      { id: "guardar-documentos", label: "Mantive os documentos originais organizados" },
      { id: "conferir-preliminar", label: "Conferi o resultado preliminar" },
      { id: "avaliar-recurso", label: "Avaliei se preciso apresentar recurso pelo SUAP" },
      { id: "conferir-final", label: "Conferi o resultado final e a validade do IVS" },
    ],
    faqs: [
      { question: "Ter IVS aprovado significa receber auxílio automaticamente?", answer: "Não. O IVS é um índice usado como critério em seleções da Assistência Estudantil. Cada programa tem inscrição, vagas e condições próprias." },
      { question: "Por quanto tempo o IVS é válido?", answer: "O edital prevê validade de dois anos a partir do mês e ano do resultado homologado, com possibilidade de prorrogação conforme suas regras." },
    ],
    caution: "A lista completa varia conforme a composição e a renda familiar. Consulte os quadros de documentos e anexos do edital oficial antes de enviar ou complementar informações.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/edital-n-o-26-2026-direcao-geral",
    publishedAt: "2026-08-06",
    verifiedAt: "2026-10-02",
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
    faqs: [
      { question: "Posso trocar almoço por jantar depois de ser incluído?", answer: "Não. O edital não permite alterar posteriormente o tipo de refeição escolhido na inscrição." },
      { question: "Preciso ter IVS válido para participar?", answer: "Sim. O SUAP verifica automaticamente o IVS válido no momento da inscrição, além dos demais requisitos do edital." },
    ],
    caution: "As refeições são disponibilizadas por ordem de chegada e dentro do limite diário. Consulte o resultado e as orientações oficiais do campus.",
    officialUrl: "https://www.ifpb.edu.br/campus/joaopessoa/editais/direcao-geral/2026/copy_of_edital-n-o-26-2026-direcao-geral",
    publishedAt: "2026-08-10",
    verifiedAt: "2026-10-02",
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
    item.calendar && today >= item.startDate && today <= (item.endDate ?? item.startDate));
  const nextIndex = activeIndex >= 0
    ? activeIndex
    : schedule.findIndex((item) => item.calendar && item.startDate >= today);
  const displayIndex = nextIndex >= 0 ? nextIndex : schedule.findIndex((item) =>
    today >= item.startDate && today <= (item.endDate ?? item.startDate));

  return schedule.map((item, index) => ({
    ...item,
    highlighted: index === displayIndex,
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

export function getNoticeCalendarDeadlines() {
  return noticeDefinitions.flatMap((notice) => notice.schedule
    .filter((item) => item.calendar)
    .map((item) => ({
      id: `${notice.id}:${item.startDate}:${item.label}`,
      noticeId: notice.id,
      noticeNumber: notice.number,
      title: item.label,
      startDate: item.startDate,
      endDate: item.endDate ?? item.startDate,
      officialUrl: notice.officialUrl,
    })));
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
