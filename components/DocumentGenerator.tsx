import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface DocumentGeneratorProps {
    type: 'prescription' | 'certificate' | 'exam_request';
    patientName: string;
    doctorName: string;
    onClose: () => void;
}

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ type, patientName, doctorName, onClose }) => {
    const [content, setContent] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        // Initial templates
        if (type === 'prescription') {
            setContent(`USO ORAL:\n\n1. [Nome do Medicamento] ...... [Posologia]\n\n\nUSO TÓPICO:\n\n1. [Nome do Medicamento] ...... [Posologia]`);
        } else if (type === 'certificate') {
            setContent(`Atesto para os devidos fins que o(a) Sr(a). ${patientName} esteve sob meus cuidados médicos no dia de hoje, necessitando de _____ dias de repouso.`);
        } else if (type === 'exam_request') {
            setContent(`Solicito os seguintes exames:\n\n1. Hemograma Completo\n2. Raio-X de Tórax\n3. ...`);
        }
    }, [type, patientName]);

    const handlePrint = () => {
        window.print();
    };

    const getTitle = () => {
        switch (type) {
            case 'prescription': return 'RECEITUÁRIO';
            case 'certificate': return 'ATESTADO MÉDICO';
            case 'exam_request': return 'PEDIDO DE EXAMES';
            default: return 'DOCUMENTO';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:p-0 print:bg-white print:static">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-w-none print:h-auto print:rounded-none">

                {/* Header (Screen only) */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between print:hidden">
                    <h2 className="text-xl font-black text-slate-900">{getTitle()}</h2>
                    <button onClick={onClose} className="size-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Document Content (Printable) */}
                <div className="flex-1 p-12 overflow-y-auto print:overflow-visible print:p-0">
                    {/* Print Header */}
                    <div className="hidden print:flex flex-col items-center mb-12 border-b-2 border-black pb-4">
                        <h1 className="text-2xl font-black uppercase tracking-widest">Projeto Respirar</h1>
                        <p className="text-sm font-bold uppercase mt-1">Assistência Médica Especializada</p>
                        <p className="text-xs text-slate-500 mt-2">Rua Exemplo, 123 - Centro - Cidade/UF</p>
                    </div>

                    <div className="space-y-8">
                        <div className="flex justify-between items-end border-b border-slate-900 pb-2">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Paciente</p>
                                <p className="text-xl font-black">{patientName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Data</p>
                                <p className="font-bold">{new Date(date).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>

                        <div className="min-h-[400px]">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-full min-h-[400px] resize-none focus:outline-none text-lg leading-relaxed bg-transparent print:border-none"
                                placeholder="Digite o conteúdo do documento..."
                            />
                        </div>

                        <div className="pt-12 flex flex-col items-center justify-center print:flex">
                            <div className="w-64 border-t border-black pt-2 text-center">
                                <p className="font-bold uppercase text-sm">{doctorName}</p>
                                <p className="text-xs text-slate-500">Médico Responsável</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions (Screen only) */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-4 print:hidden">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">print</span>
                        Imprimir Documento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentGenerator;
