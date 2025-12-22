import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const SurgicalMapDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Assuming useAuth provides current user info
    const [loading, setLoading] = useState(true);
    const [map, setMap] = useState<any>(null);
    const [evolutions, setEvolutions] = useState<any[]>([]);
    const [newEvolution, setNewEvolution] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            // Fetch Surgical Map Details
            const { data: mapData, error: mapError } = await supabase
                .from('surgical_maps')
                .select('*')
                .eq('id', id)
                .single();

            if (mapError) throw mapError;
            setMap(mapData);

            // Fetch Evolutions
            await fetchEvolutions();

        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            alert('Erro ao carregar mapa cirúrgico.');
        } finally {
            setLoading(false);
        }
    };

    const fetchEvolutions = async () => {
        const { data: evoData, error: evoError } = await supabase
            .from('surgical_evolutions')
            .select('*')
            .eq('surgical_map_id', id)
            .order('created_at', { ascending: false });

        if (evoError) console.error('Error fetching evolutions:', evoError);
        else setEvolutions(evoData || []);
    };

    const handleAddEvolution = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvolution.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('surgical_evolutions').insert([{
                surgical_map_id: id,
                content: newEvolution,
                professional_name: user?.email || 'Profissional' // Ideal seria ter o nome do usuário no perfil
            }]);

            if (error) throw error;

            setNewEvolution('');
            fetchEvolutions(); // Refresh list
        } catch (error: any) {
            alert('Erro ao adicionar evolução: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-xl font-bold text-slate-400">Carregando detalhes...</div>
                </div>
            </Layout>
        );
    }

    if (!map) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-xl font-bold text-slate-400">Mapa cirúrgico não encontrado.</div>
                    <button onClick={() => navigate('/surgical-maps')} className="text-primary hover:underline">Voltar para lista</button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/surgical-maps')} className="size-12 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition-all">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Detalhes do Procedimento</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase">{map.patient_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-black shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">print</span>
                        Imprimir / PDF
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Surgical Map Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm print:shadow-none print:border-none">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <span className="material-symbols-outlined text-primary text-3xl">medical_services</span>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Mapa Cirúrgico</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Data/Hora</label>
                                    <p className="font-bold text-slate-900 dark:text-white">{new Date(map.surgery_date).toLocaleString('pt-BR')}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Procedimento</label>
                                    <p className="font-bold text-slate-900 dark:text-white">{map.procedure}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Médicos</label>
                                    <div className="flex flex-wrap gap-2">
                                        {map.doctors?.map((doc: string, i: number) => (
                                            <span key={i} className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold">
                                                {doc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">OPME</label>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">{map.opme || '-'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Equipamentos</label>
                                    <div className="flex flex-wrap gap-2">
                                        {map.equipment?.map((eq: string, i: number) => (
                                            <span key={i} className="px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 text-xs font-bold">
                                                {eq}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Setor Pós-Op</label>
                                    <p className="font-bold text-slate-900 dark:text-white">{map.post_op_sector || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">CNS</label>
                                    <p className="font-bold text-slate-900 dark:text-white">{map.cns || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Post-Op Evolution */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full print:break-before-page">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <span className="material-symbols-outlined text-emerald-500 text-3xl">history_edu</span>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Evolução Pós-Op</h2>
                            </div>

                            {/* Evolution List */}
                            <div className="flex-1 overflow-y-auto max-h-[500px] space-y-6 mb-6 pr-2 custom-scrollbar">
                                {evolutions.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">Nenhuma evolução registrada.</div>
                                ) : (
                                    evolutions.map((evo) => (
                                        <div key={evo.id} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 pb-2">
                                            <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-emerald-500 border-4 border-white dark:border-surface-dark"></div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(evo.created_at).toLocaleString('pt-BR')}</span>
                                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 truncate max-w-[100px]" title={evo.professional_name}>
                                                    {evo.professional_name}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl rounded-tl-none">
                                                {evo.content}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Evolution Form (Hidden in Print) */}
                            <div className="print:hidden mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Nova Evolução</label>
                                <textarea
                                    value={newEvolution}
                                    onChange={(e) => setNewEvolution(e.target.value)}
                                    placeholder="Descreva a evolução do paciente..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:border-emerald-500 focus:outline-none mb-3 resize-none"
                                />
                                <button
                                    onClick={handleAddEvolution}
                                    disabled={isSubmitting || !newEvolution.trim()}
                                    className="w-full h-12 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">send</span>
                                            Registrar Evolução
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SurgicalMapDetail;
