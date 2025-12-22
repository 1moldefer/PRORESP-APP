
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
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'Pendente' | 'Confirmado' | 'Em Atendimento' | 'Realizada' | 'Cancelado';
  color: string;
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
