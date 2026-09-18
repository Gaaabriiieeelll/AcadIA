export const ETIM_COURSES = [
  "Técnico em Contabilidade Integrado ao Ensino Médio",
  "Técnico em Controle Ambiental Integrado ao Ensino Médio",
  "Técnico em Edificações Integrado ao Ensino Médio",
  "Técnico em Eletrônica Integrado ao Ensino Médio",
  "Técnico em Eletrotécnica Integrado ao Ensino Médio — Matutino",
  "Técnico em Eletrotécnica Integrado ao Ensino Médio — Vespertino",
  "Técnico em Informática Integrado ao Ensino Médio",
  "Técnico em Instrumento Musical Integrado ao Ensino Médio",
  "Técnico em Mecânica Integrado ao Ensino Médio",
] as const;

export const ACADEMIC_STAGES = [
  "1º ano",
  "2º ano",
  "3º ano",
  "4º ano",
] as const;

export const ACADEMIC_CLASS_GROUPS = ["A", "B", "C"] as const;

function searchable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

export function resolveEtimCourse(value: string) {
  if (ETIM_COURSES.some((course) => course === value)) return value;

  const normalized = searchable(value);
  if (normalized.includes("CONTAB")) return ETIM_COURSES[0];
  if (normalized.includes("CONTROLE AMBIENTAL") || normalized.includes("CT AMB")) {
    return ETIM_COURSES[1];
  }
  if (normalized.includes("EDIFIC")) return ETIM_COURSES[2];
  if (normalized.includes("ELETROTECNICA")) {
    return normalized.includes("VESPERT") ? ETIM_COURSES[5] : ETIM_COURSES[4];
  }
  if (normalized.includes("ELETRONICA")) return ETIM_COURSES[3];
  if (normalized.includes("INFORMATICA")) return ETIM_COURSES[6];
  if (normalized.includes("INSTRUMENTO")) return ETIM_COURSES[7];
  if (normalized === "MEC" || normalized.includes("MECANICA")) return ETIM_COURSES[8];

  return "";
}

export function resolveAcademicStage(value: string) {
  if (ACADEMIC_STAGES.some((stage) => stage === value)) return value;

  const stageNumber = value.match(/[1-4]/)?.[0];
  return ACADEMIC_STAGES.find((stage) => stage.startsWith(stageNumber ?? "")) ?? "";
}

export function resolveAcademicClassGroup(value: string | null | undefined) {
  const normalized = value?.trim().toLocaleUpperCase("pt-BR");
  return ACADEMIC_CLASS_GROUPS.find((group) => group === normalized) ?? null;
}
