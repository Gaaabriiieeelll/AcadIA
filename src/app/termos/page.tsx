import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Condições de uso do Conecta Campus.",
};

export default function TermsPage() {
  return (
    <main className="public-info-page">
      <article className="public-info-card">
        <header>
          <Link className="public-info-brand" href="/login">Conecta Campus</Link>
          <p>Atualizados em 7 de outubro de 2026</p>
          <h1>Termos de uso</h1>
          <p>
            O Conecta Campus é um projeto independente para ajudar estudantes a organizar
            estudos, notas, prazos e oportunidades. Ele está em desenvolvimento e não
            representa o IFPB.
          </p>
        </header>

        <section>
          <h2>Conta e dados</h2>
          <p>
            Use uma conta Google sua e mantenha corretas as informações acadêmicas que
            escolher cadastrar. Você controla as integrações opcionais e pode excluir sua
            conta no aplicativo. Consulte a <Link href="/privacidade">Política de privacidade</Link>
            {" "}para entender o tratamento de dados.
          </p>
        </section>

        <section>
          <h2>Informações acadêmicas</h2>
          <p>
            Horários, notas, editais, oportunidades, recomendações e respostas de IA podem
            estar incompletos ou desatualizados. Confirme decisões, inscrições, prazos e
            resultados nas fontes oficiais do IFPB e dos organizadores.
          </p>
        </section>

        <section>
          <h2>Disponibilidade e contato</h2>
          <p>
            Recursos podem mudar durante o desenvolvimento. Se encontrar um erro, tiver
            dúvida sobre o uso ou quiser solicitar apoio, escreva para{" "}
            <a href="mailto:gabriel.jpb2009@gmail.com">gabriel.jpb2009@gmail.com</a>.
          </p>
        </section>

        <footer>
          <Link href="/login">Voltar ao acesso</Link>
          <Link href="/privacidade">Política de privacidade</Link>
        </footer>
      </article>
    </main>
  );
}
