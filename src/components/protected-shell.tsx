import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ClassroomBackgroundSync } from "@/components/classroom-background-sync";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

type ProtectedShellProps = {
  active:
    | "dashboard"
    | "subjects"
    | "materials"
    | "schedule"
    | "agenda"
    | "alerts"
    | "study"
    | "notices"
    | "support"
    | "profile";
  children: ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
  };
};

function getInitials(name?: string | null) {
  if (!name) return "A";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-BR"))
    .join("");
}

const navigation = [
  { href: "/dashboard", id: "dashboard" as const, label: "Visão geral", mobileLabel: "Início" },
  { href: "/agenda", id: "agenda" as const, label: "Agenda", mobileLabel: "Agenda" },
  { href: "/alertas", id: "alerts" as const, label: "Central de alertas", mobileLabel: "Alertas" },
  { href: "/disciplinas", id: "subjects" as const, label: "Disciplinas", mobileLabel: "Matérias" },
  { href: "/materiais", id: "materials" as const, label: "Materiais", mobileLabel: "Materiais" },
  { href: "/horarios", id: "schedule" as const, label: "Mecânica II", mobileLabel: "Horários" },
  { href: "/plano-de-estudos", id: "study" as const, label: "Plano de estudos", mobileLabel: "Plano" },
  { href: "/editais", id: "notices" as const, label: "Editais", mobileLabel: "Editais" },
  { href: "/atendimento", id: "support" as const, label: "Atendimento", mobileLabel: "Ajuda" },
];

function ProtectedNavigation({
  active,
  mobile = false,
}: {
  active: ProtectedShellProps["active"];
  mobile?: boolean;
}) {
  return (
    <nav className={mobile ? "protected-mobile-nav" : undefined} aria-label="Navegação da área protegida">
      {navigation.map((item) => (
        <Link
          aria-current={active === item.id ? "page" : undefined}
          className={active === item.id ? "protected-nav-active" : undefined}
          href={item.href}
          key={item.id}
        >
          {item.id === "dashboard" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3.5 10.8 12 3.7l8.5 7.1v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" /><path d="M9 20.8v-6.3h6v6.3" /></svg>
          ) : item.id === "subjects" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 5.5h6.5A3.5 3.5 0 0 1 14 9v10H7.5A3.5 3.5 0 0 0 4 22z" /><path d="M20 5.5h-2.5A3.5 3.5 0 0 0 14 9v10h2.5A3.5 3.5 0 0 1 20 22z" /></svg>
          ) : item.id === "materials" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></svg>
          ) : item.id === "schedule" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2M5.5 4.5l-2 2M18.5 4.5l2 2" /></svg>
          ) : item.id === "agenda" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M7.5 3v5M16.5 3v5M3.5 10h17M8 14h3M8 17h6" /></svg>
          ) : item.id === "alerts" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></svg>
          ) : item.id === "notices" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 4.5h10a2 2 0 0 1 2 2v14H5v-14a2 2 0 0 1 2-2Z" /><path d="M9 3h6v4H9zM8.5 11h7M8.5 15h7M8.5 19h4" /></svg>
          ) : item.id === "support" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 13v-2a8 8 0 0 1 16 0v2M4 13v4h3v-6H4zM20 13v4h-3v-6h3zM17 18c-.7 1.3-2.1 2-4 2h-1" /><circle cx="10.5" cy="20" r="1" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 19.5V6a2 2 0 0 1 2-2h12v15.5H6A2 2 0 0 0 4 21.5" /><path d="M8 8h6M8 11h8M8 14h5" /></svg>
          )}
          {mobile ? item.mobileLabel : item.label}
        </Link>
      ))}
    </nav>
  );
}

export function ProtectedShell({ active, children, user }: ProtectedShellProps) {
  return (
    <main className="protected-page">
      <ClassroomBackgroundSync />
      <aside className="protected-sidebar">
        <Link className="protected-brand" href="/dashboard" aria-label="AcadIA — Visão geral">
          <BrandLogo size={48} />
          AcadIA
        </Link>
        <ProtectedNavigation active={active} />
        <p>Ambiente privado de desenvolvimento.</p>
      </aside>

      <section className="protected-content">
        <header className="protected-topbar">
          <ThemeToggle compact />
          <Link
            aria-current={active === "alerts" ? "page" : undefined}
            aria-label="Abrir central de alertas"
            className={`protected-alert-link${active === "alerts" ? " protected-alert-link-active" : ""}`}
            href="/alertas"
            title="Central de alertas"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
              <path d="M10 21h4" />
            </svg>
          </Link>
          <Link
            aria-current={active === "profile" ? "page" : undefined}
            aria-label="Abrir conta e privacidade"
            className={`protected-identity${active === "profile" ? " protected-identity-active" : ""}`}
            href="/perfil"
            title="Conta e privacidade"
          >
            <span className="protected-avatar">{getInitials(user.name)}</span>
            <div>
              <strong>{user.name ?? "Estudante"}</strong>
              <span>{user.email}</span>
            </div>
          </Link>
          <SignOutButton />
        </header>
        <ProtectedNavigation active={active} mobile />
        {children}
      </section>
    </main>
  );
}
