import OpenAI from 'openai';
import { Patient } from "./types";

export const getClinicalSummary = async (patient: Patient, appointments: any[] = []): Promise<string> => {
    try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

        // Sort appointments by date descending
        const sortedAppointments = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastAppointment = sortedAppointments[0];
        const historyText = sortedAppointments.map(apt =>
            `- ${new Date(apt.date).toLocaleDateString('pt-BR')}: ${apt.doctors?.name || 'Médico'} (${apt.status}) - ${apt.notes || 'Sem anotações'}`
        ).join('\n');

        if (!apiKey) {
            return `**Resumo Clínico (Modo Offline - OpenAI):**
       
       **Paciente:** ${patient.name} (${patient.age})
       **Condição:** Traqueostomia ${patient.tracheostomyActive ? 'ATIVA' : 'inativa'} | Homecare ${patient.homecareActive ? 'ATIVO' : 'inativo'}
       
       **Última Consulta:** ${lastAppointment ? new Date(lastAppointment.date).toLocaleDateString('pt-BR') : 'Nenhuma registrada'}
       **Profissional:** ${lastAppointment?.doctors?.name || 'N/A'}
       
       **Histórico Recente:**
       ${historyText || "Nenhum histórico disponível."}
       
       *Nota: Configure a VITE_OPENAI_API_KEY no arquivo .env.*`;
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });

        const prompt = `PROMPT – FORMATAÇÃO DE RESUMO CLÍNICO (SEM MARKDOWN)

      Você é um assistente clínico especializado em organizar informações médicas de forma clara, ética e profissional.
      
      Gere o conteúdo em texto simples, seguindo rigorosamente estas regras:
      
      Não utilize asteriscos, hashtags, Markdown, emojis ou símbolos de destaque.
      
      Não use negrito, itálico, listas com hífen ou bullets.
      
      Use títulos em CAIXA ALTA.
      
      Separe seções com quebras de linha.
      
      Utilize frases completas, linguagem técnica acessível e tom profissional.
      
      Quando houver listas, escreva em parágrafos numerados ou em texto corrido.
      
      Quando houver tabelas, utilize o formato com colunas separadas por barras verticais ( | ).
      
      Não invente dados clínicos. Utilize apenas as informações fornecidas.
      
      Não forneça diagnóstico definitivo. As recomendações devem ser gerais e educativas.
      
      Caso existam anotações incompletas, informe de forma objetiva que não há dados suficientes para análise detalhada.
      
      Estruture a resposta obrigatoriamente nas seguintes seções, quando aplicável:
      
      RESUMO CLÍNICO
      DADOS DO PACIENTE
      HISTÓRICO DE CONSULTAS
      ANÁLISE (Resumo da última consulta e parecer clínico; Frequência de acompanhamento e adesão; Recomendações gerais de cuidado; Sinais de alerta)
      
      O texto deve ser claro, organizado, seguro para uso em contexto de saúde e adequado para leitura por familiares, cuidadores e profissionais.

      DADOS DO PACIENTE:
      Nome: ${patient.name}
      Idade: ${patient.age}
      Traqueostomia: ${patient.tracheostomyActive ? 'Sim' : 'Não'}
      Homecare: ${patient.homecareActive ? 'Sim' : 'Não'}
      
      HISTÓRICO DE CONSULTAS (Do mais recente para o antigo):
      ${historyText}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Você é um assistente médico especialista." },
                { role: "user", content: prompt }
            ],
        });

        return response.choices[0].message.content || "Não foi possível gerar a resposta.";

    } catch (error: any) {
        console.error("Error generating clinical summary:", error);
        return `**Erro de Conexão com OpenAI.**
    
    Erro: ${error.message}
    
    **Dados visíveis:**
    Paciente: ${patient.name}
    Total de Consultas: ${appointments.length}`;
    }
};

export const draftClinicalNotes = async (patient: Patient, lastAppointment: any | null, conditions: any): Promise<string> => {
    try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

        if (!apiKey) {
            return "Para utilizar a sugestão de IA, configure a VITE_OPENAI_API_KEY no arquivo .env e REINICIE o servidor.";
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });

        const prompt = `Atue como um Médico Pneumologista Pediátrico experiente.
    Escreva um modelo de Evolução Clínica (Parecer) para um atendimento ambulatorial, baseado nos dados abaixo.
    O texto deve ser técnico, formal, mas claro. Deixe espaços [...] para o médico preencher dados variáveis do exame físico atual.

    PACIENTE: ${patient.name} (${patient.age} anos)
    CONDIÇÕES:
    - Traqueostomia: ${conditions?.tracheostomy ? 'Sim' : 'Não'}
    - Homecare: ${conditions?.homecare ? 'Sim' : 'Não'}
    - Cidade: ${conditions?.city || 'Não informada'}

    ÚLTIMO ATENDIMENTO (${lastAppointment ? new Date(lastAppointment.date).toLocaleDateString('pt-BR') : 'Nenhum'}):
    ${lastAppointment ? `Obs: ${lastAppointment.notes}` : 'Primeira consulta.'}

    Gere o texto da evolução sugerida:`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Você é um médico especialista." },
                { role: "user", content: prompt }
            ],
        });

        return response.choices[0].message.content || "Sem resposta da IA.";

    } catch (error: any) {
        console.error("Error generating draft:", error);
        return `Erro ao gerar sugestão: ${error.message}`;
    }
};

export const getSurgicalHistorySummary = async (patientName: string, surgicalMaps: any[]): Promise<string> => {
    try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

        if (!apiKey) return "**API Key da OpenAI não configurada.**";

        const openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });

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

        const prompt = `Você é um Consultor Médico Especialista.
    Analise o Histórico Cirúrgico e as Evoluções do paciente ${patientName}.
    
    HISTÓRICO:
    ${historyText}
    
    Gere uma SÍNTESE CLÍNICA objetiva contendo:
    1. Resumo cronológico dos procedimentos realizados.
    2. Análise da evolução pós-operatória (baseado nas notas de evolução).
    3. Pontos de atenção ou complicações recorrentes (se houver).
    4. Conclusão sobre o estado atual relacionado às cirurgias.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o", // or gpt-3.5-turbo if preferred
            messages: [
                { role: 'system', content: 'Você é um assistente médico especialista em síntese de prontuários.' },
                { role: 'user', content: prompt }
            ],
        });

        return response.choices[0]?.message?.content || "Não foi possível gerar a síntese.";

    } catch (error: any) {
        console.error("Erro na síntese cirúrgica:", error);
        return `Erro ao gerar síntese: ${error.message}`;
    }
};
