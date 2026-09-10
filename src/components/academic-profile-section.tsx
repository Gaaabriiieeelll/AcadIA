import { AcademicProfileForm } from "@/components/academic-profile-form";
import type { AcademicProfileValues } from "@/types/academic-profile";

type AcademicProfileSectionProps = {
  profile: AcademicProfileValues;
};

export function AcademicProfileSection({ profile }: AcademicProfileSectionProps) {
  return (
    <section
      className="academic-profile-section"
      id="perfil-academico"
      aria-labelledby="academic-profile-title"
    >
      <header className="academic-profile-section-heading">
        <span>Dados persistidos</span>
        <h2 id="academic-profile-title">Perfil acadêmico</h2>
        <p>Revise os dados que serão usados nos próximos módulos do AcadIA.</p>
      </header>
      <div className="profile-edit-card" aria-label="Editar perfil acadêmico">
        <AcademicProfileForm mode="edit" initialValues={profile} />
      </div>
    </section>
  );
}
