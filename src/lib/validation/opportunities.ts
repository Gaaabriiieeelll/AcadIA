import { z } from "zod";

import { OPPORTUNITY_KINDS, OPPORTUNITY_MODALITIES } from "@/types/opportunities";

const optionalText = (limit: number) => z.string().trim().max(limit).transform((value) => value || null);

const optionalDate = z.string().trim().refine((value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Informe uma data válida.").transform((value) => value || null);

export const opportunitySchema = z.object({
  title: z.string().trim().min(3, "Informe o nome da oportunidade.").max(140),
  organization: z.string().trim().min(2, "Informe a instituição ou empresa.").max(120),
  kind: z.enum(OPPORTUNITY_KINDS),
  acceptedCourses: optionalText(250),
  modality: z.enum(OPPORTUNITY_MODALITIES),
  location: optionalText(120),
  deadline: optionalDate,
  sourceUrl: z.url("Informe o link do anúncio.").max(2000).refine(
    (value) => new URL(value).protocol === "https:",
    "Use um link HTTPS para o anúncio.",
  ),
  requirements: optionalText(1500),
  documents: optionalText(1500),
  notes: optionalText(1000),
  reminder: z.boolean(),
});

export const opportunityIdSchema = z.uuid();
