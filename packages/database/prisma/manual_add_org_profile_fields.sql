ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "logo" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "motto" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "vision" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "mission" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "establishedYear" INTEGER;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "patientServedCount" INTEGER;

ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "icon" TEXT;

ALTER TABLE "EmployeeInvitation" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'EmployeeInvitation_departmentId_fkey'
  ) THEN
    ALTER TABLE "EmployeeInvitation"
      ADD CONSTRAINT "EmployeeInvitation_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "EmployeeInvitation_departmentId_idx"
  ON "EmployeeInvitation"("departmentId");
