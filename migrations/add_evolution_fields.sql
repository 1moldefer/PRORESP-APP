-- Migration: Add clinical evolution fields to appointments table

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS culture_exam_result TEXT,
ADD COLUMN IF NOT EXISTS isolation_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS diagnosis TEXT,
ADD COLUMN IF NOT EXISTS therapeutic_plan TEXT,
ADD COLUMN IF NOT EXISTS return_recommendations TEXT;

-- Documentation
COMMENT ON COLUMN appointments.weight IS 'Patient weight recorded during consultation';
COMMENT ON COLUMN appointments.culture_exam_result IS 'Result of culture exam';
COMMENT ON COLUMN appointments.isolation_active IS 'If patient needs isolation';
COMMENT ON COLUMN appointments.diagnosis IS 'Clinical diagnosis';
COMMENT ON COLUMN appointments.therapeutic_plan IS 'Therapeutic plan defined';
COMMENT ON COLUMN appointments.return_recommendations IS 'Recommendations for return';
