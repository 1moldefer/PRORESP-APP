-- Adiciona campo de óbito na tabela patients

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS deceased BOOLEAN DEFAULT FALSE;
