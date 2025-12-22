import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Auth state listener handles redirect
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex overflow-hidden lg:flex-row flex-col">
      {/* Left Side - Hero & Features */}
      <div className="lg:w-[60%] w-full bg-slate-50 dark:bg-slate-900 relative flex flex-col p-6 lg:p-16 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>

        {/* Navbar/Logo area */}
        <div className="flex items-center gap-3 relative z-10 mb-12 lg:mb-24">
          <div className="bg-white dark:bg-surface-dark p-2.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800">
            <span className="material-symbols-outlined text-primary text-2xl">pulmonology</span>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Projeto Respirar</span>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
            Gestão Avançada de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">
              Traqueostomia Pediátrica
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-12 max-w-lg">
            Plataforma completa para acompanhamento clínico, mapas cirúrgicos e evolução de pacientes com inteligência artificial integrada.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/50 dark:border-white/10 hover:shadow-xl transition-all group cursor-default">
              <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">surgical</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Mapas Cirúrgicos</h3>
              <p className="text-sm text-slate-500 font-medium">Controle total de procedimentos, equipe e materiais (OPME).</p>
            </div>

            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/50 dark:border-white/10 hover:shadow-xl transition-all group cursor-default">
              <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">IA Clínica</h3>
              <p className="text-sm text-slate-500 font-medium">Síntese de prontuários e sugestões de evolução com GPT-4o.</p>
            </div>

            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/50 dark:border-white/10 hover:shadow-xl transition-all group cursor-default md:col-span-2">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shrink-0">
                  <span className="material-symbols-outlined">emergency_home</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">Triagem Inteligente</h3>
                  <p className="text-sm text-slate-500 font-medium">Fluxo de pacientes em tempo real com painel visual.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-12 relative z-10 flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span>HOSPITAL CLÍNICO</span>
          <span className="size-1 rounded-full bg-slate-300"></span>
          <span>AMBULATÓRIO DE PNEUMOLOGIA</span>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="lg:w-[40%] w-full bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Bem-vindo(a)</h2>
            <p className="text-slate-500 font-medium">Insira suas credenciais para acessar o painel.</p>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400" htmlFor="email">E-mail Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
                </div>
                <input
                  required
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-primary rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-bold outline-none"
                  id="email"
                  placeholder="seu.email@hospital.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400" htmlFor="password">Senha</label>
                <Link to="/forgot-password" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">Esqueceu a senha?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                </div>
                <input
                  required
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-primary rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-bold outline-none"
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
              className="mt-4 w-full h-14 bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
              type="submit"
            >
              {loading ? (
                <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Acessar Sistema</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Não tem acesso? <Link to="/signup" className="text-primary font-bold hover:underline">Solicitar conta</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
