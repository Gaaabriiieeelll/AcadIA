import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { NoticeDirectory } from "@/components/notice-directory";
import { ProtectedShell } from "@/components/protected-shell";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import {
  getCurrentNoticeChecklistState,
  getOfficialNotices,
  OFFICIAL_NOTICES_URL,
} from "@/data/notices";
import { authOptions } from "@/lib/auth";

import styles from "./notices.module.css";

export const metadata: Metadata = {
  title: "Editais simplificados",
};

export default async function NoticesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");

  const [notices, checklistState] = await Promise.all([
    Promise.resolve(getOfficialNotices()),
    getCurrentNoticeChecklistState(),
  ]);
  const openCount = notices.filter((notice) => notice.status === "open").length;
  const actionCount = notices.filter((notice) => notice.status === "action").length;
  const trackingCount = notices.filter((notice) =>
    notice.status === "review" || notice.status === "result").length;

  return (
    <ProtectedShell active="notices" user={session.user}>
      <div className={`protected-main ${styles.pageMain}`}>
        <span className="protected-kicker">Oportunidades e assistência</span>
        <h1>Editais sem burocratês</h1>
        <p className="protected-lead">
          Entenda quem pode participar, o que separar e quais datas acompanhar - sempre com acesso ao documento oficial.
        </p>

        <section className={styles.overview} aria-labelledby="notices-overview-title">
          <div className={styles.overviewCopy}>
            <span className={styles.overviewIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4.5h10a2 2 0 0 1 2 2v14H5v-14a2 2 0 0 1 2-2Z" /><path d="M9 3h6v4H9zM8.5 11h7M8.5 15h7M8.5 19h4" /></svg>
            </span>
            <div>
              <span>Atualização manual verificada</span>
              <h2 id="notices-overview-title">Quatro processos do Campus João Pessoa acompanhados</h2>
              <p>Os estados abaixo mudam conforme o cronograma de cada edital. O AcadIA explica; o IFPB publica e decide oficialmente.</p>
            </div>
          </div>
          <div className={styles.overviewStats}>
            <div><strong>{openCount}</strong><span>com prazo aberto</span></div>
            <div><strong>{actionCount}</strong><span>pedindo ação</span></div>
            <div><strong>{trackingCount}</strong><span>em acompanhamento</span></div>
          </div>
        </section>

        <aside className={styles.deadlineNotice}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></svg>
          <div>
            <strong>Confira sempre a publicação mais recente</strong>
            <p>Retificações, resultados e convocações podem alterar o que aparece no edital inicial.</p>
          </div>
          <a href={OFFICIAL_NOTICES_URL} rel="noreferrer" target="_blank">Ver todos no IFPB ↗</a>
        </aside>

        <NoticeDirectory checklistState={checklistState} notices={notices} />

        <footer className={styles.disclaimer}>
          <strong>Leitura responsável</strong>
          <p>Os resumos não substituem o edital, não garantem elegibilidade e não prometem aprovação. Em caso de divergência, vale o documento oficial e suas retificações.</p>
          <a href="mailto:caest.jp@ifpb.edu.br">Dúvidas sobre assistência estudantil: caest.jp@ifpb.edu.br</a>
        </footer>
      </div>
    </ProtectedShell>
  );
}
