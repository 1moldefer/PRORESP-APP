-- Adiciona campos de controle de Alta do Projeto na tabela patients

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discharge_reason TEXT,
ADD COLUMN IF NOT EXISTS in_project BOOLEAN DEFAULT TRUE;

-- Opcional: Atualizar pacientes existentes para in_project = true se estiver nulo
UPDATE patients SET in_project = TRUE WHERE in_project IS NULL;
