import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

interface PatientDocument {
    id: string;
    name: string;
    file_path: string;
    file_type: string;
    size: number;
    created_at: string;
    description?: string;
}

interface Props {
    patientId: string;
    appointmentId?: string;
    isGlobalView?: boolean;
}

const PatientDocuments: React.FC<Props> = ({ patientId, appointmentId, isGlobalView }) => {
    const [documents, setDocuments] = useState<PatientDocument[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showDescModal, setShowDescModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [fileDescription, setFileDescription] = useState('');

    // Deletion states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [docToDelete, setDocToDelete] = useState<PatientDocument | null>(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deletedHistory, setDeletedHistory] = useState<any[]>([]);
    const [showDeletedHistory, setShowDeletedHistory] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        fetchDocuments();
        fetchDeletedHistory();
    }, [patientId, appointmentId]);

    const fetchDeletedHistory = async () => {
        try {
            const { data } = await supabase
                .from('patient_history')
                .select('*')
                .eq('patient_id', patientId)
                .order('changed_at', { ascending: false });

            // Filter for document deletion records
            const logs = data?.filter(log => log.changes?.action === 'document_deleted') || [];
            setDeletedHistory(logs);
        } catch (error) {
            console.error('Error fetching deleted history:', error);
        }
    };

    const fetchDocuments = async () => {
        try {
            let query = supabase
                .from('patient_documents')
                .select('*')
                .eq('patient_id', patientId);

            if (appointmentId) {
                query = query.eq('appointment_id', appointmentId);
            } else {
                // If no appointmentId is provided, we might want to show all OR specific ones.
                // The user asked for "cada nova abrir sem anexo", so we filter strictly if ID provided.
                // Let's keep it flexible.
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setPendingFile(file);
        setFileDescription('');
        setShowDescModal(true);
        // Reset input to allow same file selection
        e.target.value = '';
    };

    const confirmUpload = async () => {
        if (!pendingFile) return;

        const file = pendingFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `docs/${patientId}/${fileName}`;

        setUploading(true);
        setShowDescModal(false);

        try {
            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('patients')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Save metadata to Database
            const { error: dbError } = await supabase
                .from('patient_documents')
                .insert({
                    patient_id: patientId,
                    appointment_id: appointmentId,
                    name: file.name,
                    file_path: filePath,
                    file_type: file.type,
                    size: file.size,
                    description: fileDescription
                });

            if (dbError) throw dbError;

            alert('Documento anexado com sucesso!');
            fetchDocuments();
        } catch (error: any) {
            alert('Erro ao fazer upload: ' + error.message);
        } finally {
            setUploading(false);
            setPendingFile(null);
            setFileDescription('');
        }
    };

    const handleDeleteClick = (doc: PatientDocument) => {
        setDocToDelete(doc);
        setDeleteReason('');
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!docToDelete || !deleteReason.trim()) return;

        const doc = docToDelete;
        try {
            // 1. Record in patient_history (Audit Trail)
            const { error: historyError } = await supabase
                .from('patient_history')
                .insert({
                    patient_id: patientId,
                    changed_by: user?.email || 'Usuário',
                    changes: {
                        action: 'document_deleted',
                        document_name: doc.name,
                        document_description: doc.description,
                        reason: deleteReason,
                        deleted_at: new Date().toISOString()
                    }
                });

            if (historyError) throw historyError;

            // 2. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('patients')
                .remove([doc.file_path]);

            if (storageError) console.error('Storage delete error:', storageError);

            // 3. Delete from Database
            const { error: dbError } = await supabase
                .from('patient_documents')
                .delete()
                .eq('id', doc.id);

            if (dbError) throw dbError;

            alert('Documento excluído com sucesso!');
            setShowDeleteModal(false);
            setDocToDelete(null);
            fetchDocuments();
            fetchDeletedHistory();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleDownload = async (doc: PatientDocument) => {
        try {
            const { data, error } = await supabase.storage
                .from('patients')
                .createSignedUrl(doc.file_path, 60); // 60 seconds valid URL

            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error: any) {
            alert('Erro ao baixar: ' + error.message);
        }
    };

    const handlePreview = async (doc: PatientDocument) => {
        try {
            const { data, error } = await supabase.storage
                .from('patients')
                .createSignedUrl(doc.file_path, 3600); // 1 hour for preview session

            if (error) throw error;
            if (data?.signedUrl) {
                setPreviewUrl(data.signedUrl);
                setPreviewDoc(doc);
                setShowPreviewModal(true);
            }
        } catch (error: any) {
            alert('Erro ao visualizar: ' + error.message);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={isGlobalView ? "w-full" : "bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800"}>
            <div className={`flex items-center justify-between mb-6 ${isGlobalView ? 'hidden' : ''}`}>
                <div>
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Documentos Anexados</h3>
                    <p className="text-[10px] text-slate-400">PDFs e Imagens</p>
                </div>

                <label className={`cursor-pointer px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? (
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : (
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                    )}
                    {uploading ? 'Enviando...' : 'Anexar Arquivo'}
                    <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                </label>
            </div>

            {loading ? (
                <div className="p-4 text-center text-slate-400 text-xs">Carregando documentos...</div>
            ) : documents.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">folder_open</span>
                    <p className="text-slate-400 text-xs font-bold">Nenhum documento anexado ainda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-2">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                            <div className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1" onClick={() => handlePreview(doc)}>
                                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${doc.file_type.includes('pdf') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                    <span className="material-symbols-outlined">
                                        {doc.file_type.includes('pdf') ? 'picture_as_pdf' : 'image'}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate pr-4">{doc.name}</p>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${doc.file_type.includes('pdf') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                            {doc.file_type.includes('pdf') ? 'PDF' : 'IMAGEM'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-2">
                                        {formatFileSize(doc.size)} • {new Date(doc.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {doc.description && (
                                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                                            {doc.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleDownload(doc)}
                                    className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                    title="Baixar"
                                >
                                    <span className="material-symbols-outlined text-lg">download</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(doc)}
                                    className="size-8 flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors"
                                    title="Excluir"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Histórico de Exclusões */}
            {deletedHistory.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setShowDeletedHistory(!showDeletedHistory)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">
                            {showDeletedHistory ? 'expand_less' : 'history'}
                        </span>
                        {showDeletedHistory ? 'Ocultar Histórico de Exclusões' : `Ver Histórico de Exclusões (${deletedHistory.length})`}
                    </button>

                    {showDeletedHistory && (
                        <div className="mt-4 space-y-3">
                            {deletedHistory.map((log) => (
                                <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Documento Excluído</span>
                                        <span className="text-[9px] font-bold text-slate-400">
                                            {new Date(log.changed_at).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        {log.changes?.document_name}
                                    </p>
                                    <div className="bg-white dark:bg-black/20 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Motivo da Exclusão:</span>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">"{log.changes?.reason}"</p>
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-2 text-right">Excluído por: {log.changed_by}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Descrição para Upload */}
            {showDescModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                <span className="material-symbols-outlined">description</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Descrever Documento</h3>
                        </div>

                        <p className="text-xs text-slate-500 font-bold mb-4 uppercase">Arquivo: {pendingFile?.name}</p>

                        <div className="mb-6">
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Breve descrição ou título</label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={fileDescription}
                                onChange={(e) => setFileDescription(e.target.value)}
                                placeholder="Ex: Resultado de Hemograma, RX Tórax..."
                                onKeyDown={(e) => e.key === 'Enter' && confirmUpload()}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDescModal(false); setPendingFile(null); }}
                                className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmUpload}
                                disabled={!fileDescription.trim()}
                                className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar e Anexar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Exclusão com Motivo */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                                <span className="material-symbols-outlined">delete_forever</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Confirmar Exclusão</h3>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50 mb-6">
                            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase mb-1">Você está prestes a excluir:</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">{docToDelete?.name}</p>
                            {docToDelete?.description && <p className="text-[11px] text-slate-500 mt-1 italic">"{docToDelete.description}"</p>}
                        </div>

                        <div className="mb-6">
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Motivo da Exclusão (Obrigatório)</label>
                            <textarea
                                autoFocus
                                rows={3}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Informe o motivo da exclusão deste documento..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDocToDelete(null); }}
                                className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={!deleteReason.trim()}
                                className="flex-1 h-12 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Excluir Permanentemente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Visualização (Preview) */}
            {showPreviewModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col p-4 md:p-8" onClick={() => setShowPreviewModal(false)}>
                    <div className="flex items-center justify-between mb-4 max-w-6xl mx-auto w-full">
                        <div className="flex items-center gap-4 text-white">
                            <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white">
                                    {previewDoc?.file_type.includes('pdf') ? 'picture_as_pdf' : 'image'}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-black truncate">{previewDoc?.description || previewDoc?.name}</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{previewDoc?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); previewDoc && handleDownload(previewDoc); }}
                                className="size-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                                title="Baixar Original"
                            >
                                <span className="material-symbols-outlined">download</span>
                            </button>
                            <button onClick={() => setShowPreviewModal(false)} className="size-12 rounded-2xl bg-white/10 hover:bg-rose-500 text-white transition-all flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-white/5 rounded-3xl overflow-hidden max-w-6xl mx-auto w-full flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                        {previewDoc?.file_type.includes('pdf') ? (
                            <iframe
                                src={`${previewUrl}#toolbar=0`}
                                className="w-full h-full border-none"
                                title="Visualizador PDF"
                            />
                        ) : (
                            <img
                                src={previewUrl}
                                alt={previewDoc?.name}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                            />
                        )}
                    </div>

                    {previewDoc?.description && (
                        <div className="mt-6 max-w-2xl mx-auto w-full bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Descrição Médica</span>
                            <p className="text-white text-sm font-medium leading-relaxed">{previewDoc.description}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PatientDocuments;
