import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AcademicProfileForm } from "@/components/academic-profile-form";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Complete seu perfil",
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (profile) redirect("/dashboard");

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <Link className="onboarding-brand" href="/dashboard" aria-label="AcadIA">
          <BrandLogo priority />
          AcadIA
        </Link>
        <div className="onboarding-header-actions">
          <ThemeToggle compact />
          <span>Etapa 1 de 1</span>
        </div>
      </header>

      <section className="onboarding-content" aria-labelledby="onboarding-title">
        <div className="onboarding-intro">
          <span className="protected-kicker">Primeiro acesso</span>
          <h1 id="onboarding-title">Complete seu perfil acadêmico</h1>
          <p>Essas informações permitirão organizar seu painel. Nome, foto e e-mail continuam somente na sessão Google.</p>
          <div className="onboarding-identity">
            <strong>{session.user.name ?? "Estudante"}</strong>
            <span>{session.user.email}</span>
          </div>
        </div>

        <div className="onboarding-form-card">
          <AcademicProfileForm
            mode="create"
            initialValues={{
              registrationNumber: "",
              campus: "João Pessoa",
              course: "",
              classGroup: null,
              academicStage: "",
            }}
          />
          <p className="profile-privacy-note">Somente os dados acadêmicos deste formulário serão gravados no banco.</p>
        </div>
      </section>
    </main>
  );
}
