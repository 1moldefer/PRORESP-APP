# 🚀 Deploy da IA no Supabase (Edge Function)

## Status Atual
✅ **Desenvolvimento Local**: Funcionando (usando .env.local)  
⏳ **Produção**: Aguardando deploy da Edge Function

---

## Como Fazer o Deploy (Uma Vez)

### 1️⃣ Instalar Supabase CLI

**Windows (PowerShell como Administrador):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Ou via npm:**
```bash
npm install -g supabase
```

### 2️⃣ Login no Supabase
```bash
supabase login
```

### 3️⃣ Linkar seu Projeto
```bash
supabase link --project-ref qhycrmwizbavnicjgoqq
```
> Se pedir a senha do banco, pegue em: Supabase Dashboard > Settings > Database > Password

### 4️⃣ Configurar a Chave da OpenAI (SEGURA - Backend)
```bash
supabase secrets set OPENAI_API_KEY=sua-chave-openai-aqui
```

### 5️⃣ Deploy da Função
```bash
supabase functions deploy ai-service
```

---

## ✅ Pronto!

Após o deploy:
- **Localhost**: Continua usando .env.local (dev mode)
- **Produção (Vercel/Netlify)**: Usa automaticamente a Edge Function segura

Nenhuma configuração adicional necessária no frontend! 🎉

---

## Verificar se funcionou

Acesse: `https://qhycrmwizbavnicjgoqq.supabase.co/functions/v1/ai-service`

Deve retornar: `{"error":"Missing systemPrompt or userPrompt"}` (isso é bom, significa que a função está ON)

---

## Troubleshooting

**Erro: "JWT expired"**
```bash
supabase login
```

**Erro: "Function not found"**
- Verifique se rodou `supabase functions deploy ai-service`
- Verifique se a pasta `supabase/functions/ai-service` existe

**Erro: "OpenAI API key not configured"**
```bash
supabase secrets set OPENAI_API_KEY=sua-chave-real
```
