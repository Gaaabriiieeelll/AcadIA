-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "google_subject" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "registration_number" VARCHAR(30) NOT NULL,
    "campus" VARCHAR(100) NOT NULL,
    "course" VARCHAR(160) NOT NULL,
    "class_group" VARCHAR(50),
    "academic_stage" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_subject_key" ON "users"("google_subject");

-- CreateIndex
CREATE UNIQUE INDEX "academic_profiles_user_id_key" ON "academic_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_profiles_registration_number_key" ON "academic_profiles"("registration_number");

-- AddForeignKey
ALTER TABLE "academic_profiles" ADD CONSTRAINT "academic_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
