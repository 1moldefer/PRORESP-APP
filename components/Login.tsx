import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';

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
      if (error.message.includes('Email not confirmed')) {
        setError('E-mail não confirmado. Verifique seu e-mail ou contate o administrador.');
      } else if (error.message.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      // Auth state listener handles redirect
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row overflow-hidden">

      {/* Left Side - Content & Info (Scrollable on mobile) */}
      <div className="lg:w-[60%] w-full relative flex flex-col overflow-y-auto h-screen scrollbar-hide">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#42C2D3]/10 rounded-full blur-[100px]"></div>
          <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-[#9D4D6F]/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 p-8 lg:p-16 flex flex-col">
          {/* Header / Logo */}
          <div className="flex items-center gap-4 mb-16">
            <div className="bg-white p-3 rounded-2xl shadow-lg shadow-[#42C2D3]/10 border border-[#42C2D3]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#42C2D3] text-[40px]">pulmonology</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none tracking-tight">
                PROJETO <span className="text-[#42C2D3]">RESPIRAR</span>
              </h2>
              <p className="text-[10px] font-bold text-[#9D4D6F] tracking-[0.2em] mt-1 border-t border-[#9D4D6F]/20 pt-1 w-full">ALAGOAS</p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="max-w-2xl mb-20 animate-fade-in-up">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-800 dark:text-white leading-[1.15] mb-6 tracking-tight">
              Excelência na Gestão de <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42C2D3] to-[#2A98A8]">Traqueostomia Pediátrica</span>
            </h1>

            <div className="prose prose-lg text-slate-600 dark:text-slate-300 mb-8 border-l-4 border-[#42C2D3] pl-6">
              <p className="mb-4">
                O <b>Projeto Respirar Alagoas</b> é uma iniciativa pioneira dedicada à otimização e humanização do cuidado a crianças traqueostomizadas.
              </p>
              <p>
                Nossa missão é integrar dados clínicos, cirúrgicos e assistenciais para garantir uma jornada segura desde a admissão até a desospitalização, empoderando equipes multidisciplinares com tecnologia de ponta.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-20">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#9D4D6F] mb-8 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-[#9D4D6F]"></span>
              Funcionalidades Disponíveis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="group bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="size-12 bg-[#42C2D3]/10 rounded-xl flex items-center justify-center text-[#42C2D3] mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">patient_list</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Prontuário Especializado</h4>
                <p className="text-sm text-slate-500 font-medium">Registro completo da linha de cuidado, focando nas especificidades da via aérea pediátrica.</p>
              </div>

              {/* Feature 2 */}
              <div className="group bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="size-12 bg-[#9D4D6F]/10 rounded-xl flex items-center justify-center text-[#9D4D6F] mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">surgical</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Mapa Cirúrgico</h4>
                <p className="text-sm text-slate-500 font-medium">Gestão eficiente de filas, procedimentos e materiais (OPME) para otimizar o centro cirúrgico.</p>
              </div>

              {/* Feature 3 */}
              <div className="group bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="size-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Agenda Inteligente</h4>
                <p className="text-sm text-slate-500 font-medium">Organização de consultas ambulatoriais e acompanhamento pós-operatório.</p>
              </div>

              {/* Feature 4 */}
              <div className="group bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="size-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">IA Assistiva</h4>
                <p className="text-sm text-slate-500 font-medium">Suporte à decisão clínica com análise rápida de dados e sugestões de conduta baseadas em protocolos.</p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-slate-200 dark:border-slate-800">
            <Footer />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Sticky) */}
      <div className="lg:w-[40%] w-full bg-white dark:bg-slate-950 flex flex-col justify-center items-center p-6 lg:p-12 border-l border-slate-100 dark:border-slate-800 shadow-2xl relative z-20">

        <div className="w-full max-w-[380px]">
          <div className="mb-10">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Bem-vindo(a)</h3>
            <p className="text-slate-500 font-medium">Acesse o painel administrativo.</p>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400" htmlFor="email">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#42C2D3] transition-colors">mail</span>
                </div>
                <input
                  required
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-[#42C2D3] rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-bold outline-none"
                  id="email"
                  placeholder="seu.email@projeto.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400" htmlFor="password">Senha</label>
                <Link to="/forgot-password" className="text-xs font-bold text-[#42C2D3] hover:text-[#36aab9] transition-colors">Esqueceu?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#42C2D3] transition-colors">lock</span>
                </div>
                <input
                  required
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-[#42C2D3] rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-bold outline-none"
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
              className="mt-4 w-full h-14 bg-[#42C2D3] hover:bg-[#36aab9] active:scale-[0.98] text-white font-black rounded-2xl shadow-xl shadow-[#42C2D3]/20 hover:shadow-[#42C2D3]/30 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
              type="submit"
            >
              {loading ? (
                <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Acessar</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-slate-100 dark:border-slate-900 pt-6">
            <p className="text-slate-400 text-sm font-medium mb-4">Ainda não tem cadastro?</p>
            <Link to="/signup" className="inline-flex items-center gap-2 text-[#9D4D6F] font-bold bg-[#9D4D6F]/5 px-6 py-3 rounded-xl hover:bg-[#9D4D6F]/10 transition-colors">
              Criar Conta Profissional
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
