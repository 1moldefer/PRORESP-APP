# 📋 Melhorias na Ficha do Paciente

**Status:** IMPLEMENTADO ✅

## Atualizações de Design:
1.  **Card "Total" Removido:** A exibição redundante do tempo total ("6d") foi removida, mantendo apenas a contagem detalhada de Anos, Meses e Dias.
2.  **Limpeza de Texto:** Removida a string de tempo duplicada abaixo da data de admissão.

## Edição de Hospital de Origem:
- **Seleção Padronizada:** O campo agora é um **Dropdown** alimentado pela lista oficial de "Locais" cadastrados no sistema.
- **Visualização Inteligente:** Exibe o texto de forma limpa (modo leitura) e vira um seletor ao clicar para editar.
- **Legado Suportado:** Se o paciente já tiver um hospital que não está na lista, ele continua aparecendo e pode ser selecionado.
- **Como Editar:** Clique no nome do hospital ou no ícone de lápis e escolha a nova opção na lista. A lista abre automaticamente.
