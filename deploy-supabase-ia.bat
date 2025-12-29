@echo off
echo ========================================
echo  Deploy da IA no Supabase (Edge Function)
echo ========================================
echo.
echo Este script vai fazer o deploy automatico da funcao de IA.
echo.
echo Pre-requisitos:
echo - Supabase CLI instalado
echo - Projeto linkado (supabase link)
echo.
pause

echo.
echo [1/3] Configurando a chave da OpenAI no backend...
npx supabase secrets set OPENAI_API_KEY=sua-chave-aqui

echo.
echo [2/3] Fazendo deploy da funcao ai-service...
npx supabase functions deploy ai-service

echo.
echo [3/3] Testando a funcao...
curl https://qhycrmwizbavnicjgoqq.supabase.co/functions/v1/ai-service

echo.
echo ========================================
echo  Deploy Concluido!
echo ========================================
echo.
echo A IA agora esta rodando no backend seguro do Supabase.
echo Nenhuma chave exposta no frontend!
echo.
pause
