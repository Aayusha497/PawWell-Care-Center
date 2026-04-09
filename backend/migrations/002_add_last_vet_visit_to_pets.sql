-- Add last_vet_visit column to pets table
ALTER TABLE pets ADD COLUMN IF NOT EXISTS last_vet_visit TIMESTAMPTZ(6) NULL;

-- Create index for last_vet_visit for better query performance
CREATE INDEX IF NOT EXISTS idx_pets_last_vet_visit ON pets(last_vet_visit);
