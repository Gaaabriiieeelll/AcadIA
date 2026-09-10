CREATE TABLE "notice_checklist_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "notice_key" VARCHAR(80) NOT NULL,
    "item_key" VARCHAR(80) NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notice_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notice_checklist_items_user_id_notice_key_item_key_key"
ON "notice_checklist_items"("user_id", "notice_key", "item_key");

CREATE INDEX "notice_checklist_items_user_id_notice_key_idx"
ON "notice_checklist_items"("user_id", "notice_key");

ALTER TABLE "notice_checklist_items"
ADD CONSTRAINT "notice_checklist_items_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
