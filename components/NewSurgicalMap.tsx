import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { supabase } from '../supabaseClient';

const NewSurgicalMap: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        surgery_date: '',
        surgery_time: '',
        patient_id: '',
        cpf_search: '', // New field for CPF search
        patient_name: '',
        mother_name: '',
        birth_date: '',
        age: '',
        weight: '',
        doctors: '',
        procedure: '',
        opme: '',
        post_op_sector: '',
        cns: '',
        equipment: ''
    });

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        const { data } = await supabase.from('patients').select('id, name, mother_name, birth_date, cpf, age, cns, sus_card');
        if (data) setPatients(data);
    };

    const handleCpfSearch = async (cpf: string) => {
        setFormData(prev => ({ ...prev, cpf_search: cpf }));
        if (cpf.length >= 11) { // Basic length check
            const found = patients.find(p => p.cpf === cpf || p.cpf?.replace(/\D/g, '') === cpf.replace(/\D/g, ''));
            if (found) {
                handlePatientChange(found.id);
            }
        }
    };

    const handlePatientChange = (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            setFormData({
                ...formData,
                patient_id: patientId,
                patient_name: patient.name,
                mother_name: patient.mother_name || '',
                birth_date: patient.birth_date || '',
                age: patient.age || '',
                cns: patient.sus_card || '', // Auto-fill CNS/SUS
                cpf_search: patient.cpf || formData.cpf_search
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const surgeryDateTime = `${formData.surgery_date}T${formData.surgery_time}`;

            const { error } = await supabase.from('surgical_maps').insert([{
                surgery_date: surgeryDateTime,
                patient_id: formData.patient_id || null,
                patient_name: formData.patient_name,
                mother_name: formData.mother_name,
                birth_date: formData.birth_date || null,
                age: formData.age,
                weight: formData.weight,
                doctors: formData.doctors.split(',').map(d => d.trim()).filter(d => d),
                procedure: formData.procedure,
                opme: formData.opme,
                post_op_sector: formData.post_op_sector,
                cns: formData.cns,
                equipment: formData.equipment.split(',').map(e => e.trim()).filter(e => e)
            }]);

            if (error) throw error;

            alert('Mapa cirúrgico criado com sucesso!');
            navigate('/surgical-maps');
        } catch (error: any) {
            alert('Erro ao criar mapa: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Layout>
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="size-12 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition-all">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Novo Mapa Cirúrgico</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase">Cadastro de Procedimento Cirúrgico</p>
                        </div>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-black shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2 print:hidden"
                    >
                        <span className="material-symbols-outlined">print</span>
                        Imprimir
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
                    {/* Data e Hora */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Data da Cirurgia</label>
                            <input
                                required
                                type="date"
                                value={formData.surgery_date}
                                onChange={e => setFormData({ ...formData, surgery_date: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Hora da Cirurgia</label>
                            <input
                                required
                                type="time"
                                value={formData.surgery_time}
                                onChange={e => setFormData({ ...formData, surgery_time: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Paciente */}
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Paciente</label>
                        <select
                            value={formData.patient_id}
                            onChange={e => handlePatientChange(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                        >
                            <option value="">Selecione ou digite manualmente abaixo</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Buscar por CPF</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.cpf_search}
                                onChange={e => handleCpfSearch(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none pl-10"
                                placeholder="Digite o CPF para buscar..."
                            />
                            <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400">search</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">* Digite o CPF para preencher automaticamente os dados do paciente.</p>
                    </div>

                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Nome do Paciente (Manual)</label>
                        <input
                            required
                            type="text"
                            value={formData.patient_name}
                            onChange={e => setFormData({ ...formData, patient_name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                            placeholder="Digite o nome do paciente"
                        />
                    </div>

                    {/* Mãe e Nascimento */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Nome da Mãe</label>
                            <input
                                type="text"
                                value={formData.mother_name}
                                onChange={e => setFormData({ ...formData, mother_name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Data de Nascimento</label>
                            <input
                                type="date"
                                value={formData.birth_date}
                                onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Idade e Peso */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Idade</label>
                            <input
                                type="text"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                                placeholder="Ex: 8 anos"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Peso</label>
                            <input
                                type="text"
                                value={formData.weight}
                                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                                placeholder="Ex: 20 kg"
                            />
                        </div>
                    </div>

                    {/* Médicos */}
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Médicos (separados por vírgula)</label>
                        <input
                            type="text"
                            value={formData.doctors}
                            onChange={e => setFormData({ ...formData, doctors: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                            placeholder="Ex: DR WANDER, DR HÉLIO CREDER"
                        />
                    </div>

                    {/* Procedimento */}
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Procedimento</label>
                        <input
                            type="text"
                            value={formData.procedure}
                            onChange={e => setFormData({ ...formData, procedure: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                            placeholder="Ex: TRAQUEOSCOPIA"
                        />
                    </div>

                    {/* OPME */}
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-2 block">OPME</label>
                        <textarea
                            value={formData.opme}
                            onChange={e => setFormData({ ...formData, opme: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none resize-none"
                            placeholder="Descreva os materiais e equipamentos..."
                        />
                    </div>

                    {/* Setor Pós-Op e CNS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Setor Pós-Operatório</label>
                            <input
                                type="text"
                                value={formData.post_op_sector}
                                onChange={e => setFormData({ ...formData, post_op_sector: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                                placeholder="Ex: RPA/UTI"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">CNS</label>
                            <input
                                type="text"
                                value={formData.cns}
                                onChange={e => setFormData({ ...formData, cns: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                                placeholder="Número do CNS"
                            />
                        </div>
                    </div>

                    {/* Aparelhos */}
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Aparelhos (separados por vírgula)</label>
                        <input
                            type="text"
                            value={formData.equipment}
                            onChange={e => setFormData({ ...formData, equipment: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                            placeholder="Ex: VIDEO, BRONCOSCOPIO, MONITOR"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 print:hidden">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-14 rounded-2xl bg-primary text-white font-black shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar Mapa Cirúrgico'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default NewSurgicalMap;
