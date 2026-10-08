import type { ClassroomMaterialDTO } from "@/types/google-classroom";

export type MaterialFilters = {
  query: string;
  courseId: string;
  kind: string;
  order: string;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function filterMaterials(materials: ClassroomMaterialDTO[], filters: MaterialFilters) {
  const terms = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  const date = (material: ClassroomMaterialDTO) => {
    const timestamp = Date.parse(material.updatedAt ?? material.publishedAt ?? "");
    return Number.isFinite(timestamp) ? timestamp : 0;
  };
  return materials.filter((material) => {
    if (filters.courseId && material.courseId !== filters.courseId) return false;
    if (filters.kind === "material" || filters.kind === "announcement") {
      if (material.source !== filters.kind) return false;
    } else if (filters.kind && !material.attachments.some((attachment) => attachment.type === filters.kind)) {
      return false;
    }
    const text = normalize([material.title, material.description, material.courseName,
      ...material.attachments.map((attachment) => attachment.title)].filter(Boolean).join(" "));
    return terms.every((term) => text.includes(term));
  }).sort((a, b) => {
    if (filters.order === "title") return a.title.localeCompare(b.title, "pt-BR") || a.id.localeCompare(b.id);
    return (filters.order === "oldest" ? date(a) - date(b) : date(b) - date(a)) || a.id.localeCompare(b.id);
  });
}
