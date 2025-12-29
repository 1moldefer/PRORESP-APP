import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { supabase } from '../supabaseClient';
import { cleanDigits, formatSUS, formatPhone, formatCEP, formatCPF, validateSUS, validatePhone, validateCEP, validateCPF } from '../utils/maskUtils';

const NewPatient: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    // Dados Pessoais
    name: '', cpf: '', mother_name: '', gender: '', medical_record: '', sus_card: '',
    birth_date: '', cep: '', address: '', address_complement: '',
    phone: '', social_network: '',
    city: '', state: '',
    tracheostomy_active: false, homecare_active: false,

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

  // Masked Input Handlers
  const handleSUSChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = cleanDigits(raw).slice(0, 15);
    setFormData({ ...formData, sus_card: cleaned });

    if (cleaned.length > 0 && cleaned.length < 15) {
      setErrors(prev => ({ ...prev, sus_card: 'CNS deve ter 15 dígitos.' }));
    } else {
      setErrors(prev => { const newErr = { ...prev }; delete newErr.sus_card; return newErr; });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = cleanDigits(raw).slice(0, 11);
    setFormData({ ...formData, phone: cleaned });

    if (cleaned.length > 0 && !validatePhone(cleaned)) {
      setErrors(prev => ({ ...prev, phone: 'Celular inválido. Use (DD) 9XXXX-XXXX.' }));
    } else {
      setErrors(prev => { const newErr = { ...prev }; delete newErr.phone; return newErr; });
    }
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = cleanDigits(raw).slice(0, 8);
    setFormData({ ...formData, cep: cleaned });

    if (cleaned.length > 0 && cleaned.length < 8) {
      setErrors(prev => ({ ...prev, cep: 'CEP incompleto.' }));
    } else {
      setErrors(prev => { const newErr = { ...prev }; delete newErr.cep; return newErr; });
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = cleanDigits(raw).slice(0, 11);
    setFormData({ ...formData, cpf: cleaned });

    if (cleaned.length > 0 && !validateCPF(cleaned)) {
      setErrors(prev => ({ ...prev, cpf: 'CPF incompleto.' }));
    } else {
      setErrors(prev => { const newErr = { ...prev }; delete newErr.cpf; return newErr; });
    }
  };

  // CEP Integration
  const handleCepBlur = async () => {
    const cep = formData.cep; // formData has clean digits now
    if (validateCEP(cep)) {
      setAddressLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro,
            neighborhood: data.bairro,
            address_complement: data.complemento,
            city: data.localidade,
            state: data.uf
          }));
          setErrors(prev => { const newErr = { ...prev }; delete newErr.cep; return newErr; });
        } else {
          setErrors(prev => ({ ...prev, cep: 'CEP não encontrado.' }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP.' }));
      } finally {
        setAddressLoading(false);
      }
    } else {
      if (cep.length > 0) setErrors(prev => ({ ...prev, cep: 'CEP inválido.' }));
    }
  };

  const getMissingFields = () => {
    const required = [
      'name', 'cpf', 'mother_name', 'gender', 'medical_record', 'sus_card',
      'birth_date', 'cep', 'address', 'address_complement', 'phone', 'social_network', 'city'
    ];

    const labels: { [key: string]: string } = {
      name: 'Nome Completo', cpf: 'CPF', mother_name: 'Nome da Mãe', gender: 'Gênero',
      medical_record: 'Prontuário', sus_card: 'Cartão SUS', birth_date: 'Data de Nascimento',
      cep: 'CEP', address: 'Endereço',
      address_complement: 'Complemento', phone: 'Celular',
      social_network: 'Rede Social', city: 'Cidade'
    };

    return required.filter(field => !formData[field as keyof typeof formData])
      .map(field => labels[field] || field);
  };

  const handleNextStep = () => {
    if (activeTab === 0) {
      const missing = getMissingFields();
      if (missing.length > 0) {
        alert(`Por favor, preencha os seguintes campos obrigatórios:\n\n- ${missing.join('\n- ')}`);
        return;
      }
    }
    setActiveTab(activeTab + 1);
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    // Strict validation for Save
    if (!isDraft) {
      const missing = getMissingFields();
      if (missing.length > 0) {
        alert(`Por favor, preencha os seguintes campos obrigatórios antes de cadastrar:\n\n- ${missing.join('\n- ')}`);
        return;
      }
    }

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

      // Map to database column names (snake_case) and exclude fields that don't exist in DB
      const dbData = {
        // Personal Data
        name: cleanedData.name,
        cpf: cleanedData.cpf,
        mother_name: cleanedData.mother_name,
        gender: cleanedData.gender,
        medical_record: cleanedData.medical_record,
        sus_card: cleanedData.sus_card,
        birth_date: cleanedData.birth_date,
        age: formData.birth_date ? new Date().getFullYear() - new Date(formData.birth_date).getFullYear() : null,

        // Address
        cep: cleanedData.cep,
        address: cleanedData.address_complement ? `${cleanedData.address} - ${cleanedData.address_complement}` : cleanedData.address,
        // address_complement: cleanedData.address_complement, // Removed as column likely doesn't exist (Extended field)
        city: cleanedData.state ? `${cleanedData.city} - ${cleanedData.state}` : cleanedData.city,
        // state: cleanedData.state, // Removed as column doesn't exist

        // Contact
        phone: cleanedData.phone,
        social_network: cleanedData.social_network,

        // Status
        tracheostomy_active: cleanedData.tracheostomy_active || false,
        homecare_active: cleanedData.homecare_active || false,

        // Birth/Gestation Data
        birth_type: cleanedData.birth_type,
        apgar: cleanedData.apgar,
        cephalic_perimeter: cleanedData.cephalic_perimeter,
        birth_weight: cleanedData.birth_weight,
        gestational_age: cleanedData.gestational_age,
        torch_serology: cleanedData.torch_serology,
        prenatal_complications: cleanedData.prenatal_complications,
        delivery_room_maneuvers: cleanedData.delivery_room_maneuvers,
        intubation_date: cleanedData.intubation_date,
        intubation_time: cleanedData.intubation_time,
        extubation_failure: cleanedData.extubation_failure,
        accidental_extubation: cleanedData.accidental_extubation,
        intubation_cause: cleanedData.intubation_cause,
        pcr: cleanedData.pcr || false,
        severe_hypoxia: cleanedData.severe_hypoxia || false,
        urgent_tqt: cleanedData.urgent_tqt || false,
        difficult_airway: cleanedData.difficult_airway || false,
        congenital_stridor: cleanedData.congenital_stridor,
        previous_surgery: cleanedData.previous_surgery,

        // Clinical Data
        comorbidities_cardiac: cleanedData.comorbidities_cardiac,
        comorbidities_digestive: cleanedData.comorbidities_digestive,
        comorbidities_neurological: cleanedData.comorbidities_neurological,
        comorbidities_infectious: cleanedData.comorbidities_infectious,
        comorbidities_genetic: cleanedData.comorbidities_genetic,
        comorbidities_osteoarticular: cleanedData.comorbidities_osteoarticular,
        tracheostomy_clinical_history: cleanedData.tracheostomy_clinical_history,
        dysphagia: cleanedData.dysphagia,
        hypersialorrhea: cleanedData.hypersialorrhea,
        recurrent_pneumonia: cleanedData.recurrent_pneumonia,
        tqt_type: cleanedData.tqt_type,
        cannula_type: cleanedData.cannula_type,
        severe_complications: cleanedData.severe_complications,

        // Bronchoscopy
        bronchoscopy_nostril: cleanedData.bronchoscopy_nostril,
        nasal_septum_deviation: cleanedData.nasal_septum_deviation,
        piriform_aperture_stenosis: cleanedData.piriform_aperture_stenosis,
        choanal_atresia: cleanedData.choanal_atresia,
        nasal_stenosis: cleanedData.nasal_stenosis,
        rhinopharynx: cleanedData.rhinopharynx,
        oropharynx: cleanedData.oropharynx,

        // Larynx Findings
        larynx_findings: cleanedData.larynx_findings,
        larynx_preserved: cleanedData.larynx_preserved || false,
        larynx_arytenoid_redundancy: cleanedData.larynx_arytenoid_redundancy || false,
        larynx_short_aryepiglottic_ligaments: cleanedData.larynx_short_aryepiglottic_ligaments || false,
        larynx_omega_epiglottis: cleanedData.larynx_omega_epiglottis || false,
        larynx_epiglottoptosis: cleanedData.larynx_epiglottoptosis || false,
        larynx_laryngomalacia: cleanedData.larynx_laryngomalacia || false,
        larynx_vocal_fold_paralysis: cleanedData.larynx_vocal_fold_paralysis,
        larynx_vocal_fold_paralysis_position: cleanedData.larynx_vocal_fold_paralysis_position,
        larynx_vocal_nodules: cleanedData.larynx_vocal_nodules || false,
        larynx_web: cleanedData.larynx_web,
        larynx_posterior_glottic_stenosis: cleanedData.larynx_posterior_glottic_stenosis || false,
        morphological_findings: cleanedData.morphological_findings,
        glossoptosis: cleanedData.glossoptosis || false,
        valecula: cleanedData.valecula,
        piriform_sinus: cleanedData.piriform_sinus,

        // Avatar
        avatar_url: avatarUrl
      };

      const { error } = await supabase.from('patients').insert([dbData]);

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
                    <img src={photoPreview} alt="Preview" className="size-32 rounded-3xl object-cover shadow-lg touch-none pointer-events-none" />
                  ) : (
                    <div className="size-32 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-slate-400">person</span>
                    </div>
                  )}

                  {/* Remove Photo Button */}
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        // Reset file input if needed, but managing state is enough usually
                      }}
                      className="absolute -top-3 -right-3 size-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all z-20 hover:scale-110 active:scale-95"
                      title="Remover foto"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}

                  <label className="absolute -bottom-2 -right-2 size-10 rounded-xl bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-all shadow-lg z-10 hover:scale-110 active:scale-95">
                    <span className="material-symbols-outlined text-[20px]">{photoPreview ? 'edit' : 'photo_camera'}</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Nome Completo *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Nome da Mãe *</label>
                  <input type="text" value={formData.mother_name} onChange={e => setFormData({ ...formData, mother_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">CPF *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCPF(formData.cpf)}
                      onChange={handleCPFChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.cpf ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none transition-all`}
                    />
                    {errors.cpf && (
                      <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-rose-500 animate-in slide-in-from-top-1">{errors.cpf}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Gênero *</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none">
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Prontuário *</label>
                  <input type="text" value={formData.medical_record} onChange={e => setFormData({ ...formData, medical_record: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Cartão SUS *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatSUS(formData.sus_card)}
                      onChange={handleSUSChange}
                      placeholder="999 9999 9999 9999"
                      maxLength={18} // 15 digits + 3 spaces
                      className={`w-full px-4 py-3 rounded-xl border ${errors.sus_card ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none transition-all`}
                    />
                    {errors.sus_card && (
                      <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-rose-500 animate-in slide-in-from-top-1">{errors.sus_card}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Data de Nascimento *</label>
                  <input type="date" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">CEP *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCEP(formData.cep)}
                      onChange={handleCEPChange}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      maxLength={9} // 8 digits + 1 hyphen
                      className={`w-full px-4 py-3 rounded-xl border ${errors.cep ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none transition-all`}
                    />
                    {addressLoading && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {errors.cep && !addressLoading && (
                      <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-rose-500 animate-in slide-in-from-top-1">{errors.cep}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Cidade *</label>
                  {/* Logic: if state exists, show it. If city is manually typed or from API, use text or select logic.
                      User requested "apareço todos os dados do endereço".
                      Let's stick to simple Input for City/State for API compat, or Select if strictly required. 
                      Given the dropdown existed for DB cities, we should keep it but maybe allow override?
                      For simplicity and to meet the requirement "fill address data", I'll default to text inputs filled by API but editable. 
                      Using Select restricting to DB cities might break the API fill if the API returns a city not in DB.
                      Let's use an input with datalist or just an input for flexibility.
                      Wait, the existing code used a Select. Standardizing to Input for "City" allows API fill freely.
                   */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                      placeholder="Cidade"
                    />
                    <input
                      type="text"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="w-20 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                      placeholder="UF"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Endereço *</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Complemento *</label>
                  <input type="text" value={formData.address_complement} onChange={e => setFormData({ ...formData, address_complement: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Celular *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formatPhone(formData.phone)}
                      onChange={handlePhoneChange}
                      placeholder="(99) 99999-9999"
                      maxLength={15} // (DD) 9XXXX-XXXX
                      className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none transition-all`}
                    />
                    {errors.phone && (
                      <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-rose-500 animate-in slide-in-from-top-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Rede Social *</label>
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
                onClick={handleNextStep}
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
