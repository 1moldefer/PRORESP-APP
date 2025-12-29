# 🎂 Exibição Dinâmica de Idade Formatada

**Status:** IMPLEMENTADO ✅

## O que foi feito:
Atualizamos a forma como a idade é exibida no sistema para ser mais precisa e dinâmica, baseada **exclusivamente na data de nascimento** e na data atual.

Criamos uma nova função de cálculo `calculateAge` que formata a idade seguindo a regra:
1.  **Crianças maiores de 1 ano:** Exibe "X anos e Y meses".
2.  **Bebês (menos de 1 ano):** Exibe "X meses e Y dias".
3.  **Recém-nascidos (menos de 1 mês):** Exibe "X dias".

## Onde foi aplicado:
1.  **Lista de Pacientes:** Na coluna de paciente, abaixo do nome.
2.  **Ficha do Paciente:** No card de informações pessoais (cabeçalho).

## Benefícios:
- **Precisão:** A idade muda automaticamente dia a dia.
- **Detalhamento:** Muito importante para pediatria, onde a diferença entre "1 mês" e "1 mês e 20 dias" é relevante.
- **Padronização:** Todas as telas usam a mesma lógica de cálculo.

---
**Como testar:**
1. Vá para a Lista de Pacientes.
2. Veja que a idade agora mostra detalhes (ex: "2 anos e 3 meses").
3. Abra a ficha e veja a mesma informação no topo.
