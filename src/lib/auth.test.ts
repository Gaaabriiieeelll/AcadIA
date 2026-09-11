import assert from "node:assert/strict";
import test from "node:test";

import {
  isAnyGoogleEmailAllowed,
  isAuthorizedAcademicEmail,
  isAuthorizedGoogleEmail,
  isGoogleAccessPolicyConfigured,
} from "./google-account-policy";

function withAcademicAccessConfiguration(
  allowAcademicEmail: string | undefined,
  allowedEmails: string | undefined,
  allowAnyGoogleEmail: string | undefined,
  assertion: () => void,
) {
  const previousAllowAcademicEmail = process.env.ALLOW_ACADEMIC_EMAIL;
  const previousAllowedEmails = process.env.ALLOWED_EMAILS;
  const previousAllowAnyGoogleEmail = process.env.ALLOW_ANY_GOOGLE_EMAIL;

  try {
    if (allowAcademicEmail === undefined) delete process.env.ALLOW_ACADEMIC_EMAIL;
    else process.env.ALLOW_ACADEMIC_EMAIL = allowAcademicEmail;

    if (allowedEmails === undefined) delete process.env.ALLOWED_EMAILS;
    else process.env.ALLOWED_EMAILS = allowedEmails;

    if (allowAnyGoogleEmail === undefined) delete process.env.ALLOW_ANY_GOOGLE_EMAIL;
    else process.env.ALLOW_ANY_GOOGLE_EMAIL = allowAnyGoogleEmail;

    assertion();
  } finally {
    if (previousAllowAcademicEmail === undefined) delete process.env.ALLOW_ACADEMIC_EMAIL;
    else process.env.ALLOW_ACADEMIC_EMAIL = previousAllowAcademicEmail;

    if (previousAllowedEmails === undefined) delete process.env.ALLOWED_EMAILS;
    else process.env.ALLOWED_EMAILS = previousAllowedEmails;

    if (previousAllowAnyGoogleEmail === undefined) {
      delete process.env.ALLOW_ANY_GOOGLE_EMAIL;
    } else {
      process.env.ALLOW_ANY_GOOGLE_EMAIL = previousAllowAnyGoogleEmail;
    }
  }
}

test("autoriza somente o e-mail acadêmico habilitado e incluído na lista privada", () => {
  withAcademicAccessConfiguration(
    "true",
    "pessoal@example.com, franca.mendes@academico.ifpb.edu.br",
    "false",
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
    "false",
    () => {
      assert.equal(
        isAuthorizedAcademicEmail("franca.mendes@academico.ifpb.edu.br"),
        false,
      );
    },
  );
});

test("autoriza qualquer conta Google quando a abertura publica esta ativada", () => {
  withAcademicAccessConfiguration("false", undefined, "true", () => {
    assert.equal(isAnyGoogleEmailAllowed(), true);
    assert.equal(isGoogleAccessPolicyConfigured(), true);
    assert.equal(isAuthorizedGoogleEmail("pessoal@gmail.com"), true);
    assert.equal(isAuthorizedGoogleEmail("equipe@empresa.com"), true);
    assert.equal(
      isAuthorizedAcademicEmail("estudante@academico.ifpb.edu.br"),
      true,
    );
  });
});

test("mantem a lista privada como padrao seguro", () => {
  withAcademicAccessConfiguration("false", "permitido@gmail.com", undefined, () => {
    assert.equal(isAnyGoogleEmailAllowed(), false);
    assert.equal(isGoogleAccessPolicyConfigured(), true);
    assert.equal(isAuthorizedGoogleEmail("permitido@gmail.com"), true);
    assert.equal(isAuthorizedGoogleEmail("outro@gmail.com"), false);
  });
});

test("falha com seguranca quando nenhuma politica de acesso foi configurada", () => {
  withAcademicAccessConfiguration("false", "  ", "false", () => {
    assert.equal(isGoogleAccessPolicyConfigured(), false);
    assert.equal(isAuthorizedGoogleEmail("qualquer@gmail.com"), false);
  });
});
