"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import {
  dismissAlertAction,
  markAlertReadAction,
  markAllAlertsReadAction,
  registerBrowserPushSubscriptionAction,
  restoreAlertAction,
  sendWhatsAppTestAction,
  snoozeAlertAction,
  unregisterBrowserPushSubscriptionAction,
  updateAlertPreferencesAction,
  updateWhatsAppNotificationAction,
} from "@/app/alert-actions";
import type {
  AcademicAlertPreferenceFormState,
  AcademicAlertPreferencesDTO,
  AcademicBrowserPushSettingsDTO,
  AcademicWhatsAppFormState,
  AcademicWhatsAppSettingsDTO,
  BrowserPushSubscriptionInput,
} from "@/types/academic-alerts";

const initialPreferenceState: AcademicAlertPreferenceFormState = { status: "idle" };
const initialWhatsAppState: AcademicWhatsAppFormState = { status: "idle" };

function PendingButton({ idleLabel, pendingLabel, className, disabled = false }: {
  idleLabel: string;
  pendingLabel: string;
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending || disabled} type="submit">
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function AlertItemControls({ alertKey, read }: { alertKey: string; read: boolean }) {
  const markReadAction = markAlertReadAction.bind(null, alertKey);
  const postponeAction = snoozeAlertAction.bind(null, alertKey);
  const hideAction = dismissAlertAction.bind(null, alertKey);

  return (
    <div className="alert-item-controls" aria-label="Controles do alerta">
      {!read ? (
        <form action={markReadAction}>
          <PendingButton
            className="alert-control-button"
            idleLabel="Marcar como lido"
            pendingLabel="Salvando…"
          />
        </form>
      ) : <span className="alert-read-label">Lido</span>}

      <form action={postponeAction} className="alert-snooze-form">
        <label>
          <span className="sr-only">Prazo para adiar</span>
          <select aria-label="Prazo para adiar" defaultValue="1" name="days">
            <option value="1">1 dia</option>
            <option value="3">3 dias</option>
            <option value="7">7 dias</option>
          </select>
        </label>
        <PendingButton
          className="alert-control-button"
          idleLabel="Adiar"
          pendingLabel="Adiando…"
        />
      </form>

      <form
        action={hideAction}
        onSubmit={(event) => {
          if (!window.confirm("Ocultar este alerta? Você poderá restaurá-lo pelo histórico.")) {
            event.preventDefault();
          }
        }}
      >
        <PendingButton
          className="alert-control-button alert-control-hide"
          idleLabel="Ocultar"
          pendingLabel="Ocultando…"
        />
      </form>
    </div>
  );
}

export function MarkAllAlertsReadForm({ disabled }: { disabled: boolean }) {
  return (
    <form action={markAllAlertsReadAction}>
      <PendingButton
        className="alert-mark-all-button"
        disabled={disabled}
        idleLabel={disabled ? "Tudo lido" : "Marcar todos como lidos"}
        pendingLabel="Atualizando…"
      />
    </form>
  );
}

export function RestoreAlertForm({ alertKey }: { alertKey: string }) {
  const action = restoreAlertAction.bind(null, alertKey);
  return (
    <form action={action}>
      <PendingButton
        className="alert-history-restore"
        idleLabel="Restaurar"
        pendingLabel="Restaurando…"
      />
    </form>
  );
}

function PreferenceFieldError({
  field,
  state,
}: {
  field: "targetAverage" | "minimumAttendance";
  state: AcademicAlertPreferenceFormState;
}) {
  const error = state.fieldErrors?.[field]?.[0];
  return error ? <span className="profile-field-error">{error}</span> : null;
}

export function AlertPreferencesForm({
  preferences,
}: {
  preferences: AcademicAlertPreferencesDTO;
}) {
  const [state, formAction, pending] = useActionState(
    updateAlertPreferencesAction,
    initialPreferenceState,
  );

  return (
    <form action={formAction} className="alert-preferences-form" noValidate>
      <div className="alert-preference-thresholds">
        <label className="profile-field">
          <span>Meta de média</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.targetAverage)}
            defaultValue={preferences.targetAverage}
            inputMode="numeric"
            max="100"
            min="0"
            name="targetAverage"
            required
            type="number"
          />
          <PreferenceFieldError field="targetAverage" state={state} />
        </label>
        <label className="profile-field">
          <span>Frequência mínima</span>
          <div className="alert-percentage-input">
            <input
              aria-invalid={Boolean(state.fieldErrors?.minimumAttendance)}
              defaultValue={preferences.minimumAttendance}
              inputMode="numeric"
              max="100"
              min="0"
              name="minimumAttendance"
              required
              type="number"
            />
            <span>%</span>
          </div>
          <PreferenceFieldError field="minimumAttendance" state={state} />
        </label>
      </div>

      <fieldset className="alert-category-preferences">
        <legend>Categorias exibidas</legend>
        <label>
          <input defaultChecked={preferences.gradesEnabled} name="gradesEnabled" type="checkbox" />
          <span><strong>Notas</strong><small>Médias e bimestres sem nota</small></span>
        </label>
        <label>
          <input defaultChecked={preferences.attendanceEnabled} name="attendanceEnabled" type="checkbox" />
          <span><strong>Frequência</strong><small>Limite e faixa preventiva</small></span>
        </label>
        <label>
          <input defaultChecked={preferences.tasksEnabled} name="tasksEnabled" type="checkbox" />
          <span><strong>Agenda</strong><small>Atividades e prazos</small></span>
        </label>
        <label>
          <input defaultChecked={preferences.calendarEnabled} name="calendarEnabled" type="checkbox" />
          <span><strong>Calendário</strong><small>Provas e eventos</small></span>
        </label>
      </fieldset>

      {state.message ? (
        <p
          className={`subject-form-feedback subject-form-feedback-${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <button className="primary-action" disabled={pending} type="submit">
        {pending ? "Salvando…" : "Salvar preferências"}
      </button>
    </form>
  );
}

type BrowserPushState =
  | "active"
  | "blocked"
  | "checking"
  | "inactive"
  | "unconfigured"
  | "unsupported";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function pushSubscriptionInput(subscription: PushSubscription): BrowserPushSubscriptionInput {
  const serialized = subscription.toJSON();
  const auth = serialized.keys?.auth;
  const p256dh = serialized.keys?.p256dh;
  if (!auth || !p256dh) throw new Error("O navegador não forneceu as chaves da assinatura.");

  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: { auth, p256dh },
  };
}

async function browserPushRegistration() {
  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  return navigator.serviceWorker.ready;
}

export function BrowserNotificationControl({
  settings,
}: {
  settings: AcademicBrowserPushSettingsDTO;
}) {
  const [status, setStatus] = useState<BrowserPushState>("checking");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [deviceCount, setDeviceCount] = useState(settings.activeDeviceCount);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function inspectSubscription() {
      if (!settings.serviceConfigured || !settings.publicKey) {
        setStatus("unconfigured");
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setStatus("unsupported");
        return;
      }

      try {
        const registration = await browserPushRegistration();
        const current = await registration.pushManager.getSubscription();
        if (cancelled) return;
        setSubscription(current);
        if (current) setDeviceCount((count) => Math.max(1, count));
        setStatus(Notification.permission === "denied"
          ? "blocked"
          : current && Notification.permission === "granted" ? "active" : "inactive");
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }

    void inspectSubscription();
    return () => { cancelled = true; };
  }, [settings.publicKey, settings.serviceConfigured]);

  const active = status === "active";

  function toggleNotifications() {
    startTransition(async () => {
      setMessage(null);

      if (active) {
        const registration = await browserPushRegistration();
        const current = subscription ?? await registration.pushManager.getSubscription();
        if (!current) {
          setSubscription(null);
          setStatus("inactive");
          setMessage("A assinatura deste navegador já não estava ativa.");
          return;
        }

        const result = await unregisterBrowserPushSubscriptionAction(current.endpoint);
        if (result.status === "success") {
          try {
            await current.unsubscribe();
          } catch {
            // O servidor já removeu a assinatura e não fará novos envios.
          }
          setSubscription(null);
          setStatus("inactive");
          setDeviceCount((count) => Math.max(0, count - 1));
          setMessage(result.message);
        } else {
          setMessage(result.message);
        }
        return;
      }

      if (!settings.publicKey || !settings.serviceConfigured) {
        setStatus("unconfigured");
        setMessage("O envio Web Push ainda não foi configurado no servidor.");
        return;
      }

      const nextPermission = await Notification.requestPermission();
      if (nextPermission !== "granted") {
        setStatus(nextPermission === "denied" ? "blocked" : "inactive");
        setMessage("A permissão não foi concedida. Você pode alterá-la nas configurações do navegador.");
        return;
      }

      try {
        const registration = await browserPushRegistration();
        const existing = await registration.pushManager.getSubscription();
        const current = existing ?? await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey(settings.publicKey),
        });
        const result = await registerBrowserPushSubscriptionAction(pushSubscriptionInput(current));
        if (result.status === "error") {
          if (!existing) await current.unsubscribe();
          setMessage(result.message);
          return;
        }

        setSubscription(current);
        setStatus("active");
        setDeviceCount((count) => Math.max(1, count + (existing ? 0 : 1)));
        setMessage(result.message);
        try {
          await registration.showNotification("AcadIA conectado", {
            body: "Este navegador receberá novos alertas acadêmicos.",
            data: { href: "/alertas" },
            icon: "/acadia-logo.jpeg",
            tag: "acadia-push-enabled",
          });
        } catch {
          // A assinatura já está salva; alguns sistemas silenciam notificações de teste.
        }
      } catch (error) {
        setStatus("inactive");
        setMessage(error instanceof Error
          ? `Não foi possível ativar este navegador: ${error.message}`
          : "Não foi possível ativar este navegador.");
      }
    });
  }

  const statusLabel: Record<BrowserPushState, string> = {
    active: "Ativadas neste navegador",
    blocked: "Permissão bloqueada",
    checking: "Verificando…",
    inactive: deviceCount > 0 ? "Ativas em outro dispositivo" : "Desativadas",
    unconfigured: "Configuração pendente",
    unsupported: "Indisponível",
  };
  const unavailable = status === "unsupported" || status === "checking" || status === "unconfigured";

  return (
    <div className="browser-notification-control">
      <div>
        <span className={`browser-notification-status${active ? " browser-notification-active" : ""}`}>
          {statusLabel[status]}
        </span>
        <p>
          Novos alertas serão enviados em segundo plano para cada navegador ativado. A permissão fica neste dispositivo.
        </p>
        <small>{deviceCount} {deviceCount === 1 ? "dispositivo cadastrado" : "dispositivos cadastrados"} na conta.</small>
        {status === "unconfigured" ? (
          <p className="browser-notification-configuration-note">
            Configure as chaves VAPID no servidor para liberar a ativação.
          </p>
        ) : null}
      </div>
      <button
        className="secondary-action"
        disabled={pending || unavailable || status === "blocked"}
        onClick={toggleNotifications}
        type="button"
      >
        {pending
          ? "Atualizando…"
          : status === "blocked"
            ? "Permissão bloqueada"
            : active ? "Desativar neste navegador" : "Ativar neste navegador"}
      </button>
      {message ? <p className="browser-notification-message" role="status">{message}</p> : null}
    </div>
  );
}

export function WhatsAppNotificationControl({
  settings,
}: {
  settings: AcademicWhatsAppSettingsDTO;
}) {
  const [state, formAction, formPending] = useActionState(
    updateWhatsAppNotificationAction,
    initialWhatsAppState,
  );
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<"success" | "error" | null>(null);
  const [testPending, startTestTransition] = useTransition();

  function sendTest() {
    startTestTransition(async () => {
      setTestMessage(null);
      const result = await sendWhatsAppTestAction();
      setTestStatus(result.status);
      setTestMessage(result.message);
    });
  }

  const status = !settings.serviceConfigured
    ? "Configuração pendente"
    : settings.enabled && settings.verifiedAt
      ? "Ativado e testado"
      : settings.enabled ? "Ativado · teste pendente" : "Desativado";
  const active = settings.serviceConfigured && settings.enabled;

  return (
    <div className="whatsapp-notification-control">
      <div>
        <span className={`browser-notification-status${active ? " browser-notification-active" : ""}`}>
          {status}
        </span>
        <p>
          O AcadIA enviará uma vez ao dia os novos alertas depois que o número passar pelo teste.
        </p>
      </div>

      <form action={formAction} className="whatsapp-notification-form" noValidate>
        <label className="profile-field">
          <span>Número com DDD</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            autoComplete="tel"
            inputMode="tel"
            name="phone"
            placeholder={settings.phoneLastFour
              ? `Número salvo com final ${settings.phoneLastFour}`
              : "(83) 99999-9999"}
            type="tel"
          />
          {settings.phoneLastFour ? (
            <small>Deixe vazio para manter o número final {settings.phoneLastFour}.</small>
          ) : null}
          {state.fieldErrors?.phone?.[0] ? (
            <span className="profile-field-error">{state.fieldErrors.phone[0]}</span>
          ) : null}
        </label>

        <label className="whatsapp-toggle-field">
          <input
            defaultChecked={settings.enabled}
            disabled={!settings.serviceConfigured}
            name="enabled"
            type="checkbox"
          />
          <span><strong>Ativar alertas diários</strong><small>Somente alertas novos e ainda ativos.</small></span>
        </label>

        <label className="whatsapp-consent-field">
          <input defaultChecked={settings.enabled && Boolean(settings.consentAt)} name="consent" type="checkbox" />
          <span>Autorizo o AcadIA a enviar alertas acadêmicos para este número pelo WhatsApp.</span>
        </label>
        {state.fieldErrors?.consent?.[0] ? (
          <span className="profile-field-error">{state.fieldErrors.consent[0]}</span>
        ) : null}

        {!settings.serviceConfigured ? (
          <p className="whatsapp-configuration-note">
            Configure a URL, a chave e a instância da Evolution API no servidor para liberar a ativação.
          </p>
        ) : null}

        {state.message ? (
          <p
            className={`subject-form-feedback subject-form-feedback-${state.status}`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}

        <div className="whatsapp-notification-actions">
          <button className="primary-action" disabled={formPending} type="submit">
            {formPending ? "Salvando…" : "Salvar WhatsApp"}
          </button>
          <button
            className="secondary-action"
            disabled={!active || testPending}
            onClick={sendTest}
            type="button"
          >
            {testPending ? "Enviando…" : "Enviar teste"}
          </button>
        </div>
      </form>

      {testMessage ? (
        <p
          className={`subject-form-feedback subject-form-feedback-${testStatus}`}
          role={testStatus === "error" ? "alert" : "status"}
        >
          {testMessage}
        </p>
      ) : null}
    </div>
  );
}
