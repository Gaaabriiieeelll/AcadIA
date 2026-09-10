"use client";

import { useMemo, useState } from "react";

import styles from "@/app/atendimento/support.module.css";
import type {
  SupportServiceCategory,
  SupportServiceDTO,
} from "@/types/support-services";

const categoryDetails: Record<
  SupportServiceCategory,
  { label: string; description: string }
> = {
  "student-support": {
    label: "Assistência estudantil",
    description: "Auxílios, acolhimento e permanência",
  },
  academic: {
    label: "Vida acadêmica",
    description: "Matrícula, documentos e SUAP",
  },
  "accessibility-health": {
    label: "Acessibilidade e saúde",
    description: "Inclusão, adaptações e cuidado",
  },
  "library-career": {
    label: "Biblioteca e carreira",
    description: "Acervo, estágio e oportunidades",
  },
};

const quickSearches = [
  { label: "Preciso de auxílio", query: "auxílio IVS PAPE alimentação" },
  { label: "Tenho dúvida de matrícula", query: "matrícula vínculo histórico SUAP" },
  { label: "Preciso de acessibilidade", query: "acessibilidade adaptação inclusão" },
  { label: "Quero orientação de estágio", query: "estágio termo vaga convênio" },
] as const;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
}

function formatVerifiedDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function ServiceCard({ service }: { service: SupportServiceDTO }) {
  return (
    <article className={`${styles.serviceCard}${service.featured ? ` ${styles.featuredCard}` : ""}`}>
      <div className={styles.serviceHeader}>
        <span className={styles.serviceAcronym} aria-hidden="true">{service.acronym}</span>
        <div>
          <span className={styles.categoryLabel}>{categoryDetails[service.category].label}</span>
          <h2>{service.name}</h2>
        </div>
      </div>

      <p className={styles.serviceSummary}>{service.summary}</p>

      <div className={styles.helpList}>
        <strong>Procure este setor para</strong>
        <ul>
          {service.helpsWith.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <dl className={styles.contactDetails}>
        {service.email ? (
          <div>
            <dt>E-mail</dt>
            <dd><a href={`mailto:${service.email}`}>{service.email}</a></dd>
          </div>
        ) : null}
        {service.phones.length > 0 ? (
          <div>
            <dt>Telefone</dt>
            <dd>
              {service.phones.map((phone) => (
                <a href={`tel:+55${phone.replace(/\D/g, "")}`} key={phone}>{phone}</a>
              ))}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Local</dt>
          <dd>{service.location}</dd>
        </div>
        <div>
          <dt>Atendimento</dt>
          <dd>{service.hours}</dd>
        </div>
      </dl>

      <div className={styles.cardActions}>
        {service.whatsapp ? (
          <a
            className={styles.primaryContact}
            href={`https://wa.me/${service.whatsapp}`}
            rel="noreferrer"
            target="_blank"
          >
            Abrir WhatsApp
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </a>
        ) : service.email ? (
          <a className={styles.primaryContact} href={`mailto:${service.email}`}>
            Enviar e-mail
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </a>
        ) : null}
        <a className={styles.sourceLink} href={service.officialUrl} rel="noreferrer" target="_blank">
          Conferir fonte oficial
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <p className={styles.verifiedDate}>Contato conferido em {formatVerifiedDate(service.verifiedAt)}.</p>
    </article>
  );
}

export function SupportDirectory({ services }: { services: SupportServiceDTO[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SupportServiceCategory | "all">("all");

  const visibleServices = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);

    return services.filter((service) => {
      if (category !== "all" && service.category !== category) return false;
      if (terms.length === 0) return true;

      const searchable = normalize([
        service.acronym,
        service.name,
        service.summary,
        service.email ?? "",
        ...service.helpsWith,
      ].join(" "));
      return terms.every((term) => searchable.includes(term));
    });
  }, [category, query, services]);

  return (
    <>
      <section className={styles.finder} aria-labelledby="support-finder-title">
        <div className={styles.finderHeading}>
          <div>
            <span>Encontre o setor certo</span>
            <h2 id="support-finder-title">Como podemos direcionar você?</h2>
          </div>
          <strong>{visibleServices.length} {visibleServices.length === 1 ? "setor encontrado" : "setores encontrados"}</strong>
        </div>

        <div className={styles.searchField} role="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
          <label className="sr-only" htmlFor="support-search">Pesquisar por assunto ou setor</label>
          <input
            id="support-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: auxílio, matrícula, acessibilidade ou estágio"
            type="search"
            value={query}
          />
          {query ? <button onClick={() => setQuery("")} type="button">Limpar</button> : null}
        </div>

        <div className={styles.quickSearches} aria-label="Atalhos por necessidade">
          {quickSearches.map((item) => (
            <button key={item.label} onClick={() => { setCategory("all"); setQuery(item.query); }} type="button">
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.categoryFilters} aria-label="Filtrar setores por categoria">
          <button
            aria-pressed={category === "all"}
            className={category === "all" ? styles.activeFilter : undefined}
            onClick={() => setCategory("all")}
            type="button"
          >
            Todos
          </button>
          {(Object.entries(categoryDetails) as Array<[SupportServiceCategory, (typeof categoryDetails)[SupportServiceCategory]]>).map(([id, details]) => (
            <button
              aria-pressed={category === id}
              className={category === id ? styles.activeFilter : undefined}
              key={id}
              onClick={() => setCategory(id)}
              title={details.description}
              type="button"
            >
              {details.label}
            </button>
          ))}
        </div>
      </section>

      {visibleServices.length > 0 ? (
        <div className={styles.serviceGrid} aria-live="polite">
          {visibleServices.map((service) => <ServiceCard key={service.id} service={service} />)}
        </div>
      ) : (
        <section className={styles.emptyState} aria-live="polite">
          <span aria-hidden="true">?</span>
          <h2>Nenhum setor corresponde à busca</h2>
          <p>Tente outro assunto ou veja novamente todos os contatos disponíveis.</p>
          <button onClick={() => { setCategory("all"); setQuery(""); }} type="button">Mostrar todos</button>
        </section>
      )}
    </>
  );
}
