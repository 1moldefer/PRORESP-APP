
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from './Layout';
import { Patient } from '../types';
import { getClinicalSummary, getSurgicalHistorySummary } from '../openaiService';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [surgicalHistory, setSurgicalHistory] = useState<any[]>([]);
  const [surgicalSummary, setSurgicalSummary] = useState<string>('');
  const [loadingSurgicalSummary, setLoadingSurgicalSummary] = useState(false);
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPatient();
      fetchAppointments();
    }
  }, [id]);

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*, doctors(name, specialty)')
      .eq('patient_id', id)
      .order('date', { ascending: false });

    if (data) setAppointments(data);
    if (data) setAppointments(data);
  };

  const fetchSurgicalHistory = async () => {
    if (!patient?.name) return;
    // Basic match by name since ID might not link if entered manually in old records
    // Ideally we link by patient_id now that we have autofill
    const { data } = await supabase
      .from('surgical_maps')
      .select('*, surgical_evolutions(*)')
      .eq('patient_id', id)
      .order('surgery_date', { ascending: false });

    if (data) setSurgicalHistory(data);
  };

  useEffect(() => {
    if (patient) {
      fetchSurgicalHistory();
    }
  }, [patient]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setPatient({
          id: data.id,
          name: data.name,
          age: data.age,
          birthDate: data.birth_date,
          motherName: data.mother_name,
          cpf: data.cpf,
          susCard: data.sus_card,
          tracheostomyActive: data.tracheostomy_active,
          homecareActive: data.homecare_active,
          avatarUrl: data.avatar_url
        });
      }
    } catch (err: any) {
      alert('Erro ao carregar paciente: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!patient) return;
    setLoadingSummary(true);
    // Pass appointments to the service
    const result = await getClinicalSummary(patient, appointments);
    setSummary(result);
    setLoadingSummary(false);
  };

  const handleGenerateSurgicalSummary = async () => {
    if (!patient || surgicalHistory.length === 0) return;
    setLoadingSurgicalSummary(true);
    const result = await getSurgicalHistorySummary(patient.name, surgicalHistory);
    setSurgicalSummary(result);
    setLoadingSurgicalSummary(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!patient) return;
    setSaving(true);

    try {
      let avatarUrl = patient.avatarUrl;

      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('patients')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('patients')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from('patients')
        .update({
          name: patient.name,
          birth_date: patient.birthDate,
          mother_name: patient.motherName,
          sus_card: patient.susCard,
          tracheostomy_active: patient.tracheostomyActive,
          homecare_active: patient.homecareActive,
          avatar_url: avatarUrl
        })
        .eq('id', patient.id);

      if (error) throw error;

      alert('Dados atualizados com sucesso!');
      if (photo) {
        setPhoto(null);
        setPhotoPreview(null);
        // update local state fully
        setPatient(prev => prev ? ({ ...prev, avatarUrl }) : null);
      }

    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAppointment = async (aptId: string) => {
    const reason = window.prompt("Motivo do cancelamento:");
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'Cancelada', cancellation_reason: reason })
        .eq('id', aptId);

      if (error) throw error;

      alert('Consulta cancelada com sucesso.');
      fetchAppointments();
    } catch (err: any) {
      alert('Erro ao cancelar: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
      </Layout>
    );
  }

  if (!patient) return <Layout><div className="p-8">Paciente não encontrado</div></Layout>;

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all">
              <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Ficha do Paciente</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">ID: {patient.id.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdmissionForm(true)}
              className="size-11 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all shadow-sm"
              title="Ver Ficha de Admissão Completa"
            >
              <span className="material-symbols-outlined">description</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {saving ? 'Salvando...' : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span> Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>

        <section className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative shrink-0 group">
              {photoPreview || patient.avatarUrl ? (
                <img src={photoPreview || patient.avatarUrl} alt={patient.name} className="size-32 rounded-3xl object-cover ring-8 ring-primary/5 shadow-lg" />
              ) : (
                <div className="size-32 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-4xl font-black ring-8 ring-primary/5 shrink-0">
                  {patient.name.substring(0, 1)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-white text-3xl">edit</span>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full space-y-6">
              <div className="w-full">
                <label className="text-[10px] text-slate-400 font-black uppercase mb-1 block">Nome Completo</label>
                <input
                  className="w-full text-3xl font-black text-slate-900 dark:text-white bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-primary focus:outline-none transition-colors"
                  value={patient.name}
                  onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Idade</p>
                  <p className="font-bold text-slate-900 dark:text-white">{patient.age || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Nascimento</p>
                  <input
                    value={patient.birthDate}
                    onChange={(e) => setPatient({ ...patient, birthDate: e.target.value })}
                  />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">CPF</p>
                  <input
                    type="text"
                    className="font-bold text-slate-900 dark:text-white bg-transparent w-full focus:outline-none"
                    value={patient.cpf || ''}
                    placeholder="Inserir CPF"
                    onChange={(e) => setPatient({ ...patient, cpf: e.target.value })}
                  />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setPatient({ ...patient, tracheostomyActive: !patient.tracheostomyActive })}>
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Traqueo</p>
                  <p className={`font-bold ${patient.tracheostomyActive ? 'text-emerald-500' : 'text-slate-400'}`}>{patient.tracheostomyActive ? 'Ativa' : 'Inativa'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setPatient({ ...patient, homecareActive: !patient.homecareActive })}>
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Homecare</p>
                  <p className={`font-bold ${patient.homecareActive ? 'text-emerald-500' : 'text-slate-400'}`}>{patient.homecareActive ? 'Ativo' : 'Inativo'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col gap-6">
            <section className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Assistente Clínico IA</h3>
                </div>
                <button
                  onClick={handleGenerateSummary}
                  disabled={loadingSummary}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {loadingSummary ? 'Analisando...' : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      Gerar Resumo
                    </>
                  )}
                </button>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                {summary ? (
                  <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm leading-relaxed">
                    {summary}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                    <span className="material-symbols-outlined text-[40px] opacity-20">medical_information</span>
                    <p className="text-xs font-bold uppercase tracking-widest px-8">Clique em "Gerar Resumo" para obter insights da IA sobre o caso clínico.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Appointment History Section */}
            <section className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-8">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Histórico de Consultas</h3>
              </div>

              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                  <span className="material-symbols-outlined text-[40px] opacity-20">event_busy</span>
                  <p className="text-xs font-bold uppercase tracking-widest px-8">Nenhuma consulta registrada para este paciente.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer" onClick={() => navigate(`/consultation/${apt.id}`)}>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center size-14 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                          <span className="text-xs font-black uppercase text-slate-400">{new Date(apt.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white">{new Date(apt.date).getDate()}</span>
                        </div>
                        <div className="flex flex-col">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">{apt.doctors?.name || 'Médico não informado'}</h4>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{apt.doctors?.specialty || 'Clínico Geral'}</p>
                          {apt.cancellation_reason && (
                            <p className="text-[10px] text-rose-500 font-bold mt-1">Motivo: {apt.cancellation_reason}</p>
                          )}
                          {apt.notes && (
                            <div className="mt-2">
                              <p className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border-l-2 border-indigo-400">
                                <span className="font-bold">Parecer:</span> {apt.notes}
                              </p>
                              {apt.updated_by && (
                                <p className="text-[9px] text-slate-400 mt-1 italic">
                                  Salvo por {apt.updated_by} em {apt.updated_at ? new Date(apt.updated_at).toLocaleString('pt-BR') : 'data não disponível'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 md:gap-8 justify-between md:justify-end w-full md:w-auto">
                        <div className="flex flex-col items-end">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${apt.status === 'Realizada' ? 'bg-emerald-50 text-emerald-600' :
                            apt.status === 'Cancelada' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                            {apt.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 mt-1">{apt.time.slice(0, 5)}</span>
                        </div>
                        {apt.status === 'Agendada' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/consultation/${apt.id}`)}
                              title="Iniciar Atendimento / Confirmar Presença"
                              className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:shadow-emerald-200/50 hover:shadow-lg transition-all"
                            >
                              <span className="material-symbols-outlined text-[20px]">assignment_add</span>
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(apt.id)}
                              title="Cancelar Consulta"
                              className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all"
                            >
                              <span className="material-symbols-outlined text-[18px]">block</span>
                            </button>
                          </div>
                        )}
                        {/* Se já foi realizada ou cancelada, talvez mostrar apenas o status, já feito acima */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Informações Adicionais</h4>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Nome da Mãe</p>
                  <input
                    className="text-sm font-bold text-slate-900 dark:text-white bg-transparent w-full border-b border-transparent hover:border-slate-200 focus:border-primary focus:outline-none"
                    value={patient.motherName}
                    onChange={(e) => setPatient({ ...patient, motherName: e.target.value })}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Cartão SUS</p>
                  <input
                    className="text-sm font-bold text-slate-900 dark:text-white bg-transparent w-full border-b border-transparent hover:border-slate-200 focus:border-primary focus:outline-none"
                    value={patient.susCard}
                    onChange={(e) => setPatient({ ...patient, susCard: e.target.value })}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Cidade</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Maceió - AL</p>
                </div>
              </div>
            </div>

            <Link to={`/agenda/new?patientId=${patient.id}`} className="w-full flex items-center justify-center gap-3 rounded-2xl h-16 bg-primary hover:bg-primary-dark text-white text-base font-black shadow-xl shadow-primary/20 transition-all">
              <span className="material-symbols-outlined">calendar_add_on</span>
              <span>Agendar Consulta</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Admission Form Modal */}
      {showAdmissionForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdmissionForm(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Ficha de Admissão Ambulatorial</h3>
                  <p className="text-xs text-slate-500">{patient.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  Gerar PDF
                </button>
                <button
                  onClick={() => setShowAdmissionForm(false)}
                  className="size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
              {/* Personal Data */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-400 uppercase">Dados Pessoais</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Gênero:</span> {patient.gender || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Prontuário:</span> {patient.medical_record || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">CEP:</span> {patient.cep || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm col-span-2">
                    <span className="text-slate-400 font-bold block mb-1">Endereço:</span> {patient.address || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Telefone:</span> {patient.phone || 'Não informado'}
                  </div>
                </div>
              </div>

              {/* Birth Data */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-400 uppercase">Dados de Nascimento/Gestação</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Tipo de Parto:</span> {patient.birth_type || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">APGAR:</span> {patient.apgar || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Peso ao Nascer:</span> {patient.birth_weight || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">IG:</span> {patient.gestational_age || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Perímetro Cefálico:</span> {patient.cephalic_perimeter || 'Não informado'}
                  </div>
                </div>
              </div>

              {/* Comorbidities */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-400 uppercase">Comorbidades</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Cardíacas:</span> {patient.comorbidities_cardiac || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Neurológicas:</span> {patient.comorbidities_neurological || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Digestivas:</span> {patient.comorbidities_digestive || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Infecciosas:</span> {patient.comorbidities_infectious || 'Não informado'}
                  </div>
                </div>
              </div>

              {/* Clinical History */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-400 uppercase">História Clínica da Traqueostomia</h4>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                  {patient.tracheostomy_clinical_history || 'Não informado'}
                </div>
              </div>

              {/* Clinical Data */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-400 uppercase">Dados Clínicos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Disfagia:</span> {patient.dysphagia || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Tipo de Cânula:</span> {patient.cannula_type || 'Não informado'}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                    <span className="text-slate-400 font-bold block mb-1">Pneumonia de Repetição:</span> {patient.recurrent_pneumonia || 'Não informado'}
                  </div>
                </div>
              </div>

              {/* Morphological Findings */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-400 uppercase">Achados Morfológicos</h4>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                  {patient.morphological_findings || 'Não informado'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PatientDetail;
