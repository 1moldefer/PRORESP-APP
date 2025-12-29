# 🏥 Melhoria na Exibição de Evolução Ambulatorial

**Status:** IMPLEMENTADO ✅

## O que foi feito:
Substituímos o campo simples de "Parecer" nos cards de histórico por uma **seção completa de Evolução Ambulatorial**.

Agora, ao visualizar uma consulta no histórico do paciente, você verá os seguintes campos detalhados:

1.  **Diagnóstico:** Destaque em roxo, com texto formatado.
2.  **Plano Terapêutico:** Destaque em verde, com texto formatado.
3.  **Observações/Parecer:** Texto em itálico para notas gerais.
4.  **Peso:** Badge discreto mostrando o peso registrado na consulta.
5.  **Alerta de Isolamento:** Badge vermelho se o paciente foi marcado para isolamento.
6.  **Responsável:** Quem salvou e quando, no rodapé.

## Benefícios:
- **Resumo Clínico Completo:** O médico pode ver rapidamente o que foi decidido nas consultas anteriores sem precisar clicar em "Acessar".
- **Visual Organizado:** Separação clara entre diagnóstico, conduta e observações.
- **Alertas Visíveis:** O isolamento e peso ganharam destaque visual.

---
**Como testar:**
1. Finalize uma consulta preenchendo os campos de Evolução (Diagnóstico, Plano, etc).
2. Vá para a tela de Detalhes do Paciente.
3. Veja o card da consulta "Realizada". Ele deve mostrar a nova seção "Evolução Ambulatorial" com os dados preenchidos.
