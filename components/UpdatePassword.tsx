
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const UpdatePassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setLoading(false);
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark relative overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse"></div>
            <div className="relative z-10 w-full max-w-[440px]">
                <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl w-full overflow-hidden border border-slate-100 dark:border-slate-800">
                    <div className="p-8 md:p-10">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">Nova Senha</h2>
                        {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}

                        <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500" htmlFor="password">Nova Senha</label>
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
                                {loading ? 'Atualizar Senha' : 'Salvar Nova Senha'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdatePassword;
