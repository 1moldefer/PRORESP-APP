
import React, { useMemo, useState } from 'react';
import Layout from './Layout';
import { useAuth } from './AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { getDashboardAnalysis } from '../openaiService';
import StatCard from './ui/StatCard';
import ChartCard from './ui/ChartCard';
import StatusBadge from './ui/StatusBadge';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { loading, data, filters, updateFilter } = useDashboardData();

  // AI Report State
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContent, setReportContent] = useState('');

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const periodStr = `Período de ${new Date(filters.startDate).toLocaleDateString('pt-BR')} até ${new Date(filters.endDate).toLocaleDateString('pt-BR')}`;
      // Simplify data for AI to avoid token limits
      const analysisData = {
        totals: data.stats,
        monthlyTrends: data.monthlySeries,
        topHospitals: data.hospitalStats.slice(0, 5),
        topDoctors: data.doctorStats.slice(0, 5),
        demographics: data.patientStats
      };

      const result = await getDashboardAnalysis(periodStr, analysisData);
      setReportContent(result);
      setShowReportModal(true);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar relatório.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
            <html>
              <head>
                <title>Relatório de Gestão Clínica - ProResp</title>
                <style>
                  body { font-family: sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
                  h1 { font-size: 24px; font-weight: 900; margin-bottom: 8px; color: #0f172a; }
                  p.date { color: #64748b; font-size: 14px; margin-bottom: 32px; font-weight: bold; }
                  .content { white-space: pre-wrap; line-height: 1.6; font-size: 14px; }
                  strong { color: #0f172a; font-weight: 800; }
                  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
                </style>
              </head>
              <body>
                <h1>Relatório de Análise Clínica</h1>
                <p class="date">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                <div class="content">${reportContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
                <div class="footer">Projeto Respirar • Gestão de Traqueostomia Infantil</div>
                <script>
                   window.onload = function() { window.print(); }
                </script>
              </body>
            </html>
          `);
      printWindow.document.close();
    }
  };



  // Max value for chart scaling
  const maxSeriesValue = useMemo(() => {
    return Math.max(...data.monthlySeries.map(s => Math.max(s.total, s.discharges, s.deaths, s.realized, s.missed)), 1);
  }, [data.monthlySeries]);

  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-12 overflow-x-hidden pt-4 md:pt-0">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-[0.15em] mb-2">Monitoramento Ativo ProResp</p>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Olá, <span className="capitalize">{user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin'}</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              title={darkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              <span className="material-symbols-outlined text-[20px] text-amber-500">{darkMode ? 'light_mode' : 'dark_mode'}</span>
              <span className="hidden sm:inline">{darkMode ? 'Claro' : 'Escuro'}</span>
            </button>
            <div className="flex items-center gap-3 bg-white dark:bg-surface-dark px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-[20px] text-primary">event</span>
              <span className="font-black capitalize">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* Filters - Improved layout */}
        <section className="bg-white dark:bg-surface-dark rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Início da Análise</label>
              <div className="relative group">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
                <span className="material-symbols-outlined absolute left-4 top-3.5 text-slate-400 text-[20px] pointer-events-none group-focus-within:text-primary transition-colors">calendar_today</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Fim da Análise</label>
              <div className="relative group">
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
                <span className="material-symbols-outlined absolute left-4 top-3.5 text-slate-400 text-[20px] pointer-events-none group-focus-within:text-primary transition-colors">event</span>
              </div>
            </div>
            {/* AI Analysis Button (Replaces Search) */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Inteligência Clínica</label>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || loading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>

                {isGenerating ? (
                  <>
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span className="text-sm">Analisando Dados...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                    <span className="text-sm">Gerar Relatório IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Summary Chart Section (Replacing Cards) */}
        <section className="bg-white dark:bg-surface-dark rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 flex-shrink-0">
              <span className="material-symbols-outlined">bar_chart</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Resumo do Período</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Totais acumulados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Clinical Outcomes */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Desfechos Clínicos</span>
                <span className="text-[10px] font-bold text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">PACIENTES</span>
              </div>
              <div className="space-y-4">
                {/* Discharges */}
                <div className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Altas do Projeto</span>
                    <span className="text-xl font-black text-emerald-500">{data.stats.totalDischarges}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.max((data.stats.totalDischarges / (Math.max(data.stats.totalDischarges, data.stats.totalDeaths, 1) * 1.2)) * 100, 5)}%` }}></div>
                  </div>
                </div>
                {/* Deaths */}
                <div className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-rose-500 transition-colors">Óbitos no Período</span>
                    <span className="text-xl font-black text-rose-500">{data.stats.totalDeaths}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${Math.max((data.stats.totalDeaths / (Math.max(data.stats.totalDischarges, data.stats.totalDeaths, 1) * 1.2)) * 100, 5)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Productivity */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Produtividade da Agenda</span>
                <span className="text-[10px] font-bold text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">CONSULTAS</span>
              </div>
              <div className="space-y-4">
                {/* Scheduled */}
                <div className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-500 transition-colors">Consultas Agendadas</span>
                    <span className="text-xl font-black text-slate-500">{data.stats.total}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full transition-all duration-1000" style={{ width: `${Math.max((data.stats.total / (Math.max(data.stats.total, data.stats.realized, data.stats.missed, 1) * 1.2)) * 100, 5)}%` }}></div>
                  </div>
                </div>
                {/* Realized */}
                <div className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">Consultas Realizadas</span>
                    <span className="text-xl font-black text-primary">{data.stats.realized}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.max((data.stats.realized / (Math.max(data.stats.total, data.stats.realized, data.stats.missed, 1) * 1.2)) * 100, 5)}%` }}></div>
                  </div>
                </div>
                {/* Missed */}
                <div className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-500 transition-colors">Faltas e Cancelamentos</span>
                    <span className="text-xl font-black text-amber-500">{data.stats.missed}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${Math.max((data.stats.missed / (Math.max(data.stats.total, data.stats.realized, data.stats.missed, 1) * 1.2)) * 100, 5)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Chart Section - Fixed horizontal padding */}
        <section className="bg-white dark:bg-surface-dark rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Desfechos Clínicos Mensais</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Distribuição temporal de desfechos e produtividade</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase"><span className="size-2 rounded-full bg-slate-400"></span> Agendado</div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase"><span className="size-2 rounded-full bg-emerald-500"></span> Altas</div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[10px] font-black uppercase"><span className="size-2 rounded-full bg-rose-500"></span> Óbitos</div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase"><span className="size-2 rounded-full bg-primary"></span> Consultas</div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-black uppercase"><span className="size-2 rounded-full bg-amber-500"></span> Faltas/Canc.</div>
            </div>
          </div>

          <div className="relative w-full overflow-x-auto custom-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 left-6 right-6 lg:left-0 lg:right-0 h-[300px] pointer-events-none flex flex-col justify-between text-[9px] text-slate-300 font-bold z-0">
              <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-px relative"><span className="absolute -top-2 left-0">100%</span></div>
              <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-px relative"><span className="absolute -top-2 left-0">75%</span></div>
              <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-px relative"><span className="absolute -top-2 left-0">50%</span></div>
              <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-px relative"><span className="absolute -top-2 left-0">25%</span></div>
              <div className="border-b border-slate-200 dark:border-slate-800 w-full h-px"></div>
            </div>

            <div className="min-w-[800px] h-[350px] flex items-end justify-between gap-4 pb-4 border-b border-transparent relative z-10 pt-8 pl-8">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-slate-300 font-black animate-pulse uppercase tracking-[0.5em] text-sm">Carregando Dados...</div>
              ) : data.monthlySeries.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Sem dados no período</div>
              ) : (
                data.monthlySeries.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3 flex-1 group">
                    <div className="w-full flex justify-center gap-[4px] items-end h-[280px] relative">


                      {/* Bars */}
                      {/* Agendado (Total) */}
                      <div className="relative group/bar w-full max-w-[24px] rounded-t-lg bg-slate-100 dark:bg-slate-800 transition-all hover:bg-slate-200 h-full flex items-end overflow-hidden">
                        <div style={{ height: `${(item.total / maxSeriesValue) * 100}%` }} className="w-full bg-slate-400 absolute bottom-0 transition-all duration-1000 ease-out min-h-[4px]"></div>
                      </div>

                      {/* Discharges */}
                      <div className="relative group/bar w-full max-w-[24px] rounded-t-lg bg-emerald-50 dark:bg-emerald-900/10 transition-all hover:bg-emerald-100 h-full flex items-end overflow-hidden">
                        <div style={{ height: `${(item.discharges / maxSeriesValue) * 100}%` }} className="w-full bg-emerald-500 absolute bottom-0 transition-all duration-1000 ease-out delay-75 min-h-[4px]"></div>
                      </div>

                      {/* Deaths */}
                      <div className="relative group/bar w-full max-w-[24px] rounded-t-lg bg-rose-50 dark:bg-rose-900/10 transition-all hover:bg-rose-100 h-full flex items-end overflow-hidden">
                        <div style={{ height: `${(item.deaths / maxSeriesValue) * 100}%` }} className="w-full bg-rose-500 absolute bottom-0 transition-all duration-1000 ease-out delay-150 min-h-[4px]"></div>
                      </div>

                      {/* Realized */}
                      <div className="relative group/bar w-full max-w-[24px] rounded-t-lg bg-indigo-50 dark:bg-indigo-900/10 transition-all hover:bg-indigo-100 h-full flex items-end overflow-hidden">
                        <div style={{ height: `${(item.realized / maxSeriesValue) * 100}%` }} className="w-full bg-indigo-500 absolute bottom-0 transition-all duration-1000 ease-out delay-200 min-h-[4px]"></div>
                      </div>

                      {/* Missed */}
                      <div className="relative group/bar w-full max-w-[24px] rounded-t-lg bg-amber-50 dark:bg-amber-900/10 transition-all hover:bg-amber-100 h-full flex items-end overflow-hidden">
                        <div style={{ height: `${(item.missed / maxSeriesValue) * 100}%` }} className="w-full bg-amber-500 absolute bottom-0 transition-all duration-1000 ease-out delay-300 min-h-[4px]"></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider group-hover:text-primary transition-colors">{item.month}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Distribution Grid - Fixed Breakage */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Hospital Distribution */}
          <ChartCard
            title="Hospitais de Referência"
            subtitle="Maiores Entradas"
            icon="local_hospital"
            iconBgClass="bg-blue-50 dark:bg-blue-900/20"
            iconColorClass="text-blue-500"
            loading={loading}
          >
            <div className="space-y-5">
              {data.hospitalStats.length === 0 ? <p className="text-center text-slate-400 py-4 font-bold">Sem dados</p> :
                data.hospitalStats.map((hosp, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <span className="truncate max-w-[140px]">{hosp.name}</span>
                      <span>{hosp.count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full shadow-sm" style={{ width: `${hosp.percent}%` }}></div>
                    </div>
                  </div>
                ))
              }
            </div>
          </ChartCard>

          {/* Productivity */}
          <ChartCard
            title="Produção Médica"
            subtitle="Consultas no Período"
            icon="medical_information"
            iconBgClass="bg-indigo-50 dark:bg-indigo-900/20"
            iconColorClass="text-indigo-500"
            loading={loading}
          >
            <div className="space-y-5">
              {data.doctorStats.length === 0 ? <p className="text-center text-slate-400 py-4 font-bold">Sem dados</p> :
                data.doctorStats.map((doc, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <span className="truncate max-w-[140px]">{doc.name}</span>
                      <span>{doc.count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${doc.percent}%` }}></div>
                    </div>
                  </div>
                ))
              }
            </div>
          </ChartCard>

          {/* Regional Demand */}
          <ChartCard
            title="Regiões Atendidas"
            subtitle="Vulnerabilidade Social"
            icon="share_location"
            iconBgClass="bg-teal-50 dark:bg-teal-900/20"
            iconColorClass="text-teal-500"
            loading={loading}
          >
            <div className="space-y-5">
              {data.cityStats.length === 0 ? <p className="text-center text-slate-400 py-4 font-bold">Sem dados</p> :
                data.cityStats.map((city, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <span className="truncate max-w-[140px]">{city.name}</span>
                      <span>{city.count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${city.percent}%` }}></div>
                    </div>
                  </div>
                ))
              }
            </div>
          </ChartCard>

          {/* Snapshot Status */}
          <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col gap-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Status Atual</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Pacientes Ativos hoje</p>
              </div>
              <div className="size-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shadow-inner">
                <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 text-center transition-transform hover:scale-105">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Traqueo</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{data.patientStats.totalTqt}</p>
              </div>
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 text-center transition-transform hover:scale-105">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Homecare</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{data.patientStats.totalHomecare}</p>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em]">Perfil Etário</p>
              <div className="space-y-4">
                {data.patientStats.ageDistribution.map((d, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-[10px] font-extrabold text-slate-500 w-16 whitespace-nowrap">{d.range}</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: `${d.percent}%` }}></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-900 dark:text-white w-5 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* AI Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <span className="material-symbols-outlined text-[24px]">psychology</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Análise Clínica Inteligente</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Relatório gerado por IA</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {/* Rendering markdown-like bold syntax */}
                {reportContent.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base" dangerouslySetInnerHTML={{
                    __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-black">$1</strong>')
                  }} />
                ))}
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex justify-end gap-4">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handlePrintReport}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined">print</span>
                Imprimir / Salvar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
