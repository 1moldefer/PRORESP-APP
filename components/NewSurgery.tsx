import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const NewSurgery: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientIdFromUrl = searchParams.get('patientId');

    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        patientId: patientIdFromUrl || '',
        doctorId: '',
        surgeryType: '',
        date: '',
        time: ''
    });

    useEffect(() => {
        fetchPatients();
        fetchDoctors();
    }, []);

    const fetchPatients = async () => {
        const { data } = await supabase
            .from('patients')
            .select('id, name')
            .order('name');
        if (data) setPatients(data);
    };

    const fetchDoctors = async () => {
        const { data } = await supabase
            .from('doctors')
            .select('id, name, specialty')
            .order('name');
        if (data) setDoctors(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { error } = await supabase
            .from('surgeries')
            .insert([{
                patient_id: formData.patientId,
                doctor_id: formData.doctorId,
                surgery_type: formData.surgeryType,
                date: formData.date,
                time: formData.time,
                status: 'Agendada'
            }]);

        if (error) {
            alert('Erro ao agendar cirurgia: ' + error.message);
        } else {
            alert('Cirurgia agendada com sucesso!');
            navigate('/surgeries');
        }
    };

    return (
        <Layout>
            <div className="max-w-3xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="size-12 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-all">
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Nova Cirurgia Eletiva</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Agendar procedimento cirúrgico</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Paciente *</label>
                        <select
                            required
                            value={formData.patientId}
                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-0 focus:outline-none transition-all"
                        >
                            <option value="">Selecione o paciente</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Médico Responsável *</label>
                        <select
                            required
                            value={formData.doctorId}
                            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-0 focus:outline-none transition-all"
                        >
                            <option value="">Selecione o médico</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Tipo de Cirurgia *</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Traqueostomia, Broncoscopia, etc."
                            value={formData.surgeryType}
                            onChange={(e) => setFormData({ ...formData, surgeryType: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 focus:border-primary focus:ring-0 focus:outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Data *</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-0 focus:outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Horário *</label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-0 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 h-14 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                        >
                            Agendar Cirurgia
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default NewSurgery;
