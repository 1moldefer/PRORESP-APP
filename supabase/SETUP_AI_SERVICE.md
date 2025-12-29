# Configuração da Edge Function AI Service

## Passo 1: Instalar Supabase CLI (se ainda não tiver)

```bash
npm install -g supabase
```

## Passo 2: Login no Supabase

```bash
supabase login
```

## Passo 3: Linkar seu projeto

```bash
supabase link --project-ref SEU_PROJECT_REF
```

Para encontrar o `SEU_PROJECT_REF`:
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings > General
4. Copie o "Reference ID"

## Passo 4: Configurar a chave da OpenAI como variável de ambiente

```bash
supabase secrets set OPENAI_API_KEY=sua-chave-aqui
```

## Passo 5: Deploy da função

```bash
supabase functions deploy ai-service
```

## Verificação

Após o deploy, a função estará disponível em:
`https://SEU_PROJECT_REF.supabase.co/functions/v1/ai-service`

## Testando localmente (opcional)

Para testar a função localmente antes do deploy:

```bash
# Criar arquivo .env local
echo "OPENAI_API_KEY=sua-chave-aqui" > supabase/.env

# Servir localmente
supabase functions serve ai-service --env-file supabase/.env
```

## Segurança

✅ A chave da OpenAI está armazenada como secret no Supabase
✅ Nunca é exposta no código frontend
✅ Apenas o backend tem acesso à chave
✅ CORS configurado para aceitar requisições do seu app

## Troubleshooting

Se encontrar erro "Edge Function returned a non-2xx status code":
1. Verifique se a variável OPENAI_API_KEY foi configurada corretamente
2. Verifique os logs da função: `supabase functions logs ai-service`
3. Teste a chave da OpenAI diretamente em https://platform.openai.com/api-keys
