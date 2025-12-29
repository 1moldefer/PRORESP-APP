import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { supabase } from '../supabaseClient';
import { draftClinicalNotes } from '../openaiService';
import DocumentGenerator from './DocumentGenerator';
import PatientDocuments from './PatientDocuments';
import { formatSUS, formatPhone } from '../utils/maskUtils';
import { formatDateBR, calculateAge } from '../utils/dateUtils';

const MedicalConsultation: React.FC = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [appointment, setAppointment] = useState<any>(null);
    const [notes, setNotes] = useState('');
    // Evolution State
    const [weight, setWeight] = useState('');
    const [cultureResult, setCultureResult] = useState('');
    const [isolation, setIsolation] = useState(false);
    const [diagnosis, setDiagnosis] = useState('');
    const [therapeuticPlan, setTherapeuticPlan] = useState('');
    const [returnRecommendations, setReturnRecommendations] = useState('');

    const [loadingDraft, setLoadingDraft] = useState(false);

    // Document Generator State
    const [showDocGenerator, setShowDocGenerator] = useState(false);
    const [docType, setDocType] = useState<'prescription' | 'certificate' | 'exam_request'>('prescription');

    const handleDraftNotes = async () => {
        if (!appointment) return;
        setLoadingDraft(true);

        try {
            // Fetch last appointment for context
            const { data: lastApt } = await supabase
                .from('appointments')
                .select('date, notes')
                .eq('patient_id', appointment.patient_id)
                .lt('date', appointment.date)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            const conditions = {
                tracheostomy: appointment.patients?.tracheostomy_active,
                homecare: appointment.patients?.homecare_active,
                city: appointment.patients?.city
            };

            const draft = await draftClinicalNotes(appointment.patients, lastApt, conditions);

            if (!notes) {
                setNotes(draft);
            } else {
                if (window.confirm("Substituir o texto atual pela sugestão da IA? Cancelar para apenas adicionar ao final.")) {
                    setNotes(draft);
                } else {
                    setNotes(notes + "\n\n" + draft);
                }
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar sugestão de IA.");
        } finally {
            setLoadingDraft(false);
        }
    };

    useEffect(() => {
        if (appointmentId) {
            fetchAppointmentData();
        }
    }, [appointmentId]);

    const fetchAppointmentData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('appointments')
                .select('*, patients(*), doctors(*)')
                .eq('id', appointmentId)
                .single();

            if (error) throw error;
            setAppointment(data);
            setAppointment(data);
            if (data.notes) setNotes(data.notes);
            if (data.weight) setWeight(data.weight);
            if (data.culture_exam_result) setCultureResult(data.culture_exam_result);
            if (data.isolation_active) setIsolation(data.isolation_active);
            if (data.diagnosis) setDiagnosis(data.diagnosis);
            if (data.therapeutic_plan) setTherapeuticPlan(data.therapeutic_plan);
            if (data.return_recommendations) setReturnRecommendations(data.return_recommendations);
        } catch (error: any) {
            alert('Erro ao carregar atendimento: ' + error.message);
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async (redirectUrl?: string) => {
        try {
            setSaving(true);

            // Get current timestamp
            const now = new Date().toISOString();
            const doctorName = appointment.doctors?.name || 'Médico não identificado';

            const { error } = await supabase
                .from('appointments')
                .update({
                    status: 'Realizada',
                    notes: notes,
                    weight: weight,
                    culture_exam_result: cultureResult,
                    isolation_active: isolation,
                    diagnosis: diagnosis,
                    therapeutic_plan: therapeuticPlan,
                    return_recommendations: returnRecommendations,
                    updated_by: doctorName,
                    updated_at: now
                })
                .eq('id', appointmentId);

            if (error) throw error;

            alert('Atendimento finalizado com sucesso!');

            if (redirectUrl) {
                navigate(redirectUrl);
            } else {
                navigate(`/patients/${appointment.patient_id}`);
            }
        } catch (error: any) {
            alert('Erro ao finalizar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex h-screen items-center justify-center">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                </div>
            </Layout>
        );
    }

    if (!appointment) return null;

    return (
        <Layout>
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="size-12 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-all">
                            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Atendimento Médico</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${appointment.status === 'Realizada' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'}`}>
                        <span className={`size-2 rounded-full ${appointment.status === 'Realizada' ? 'bg-blue-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                        <span className={`text-xs font-black uppercase tracking-widest ${appointment.status === 'Realizada' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {appointment.status === 'Realizada' ? 'Concluído' : 'Em Andamento'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Patient Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center gap-4">
                            {appointment.patients?.avatar_url ? (
                                <img src={appointment.patients.avatar_url} alt="" className="size-32 rounded-3xl object-cover shadow-lg ring-4 ring-slate-50 dark:ring-slate-800" />
                            ) : (
                                <div className="size-32 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-lg ring-4 ring-slate-50 dark:ring-slate-800">
                                    <span className="material-symbols-outlined text-5xl">person</span>
                                </div>
                            )}

                            <div className="w-full">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase leading-tight">{appointment.patients?.name}</h2>

                                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                                    <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-700">ID: {appointment.patient_id?.slice(0, 6)}</span>
                                    <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">
                                        {calculateAge(appointment.patients?.birth_date)}
                                    </span>
                                </div>

                                <div className="text-left space-y-3">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Nome da Mãe</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{appointment.patients?.mother_name || 'Não informado'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Cartão SUS</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title={appointment.patients?.sus_card}>{formatSUS(appointment.patients?.sus_card) || '-'}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Contato</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title={appointment.patients?.phone}>{formatPhone(appointment.patients?.phone) || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Nascimento</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    {formatDateBR(appointment.patients?.birth_date)}
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300">cake</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">info</span>
                                Condições Clínicas
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Traqueostomia</span>
                                    <span className={`size-3 rounded-full ${appointment.patients?.tracheostomy_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Homecare</span>
                                    <span className={`size-3 rounded-full ${appointment.patients?.homecare_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Clinical Notes */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Admission Form - Collapsible */}
                        <details className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                            <summary className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                        <span className="material-symbols-outlined">description</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Ficha de Admissão Ambulatorial</h3>
                                        <p className="text-xs text-slate-500">Clique para visualizar dados completos do paciente</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-400">expand_more</span>
                            </summary>
                            <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                                {/* Personal Data */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase">Dados Pessoais</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Mãe:</span> {appointment.patients?.mother_name || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Nascimento:</span> {appointment.patients?.birth_date ? new Date(appointment.patients.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Gênero:</span> {appointment.patients?.gender || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Prontuário:</span> {appointment.patients?.medical_record || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Rede Social:</span> {appointment.patients?.social_network || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">CPF:</span> {appointment.patients?.cpf || 'Não informado'}
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase">Endereço Completo</h4>
                                    <div className="p-3 rounded-lg bg-white dark:bg-surface-dark text-xs grid grid-cols-1 md:grid-cols-2 gap-y-1">
                                        <div><span className="text-slate-400 font-bold">Logradouro:</span> {appointment.patients?.address}, {appointment.patients?.address_number}</div>
                                        <div><span className="text-slate-400 font-bold">Complemento:</span> {appointment.patients?.address_complement}</div>
                                        <div><span className="text-slate-400 font-bold">Bairro:</span> {appointment.patients?.neighborhood}</div>
                                        <div><span className="text-slate-400 font-bold">Cidade/UF:</span> {appointment.patients?.city}/{appointment.patients?.state}</div>
                                        <div><span className="text-slate-400 font-bold">CEP:</span> {appointment.patients?.cep}</div>
                                    </div>
                                </div>

                                {/* Birth/Gestational Data */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase">Dados de Nascimento/Gestação</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Tipo de Parto:</span> {appointment.patients?.birth_type || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">APGAR:</span> {appointment.patients?.apgar || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Peso Nascer:</span> {appointment.patients?.birth_weight || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">IG:</span> {appointment.patients?.gestational_age || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Perímetro Cef.:</span> {appointment.patients?.cephalic_perimeter || '-'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">TORCH:</span> {appointment.patients?.torch_serology || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Manobras:</span> {appointment.patients?.delivery_room_maneuvers || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Data Intubação:</span> {appointment.patients?.intubation_date ? new Date(appointment.patients.intubation_date).toLocaleDateString('pt-BR') : '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Tempo Intub.:</span> {appointment.patients?.intubation_time || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Falha Extub.:</span> {appointment.patients?.extubation_failure || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Causa Intub.:</span> {appointment.patients?.intubation_cause || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Estridor Cong.:</span> {appointment.patients?.congenital_stridor || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Cirurgia Prévia:</span> {appointment.patients?.previous_surgery || '-'}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {[
                                            { label: 'PCR', value: appointment.patients?.pcr },
                                            { label: 'Hipóxia Grave', value: appointment.patients?.severe_hypoxia },
                                            { label: 'TQT Urgência', value: appointment.patients?.urgent_tqt },
                                            { label: 'Via Aérea Difícil', value: appointment.patients?.difficult_airway }
                                        ].map((item, idx) => (
                                            <span key={idx} className={`px-2 py-1 rounded text-[10px] font-bold border ${item.value ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800' : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'}`}>
                                                {item.label}: {item.value ? 'Sim' : 'Não'}
                                            </span>
                                        ))}
                                    </div>
                                    {appointment.patients?.prenatal_complications && (
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold block mb-1">Intercorrências Pré-natal:</span>
                                            {appointment.patients.prenatal_complications}
                                        </div>
                                    )}
                                </div>

                                {/* Comorbidities & Clinical Data */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase">Comorbidades e Dados Clínicos</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Cardíacas:</span> {appointment.patients?.comorbidities_cardiac || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Neurológicas:</span> {appointment.patients?.comorbidities_neurological || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Digestivas:</span> {appointment.patients?.comorbidities_digestive || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Infecciosas:</span> {appointment.patients?.comorbidities_infectious || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Genéticas:</span> {appointment.patients?.comorbidities_genetic || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Osteoarticulares:</span> {appointment.patients?.comorbidities_osteoarticular || 'Não informado'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Disfagia:</span> {appointment.patients?.dysphagia || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Hipersialorreia:</span> {appointment.patients?.hypersialorrhea || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Pneumonia Rep.:</span> {appointment.patients?.recurrent_pneumonia || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Tipo Cânula:</span> {appointment.patients?.cannula_type || '-'}
                                        </div>
                                    </div>

                                    {appointment.patients?.tracheostomy_clinical_history && (
                                        <div className="p-3 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold block mb-1">História Clínica da TQT:</span>
                                            {appointment.patients.tracheostomy_clinical_history}
                                        </div>
                                    )}
                                    {appointment.patients?.severe_complications && (
                                        <div className="p-3 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold block mb-1">Intercorrências Graves:</span>
                                            {appointment.patients.severe_complications}
                                        </div>
                                    )}
                                </div>

                                {/* Bronchoscopy */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase">Broncoscopia</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Narina:</span> {appointment.patients?.bronchoscopy_nostril || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Desvio Septo:</span> {appointment.patients?.nasal_septum_deviation || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Estenose Piriforme:</span> {appointment.patients?.piriform_aperture_stenosis || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Atresia Coana:</span> {appointment.patients?.choanal_atresia || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Estenose Narinária:</span> {appointment.patients?.nasal_stenosis || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Rinofaringe:</span> {appointment.patients?.rhinopharynx || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs col-span-2">
                                            <span className="text-slate-400 font-bold">Orofaringe:</span> {appointment.patients?.oropharynx || '-'}
                                        </div>
                                    </div>
                                </div>

                                {/* Laryngoscopy */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase">Laringe e Achados Morfológicos</h4>

                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {[
                                            { label: 'Preservada', value: appointment.patients?.larynx_preserved },
                                            { label: 'Redundância Arit.', value: appointment.patients?.larynx_arytenoid_redundancy },
                                            { label: 'Ligamentos Curtos', value: appointment.patients?.larynx_short_aryepiglottic_ligaments },
                                            { label: 'Epiglote Ômega', value: appointment.patients?.larynx_omega_epiglottis },
                                            { label: 'Epiglotoptose', value: appointment.patients?.larynx_epiglottoptosis },
                                            { label: 'Laringomalácia', value: appointment.patients?.larynx_laryngomalacia },
                                            { label: 'Nódulos Vocais', value: appointment.patients?.larynx_vocal_nodules },
                                            { label: 'Est. Glótica Post.', value: appointment.patients?.larynx_posterior_glottic_stenosis },
                                            { label: 'Glossoptose', value: appointment.patients?.glossoptosis }
                                        ].map((item, idx) => (
                                            <span key={idx} className={`px-2 py-1 rounded text-[10px] font-bold border ${item.value ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'}`}>
                                                {item.label}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Paralisia PV:</span> {appointment.patients?.larynx_vocal_fold_paralysis || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Posição:</span> {appointment.patients?.larynx_vocal_fold_paralysis_position || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Web Laríngeo:</span> {appointment.patients?.larynx_web || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Valécula:</span> {appointment.patients?.valecula || '-'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs col-span-2">
                                            <span className="text-slate-400 font-bold">Seios Piriformes:</span> {appointment.patients?.piriform_sinus || '-'}
                                        </div>
                                    </div>

                                    {appointment.patients?.morphological_findings && (
                                        <div className="p-3 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold block mb-1">Achados Morfológicos (Descritivo):</span>
                                            {appointment.patients.morphological_findings}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </details>

                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-800 flex-1 flex flex-col gap-6">

                            {/* Header: Evolution Title & IA */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                        <span className="material-symbols-outlined">clinical_notes</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Evolução Ambulatorial</h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Registro de Atendimento</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDraftNotes}
                                    disabled={loadingDraft}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-400 text-xs font-black rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-2"
                                >
                                    {loadingDraft ? (
                                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                    )}
                                    Sugestão com IA
                                </button>
                            </div>

                            {/* Section 1: Top Fields (Weight, Date, Culture, Isolation) */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Peso Atual</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            placeholder="Ex: 12kg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Data Atendimento</label>
                                        <div className="w-full bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-500">
                                            {new Date(appointment.date).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex items-center gap-2 cursor-pointer">
                                                <div className={`size-5 rounded border flex items-center justify-center ${appointment.patients?.homecare_active ? 'bg-indigo-500 border-indigo-500' : 'border-slate-400'}`}>
                                                    {appointment.patients?.homecare_active && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Homecare</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div
                                                className="flex items-center gap-2 cursor-pointer"
                                                onClick={() => setIsolation(!isolation)}
                                            >
                                                <div className={`size-5 rounded border flex items-center justify-center ${isolation ? 'bg-indigo-500 border-indigo-500' : 'border-slate-400'}`}>
                                                    {isolation && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Isolamento</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Resultado do Exame de Cultura</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={cultureResult}
                                        onChange={(e) => setCultureResult(e.target.value)}
                                        placeholder="Resultado..."
                                    />
                                </div>
                            </div>

                            {/* Section 2: Diagnósticos */}
                            <div>
                                <div className="bg-indigo-600 text-white px-4 py-1 rounded-t-xl text-xs font-black uppercase inline-block">Diagnósticos</div>
                                <textarea
                                    className="w-full h-20 p-4 rounded-b-xl rounded-tr-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-0 focus:outline-none resize-none text-slate-700 dark:text-slate-200 text-sm font-medium"
                                    placeholder="Liste os diagnósticos..."
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                            </div>

                            {/* Section 3: Evolução */}
                            <div>
                                <div className="bg-indigo-600 text-white px-4 py-1 rounded-t-xl text-xs font-black uppercase inline-block">Evolução: Intercorrências e Complicações</div>
                                <textarea
                                    className="w-full h-40 p-4 rounded-b-xl rounded-tr-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-0 focus:outline-none resize-none text-slate-700 dark:text-slate-200 text-sm font-medium leading-relaxed"
                                    placeholder="Descreva o atendimento detalhadamente..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Section 4: Planejamento Terapêutico */}
                            <div>
                                <div className="bg-indigo-600 text-white px-4 py-1 rounded-t-xl text-xs font-black uppercase inline-block">Planejamento Terapêutico</div>
                                <textarea
                                    className="w-full h-20 p-4 rounded-b-xl rounded-tr-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-0 focus:outline-none resize-none text-slate-700 dark:text-slate-200 text-sm font-medium"
                                    placeholder="Exames solicitados, encaminhamentos, novos procedimentos..."
                                    value={therapeuticPlan}
                                    onChange={(e) => setTherapeuticPlan(e.target.value)}
                                />
                            </div>

                            {/* Section 5: Retorno e Recomendações */}
                            <div>
                                <div className="bg-indigo-600 text-white px-4 py-1 rounded-t-xl text-xs font-black uppercase inline-block">Retorno Ambulatorial e Recomendações</div>
                                <textarea
                                    className="w-full h-20 p-4 rounded-b-xl rounded-tr-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-0 focus:outline-none resize-none text-slate-700 dark:text-slate-200 text-sm font-medium"
                                    placeholder="Recomendações para a família e data de retorno..."
                                    value={returnRecommendations}
                                    onChange={(e) => setReturnRecommendations(e.target.value)}
                                />
                            </div>

                        </div>


                        {/* Document Buttons */}
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
                            <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-wider">Documentos & Receituários</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => { setDocType('prescription'); setShowDocGenerator(true); }}
                                    className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <span className="material-symbols-outlined text-indigo-500 text-lg">prescriptions</span>
                                    Gerar Receita
                                </button>
                                <button
                                    onClick={() => { setDocType('certificate'); setShowDocGenerator(true); }}
                                    className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <span className="material-symbols-outlined text-emerald-500 text-lg">medical_services</span>
                                    Gerar Atestado
                                </button>
                                <button
                                    onClick={() => { setDocType('exam_request'); setShowDocGenerator(true); }}
                                    className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800 hover:text-purple-600 dark:hover:text-purple-300 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <span className="material-symbols-outlined text-purple-500 text-lg">assignment</span>
                                    Pedido Exame
                                </button>
                            </div>
                        </div>

                        {/* Patient Attachments */}
                        {appointment.patient_id && (
                            <PatientDocuments
                                patientId={appointment.patient_id}
                                appointmentId={appointmentId}
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {appointment.status === 'Realizada' ? (
                                <>
                                    <button
                                        onClick={() => handleFinish()}
                                        disabled={saving}
                                        className="h-16 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group md:col-span-2"
                                    >
                                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">save</span>
                                        <span>Atualizar Parecer</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleFinish()}
                                        disabled={saving}
                                        className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                                    >
                                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">check_circle</span>
                                        <span>Finalizar Atendimento</span>
                                    </button>

                                    <button
                                        onClick={() => handleFinish(`/agenda/new?patientId=${appointment.patient_id}`)}
                                        disabled={saving}
                                        className="h-16 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                                    >
                                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">event_repeat</span>
                                        <span>Finalizar e Agendar Retorno</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Document Generator Modal */}
            {showDocGenerator && (
                <DocumentGenerator
                    type={docType}
                    patientName={appointment?.patients?.name || 'Paciente'}
                    doctorName={appointment?.doctors?.name || 'Médico'}
                    onClose={() => setShowDocGenerator(false)}
                />
            )}
        </Layout>
    );
};

export default MedicalConsultation;
