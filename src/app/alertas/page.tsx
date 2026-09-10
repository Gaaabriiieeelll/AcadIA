import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AlertItemControls,
  AlertPreferencesForm,
  BrowserNotificationControl,
  MarkAllAlertsReadForm,
  RestoreAlertForm,
  WhatsAppNotificationControl,
} from "@/components/academic-alert-controls";
import { ProtectedShell } from "@/components/protected-shell";
import {
  getCurrentAcademicAlertCenter,
  getCurrentWhatsAppSettings,
} from "@/data/academic-alerts";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { getCurrentBrowserPushSettings } from "@/data/browser-push";
import { authOptions } from "@/lib/auth";
import type {
  AcademicAlertDTO,
  AcademicAlertHistoryItemDTO,
  AcademicAlertSeverity,
} from "@/types/academic-alerts";

import styles from "./alerts.module.css";

export const metadata: Metadata = {
  title: "Central de alertas",
};

const severityDetails: Record<
  AcademicAlertSeverity,
  { eyebrow: string; title: string; description: string }
> = {
  critical: {
    eyebrow: "Prioridade máxima",
    title: "Urgentes",
    description: "Situações que pedem uma ação imediata.",
  },
  warning: {
    eyebrow: "Acompanhamento preventivo",
    title: "Atenção",
    description: "Pontos importantes para acompanhar agora.",
  },
  info: {
    eyebrow: "Próximos dias",
    title: "Informativos",
    description: "Datas e compromissos para você se organizar.",
  },
};

const categoryLabels = {
  grades: "Notas",
  attendance: "Frequência",
  tasks: "Agenda",
  calendar: "Calendário",
} as const;

const historyStatusLabels = {
  dismissed: "Ocultado",
  snoozed: "Adiado",
  resolved: "Resolvido",
} as const;

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function AlertIcon({ severity }: { severity: AcademicAlertSeverity }) {
  if (severity === "critical") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M10.3 4.3 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4.5M12 17h.01" />
      </svg>
    );
  }

  if (severity === "warning") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5V12l3 2M12 17.2h.01" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function AlertCard({ alert }: { alert: AcademicAlertDTO }) {
  return (
    <article
      className={`${styles.alertCard} ${styles[alert.severity]}${alert.read ? ` ${styles.read}` : ""}`}
      style={{ "--alert-accent": alert.accentColor ?? undefined } as CSSProperties}
    >
      <span className={styles.alertIcon}>
        <AlertIcon severity={alert.severity} />
      </span>
      <div className={styles.alertContent}>
        <div className={styles.alertTopline}>
          <span>{categoryLabels[alert.category]}</span>
          <span>{alert.eyebrow}</span>
          {alert.dateLabel ? <time dateTime={alert.dateKey ?? undefined}>{alert.dateLabel}</time> : null}
          {alert.read ? <span className={styles.readBadge}>Lido</span> : null}
        </div>
        <h3>{alert.title}</h3>
        <p>{alert.description}</p>
        <AlertItemControls alertKey={alert.id} read={alert.read} />
      </div>
      <Link
        className={styles.alertAction}
        href={alert.href}
        rel={alert.href.startsWith("http") ? "noreferrer" : undefined}
        target={alert.href.startsWith("http") ? "_blank" : undefined}
      >
        {alert.actionLabel}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h14M14 7l5 5-5 5" />
        </svg>
      </Link>
    </article>
  );
}

function AlertHistoryItem({ item }: { item: AcademicAlertHistoryItemDTO }) {
  return (
    <li className={styles.historyItem}>
      <span className={`${styles.historyMarker} ${styles[item.severity]}`} aria-hidden="true" />
      <div>
        <div className={styles.historyTopline}>
          <span>{categoryLabels[item.category]}</span>
          <strong>{historyStatusLabels[item.status]}</strong>
          {item.status === "snoozed" && item.snoozedUntil ? (
            <time dateTime={item.snoozedUntil}>Até {formatDateKey(item.snoozedUntil)}</time>
          ) : <time dateTime={item.occurredAt}>{formatHistoryDate(item.occurredAt)}</time>}
        </div>
        <h3>{item.title}</h3>
        {item.status === "snoozed" && item.snoozedUntil ? (
          <p>Voltará a aparecer em {formatDateKey(item.snoozedUntil)}.</p>
        ) : <p>{item.description}</p>}
      </div>
      <div className={styles.historyActions}>
        {item.status !== "resolved" ? <RestoreAlertForm alertKey={item.alertKey} /> : null}
        <Link href={item.href}>Ver origem</Link>
      </div>
    </li>
  );
}

export default async function AlertsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");

  const [alertCenter, browserPushSettings, whatsAppSettings] = await Promise.all([
    getCurrentAcademicAlertCenter(),
    getCurrentBrowserPushSettings(),
    getCurrentWhatsAppSettings(),
  ]);
  const { alerts, history, preferences, summary } = alertCenter;

  return (
    <ProtectedShell active="alerts" user={session.user}>
      <div className={`protected-main ${styles.pageMain}`}>
        <span className="protected-kicker">Acompanhamento preventivo</span>
        <h1>Central de alertas</h1>
        <p className="protected-lead">
          Priorize o que precisa da sua atenção com base nas notas, frequência, atividades e eventos já registrados no AcadIA.
        </p>

        <section className={styles.overview} aria-labelledby="alerts-overview-title">
          <div className={styles.overviewHeading}>
            <span className={styles.overviewIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
                <path d="M10 21h4" />
              </svg>
            </span>
            <div>
              <span>Atualização automática</span>
              <h2 id="alerts-overview-title">
                {summary.total === 0
                  ? "Nenhum alerta ativo"
                  : `${summary.total} ${summary.total === 1 ? "alerta ativo" : "alertas ativos"}`}
              </h2>
              <p>
                {summary.total === 0
                  ? "Tudo em ordem com os dados disponíveis no momento."
                  : "Os itens mais importantes aparecem primeiro e são recalculados sempre que seus dados mudam."}
              </p>
            </div>
            <MarkAllAlertsReadForm disabled={summary.unread === 0} />
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryTotal}>
              <span>Não lidos</span>
              <strong>{summary.unread}</strong>
              <small>de {summary.total} ativos</small>
            </div>
            <div className={styles.summaryCritical}>
              <span>Urgentes</span>
              <strong>{summary.critical}</strong>
              <small>ação imediata</small>
            </div>
            <div className={styles.summaryWarning}>
              <span>Atenção</span>
              <strong>{summary.warning}</strong>
              <small>acompanhar agora</small>
            </div>
            <div className={styles.summaryInfo}>
              <span>Informativos</span>
              <strong>{summary.info}</strong>
              <small>próximos dias</small>
            </div>
          </div>
        </section>

        <div className={styles.contextGrid}>
          <div>
            <span>Acadêmico</span>
            <strong>{summary.academic}</strong>
            <small>alertas de notas e frequência</small>
          </div>
          <div>
            <span>Planejamento</span>
            <strong>{summary.planning}</strong>
            <small>alertas de agenda e calendário</small>
          </div>
          <div>
            <span>Adiados</span>
            <strong>{summary.snoozed}</strong>
            <small>voltarão na data escolhida</small>
          </div>
          <div>
            <span>Ocultos</span>
            <strong>{summary.hidden}</strong>
            <small>podem ser restaurados</small>
          </div>
        </div>

        <section className={styles.preferencesSection} id="preferencias" aria-labelledby="alert-preferences-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>Controle pessoal</span>
              <h2 id="alert-preferences-title">Preferências de alertas</h2>
              <p>Defina suas referências e escolha o que deseja acompanhar.</p>
            </div>
          </div>
          <div className={styles.preferencesGrid}>
            <div className={styles.preferenceCard}>
              <div className={styles.preferenceCardHeading}>
                <span>Regras e categorias</span>
                <h3>Personalize a central</h3>
              </div>
              <AlertPreferencesForm preferences={preferences} />
            </div>
            <div className={styles.preferenceCard}>
              <div className={styles.preferenceCardHeading}>
                <span>Este dispositivo</span>
                <h3>Notificações do navegador</h3>
              </div>
              <BrowserNotificationControl settings={browserPushSettings} />
            </div>
            <div className={`${styles.preferenceCard} ${styles.whatsAppCard}`}>
              <div className={styles.preferenceCardHeading}>
                <span>Job diário</span>
                <h3>Notificações pelo WhatsApp</h3>
              </div>
              <WhatsAppNotificationControl settings={whatsAppSettings} />
            </div>
          </div>
        </section>

        {alerts.length === 0 ? (
          <section className={styles.emptyState}>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12 2.5 2.5L16.5 8.5" />
              </svg>
            </span>
            <h2>Tudo em ordem</h2>
            <p>Quando surgir uma nota, frequência, tarefa ou data que precise de atenção, ela aparecerá aqui.</p>
            <div>
              <Link className="secondary-action" href="/disciplinas">Revisar disciplinas</Link>
              <Link className="primary-action" href="/agenda">Abrir agenda</Link>
            </div>
          </section>
        ) : (
          <div className={styles.alertGroups}>
            {(["critical", "warning", "info"] as const).map((severity) => {
              const severityAlerts = alerts.filter((alert) => alert.severity === severity);
              if (severityAlerts.length === 0) return null;
              const details = severityDetails[severity];

              return (
                <section className={styles.alertGroup} key={severity} aria-labelledby={`alerts-${severity}`}>
                  <div className={styles.groupHeading}>
                    <div>
                      <span>{details.eyebrow}</span>
                      <h2 id={`alerts-${severity}`}>{details.title}</h2>
                      <p>{details.description}</p>
                    </div>
                    <strong>{severityAlerts.length}</strong>
                  </div>
                  <div className={styles.alertList}>
                    {severityAlerts.map((alert) => <AlertCard alert={alert} key={alert.id} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <section className={styles.historySection} aria-labelledby="alert-history-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>Acompanhamento</span>
              <h2 id="alert-history-title">Histórico de alertas</h2>
              <p>Alertas adiados, ocultados ou resolvidos ficam registrados aqui.</p>
            </div>
            <strong>{history.length}</strong>
          </div>
          {history.length === 0 ? (
            <div className={styles.historyEmpty}>
              <strong>Nenhum item no histórico</strong>
              <p>Suas ações e alertas resolvidos aparecerão nesta seção.</p>
            </div>
          ) : (
            <ul className={styles.historyList}>
              {history.map((item) => <AlertHistoryItem item={item} key={item.id} />)}
            </ul>
          )}
        </section>

        <footer className={styles.ruleNote}>
          <strong>Como os alertas são calculados</strong>
          <p>
            Suas referências atuais são média {preferences.targetAverage} e frequência mínima de {preferences.minimumAttendance}%. O AcadIA usa somente os dados cadastrados aqui; notas, médias e frequência oficiais continuam sendo as exibidas no SUAP.
          </p>
        </footer>
      </div>
    </ProtectedShell>
  );
}
