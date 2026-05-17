-- Add `school_ids` column to `teachers` table for multi-school support
BEGIN TRANSACTION;
ALTER TABLE teachers ADD COLUMN school_ids TEXT NOT NULL DEFAULT '[]';
COMMIT;
