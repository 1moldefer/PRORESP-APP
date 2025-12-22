
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Link } from 'react-router-dom';
import { Patient } from '../types';
import { supabase } from '../supabaseClient';

const PatientList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedPatients: Patient[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          age: p.age || 'N/A',
          birthDate: p.birth_date,
          motherName: p.mother_name,
          susCard: p.sus_card,
          tracheostomyActive: p.tracheostomy_active,
          homecareActive: p.homecare_active,
          avatarUrl: p.avatar_url
        }));
        setPatients(mappedPatients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.motherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Diretório de Pacientes</h1>
            <p className="text-slate-500 font-medium max-w-2xl">Gerencie todos os prontuários pediátricos e acompanhamentos ativos.</p>
          </div>
          <Link to="/patients/new" className="flex items-center justify-center gap-2 h-12 px-6 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl transition-all shadow-lg shadow-primary/10">
            <span className="material-symbols-outlined">add</span>
            <span>Novo Cadastro</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400">search</span>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 border-none bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
              placeholder="Pesquisar por nome ou mãe..."
              type="text"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-5 pl-8 pr-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Paciente / Idade</th>
                  <th className="py-5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Responsável</th>
                  <th className="py-5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Status Traqueo</th>
                  <th className="py-5 pl-4 pr-8 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">Carregando pacientes...</td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">Nenhum paciente encontrado.</td>
                  </tr>
                ) : (
                  filteredPatients.map((pt) => (
                    <tr key={pt.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-5 pl-8 pr-4">
                        <Link to={`/patients/${pt.id}`} className="flex items-center gap-4">
                          {pt.avatarUrl ? (
                            <img src={pt.avatarUrl} alt={pt.name} className="size-11 rounded-2xl object-cover ring-2 ring-primary/5" />
                          ) : (
                            <div className="size-11 rounded-2xl bg-primary/10 dark:bg-primary/5 flex items-center justify-center font-black text-sm text-primary">
                              {pt.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{pt.name}</p>
                            <p className="text-[11px] font-bold text-slate-500 uppercase">{pt.age}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{pt.motherName}</p>
                        <p className="text-[11px] text-slate-400">Genitora</p>
                      </td>
                      <td className="py-5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${pt.tracheostomyActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}>
                          <span className={`size-1.5 rounded-full ${pt.tracheostomyActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {pt.tracheostomyActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="py-5 pl-4 pr-8 text-right">
                        <Link to={`/patients/${pt.id}`} className="bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all inline-block">Ver Ficha</Link>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PatientList;
