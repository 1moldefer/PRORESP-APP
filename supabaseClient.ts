
import { createClient } from '@supabase/supabase-js';

// Access environment variables securely
// Note: In a real Vite app, these should be in .env and accessed via import.meta.env
// checking if we can use process.env or just hardcode for this session as requested "CONECTE"
// I will use hardcoded values here to ensure immediate functionality without dealing with .env reloading issues
// but I will comment on how to do it properly.

const supabaseUrl = 'https://qhycrmwizbavnicjgoqq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeWNybXdpemJhdm5pY2pnb3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDgwNzQsImV4cCI6MjA4MTk4NDA3NH0.pqD8uT6BDOoh9yDP1z6s8Q8yKjzWVeIwSMA82AdzZUo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
