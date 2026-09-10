"use client";

import { useActionState } from "react";

import {
  createAndroidWidgetPairingAction,
  revokeAndroidWidgetCredentialAction,
} from "@/app/android-widget-actions";
import styles from "@/app/calendario/calendar.module.css";
import type {
  AndroidWidgetCredentialDTO,
  AndroidWidgetPairingFormState,
} from "@/types/android-widget";

const initialState: AndroidWidgetPairingFormState = { status: "idle" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AndroidWidgetControl({
  credentials,
}: {
  credentials: AndroidWidgetCredentialDTO[];
}) {
  const [state, action, pending] = useActionState(
    createAndroidWidgetPairingAction,
    initialState,
  );
  function openAndroidApp() {
    if (!state.pairingCode) return;
    window.location.href = `acadia://pair?server=${encodeURIComponent(window.location.origin)}&code=${encodeURIComponent(state.pairingCode)}`;
  }

  return (
    <section className={styles.androidWidgetCard} aria-labelledby="android-widget-title">
      <div className={styles.androidWidgetHeading}>
        <span className={styles.androidWidgetIcon} aria-hidden="true">A</span>
        <div>
          <span>Android · tela inicial</span>
          <h2 id="android-widget-title">Widget de compromissos em aberto</h2>
          <p>
            Mostra os compromissos sem data final e os mantém visíveis até você concluí-los.
          </p>
        </div>
      </div>

      <form action={action} className={styles.androidPairingForm}>
        <label>
          <span>Nome deste celular</span>
          <input defaultValue="Meu Android" maxLength={80} name="deviceName" required />
        </label>
        <button disabled={pending} type="submit">
          {pending ? "Gerando…" : "Gerar código de conexão"}
        </button>
      </form>

      {state.message ? (
        <p className={state.status === "error" ? styles.androidWidgetError : styles.androidWidgetFeedback}>
          {state.message}
        </p>
      ) : null}

      {state.pairingCode ? (
        <div className={styles.pairingCodePanel}>
          <div>
            <span>Código temporário</span>
            <strong>{state.pairingCode}</strong>
            {state.expiresAt ? <small>Expira em {formatDate(state.expiresAt)}</small> : null}
          </div>
          <button onClick={openAndroidApp} type="button">Abrir no app Android</button>
        </div>
      ) : null}

      {credentials.length ? (
        <div className={styles.androidDeviceList}>
          {credentials.map((credential) => {
            const status = credential.status === "connected"
              ? "Conectado"
              : credential.status === "expired" ? "Código expirado" : "Aguardando conexão";
            const revoke = revokeAndroidWidgetCredentialAction.bind(null, credential.id);
            return (
              <div key={credential.id}>
                <span><strong>{credential.deviceName}</strong><small>{status}</small></span>
                <form action={revoke}>
                  <button type="submit">Revogar</button>
                </form>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
