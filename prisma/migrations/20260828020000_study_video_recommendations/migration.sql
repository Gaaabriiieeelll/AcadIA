-- CreateTable
CREATE TABLE "study_video_recommendations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "topic" VARCHAR(180) NOT NULL,
    "rationale" VARCHAR(600) NOT NULL,
    "search_query" VARCHAR(250) NOT NULL,
    "source_material_title" VARCHAR(200) NOT NULL,
    "average_score" DECIMAL(5,2),
    "youtube_video_id" VARCHAR(32) NOT NULL,
    "video_title" VARCHAR(240) NOT NULL,
    "channel_title" VARCHAR(180) NOT NULL,
    "thumbnail_url" TEXT NOT NULL,
    "video_published_at" TIMESTAMP(3),
    "model" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_video_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "study_video_recommendations_user_id_youtube_video_id_key"
ON "study_video_recommendations"("user_id", "youtube_video_id");

-- CreateIndex
CREATE INDEX "study_video_recommendations_user_id_created_at_idx"
ON "study_video_recommendations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "study_video_recommendations_subject_id_idx"
ON "study_video_recommendations"("subject_id");

-- AddForeignKey
ALTER TABLE "study_video_recommendations"
ADD CONSTRAINT "study_video_recommendations_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_video_recommendations"
ADD CONSTRAINT "study_video_recommendations_subject_id_fkey"
FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
