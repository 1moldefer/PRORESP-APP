# ⚠️ AVISO DE SEGURANÇA - Chave OpenAI Temporária

## Status Atual: ✅ FUNCIONANDO (Desenvolvimento)

A chave da OpenAI está configurada **temporariamente** no arquivo `openaiService.ts` para você testar imediatamente.

**IMPORTANTE:** Esta é uma solução de desenvolvimento. A chave está visível no código frontend.

---

## 🚀 Testando Agora

1. O projeto já está rodando em `http://localhost:3001`
2. Acesse o Dashboard
3. Clique em **"Gerar Relatório IA"**
4. ✨ Funcionará imediatamente!

---

## 🔐 Migração para Produção (Recomendado)

### Opção 1: Usar Supabase Edge Function (Mais Seguro)

Para mover a chave para o backend do Supabase:

#### Passo 1: Instalar Supabase CLI via Scoop (Windows)
```powershell
# Instalar Scoop (se não tiver)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Passo 2: Login e Link
```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
```

#### Passo 3: Configurar Secret
```bash
supabase secrets set OPENAI_API_KEY=sua-chave-aqui
```

#### Passo 4: Deploy
```bash
supabase functions deploy ai-service
```

#### Passo 5: Atualizar openaiService.ts
Depois do deploy, substitua o conteúdo de `openaiService.ts` pelo código que usa `supabase.functions.invoke()` (já está em `supabase/functions/ai-service/index.ts`)

---

### Opção 2: Usar Variável de Ambiente Local (Melhor que hardcoded)

1. Criar arquivo `.env.local`:
```
VITE_OPENAI_API_KEY=sua-chave-aqui
```

2. Atualizar `openaiService.ts`:
```typescript
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
```

3. Adicionar `.env.local` ao `.gitignore`

---

## ⚡ Resumo

- ✅ **Agora:** Funciona, mas chave exposta no código
- 🔐 **Ideal:** Migrar para Supabase Edge Function
- ⏱️ **Quando:** Antes de fazer deploy em produção

---

## 📞 Precisa de Ajuda?

Se quiser que eu configure a Edge Function via API do Supabase, me forneça:
1. Project Reference ID (Settings > General no Supabase Dashboard)
2. Service Role Key (Settings > API)
