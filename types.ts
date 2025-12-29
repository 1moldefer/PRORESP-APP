
export interface Patient {
  id: string;
  name: string;
  age: string;
  birthDate: string;
  motherName: string;
  cpf?: string;
  susCard: string;
  tracheostomyActive: boolean;
  homecareActive: boolean;
  avatarUrl?: string;
  createdAt?: string; // Data de cadastro
  address?: string;
  addressNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  phone?: string;
  // Extended fields
  gender?: string;
  medical_record?: string;
  address_complement?: string;
  social_network?: string;
  birth_type?: string;
  apgar?: string;
  cephalic_perimeter?: string;
  birth_weight?: string;
  gestational_age?: string;
  torch_serology?: string;
  prenatal_complications?: string;
  delivery_room_maneuvers?: string;
  intubation_date?: string;
  intubation_time?: string;
  extubation_failure?: string;
  accidental_extubation?: string;
  intubation_cause?: string;
  pcr?: boolean;
  severe_hypoxia?: boolean;
  urgent_tqt?: boolean;
  difficult_airway?: boolean;
  congenital_stridor?: string;
  previous_surgery?: string;
  comorbidities_cardiac?: string;
  comorbidities_digestive?: string;
  comorbidities_neurological?: string;
  comorbidities_infectious?: string;
  comorbidities_genetic?: string;
  comorbidities_osteoarticular?: string;
  comorbidities_infectious_date?: string;
  tracheostomy_clinical_history?: string;
  dysphagia?: string;
  hypersialorrhea?: string;
  recurrent_pneumonia?: string;
  cannula_type?: string;
  severe_complications?: string;
  bronchoscopy_nostril?: string;
  nasal_septum_deviation?: string;
  piriform_aperture_stenosis?: string;
  choanal_atresia?: string;
  nasal_stenosis?: string;
  rhinopharynx?: string;
  oropharynx?: string;
  larynx_preserved?: boolean;
  larynx_arytenoid_redundancy?: boolean;
  larynx_short_aryepiglottic_ligaments?: boolean;
  larynx_omega_epiglottis?: boolean;
  larynx_epiglottoptosis?: boolean;
  larynx_laryngomalacia?: boolean;
  larynx_vocal_fold_paralysis?: string;
  larynx_vocal_fold_paralysis_position?: string;
  larynx_vocal_nodules?: boolean;
  larynx_web?: string;
  larynx_posterior_glottic_stenosis?: boolean;
  morphological_findings?: string;
  glossoptosis?: boolean;
  valecula?: string;
  piriform_sinus?: string;
  updated_at?: string;
  // Project status fields
  in_project?: boolean; // Se o paciente está ativo no projeto
  admission_date?: string; // Data de admissão no projeto (pode ser diferente de createdAt)
  discharge_date?: string; // Data de alta do projeto
  discharge_reason?: string; // Motivo da alta
  deceased?: boolean; // Se o paciente foi a óbito
  origin_hospital?: string; // Hospital de Origem
  medical_record_date?: string; // Data de Registro do Prontuário
  hasPendingAppointment?: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'Pendente' | 'Confirmado' | 'Em Atendimento' | 'Realizada' | 'Cancelado' | 'Agendada' | 'Cancelada'; // Extended for DB compatibility
  color: string;
  cancellation_reason?: string;
  // Evolution fields
  weight?: string;
  culture_exam_result?: string;
  isolation_active?: boolean;
  diagnosis?: string;
  therapeutic_plan?: string;
  return_recommendations?: string;
  // Rescheduling fields
  is_rescheduled?: boolean;        // Se foi reagendado
  previous_date?: string;           // Data anterior do agendamento
  previous_time?: string;           // Hora anterior do agendamento
  reschedule_reason?: string;       // Motivo do reagendamento
  rescheduled_from_id?: string;     // ID do agendamento original
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  status: 'Ativo' | 'Inativo';
}

export interface City {
  id: string;
  name: string;
  uf: string;
  status: 'Ativo' | 'Inativo';
}

export interface Location {
  id: string;
  name: string;
  address: string;
  status: 'Ativo' | 'Inativo';
}

export interface DashboardStats {
  total: number;
  realized: number;
  missed: number;
  missedRate: string;
  totalDeaths: number;
  totalDischarges: number;
}

export interface DistributionStat {
  name: string;
  count: number;
  percent: number;
}

export interface AppointmentWithDetails extends Appointment {
  doctors?: { name: string; specialty?: string };
  patients?: { name: string; avatar_url?: string; city?: string; birthDate?: string };
}

export interface MonthlySeriesData {
  month: string; // "Jan", "Fev"... or "YYYY-MM"
  total: number;
  realized: number;
  missed: number;
  newPatients: number;
  deaths: number;
  discharges: number;
}

export interface AgeDistribution {
  range: string; // "0-1", "2-5"...
  count: number;
  percent: number;
}

export interface PatientStats {
  totalActive: number;
  totalHomecare: number;
  totalTqt: number;
  ageDistribution: AgeDistribution[];
}

export interface DashboardReport {
  stats: DashboardStats;
  monthlySeries: MonthlySeriesData[];
  doctorStats: DistributionStat[];
  cityStats: DistributionStat[];
  hospitalStats: DistributionStat[];
  patientStats: PatientStats;
  recentAppointments: AppointmentWithDetails[];
}
