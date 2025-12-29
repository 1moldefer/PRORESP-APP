import React, { useState } from 'react';
import Layout from './Layout';
import { Link } from 'react-router-dom';
import { usePatientList } from '../hooks/usePatientList';
import PageHeader from './ui/PageHeader';
import SearchInput from './ui/SearchInput';
import DeleteConfirmationModal from './ui/DeleteConfirmationModal';
import { calculateAge } from '../utils/dateUtils';

// Custom simplified badge for boolean statuses
const BooleanBadge: React.FC<{ active: boolean; labelTrue: string; labelFalse: string }> = ({ active, labelTrue, labelFalse }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight ${active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
    }`}>
    <span className={`size-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
    {active ? labelTrue : labelFalse}
  </span>
);

const PatientList: React.FC = () => {
  const {
    patients, loading, searchTerm, setSearchTerm, startDate, setStartDate, endDate, setEndDate,
    projectStatus, setProjectStatus,
    selectedIds, isSelectionMode, toggleSelectionMode, toggleSelectAll, toggleSelectPatient, deletePatients
  } = usePatientList();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <PageHeader
            title="Diretório de Pacientes"
            description="Gerencie todos os prontuários pediátricos e acompanhamentos ativos."
            // We override the default action for custom buttons if needed, or keep it.
            // Let's keep the new button but also add the selection toggle.
            actionLabel="Novo Cadastro"
            actionLink="/patients/new"
          />
        </div>

        {/* Action Bar & Filters */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex flex-col xl:flex-row gap-4 items-center">
              {/* Selection Toggle Button */}
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border shrink-0 ${isSelectionMode
                  ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-transparent dark:border-slate-700 dark:text-slate-400'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isSelectionMode ? 'close' : 'checklist'}
                </span>
                {isSelectionMode ? 'Cancelar Seleção' : 'Selecionar Pacientes'}
              </button>

              {isSelectionMode && selectedIds.length > 0 && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all shrink-0 animate-in fade-in zoom-in duration-200"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                  Excluir ({selectedIds.length})
                </button>
              )}

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden xl:block"></div>

              <div className="flex-1 w-full">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Pesquisar por nome, mãe ou cartão SUS..."
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                <div className="relative group flex-1 sm:min-w-[150px]">
                  <label className="absolute -top-2 left-3 bg-white dark:bg-surface-dark px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10">De</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full h-[56px] pl-4 pr-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium pt-2"
                  />
                </div>
                <div className="relative group flex-1 sm:min-w-[150px]">
                  <label className="absolute -top-2 left-3 bg-white dark:bg-surface-dark px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10">Até</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full h-[56px] pl-4 pr-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium pt-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Status Filter */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">filter_list</span>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Status no Projeto:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setProjectStatus('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${projectStatus === 'all'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setProjectStatus('active')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${projectStatus === 'active'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Ativos
                </button>
                <button
                  onClick={() => setProjectStatus('discharged')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${projectStatus === 'discharged'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Com Alta
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                  {isSelectionMode && (
                    <th className="py-5 pl-8 pr-2 w-[50px]">
                      <input
                        type="checkbox"
                        checked={patients.length > 0 && selectedIds.length === patients.length}
                        onChange={toggleSelectAll}
                        className="size-5 rounded border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                      />
                    </th>
                  )}
                  <th className={`py-5 ${isSelectionMode ? 'pl-2' : 'pl-8'} pr-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest w-[30%]`}>Paciente / Idade</th>
                  <th className="py-5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Cartão SUS</th>
                  <th className="py-5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Responsável</th>
                  <th className="py-5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Cadastro</th>
                  <th className="py-5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Status Traqueo</th>
                  <th className="py-5 pl-4 pr-8 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  [1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      {isSelectionMode && <td className="pl-8"><div className="size-5 bg-slate-100 rounded animate-pulse"></div></td>}
                      <td className={`p-${isSelectionMode ? '4 pl-2' : '8'}`}><div className="flex items-center gap-4"><div className="size-11 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div><div className="space-y-2"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div><div className="h-3 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div></div></div></td>
                      <td className="p-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div></td>
                      <td className="p-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div></td>
                      <td className="p-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div></td>
                      <td className="p-4"><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div></td>
                      <td className="p-4 ml-auto"><div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse ml-auto"></div></td>
                    </tr>
                  ))
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={isSelectionMode ? 7 : 6} className="p-16 text-center text-slate-500 font-bold flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-slate-300">person_off</span>
                      {searchTerm || startDate || endDate ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado ainda.'}
                    </td>
                  </tr>
                ) : (
                  patients.map((pt) => (
                    <tr key={pt.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${selectedIds.includes(pt.id) ? 'bg-primary/5 dark:bg-primary/5' : ''}`}>
                      {isSelectionMode && (
                        <td className="py-5 pl-8 pr-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(pt.id)}
                            onChange={() => toggleSelectPatient(pt.id)}
                            className="size-5 rounded border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                          />
                        </td>
                      )}
                      <td className={`py-5 ${isSelectionMode ? 'pl-2' : 'pl-8'} pr-4`}>
                        <Link to={`/patients/${pt.id}`} className="flex items-center gap-4">
                          {pt.avatarUrl ? (
                            <img src={pt.avatarUrl} alt={pt.name} className="size-11 rounded-2xl object-cover ring-2 ring-primary/5" />
                          ) : (
                            <div className="size-11 rounded-2xl bg-primary/10 dark:bg-primary/5 flex items-center justify-center font-black text-sm text-primary">
                              {pt.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors flex items-center flex-wrap gap-2">
                              {pt.name}
                              {pt.deceased && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-[10px] uppercase font-bold tracking-widest shrink-0">
                                  <span className="material-symbols-outlined text-[12px]">sentiment_very_dissatisfied</span>
                                  Óbito
                                </span>
                              )}
                              {pt.hasPendingAppointment && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/10 text-[9px] font-black uppercase tracking-wider border border-amber-100 dark:border-amber-800/50 shadow-sm animate-in fade-in zoom-in duration-300">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                  </span>
                                  Consulta Pendente
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] font-bold text-slate-500 uppercase">{calculateAge(pt.birthDate)}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-sm bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg w-fit">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">credit_card</span>
                          {pt.susCard || 'N/A'}
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{pt.motherName}</p>
                        <p className="text-[11px] text-slate-400">Genitora</p>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {pt.createdAt ? new Date(pt.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </td>
                      <td className="py-5 px-4">
                        <BooleanBadge active={pt.tracheostomyActive} labelTrue="Ativa" labelFalse="Inativa" />
                      </td>
                      <td className="py-5 pl-4 pr-8 text-right">
                        <Link to={`/patients/${pt.id}`} className="bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all inline-block shadow-sm">Ver Ficha</Link>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={deletePatients}
        count={selectedIds.length}
      />
    </Layout>
  );
};

export default PatientList;
