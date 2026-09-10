import { getGradeColorStyle, GRADE_COLOR_START } from "@/lib/grade-colors";

type GradeValueProps = {
  className?: string;
  minimumFractionDigits?: number;
  value: number | null;
  variant?: "badge" | "text";
};

function formatGrade(value: number, minimumFractionDigits: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits,
    maximumFractionDigits: 1,
  });
}

export function GradeValue({
  className,
  minimumFractionDigits = 1,
  value,
  variant = "badge",
}: GradeValueProps) {
  const classes = [
    "grade-value",
    `grade-value-${variant}`,
    value === null ? "grade-value-empty" : "",
    className ?? "",
  ].filter(Boolean).join(" ");

  if (value === null) {
    return <strong className={classes} title="Nota ainda não informada">—</strong>;
  }

  const formattedGrade = formatGrade(value, minimumFractionDigits);
  const description = value < GRADE_COLOR_START
    ? `Nota ${formattedGrade}, abaixo de 70`
    : `Nota ${formattedGrade}, na escala de 70 a 100`;

  return (
    <strong className={classes} style={getGradeColorStyle(value)} title={description}>
      {formattedGrade}
    </strong>
  );
}
