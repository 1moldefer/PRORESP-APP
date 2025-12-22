import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Surgeries: React.FC = () => {
    const navigate = useNavigate();
    const [surgeries, setSurgeries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchText, setSearchText] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        // Set default date range to current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchSurgeries();
        }
    }, [startDate, endDate, searchText]);

    const fetchSurgeries = async () => {
        setLoading(true);

        let query = supabase
            .from('surgeries')
            .select('*, patients(name, avatar_url), doctors(name, specialty)')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (searchText) {
            query = query.or(`patients.name.ilike.%${searchText}%,doctors.name.ilike.%${searchText}%`);
        }

        const { data } = await query;
        if (data) setSurgeries(data);
        setLoading(false);
    };

    const handleCancel = async (id: string) => {
        const reason = window.prompt("Motivo do cancelamento:");
        if (!reason) return;

        const { error } = await supabase
            .from('surgeries')
            .update({ status: 'Cancelada', cancellation_reason: reason })
            .eq('id', id);

        if (error) {
            alert('Erro ao cancelar: ' + error.message);
        } else {
            alert('Cirurgia cancelada com sucesso.');
            fetchSurgeries();
        }
    };

    const stats = [
        { label: "Total", val: surgeries.length, icon: "surgical", color: "slate" },
        { label: "Agendadas", val: surgeries.filter(s => s.status === 'Agendada').length, icon: "schedule", color: "amber" },
        { label: "Realizadas", val: surgeries.filter(s => s.status === 'Realizada').length, icon: "check_circle", color: "primary" },
        { label: "Canceladas", val: surgeries.filter(s => s.status === 'Cancelada').length, icon: "cancel", color: "rose" },
    ];

    return (
        <Layout>
            <div className="max-w-5xl mx-auto flex flex-col gap-10 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter text-slate-900 dark:text-white">Cirurgias Eletivas</h1>
                        <div className="flex items-center gap-3 text-primary">
                            <span className="material-symbols-outlined text-[24px]">surgical</span>
                            <p className="text-lg font-bold">Agendamento Cirúrgico</p>
                        </div>
                    </div>
                    <Link to="/surgeries/new" className="flex items-center justify-center gap-3 rounded-2xl h-14 px-8 bg-primary text-white text-base font-black shadow-xl shadow-primary/10 hover:bg-primary-dark transition-all">
                        <span className="material-symbols-outlined">add</span>
                        <span>Nova Cirurgia</span>
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="flex flex-col gap-1 rounded-2xl p-5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className={`flex items-center gap-2 mb-2 ${stat.color === 'primary' ? 'text-primary' : stat.color === 'amber' ? 'text-amber-500' : stat.color === 'rose' ? 'text-rose-500' : 'text-slate-400'}`}>
                                <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{stat.label}</p>
                            </div>
                            <p className="text-slate-900 dark:text-white text-3xl font-black">{stat.val}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Data Inicial</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-0 focus:outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Data Final</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-0 focus:outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Buscar</label>
                            <input
                                type="text"
                                placeholder="Nome do paciente ou médico..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 focus:border-primary focus:ring-0 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {loading ? (
                        <p className="text-center text-slate-400 py-12">Carregando cirurgias...</p>
                    ) : surgeries.length === 0 ? (
                        <p className="text-center text-slate-400 py-12">Nenhuma cirurgia agendada para este período.</p>
                    ) : (
                        surgeries.map((surgery) => (
                            <div key={surgery.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center justify-center size-20 rounded-2xl bg-primary/5 border-2 border-primary/20 shrink-0">
                                        <span className="text-xs font-black uppercase text-primary/60">{new Date(surgery.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                        <span className="text-2xl font-black text-primary">{new Date(surgery.date).getDate()}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            {surgery.patients?.avatar_url ? (
                                                <img src={surgery.patients.avatar_url} alt="" className="size-10 rounded-xl object-cover" />
                                            ) : (
                                                <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-black text-slate-900 dark:text-white text-lg">{surgery.patients?.name || 'Paciente não informado'}</h3>
                                                <p className="text-xs text-slate-500 font-medium">{surgery.surgery_type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">person</span>
                                                <span className="font-bold">{surgery.doctors?.name || 'Médico não informado'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                <span className="font-bold">{surgery.time.slice(0, 5)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-4 py-2 rounded-xl text-xs uppercase font-black tracking-widest ${surgery.status === 'Realizada' ? 'bg-emerald-50 text-emerald-600' :
                                            surgery.status === 'Cancelada' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                        {surgery.status}
                                    </span>
                                    {surgery.status === 'Agendada' && (
                                        <button
                                            onClick={() => handleCancel(surgery.id)}
                                            className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">block</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Surgeries;
