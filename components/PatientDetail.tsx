
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from './Layout';
import { Patient } from '../types';
import { getClinicalSummary, getSurgicalHistorySummary } from '../openaiService';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { formatSUS, formatPhone, formatCEP, cleanDigits } from '../utils/maskUtils';
import { getTimeInProject, formatDateBR, calculateAge } from '../utils/dateUtils';
import DischargeModal from './ui/DischargeModal';
import PatientDocuments from './PatientDocuments';

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
  const [originalPatient, setOriginalPatient] = useState<Patient | null>(null);
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLog, setHistoryLog] = useState<any[]>([]);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [discharging, setDischarging] = useState(false);
  const [editingOrigin, setEditingOrigin] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [showAllDocs, setShowAllDocs] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPatient();
      fetchAppointments();
      fetchLocations();
    }
  }, [id]);

  const fetchLocations = async () => {
    const { data } = await supabase.from('locations').select('*').eq('status', 'Ativo').order('name');
    if (data) setLocations(data);
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*, doctors(name, specialty), patient_documents(name, file_type)')
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
      if (showHistory) fetchHistory();
    }
  }, [patient, showHistory]);

  const fetchHistory = async () => {
    if (!patient?.id) return;
    const { data } = await supabase
      .from('patient_history')
      .select('*')
      .eq('patient_id', patient.id)
      .order('changed_at', { ascending: false });

    if (data) setHistoryLog(data);
  };

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
        const p = {
          ...data,
          id: data.id,
          createdAt: data.created_at,
          admission_date: data.admission_date,
          deceased: data.deceased,
          name: data.name,
          age: data.age,
          birthDate: data.birth_date,
          motherName: data.mother_name,
          cpf: data.cpf,
          susCard: data.sus_card,
          tracheostomyActive: data.tracheostomy_active,
          homecareActive: data.homecare_active,
          avatarUrl: data.avatar_url,
          address: data.address,
          addressNumber: data.address_number,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          phone: data.phone,
          updated_at: data.updated_at,
          origin_hospital: data.origin_hospital,
          medical_record_date: data.medical_record_date
        };
        setPatient(p);
        setOriginalPatient(JSON.parse(JSON.stringify(p)));
      }
    } catch (err: any) {
      alert('Erro ao carregar paciente: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!patient) return;

    // Check if there is appointment history
    if (appointments.length === 0) {
      alert("Não há histórico de consultas registrado para este paciente. A análise da IA requer dados de consultas anteriores.");
      return;
    }

    setLoadingSummary(true);
    try {
      // Pass appointments to the service
      const result = await getClinicalSummary(patient, appointments);
      setSummary(result);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar resumo.");
    } finally {
      setLoadingSummary(false);
    }
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
    if (!patient || !originalPatient) return;
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

      // Calculate changes
      const changes: any = {};
      const ignoreFields = ['updated_at', 'avatarUrl', 'created_at', 'id'];

      Object.keys(patient).forEach((key) => {
        if (ignoreFields.includes(key)) return;

        // Use type assertion to access dynamic keys
        const newVal = (patient as any)[key];
        const oldVal = (originalPatient as any)[key];

        // Comparison (handles null vs undefined vs empty string broadly)
        if (newVal !== oldVal) {
          if (!newVal && !oldVal) return; // Skip equal falsy values

          changes[key] = {
            old: oldVal,
            new: newVal
          };
        }
      });

      if (Object.keys(changes).length > 0) {
        await supabase.from('patient_history').insert({
          patient_id: patient.id,
          changed_by: user?.email || 'Usuário',
          changes: changes
        });
      }

      const dbUpdate = {
        name: patient.name,
        birth_date: patient.birthDate,
        mother_name: patient.motherName,
        cpf: patient.cpf,
        medical_record: patient.medical_record,
        sus_card: patient.susCard,
        tracheostomy_active: patient.tracheostomyActive,
        homecare_active: patient.homecareActive,
        avatar_url: avatarUrl,
        address: patient.address,
        address_number: patient.addressNumber,
        address_complement: patient.address_complement,
        neighborhood: patient.neighborhood,
        city: patient.city,
        state: patient.state,
        phone: patient.phone,
        social_network: patient.social_network,
        gender: patient.gender,
        origin_hospital: patient.origin_hospital,
        medical_record_date: patient.medical_record_date,

        birth_type: patient.birth_type,
        apgar: patient.apgar,
        cephalic_perimeter: patient.cephalic_perimeter,
        birth_weight: patient.birth_weight,
        gestational_age: patient.gestational_age,
        torch_serology: patient.torch_serology,
        prenatal_complications: patient.prenatal_complications,
        delivery_room_maneuvers: patient.delivery_room_maneuvers,
        intubation_date: patient.intubation_date,
        intubation_time: patient.intubation_time,
        extubation_failure: patient.extubation_failure,
        intubation_cause: patient.intubation_cause,
        pcr: patient.pcr,
        severe_hypoxia: patient.severe_hypoxia,
        urgent_tqt: patient.urgent_tqt,
        difficult_airway: patient.difficult_airway,
        congenital_stridor: patient.congenital_stridor,
        previous_surgery: patient.previous_surgery,

        comorbidities_cardiac: patient.comorbidities_cardiac,
        comorbidities_digestive: patient.comorbidities_digestive,
        comorbidities_neurological: patient.comorbidities_neurological,
        comorbidities_infectious: patient.comorbidities_infectious,
        comorbidities_genetic: patient.comorbidities_genetic,
        comorbidities_osteoarticular: patient.comorbidities_osteoarticular,

        tracheostomy_clinical_history: patient.tracheostomy_clinical_history,
        dysphagia: patient.dysphagia,
        hypersialorrhea: patient.hypersialorrhea,
        recurrent_pneumonia: patient.recurrent_pneumonia,
        cannula_type: patient.cannula_type,
        severe_complications: patient.severe_complications,

        bronchoscopy_nostril: patient.bronchoscopy_nostril,
        nasal_septum_deviation: patient.nasal_septum_deviation,
        piriform_aperture_stenosis: patient.piriform_aperture_stenosis,
        choanal_atresia: patient.choanal_atresia,
        nasal_stenosis: patient.nasal_stenosis,
        rhinopharynx: patient.rhinopharynx,
        oropharynx: patient.oropharynx,

        larynx_preserved: patient.larynx_preserved,
        larynx_arytenoid_redundancy: patient.larynx_arytenoid_redundancy,
        larynx_short_aryepiglottic_ligaments: patient.larynx_short_aryepiglottic_ligaments,
        larynx_omega_epiglottis: patient.larynx_omega_epiglottis,
        larynx_epiglottoptosis: patient.larynx_epiglottoptosis,
        larynx_laryngomalacia: patient.larynx_laryngomalacia,
        larynx_vocal_nodules: patient.larynx_vocal_nodules,
        larynx_posterior_glottic_stenosis: patient.larynx_posterior_glottic_stenosis,
        glossoptosis: patient.glossoptosis,
        larynx_vocal_fold_paralysis: patient.larynx_vocal_fold_paralysis,
        larynx_vocal_fold_paralysis_position: patient.larynx_vocal_fold_paralysis_position,
        larynx_web: patient.larynx_web,
        valecula: patient.valecula,
        piriform_sinus: patient.piriform_sinus,
        morphological_findings: patient.morphological_findings
      };

      const { error } = await supabase
        .from('patients')
        .update(dbUpdate)
        .eq('id', patient.id);

      if (error) throw error;

      alert('Dados atualizados com sucesso!');
      if (photo) {
        setPhoto(null);
        setPhotoPreview(null);
      }
      // Update original state
      setOriginalPatient(JSON.parse(JSON.stringify({ ...patient, ...dbUpdate })));

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

  const handleDischarge = async (reason: string, isDeceased: boolean) => {
    if (!patient) return;

    setDischarging(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          in_project: false,
          discharge_date: new Date().toISOString(),
          discharge_reason: reason || null,
          deceased: isDeceased
        })
        .eq('id', patient.id);

      if (error) throw error;

      alert('Paciente recebeu alta do projeto com sucesso!');

      // Update local state immediately to reflect changes in UI
      setPatient(prev => prev ? ({
        ...prev,
        in_project: false,
        discharge_date: new Date().toISOString(),
        discharge_reason: reason || null,
        deceased: isDeceased
      }) : null);

      setShowDischargeModal(false);
      fetchPatient(); // Ensure consistency with DB
    } catch (err: any) {
      console.error('Erro ao dar alta:', err);
      alert('Erro ao dar alta: ' + err.message);
    } finally {
      setDischarging(false);
    }
  };

  const handleReactivate = async () => {
    if (!patient) return;

    const confirm = window.confirm(
      `Deseja reativar ${patient.name} no projeto?\n\nIsso removerá a data de alta e o paciente voltará a estar ativo.`
    );

    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({
          in_project: true,
          discharge_date: null,
          discharge_reason: null,
          deceased: false
        })
        .eq('id', patient.id);

      if (error) throw error;

      alert('Paciente reativado no projeto com sucesso!');

      setPatient(prev => prev ? ({
        ...prev,
        in_project: true,
        discharge_date: undefined, // Or null, depending on type def
        discharge_reason: undefined,
        deceased: false
      }) : null);

      fetchPatient(); // Reload patient data
    } catch (err: any) {
      console.error('Erro ao reativar:', err);
      alert('Erro ao reativar: ' + err.message);
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
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{patient.name}</h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div>
                  <label className="text-[10px] text-slate-400 font-black uppercase mb-1 block">Nome da Mãe</label>
                  <p className="w-full text-sm font-bold text-slate-900 dark:text-white border-b border-transparent py-1">
                    {patient.motherName || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-black uppercase mb-1 block">Cartão SUS</label>
                  <p className="w-full text-sm font-bold text-slate-900 dark:text-white border-b border-transparent py-1">
                    {patient.susCard || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-black uppercase mb-1 block">Contato</label>
                  <p className="w-full text-sm font-bold text-slate-900 dark:text-white border-b border-transparent py-1">
                    {patient.phone || 'Não informado'}
                  </p>
                </div>
              </div>



              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Idade</p>
                  <p className="font-bold text-slate-900 dark:text-white">{calculateAge(patient.birthDate)}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Nascimento</p>
                  <p className="font-bold text-slate-900 dark:text-white">{patient.birthDate || 'N/A'}</p>
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

        {/* Tempo no Projeto Card */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">schedule</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Tempo no Projeto</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status do Paciente</p>
                </div>
              </div>

              {patient.in_project === false ? (
                <div className="space-y-4">
                  {patient.deceased ? (
                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 text-[20px]">sentiment_very_dissatisfied</span>
                        <p className="text-sm font-black text-slate-800 dark:text-white">Paciente em Óbito</p>
                      </div>
                      {patient.discharge_date && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 ml-8">
                          Data do Registro: <span className="font-bold">{formatDateBR(patient.discharge_date)}</span>
                        </p>
                      )}
                      {patient.discharge_reason && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 ml-8 mt-1">
                          Observações: <span className="font-bold italic">{patient.discharge_reason}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-rose-600 text-[20px]">logout</span>
                        <p className="text-sm font-black text-rose-800 dark:text-rose-200">Paciente com Alta do Projeto</p>
                      </div>
                      {patient.discharge_date && (
                        <p className="text-xs text-rose-700 dark:text-rose-300 ml-8">
                          Alta em: <span className="font-bold">{formatDateBR(patient.discharge_date)}</span>
                        </p>
                      )}
                      {patient.discharge_reason && (
                        <p className="text-xs text-rose-700 dark:text-rose-300 ml-8 mt-1">
                          Motivo: <span className="font-bold">{patient.discharge_reason}</span>
                        </p>
                      )}
                    </div>
                  )}
                  {patient.admission_date && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p className="font-medium">
                        Admissão em: <span className="font-bold text-slate-900 dark:text-white">{formatDateBR(patient.admission_date)}</span>
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] text-slate-400 font-black uppercase mb-1 block">Hospital de Origem</label>
                        <input
                          type="text"
                          value={patient.origin_hospital || ''}
                          onChange={(e) => setPatient({ ...patient, origin_hospital: e.target.value })}
                          placeholder="Toque para informar..."
                          className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary focus:outline-none transition-all placeholder:text-slate-300 placeholder:font-normal w-full"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Tempo total no projeto: <span className="font-bold">{getTimeInProject(patient.admission_date, patient.discharge_date ? new Date(patient.discharge_date) : new Date()).formatted}</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const admissionDate = patient.admission_date || patient.createdAt;
                    const timeData = getTimeInProject(admissionDate);

                    return timeData.hasDate ? (
                      <>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                            <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">Paciente Ativo no Projeto</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {timeData.years > 0 && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Anos</p>
                              <p className="text-2xl font-black text-slate-900 dark:text-white">{timeData.years}</p>
                            </div>
                          )}
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Meses</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{timeData.months}</p>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Dias</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{timeData.days}</p>
                          </div>

                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <p className="font-medium">
                            Admissão em: <span className="font-bold text-slate-900 dark:text-white">{formatDateBR(admissionDate)}</span>
                          </p>
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-[10px] text-slate-400 font-black uppercase mb-1 block">Hospital de Origem</label>

                            {!editingOrigin && patient.origin_hospital ? (
                              <div className="flex items-center justify-between group cursor-pointer py-1" onClick={() => setEditingOrigin(true)}>
                                <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{patient.origin_hospital}</p>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary text-sm transition-colors">edit</span>
                              </div>
                            ) : (
                              <div className="relative">
                                <select
                                  value={patient.origin_hospital || ''}
                                  onChange={(e) => {
                                    setPatient({ ...patient, origin_hospital: e.target.value });
                                    setEditingOrigin(false);
                                  }}
                                  onBlur={() => patient.origin_hospital && setEditingOrigin(false)}
                                  autoFocus={editingOrigin}
                                  className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary focus:outline-none transition-all w-full py-1 appearance-none cursor-pointer pr-6"
                                >
                                  <option value="" disabled>Selecione...</option>
                                  {locations.map(loc => (
                                    <option key={loc.id} value={loc.name} className="text-slate-900">{loc.name}</option>
                                  ))}
                                  {patient.origin_hospital && !locations.find(l => l.name === patient.origin_hospital) && (
                                    <option value={patient.origin_hospital} className="text-slate-900">{patient.origin_hospital}</option>
                                  )}
                                </select>
                                <span className="absolute right-0 top-1 pointer-events-none text-slate-400">
                                  <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-amber-600 text-[20px]">info</span>
                          <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{timeData.formatted}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Discharge/Reactivate Button */}
            <div className="shrink-0">
              {patient.in_project === false ? (
                <button
                  onClick={handleReactivate}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Reativar no Projeto
                </button>
              ) : (
                <button
                  onClick={() => setShowDischargeModal(true)}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Dar Alta do Projeto
                </button>
              )}
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
                    <div
                      key={apt.id}
                      className={`relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl transition-all group ${apt.is_rescheduled
                        ? 'bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-surface-dark border-2 border-indigo-200 dark:border-indigo-800 shadow-lg shadow-indigo-100/50 dark:shadow-indigo-900/20'
                        : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700'
                        } ${apt.status === 'Cancelada' ? 'opacity-75' : ''}`}
                    >
                      {/* Badge Reagendado */}
                      {apt.is_rescheduled && (
                        <div className="absolute -top-2 -left-2 z-10">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 animate-pulse">
                            <span className="material-symbols-outlined text-[14px]">update</span>
                            REAGENDADO
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-4 flex-1">
                        {/* Calendário Visual Melhorado */}
                        <div className={`flex flex-col items-center justify-center rounded-2xl shadow-lg shrink-0 ${apt.is_rescheduled
                          ? 'size-20 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-2 border-indigo-300 dark:border-indigo-600 shadow-indigo-200/50 dark:shadow-indigo-900/30'
                          : 'size-14 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700'
                          }`}>
                          <span className={`text-xs font-black uppercase ${apt.is_rescheduled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                            }`}>
                            {new Date(apt.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </span>
                          <span className={`font-black leading-none ${apt.is_rescheduled
                            ? 'text-3xl text-indigo-700 dark:text-indigo-300'
                            : 'text-xl text-slate-900 dark:text-white'
                            }`}>
                            {apt.status === 'Pendente' ? '' : new Date(apt.date).getDate()}
                          </span>
                          {apt.is_rescheduled && (
                            <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 mt-0.5">
                              {new Date(apt.date).getFullYear()}
                            </span>
                          )}
                        </div>

                        {/* Informações */}
                        <div className="flex flex-col flex-1 gap-2 min-w-0">
                          {/* Médico e Especialidade */}
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight break-words">
                              {apt.doctors?.name ? `Dr(a). ${apt.doctors.name}` : 'Médico não informado'}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1 truncate">
                              {apt.doctors?.specialty || 'Especialidade não informada'}
                            </p>
                          </div>

                          {/* Destaque de Reagendamento */}
                          {apt.is_rescheduled && (
                            <div className="flex flex-col gap-1.5 mt-1">
                              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                  <span className="material-symbols-outlined text-[20px]">event_available</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                                    Reagendado para
                                  </span>
                                  <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                                    {new Date(apt.date).toLocaleDateString('pt-BR')} <span className="text-indigo-400 mx-1">•</span> {apt.time.slice(0, 5)}
                                  </span>
                                </div>
                              </div>

                              {/* Data Anterior */}
                              {apt.previous_date && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 ml-3">
                                  <span className="material-symbols-outlined text-[14px]">history</span>
                                  <span className="font-medium">Data anterior:</span>
                                  <span className="font-bold">{new Date(apt.previous_date).toLocaleDateString('pt-BR')}</span>
                                  {apt.previous_time && <span className="font-bold">às {apt.previous_time.slice(0, 5)}</span>}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Motivo de Cancelamento */}
                          {apt.cancellation_reason && (
                            <p className="text-[10px] text-rose-500 font-bold mt-1">
                              Motivo: {apt.cancellation_reason}
                            </p>
                          )}

                          {/* Evolução Ambulatorial invisível no histórico (Acessível via botão Acessar e IA) */}
                        </div>
                      </div>

                      {/* Status e Ações */}
                      <div className="flex flex-col gap-4 min-w-[140px] border-l border-slate-100 dark:border-slate-800 pl-4 md:ml-4">
                        {/* Status e Hora */}
                        <div className="flex flex-col items-end w-full">
                          <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${apt.status === 'Realizada' ? 'bg-emerald-50 text-emerald-600' :
                            apt.status === 'Cancelada' ? 'bg-rose-50 text-rose-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                            {apt.status}
                          </span>
                          {!apt.is_rescheduled && (
                            <span className="text-[10px] font-bold text-slate-400 mt-1">
                              {apt.status === 'Pendente' ? '' : apt.time.slice(0, 5)}
                            </span>
                          )}
                        </div>

                        {/* Botões de Ação - Layout Vertical para corrigir quebra */}
                        <div className="flex flex-col gap-2 w-full">
                          {/* Acessar */}
                          {['Agendada', 'Pendente', 'Realizada'].includes(apt.status) && (
                            <button
                              onClick={() => navigate(`/consultation/${apt.id}`)}
                              title="Acessar Consulta"
                              className="w-full px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center gap-2 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              Acessar
                            </button>
                          )}

                          {/* Reagendar */}
                          {['Agendada', 'Pendente'].includes(apt.status) && (
                            <button
                              onClick={() => navigate(`/reschedule/${apt.id}`)}
                              title="Reagendar"
                              className="w-full px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center gap-2 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                              Reagendar
                            </button>
                          )}

                          {/* Cancelar */}
                          {['Agendada', 'Pendente'].includes(apt.status) && (
                            <button
                              onClick={() => handleCancelAppointment(apt.id)}
                              title="Cancelar"
                              className="w-full px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center gap-2 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">block</span>
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Informações de Endereço</h4>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Endereço</p>
                  <p className="w-full text-sm font-bold text-slate-900 dark:text-white border-b border-transparent py-1">
                    {patient.address || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Número</p>
                  <p className="w-full text-sm font-bold text-slate-900 dark:text-white border-b border-transparent py-1">
                    {patient.addressNumber || 'S/N'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Bairro</p>
                  <p className="w-full text-sm font-bold text-slate-900 dark:text-white border-b border-transparent py-1">
                    {patient.neighborhood || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Cidade</p>
                  <p className="w-full text-sm font-bold text-slate-900 dark:text-white border-b border-transparent py-1">
                    {patient.city || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Estado</p>
                  <p className="w-full text-sm font-bold text-slate-900 dark:text-white border-b border-transparent py-1">
                    {patient.state || 'UF'}
                  </p>
                </div>
              </div>
            </div>

            <Link to={`/agenda/new?patientId=${patient.id}`} className="w-full flex items-center justify-center gap-3 rounded-2xl h-16 bg-primary hover:bg-primary-dark text-white text-base font-black shadow-xl shadow-primary/20 transition-all">
              <span className="material-symbols-outlined">calendar_add_on</span>
              <span>Agendar Consulta</span>
            </Link>

            <button
              onClick={() => setShowAllDocs(true)}
              className="w-full flex items-center justify-center gap-3 rounded-2xl h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-base font-black shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-primary">folder_shared</span>
              <span>Arquivos do Paciente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admission Form Modal */}
      {/* Admission Form Modal - Fully Editable */}
      {showAdmissionForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdmissionForm(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="shrink-0 p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-surface-dark z-10">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                  <span className="material-symbols-outlined text-2xl">clinical_notes</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Formulário de Admissão Ambulatorial</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cadastro Completo de Paciente</p>
                  {patient.updated_at && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">history</span>
                      Última edição: {new Date(patient.updated_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`px-4 py-3 rounded-xl ${showHistory ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'} hover:bg-amber-200 transition-all flex items-center gap-2 text-xs font-black`}
                  title="Ver Histórico de Alterações"
                >
                  <span className="material-symbols-outlined text-lg">history</span>
                  {showHistory ? 'Voltar ao Form' : 'Histórico'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-xl">save</span>
                  )}
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center justify-center"
                  title="Imprimir / PDF"
                >
                  <span className="material-symbols-outlined">print</span>
                </button>
                <button
                  onClick={() => setShowAdmissionForm(false)}
                  className="size-12 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all flex items-center justify-center"
                  title="Fechar"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900/50">
              {showHistory ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  <h4 className="text-lg font-black text-slate-800 dark:text-white mb-4">Histórico de Alterações</h4>
                  {historyLog.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Nenhuma alteração registrada.</p>
                  ) : (
                    historyLog.map((log) => (
                      <div key={log.id} className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Alterado por</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{log.changed_by}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-500 uppercase">Data</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(log.changed_at).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {Object.entries(log.changes || {}).map(([key, val]: [string, any]) => {
                            const fieldLabels: { [k: string]: string } = {
                              name: 'Nome Completo',
                              motherName: 'Nome da Mãe',
                              mother_name: 'Nome da Mãe',
                              gender: 'Gênero',
                              medical_record: 'Prontuário',
                              susCard: 'Cartão SUS',
                              sus_card: 'Cartão SUS',
                              birthDate: 'Data de Nascimento',
                              birth_date: 'Data de Nascimento',
                              cep: 'CEP',
                              city: 'Cidade',
                              state: 'Estado',
                              address: 'Endereço',
                              addressNumber: 'Número',
                              address_number: 'Número',
                              address_complement: 'Complemento',
                              phone: 'Telefone/Celular',
                              social_network: 'Rede Social',
                              tracheostomyActive: 'Traqueostomia Ativa',
                              tracheostomy_active: 'Traqueostomia Ativa',
                              homecareActive: 'Homecare Ativo',
                              homecare_active: 'Homecare Ativo',
                              birth_type: 'Tipo de Parto',
                              apgar: 'APGAR',
                              birth_weight: 'Peso ao Nascer',
                              gestational_age: 'Idade Gestacional',
                              cephalic_perimeter: 'Perímetro Cefálico',
                              torch_serology: 'Sorologia TORCH',
                              prenatal_complications: 'Intercorrências Pré-natal',
                              delivery_room_maneuvers: 'Manobras Sala de Parto',
                              intubation_date: 'Data Intubação',
                              intubation_time: 'Tempo Intubação',
                              extubation_failure: 'Falha Extubação',
                              accidental_extubation: 'Extubação Acidental',
                              intubation_cause: 'Causa Intubação',
                              pcr: 'PCR',
                              severe_hypoxia: 'Hipóxia Grave',
                              urgent_tqt: 'TQT Urgência',
                              difficult_airway: 'Via Aérea Difícil',
                              congenital_stridor: 'Estridor Congênito',
                              previous_surgery: 'Cirurgia Prévia',
                              comorbidities_cardiac: 'Comorb. Cardíacas',
                              comorbidities_neurological: 'Comorb. Neurológicas',
                              comorbidities_digestive: 'Comorb. Digestivas',
                              comorbidities_infectious: 'Comorb. Infecciosas',
                              comorbidities_genetic: 'Comorb. Genéticas',
                              comorbidities_osteoarticular: 'Comorb. Osteoarticulares',
                              tracheostomy_clinical_history: 'Hist. TQT',
                              dysphagia: 'Disfagia',
                              cannula_type: 'Tipo Cânula',
                              recurrent_pneumonia: 'Pneumonia Rep.',
                              severe_complications: 'Intercorrências Graves',
                              bronchoscopy_nostril: 'Bronco. Narina',
                              nasal_septum_deviation: 'Desvio Septo',
                              piriform_aperture_stenosis: 'Estenose Abertura Piriforme',
                              choanal_atresia: 'Atresia Coana',
                              nasal_stenosis: 'Estenose Nasal',
                              rhinopharynx: 'Rinofaringe',
                              oropharynx: 'Orofaringe',
                              larynx_preserved: 'Laringe Preservada',
                              larynx_arytenoid_redundancy: 'Redundância Aritenoides',
                              larynx_short_aryepiglottic_ligaments: 'Ligamentos Curtos',
                              larynx_omega_epiglottis: 'Epiglote Ômega',
                              larynx_epiglottoptosis: 'Epiglotoptose',
                              larynx_laryngomalacia: 'Laringomalácia',
                              larynx_vocal_nodules: 'Nódulos Vocais',
                              larynx_posterior_glottic_stenosis: 'Estenose Glótica Post.',
                              larynx_vocal_fold_paralysis: 'Paralisia Prega Vocal',
                              larynx_vocal_fold_paralysis_position: 'Posição Paralisia',
                              larynx_web: 'Web Laríngeo',
                              valecula: 'Valécula',
                              piriform_sinus: 'Seios Piriformes',
                              morphological_findings: 'Achados Morfológicos',
                              glossoptosis: 'Glossoptose',
                              hypersialorrhea: 'Hipersialorreia'
                            };

                            const formatValue = (v: any) => {
                              if (v === true) return 'Sim';
                              if (v === false) return 'Não';
                              if (v === null || v === '') return 'Vazio';
                              return String(v);
                            };

                            return (
                              <div key={key} className="text-xs">
                                <span className="font-bold text-indigo-600 block uppercase mb-1">{fieldLabels[key] || key.replace(/_/g, ' ')}</span>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-rose-50 p-2 rounded-lg border border-rose-100">
                                    <span className="text-rose-400 block text-[10px] uppercase font-black">Antes</span>
                                    <span className="text-rose-700 block break-words">{formatValue(val.old)}</span>
                                  </div>
                                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                    <span className="text-emerald-400 block text-[10px] uppercase font-black">Depois</span>
                                    <span className="text-emerald-700 block break-words">{formatValue(val.new)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-8 max-w-4xl mx-auto">

                  {/* Section: Dados Pessoais */}
                  <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <span className="material-symbols-outlined text-indigo-500">person</span>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase">Dados Pessoais</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nome Completo</label>
                        <input
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={patient.name || ''}
                          onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nome da Mãe</label>
                        <input
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={patient.motherName || ''}
                          onChange={(e) => setPatient({ ...patient, motherName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Gênero</label>
                        <select
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={patient.gender || ''}
                          onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
                        >
                          <option value="">Selecione...</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Prontuário</label>
                        <input
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={patient.medical_record || ''}
                          onChange={(e) => setPatient({ ...patient, medical_record: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Cartão SUS</label>
                        <input
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formatSUS(patient.susCard || '')}
                          onChange={(e) => setPatient({ ...patient, susCard: cleanDigits(e.target.value) })}
                          maxLength={18}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Data de Nascimento</label>
                        <input
                          type="date"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={patient.birthDate || ''}
                          onChange={(e) => setPatient({ ...patient, birthDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">CEP</label>
                        <input
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formatCEP(patient.cep || '')}
                          onChange={(e) => setPatient({ ...patient, cep: cleanDigits(e.target.value) })}
                          maxLength={9}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Cidade</label>
                          <input
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={patient.city || ''}
                            onChange={(e) => setPatient({ ...patient, city: e.target.value })}
                          />
                        </div>
                        <div className="w-20">
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">UF</label>
                          <input
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={patient.state || ''}
                            onChange={(e) => setPatient({ ...patient, state: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Endereço</label>
                        <input
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={patient.address || ''}
                          onChange={(e) => setPatient({ ...patient, address: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Número</label>
                        <input
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={patient.addressNumber || ''}
                          onChange={(e) => setPatient({ ...patient, addressNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Complemento</label>
                        <input
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={patient.address_complement || ''}
                          onChange={(e) => setPatient({ ...patient, address_complement: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Celular</label>
                        <input
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formatPhone(patient.phone || '')}
                          onChange={(e) => setPatient({ ...patient, phone: cleanDigits(e.target.value) })}
                          maxLength={15}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Rede Social</label>
                        <input
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={patient.social_network || ''}
                          onChange={(e) => setPatient({ ...patient, social_network: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <input type="checkbox" checked={patient.tracheostomyActive} onChange={(e) => setPatient({ ...patient, tracheostomyActive: e.target.checked })} className="size-4" />
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Traqueostomia Ativa</label>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <input type="checkbox" checked={patient.homecareActive} onChange={(e) => setPatient({ ...patient, homecareActive: e.target.checked })} className="size-4" />
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Homecare Ativo</label>
                      </div>
                    </div>
                  </section>

                  {/* Section: Nascimento e Gestação */}
                  <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <span className="material-symbols-outlined text-indigo-500">child_care</span>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase">Dados de Nascimento e Gestação</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Tipo de Parto</label>
                        <select
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={patient.birth_type || ''}
                          onChange={(e) => setPatient({ ...patient, birth_type: e.target.value })}
                        >
                          <option value="">Selecione...</option>
                          <option value="Normal">Normal</option>
                          <option value="Cesárea">Cesárea</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">APGAR</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.apgar || ''} onChange={(e) => setPatient({ ...patient, apgar: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Perímetro Cefálico</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.cephalic_perimeter || ''} onChange={(e) => setPatient({ ...patient, cephalic_perimeter: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Peso ao Nascer</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.birth_weight || ''} onChange={(e) => setPatient({ ...patient, birth_weight: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">IG (Idade Gest.)</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.gestational_age || ''} onChange={(e) => setPatient({ ...patient, gestational_age: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Sorologias TORCH</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.torch_serology || ''} onChange={(e) => setPatient({ ...patient, torch_serology: e.target.value })} />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Intercorrências Pré-natal</label>
                        <textarea rows={2} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-700" value={patient.prenatal_complications || ''} onChange={(e) => setPatient({ ...patient, prenatal_complications: e.target.value })} />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Manobras Sala de Parto</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.delivery_room_maneuvers || ''} onChange={(e) => setPatient({ ...patient, delivery_room_maneuvers: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Data Intubação</label>
                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.intubation_date || ''} onChange={(e) => setPatient({ ...patient, intubation_date: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Tempo Intubação</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.intubation_time || ''} onChange={(e) => setPatient({ ...patient, intubation_time: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Falha Extubação</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.extubation_failure || ''} onChange={(e) => setPatient({ ...patient, extubation_failure: e.target.value })}>
                          <option value="">Selecione...</option>
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Extubação Acidental</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.accidental_extubation || ''} onChange={(e) => setPatient({ ...patient, accidental_extubation: e.target.value })}>
                          <option value="">Selecione...</option>
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Causa da Intubação</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.intubation_cause || ''} onChange={(e) => setPatient({ ...patient, intubation_cause: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {['pcr', 'severe_hypoxia', 'urgent_tqt', 'difficult_airway'].map(field => (
                        <div key={field} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                          <input type="checkbox" checked={(patient as any)[field] || false} onChange={(e) => setPatient({ ...patient, [field]: e.target.checked })} />
                          <label className="text-xs font-bold uppercase">{field.replace('_', ' ')}</label>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Estridor Congênito</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.congenital_stridor || ''} onChange={(e) => setPatient({ ...patient, congenital_stridor: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Cirurgia Prévia</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.previous_surgery || ''} onChange={(e) => setPatient({ ...patient, previous_surgery: e.target.value })} />
                      </div>
                    </div>
                  </section>

                  {/* Section: Comorbidades */}
                  <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <span className="material-symbols-outlined text-indigo-500">medical_information</span>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase">Comorbidades</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {['comorbidities_cardiac', 'comorbidities_digestive', 'comorbidities_neurological', 'comorbidities_infectious', 'comorbidities_genetic', 'comorbidities_osteoarticular'].map(field => (
                        <div key={field} className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">{field.replace('comorbidities_', '')}</label>
                          <input
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={(patient as any)[field] || ''}
                            onChange={(e) => setPatient({ ...patient, [field]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section: Dados Clínicos */}
                  <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <span className="material-symbols-outlined text-indigo-500">vital_signs</span>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase">Dados Clínicos</h4>
                    </div>
                    <div className="mb-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">História Clínica para Traqueostomia</label>
                      <textarea rows={4} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-700" value={patient.tracheostomy_clinical_history || ''} onChange={(e) => setPatient({ ...patient, tracheostomy_clinical_history: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                      {['dysphagia', 'hypersialorrhea', 'recurrent_pneumonia'].map(field => (
                        <div key={field} className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">{field.replace('_', ' ')}</label>
                          <select
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={(patient as any)[field] || ''}
                            onChange={(e) => setPatient({ ...patient, [field]: e.target.value })}
                          >
                            <option value="">Selecione...</option>
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </div>
                      ))}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Tipo de Cânula</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.cannula_type || ''} onChange={(e) => setPatient({ ...patient, cannula_type: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Intercorrências Graves</label>
                      <textarea rows={2} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-700" value={patient.severe_complications || ''} onChange={(e) => setPatient({ ...patient, severe_complications: e.target.value })} />
                    </div>
                  </section>

                  {/* Section: Broncoscopia */}
                  <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <span className="material-symbols-outlined text-indigo-500">pulmonology</span>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase">Dados da Broncoscopia</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['bronchoscopy_nostril', 'nasal_septum_deviation', 'piriform_aperture_stenosis', 'choanal_atresia', 'nasal_stenosis', 'rhinopharynx'].map(field => {
                        const labels: { [k: string]: string } = {
                          bronchoscopy_nostril: 'Narina',
                          nasal_septum_deviation: 'Desvio de Septo Nasal',
                          piriform_aperture_stenosis: 'Estenose da Abertura Piriforme',
                          choanal_atresia: 'Atresia Coanal',
                          nasal_stenosis: 'Estenose Nasal',
                          rhinopharynx: 'Rinofaringe',
                          oropharynx: 'Orofaringe'
                        };
                        return (
                          <div key={field}>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">{labels[field] || field}</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={(patient as any)[field] || ''} onChange={(e) => setPatient({ ...patient, [field]: e.target.value })} />
                          </div>
                        );
                      })}
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Orofaringe</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={patient.oropharynx || ''} onChange={(e) => setPatient({ ...patient, oropharynx: e.target.value })} />
                      </div>
                    </div>
                  </section>

                  {/* Section: Laringe e Achados */}
                  <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <span className="material-symbols-outlined text-indigo-500">mic</span>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase">Laringe e Achados</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                      {['larynx_preserved', 'larynx_arytenoid_redundancy', 'larynx_short_aryepiglottic_ligaments', 'larynx_omega_epiglottis', 'larynx_epiglottoptosis', 'larynx_laryngomalacia', 'larynx_vocal_nodules', 'larynx_posterior_glottic_stenosis', 'glossoptosis'].map(field => {
                        const labels: { [k: string]: string } = {
                          larynx_preserved: 'Laringe Preservada',
                          larynx_arytenoid_redundancy: 'Redundância de Aritenóides',
                          larynx_short_aryepiglottic_ligaments: 'Ligamentos Ariepiglóticos Curtos',
                          larynx_omega_epiglottis: 'Epiglote em Ômega',
                          larynx_epiglottoptosis: 'Epiglotoptose',
                          larynx_laryngomalacia: 'Laringomalácia',
                          larynx_vocal_nodules: 'Nódulos Vocais',
                          larynx_posterior_glottic_stenosis: 'Estenose Glótica Posterior',
                          glossoptosis: 'Glossoptose'
                        };
                        return (
                          <div key={field} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <input type="checkbox" checked={(patient as any)[field] || false} onChange={(e) => setPatient({ ...patient, [field]: e.target.checked })} />
                            <label className="text-xs font-bold uppercase truncate" title={labels[field]}>{labels[field]}</label>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {['larynx_vocal_fold_paralysis', 'larynx_vocal_fold_paralysis_position', 'larynx_web', 'valecula', 'piriform_sinus'].map(field => {
                        const labels: { [k: string]: string } = {
                          larynx_vocal_fold_paralysis: 'Paralisia de Prega Vocal',
                          larynx_vocal_fold_paralysis_position: 'Posição da Paralisia',
                          larynx_web: 'Web Laríngeo',
                          valecula: 'Valécula',
                          piriform_sinus: 'Seios Piriformes'
                        };
                        return (
                          <div key={field}>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">{labels[field]}</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" value={(patient as any)[field] || ''} onChange={(e) => setPatient({ ...patient, [field]: e.target.value })} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Achados Morfológicos (Texto Livre)</label>
                      <textarea
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows={5}
                        value={patient.morphological_findings || ''}
                        onChange={(e) => setPatient({ ...patient, morphological_findings: e.target.value })}
                      />
                    </div>
                  </section>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      <DischargeModal
        isOpen={showDischargeModal}
        onClose={() => setShowDischargeModal(false)}
        onConfirm={handleDischarge}
        patientName={patient?.name || ''}
        loading={discharging}
      />
      {/* All Documents Modal */}
      {showAllDocs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowAllDocs(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">folder_shared</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Arquivos do Paciente</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Histórico Completo de Anexos</p>
                </div>
              </div>
              <button onClick={() => setShowAllDocs(false)} className="size-10 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
              <PatientDocuments patientId={patient.id} isGlobalView={true} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PatientDetail;
