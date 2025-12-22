import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from './Layout';
import { supabase } from '../supabaseClient';

const NewAppointment: React.FC = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    doctorId: '',
    recurring: false,
    recurringType: 'Semanal' // 'Semanal' or 'Mensal'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: docs } = await supabase.from('doctors').select('*').eq('status', 'Ativo');
    if (docs) setDoctors(docs);

    const { data: pats } = await supabase.from('patients').select('id, name');
    if (pats) {
      setPatients(pats);
      if (preSelectedPatientId) {
        setFormData(prev => ({ ...prev, patientId: preSelectedPatientId }));
      }
    }
  };

  const checkConflict = async (doctorId: string, date: string, time: string) => {
    const { data } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('date', date)
      .eq('time', time)
      .not('status', 'eq', 'Cancelada');

    return data && data.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check for conflict first
      const hasConflict = await checkConflict(formData.doctorId, formData.date, formData.time);
      if (hasConflict) {
        const confirm = window.confirm('ATENÇÃO: Este médico já possui um agendamento neste horário. Deseja agendar mesmo assim?');
        if (!confirm) {
          setLoading(false);
          return;
        }
      }

      const appointmentsToCreate = [];
      const startDate = new Date(formData.date + 'T' + formData.time);

      // Create base appointment
      appointmentsToCreate.push({
        patient_id: formData.patientId,
        doctor_id: formData.doctorId,
        date: formData.date,
        time: formData.time,
        status: 'Agendada'
      });

      // Handle recurring logic
      if (formData.recurring) {
        // Create 3 more occurrences (total 4)
        for (let i = 1; i <= 3; i++) {
          const nextDate = new Date(startDate);
          if (formData.recurringType === 'Semanal') {
            nextDate.setDate(startDate.getDate() + (i * 7));
          } else {
            nextDate.setMonth(startDate.getMonth() + i);
          }

          appointmentsToCreate.push({
            patient_id: formData.patientId,
            doctor_id: formData.doctorId,
            date: nextDate.toISOString().split('T')[0],
            time: formData.time,
            status: 'Agendada'
          });
        }
      }

      const { error } = await supabase.from('appointments').insert(appointmentsToCreate);

      if (error) throw error;

      alert(formData.recurring
        ? `Agendamento recorrente criado com sucesso! (4 ocorrências)`
        : 'Agendamento realizado com sucesso!');
      navigate('/agenda');
    } catch (error: any) {
      console.error(error);
      alert('Erro ao agendar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto py-10">
        <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
              <h1 className="text-3xl font-black leading-tight text-slate-900 dark:text-white tracking-tighter">Novo Agendamento</h1>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Agendar Consulta Especializada</p>
            </div>

            <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Paciente</label>
                {preSelectedPatientId ? (
                  <div className="w-full rounded-2xl border-none bg-slate-50 dark:bg-slate-900/50 h-14 px-4 font-bold text-slate-900 dark:text-white flex items-center">
                    {patients.find(p => p.id === preSelectedPatientId)?.name || 'Carregando...'}
                  </div>
                ) : (
                  <select
                    required
                    value={formData.patientId}
                    onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full rounded-2xl border-none bg-slate-50 dark:bg-slate-900/50 h-14 px-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Selecione...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Data</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-2xl border-none bg-slate-50 dark:bg-slate-900/50 h-14 px-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Horário</label>
                  <input
                    required
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full rounded-2xl border-none bg-slate-50 dark:bg-slate-900/50 h-14 px-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Médico Especialista</label>
                <select
                  required
                  value={formData.doctorId}
                  onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full rounded-2xl border-none bg-slate-50 dark:bg-slate-900/50 h-14 px-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              {/* Recurring Option */}
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={formData.recurring}
                    onChange={e => setFormData({ ...formData, recurring: e.target.checked })}
                    className="size-5 rounded-lg border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="recurring" className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">update</span>
                    Repetir agendamento
                  </label>
                </div>

                {formData.recurring && (
                  <div className="pl-8 animate-fade-in-down">
                    <label className="text-xs font-black uppercase tracking-[0.15em] text-indigo-400 mb-2 block">Frequência</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="recurringType"
                          value="Semanal"
                          checked={formData.recurringType === 'Semanal'}
                          onChange={e => setFormData({ ...formData, recurringType: e.target.value })}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Semanal (4x)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="recurringType"
                          value="Mensal"
                          checked={formData.recurringType === 'Mensal'}
                          onChange={e => setFormData({ ...formData, recurringType: e.target.value })}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mensal (4x)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-14 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Agendar Consulta
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewAppointment;
