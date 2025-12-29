-- Migration: Add project status fields to patients table
-- This migration adds fields to track patient admission, discharge, and project status

-- Add new columns to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS in_project BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS admission_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discharge_reason TEXT;

-- Set admission_date to created_at for existing patients (if not already set)
UPDATE patients
SET admission_date = created_at
WHERE admission_date IS NULL AND created_at IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_in_project ON patients(in_project);
CREATE INDEX IF NOT EXISTS idx_patients_admission_date ON patients(admission_date);
CREATE INDEX IF NOT EXISTS idx_patients_discharge_date ON patients(discharge_date);

-- Add comment to document the fields
COMMENT ON COLUMN patients.in_project IS 'Indicates if the patient is currently active in the project';
COMMENT ON COLUMN patients.admission_date IS 'Date when the patient was admitted to the project';
COMMENT ON COLUMN patients.discharge_date IS 'Date when the patient was discharged from the project';
COMMENT ON COLUMN patients.discharge_reason IS 'Reason for patient discharge from the project';
