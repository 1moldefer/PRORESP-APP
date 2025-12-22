import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { supabase } from '../supabaseClient';

const NewPatient: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const [formData, setFormData] = useState({
    // Dados Pessoais
    name: '', cpf: '', mother_name: '', gender: '', medical_record: '', sus_card: '',
    birth_date: '', cep: '', address: '', address_complement: '', phone: '', social_network: '',
    city: '', tracheostomy_active: false, homecare_active: false,

    // Dados de Nascimento/Gestação
    birth_type: '', apgar: '', cephalic_perimeter: '', birth_weight: '', gestational_age: '',
    torch_serology: '', prenatal_complications: '', delivery_room_maneuvers: '',
    intubation_date: '', intubation_time: '', extubation_failure: '', accidental_extubation: '',
    intubation_cause: '', pcr: false, severe_hypoxia: false, urgent_tqt: false, difficult_airway: false,
    congenital_stridor: '', previous_surgery: '',

    // Dados Clínicos
    comorbidities_cardiac: '', comorbidities_digestive: '', comorbidities_neurological: '',
    comorbidities_infectious: '', comorbidities_genetic: '', comorbidities_osteoarticular: '',
    tracheostomy_clinical_history: '', dysphagia: '', hypersialorrhea: '', recurrent_pneumonia: '',
    tqt_type: '', cannula_type: '', severe_complications: '',

    // Broncoscopia
    bronchoscopy_nostril: '', nasal_septum_deviation: '', piriform_aperture_stenosis: '',
    choanal_atresia: '', nasal_stenosis: '', rhinopharynx: '', oropharynx: '',

    // Laringe e Achados
    larynx_findings: '', larynx_preserved: false, larynx_arytenoid_redundancy: false,
    larynx_short_aryepiglottic_ligaments: false, larynx_omega_epiglottis: false,
    larynx_epiglottoptosis: false, larynx_laryngomalacia: false,
    larynx_vocal_fold_paralysis: '', larynx_vocal_fold_paralysis_position: '',
    larynx_vocal_nodules: false, larynx_web: '', larynx_posterior_glottic_stenosis: false,
    morphological_findings: '', glossoptosis: false, valecula: '', piriform_sinus: ''
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    const { data } = await supabase.from('cities').select('*').eq('status', 'Ativo');
    if (data) setCities(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = null;
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('patients')
          .upload(fileName, photo);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('patients').getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      // Clean formData - remove empty strings and convert to null for database
      const cleanedData: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
          cleanedData[key] = null;
        } else {
          cleanedData[key] = value;
        }
      });

      const { error } = await supabase.from('patients').insert([{
        ...cleanedData,
        avatar_url: avatarUrl,
        age: formData.birth_date ? new Date().getFullYear() - new Date(formData.birth_date).getFullYear() : null
      }]);

      if (error) throw error;
      alert(isDraft ? 'Rascunho salvo!' : 'Paciente cadastrado com sucesso!');
      navigate('/patients');
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 0, label: 'Dados Pessoais', icon: 'person' },
    { id: 1, label: 'Nascimento/Gestação', icon: 'child_care' },
    { id: 2, label: 'Dados Clínicos', icon: 'medical_information' },
    { id: 3, label: 'Broncoscopia', icon: 'pulmonology' },
    { id: 4, label: 'Laringe e Achados', icon: 'mic' }
  ];

  const handleStepClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-12 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Formulário de Admissão Ambulatorial</h1>
            <p className="text-sm font-bold text-slate-500 uppercase">Cadastro Completo de Paciente</p>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            {tabs.map((tab, index) => (
              <div key={tab.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`size-12 rounded-full flex items-center justify-center font-black text-lg transition-all ${activeTab === index
                    ? 'bg-primary text-white shadow-lg scale-110'
                    : activeTab > index
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                    {activeTab > index ? (
                      <span className="material-symbols-outlined">check</span>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p className={`text-xs font-bold mt-2 text-center hidden md:block ${activeTab === index ? 'text-primary' : 'text-slate-400'
                    }`}>
                    {tab.label}
                  </p>
                </div>
                {index < tabs.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${activeTab > index ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg">

          {/* Tab 0: Dados Pessoais */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="size-32 rounded-3xl object-cover shadow-lg" />
                  ) : (
                    <div className="size-32 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-slate-400">person</span>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 size-10 rounded-xl bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-all shadow-lg">
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Nome Completo *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Nome da Mãe</label>
                  <input type="text" value={formData.mother_name} onChange={e => setFormData({ ...formData, mother_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Gênero</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none">
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Prontuário</label>
                  <input type="text" value={formData.medical_record} onChange={e => setFormData({ ...formData, medical_record: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Cartão SUS</label>
                  <input type="text" value={formData.sus_card} onChange={e => setFormData({ ...formData, sus_card: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Data de Nascimento</label>
                  <input type="date" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">CEP</label>
                  <input type="text" value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Cidade</label>
                  <select value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none">
                    <option value="">Selecione...</option>
                    {cities.map(c => <option key={c.id} value={`${c.name} - ${c.uf}`}>{c.name} - {c.uf}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Endereço</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Complemento</label>
                  <input type="text" value={formData.address_complement} onChange={e => setFormData({ ...formData, address_complement: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Celular</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Rede Social</label>
                  <input type="text" value={formData.social_network} onChange={e => setFormData({ ...formData, social_network: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="traq" checked={formData.tracheostomy_active} onChange={e => setFormData({ ...formData, tracheostomy_active: e.target.checked })} className="size-5" />
                  <label htmlFor="traq" className="font-bold text-slate-700 dark:text-slate-300">Traqueostomia Ativa</label>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="home" checked={formData.homecare_active} onChange={e => setFormData({ ...formData, homecare_active: e.target.checked })} className="size-5" />
                  <label htmlFor="home" className="font-bold text-slate-700 dark:text-slate-300">Homecare Ativo</label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Nascimento/Gestação */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Dados de Gestação / Nascimento</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Tipo de Parto</label>
                  <select value={formData.birth_type} onChange={e => setFormData({ ...formData, birth_type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none">
                    <option value="">Selecione...</option>
                    <option value="Normal">Normal</option>
                    <option value="Cesárea">Cesárea</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">APGAR</label>
                  <input type="text" value={formData.apgar} onChange={e => setFormData({ ...formData, apgar: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Perímetro Cefálico</label>
                  <input type="text" value={formData.cephalic_perimeter} onChange={e => setFormData({ ...formData, cephalic_perimeter: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Peso ao Nascer</label>
                  <input type="text" value={formData.birth_weight} onChange={e => setFormData({ ...formData, birth_weight: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">IG (Idade Gestacional)</label>
                  <input type="text" value={formData.gestational_age} onChange={e => setFormData({ ...formData, gestational_age: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Sorologias TORCH</label>
                  <input type="text" value={formData.torch_serology} onChange={e => setFormData({ ...formData, torch_serology: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Intercorrências Pré-natal</label>
                  <textarea value={formData.prenatal_complications} onChange={e => setFormData({ ...formData, prenatal_complications: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none resize-none" />
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Manobras Sala de Parto</label>
                  <input type="text" value={formData.delivery_room_maneuvers} onChange={e => setFormData({ ...formData, delivery_room_maneuvers: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Data da Intubação</label>
                  <input type="date" value={formData.intubation_date} onChange={e => setFormData({ ...formData, intubation_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Tempo de Intubação</label>
                  <input type="text" value={formData.intubation_time} onChange={e => setFormData({ ...formData, intubation_time: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Falha de Extubação</label>
                  <select value={formData.extubation_failure} onChange={e => setFormData({ ...formData, extubation_failure: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none">
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Causa da Intubação</label>
                  <input type="text" value={formData.intubation_cause} onChange={e => setFormData({ ...formData, intubation_cause: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="pcr" checked={formData.pcr} onChange={e => setFormData({ ...formData, pcr: e.target.checked })} />
                  <label htmlFor="pcr" className="text-sm font-bold">PCR</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="hypoxia" checked={formData.severe_hypoxia} onChange={e => setFormData({ ...formData, severe_hypoxia: e.target.checked })} />
                  <label htmlFor="hypoxia" className="text-sm font-bold">Hipóxia Grave</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="tqt" checked={formData.urgent_tqt} onChange={e => setFormData({ ...formData, urgent_tqt: e.target.checked })} />
                  <label htmlFor="tqt" className="text-sm font-bold">TQT Urgência</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="airway" checked={formData.difficult_airway} onChange={e => setFormData({ ...formData, difficult_airway: e.target.checked })} />
                  <label htmlFor="airway" className="text-sm font-bold">Via Aérea Difícil</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Estridor Congênito</label>
                  <input type="text" value={formData.congenital_stridor} onChange={e => setFormData({ ...formData, congenital_stridor: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Cirurgia Prévia</label>
                  <input type="text" value={formData.previous_surgery} onChange={e => setFormData({ ...formData, previous_surgery: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Dados Clínicos */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Comorbidades e Dados Clínicos</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Comorbidades Cardíacas</label>
                  <input type="text" value={formData.comorbidities_cardiac} onChange={e => setFormData({ ...formData, comorbidities_cardiac: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Comorbidades Digestivas</label>
                  <input type="text" value={formData.comorbidities_digestive} onChange={e => setFormData({ ...formData, comorbidities_digestive: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Comorbidades Neurológicas</label>
                  <input type="text" value={formData.comorbidities_neurological} onChange={e => setFormData({ ...formData, comorbidities_neurological: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Comorbidades Infecciosas</label>
                  <input type="text" value={formData.comorbidities_infectious} onChange={e => setFormData({ ...formData, comorbidities_infectious: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Comorbidades Genéticas</label>
                  <input type="text" value={formData.comorbidities_genetic} onChange={e => setFormData({ ...formData, comorbidities_genetic: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Comorbidades Osteoarticulares</label>
                  <input type="text" value={formData.comorbidities_osteoarticular} onChange={e => setFormData({ ...formData, comorbidities_osteoarticular: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase mb-2 block">História Clínica que Levou à Traqueostomia</label>
                <textarea value={formData.tracheostomy_clinical_history} onChange={e => setFormData({ ...formData, tracheostomy_clinical_history: e.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Disfagia</label>
                  <select value={formData.dysphagia} onChange={e => setFormData({ ...formData, dysphagia: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none">
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Hipersialorreia</label>
                  <select value={formData.hypersialorrhea} onChange={e => setFormData({ ...formData, hypersialorrhea: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none">
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Pneumonia de Repetição</label>
                  <select value={formData.recurrent_pneumonia} onChange={e => setFormData({ ...formData, recurrent_pneumonia: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none">
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Tipo de Cânula</label>
                  <input type="text" value={formData.cannula_type} onChange={e => setFormData({ ...formData, cannula_type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Intercorrências Graves</label>
                <textarea value={formData.severe_complications} onChange={e => setFormData({ ...formData, severe_complications: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none resize-none" />
              </div>
            </div>
          )}

          {/* Tab 3: Broncoscopia */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Dados da Broncoscopia</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Narina</label>
                  <input type="text" value={formData.bronchoscopy_nostril} onChange={e => setFormData({ ...formData, bronchoscopy_nostril: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Desvio de Septo Nasal</label>
                  <input type="text" value={formData.nasal_septum_deviation} onChange={e => setFormData({ ...formData, nasal_septum_deviation: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Estenose de Abertura Piriforme</label>
                  <input type="text" value={formData.piriform_aperture_stenosis} onChange={e => setFormData({ ...formData, piriform_aperture_stenosis: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Atresia de Coana</label>
                  <input type="text" value={formData.choanal_atresia} onChange={e => setFormData({ ...formData, choanal_atresia: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Estenose Narinária</label>
                  <input type="text" value={formData.nasal_stenosis} onChange={e => setFormData({ ...formData, nasal_stenosis: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Rinofaringe</label>
                  <input type="text" value={formData.rhinopharynx} onChange={e => setFormData({ ...formData, rhinopharynx: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Orofaringe</label>
                  <input type="text" value={formData.oropharynx} onChange={e => setFormData({ ...formData, oropharynx: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Laringe e Achados */}
          {activeTab === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Laringe e Achados Morfológicos</h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="preserved" checked={formData.larynx_preserved} onChange={e => setFormData({ ...formData, larynx_preserved: e.target.checked })} />
                  <label htmlFor="preserved" className="text-sm font-bold">Preservada</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="redundancy" checked={formData.larynx_arytenoid_redundancy} onChange={e => setFormData({ ...formData, larynx_arytenoid_redundancy: e.target.checked })} />
                  <label htmlFor="redundancy" className="text-sm font-bold">Redundância Aritenoides</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="ligaments" checked={formData.larynx_short_aryepiglottic_ligaments} onChange={e => setFormData({ ...formData, larynx_short_aryepiglottic_ligaments: e.target.checked })} />
                  <label htmlFor="ligaments" className="text-sm font-bold">Ligamentos Curtos</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="omega" checked={formData.larynx_omega_epiglottis} onChange={e => setFormData({ ...formData, larynx_omega_epiglottis: e.target.checked })} />
                  <label htmlFor="omega" className="text-sm font-bold">Epiglote em Ômega</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="epiglottoptosis" checked={formData.larynx_epiglottoptosis} onChange={e => setFormData({ ...formData, larynx_epiglottoptosis: e.target.checked })} />
                  <label htmlFor="epiglottoptosis" className="text-sm font-bold">Epiglotoptose</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="laryngomalacia" checked={formData.larynx_laryngomalacia} onChange={e => setFormData({ ...formData, larynx_laryngomalacia: e.target.checked })} />
                  <label htmlFor="laryngomalacia" className="text-sm font-bold">Laringomalácia</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="nodules" checked={formData.larynx_vocal_nodules} onChange={e => setFormData({ ...formData, larynx_vocal_nodules: e.target.checked })} />
                  <label htmlFor="nodules" className="text-sm font-bold">Nódulos Vocais</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="stenosis" checked={formData.larynx_posterior_glottic_stenosis} onChange={e => setFormData({ ...formData, larynx_posterior_glottic_stenosis: e.target.checked })} />
                  <label htmlFor="stenosis" className="text-sm font-bold">Estenose Glótica</label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <input type="checkbox" id="glossoptosis" checked={formData.glossoptosis} onChange={e => setFormData({ ...formData, glossoptosis: e.target.checked })} />
                  <label htmlFor="glossoptosis" className="text-sm font-bold">Glossoptose</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Paralisia de Prega Vocal</label>
                  <input type="text" value={formData.larynx_vocal_fold_paralysis} onChange={e => setFormData({ ...formData, larynx_vocal_fold_paralysis: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Posição da Paralisia</label>
                  <input type="text" value={formData.larynx_vocal_fold_paralysis_position} onChange={e => setFormData({ ...formData, larynx_vocal_fold_paralysis_position: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Web Laríngeo</label>
                  <input type="text" value={formData.larynx_web} onChange={e => setFormData({ ...formData, larynx_web: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Valécula</label>
                  <input type="text" value={formData.valecula} onChange={e => setFormData({ ...formData, valecula: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Seios Piriformes</label>
                  <input type="text" value={formData.piriform_sinus} onChange={e => setFormData({ ...formData, piriform_sinus: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Achados Morfológicos (Texto Livre)</label>
                <textarea value={formData.morphological_findings} onChange={e => setFormData({ ...formData, morphological_findings: e.target.value })} rows={5} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none resize-none" placeholder="Descreva os achados morfológicos detalhadamente..." />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            {activeTab > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab - 1)}
                className="flex items-center gap-2 h-14 px-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Anterior
              </button>
            )}

            {activeTab < tabs.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab + 1)}
                className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-white font-black shadow-lg hover:bg-primary-dark transition-all ml-auto"
              >
                Próximo
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  className="flex-1 h-14 rounded-2xl bg-slate-600 text-white font-black hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Rascunho'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-14 rounded-2xl bg-primary text-white font-black shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Cadastrar Paciente'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewPatient;
