"use client";

import { signOut } from "next-auth/react";
import { useActionState, useEffect, useRef } from "react";

import {
  deleteAccountAction,
  disconnectClassroomAction,
  updateAiConsentAction,
} from "@/app/privacy-actions";
import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/privacy-constants";
import type { AccountPrivacyOverviewDTO, PrivacyActionState } from "@/types/privacy";

const initialState: PrivacyActionState = { status: "idle" };

function ActionFeedback({ state }: { state: PrivacyActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={`privacy-action-feedback privacy-action-feedback-${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

export function AiConsentControl({
  granted,
  grantedAt,
}: {
  granted: boolean;
  grantedAt?: string | null;
}) {
  const [state, action, pending] = useActionState(updateAiConsentAction, initialState);

  return (
    <div className="ai-consent-control">
      <div>
        <span className={`privacy-status${granted ? " privacy-status-active" : ""}`}>
          {granted ? "Autorizado" : "Aguardando autorização"}
        </span>
        <p>
          {grantedAt && granted
            ? `Consentimento registrado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(grantedAt))}.`
            : "A IA permanece bloqueada até você autorizar este uso específico."}
        </p>
      </div>
      <form action={action}>
        <input name="consent" type="hidden" value={granted ? "revoke" : "grant"} />
        <button
          className={granted ? "secondary-action" : "primary-action"}
          disabled={pending}
          type="submit"
        >
          {pending
            ? "Atualizando…"
            : granted ? "Revogar autorização" : "Autorizar análise por IA"}
        </button>
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}

function ClassroomPrivacyControl({ overview }: { overview: AccountPrivacyOverviewDTO }) {
  const [state, action, pending] = useActionState(disconnectClassroomAction, initialState);

  return (
    <div className="privacy-control-card">
      <div className="privacy-control-heading">
        <div>
          <span>Integração externa</span>
          <h2>Google Sala de Aula</h2>
        </div>
        <strong className={overview.classroom.connected ? "privacy-status-active" : undefined}>
          {overview.classroom.connected ? "Conectado" : "Desconectado"}
        </strong>
      </div>
      <p>
        A desconexão remove os tokens locais, as atividades importadas do Classroom e as
        recomendações geradas a partir desses conteúdos.
      </p>
      <div className="privacy-control-actions">
        <form
          action={action}
          onSubmit={(event) => {
            if (!window.confirm("Desconectar o Classroom e remover os dados importados?")) {
              event.preventDefault();
            }
          }}
        >
          <button
            className="secondary-action"
            disabled={!overview.classroom.connected || pending}
            type="submit"
          >
            {pending ? "Desconectando…" : "Desconectar deste ambiente"}
          </button>
        </form>
        <a
          className="privacy-inline-link"
          href="https://myaccount.google.com/connections"
          rel="noreferrer"
          target="_blank"
        >
          Revogar também na Conta Google ↗
        </a>
      </div>
      <ActionFeedback state={state} />
    </div>
  );
}

function DeleteAccountControl({ email }: { email: string }) {
  const [state, action, pending] = useActionState(deleteAccountAction, initialState);
  const signingOut = useRef(false);

  useEffect(() => {
    if (state.status !== "success" || signingOut.current) return;
    signingOut.current = true;
    void signOut({ callbackUrl: "/login?account=deleted" });
  }, [state.status]);

  return (
    <section className="privacy-danger-zone" aria-labelledby="delete-account-title">
      <div>
        <span>Zona de risco</span>
        <h2 id="delete-account-title">Excluir conta e dados locais</h2>
        <p>
          Esta ação apaga permanentemente perfil, disciplinas, notas, agenda, alertas,
          planejamentos, checklists, consentimentos e integrações armazenadas no AcadIA.
        </p>
      </div>
      <form
        action={action}
        className="privacy-delete-form"
        noValidate
        onSubmit={(event) => {
          if (!window.confirm("Esta exclusão é permanente. Deseja realmente continuar?")) {
            event.preventDefault();
          }
        }}
      >
        <label className="profile-field">
          <span>Confirme o e-mail da sessão</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.email)}
            autoComplete="email"
            name="email"
            placeholder={email}
            required
            type="email"
          />
          {state.fieldErrors?.email?.[0] ? (
            <small className="profile-field-error">{state.fieldErrors.email[0]}</small>
          ) : null}
        </label>
        <label className="profile-field">
          <span>Digite {ACCOUNT_DELETION_CONFIRMATION}</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.confirmation)}
            autoComplete="off"
            name="confirmation"
            required
          />
          {state.fieldErrors?.confirmation?.[0] ? (
            <small className="profile-field-error">{state.fieldErrors.confirmation[0]}</small>
          ) : null}
        </label>
        <button className="privacy-danger-button" disabled={pending} type="submit">
          {pending ? "Excluindo…" : "Excluir minha conta permanentemente"}
        </button>
        <ActionFeedback state={state} />
      </form>
    </section>
  );
}

export function PrivacyControls({
  email,
  overview,
}: {
  email: string;
  overview: AccountPrivacyOverviewDTO;
}) {
  return (
    <div className="privacy-controls">
      <section className="privacy-control-grid" aria-label="Controles de dados e integrações">
        <div className="privacy-control-card">
          <div className="privacy-control-heading">
            <div>
              <span>Portabilidade</span>
              <h2>Exportar meus dados</h2>
            </div>
          </div>
          <p>
            Baixe um arquivo JSON com os dados associados à sua conta. Tokens OAuth e segredos
            do servidor nunca são incluídos.
          </p>
          <a className="primary-action" download href="/api/account/export">
            Baixar exportação
          </a>
        </div>

        <ClassroomPrivacyControl overview={overview} />

        <div className="privacy-control-card privacy-control-card-wide">
          <div className="privacy-control-heading">
            <div>
              <span>Inteligência artificial</span>
              <h2>Análise acadêmica pela OpenAI</h2>
            </div>
          </div>
          <p>
            Quando autorizada, a análise envia nomes de disciplinas, notas e títulos,
            descrições e nomes de anexos do Classroom. Matrícula, e-mail, telefone e tokens
            de acesso não são enviados. As requisições usam a opção de não armazenamento.
          </p>
          <AiConsentControl
            granted={overview.aiConsent.granted}
            grantedAt={overview.aiConsent.grantedAt}
          />
        </div>
      </section>

      <DeleteAccountControl email={email} />
    </div>
  );
}
