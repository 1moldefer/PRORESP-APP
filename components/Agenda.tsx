
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Agenda: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
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
      fetchAppointments();
    }
  }, [startDate, endDate, searchText]);

  const fetchAppointments = async () => {
    setLoading(true);

    let query = supabase
      .from('appointments')
      .select('*, patients(name), doctors(name, specialty)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    // Apply text search if provided
    if (searchText) {
      query = query.or(`patients.name.ilike.%${searchText}%,doctors.name.ilike.%${searchText}%`);
    }

    const { data } = await query;

    if (data) setAppointments(data);
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    const reason = window.prompt("Motivo do cancelamento:");
    if (!reason) return;

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'Cancelada', cancellation_reason: reason })
      .eq('id', id);

    if (error) {
      alert('Erro ao cancelar: ' + error.message);
    } else {
      alert('Consulta cancelada com sucesso.');
      fetchAppointments();
    }
  };

  const stats = [
    { label: "Total", val: appointments.length, icon: "event_note", color: "slate" },
    { label: "Pendentes", val: appointments.filter(a => a.status === 'Agendada').length, icon: "schedule", color: "amber" },
    { label: "Confirmados", val: appointments.filter(a => a.status === 'Realizada').length, icon: "check_circle", color: "primary" },
    { label: "Cancelados", val: appointments.filter(a => a.status === 'Cancelada').length, icon: "cancel", color: "rose" },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col gap-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter text-slate-900 dark:text-white">Agenda</h1>
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined text-[24px]">calendar_today</span>
              <p className="text-lg font-bold">Visão Geral</p>
            </div>
          </div>
          <Link to="/agenda/new" className="flex items-center justify-center gap-3 rounded-2xl h-14 px-8 bg-primary text-white text-base font-black shadow-xl shadow-primary/10 hover:bg-primary-dark transition-all">
            <span className="material-symbols-outlined">add</span>
            <span>Novo Agendamento</span>
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
            <p className="text-center text-slate-400 py-12">Carregando agenda...</p>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
              <span className="material-symbols-outlined text-[48px] opacity-20">event_busy</span>
              <p className="font-bold">Nenhum agendamento encontrado.</p>
            </div>
          ) : (
            appointments.map((apt, i) => (
              <div key={i} className={`group relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-3xl bg-white dark:bg-surface-dark p-6 border-l-[6px] shadow-sm border-slate-200 dark:border-slate-800 transition-all hover:shadow-md ${apt.status === 'Realizada' ? 'border-l-primary' :
                apt.status === 'Agendada' ? 'border-l-amber-400' : 'border-l-rose-400'
                }`}>
                <div className="flex items-start gap-6 flex-1">
                  <div className="flex flex-col items-center justify-start pt-1 min-w-[70px]">
                    <span className={`text-2xl font-black ${apt.status === 'Realizada' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{apt.time?.slice(0, 5)}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">{new Date(apt.date).getDate()}/{new Date(apt.date).getMonth() + 1}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link to={`/patients/${apt.patient_id}`} className="hover:underline hover:text-primary transition-colors">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{apt.patients?.name || 'Paciente desconhecido'}</h3>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${apt.status === 'Agendada' ? 'bg-amber-50 text-amber-700' :
                        apt.status === 'Realizada' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                        {apt.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{apt.doctors?.specialty || 'Especialidade'}</span>
                      <span className="text-[11px] font-bold text-slate-500">Dr(a). {apt.doctors?.name || ''}</span>
                    </div>
                    {apt.cancellation_reason && (
                      <p className="text-xs text-rose-500 italic mt-1">Motivo: {apt.cancellation_reason}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/patients/${apt.patient_id}`}
                    title="Acessar Prontuário"
                    className="size-11 flex items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 transition-all"
                  >
                    <span className="material-symbols-outlined">assignment_ind</span>
                  </Link>
                  {apt.status !== 'Cancelada' && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      title="Cancelar Consulta"
                      className="size-11 flex items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-all"
                    >
                      <span className="material-symbols-outlined">cancel</span>
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

export default Agenda;
