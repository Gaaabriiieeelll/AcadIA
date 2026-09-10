import assert from "node:assert/strict";
import test from "node:test";

import { isAuthorizedAcademicEmail } from "./google-account-policy";

function withAcademicAccessConfiguration(
  allowAcademicEmail: string | undefined,
  allowedEmails: string | undefined,
  assertion: () => void,
) {
  const previousAllowAcademicEmail = process.env.ALLOW_ACADEMIC_EMAIL;
  const previousAllowedEmails = process.env.ALLOWED_EMAILS;

  try {
    if (allowAcademicEmail === undefined) delete process.env.ALLOW_ACADEMIC_EMAIL;
    else process.env.ALLOW_ACADEMIC_EMAIL = allowAcademicEmail;

    if (allowedEmails === undefined) delete process.env.ALLOWED_EMAILS;
    else process.env.ALLOWED_EMAILS = allowedEmails;

    assertion();
  } finally {
    if (previousAllowAcademicEmail === undefined) delete process.env.ALLOW_ACADEMIC_EMAIL;
    else process.env.ALLOW_ACADEMIC_EMAIL = previousAllowAcademicEmail;

    if (previousAllowedEmails === undefined) delete process.env.ALLOWED_EMAILS;
    else process.env.ALLOWED_EMAILS = previousAllowedEmails;
  }
}

test("autoriza somente o e-mail acadêmico habilitado e incluído na lista privada", () => {
  withAcademicAccessConfiguration(
    "true",
    "pessoal@example.com, franca.mendes@academico.ifpb.edu.br",
    () => {
      assert.equal(
        isAuthorizedAcademicEmail("  FRANCA.MENDES@ACADEMICO.IFPB.EDU.BR "),
        true,
      );
      assert.equal(isAuthorizedAcademicEmail("outro@academico.ifpb.edu.br"), false);
      assert.equal(isAuthorizedAcademicEmail("franca.mendes@example.com"), false);
    },
  );
});

test("mantém o vínculo acadêmico bloqueado quando a autorização está desativada", () => {
  withAcademicAccessConfiguration(
    "false",
    "franca.mendes@academico.ifpb.edu.br",
    () => {
      assert.equal(
        isAuthorizedAcademicEmail("franca.mendes@academico.ifpb.edu.br"),
        false,
      );
    },
  );
});
