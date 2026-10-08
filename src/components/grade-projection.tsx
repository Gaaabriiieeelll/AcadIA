import Link from "next/link";
import { projectGrades } from "@/lib/grade-projection";
import type { SubjectDTO } from "@/types/subjects";

const score = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export function GradeProjection({ subject, target }: { subject: SubjectDTO; target: number }) {
  const projection = projectGrades(subject.bimesterGrades, subject.bimesterCount, target);
  return (
    <aside className="grade-projection" aria-label={`Projeção de notas de ${subject.name}`}>
      <strong>Para atingir a meta {score(target)}</strong>
      <p>
        {projection.status === "reached" ? "As notas bimestrais registradas já somam o necessário para esta meta."
          : projection.status === "finished" ? "Todos os bimestres estão preenchidos e a meta não foi atingida. Confira as opções de recuperação da disciplina."
          : projection.status === "unreachable" ? `A meta não pode ser atingida apenas com os bimestres restantes. A maior média simples possível é ${score(projection.maximumAverage)}.`
          : `Você precisa de média ${score(projection.neededAverage!)} nos ${projection.remaining} bimestre(s) sem nota.`}
      </p>
      <small>Estimativa com pesos iguais entre os {subject.bimesterCount} bimestres, sem recuperação ou prova final. Não substitui o resultado oficial do SUAP.</small>
      <Link href="/alertas#preferencias">Ajustar meta de média</Link>
    </aside>
  );
}
