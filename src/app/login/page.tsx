import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { GoogleLoginButton } from "@/components/google-login-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { authOptions, isAuthConfigured } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Entrar",
};

const errorMessages: Record<string, string> = {
  AcademicEmailRequiresAuthorization:
    "O uso do e-mail acadêmico permanece bloqueado até existir autorização institucional para o AcadIA.",
  EmailNotAuthorized:
    "Esta conta não está na lista de acesso do ambiente de testes.",
  UnverifiedEmail:
    "O Google não confirmou este endereço de e-mail.",
  InvalidProvider:
    "Não foi possível confirmar o provedor de acesso.",
  AccessDenied:
    "O acesso foi negado. Confirme se você escolheu a conta autorizada.",
  OAuthSignin:
    "Não foi possível iniciar o acesso pelo Google.",
  OAuthCallback:
    "O Google não conseguiu concluir o retorno para o AcadIA.",
  Configuration:
    "A autenticação ainda não foi configurada corretamente no servidor.",
};

type LoginPageProps = {
  searchParams: Promise<{ account?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  const { account, error } = await searchParams;
  const configured = isAuthConfigured();
  const academicEmailEnabled = process.env.ALLOW_ACADEMIC_EMAIL === "true";
  const errorMessage = error
    ? errorMessages[error] ?? "Não foi possível concluir o acesso. Tente novamente."
    : null;

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Apresentação do AcadIA">
        <div className="visual-orbit visual-orbit-one" />
        <div className="visual-orbit visual-orbit-two" />

        <a className="login-brand" href="/login" aria-label="AcadIA — Página de entrada">
          <BrandLogo priority size={64} />
          <span>Acad<strong>IA</strong></span>
        </a>

        <div className="visual-copy">
          <span className="visual-kicker">Seu espaço acadêmico</span>
          <h1>Organização para estudar com mais tranquilidade.</h1>
          <p>Reúna seu desempenho, sua agenda e orientações acadêmicas em uma experiência clara e acolhedora.</p>
        </div>

        <div className="visual-preview" aria-hidden="true">
          <div className="preview-top">
            <span />
            <i />
          </div>
          <div className="preview-title" />
          <div className="preview-subtitle" />
          <div className="preview-cards">
            <div><i /><strong>82</strong><span>Média geral</span></div>
            <div><i /><strong>91%</strong><span>Frequência</span></div>
            <div><i /><strong>3</strong><span>Disciplinas</span></div>
          </div>
        </div>

        <p className="independent-note">Projeto independente em desenvolvimento, sem vínculo institucional oficial com o IFPB.</p>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <ThemeToggle className="login-theme-toggle" />
        <div className="mobile-login-brand" aria-hidden="true">
          <BrandLogo priority size={56} />
          AcadIA
        </div>

        <div className="login-box">
          <span className="login-kicker">Ambiente de testes · Acesso restrito</span>
          <h2 id="login-title">Boas-vindas ao AcadIA</h2>
          <p className="login-intro">Entre com a conta Google autorizada para acessar o ambiente inicial.</p>

          {errorMessage ? (
            <div className="login-alert" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 17h.01" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {account === "deleted" ? (
            <p className="login-success" role="status">
              Sua conta e os dados locais foram excluídos com sucesso.
            </p>
          ) : null}

          {!configured ? (
            <div className="setup-notice" role="status">
              <strong>Configuração necessária</strong>
              <span>Preencha o arquivo <code>.env.local</code> com as credenciais OAuth antes do primeiro acesso.</span>
            </div>
          ) : null}

          <GoogleLoginButton configured={configured} />

          <div className="login-security">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </svg>
            <p><strong>Sua senha permanece no Google.</strong> O AcadIA recebe somente nome, foto e e-mail nesta etapa.</p>
          </div>

          <div className="access-policy">
            <h3>Sobre o e-mail acadêmico</h3>
            <p>
              {academicEmailEnabled
                ? "O acesso acadêmico está habilitado somente para endereços incluídos individualmente na lista privada de acesso."
                : "Enquanto o projeto não tiver autorização institucional, use uma conta pessoal de teste incluída na lista de acesso. O domínio acadêmico está bloqueado por segurança."}
            </p>
          </div>

          <p className="login-terms">Ao continuar, você reconhece que esta é uma versão privada de desenvolvimento.</p>
        </div>
      </section>
    </main>
  );
}
