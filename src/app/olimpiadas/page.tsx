import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProtectedShell } from "@/components/protected-shell";
import { CompetitionDirectory } from "@/components/competition-directory";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { getCurrentCompetitionSubscriptions } from "@/data/competition-subscriptions";
import { getCurrentAlertPreferences } from "@/data/academic-alerts";
import { competitions } from "@/data/competitions";
import { authOptions } from "@/lib/auth";
import styles from "./competitions.module.css";

export const metadata: Metadata = { title: "Olimpíadas e Competições" };
export default async function CompetitionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!await getCurrentAcademicProfile()) redirect("/onboarding");
  const [subscriptions, preferences] = await Promise.all([
    getCurrentCompetitionSubscriptions(), getCurrentAlertPreferences(),
  ]);
  return (
    <ProtectedShell active="competitions" user={session.user}>
      <div className={`protected-main ${styles.page}`}>
        <header className={styles.hero}>
          <span className="protected-kicker">Descubra, prepare-se e participe</span>
          <h1>Olimpíadas e Competições</h1>
          <p>Oportunidades para estudantes do IFPB, com foco em João Pessoa. Confira o público, a edição e as fontes antes de se inscrever.</p>
          <Link href="/calendario">Abrir calendário de competições →</Link>
        </header>
        <aside className={styles.notice}>
          <strong>Acompanhar não realiza sua inscrição</strong>
          <p>Os eventos confirmados aparecem no calendário. Lembretes são opcionais, com antecedência de {preferences.reminderDays} dia(s), e respeitam os canais autorizados na <Link href="/alertas">Central de alertas</Link>.</p>
          {!preferences.calendarEnabled ? <p>Seus alertas de calendário estão desativados. Ative essa categoria na Central para receber lembretes de competições.</p> : null}
        </aside>
        <CompetitionDirectory catalog={competitions} subscriptions={subscriptions} nowIso={new Date().toISOString()} />
      </div>
    </ProtectedShell>
  );
}
