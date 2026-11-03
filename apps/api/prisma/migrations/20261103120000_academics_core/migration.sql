-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('upcoming', 'active', 'archived');

-- CreateEnum
CREATE TYPE "TermStatus" AS ENUM ('upcoming', 'active', 'completed');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('mandatory', 'elective');

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ(3) NOT NULL,
    "end_date" TIMESTAMPTZ(3) NOT NULL,
    "status" "AcademicYearStatus" NOT NULL DEFAULT 'upcoming',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academic_years_id_school_id_key" UNIQUE ("id", "school_id"),
    CONSTRAINT "academic_years_school_id_name_key" UNIQUE ("school_id", "name"),
    CONSTRAINT "academic_years_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "terms" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ(3) NOT NULL,
    "end_date" TIMESTAMPTZ(3) NOT NULL,
    "status" "TermStatus" NOT NULL DEFAULT 'upcoming',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "terms_id_school_id_key" UNIQUE ("id", "school_id"),
    CONSTRAINT "terms_academic_year_id_name_key" UNIQUE ("academic_year_id", "name"),
    CONSTRAINT "terms_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "terms_academic_year_fkey" FOREIGN KEY ("academic_year_id", "school_id") REFERENCES "academic_years"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "classes_id_school_id_key" UNIQUE ("id", "school_id"),
    CONSTRAINT "classes_school_id_name_key" UNIQUE ("school_id", "name"),
    CONSTRAINT "classes_school_id_code_key" UNIQUE ("school_id", "code"),
    CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sections_id_school_id_key" UNIQUE ("id", "school_id"),
    CONSTRAINT "sections_class_id_name_key" UNIQUE ("class_id", "name"),
    CONSTRAINT "sections_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sections_class_fkey" FOREIGN KEY ("class_id", "school_id") REFERENCES "classes"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL DEFAULT 'mandatory',
    "credit_hours" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subjects_school_id_code_key" UNIQUE ("school_id", "code"),
    CONSTRAINT "subjects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndexes
CREATE INDEX "academic_years_school_id_status_idx" ON "academic_years"("school_id", "status");
CREATE INDEX "terms_school_id_idx" ON "terms"("school_id");
CREATE INDEX "terms_academic_year_id_idx" ON "terms"("academic_year_id");
CREATE INDEX "classes_school_id_idx" ON "classes"("school_id");
CREATE INDEX "sections_school_id_idx" ON "sections"("school_id");
CREATE INDEX "sections_class_id_idx" ON "sections"("class_id");
CREATE INDEX "subjects_school_id_idx" ON "subjects"("school_id");

-- Enable Row Level Security and grant app/system roles
SELECT app.enable_tenant_rls('academic_years');
GRANT SELECT, INSERT, UPDATE, DELETE ON academic_years TO eduflow_app, eduflow_system;

SELECT app.enable_tenant_rls('terms');
GRANT SELECT, INSERT, UPDATE, DELETE ON terms TO eduflow_app, eduflow_system;

SELECT app.enable_tenant_rls('classes');
GRANT SELECT, INSERT, UPDATE, DELETE ON classes TO eduflow_app, eduflow_system;

SELECT app.enable_tenant_rls('sections');
GRANT SELECT, INSERT, UPDATE, DELETE ON sections TO eduflow_app, eduflow_system;

SELECT app.enable_tenant_rls('subjects');
GRANT SELECT, INSERT, UPDATE, DELETE ON subjects TO eduflow_app, eduflow_system;
