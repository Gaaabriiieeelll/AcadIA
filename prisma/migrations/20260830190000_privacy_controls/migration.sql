CREATE TABLE "privacy_consents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "version" VARCHAR(30) NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "privacy_consents_user_id_purpose_version_key"
ON "privacy_consents"("user_id", "purpose", "version");

CREATE INDEX "privacy_consents_user_id_purpose_revoked_at_idx"
ON "privacy_consents"("user_id", "purpose", "revoked_at");

ALTER TABLE "privacy_consents"
ADD CONSTRAINT "privacy_consents_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
