import React, { useState } from 'react';

interface DischargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, isDeceased: boolean) => Promise<void>;
    patientName: string;
    loading?: boolean;
}

const DischargeModal: React.FC<DischargeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    patientName,
    loading = false
}) => {
    const [reason, setReason] = useState('');
    const [isDeceased, setIsDeceased] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        await onConfirm(reason, isDeceased);
        setReason('');
        setIsDeceased(false);
    };

    const handleClose = () => {
        setReason('');
        setIsDeceased(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${isDeceased ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'}`}>
                        <span className="material-symbols-outlined text-[28px]">{isDeceased ? 'sentiment_very_dissatisfied' : 'logout'}</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                            {isDeceased ? 'Confirmar Óbito' : 'Dar Alta do Projeto'}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Confirme a alta de <span className="font-bold text-slate-700 dark:text-slate-300">{patientName}</span>
                        </p>
                    </div>
                </div>

                {/* Warning */}
                <div className={`border rounded-2xl p-4 mb-6 ${isDeceased ? 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                    <div className="flex gap-3">
                        <span className={`material-symbols-outlined text-[20px] shrink-0 ${isDeceased ? 'text-slate-600 dark:text-slate-400' : 'text-amber-600'}`}>
                            {isDeceased ? 'info' : 'warning'}
                        </span>
                        <p className={`text-xs font-medium ${isDeceased ? 'text-slate-700 dark:text-slate-300' : 'text-amber-800 dark:text-amber-200'}`}>
                            {isDeceased
                                ? 'O registro de óbito encerra o acompanhamento. O histórico permanecerá salvo.'
                                : 'Esta ação marcará o paciente como "não ativo no projeto". Você poderá reativá-lo posteriormente.'
                            }
                        </p>
                    </div>
                </div>

                {/* Deceased Toggle */}
                <div
                    className={`mb-6 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${isDeceased ? 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600' : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800'}`}
                    onClick={() => setIsDeceased(!isDeceased)}
                >
                    <div className={`size-5 rounded border flex items-center justify-center transition-colors ${isDeceased ? 'bg-black border-black dark:bg-white dark:border-white' : 'border-slate-300 dark:border-slate-500'}`}>
                        {isDeceased && <span className="material-symbols-outlined text-[16px] text-white dark:text-black">check</span>}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Alta por Óbito</p>
                        <p className="text-[10px] text-slate-500 mt-1">Marque se o motivo for falecimento.</p>
                    </div>
                </div>

                {/* Reason Input */}
                <div className="mb-6">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">
                        Observações / Motivo
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={isDeceased ? "Causa do óbito, data do falecimento, etc..." : "Ex: Melhora clínica, transferência..."}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none"
                        rows={3}
                        disabled={loading}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isDeceased ? 'bg-slate-900 text-white shadow-slate-900/20 dark:bg-white dark:text-slate-900' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'}`}
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                Processando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">{isDeceased ? 'sentiment_dissatisfied' : 'check'}</span>
                                {isDeceased ? 'Confirmar Óbito' : 'Confirmar Alta'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DischargeModal;
