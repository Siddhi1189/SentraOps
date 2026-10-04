-- CreateTable
CREATE TABLE "status_subscribers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "confirm_token" VARCHAR(255) NOT NULL,
    "unsubscribe_token" VARCHAR(255) NOT NULL,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "status_subscribers_confirm_token_key" ON "status_subscribers"("confirm_token");

-- CreateIndex
CREATE UNIQUE INDEX "status_subscribers_unsubscribe_token_key" ON "status_subscribers"("unsubscribe_token");

-- CreateIndex
CREATE UNIQUE INDEX "status_subscribers_organization_id_email_key" ON "status_subscribers"("organization_id", "email");

-- CreateIndex
CREATE INDEX "status_subscribers_organization_id_idx" ON "status_subscribers"("organization_id");

-- CreateIndex
CREATE INDEX "status_subscribers_confirm_token_idx" ON "status_subscribers"("confirm_token");

-- CreateIndex
CREATE INDEX "status_subscribers_unsubscribe_token_idx" ON "status_subscribers"("unsubscribe_token");

-- AddForeignKey
ALTER TABLE "status_subscribers" ADD CONSTRAINT "status_subscribers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
