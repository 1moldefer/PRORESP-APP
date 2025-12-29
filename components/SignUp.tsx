
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const SignUp: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Sign up with approved: true for immediate access
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    approved: true // Auto-approve
                }
            }
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Check if we have a session (Auto-Confirm enabled)
            if (data.session) {
                navigate('/dashboard');
                setLoading(false);
            } else {
                console.log("Session missing after signup, attempting fallback login...");
                // Fallback: Attempt immediate login. 
                // If "Confirm Email" is OFF, this should work even if signUp didn't return session.
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                setLoading(false);

                if (loginData.session) {
                    navigate('/dashboard');
                } else {
                    // If this fails, it is 100% certain that "Confirm Email" is ON in Supabase settings
                    // or something else is blocking access.
                    if (loginError?.message.includes('Email not confirmed')) {
                        alert("Bloqueio do Servidor: A opção 'Confirm Email' ainda está ATIVA no seu painel Supabase (Authentication > Providers > Email). Desative-a para permitir acesso direto.");
                    } else {
                        alert("Conta criada, mas o login automático falhou. Verifique seu e-mail.");
                    }
                    navigate('/');
                }
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#42C2D3]/10 blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#9D4D6F]/10 blur-[100px] animate-pulse"></div>

            <div className="relative z-10 w-full max-w-[440px]">
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white p-3 rounded-2xl shadow-lg border border-[#42C2D3]/20">
                            <span className="material-symbols-outlined text-[#42C2D3] text-[40px]">pulmonology</span>
                        </div>
                        <div className="text-left">
                            <h1 className="text-xl font-black text-slate-800 dark:text-white leading-none">PROJETO <span className="text-[#42C2D3]">RESPIRAR</span></h1>
                            <p className="text-[10px] font-bold text-[#9D4D6F] tracking-widest mt-0.5">TRAQUEOSTOMIA INFANTIL</p>
                        </div>
                    </div>

                    <p className="text-slate-500 dark:text-gray-400 text-sm font-bold tracking-wide">Crie sua conta profissional</p>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl w-full overflow-hidden border border-slate-100 dark:border-slate-800">
                    <div className="p-8 md:p-10">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 text-center">Registrar-se</h2>
                        {error && <div className="p-3 mb-4 text-sm font-bold text-red-500 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">error</span>{error}</div>}
                        <form className="flex flex-col gap-5" onSubmit={handleSignUp}>
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400" htmlFor="fullName">Nome Completo</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#42C2D3] transition-colors text-[20px]">badge</span>
                                    </div>
                                    <input
                                        required
                                        className="form-input block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-transparent dark:border-transparent rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#42C2D3] focus:ring-0 transition-all duration-200 font-bold"
                                        id="fullName"
                                        placeholder="Seu nome completo"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400" htmlFor="email">E-mail</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#42C2D3] transition-colors text-[20px]">mail</span>
                                    </div>
                                    <input
                                        required
                                        className="form-input block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-transparent dark:border-transparent rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#42C2D3] focus:ring-0 transition-all duration-200 font-bold"
                                        id="email"
                                        placeholder="voce@exemplo.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Senha */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400" htmlFor="password">Senha</label>
                                    {password && (
                                        <span className={`text-[10px] font-bold ${password.length >= 6 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {password.length >= 6 ? 'Mínimo de caracteres atendido' : 'Mínimo de 6 caracteres'}
                                        </span>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#42C2D3] transition-colors text-[20px]">lock</span>
                                    </div>
                                    <input
                                        required
                                        className={`form-input block w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 ${password && password.length < 6 ? 'border-rose-100 dark:border-rose-900/30' : 'border-transparent dark:border-transparent'} rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#42C2D3] focus:ring-0 transition-all duration-200 font-bold`}
                                        id="password"
                                        placeholder="••••••••"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Confirmar Senha */}
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400" htmlFor="confirmPassword">Confirmar Senha</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#42C2D3] transition-colors text-[20px]">lock_reset</span>
                                    </div>
                                    <input
                                        required
                                        className={`form-input block w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 ${confirmPassword && password !== confirmPassword ? 'border-rose-100 dark:border-rose-900/30' : 'border-transparent dark:border-transparent'} rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#42C2D3] focus:ring-0 transition-all duration-200 font-bold`}
                                        id="confirmPassword"
                                        placeholder="Repita a senha"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                                {confirmPassword && (
                                    <p className={`text-xs font-bold mt-1 ${password === confirmPassword ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {password === confirmPassword ? 'As senhas coincidem' : 'As senhas não coincidem'}
                                    </p>
                                )}
                            </div>

                            <button
                                disabled={loading || password !== confirmPassword || password.length < 6}
                                className={`mt-4 w-full bg-[#42C2D3] hover:bg-[#36aab9] active:scale-[0.98] text-white text-base font-black py-4 px-6 rounded-2xl shadow-lg shadow-[#42C2D3]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${loading ? 'cursor-wait' : ''}`}
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
                                Já tem uma conta? <Link to="/" className="text-[#42C2D3] font-bold hover:underline">Faça login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
