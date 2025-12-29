import React from 'react';
import { Link } from 'react-router-dom';
import { AppointmentWithDetails } from '../../types';

interface AppointmentCardProps {
    appointment: AppointmentWithDetails;
    onCancel: (id: string, reason: string) => void;
    onDelete: (id: string) => void;
    // Selection props
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (id: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
    appointment,
    onCancel,
    onDelete,
    isSelectionMode,
    isSelected,
    onToggleSelection
}) => {
    const { id, patientId, patients, doctors, date, time, status, cancellation_reason } = appointment;
    const [showCancelModal, setShowCancelModal] = React.useState(false);
    const [cancelReason, setCancelReason] = React.useState('');

    const statusStyles = {
        'Realizada': { border: 'border-l-primary', badge: 'bg-emerald-50 text-emerald-700', text: 'text-primary' },
        'Agendada': { border: 'border-l-amber-400', badge: 'bg-amber-50 text-amber-700', text: 'text-slate-900 dark:text-white' },
        'Pendente': { border: 'border-l-amber-400', badge: 'bg-amber-50 text-amber-700', text: 'text-slate-900 dark:text-white' },
        'Cancelada': { border: 'border-l-rose-400', badge: 'bg-rose-50 text-rose-700', text: 'text-slate-900 dark:text-white' },
    }[status as string] || { border: 'border-l-slate-200', badge: 'bg-slate-50 text-slate-700', text: 'text-slate-900' };

    const getTodayLocal = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isToday = getTodayLocal() === date;

    // Extração manual para evitar fuso horário (ex: 2025-12-29 -> 29 DEZ)
    const [y, m, d] = date.split('-').map(Number);
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const dateDisplay = `${String(d).padStart(2, '0')} ${months[m - 1]}`;

    const handleConfirmCancel = () => {
        if (cancelReason.trim()) {
            onCancel(id, cancelReason);
            setShowCancelModal(false);
            setCancelReason('');
        }
    };

    return (
        <div
            onClick={() => isSelectionMode && onToggleSelection?.(id)}
            className={`group relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-3xl bg-white dark:bg-surface-dark p-6 border-l-[6px] shadow-sm border-slate-200 dark:border-slate-800 transition-all hover:shadow-md ${statusStyles.border} ${isToday ? 'ring-2 ring-primary/20' : ''} ${isSelected ? 'bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/20 shadow-lg' : ''} ${isSelectionMode ? 'cursor-pointer' : ''}`}
        >
            <div className="flex items-start gap-6 flex-1">
                {isSelectionMode && (
                    <div className="flex items-center justify-center shrink-0 pr-2">
                        <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                            {isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 min-w-[80px]">
                    <span className={`text-2xl font-black leading-none ${statusStyles.text}`}>{time?.slice(0, 5)}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-tighter">
                        {dateDisplay}
                    </span>
                    {isToday && (
                        <span className="mt-1 px-1.5 py-0.5 rounded bg-primary text-[8px] font-black text-white uppercase tracking-tighter animate-pulse">Hoje</span>
                    )}
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <Link to={`/patients/${patientId}`} className="hover:text-primary transition-colors truncate" onClick={(e) => isSelectionMode && e.preventDefault()}>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{patients?.name || 'Paciente desconhecido'}</h3>
                        </Link>
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] uppercase font-black tracking-widest ${statusStyles.badge}`}>
                            {status}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">medical_services</span>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase leading-none">{doctors?.name ? `Dr(a). ${doctors.name}` : 'Médico não informado'}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{doctors?.specialty || 'Especialidade'}</span>
                            </div>
                        </div>
                    </div>

                    {cancellation_reason && (
                        <div className="mt-2 p-2 rounded-lg bg-rose-50/50 border border-rose-100 dark:border-rose-900/20">
                            <p className="text-[10px] text-rose-600 font-bold"><span className="uppercase text-[9px] opacity-70">Motivo:</span> {cancellation_reason}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex md:flex-col lg:flex-row gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Link
                    to={`/patients/${patientId}`}
                    title="Acessar Prontuário"
                    className="flex-1 md:w-11 h-11 flex items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all"
                >
                    <span className="material-symbols-outlined">assignment_ind</span>
                </Link>

                {status !== 'Cancelada' && status !== 'Realizada' && (
                    <button
                        onClick={() => setShowCancelModal(true)}
                        title="Cancelar Consulta"
                        className="flex-1 md:w-11 h-11 flex items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
                    >
                        <span className="material-symbols-outlined">event_busy</span>
                    </button>
                )}

                <button
                    onClick={() => onDelete(id)}
                    title="Excluir Permanentemente"
                    className="flex-1 md:w-11 h-11 flex items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                >
                    <span className="material-symbols-outlined">delete</span>
                </button>
            </div>

            {/* Cancel Modal Interno */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                                <span className="material-symbols-outlined">event_busy</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Cancelar Consulta</h3>
                        </div>

                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                            Você está cancelando a consulta de <span className="font-black text-slate-900 dark:text-white">{patients?.name}</span>.
                        </p>

                        <div className="mb-6">
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Motivo do Cancelamento</label>
                            <textarea
                                autoFocus
                                rows={3}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 resize-none"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Informe o motivo do cancelamento..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                                className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all font-black"
                            >
                                Sair
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                disabled={!cancelReason.trim()}
                                className="flex-1 h-12 rounded-xl bg-amber-500 text-white font-black text-xs uppercase tracking-wider hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Cancelamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentCard;
