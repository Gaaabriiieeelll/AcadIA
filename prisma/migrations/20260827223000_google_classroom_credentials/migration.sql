-- CreateTable
CREATE TABLE "google_classroom_credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "encrypted_access_token" TEXT NOT NULL,
    "encrypted_refresh_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "granted_scopes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_classroom_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_classroom_credentials_user_id_key" ON "google_classroom_credentials"("user_id");

-- AddForeignKey
ALTER TABLE "google_classroom_credentials" ADD CONSTRAINT "google_classroom_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
