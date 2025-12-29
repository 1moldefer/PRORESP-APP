# ✝️ Registro de Óbito e Visualização

**Status:** IMPLEMENTADO COMPLETO ✅

## Funcionalidades Novas:

### 1. Registro de Óbito na Alta
- **Modal de Alta Melhorado:** Adicionada opção checkbox "Alta por Óbito".
- **Comportamento:** Ao marcar, o modal e o botão de confirmação mudam visualmente para indicar a ação de registro de óbito.
- **Dados:** Salva a data, o motivo e marca o paciente como falecido no sistema.

### 2. Identificação Visual na Ficha (Perfil)
- O card de status do paciente muda drasticamente:
    - **Alta Comum:** Card Rosa/Vermelho ("Paciente com Alta do Projeto").
    - **Óbito:** Card Preto/Cinza ("Paciente em Óbito"), com ícone específico.

### 3. Identificação Visual na Lista (Pesquisa)
- Pacientes falecidos agora possuem um **selo preto "Óbito"** ao lado do nome na listagem principal.
- Isso facilita a identificação rápida sem precisar abrir a ficha.

---
**Como testar:**
1. Dê alta em um paciente marcando "Alta por Óbito".
2. Vá para a Lista de Pacientes (Pesquisar).
3. Veja o selo "ÓBITO" ao lado do nome do paciente.
4. Abra o perfil e veja o card de status cinza.
