
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { supabase } from '../supabaseClient';

interface ManagementTablesProps {
  type: 'doctors' | 'cities' | 'locations';
}

const ManagementTables: React.FC<ManagementTablesProps> = ({ type }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Generic form state
  const [name, setName] = useState('');
  const [secondField, setSecondField] = useState(''); // specialty, uf, or address
  const [status, setStatus] = useState('Ativo');
  const [submitting, setSubmitting] = useState(false);

  const titles = {
    doctors: "Gestão de Médicos",
    cities: "Cidades Atendidas",
    locations: "Locais de Atendimento"
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from(type)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    if (item) {
      setName(item.name);
      setSecondField(item.specialty || item.uf || item.address || '');
      setStatus(item.status);
    } else {
      setName('');
      setSecondField('');
      setStatus('Ativo');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: any = {
        name,
        status
      };

      if (type === 'doctors') payload.specialty = secondField;
      if (type === 'cities') payload.uf = secondField;
      if (type === 'locations') payload.address = secondField;

      let error;
      if (editingItem) {
        const { error: updateError } = await supabase
          .from(type)
          .update(payload)
          .eq('id', editingItem.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from(type)
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      handleCloseModal();
      fetchData();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      const { error } = await supabase.from(type).delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const getSecondLabel = () => {
    if (type === 'doctors') return 'Especialidade';
    if (type === 'cities') return 'UF';
    if (type === 'locations') return 'Endereço';
    return '';
  };

  const getSecondValue = (item: any) => {
    if (type === 'doctors') return item.specialty;
    if (type === 'cities') return item.uf;
    if (type === 'locations') return item.address;
    return '';
  };

  return (
    <Layout>
      <div className="flex flex-col gap-10 max-w-5xl mx-auto">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{titles[type]}</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Configurações de Sistema</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 rounded-2xl h-14 px-8 bg-primary text-white text-base font-black shadow-xl shadow-primary/10 hover:bg-primary-dark transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Adicionar</span>
          </button>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
              <tr>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Nome / {getSecondLabel()}
                </th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">Carregando...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">Nenhum registro encontrado.</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-6">
                      <p className="font-black text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{getSecondValue(item)}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-400'}`}>{item.status}</span>
                    </td>
                    <td className="p-6 text-right flex items-center justify-end gap-3">
                      <button onClick={() => handleOpenModal(item)} className="font-black text-xs text-primary hover:underline">Editar</button>
                      <button onClick={() => handleDelete(item.id)} className="font-black text-xs text-rose-500 hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingItem ? 'Editar' : 'Adicionar'} Item</h3>
              <button onClick={handleCloseModal} className="size-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Nome</label>
                <input
                  required
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-none font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Digite o nome..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">{getSecondLabel()}</label>
                <input
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-none font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  value={secondField}
                  onChange={e => setSecondField(e.target.value)}
                  placeholder={`Digite ${getSecondLabel().toLowerCase()}...`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Status</label>
                <select
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-none font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-70"
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default ManagementTables;
