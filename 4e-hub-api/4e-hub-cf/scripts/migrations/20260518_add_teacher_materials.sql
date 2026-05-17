-- Add `materials` column to `teachers` table for teacher-owned materials
BEGIN TRANSACTION;
ALTER TABLE teachers ADD COLUMN materials TEXT NOT NULL DEFAULT '[]';
COMMIT;
