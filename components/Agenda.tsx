import React from 'react';
import Layout from './Layout';
import { useAgenda } from '../hooks/useAgenda';
import PageHeader from './ui/PageHeader';
import StatCard from './ui/StatCard';
import AppointmentCard from './ui/AppointmentCard';

const Agenda: React.FC = () => {
  const {
    appointments,
    loading,
    stats,
    filters,
    totalCount,
    currentPage,
    pageSize,
    isSelectionMode,
    selectedIds,
    setIsSelectionMode,
    setSelectedIds,
    setCurrentPage,
    updateFilter,
    handleCancel,
    handleDelete,
    toggleSelection
  } = useAgenda();

  const totalPages = Math.ceil(totalCount / pageSize);

  const getTodayLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isTodayFilter = filters.startDate === getTodayLocal() && filters.endDate === getTodayLocal();

  const statItems = [
    { title: "Total", value: stats.total, icon: "event_note", color: "text-slate-500 bg-slate-50" },
    { title: "Pendentes", value: stats.pending, icon: "schedule", color: "text-amber-500 bg-amber-50" },
    { title: "Realizados", value: stats.realized, icon: "check_circle", color: "text-primary bg-primary/10" },
    { title: "Cancelados", value: stats.cancelled, icon: "cancel", color: "text-rose-500 bg-rose-50" },
  ];

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`ATENÇÃO: Deseja excluir permanentemente os ${selectedIds.length} agendamentos selecionados? Esta ação é irreversível.`)) {
      handleDelete(selectedIds);
    }
  };

  const handleSingleDelete = (id: string) => {
    if (window.confirm("Deseja excluir este agendamento permanentemente?")) {
      handleDelete([id]);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8 animate-in fade-in duration-500 mb-12">
        <PageHeader
          title="Agenda Médica"
          description="Gerencie as consultas e o fluxo de atendimento."
          actionLabel="Novo Agendamento"
          actionLink="/agenda/new"
        />

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((stat, i) => (
            <StatCard
              key={i}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              colorClass={stat.color}
              loading={loading}
            />
          ))}
        </section>

        {/* Filters */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Período Inicial</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                />
                <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-xl">calendar_today</span>
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Período Final</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                />
                <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-xl">calendar_month</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Filtrar por Paciente ou Médico</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Digite para buscar..."
                  value={filters.searchText}
                  onChange={(e) => updateFilter('searchText', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                />
                <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-xl">search</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-3 text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
              <span className="material-symbols-outlined text-primary">view_list</span>
              {isTodayFilter ? 'Agendamentos de Hoje' : 'Lista de Agendamentos'}
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full text-xs font-black">{totalCount} registros</span>
            </h2>
            {isTodayFilter && (
              <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 animate-in slide-in-from-right duration-500">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span className="text-[10px] font-black uppercase tracking-wider">Mostrando atendimentos do dia</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isSelectionMode ? (
              <button
                onClick={() => setIsSelectionMode(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-wider hover:bg-slate-200 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">check_box</span>
                Selecionar
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-in zoom-in duration-200">
                <span className="text-[10px] font-black text-indigo-500 uppercase mr-2">{selectedIds.length} selecionados</span>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 dark:shadow-none disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Excluir Selecionados
                </button>
                <button
                  onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-all font-black"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        <section className="flex flex-col gap-4 min-h-[400px]">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-800 animate-pulse"></div>
            ))
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-6 border-4 border-dashed border-slate-100 dark:border-slate-800/50 rounded-[40px] bg-slate-50/50 dark:bg-transparent">
              <div className="size-24 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[48px] opacity-20">event_busy</span>
              </div>
              <div className="text-center">
                <p className="font-black text-xl text-slate-900 dark:text-white mb-1">{filters.searchText ? 'Nenhum resultado para a busca' : 'Nenhum agendamento encontrado'}</p>
                <p className="text-sm font-medium">Tente alterar os filtros de data ou o termo de busca.</p>
              </div>
              {(isTodayFilter || filters.searchText) && (
                <button
                  onClick={() => {
                    updateFilter('startDate', '');
                    updateFilter('endDate', '');
                    updateFilter('searchText', '');
                  }}
                  className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                  Limpar Todos os Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {appointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.includes(apt.id)}
                  onToggleSelection={toggleSelection}
                  onCancel={handleCancel}
                  onDelete={handleSingleDelete}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pb-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all font-black shadow-sm"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (totalPages > 5 && Math.abs(page - currentPage) > 2) return null;

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`size-10 flex items-center justify-center rounded-xl font-black text-sm transition-all shadow-sm ${currentPage === page
                      ? 'bg-primary text-white scale-110'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all font-black shadow-sm"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Agenda;
