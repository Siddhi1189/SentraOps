-- CreateTable
CREATE TABLE "releases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "version" VARCHAR(100) NOT NULL,
    "commit_sha" VARCHAR(100),
    "deployed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "environment" VARCHAR(50) NOT NULL DEFAULT 'production',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- AddColumn to error_events
ALTER TABLE "error_events" ADD COLUMN "release_id" UUID;

-- AddColumn to issues
ALTER TABLE "issues" ADD COLUMN "regressed_in_release" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "uq_releases_project_version_env" ON "releases"("project_id", "version", "environment");

-- CreateIndex
CREATE INDEX "idx_releases_project_id" ON "releases"("project_id");

-- CreateIndex
CREATE INDEX "idx_error_events_release_id" ON "error_events"("release_id");

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_events" ADD CONSTRAINT "error_events_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
