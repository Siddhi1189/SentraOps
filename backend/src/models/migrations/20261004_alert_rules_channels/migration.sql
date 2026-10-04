-- CreateEnum
CREATE TYPE "AlertRuleTrigger" AS ENUM ('service_down_consecutive_failures', 'new_issue_in_environment', 'event_rate_threshold', 'response_time_threshold');

-- CreateTable
CREATE TABLE "alert_channels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "type" "NotificationChannel" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "trigger" "AlertRuleTrigger" NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "service_id" UUID,
    "project_id" UUID,
    "cooldown_seconds" INTEGER NOT NULL DEFAULT 300,
    "snoozed_until" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rule_fires" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rule_id" UUID NOT NULL,
    "fired_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" JSONB DEFAULT '{}',

    CONSTRAINT "alert_rule_fires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AlertRuleChannels" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE INDEX "idx_alert_channels_org_id" ON "alert_channels"("organization_id");

-- CreateIndex
CREATE INDEX "idx_alert_rules_org_id" ON "alert_rules"("organization_id");

-- CreateIndex
CREATE INDEX "idx_alert_rules_service_id" ON "alert_rules"("service_id");

-- CreateIndex
CREATE INDEX "idx_alert_rules_project_id" ON "alert_rules"("project_id");

-- CreateIndex
CREATE INDEX "idx_alert_rule_fires_rule_fired" ON "alert_rule_fires"("rule_id", "fired_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "_AlertRuleChannels_AB_unique" ON "_AlertRuleChannels"("A", "B");

-- CreateIndex
CREATE INDEX "_AlertRuleChannels_B_index" ON "_AlertRuleChannels"("B");

-- AddForeignKey
ALTER TABLE "alert_channels" ADD CONSTRAINT "alert_channels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rule_fires" ADD CONSTRAINT "alert_rule_fires_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "alert_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlertRuleChannels" ADD CONSTRAINT "_AlertRuleChannels_A_fkey" FOREIGN KEY ("A") REFERENCES "alert_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlertRuleChannels" ADD CONSTRAINT "_AlertRuleChannels_B_fkey" FOREIGN KEY ("B") REFERENCES "alert_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
