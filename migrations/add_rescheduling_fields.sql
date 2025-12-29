-- Migration: Add rescheduling tracking fields to appointments table
-- This migration adds fields to track appointment rescheduling history

-- Add new columns to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_rescheduled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS previous_date DATE,
ADD COLUMN IF NOT EXISTS previous_time TIME,
ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
ADD COLUMN IF NOT EXISTS rescheduled_from_id UUID REFERENCES appointments(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_is_rescheduled ON appointments(is_rescheduled);
CREATE INDEX IF NOT EXISTS idx_appointments_rescheduled_from ON appointments(rescheduled_from_id);

-- Add comment to document the fields
COMMENT ON COLUMN appointments.is_rescheduled IS 'Indicates if this appointment was rescheduled from a previous date';
COMMENT ON COLUMN appointments.previous_date IS 'The original date before rescheduling';
COMMENT ON COLUMN appointments.previous_time IS 'The original time before rescheduling';
COMMENT ON COLUMN appointments.reschedule_reason IS 'Reason for rescheduling the appointment';
COMMENT ON COLUMN appointments.rescheduled_from_id IS 'Reference to the original appointment that was rescheduled';
