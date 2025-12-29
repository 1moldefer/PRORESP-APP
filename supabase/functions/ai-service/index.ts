import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

Deno.serve(async (req: Request) => {
    // CORS headers
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        });
    }

    try {
        const body = await req.json();

        if (!OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
        }

        let systemPrompt = '';
        let userPrompt = '';

        // Support both direct format (systemPrompt, userPrompt) and action-based format
        if (body.systemPrompt && body.userPrompt) {
            // Direct format from openaiService.ts
            systemPrompt = body.systemPrompt;
            userPrompt = body.userPrompt;
        } else if (body.action && body.payload) {
            // Action-based format (legacy support)
            const { action, payload } = body;

            switch (action) {
                case 'summary':
                    systemPrompt = `Você é um assistente médico especializado em traqueostomia infantil. Analise o histórico clínico e gere um resumo executivo profissional em português brasileiro.`;
                    userPrompt = `Paciente: ${payload.patient.name}
Idade: ${payload.patient.age || 'N/A'}
Histórico de Consultas:
${payload.historyText}

Gere um resumo clínico estruturado destacando: diagnósticos principais, evolução do quadro, e recomendações atuais.`;
                    break;

                case 'draft':
                    systemPrompt = `Você é um assistente médico que auxilia na redação de notas clínicas para consultas de traqueostomia infantil.`;
                    userPrompt = `Paciente: ${payload.patient.name}
Última Consulta: ${payload.lastAppointmentText}
Condições Atuais: ${JSON.stringify(payload.conditions)}

Sugira uma nota clínica estruturada para a próxima consulta.`;
                    break;

                case 'surgical-summary':
                    systemPrompt = `Você é um assistente médico especializado em análise de histórico cirúrgico pediátrico.`;
                    userPrompt = `Paciente: ${payload.patientName}
Histórico Cirúrgico:
${payload.historyText}

Gere uma síntese cronológica e analítica do histórico cirúrgico, destacando procedimentos, evoluções e pontos de atenção.`;
                    break;

                case 'dashboard-analysis':
                    systemPrompt = `Você é um analista de dados clínicos especializado em gestão de saúde pública e traqueostomia infantil. Analise os dados do dashboard e gere um relatório executivo profissional em português brasileiro.`;
                    userPrompt = `**Período de Análise:** ${payload.period}

**Dados Consolidados:**
${payload.stats}

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
                    break;

                default:
                    throw new Error('Invalid action');
            }
        } else {
            throw new Error('Missing systemPrompt/userPrompt or action/payload');
        }

        // Call OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
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

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const openaiData = await openaiResponse.json();
        const content = openaiData.choices[0]?.message?.content || 'Sem resposta da IA.';

        return new Response(
            JSON.stringify({ content }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );

    } catch (error) {
        console.error('Error in ai-service:', error);
        return new Response(
            JSON.stringify({
                error: error.message,
                result: `Erro ao processar solicitação: ${error.message}`
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
});
