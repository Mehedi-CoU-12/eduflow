-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "admission_number" TEXT NOT NULL,
    "roll_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "student_profiles_id_school_id_key" UNIQUE ("id", "school_id"),
    CONSTRAINT "student_profiles_user_id_key" UNIQUE ("user_id"),
    CONSTRAINT "student_profiles_school_id_admission_number_key" UNIQUE ("school_id", "admission_number"),
    CONSTRAINT "student_profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_profiles_class_fkey" FOREIGN KEY ("class_id", "school_id") REFERENCES "classes"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_profiles_section_fkey" FOREIGN KEY ("section_id", "school_id") REFERENCES "sections"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guardian_students" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID NOT NULL,
    "guardian_user_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'Parent',
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardian_students_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "guardian_students_id_school_id_key" UNIQUE ("id", "school_id"),
    CONSTRAINT "guardian_students_school_id_guardian_user_id_student_id_key" UNIQUE ("school_id", "guardian_user_id", "student_id"),
    CONSTRAINT "guardian_students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guardian_students_guardian_user_id_fkey" FOREIGN KEY ("guardian_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guardian_students_student_fkey" FOREIGN KEY ("student_id", "school_id") REFERENCES "student_profiles"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID NOT NULL,
    "teacher_user_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "subject_id" UUID,
    "is_class_teacher" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "teacher_assignments_id_school_id_key" UNIQUE ("id", "school_id"),
    CONSTRAINT "teacher_assignments_school_id_teacher_user_id_section_id_subject_id_key" UNIQUE ("school_id", "teacher_user_id", "section_id", "subject_id"),
    CONSTRAINT "teacher_assignments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teacher_assignments_teacher_user_id_fkey" FOREIGN KEY ("teacher_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teacher_assignments_section_fkey" FOREIGN KEY ("section_id", "school_id") REFERENCES "sections"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teacher_assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndexes
CREATE INDEX "student_profiles_school_id_idx" ON "student_profiles"("school_id");
CREATE INDEX "student_profiles_class_id_idx" ON "student_profiles"("class_id");
CREATE INDEX "student_profiles_section_id_idx" ON "student_profiles"("section_id");

CREATE INDEX "guardian_students_school_id_idx" ON "guardian_students"("school_id");
CREATE INDEX "guardian_students_guardian_user_id_idx" ON "guardian_students"("guardian_user_id");
CREATE INDEX "guardian_students_student_id_idx" ON "guardian_students"("student_id");

CREATE INDEX "teacher_assignments_school_id_idx" ON "teacher_assignments"("school_id");
CREATE INDEX "teacher_assignments_teacher_user_id_idx" ON "teacher_assignments"("teacher_user_id");
CREATE INDEX "teacher_assignments_section_id_idx" ON "teacher_assignments"("section_id");

-- Enable Row Level Security and grant app/system roles
SELECT app.enable_tenant_rls('student_profiles');
GRANT SELECT, INSERT, UPDATE, DELETE ON student_profiles TO eduflow_app, eduflow_system;

SELECT app.enable_tenant_rls('guardian_students');
GRANT SELECT, INSERT, UPDATE, DELETE ON guardian_students TO eduflow_app, eduflow_system;

SELECT app.enable_tenant_rls('teacher_assignments');
GRANT SELECT, INSERT, UPDATE, DELETE ON teacher_assignments TO eduflow_app, eduflow_system;
