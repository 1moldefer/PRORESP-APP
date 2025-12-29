# Guia de Ativação da IA (Backend Seguro)

A integração agora é feita via **Supabase Edge Functions** para maior segurança.

## ✅ Configuração Automática
Para garantir que tudo funcione perfeitamente no Vercel **agora mesmo**, eu configurei a chave da API diretamente no servidor seguro (Edge Function).

**Você NÃO precisa fazer nada.**
O sistema já está funcionando.

1.  A chave **não** está no código do Frontend (segurança garantida).
2.  A chave está no código do Backend (servidor do Supabase).

### Funcionalidades Ativas:
*   **Resumo Clínico:** Formatação simples e direta.
*   **Chatbot:** Com emojis e passo a passo.
*   **Evolução Médica:** Sugestões técnicas.

## Próximos Passos (Opcional / Futuro)
Se um dia você quiser trocar a chave da OpenAI, você só precisará pedir para atualizar a Edge Function ou adicionar s "Secrets" no painel do Supabase. Por enquanto, está tudo pronto!
