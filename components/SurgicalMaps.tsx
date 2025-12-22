import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { supabase } from '../supabaseClient';
import { seedSurgicalMaps } from '../utils/seedSurgicalMaps';

const SurgicalMaps: React.FC = () => {
    const navigate = useNavigate();
    const [surgeries, setSurgeries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSurgeries();
    }, []);

    const fetchSurgeries = async () => {
        try {
            const { data, error } = await supabase
                .from('surgical_maps')
                .select('*')
                .order('surgery_date', { ascending: false });

            if (error) throw error;
            setSurgeries(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar cirurgias:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSurgeries = surgeries.filter(s =>
        s.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.procedure?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Mapas Cirúrgicos</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase">Gestão de Procedimentos Cirúrgicos</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                setLoading(true);
                                const success = await seedSurgicalMaps();
                                if (success) {
                                    alert('Dados inseridos com sucesso!');
                                    fetchSurgeries();
                                } else {
                                    alert('Erro ao inserir dados ou dados já existem.');
                                }
                                setLoading(false);
                            }}
                            className="px-4 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-xs"
                        >
                            <span className="material-symbols-outlined align-middle mr-1 text-[16px]">database</span>
                            Inserir Dados Exemplo
                        </button>
                        <button
                            onClick={() => navigate('/surgical-maps/new')}
                            className="px-6 py-3 rounded-2xl bg-primary text-white font-black shadow-lg hover:shadow-xl hover:bg-primary-dark transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Novo Mapa Cirúrgico
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                    <input
                        type="text"
                        placeholder="Buscar por paciente ou procedimento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                    />
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Carregando...</div>
                    ) : filteredSurgeries.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">Nenhuma cirurgia encontrada</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Data/Hora</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Paciente</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Idade/Peso</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Procedimento</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Médicos</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {filteredSurgeries.map((surgery) => (
                                        <tr key={surgery.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                                                {new Date(surgery.surgery_date).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{surgery.patient_name}</div>
                                                <div className="text-xs text-slate-500">{surgery.mother_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {surgery.age} / {surgery.weight}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {surgery.procedure}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                                                {surgery.doctors?.join(', ')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/surgical-maps/${surgery.id}`)}
                                                        className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 hover:bg-indigo-100 transition-all flex items-center justify-center"
                                                        title="Ver detalhes"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SurgicalMaps;
