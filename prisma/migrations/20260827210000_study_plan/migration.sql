-- CreateEnum
CREATE TYPE "StudySessionStatus" AS ENUM ('PLANNED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StudySessionSource" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateTable
CREATE TABLE "study_plan_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "weekly_goal_minutes" SMALLINT NOT NULL DEFAULT 300,
    "session_duration" SMALLINT NOT NULL DEFAULT 50,
    "break_duration" SMALLINT NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plan_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "study_plan_preferences_weekly_goal_check" CHECK ("weekly_goal_minutes" BETWEEN 30 AND 1200),
    CONSTRAINT "study_plan_preferences_session_duration_check" CHECK ("session_duration" BETWEEN 20 AND 180),
    CONSTRAINT "study_plan_preferences_break_duration_check" CHECK ("break_duration" BETWEEN 0 AND 60)
);

-- CreateTable
CREATE TABLE "study_availabilities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "weekday" SMALLINT NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_availabilities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "study_availabilities_weekday_check" CHECK ("weekday" BETWEEN 1 AND 7),
    CONSTRAINT "study_availabilities_time_order_check" CHECK ("start_time" < "end_time")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "duration_minutes" SMALLINT NOT NULL,
    "focus" VARCHAR(160),
    "rationale" VARCHAR(700) NOT NULL,
    "priority_score" SMALLINT NOT NULL DEFAULT 0,
    "status" "StudySessionStatus" NOT NULL DEFAULT 'PLANNED',
    "source" "StudySessionSource" NOT NULL DEFAULT 'MANUAL',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "study_sessions_duration_check" CHECK ("duration_minutes" BETWEEN 20 AND 180),
    CONSTRAINT "study_sessions_priority_check" CHECK ("priority_score" BETWEEN 0 AND 1000)
);

-- CreateIndex
CREATE UNIQUE INDEX "study_plan_preferences_user_id_key" ON "study_plan_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_availabilities_user_id_weekday_key" ON "study_availabilities"("user_id", "weekday");

-- CreateIndex
CREATE INDEX "study_availabilities_user_id_idx" ON "study_availabilities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_sessions_user_id_scheduled_date_start_time_key" ON "study_sessions"("user_id", "scheduled_date", "start_time");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_scheduled_date_idx" ON "study_sessions"("user_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "study_sessions_subject_id_idx" ON "study_sessions"("subject_id");

-- AddForeignKey
ALTER TABLE "study_plan_preferences" ADD CONSTRAINT "study_plan_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_availabilities" ADD CONSTRAINT "study_availabilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
