
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const SignUp: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Automatic login usually happens after signup unless email confirmation is required
            // We can redirect or show a message
            setLoading(false);
            alert('Cadastro realizado com sucesso! Verifique seu email se necessário ou faça login.');
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark relative overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/15 blur-[100px] animate-pulse"></div>

            <div className="relative z-10 w-full max-w-[440px]">
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-xl mb-4 ring-1 ring-black/5 dark:ring-white/10">
                        <div className="text-primary">
                            <span className="material-symbols-outlined text-[48px]">pulmonology</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Projeto Respirar</h1>
                    <p className="text-slate-500 dark:text-gray-400 text-sm mt-2 font-semibold">Crie sua conta</p>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl w-full overflow-hidden border border-slate-100 dark:border-slate-800">
                    <div className="p-8 md:p-10">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">Registrar-se</h2>
                        {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}
                        <form className="flex flex-col gap-6" onSubmit={handleSignUp}>
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
                                        placeholder="voce@exemplo.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500" htmlFor="password">Senha</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">lock</span>
                                    </div>
                                    <input
                                        required
                                        className="form-input block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-transparent dark:border-transparent rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-primary focus:ring-0 transition-all duration-200 font-bold"
                                        id="password"
                                        placeholder="••••••••"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                disabled={loading}
                                className={`mt-4 w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white text-base font-black py-4 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                                type="submit"
                            >
                                {loading ? 'Criando conta...' : (
                                    <>
                                        <span>Criar Conta</span>
                                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                                    </>
                                )}
                            </button>
                        </form>
                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-500">
                                Já tem uma conta? <Link to="/" className="text-primary font-bold hover:underline">Faça login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
