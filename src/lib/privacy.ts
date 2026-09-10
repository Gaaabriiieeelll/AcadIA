import { z } from "zod";

import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/privacy-constants";

export const aiConsentIntentSchema = z.enum(["grant", "revoke"]);

export const accountDeletionSchema = z.object({
  email: z.string().trim()
    .transform((value) => value.toLocaleLowerCase("pt-BR"))
    .pipe(z.email("Informe o mesmo e-mail usado nesta sessão.")),
  confirmation: z.string().trim()
    .transform((value) => value.toLocaleUpperCase("pt-BR"))
    .refine(
    (value) => value === ACCOUNT_DELETION_CONFIRMATION,
    `Digite exatamente ${ACCOUNT_DELETION_CONFIRMATION}.`,
  ),
});
