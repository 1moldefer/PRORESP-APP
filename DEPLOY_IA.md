# 🚀 Deploy Rápido da IA - ProResp

## ⚡ Comandos Rápidos

### 1️⃣ Instalar Supabase CLI
```bash
npm install -g supabase
```

### 2️⃣ Login
```bash
npm run supabase:login
```

### 3️⃣ Linkar Projeto
```bash
npm run supabase:link
```
**Você precisará do Project Reference ID do seu projeto Supabase**

### 4️⃣ Configurar Chave OpenAI
```bash
supabase secrets set OPENAI_API_KEY=sua-chave-aqui
```

### 5️⃣ Deploy
```bash
npm run supabase:deploy
```

## ✅ Pronto!

Após o deploy, a função de IA estará funcionando e você poderá:
- ✨ Gerar relatórios do dashboard com IA
- 📋 Criar resumos clínicos
- 🏥 Analisar históricos cirúrgicos
- 📝 Sugerir notas de consulta

## 🔍 Verificar Logs (se houver erro)
```bash
npm run supabase:logs
```

## 🛡️ Segurança
✅ Chave da OpenAI protegida no backend  
✅ Nunca exposta no código frontend  
✅ Armazenada como secret criptografado no Supabase
