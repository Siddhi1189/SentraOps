-- AlterTable
ALTER TABLE "incidents" ADD COLUMN "acknowledged_at" TIMESTAMPTZ,
ADD COLUMN "acknowledged_by_user_id" UUID;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_acknowledged_by_user_id_fkey" FOREIGN KEY ("acknowledged_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
