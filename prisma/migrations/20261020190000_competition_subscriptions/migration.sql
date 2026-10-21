CREATE TABLE "competition_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "competition_id" VARCHAR(100) NOT NULL,
    "reminders_enabled" BOOLEAN NOT NULL DEFAULT false,
    "include_qualified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "competition_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "competition_subscriptions_user_id_competition_id_key"
ON "competition_subscriptions"("user_id", "competition_id");
ALTER TABLE "competition_subscriptions" ADD CONSTRAINT "competition_subscriptions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
