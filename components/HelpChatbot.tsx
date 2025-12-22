import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

const HelpChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Olá! Sou o assistente virtual do PRORESP. Como posso ajudar você hoje?'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

            if (!apiKey) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Desculpe, a chave da API (VITE_OPENAI_API_KEY) não está configurada.'
                }]);
                return;
            }

            const openai = new OpenAI({
                apiKey: apiKey,
                dangerouslyAllowBrowser: true
            });

            const systemPrompt = `
        Você é o Assistente Virtual do PRORESP (Projeto Respirar), um sistema de gestão de pacientes em homecare e traqueostomia.
        Sua função é ajudar os usuários (médicos e gestores) a navegar e usar a plataforma.
        Seja cordial, profissional e use emojis ocasionalmente. Responda de forma concisa.
        
        CONHECIMENTO DA PLATAFORMA:
        1. AGENDA:
           - Permite agendar consultas e cirurgias.
           - Possui visualização mensal, semanal e diária.
           - Tem alertas de conflito de horário.
        
        2. PACIENTES:
           - Cadastro completo com dados pessoais, clínicos, comorbidades.
           - Histórico de internações e procedimentos.
           - Geração de PDF da Ficha de Admissão.
        
        3. MAPAS CIRÚRGICOS (Novo!):
           - Módulo específico para gestão de cirurgias.
           - Permite cadastrar: Data, Hora, Procedimento, OPME, Setor Pós-Op, Paciente, Médicos.
           - Botão de imprimir PDF do mapa.
        
        4. GESTÃO:
           - Cadastros auxiliares de Médicos, Cidades e Locais de Atendimento.
        
        Se o usuário perguntar algo fora do escopo do sistema, diga gentilmente que só pode ajudar com o PRORESP.
        Se for um erro técnico grave, sugira contatar o suporte via WhatsApp.
      `;

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages.map(m => ({ role: m.role, content: m.content })),
                    { role: 'user', content: userMessage }
                ],
            });

            const assistantMessage = response.choices[0]?.message?.content || 'Desculpe, não entendi.';

            setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

        } catch (error) {
            console.error('Erro no chatbot:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Ops! Ocorreu um erro ao processar sua mensagem. Tente novamente.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {/* Botão Flutuante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto size-14 rounded-full bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center animate-bounce-slow"
                title="Ajuda IA"
            >
                <span className="material-symbols-outlined text-[28px]">
                    {isOpen ? 'close' : 'smart_toy'}
                </span>
            </button>

            {/* Janela do Chat */}
            {isOpen && (
                <div className="pointer-events-auto w-[360px] h-[500px] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-fade-in-up origin-bottom-right">

                    {/* Header */}
                    <div className="p-4 bg-indigo-600 text-white flex items-center gap-3">
                        <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Assistente PRORESP</h3>
                            <p className="text-xs text-indigo-100 flex items-center gap-1">
                                <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                Online agora
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex gap-1">
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua dúvida..."
                            className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default HelpChatbot;
