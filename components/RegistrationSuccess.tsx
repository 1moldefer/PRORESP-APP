import React from 'react';
import { Link } from 'react-router-dom';

const RegistrationSuccess: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-3xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                <div className="size-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 animate-bounce">
                    <span className="material-symbols-outlined text-[40px]">check_circle</span>
                </div>

                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Cadastro Realizado!</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Sua solicitação de cadastro foi enviada com sucesso para nossa equipe administrativa.
                </p>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-xl mb-8 text-left">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-1">info</span>
                        <div>
                            <h3 className="font-bold text-amber-800 dark:text-amber-200 text-sm uppercase tracking-wide mb-1">Próximos Passos</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Sua conta passará por uma análise de segurança. Assim que for aprovada, você será notificado por e-mail e poderá acessar o sistema.
                            </p>
                        </div>
                    </div>
                </div>

                <Link
                    to="/"
                    className="block w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all"
                >
                    Voltar para o Login
                </Link>
            </div>
        </div>
    );
};

export default RegistrationSuccess;
