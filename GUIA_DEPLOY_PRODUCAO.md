# 🎯 Guia de Deploy - Edge Function AI Service

## ✅ Status Atual
**Sua IA já está FUNCIONANDO!** 🎉  
A chave está configurada e você pode usar todas as funcionalidades de IA agora mesmo.

---

## 🔐 Para Produção (Opcional - Faça quando for publicar)

### Passo 1: Instalar Supabase CLI

Abra o **PowerShell como Administrador** e execute:

```powershell
# Instalar Scoop (gerenciador de pacotes)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Passo 2: Login no Supabase

```bash
supabase login
```

Isso abrirá seu navegador para autenticação.

### Passo 3: Linkar seu Projeto

```bash
supabase link --project-ref qhycrmwizbavnicjgoqq
```

### Passo 4: Configurar Chave OpenAI (Segura)

```bash
supabase secrets set OPENAI_API_KEY=sua-chave-aqui
```

### Passo 5: Deploy da Função

```bash
supabase functions deploy ai-service
```

### Passo 6: Atualizar o Código Frontend

Depois do deploy bem-sucedido, substitua o conteúdo de `openaiService.ts` por:

```typescript
import { supabase } from "./supabaseClient";
import { Patient } from "./types";

export const getClinicalSummary = async (patient: Patient, appointments: any[] = []): Promise<string> => {
    try {
        const sortedAppointments = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const historyText = sortedAppointments.map(apt => {
            let detail = `- ${new Date(apt.date).toLocaleDateString('pt-BR')}: ${apt.doctors?.name || 'Médico'} (${apt.status})`;
            if (apt.diagnosis) detail += `\n  - Diagnóstico: ${apt.diagnosis}`;
            if (apt.therapeutic_plan) detail += `\n  - Plano: ${apt.therapeutic_plan}`;
            if (apt.weight) detail += `\n  - Peso: ${apt.weight}`;
            if (apt.notes) detail += `\n  - Observações: ${apt.notes}`;
            return detail;
        }).join('\n');

        const { data, error } = await supabase.functions.invoke('ai-service', {
            body: {
                action: 'summary',
                payload: { patient, historyText }
            }
        });

        if (error) throw new Error(error.message);
        return data.result || "Sem resposta da IA.";

    } catch (error: any) {
        console.error("Error:", error);
        return `**Erro:** ${error.message}`;
    }
};

export const draftClinicalNotes = async (patient: Patient, lastAppointment: any | null, conditions: any): Promise<string> => {
    try {
        const lastAppointmentText = lastAppointment
            ? `Data: ${new Date(lastAppointment.date).toLocaleDateString('pt-BR')} - Obs: ${lastAppointment.notes}`
            : 'Primeira consulta.';

        const { data, error } = await supabase.functions.invoke('ai-service', {
            body: {
                action: 'draft',
                payload: { patient, lastAppointmentText, conditions }
            }
        });

        if (error) throw new Error(error.message);
        return data.result || "Sem resposta da IA.";

    } catch (error: any) {
        console.error("Error:", error);
        return `Erro: ${error.message}`;
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

        const { data, error } = await supabase.functions.invoke('ai-service', {
            body: {
                action: 'surgical-summary',
                payload: { patientName, historyText }
            }
        });

        if (error) throw new Error(error.message);
        return data.result || "Sem resposta.";

    } catch (error: any) {
        console.error("Erro:", error);
        return `Erro: ${error.message}`;
    }
};

export const getDashboardAnalysis = async (period: string, stats: any): Promise<string> => {
    try {
        const statsStr = JSON.stringify(stats, null, 2);

        const { data, error } = await supabase.functions.invoke('ai-service', {
            body: {
                action: 'dashboard-analysis',
                payload: { period, stats: statsStr }
            }
        });

        if (error) throw new Error(error.message);
        return data.result || "Sem resposta da IA.";

    } catch (error: any) {
        console.error("Erro:", error);
        return `Erro: ${error.message}`;
    }
};
```

---

## 📊 Resumo

| Item | Status Atual | Status Produção |
|------|--------------|-----------------|
| **Funcionalidade** | ✅ Funcionando | ✅ Funcionando |
| **Segurança** | ⚠️ Chave no frontend | ✅ Chave no backend |
| **Quando fazer** | ✅ Agora (desenvolvimento) | 🔜 Antes de publicar |

---

## 🎯 Recomendação

**Para desenvolvimento/testes:** Continue usando como está! Está funcionando perfeitamente.

**Para produção:** Siga os passos acima antes de fazer deploy público do seu app.

---

## 🆘 Precisa de Ajuda?

Se encontrar algum erro durante o deploy, me avise e eu te ajudo! 😊
