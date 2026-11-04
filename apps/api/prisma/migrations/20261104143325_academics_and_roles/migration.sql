-- RenameForeignKey
ALTER TABLE "guardian_students" RENAME CONSTRAINT "guardian_students_student_fkey" TO "guardian_students_student_id_school_id_fkey";

-- RenameForeignKey
ALTER TABLE "sections" RENAME CONSTRAINT "sections_class_fkey" TO "sections_class_id_school_id_fkey";

-- RenameForeignKey
ALTER TABLE "student_profiles" RENAME CONSTRAINT "student_profiles_class_fkey" TO "student_profiles_class_id_school_id_fkey";

-- RenameForeignKey
ALTER TABLE "student_profiles" RENAME CONSTRAINT "student_profiles_section_fkey" TO "student_profiles_section_id_school_id_fkey";

-- RenameForeignKey
ALTER TABLE "teacher_assignments" RENAME CONSTRAINT "teacher_assignments_section_fkey" TO "teacher_assignments_section_id_school_id_fkey";

-- RenameForeignKey
ALTER TABLE "terms" RENAME CONSTRAINT "terms_academic_year_fkey" TO "terms_academic_year_id_school_id_fkey";

-- RenameIndex
ALTER INDEX "teacher_assignments_school_id_teacher_user_id_section_id_subjec" RENAME TO "teacher_assignments_school_id_teacher_user_id_section_id_su_key";
