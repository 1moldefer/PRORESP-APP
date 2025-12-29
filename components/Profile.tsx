import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile Data
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Password Change
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
            setAvatarUrl(user.user_metadata?.avatar_url || null);
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem.' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Você deve selecionar uma imagem para upload.');
            }

            if (!user) throw new Error('Usuário não autenticado.');

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const bucketName = 'patients'; // Using existing bucket
            const filePath = `user-avatars/${user.id}/${fileName}`;

            // 1. Delete old avatar if exists to prevent clutter
            if (avatarUrl) {
                try {
                    if (avatarUrl.includes(`/${bucketName}/`)) {
                        const urlParts = avatarUrl.split(`/${bucketName}/`);
                        if (urlParts.length > 1) {
                            const oldPath = urlParts[1];
                            await supabase.storage.from(bucketName).remove([oldPath]);
                        }
                    }
                } catch (err) {
                    console.warn("Failed to delete old avatar", err);
                }
            }

            // 2. Upload new avatar
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                // Better error message for bucket handling
                if (uploadError.message.includes("Bucket not found")) {
                    throw new Error("Erro de configuração: Bucket de armazenamento não encontrado.");
                }
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) {
                throw updateError;
            }

            setAvatarUrl(publicUrl);
            setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUploading(false);
            // Reset input value to allow re-uploading same file if needed
            event.target.value = '';
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="size-12 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition-all">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Meu Perfil</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase">Gerenciar Conta e Segurança</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                        <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                        {message.text}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Coluna Esquerda: Foto e Dados Básicos */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                            <div className="relative group mb-4">
                                <div className="size-32 rounded-full overflow-hidden ring-4 ring-slate-50 dark:ring-slate-800 shadow-xl bg-slate-100">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                                            <span className="material-symbols-outlined text-6xl">person</span>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 size-10 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95">
                                    {uploading ? (
                                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{fullName || 'Usuário'}</h2>
                            <p className="text-sm text-slate-500 font-medium">{user?.email}</p>
                        </div>
                    </div>

                    {/* Coluna Direita: Formulários */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Dados Pessoais */}
                        <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">badge</span>
                                Dados Pessoais
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                                        placeholder="Seu nome completo"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Email (Não editável)</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        Salvar Dados
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Segurança */}
                        <form onSubmit={handleUpdatePassword} className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-500">lock</span>
                                Segurança
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Nova Senha</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium focus:border-primary focus:outline-none"
                                        placeholder="Repita a nova senha"
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading || !newPassword}
                                        className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                                    >
                                        Atualizar Senha
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
