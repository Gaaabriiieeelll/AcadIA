import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProtectedShell } from "@/components/protected-shell";
import { SupportDirectory } from "@/components/support-directory";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { supportServices } from "@/data/support-services";
import { authOptions } from "@/lib/auth";

import styles from "./support.module.css";

export const metadata: Metadata = {
  title: "Central de atendimento",
};

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");

  const directChannels = supportServices.filter((service) =>
    Boolean(service.email || service.whatsapp || service.phones.length > 0));
  const extendedHours = supportServices.filter((service) =>
    service.hours.includes("20h") || service.hours.includes("21h"));

  return (
    <ProtectedShell active="support" user={session.user}>
      <div className={`protected-main ${styles.pageMain}`}>
        <span className="protected-kicker">Orientação institucional</span>
        <h1>Central de atendimento</h1>
        <p className="protected-lead">
          Descubra qual setor pode ajudar, veja horários conferidos e inicie o contato pelo canal oficial.
        </p>

        <section className={styles.overview} aria-labelledby="support-overview-title">
          <div className={styles.overviewCopy}>
            <span className={styles.overviewIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 13v-2a8 8 0 0 1 16 0v2M4 13v4h3v-6H4zM20 13v4h-3v-6h3zM17 18c-.7 1.3-2.1 2-4 2h-1" /><circle cx="10.5" cy="20" r="1" /></svg>
            </span>
            <div>
              <span>Campus João Pessoa</span>
              <h2 id="support-overview-title">Ajuda sem precisar adivinhar o setor</h2>
              <p>Escolha pelo assunto. Quando a fonte oficial não informa sala ou horário, o AcadIA deixa isso explícito para você confirmar antes de ir ao campus.</p>
            </div>
          </div>
          <div className={styles.overviewStats}>
            <div><strong>{supportServices.length}</strong><span>setores mapeados</span></div>
            <div><strong>{directChannels.length}</strong><span>com contato direto</span></div>
            <div><strong>{extendedHours.length}</strong><span>com horário estendido</span></div>
          </div>
        </section>

        <SupportDirectory services={supportServices} />

        <section className={styles.campusCard} aria-labelledby="campus-contact-title">
          <div>
            <span>Contato geral do campus</span>
            <h2 id="campus-contact-title">Ainda não sabe para onde ir?</h2>
            <p>A Secretaria Central pode orientar o primeiro encaminhamento. O campus fica na Avenida Primeiro de Maio, 720, Jaguaribe, João Pessoa.</p>
          </div>
          <div className={styles.campusActions}>
            <a href="https://wa.me/5583981784973" rel="noreferrer" target="_blank">WhatsApp da Secretaria</a>
            <a href="tel:+558336121200">Ligar para (83) 3612-1200</a>
            <a href="https://www.ifpb.edu.br/campus/joaopessoa/contato" rel="noreferrer" target="_blank">Ver página oficial ↗</a>
          </div>
        </section>

        <footer className={styles.sourceNote}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10.5V17M12 7.2v.2" /></svg>
          <div>
            <strong>Projeto independente</strong>
            <p>Os contatos são reproduzidos de páginas oficiais do IFPB e podem mudar. Confirme a fonte indicada em cada cartão antes de um atendimento presencial.</p>
            <Link href="/editais">Procurando auxílios e seleções? Abrir Editais</Link>
          </div>
        </footer>
      </div>
    </ProtectedShell>
  );
}
