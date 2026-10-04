-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('node', 'browser', 'other');

-- CreateEnum
CREATE TYPE "ErrorLevel" AS ENUM ('error', 'warning', 'info');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('unresolved', 'resolved', 'ignored');

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "platform" "PlatformType" NOT NULL DEFAULT 'node',
    "environment_default" "EnvironmentType" NOT NULL DEFAULT 'production',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "key_prefix" VARCHAR(16) NOT NULL,
    "key_hash" VARCHAR(64) NOT NULL,
    "last_used_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "fingerprint" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "level" "ErrorLevel" NOT NULL DEFAULT 'error',
    "status" "IssueStatus" NOT NULL DEFAULT 'unresolved',
    "environment" VARCHAR(50) NOT NULL DEFAULT 'production',
    "first_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_count" INTEGER NOT NULL DEFAULT 1,
    "user_count" INTEGER NOT NULL DEFAULT 0,
    "assigned_user_id" UUID,
    "resolved_at" TIMESTAMPTZ,
    "resolved_in_release" VARCHAR(100),
    "is_regression" BOOLEAN NOT NULL DEFAULT false,
    "linked_incident_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "issue_id" UUID,
    "type" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "environment" VARCHAR(50) NOT NULL DEFAULT 'production',
    "release" VARCHAR(100),
    "level" "ErrorLevel" NOT NULL DEFAULT 'error',
    "tags" JSONB DEFAULT '{}',
    "breadcrumbs" JSONB DEFAULT '[]',
    "user" JSONB,
    "request" JSONB,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_projects_org_id" ON "projects"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_organization_id_name_key" ON "projects"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "idx_api_keys_key_hash" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "idx_api_keys_project_id" ON "api_keys"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "issues_project_id_fingerprint_environment_key" ON "issues"("project_id", "fingerprint", "environment");

-- CreateIndex
CREATE INDEX "idx_issues_org_status_last_seen" ON "issues"("organization_id", "status", "last_seen_at" DESC);

-- CreateIndex
CREATE INDEX "idx_issues_project_id" ON "issues"("project_id");

-- CreateIndex
CREATE INDEX "idx_error_events_project_occurred" ON "error_events"("project_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_error_events_issue_occurred" ON "error_events"("issue_id", "occurred_at" DESC);

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_linked_incident_id_fkey" FOREIGN KEY ("linked_incident_id") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_events" ADD CONSTRAINT "error_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_events" ADD CONSTRAINT "error_events_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
