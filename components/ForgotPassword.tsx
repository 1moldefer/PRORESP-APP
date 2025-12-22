
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        // In a real app, you would set the redirectTo to your update password page
        // e.g., window.location.origin + '/update-password'
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/#/update-password', // Using hash routing
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Verifique seu e-mail para o link de recuperação de senha.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark relative overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/15 blur-[100px] animate-pulse"></div>

            <div className="relative z-10 w-full max-w-[440px]">
                <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl w-full overflow-hidden border border-slate-100 dark:border-slate-800">
                    <div className="p-8 md:p-10">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Recuperar Senha</h2>
                        <p className="text-slate-500 text-sm mb-8">Digite seu e-mail para receber as instruções.</p>

                        {message && <div className="p-3 mb-4 text-sm text-emerald-600 bg-emerald-50 rounded-lg font-bold">{message}</div>}
                        {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}

                        <form className="flex flex-col gap-6" onSubmit={handleReset}>
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500" htmlFor="email">E-mail</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">mail</span>
                                    </div>
                                    <input
                                        required
                                        className="form-input block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-transparent dark:border-transparent rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-primary focus:ring-0 transition-all duration-200 font-bold"
                                        id="email"
                                        placeholder="seu@email.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                disabled={loading}
                                className={`mt-4 w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white text-base font-black py-4 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                                type="submit"
                            >
                                {loading ? 'Enviando...' : 'Enviar Link'}
                            </button>
                        </form>
                        <div className="mt-6 text-center">
                            <Link to="/" className="text-slate-500 hover:text-primary font-bold text-sm flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                                Voltar para Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
