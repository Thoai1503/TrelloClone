ALTER TABLE `cards`
  ADD COLUMN `is_completed` BOOLEAN NOT NULL DEFAULT false;

UPDATE `cards`
SET `is_completed` = (`completed_at` IS NOT NULL);
