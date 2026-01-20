# Plano de Evolução: Odonto GPT como Tutor Inteligente (ZPD & Memória Global)

Este plano define a transformação do **Odonto GPT** de um "orquestrador de tarefas" para um **Tutor Inteligente** baseado em conceitos de **ZPD (Zona de Desenvolvimento Proximal)** e **Scaffolding**.

## 1. Visão Geral
*   **Fim do Orquestrador**: O "Odonto Flow" deixa de existir como intermediário.
*   **Odonto GPT (Chat Central)**: Torna-se um mentor onisciente. Ele não "chama" outros agentes para executar tarefas na frente do usuário. Ele conversa, ensina, tira dúvidas e usa o histórico do usuário (artefatos criados nas outras abas) para contextualizar o aprendizado.
*   **Agentes Especialistas (Outras Abas)**: Permanecem como ferramentas de execução pura (fazer o resumo, analisar a imagem, criar o simulado) em suas respectivas interfaces.

## 2. Pilares da Nova Arquitetura

### A. O "Cérebro" (Memória e Contexto)
O Odonto GPT deve ter acesso de leitura a todo o ecossistema do usuário no Supabase.
1.  **Memória de Curto Prazo**: O que foi conversado na sessão atual.
2.  **Memória de Longo Prazo**: Resumo das sessões anteriores (via vetorização/embeddings).
3.  **Consciência do Ecossistema (Meta-Contexto)**:
    *   *Ferramenta*: `get_user_recent_artifacts(user_id)`
    *   *Cenário*: "Vi que você criou um flashcard sobre Endodontia ontem no Odonto Practice. Quer revisar esse tema?"
    *   *Ferramenta*: `get_user_profile(user_id)` (Semestre, especialidade, dificuldades).

### B. O Motor Pedagógico (ZPD & Scaffolding)
As instruções do Odonto GPT serão reescritas para implementar comportamento de **Tutoria Inteligente**:
*   **Diagnóstico**: Identificar o nível atual do aluno através das perguntas.
*   **Scaffolding**: Em vez de dar a resposta, dar "dicas" ou suporte para que o aluno chegue à resposta (Socratic Method).
*   **Feedback Imediato**: Corrigir conceitos errados gentilmente e reforçar acertos.
*   **Personalidade**: "Mentor sênior", bem-humorado, empático ("Sei que Periodontia assusta, mas vamos lá...").

## 3. Estrutura Técnica (Backend Agno)

### 1. Refatoração do `odonto_gpt_agent.py`
*   **Remover**: Lógica de `Team` ou delegação direta.
*   **Adicionar Tools de Leitura**:
    *   `read_knowledge_base`: Acesso ao RAG (artigos, livros).
    *   `read_user_history`: Acesso às tabelas de `artifacts`, `sessions` e `profiles`.
*   **System Prompt (Pedagógico)**:
    > "Você é um Tutor Inteligente. Seu objetivo não é apenas responder, mas fazer o aluno pensar. Use a Zona de Desenvolvimento Proximal: identifique o que ele quase sabe e dê o empurrãozinho que falta."

### 2. RAG Otimizado
*   O Odonto GPT deve consultar a base de conhecimento (vetorial) para embasar suas explicações, mas traduzindo para uma linguagem didática.

## 4. Interface (Frontend Next.js)

### 1. Dashboard `/dashboard/chat`
*   Exclusivo para o **Odonto GPT**.
*   Remover seletor de agentes (ou mantê-lo apenas como "botão de pânico" para mudar de contexto, mas o padrão é o GPT).
*   Sidebar Lateral: Mostrar "Contexto Ativo" (ex: "Baseado no seu último resumo de Prótese...").

### 2. Abas Especialistas (`/dashboard/resumos`, `/imagens`, etc.)
*   Cada aba instancia diretamente o agente especialista (Research, Vision, etc.).
*   Não há "chat" genérico nessas abas, apenas a interface focada na tarefa (input -> output).

## 5. Plano de Execução

### Fase 1: Backend - O Mentor Onisciente
1.  Criar ferramentas Python (`app/tools/memory.py`) para buscar artefatos e histórico do usuário no Supabase.
2.  Reescrever `odonto_gpt_agent.py` com o novo System Prompt focado em ZPD e Tutoria.
3.  Configurar RAG para ser invocado automaticamente quando houver dúvida técnica.

### Fase 2: Frontend - Simplificação
1.  Limpar o `AgentSelector` no Chat Principal (foco total no GPT).
2.  Garantir que as outras abas chamem os endpoints específicos (`/agentes/odonto-research`, etc.).

### Fase 3: Teste de Personalidade e Contexto
1.  Simular um usuário que criou um resumo de "Cárie".
2.  Ir ao chat e perguntar "O que eu estudei ontem?".
3.  Verificar se o Odonto GPT responde: "Você focou em Cárie e gerou um resumo. Quer fazer um quiz sobre isso?"

## 6. Exemplo de Interação (Target)
> **Aluno**: "Tenho dúvida na técnica de Clark."
> **Odonto GPT**: "Ótima pergunta! A técnica de Clark é fundamental para localização. Lembra da regra do 'MRO'? O que acontece com o objeto quando você move o tubo para a mesial?" (Scaffolding - não deu a resposta, estimulou o raciocínio).
