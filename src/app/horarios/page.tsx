import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AcademicProfileSection } from "@/components/academic-profile-section";
import { ProtectedShell } from "@/components/protected-shell";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { getMecanicaSecondYearSchedule } from "@/data/hifpb";
import { authOptions } from "@/lib/auth";
import {
  filterHifpbScheduleByGroup,
  formatHifpbSubjectName,
  HIFPB_MECANICA_URL,
} from "@/lib/hifpb-parser";
import {
  hifpbWeekdays,
  type HifpbClass,
  type HifpbSchedule,
  type HifpbWeekday,
} from "@/types/hifpb";
import type { AcademicProfileValues } from "@/types/academic-profile";

export const metadata: Metadata = {
  title: "Mecânica II e perfil acadêmico",
};

const weekdayLabels: Record<HifpbWeekday, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
};

function getToday() {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
  })
    .format(new Date())
    .toLocaleLowerCase("en-US");

  return hifpbWeekdays.find((day) => day === weekday) ?? null;
}

function ClassDetails({ academicClass, compact = false }: { academicClass: HifpbClass; compact?: boolean }) {
  return (
    <article className={compact ? "hifpb-class hifpb-class-compact" : "hifpb-class"}>
      <strong>{formatHifpbSubjectName(academicClass.subject)}</strong>
      <span>
        {academicClass.professorUrl ? (
          <a href={academicClass.professorUrl} rel="noreferrer" target="_blank">
            {academicClass.professor}
          </a>
        ) : (
          academicClass.professor
        )}
      </span>
      {academicClass.room ? (
        <small>
          {academicClass.roomUrl ? (
            <a href={academicClass.roomUrl} rel="noreferrer" target="_blank">
              {academicClass.room}
            </a>
          ) : (
            academicClass.room
          )}
        </small>
      ) : null}
    </article>
  );
}

function HifpbUnavailable({
  profile,
  user,
}: {
  profile: AcademicProfileValues;
  user: { name?: string | null; email?: string | null };
}) {
  return (
    <ProtectedShell active="schedule" user={user}>
      <div className="protected-main schedule-page-main">
        <span className="protected-kicker">Integração pública · hIFPB</span>
        <h1>Mecânica II</h1>
        <section className="hifpb-unavailable" role="status">
          <span className="protected-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3 2.8 19h18.4z" /><path d="M12 9v4M12 16.5h.01" /></svg>
          </span>
          <div>
            <h2>O hIFPB está temporariamente indisponível</h2>
            <p>A conexão pública não respondeu agora. Você pode tentar novamente ou abrir a grade oficial diretamente.</p>
            <div className="hifpb-action-row">
              <Link className="primary-action" href="/horarios">Tentar novamente</Link>
              <a className="secondary-action" href={HIFPB_MECANICA_URL} rel="noreferrer" target="_blank">Abrir hIFPB</a>
            </div>
          </div>
        </section>
        <AcademicProfileSection profile={profile} />
      </div>
    </ProtectedShell>
  );
}

function TodaySchedule({ schedule }: { schedule: HifpbSchedule }) {
  const today = getToday();
  const classes = today
    ? schedule.slots.filter((slot) => slot.classes[today].length > 0)
    : [];

  return (
    <section className="hifpb-today" aria-labelledby="hifpb-today-title">
      <div className="hifpb-section-heading">
        <div>
          <span>Visão rápida</span>
          <h2 id="hifpb-today-title">Aulas de hoje</h2>
        </div>
        {today ? <strong>{weekdayLabels[today]}</strong> : <strong>Fim de semana</strong>}
      </div>

      {classes.length === 0 ? (
        <p className="hifpb-empty-day">Não há aulas da turma na grade de hoje.</p>
      ) : (
        <div className="hifpb-today-list">
          {classes.map((slot) => (
            <div className="hifpb-today-slot" key={slot.time}>
              <time>{slot.time}</time>
              <div>
                {slot.classes[today!].map((academicClass, index) => (
                  <ClassDetails
                    academicClass={academicClass}
                    key={`${academicClass.subject}-${academicClass.professor}-${index}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");

  let schedule: HifpbSchedule;

  try {
    schedule = filterHifpbScheduleByGroup(
      await getMecanicaSecondYearSchedule(),
      "G1",
    );
  } catch {
    return <HifpbUnavailable profile={profile} user={session.user} />;
  }

  return (
    <ProtectedShell active="schedule" user={session.user}>
      <div className="protected-main schedule-page-main">
        <span className="protected-kicker">Integração pública · hIFPB</span>
        <h1>Mecânica II</h1>
        <p className="protected-lead">
          Sua grade oficial do G1, com professores, salas e laboratórios. Apenas as aulas do seu grupo são exibidas.
        </p>

        <section className="hifpb-summary" aria-label="Resumo da grade importada">
          <div><span>Semestre</span><strong>{schedule.semester}</strong><small>Grupo G1 · Campus João Pessoa</small></div>
          <div><span>Disciplinas</span><strong>{schedule.subjects.length}</strong><small>na grade atual</small></div>
          <div><span>Professores</span><strong>{schedule.professors.length}</strong><small>com perfil público</small></div>
        </section>

        <div className="hifpb-source-note">
          <span className="hifpb-live-dot" aria-hidden="true" />
          <p>Dados públicos consultados no hIFPB e atualizados automaticamente a cada hora.</p>
          <a href={schedule.sourceUrl} rel="noreferrer" target="_blank">Conferir fonte oficial</a>
        </div>

        <TodaySchedule schedule={schedule} />

        <section className="hifpb-week" aria-labelledby="hifpb-week-title">
          <div className="hifpb-section-heading">
            <div>
              <span>Grade completa</span>
              <h2 id="hifpb-week-title">Semana de Mecânica II</h2>
            </div>
          </div>
          <div className="hifpb-table-scroll" role="region" aria-label="Grade semanal" tabIndex={0}>
            <table className="hifpb-table">
              <thead>
                <tr>
                  <th scope="col">Horário</th>
                  {hifpbWeekdays.map((weekday) => <th scope="col" key={weekday}>{weekdayLabels[weekday]}</th>)}
                </tr>
              </thead>
              <tbody>
                {schedule.slots.map((slot) => (
                  <tr key={slot.time}>
                    <th scope="row">{slot.time}</th>
                    {hifpbWeekdays.map((weekday) => (
                      <td key={weekday}>
                        {slot.classes[weekday].map((academicClass, index) => (
                          <ClassDetails
                            academicClass={academicClass}
                            compact
                            key={`${academicClass.subject}-${academicClass.professor}-${index}`}
                          />
                        ))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hifpb-mobile-week" aria-label="Grade semanal em cartões">
            {hifpbWeekdays.map((weekday) => {
              const daySlots = schedule.slots.filter(
                (slot) => slot.classes[weekday].length > 0,
              );

              return (
                <section className="hifpb-mobile-day" key={weekday}>
                  <h3>{weekdayLabels[weekday]}</h3>
                  {daySlots.length === 0 ? (
                    <p>Sem aulas.</p>
                  ) : (
                    <div>
                      {daySlots.map((slot) => (
                        <div className="hifpb-mobile-slot" key={slot.time}>
                          <time>{slot.time}</time>
                          <div>
                            {slot.classes[weekday].map((academicClass, index) => (
                              <ClassDetails
                                academicClass={academicClass}
                                key={`${academicClass.subject}-${academicClass.professor}-${index}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>

        <section className="hifpb-professors" aria-labelledby="hifpb-professors-title">
          <div className="hifpb-section-heading">
            <div>
              <span>Equipe docente</span>
              <h2 id="hifpb-professors-title">Professores da turma</h2>
            </div>
          </div>
          <div className="hifpb-professor-grid">
            {schedule.professors.map((professor) => (
              <article className="hifpb-professor-card" key={professor.profileUrl ?? professor.name}>
                <span>{professor.name.slice(0, 1)}</span>
                <div>
                  <h3>{professor.name}</h3>
                  <p>{professor.subjects.map(formatHifpbSubjectName).join(" · ")}</p>
                  {professor.profileUrl ? (
                    <a href={professor.profileUrl} rel="noreferrer" target="_blank">Ver horário no hIFPB</a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <AcademicProfileSection profile={profile} />

      </div>
    </ProtectedShell>
  );
}
