CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
