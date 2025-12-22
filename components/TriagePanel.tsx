import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';

const TriagePanel: React.FC = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState<any>(null);

    useEffect(() => {
        fetchAppointments();

        // Subscribe to changes
        const subscription = supabase
            .channel('public:appointments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchAppointments = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('appointments')
            .select('*, patients(name, age, avatar_url), doctors(name)')
            .eq('date', today)
            .neq('status', 'Cancelada')
            .order('time');

        if (data) setAppointments(data);
        setLoading(false);
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
        fetchAppointments(); // Optimistic update would be better but this is safer
    };

    const handleDragStart = (e: React.DragEvent, item: any) => {
        setDraggedItem(item);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (draggedItem && draggedItem.status !== status) {
            handleStatusChange(draggedItem.id, status);
        }
        setDraggedItem(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Agendada': return 'bg-slate-100 border-slate-200 text-slate-500';
            case 'Aguardando': return 'bg-orange-50 border-orange-200 text-orange-600';
            case 'Em Atendimento': return 'bg-indigo-50 border-indigo-200 text-indigo-600';
            case 'Realizada': return 'bg-emerald-50 border-emerald-200 text-emerald-600';
            default: return 'bg-slate-50 border-slate-200 text-slate-500';
        }
    };

    const Columns = [
        { id: 'Agendada', title: 'Agendados', icon: 'calendar_today', color: 'text-slate-500' },
        { id: 'Aguardando', title: 'Na Recepção', icon: 'person_pin', color: 'text-orange-500' },
        { id: 'Em Atendimento', title: 'Em Consultório', icon: 'stethoscope', color: 'text-indigo-500' },
        { id: 'Realizada', title: 'Finalizados', icon: 'check_circle', color: 'text-emerald-500' },
    ];

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-140px)]">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Painel de Triagem</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase">Gestão de Fluxo de Pacientes - {new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button
                        onClick={fetchAppointments}
                        className="size-10 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-500 shadow-sm"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                </div>

                <div className="flex-1 flex gap-6 overflow-x-auto pb-6">
                    {Columns.map(col => (
                        <div
                            key={col.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                            className="flex-1 min-w-[300px] flex flex-col bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl p-4 border border-dashed border-slate-200 dark:border-slate-800/50"
                        >
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <span className={`material-symbols-outlined ${col.color}`}>{col.icon}</span>
                                <h3 className="font-black text-slate-600 dark:text-slate-300 uppercase text-xs tracking-wider">{col.title}</h3>
                                <span className="ml-auto bg-white dark:bg-surface-dark px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm border border-slate-100 dark:border-slate-800">
                                    {appointments.filter(a => a.status === col.id).length}
                                </span>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                {appointments.filter(a => a.status === col.id).map(apt => (
                                    <div
                                        key={apt.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, apt)}
                                        className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-move hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group active:cursor-grabbing"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-black text-lg text-slate-900 dark:text-white">{apt.time.slice(0, 5)}</span>
                                            {col.id === 'Agendada' && (
                                                <button
                                                    onClick={() => handleStatusChange(apt.id, 'Aguardando')}
                                                    className="text-[10px] font-bold bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Chegou
                                                </button>
                                            )}
                                            {col.id === 'Aguardando' && (
                                                <button
                                                    onClick={() => handleStatusChange(apt.id, 'Em Atendimento')}
                                                    className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Chamar
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mb-3">
                                            {apt.patients?.avatar_url ? (
                                                <img src={apt.patients.avatar_url} className="size-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                                    {apt.patients?.name?.[0]}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{apt.patients?.name}</p>
                                                <p className="text-xs text-slate-500 font-medium">{apt.doctors?.name}</p>
                                            </div>
                                        </div>

                                        {col.id === 'Em Atendimento' && (
                                            <button
                                                onClick={() => navigate(`/consultation/${apt.id}`)}
                                                className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">edit_document</span>
                                                Abrir Prontuário
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default TriagePanel;
