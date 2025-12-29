import { supabase } from "./supabaseClient";
import { Patient } from "./types";

// Temporary direct OpenAI integration for testing
// TODO: Move to Supabase Edge Function for production
// Backend-only AI Service via Supabase Edge Functions

const callOpenAI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    try {
        // @ts-ignore - Vite env exists at runtime
        const localKey = import.meta.env.VITE_OPENAI_API_KEY;

        // Development Mode: Use local API key if available
        if (localKey && localKey.length > 20 && !localKey.includes('sua-chave')) {
            console.log("🔧 Dev Mode: Calling OpenAI API directly...");

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || 'Sem resposta da IA.';
        }

        // Production Mode: Use Supabase Edge Function (secure backend)
        console.log("🚀 Production Mode: Calling Supabase Edge Function...");

        const { data, error } = await supabase.functions.invoke('ai-service', {
            body: { systemPrompt, userPrompt }
        });

        if (error) {
            console.error("Supabase Function Error:", error);
            throw new Error(error.message || 'Erro ao comunicar com o serviço de IA no backend.');
        }

        return data?.content || 'Sem resposta da IA.';

    } catch (error: any) {
        console.error('AI Service Error:', error);

        // User-friendly error messages
        if (error.message?.includes('FunctionsFetchError') || error.message?.includes('Failed to fetch')) {
            throw new Error('⚠️ Serviço de IA indisponível. Certifique-se de que a Edge Function foi deployada no Supabase ou configure VITE_OPENAI_API_KEY no .env.local para desenvolvimento local.');
        }

        throw error;
    }
};

export const getClinicalSummary = async (patient: Patient, appointments: any[] = []): Promise<string> => {
    try {
        const sortedAppointments = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const historyText = sortedAppointments.map(apt => {
            let detail = `- ${new Date(apt.date).toLocaleDateString('pt-BR')}: ${apt.doctors?.name || 'Médico'} (${apt.status})`;
            if (apt.diagnosis) detail += `\n  - Diagnóstico: ${apt.diagnosis}`;
            if (apt.therapeutic_plan) detail += `\n  - Plano: ${apt.therapeutic_plan}`;
            if (apt.weight) detail += `\n  - Peso: ${apt.weight}`;
            if (apt.notes) detail += `\n  - Observações: ${apt.notes}`;
            if (apt.patient_documents && apt.patient_documents.length > 0) {
                const docNames = apt.patient_documents.map((d: any) => d.name).join(', ');
                detail += `\n  - Arquivos Anexados: ${docNames}`;
            }
            return detail;
        }).join('\n');

        const systemPrompt = `Você é um assistente da via aérea pediátrica. Sua função é analisar o histórico do paciente e fornecer insights clínicos baseados nas melhores práticas de traqueostomia infantil e via aérea pediátrica. Seja técnico, preciso e foque na evolução clínica e manejo da via aérea.`;
        const userPrompt = `Paciente: ${patient.name}
Idade: ${patient.age || 'N/A'}
Histórico de Consultas:
${historyText}

Como assistente da via aérea pediátrica, gere um resumo clínico estruturado destacando:
1. Diagnósticos principais relacionados à via aérea.
2. Evolução do quadro respiratório e da traqueostomia.
3. Recomendações de manejo e seguimento.`;

        return await callOpenAI(systemPrompt, userPrompt);

    } catch (error: any) {
        console.error("Error generating clinical summary:", error);
        return `**Erro na IA:** ${error.message}`;
    }
};

export const draftClinicalNotes = async (patient: Patient, lastAppointment: any | null, conditions: any): Promise<string> => {
    try {
        const lastAppointmentText = lastAppointment
            ? `Data: ${new Date(lastAppointment.date).toLocaleDateString('pt-BR')} - Obs: ${lastAppointment.notes}`
            : 'Primeira consulta.';

        const systemPrompt = `Você é um assistente médico que auxilia na redação de notas clínicas para consultas de traqueostomia infantil.`;
        const userPrompt = `Paciente: ${patient.name}
Última Consulta: ${lastAppointmentText}
Condições Atuais: ${JSON.stringify(conditions)}

Sugira uma nota clínica estruturada para a próxima consulta.`;

        return await callOpenAI(systemPrompt, userPrompt);

    } catch (error: any) {
        console.error("Error generating draft:", error);
        return `Erro ao gerar sugestão: ${error.message}`;
    }
};

export const getSurgicalHistorySummary = async (patientName: string, surgicalMaps: any[]): Promise<string> => {
    try {
        const historyText = surgicalMaps.map(map => {
            const evolutionsText = map.surgical_evolutions?.map((evo: any) =>
                `   - ${new Date(evo.created_at).toLocaleDateString('pt-BR')}: ${evo.content} (${evo.professional_name})`
            ).join('\n') || '   - Sem evoluções registradas.';

            return `DATA: ${new Date(map.surgery_date).toLocaleDateString('pt-BR')}
PROCEDIMENTO: ${map.procedure}
MÉDICOS: ${map.doctors?.join(', ')}
EVOLUÇÕES:
${evolutionsText}
----------------------------------------`;
        }).join('\n\n');

        const systemPrompt = `Você é um assistente médico especializado em análise de histórico cirúrgico pediátrico.`;
        const userPrompt = `Paciente: ${patientName}
Histórico Cirúrgico:
${historyText}

Gere uma síntese cronológica e analítica do histórico cirúrgico, destacando procedimentos, evoluções e pontos de atenção.`;

        return await callOpenAI(systemPrompt, userPrompt);

    } catch (error: any) {
        console.error("Erro na síntese cirúrgica:", error);
        return `Erro ao gerar síntese: ${error.message}`;
    }
};

export const getDashboardAnalysis = async (period: string, stats: any): Promise<string> => {
    try {
        const statsStr = JSON.stringify(stats, null, 2);

        const systemPrompt = `Você é um analista de dados clínicos especializado em gestão de saúde pública e traqueostomia infantil. Analise os dados do dashboard e gere um relatório executivo profissional em português brasileiro.`;
        const userPrompt = `**Período de Análise:** ${period}

**Dados Consolidados:**
${statsStr}

**Instruções:**
1. Analise os principais indicadores: Altas, Óbitos, Consultas Realizadas, Faltas/Cancelamentos
2. Identifique tendências mensais e padrões sazonais
3. Avalie a produtividade médica e distribuição hospitalar
4. Destaque pontos críticos e oportunidades de melhoria
5. Forneça recomendações estratégicas baseadas em dados

**Formato do Relatório:**
- Use **negrito** para destacar métricas-chave e títulos de seção
- Seja objetivo e direto
- Priorize insights acionáveis
- Mantenha tom profissional e técnico`;

        return await callOpenAI(systemPrompt, userPrompt);

    } catch (error: any) {
        console.error("Erro na análise do dashboard:", error);
        return `Erro ao gerar análise: ${error.message}`;
    }
};
