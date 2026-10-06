-- CreateEnum
CREATE TYPE "MonitorType" AS ENUM ('http', 'heartbeat');

-- AlterEnum
ALTER TYPE "AlertRuleTrigger" ADD VALUE 'ssl_expiration_warning';

-- AlterTable
ALTER TABLE "services" ADD COLUMN "monitor_type" "MonitorType" NOT NULL DEFAULT 'http',
ADD COLUMN "request_headers" JSONB,
ADD COLUMN "request_body" TEXT,
ADD COLUMN "assertions" JSONB DEFAULT '[]',
ADD COLUMN "heartbeat_token" VARCHAR(64),
ADD COLUMN "heartbeat_interval_seconds" INTEGER,
ADD COLUMN "heartbeat_grace_seconds" INTEGER,
ADD COLUMN "last_heartbeat_at" TIMESTAMPTZ,
ALTER COLUMN "url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "health_checks" ADD COLUMN "ssl_days_remaining" INTEGER,
ADD COLUMN "failed_assertion" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "services_heartbeat_token_key" ON "services"("heartbeat_token");

-- CreateIndex
CREATE INDEX "idx_services_heartbeat_token" ON "services"("heartbeat_token");
