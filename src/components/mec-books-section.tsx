import styles from "@/app/plano-de-estudos/study-plan.module.css";

const MEC_BOOKS_PORTAL_URL = "https://meclivros.mec.gov.br/";
const MEC_BOOKS_INFORMATION_URL = "https://www.gov.br/mec/pt-br/mec-livros/como-funciona";

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M19 13v6H5V5h6" />
    </svg>
  );
}

export function MecBooksSection() {
  return (
    <section className={styles.mecBooksSection} id="mec-livros" aria-labelledby="mec-books-title">
      <div className={styles.mecBooksHero}>
        <div className={styles.mecBooksCopy}>
          <span className={styles.mecBooksEyebrow}>Biblioteca digital · Ministério da Educação</span>
          <h2 id="mec-books-title">MEC Livros</h2>
          <p>
            Explore gratuitamente milhares de obras nacionais e internacionais pelo computador, tablet ou celular.
          </p>

          <div className={styles.mecBooksBadges} aria-label="Características do serviço">
            <span>Acervo gratuito</span>
            <span>Portal oficial</span>
            <span>Acesso com gov.br</span>
          </div>

          <div className={styles.mecBooksActions}>
            <a href={MEC_BOOKS_PORTAL_URL} rel="noreferrer" target="_blank">
              Acessar com gov.br
              <ExternalIcon />
            </a>
            <a href={MEC_BOOKS_INFORMATION_URL} rel="noreferrer" target="_blank">
              Como funciona
            </a>
          </div>
        </div>

        <div className={styles.mecBooksVisual} aria-hidden="true">
          <span className={styles.digitalBook}>
            <svg viewBox="0 0 180 180" fill="none">
              <path d="M36 35h70c14 0 25 11 25 25v86H61c-14 0-25-11-25-25z" fill="currentColor" opacity=".18" />
              <path d="M48 25h71c11 0 20 9 20 20v91H68c-11 0-20-9-20-20z" fill="currentColor" opacity=".3" />
              <path d="M59 17h67c9 0 16 7 16 16v94H75c-9 0-16-7-16-16z" fill="currentColor" />
              <path d="M75 45h50M75 59h38M75 86h50M75 99h43" stroke="white" strokeLinecap="round" strokeWidth="5" opacity=".82" />
              <circle cx="119" cy="111" r="15" fill="white" opacity=".92" />
              <path d="m115 104 10 7-10 7z" fill="currentColor" />
            </svg>
          </span>
          <strong>Biblioteca digital gratuita</strong>
          <small>Literatura, educação, história e muito mais</small>
        </div>
      </div>

      <div className={styles.mecBooksSteps}>
        <article>
          <span>1</span>
          <div>
            <strong>Abra o portal oficial</strong>
            <p>O AcadIA encaminha você diretamente ao ambiente oficial do MEC Livros.</p>
          </div>
        </article>
        <article>
          <span>2</span>
          <div>
            <strong>Entre com sua conta gov.br</strong>
            <p>A autenticação acontece fora do AcadIA, nos sistemas oficiais do Governo Federal.</p>
          </div>
        </article>
        <article>
          <span>3</span>
          <div>
            <strong>Escolha uma obra</strong>
            <p>Pesquise pelo título ou autor e abra o livro disponível para começar a leitura.</p>
          </div>
        </article>
      </div>

      <div className={styles.mecBooksSecurity}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <p>
          <strong>Seus dados continuam protegidos.</strong> O AcadIA nunca solicita, recebe ou armazena CPF e senha da conta gov.br.
        </p>
      </div>
    </section>
  );
}
