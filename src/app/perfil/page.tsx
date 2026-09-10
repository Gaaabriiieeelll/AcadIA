import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PrivacyControls } from "@/components/privacy-controls";
import { ProtectedShell } from "@/components/protected-shell";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { getCurrentAccountPrivacyOverview } from "@/data/privacy";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Conta e privacidade",
};

function formatAccountDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");

  const overview = await getCurrentAccountPrivacyOverview();

  return (
    <ProtectedShell active="profile" user={session.user}>
      <div className="protected-main privacy-page-main">
        <span className="protected-kicker">Controle do titular</span>
        <h1>Conta e privacidade</h1>
        <p className="protected-lead">
          Consulte o que está conectado, escolha como seus dados podem ser usados e exerça
          seus controles de exportação, revogação e exclusão.
        </p>

        <section className="privacy-account-summary" aria-labelledby="account-summary-title">
          <div>
            <span>Conta da sessão</span>
            <h2 id="account-summary-title">{session.user.name ?? "Estudante"}</h2>
            <p>{session.user.email}</p>
          </div>
          <dl>
            <div><dt>Conta local criada</dt><dd>{formatAccountDate(overview.accountCreatedAt)}</dd></div>
            <div><dt>Campus</dt><dd>{profile.campus}</dd></div>
            <div><dt>Curso</dt><dd>{profile.course}</dd></div>
          </dl>
          <Link className="secondary-action" href="/horarios#perfil-academico">
            Editar perfil acadêmico
          </Link>
        </section>

        <section className="privacy-explanation" aria-labelledby="privacy-explanation-title">
          <div>
            <span>Resumo transparente</span>
            <h2 id="privacy-explanation-title">Como o AcadIA trata seus dados</h2>
          </div>
          <ul>
            <li><strong>Autenticação:</strong> nome e e-mail permanecem na sessão do Google.</li>
            <li><strong>Banco local:</strong> perfil, disciplinas, notas, agenda, alertas e preferências.</li>
            <li><strong>Dados protegidos:</strong> tokens do Classroom e telefone são criptografados.</li>
            <li><strong>IA opcional:</strong> dados acadêmicos só são enviados após consentimento registrado.</li>
          </ul>
        </section>

        <PrivacyControls email={session.user.email} overview={overview} />
      </div>
    </ProtectedShell>
  );
}
