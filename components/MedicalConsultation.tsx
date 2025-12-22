import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { supabase } from '../supabaseClient';
import { draftClinicalNotes } from '../geminiService';
import DocumentGenerator from './DocumentGenerator';

const MedicalConsultation: React.FC = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [appointment, setAppointment] = useState<any>(null);
    const [notes, setNotes] = useState('');
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
            if (data.notes) setNotes(data.notes);
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
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">{appointment.patients?.name}</h2>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider">ID: {appointment.patient_id?.slice(0, 6)}</span>
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider">{appointment.patients?.age || 'N/A'} Anos</span>
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
                                <div className="p-3 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Cidade</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{appointment.patients?.city || 'Não informada'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">badge</span>
                                Dados Pessoais
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="p-3 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nome da Mãe</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{appointment.patients?.mother_name || 'Não informado'}</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Cartão SUS</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{appointment.patients?.sus_card || 'Não informado'}</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Data de Nascimento</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {appointment.patients?.birth_date ? new Date(appointment.patients.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Clinical Notes */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Admission Form - Collapsible */}
                        <details open className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
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
                                {/* Birth/Gestational Data */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase">Dados de Nascimento/Gestação</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Tipo de Parto:</span> {appointment.patients?.birth_type || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">APGAR:</span> {appointment.patients?.apgar || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Peso:</span> {appointment.patients?.birth_weight || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">IG:</span> {appointment.patients?.gestational_age || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Perímetro Cefálico:</span> {appointment.patients?.cephalic_perimeter || 'Não informado'}
                                        </div>
                                    </div>
                                </div>

                                {/* Comorbidities */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase">Comorbidades</h4>
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
                                    </div>
                                </div>

                                {/* Clinical History */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase">História Clínica da Traqueostomia</h4>
                                    <div className="p-3 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                        {appointment.patients?.tracheostomy_clinical_history || 'Não informado'}
                                    </div>
                                </div>

                                {/* Clinical Data */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase">Dados Clínicos</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Disfagia:</span> {appointment.patients?.dysphagia || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Tipo de Cânula:</span> {appointment.patients?.cannula_type || 'Não informado'}
                                        </div>
                                        <div className="p-2 rounded-lg bg-white dark:bg-surface-dark text-xs">
                                            <span className="text-slate-400 font-bold">Pneumonia Repetição:</span> {appointment.patients?.recurrent_pneumonia || 'Não informado'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>

                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-800 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                        <span className="material-symbols-outlined">clinical_notes</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Evolução Clínica / Parecer</h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Descreva o atendimento detalhadamente</p>
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

                            <textarea
                                className="flex-1 w-full min-h-[300px] p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:ring-0 focus:outline-none resize-none text-slate-700 dark:text-slate-200 text-base leading-relaxed transition-all placeholder:text-slate-400 font-medium"
                                placeholder="Digite aqui as observações do atendimento, condutas realizadas e orientações passadas ao paciente..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                autoFocus
                            />
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
