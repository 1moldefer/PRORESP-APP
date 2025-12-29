import React, { useState } from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (justification: string) => void;
    count: number;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, count }) => {
    const [justification, setJustification] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!justification.trim()) {
            setError('A justificativa é obrigatória.');
            return;
        }
        onConfirm(justification);
        setJustification('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-center text-center gap-4 mb-6">
                    <div className="size-14 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 mb-2">
                        <span className="material-symbols-outlined text-[32px]">warning</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Excluir {count} Paciente{count > 1 ? 's' : ''}?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Esta ação não pode ser desfeita. Por favor, informe o motivo da exclusão para prosseguir.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block text-left">Justificativa</label>
                        <textarea
                            value={justification}
                            onChange={(e) => {
                                setJustification(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Ex: Paciente transferido, cadastro duplicado..."
                            className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-medium focus:border-rose-500 focus:ring-0 focus:outline-none transition-all resize-none text-sm"
                        />
                        {error && <p className="text-xs text-rose-500 font-bold mt-1 text-left">{error}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]"
                        >
                            Confirmar Exclusão
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
