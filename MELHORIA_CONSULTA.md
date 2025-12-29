# 🩺 Melhorias na Atendimento Médico

**Status:** IMPLEMENTADO ✅

## Novas Funcionalidades:

### 1. Card do Paciente Rico em Detalhes
- A barra lateral agora exibe informações vitais completas:
    - **Nome Completo**
    - **Idade Calculada:** Exibe anos, meses e dias exatos (ex: "7 meses e 24 dias").
    - **Nome da Mãe:** Em destaque para fácil identificação.
    - **Cartão SUS e Contato:** Acesso rápido aos dados administrativos e de contato.
    - **Data de Nascimento:** Confirmar a idade nunca foi tão fácil.

### 2. Dados Pessoais e Admissão
- **Comportamento Padrão:** A "Ficha de Admissão Ambulatorial" agora inicia **fechada** para manter a tela limpa e focar na evolução clínica.
- **Visualização sob Demanda:** Basta clicar no cabeçalho da ficha para expandir todos os dados detalhados (gestação, comorbidades, dados pessoais extras).

### 3. Gerenciador de Documentos Avançado
- **Nova Seção:** "Documentos Anexados" (logo abaixo dos botões de receita/atestado).
- **Upload:** Permite anexar arquivos PDF e Imagens diretamente na consulta.
- **Armazenamento:** Salvo com segurança na nuvem (Supabase).
- **Ações:**
    - **Baixar:** Acesse o arquivo com um clique.
    - **Excluir:** Remova arquivos incorretos ou antigos.

## Como usar:
- Confira os dados do paciente no card lateral esquerdo assim que abrir o atendimento.
- Role até o final para anexar ou visualizar documentos.
