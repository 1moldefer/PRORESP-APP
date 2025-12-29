import React from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const PendingApproval: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-3xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                <div className="size-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 animate-pulse">
                    <span className="material-symbols-outlined text-[40px]">lock_clock</span>
                </div>

                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Conta em Análise</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Por medidas de segurança, seu acesso precisa ser aprovado manualmente por um administrador.
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 text-center">
                    <span className="material-symbols-outlined text-amber-500 text-3xl mb-2">hourglass_top</span>
                    <p className="font-bold text-slate-700 dark:text-white mb-1">Solicitação Recebida</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Você receberá um e-mail de notificação assim que seu acesso for liberado.
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-primary dark:hover:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sair e aguardar
                </button>
            </div>
        </div>
    );
};

export default PendingApproval;
