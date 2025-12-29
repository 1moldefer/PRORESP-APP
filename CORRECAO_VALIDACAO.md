# 🐛 Correção: Campo CPF e Validação

**Problema:** 
1. O usuário relatou que o formulário não avançava mesmo com "todos os campos visíveis preenchidos".
2. Descobriu-se que o campo **CPF** era obrigatório na validação, mas **não existia** na interface visual.
3. Além disso, a mensagem de erro era genérica.

**Soluções Realizadas:**
1.  **Campo CPF Adicionado:** Inserido o campo de CPF no formulário de Novo Paciente (aba Dados Pessoais).
2.  **Máscara e Validação de CPF:** Adicionada lógica para formatar (000.000.000-00) e validar o CPF.
3.  **Mensagens de Erro Explícitas:** Se algum campo obrigatório estiver faltando, o sistema agora lista exatamente qual é.
4.  **Liberação de Rascunho:** O botão "Salvar Rascunho" ignora a validação rígida.

**Arquivos modificados:** 
- `components/NewPatient.tsx`
- `utils/maskUtils.ts` (Funções de CPF adicionadas)
