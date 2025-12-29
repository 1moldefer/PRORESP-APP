import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Layout from './Layout';

const ApproveUser: React.FC = () => {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('id');
    const userEmail = searchParams.get('email');
    const navigate = useNavigate();
    const [targetUser, setTargetUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        // If we have either ID or Email, we are good to go
        if (userId || userEmail) {
            setTargetUser({ id: userId, email: userEmail });
            setLoading(false);
        } else {
            // If nothing provided, maybe show error or loading forever?
            setLoading(false);
        }
    }, [userId, userEmail]);

    const handleApproval = async (approved: boolean) => {
        // Allow if we have either credential
        if (!userId && !userEmail) {
            alert("Erro: Nenhum dado de usuário (ID ou Email) encontrado no link.");
            return;
        }

        setActionLoading(true);

        try {
            if (approved) {
                const subject = "Acesso Aprovado - Projeto Respirar";
                const body = "Olá,\n\nSeu acesso ao Projeto Respirar foi aprovado!\n\nVocê já pode fazer login normalmente.\n\nAtenciosamente,\nEquipe Projeto Respirar";

                // Use userEmail if available
                const recipient = userEmail || "";

                // 1. Open Email Client
                window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);

                // 2. Guide to Supabase Panel for actual activation
                setTimeout(() => {
                    alert("AÇÃO NECESSÁRIA:\n\n1. O rascunho do email foi aberto. Envie-o para o usuário.\n2. AGORA, você será redirecionado para o Painel do Supabase.\n3. Lá, encontre o usuário pelo email, edite o Metadata e mude 'approved' para 'true' (embora o bloqueio automático esteja temporariamente suspenso, é bom manter o registro).");
                    window.open('https://supabase.com/dashboard/project/qhycrmwizbavnicjgoqq/auth/users', '_blank');
                    navigate('/dashboard');
                }, 500);

            } else {
                const subject = "Solicitação de Acesso - Projeto Respirar";
                const body = "Olá,\n\nInfelizmente sua solicitação de acesso não pode ser aprovada neste momento.\n\nAtenciosamente,\nEquipe Projeto Respirar";
                const recipient = userEmail || "";
                window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                navigate('/dashboard');
            }

        } catch (error: any) {
            alert('Erro: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center p-8 max-w-2xl mx-auto">
                <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-xl w-full p-8 border border-slate-200 dark:border-slate-800">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Aprovação de Usuário</h1>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl mb-8">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Usuário Solicitante</p>
                        {userId ? (
                            <p className="font-mono text-sm text-slate-700 dark:text-slate-300 break-all mb-1">ID: {userId}</p>
                        ) : (
                            <p className="text-sm italic text-slate-400 mb-1">ID não fornecido (usando email)</p>
                        )}
                        {userEmail && <p className="font-bold text-lg text-slate-900 dark:text-white">{userEmail}</p>}
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-xl mb-4">
                            <p className="text-xs text-amber-800 dark:text-amber-200 font-bold flex gap-2">
                                <span className="material-symbols-outlined text-[16px]">info</span>
                                Como a aprovação funciona:
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 pl-6">
                                Ao clicar em <b>Aprovar</b>, o sistema abrirá seu email para notificar o usuário e depois levará você ao Painel Supabase para ativar a conta manualmente.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleApproval(false)}
                                disabled={actionLoading}
                                className="bg-rose-100 hover:bg-rose-200 text-rose-600 font-bold py-4 rounded-xl transition-all"
                            >
                                Rejeitar
                            </button>
                            <button
                                onClick={() => handleApproval(true)}
                                disabled={actionLoading}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                Aprovar Acesso
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ApproveUser;
