import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o Conecta Campus usa e protege os dados dos estudantes.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="public-info-page">
      <article className="public-info-card">
        <header>
          <Link className="public-info-brand" href="/login">Conecta Campus</Link>
          <p>Atualizada em 7 de outubro de 2026</p>
          <h1>Política de privacidade</h1>
          <p>
            O Conecta Campus é um projeto independente de apoio aos estudos, sem vínculo
            institucional oficial com o IFPB. Este texto explica quais dados são usados no
            aplicativo e quais controles estão disponíveis para você.
          </p>
        </header>

        <section>
          <h2>Dados usados</h2>
          <p>
            O login com Google fornece nome, foto, e-mail e identificador da conta para
            autenticação. Você pode informar matrícula, campus, curso, turma, disciplinas,
            notas, frequência, metas, eventos, oportunidades, preferências de alertas e,
            se escolher o WhatsApp, seu telefone. O boletim em PDF é lido para extrair os
            dados que você confirma; o arquivo original não é guardado.
          </p>
        </section>

        <section>
          <h2>Google Sala de Aula e Agenda</h2>
          <p>
            Essas conexões são opcionais e pedem autorização própria. O Sala de Aula pode
            fornecer turmas, professores, materiais, atividades, entregas e notas para
            organizar o seu planejamento. A Agenda permite criar e atualizar um calendário
            acadêmico na sua conta Google. Guardamos tokens de acesso criptografados para
            manter as conexões e dados acadêmicos importados enquanto você as utiliza.
            O calendário criado na sua conta Google permanece lá até que você o remova.
          </p>
        </section>

        <section>
          <h2>Uso e compartilhamento</h2>
          <p>
            Usamos os dados para mostrar seu painel, planejar estudos, sincronizar eventos
            e enviar os alertas que você habilitar. O serviço funciona com hospedagem,
            banco de dados, Google e, quando ativado, um serviço de WhatsApp. Análises e
            bate-papo com IA são opcionais e exigem autorização específica: podem enviar
            disciplinas, notas, materiais selecionados e texto da conversa à OpenAI ou à
            Groq, conforme a função utilizada. Matrícula, e-mail, telefone e tokens não
            são anexados automaticamente às solicitações de IA. Não vendemos dados pessoais.
          </p>
        </section>

        <section>
          <h2>Conservação e segurança</h2>
          <p>
            Os dados locais permanecem enquanto sua conta existir, salvo os que você remover
            antes. A sessão de login expira em até oito horas. Tokens do Google e telefone
            são criptografados no banco. Serviços externos podem manter registros técnicos
            e cópias de segurança conforme suas próprias políticas.
          </p>
        </section>

        <section>
          <h2>Suas escolhas</h2>
          <p>
            Em <Link href="/perfil">Conta e privacidade</Link>, você pode exportar seus
            dados, desconectar o Sala de Aula, revogar permissões de IA e excluir a conta
            e os dados locais. Também pode revogar o acesso do aplicativo nas configurações
            da sua Conta Google. Para dúvidas ou pedidos sobre seus dados, escreva para{" "}
            <a href="mailto:gabriel.jpb2009@gmail.com">gabriel.jpb2009@gmail.com</a>.
          </p>
        </section>

        <footer>
          <Link href="/login">Voltar ao acesso</Link>
          <Link href="/termos">Termos de uso</Link>
        </footer>
      </article>
    </main>
  );
}
