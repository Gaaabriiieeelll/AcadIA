"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import Link from "next/link";

import {
  BIMESTERS,
  type AcademicBimesterOverviewDTO,
  type AcademicOverviewDTO,
  type BimesterNumber,
  type SubjectDTO,
} from "@/types/subjects";

import styles from "./dashboard-charts.module.css";

type Props = {
  bimesters: AcademicBimesterOverviewDTO[];
  subjects: SubjectDTO[];
  overview: AcademicOverviewDTO;
  targetAverage: number;
  minimumAttendance: number;
};

function formatNumber(value: number, suffix = "") {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;
}

function Goal({ label, value, target, suffix, color }: {
  label: string;
  value: number | null;
  target: number;
  suffix: string;
  color: string;
}) {
  const progress = value === null || target <= 0 ? 0 : Math.min(100, Math.max(0, value / target * 100));
  return (
    <div className={styles.goal}>
      <div
        aria-label={value === null ? `${label}: sem dados` : `${label}: ${formatNumber(value, suffix)} de ${formatNumber(target, suffix)}`}
        className={styles.goalRing}
        role="img"
        style={{ "--goal-progress": `${progress}%`, "--goal-color": color } as CSSProperties}
      >
        <strong>{value === null ? "—" : formatNumber(value, suffix)}</strong>
      </div>
      <div>
        <strong>{label}</strong>
        <span>Meta: {formatNumber(target, suffix)}</span>
        <small>{value === null ? "Aguardando dados" : value >= target ? "Meta atingida" : `Faltam ${formatNumber(target - value, suffix)}`}</small>
      </div>
    </div>
  );
}

export function DashboardCharts({ bimesters, subjects, overview, targetAverage, minimumAttendance }: Props) {
  const [selectedBimester, setSelectedBimester] = useState<BimesterNumber | null>(null);
  const chartWidth = 640;
  const chartHeight = 180;
  const x = (index: number) => 44 + index * (chartWidth - 88) / 3;
  const y = (score: number) => 12 + (100 - score) * (chartHeight - 28) / 100;
  const points = bimesters.map((item, index) => item.averageScore === null
    ? null
    : { x: x(index), y: y(item.averageScore), score: item.averageScore });
  const lineSegments: string[] = [];
  let segment: string[] = [];
  for (const point of points) {
    if (point) segment.push(`${point.x},${point.y}`);
    else if (segment.length) { lineSegments.push(segment.join(" ")); segment = []; }
  }
  if (segment.length) lineSegments.push(segment.join(" "));
  const attendance = [...subjects]
    .filter((subject) => subject.attendancePercentage !== null)
    .sort((a, b) => (a.attendancePercentage ?? 0) - (b.attendancePercentage ?? 0));
  const selectedOverview = bimesters.find((item) => item.bimester === selectedBimester);
  const selectedScores = selectedBimester === null ? [] : subjects
    .filter((subject) => subject.bimesterCount >= selectedBimester)
    .map((subject) => ({
      subject,
      score: subject.bimesterGrades.find((grade) => grade.bimester === selectedBimester)?.score ?? null,
    }))
    .sort((left, right) => {
      if (left.score === null) return right.score === null
        ? left.subject.name.localeCompare(right.subject.name, "pt-BR") : 1;
      if (right.score === null) return -1;
      return left.score - right.score || left.subject.name.localeCompare(right.subject.name, "pt-BR");
    });

  return (
    <section className={styles.section} aria-labelledby="dashboard-charts-title">
      <div className={styles.heading}>
        <div><span>Gráficos do ano letivo</span><h2 id="dashboard-charts-title">Evolução, frequência e metas</h2></div>
        <small>Dados das disciplinas selecionadas</small>
      </div>
      <div className={styles.grid}>
        <article className={styles.panel}>
          <h3>{selectedBimester === null ? "Evolução anual das notas" : `Notas do ${selectedBimester}º bimestre`}</h3>
          <p>{selectedBimester === null
            ? "Média das notas registradas em cada bimestre."
            : "Compare as disciplinas deste bimestre. As menores notas aparecem primeiro."}</p>
          <div aria-label="Filtrar gráfico de notas por bimestre" className={styles.periodFilter} role="group">
            <button aria-pressed={selectedBimester === null} onClick={() => setSelectedBimester(null)} type="button">Ano todo</button>
            {BIMESTERS.map((bimester) => (
              <button
                aria-label={`${bimester}º bimestre`}
                aria-pressed={selectedBimester === bimester}
                key={bimester}
                onClick={() => setSelectedBimester(bimester)}
                type="button"
              >
                {bimester}º
              </button>
            ))}
          </div>
          {selectedBimester !== null ? (
            <div className={styles.bimesterBreakdown}>
              <div aria-live="polite" className={styles.bimesterSummary}>
                <div><span>Média do bimestre</span><strong>{selectedOverview?.averageScore === null || selectedOverview?.averageScore === undefined ? "—" : formatNumber(selectedOverview.averageScore)}</strong></div>
                <div><span>Notas registradas</span><strong>{selectedOverview?.filledGrades ?? 0}/{selectedOverview?.eligibleSubjects ?? 0}</strong></div>
              </div>
              {selectedScores.length === 0 ? (
                <p className={styles.empty}>Nenhuma disciplina selecionada tem este bimestre.</p>
              ) : (
                <div className={styles.scoreList}>
                  {selectedScores.map(({ subject, score }) => (
                    <div className={styles.scoreRow} key={subject.id}>
                      <div>
                        <Link href={`/disciplinas#disciplina-${subject.id}`}>{subject.name}</Link>
                        <strong>{score === null ? "Sem nota" : formatNumber(score)}</strong>
                      </div>
                      <div
                        aria-label={`${subject.name}: ${score === null ? "sem nota" : formatNumber(score)}`}
                        aria-valuemin={score === null ? undefined : 0}
                        aria-valuemax={score === null ? undefined : 100}
                        aria-valuenow={score ?? undefined}
                        className={styles.track}
                        role={score === null ? undefined : "meter"}
                      >
                        <i style={{ width: `${Math.min(100, Math.max(0, score ?? 0))}%`, backgroundColor: score !== null && score < targetAverage ? "#dc5a49" : subject.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : points.every((point) => point === null) ? (
            <p className={styles.empty}>Adicione notas para acompanhar a evolução.</p>
          ) : (
            <div className={styles.chartScroll}>
              <svg aria-label={`Evolução da média: ${bimesters.map((item) => `${item.bimester}º bimestre, ${item.averageScore === null ? "sem nota" : formatNumber(item.averageScore)}`).join("; ")}`} className={styles.chart} role="img" viewBox={`0 0 ${chartWidth} 220`}>
                {[0, 25, 50, 75, 100].map((value) => (
                  <g key={value}>
                    <line className={styles.gridLine} x1="44" x2="596" y1={y(value)} y2={y(value)} />
                    <text className={styles.axisText} x="35" y={y(value) + 4} textAnchor="end">{value}</text>
                  </g>
                ))}
                {lineSegments.map((value, index) => (
                  <polyline className={styles.line} key={index} points={value} />
                ))}
                {points.map((point, index) => (
                  <g key={index}>
                    <text className={styles.axisText} textAnchor="middle" x={x(index)} y="210">{index + 1}º bim.</text>
                    {point ? <><circle className={styles.dot} cx={point.x} cy={point.y} r="6" /><text className={styles.valueText} textAnchor="middle" x={point.x} y={point.y - 13}>{formatNumber(point.score)}</text></> : null}
                  </g>
                ))}
              </svg>
            </div>
          )}
          <small>Disciplinas com dois bimestres não entram no 3º e 4º. Notas ausentes ficam sem ponto no gráfico anual.</small>
        </article>

        <article className={styles.panel}>
          <h3>Frequência por disciplina</h3>
          <p>Percentual das aulas registradas, começando pelas menores frequências.</p>
          {attendance.length === 0 ? <p className={styles.empty}>Registre aulas e faltas para visualizar a frequência.</p> : (
            <div className={styles.attendanceList}>
              {attendance.map((subject) => (
                <div className={styles.attendanceRow} key={subject.id}>
                  <div><Link href={`/disciplinas#disciplina-${subject.id}`}>{subject.name}</Link><strong>{formatNumber(subject.attendancePercentage ?? 0, "%")}</strong></div>
                  <div aria-label={`${subject.name}: ${formatNumber(subject.attendancePercentage ?? 0, "%")}`} className={styles.track} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={subject.attendancePercentage ?? 0}>
                    <i style={{ width: `${Math.min(100, Math.max(0, subject.attendancePercentage ?? 0))}%`, backgroundColor: subject.attendancePercentage !== null && subject.attendancePercentage < minimumAttendance ? "#dc5a49" : subject.color }} />
                  </div>
                  <small>{subject.classesHeld} aulas · {subject.absences} faltas</small>
                </div>
              ))}
            </div>
          )}
          {attendance.length > 0 && attendance.length < subjects.length ? (
            <small>{subjects.length - attendance.length} disciplina(s) ainda sem frequência registrada.</small>
          ) : null}
        </article>

        <article className={`${styles.panel} ${styles.goalsPanel}`}>
          <div className={styles.goalsHeading}><div><h3>Suas metas</h3><p>Progresso frente às referências configuradas.</p></div><Link href="/alertas">Ajustar metas</Link></div>
          <div className={styles.goalList}>
            <Goal color="#16895d" label="Média geral" suffix="" target={targetAverage} value={overview.averageScore} />
            <Goal color="#2983c7" label="Frequência geral" suffix="%" target={minimumAttendance} value={overview.attendancePercentage} />
          </div>
        </article>
      </div>
    </section>
  );
}
