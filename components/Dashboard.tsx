
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    realized: 0,
    missed: 0,
    missedRate: '0%'
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [doctorStats, setDoctorStats] = useState<any[]>([]);
  const [cityStats, setCityStats] = useState<any[]>([]);

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
      loadDashboardData();
    }
  }, [startDate, endDate, searchText]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Appointments for Stats and Doctor Distribution (filtered by date range)
      let query = supabase
        .from('appointments')
        .select('*, doctors(name), patients(name)')
        .gte('date', startDate)
        .lte('date', endDate);

      // Apply text search if provided
      if (searchText) {
        query = query.or(`patients.name.ilike.%${searchText}%,doctors.name.ilike.%${searchText}%`);
      }

      const { data: apts, error: aptError } = await query;

      if (aptError) throw aptError;

      const total = apts?.length || 0;
      const realized = apts?.filter(a => a.status === 'Realizada').length || 0;
      const missed = apts?.filter(a => a.status === 'Falta' || a.status === 'Cancelada').length || 0;
      const missedRate = total > 0 ? Math.round((missed / total) * 100) + '%' : '0%';

      setStats({ total, realized, missed, missedRate });

      // Doctor Stats
      const docCounts: Record<string, number> = {};
      apts?.forEach(a => {
        const docName = a.doctors?.name || 'Não informado';
        docCounts[docName] = (docCounts[docName] || 0) + 1;
      });

      const docStatsArray = Object.entries(docCounts)
        .map(([name, count]) => ({ name, count, percent: (count / total) * 100 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setDoctorStats(docStatsArray);

      // 2. Fetch Today's Appointments (within date range)
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: recent, error: recentError } = await supabase
        .from('appointments')
        .select('*, doctors(name), patients(name, avatar_url)')
        .eq('date', todayStr)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('time', { ascending: true });

      if (recentError) throw recentError;
      setRecentAppointments(recent || []);

      // 3. Fetch Patients for City Distribution
      const { data: patients, error: patError } = await supabase
        .from('patients')
        .select('city');

      if (patError) throw patError;

      const totalPatients = patients?.length || 0;
      const cityCounts: Record<string, number> = {};
      patients?.forEach(p => {
        const city = p.city || 'Não informado';
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      });

      const cityStatsArray = Object.entries(cityCounts)
        .map(([name, count]) => ({ name, count, percent: totalPatients > 0 ? (count / totalPatients) * 100 : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setCityStats(cityStatsArray);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Agendadas", value: stats.total, icon: "calendar_month", color: "primary" },
    { title: "Realizadas", value: stats.realized, icon: "check_circle", color: "emerald-500" },
    { title: "Faltas/Cancel", value: stats.missed, icon: "cancel", color: "rose-500" },
    { title: "Taxa de Faltas", value: stats.missedRate, icon: "percent", color: "amber-500" }
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Visão geral das consultas</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Olá, {user?.email?.split('@')[0] || 'Admin'}</h2>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined text-[20px] text-primary">calendar_today</span>
            <span className="font-bold capitalize">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
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

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${card.color.includes('emerald') ? 'text-emerald-500' : card.color.includes('rose') ? 'text-rose-500' : card.color.includes('amber') ? 'text-amber-500' : 'text-primary'}`}>
                  <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-wider mb-1">{card.title}</p>
              <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{loading ? '...' : card.value}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doctor Stats */}
          <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                <span className="material-symbols-outlined text-[24px]">bar_chart</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Consultas por Médico</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Volume Mensal</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[250px] pr-2">
              {loading ? <p className="text-center text-slate-400 py-8">Carregando...</p> : doctorStats.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm font-bold">Nenhum dado disponível</p>
              ) : (
                doctorStats.map((doc, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{doc.name}</span>
                      <span className="text-slate-500">{doc.count} ({Math.round(doc.percent)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${doc.percent}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* City Stats */}
          <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="size-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-500">
                <span className="material-symbols-outlined text-[24px]">map</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Distribuição Geográfica</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pacientes por Cidade</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[250px] pr-2">
              {loading ? <p className="text-center text-slate-400 py-8">Carregando...</p> : cityStats.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm font-bold">Nenhum dado disponível</p>
              ) : (
                cityStats.map((city, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{city.name}</span>
                      <span className="text-slate-500">{city.count} ({Math.round(city.percent)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${city.percent}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Recent Appointments */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">schedule</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Agenda de Hoje</h3>
            </div>
            <Link to="/agenda/new" className="px-6 py-3 text-xs font-black rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary-dark text-white transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">add</span>
              Novo Agendamento
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-8">Horário</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Paciente</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Médico</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">Carregando...</td></tr>
                ) : recentAppointments.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">Nenhum agendamento recente.</td></tr>
                ) : (
                  recentAppointments.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-6 pl-8 whitespace-nowrap font-black text-slate-900 dark:text-white">
                        {new Date(row.date).toLocaleDateString('pt-BR')} <span className="text-slate-400 font-medium ml-1">{row.time?.slice(0, 5)}</span>
                      </td>
                      <td className="p-6 whitespace-nowrap">
                        <Link to={`/patients/${row.patient_id}`} className="flex items-center gap-3 group/link">
                          {row.patients?.avatar_url ? (
                            <img src={row.patients.avatar_url} alt="" className="size-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700 group-hover/link:ring-primary transition-all" />
                          ) : (
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary ring-2 ring-slate-100 dark:ring-slate-700 group-hover/link:ring-primary transition-all">
                              <span className="material-symbols-outlined text-sm">person</span>
                            </div>
                          )}
                          <span className="text-sm font-bold text-slate-900 dark:text-white group-hover/link:text-primary transition-colors">{row.patients?.name || 'Desconhecido'}</span>
                        </Link>
                      </td>
                      <td className="p-6 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-bold">{row.doctors?.name || '-'}</td>
                      <td className="p-6 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${row.status === 'Realizada' ? 'bg-emerald-50 text-emerald-600' :
                          row.status === 'Agendada' ? 'bg-primary/10 text-primary-dark' :
                            'bg-rose-50 text-rose-600'
                          }`}>
                          <span className={`size-1.5 rounded-full ${row.status === 'Realizada' ? 'bg-emerald-500' :
                            row.status === 'Agendada' ? 'bg-primary' :
                              'bg-rose-500'
                            }`}></span>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
