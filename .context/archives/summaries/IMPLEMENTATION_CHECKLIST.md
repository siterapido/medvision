# ✅ Checklist de Implementação - Odonto GPT Conversacional

## 📋 Fase 1: Planejamento e Arquitetura (2-3 dias)

### Análise da Arquitetura Atual
- [ ] Revisar `lib/ai/agents/config.ts` completamente
- [ ] Mapear todos os agentes existentes e suas dependências
- [ ] Listar todas as ferramentas (tools) em `lib/ai/tools/definitions.ts`
- [ ] Identificar componentes que dependem de múltiplos agentes
- [ ] Documentar fluxo atual de geração de artefatos

### Design da Nova Arquitetura
- [ ] Criar diagrama de arquitetura simplificada
- [ ] Especificar interface do agente único `odonto-gpt`
- [ ] Definir estrutura de ferramentas mantidas
- [ ] Planejar sistema de memória contextual
- [ ] Documentar fluxo de conversação pedagógica

### Técnicas Pedagógicas
- [ ] Documentar implementação do Método Socrático
- [ ] Criar exemplos de perguntas guiadas
- [ ] Especificar níveis de scaffolding
- [ ] Definir critérios de adaptação ZPD
- [ ] Criar padrões de feedback imediato

### Integração com Bases de Conhecimento
- [ ] Documentar quando usar `askPerplexity`
- [ ] Documentar quando usar `searchPubMed`
- [ ] Definir formato de apresentação de fontes
- [ ] Criar exemplos de consultas eficazes
- [ ] Planejar cache de consultas frequentes

---

## 🔧 Fase 2: Refatoração do Backend (3-4 dias)

### Atualizar Configuração de Agentes
**Arquivo**: `lib/ai/agents/config.ts`

- [ ] Remover configuração de `odonto-research`
- [ ] Remover configuração de `odonto-summary`
- [ ] Remover configuração de `odonto-practice`
- [ ] Remover configuração de `odonto-vision`
- [ ] Remover configuração de `odonto-write`
- [ ] Manter apenas `odonto-gpt`
- [ ] Atualizar exportação de `AGENT_CONFIGS`
- [ ] Verificar se não há referências aos agentes removidos

### Refatorar Ferramentas (Tools)
**Arquivo**: `lib/ai/tools/definitions.ts`

#### Ferramentas a Manter
- [ ] Verificar `askPerplexity` está funcionando
- [ ] Verificar `searchPubMed` está funcionando
- [ ] Verificar `updateUserProfile` está funcionando
- [ ] Testar cada ferramenta individualmente

#### Ferramentas a Remover
- [ ] Remover `saveSummary`
- [ ] Remover `saveFlashcards`
- [ ] Remover `saveMindMap`
- [ ] Remover `savePracticeExam`
- [ ] Remover `saveResearch`
- [ ] Remover `saveImageAnalysis`
- [ ] Remover imports não utilizados
- [ ] Limpar tipos TypeScript relacionados

### Reescrever System Prompt
**Arquivo**: `lib/ai/agents/config.ts` (dentro de `odonto-gpt`)

- [ ] Adicionar seção "IDENTIDADE" clara
- [ ] Adicionar seção "MISSÃO"
- [ ] Implementar instruções do Método Socrático
- [ ] Implementar instruções de Scaffolding
- [ ] Implementar instruções de ZPD
- [ ] Implementar instruções de Feedback Imediato
- [ ] Adicionar instruções de consulta a bases
- [ ] Adicionar instruções de perfil de usuário
- [ ] Definir tom e estilo conversacional
- [ ] Listar explicitamente o que NÃO fazer
- [ ] Listar explicitamente o que FAZER
- [ ] Revisar e otimizar tamanho do prompt

### Simplificar API de Chat
**Arquivo**: `app/api/newchat/route.ts`

- [ ] Remover lógica de seleção de agentes
- [ ] Sempre usar `odonto-gpt` como padrão
- [ ] Remover parâmetro `agentId` da requisição
- [ ] Simplificar validação de entrada
- [ ] Otimizar configuração de streaming
- [ ] Adicionar logs de debug
- [ ] Testar endpoint com Postman/curl

---

## 🎨 Fase 3: Otimização do Frontend (2-3 dias)

### Remover Seletor de Agentes
**Arquivo**: `components/dashboard/odonto-ai-chat.tsx`

- [ ] Remover import de `AgentSelector`
- [ ] Remover estado `selectedAgent`
- [ ] Remover `setSelectedAgent`
- [ ] Remover componente `<AgentSelector />` do JSX
- [ ] Simplificar header do chat
- [ ] Remover lógica de mudança de agente
- [ ] Atualizar tipos TypeScript

### Otimizar Interface de Conversação

#### Área de Mensagens
- [ ] Melhorar espaçamento entre mensagens
- [ ] Otimizar tipografia para leitura
- [ ] Adicionar animações suaves de entrada
- [ ] Implementar typing indicators
- [ ] Melhorar scroll automático

#### Indicadores de Consulta
- [ ] Criar badge "Consultando Perplexity..."
- [ ] Criar badge "Buscando no PubMed..."
- [ ] Adicionar animação de loading
- [ ] Posicionar indicadores de forma não intrusiva
- [ ] Testar em diferentes tamanhos de tela

#### Feedback Visual
- [ ] Melhorar indicador de "pensando"
- [ ] Adicionar feedback de envio de mensagem
- [ ] Implementar indicador de erro
- [ ] Adicionar transições suaves

### Atualizar Sugestões Iniciais
**Arquivo**: `components/dashboard/odonto-ai-chat.tsx`

- [ ] Substituir sugestões antigas
- [ ] Adicionar: "Me ajude a entender a anatomia do primeiro molar superior"
- [ ] Adicionar: "Quais são os princípios básicos de preparo cavitário?"
- [ ] Adicionar: "Explique como funciona a anestesia local"
- [ ] Adicionar: "Tire minhas dúvidas sobre tratamento endodôntico"
- [ ] Testar clique nas sugestões

### Implementar Indicadores de Fonte

- [ ] Criar componente `SourceBadge`
- [ ] Detectar quando GPT consultou Perplexity
- [ ] Detectar quando GPT consultou PubMed
- [ ] Exibir badge próximo à mensagem
- [ ] Permitir expandir para ver detalhes
- [ ] Adicionar links para fontes (se disponível)
- [ ] Estilizar de forma consistente

### Remover Funcionalidades de Artefatos

- [ ] Remover botões de "Criar Resumo"
- [ ] Remover botões de "Gerar Flashcards"
- [ ] Remover botões de "Criar Mapa Mental"
- [ ] Remover botões de "Gerar Simulado"
- [ ] Remover prop `onArtifactCreated`
- [ ] Remover callbacks relacionados
- [ ] Limpar imports não utilizados
- [ ] Atualizar tipos TypeScript

---

## 🎓 Fase 4: Implementação de Técnicas Pedagógicas (3-4 dias)

### Implementar Método Socrático

#### No System Prompt
- [ ] Adicionar instrução: "Faça perguntas antes de dar respostas"
- [ ] Adicionar instrução: "Estimule raciocínio crítico"
- [ ] Adicionar instrução: "Valide compreensão progressivamente"
- [ ] Adicionar exemplos de perguntas guiadas
- [ ] Adicionar contra-exemplos (o que NÃO fazer)

#### Testes
- [ ] Testar com pergunta simples
- [ ] Testar com pergunta complexa
- [ ] Verificar se GPT faz perguntas antes de responder
- [ ] Verificar qualidade das perguntas guiadas
- [ ] Ajustar prompt conforme necessário

### Implementar Scaffolding Progressivo

#### No System Prompt
- [ ] Adicionar instrução: "Começar com fundamentos"
- [ ] Adicionar instrução: "Aumentar complexidade gradualmente"
- [ ] Adicionar instrução: "Verificar compreensão antes de avançar"
- [ ] Adicionar instrução: "Retornar a conceitos básicos se necessário"
- [ ] Adicionar exemplos de progressão

#### Testes
- [ ] Testar com aluno iniciante
- [ ] Testar com aluno avançado
- [ ] Verificar progressão gradual
- [ ] Verificar retorno a fundamentos quando necessário
- [ ] Ajustar prompt conforme necessário

### Implementar Zona de Desenvolvimento Proximal (ZPD)

#### Atualizar `updateUserProfile`
- [ ] Garantir salvamento de `semestre`
- [ ] Garantir salvamento de `universidade`
- [ ] Garantir salvamento de `especialidade`
- [ ] Garantir salvamento de `topicos_estudados`
- [ ] Garantir salvamento de `nivel_conhecimento`

#### No System Prompt
- [ ] Adicionar instrução: "Perguntar semestre/universidade casualmente"
- [ ] Adicionar instrução: "Usar perfil para calibrar explicações"
- [ ] Adicionar instrução: "Adaptar linguagem ao nível"
- [ ] Adicionar instrução: "Desafiar sem frustrar"
- [ ] Adicionar exemplos de adaptação por nível

#### Testes
- [ ] Testar com perfil de 1º semestre
- [ ] Testar com perfil de 5º semestre
- [ ] Testar com perfil de residente
- [ ] Verificar adaptação de linguagem
- [ ] Verificar adaptação de profundidade
- [ ] Ajustar prompt conforme necessário

### Implementar Consulta Proativa a Bases

#### No System Prompt
- [ ] Adicionar instrução: "Usar askPerplexity para contexto geral"
- [ ] Adicionar instrução: "Usar searchPubMed para evidências"
- [ ] Adicionar instrução: "Citar fontes naturalmente"
- [ ] Adicionar instrução: "Não quebrar fluxo conversacional"
- [ ] Adicionar exemplos de citação

#### Testes
- [ ] Testar pergunta que requer contexto geral
- [ ] Testar pergunta que requer evidências
- [ ] Verificar se GPT consulta bases apropriadamente
- [ ] Verificar citação de fontes
- [ ] Verificar fluxo conversacional
- [ ] Ajustar prompt conforme necessário

### Implementar Feedback Imediato

#### No System Prompt
- [ ] Adicionar instrução: "Validar respostas do aluno"
- [ ] Adicionar instrução: "Corrigir com gentileza"
- [ ] Adicionar instrução: "Reforçar acertos"
- [ ] Adicionar instrução: "Explicar o porquê dos erros"
- [ ] Adicionar exemplos de feedback

#### Testes
- [ ] Testar com resposta correta do aluno
- [ ] Testar com resposta parcialmente correta
- [ ] Testar com resposta incorreta
- [ ] Verificar tom encorajador
- [ ] Verificar explicação clara
- [ ] Ajustar prompt conforme necessário

---

## 🧪 Fase 5: Testes e Refinamento (2-3 dias)

### Testes de Conversação

#### Cenários de Teste
- [ ] Criar cenário: Estudante 1º semestre (iniciante)
- [ ] Criar cenário: Estudante 3º semestre (intermediário)
- [ ] Criar cenário: Estudante 6º semestre (avançado)
- [ ] Criar cenário: Residente (especialista)

#### Execução
- [ ] Executar cenário iniciante
- [ ] Executar cenário intermediário
- [ ] Executar cenário avançado
- [ ] Executar cenário especialista
- [ ] Documentar resultados
- [ ] Identificar problemas

### Testes de Técnicas Pedagógicas

#### Método Socrático
- [ ] Verificar uso de perguntas guiadas (meta: 80%+)
- [ ] Avaliar qualidade das perguntas
- [ ] Verificar validação de compreensão
- [ ] Documentar exemplos positivos
- [ ] Documentar exemplos negativos

#### Scaffolding
- [ ] Verificar progressão gradual
- [ ] Avaliar adequação dos fundamentos
- [ ] Verificar retorno a conceitos básicos
- [ ] Documentar exemplos positivos
- [ ] Documentar exemplos negativos

#### ZPD
- [ ] Verificar adaptação ao nível do estudante
- [ ] Avaliar calibração de linguagem
- [ ] Verificar desafio apropriado
- [ ] Documentar exemplos positivos
- [ ] Documentar exemplos negativos

#### Feedback
- [ ] Verificar feedback imediato (meta: 100%)
- [ ] Avaliar tom encorajador
- [ ] Verificar explicação de erros
- [ ] Documentar exemplos positivos
- [ ] Documentar exemplos negativos

### Testes de Integração com Bases

#### Perplexity
- [ ] Testar consulta para contexto geral
- [ ] Verificar relevância dos resultados
- [ ] Avaliar apresentação das informações
- [ ] Medir tempo de resposta
- [ ] Documentar problemas

#### PubMed
- [ ] Testar consulta para evidências
- [ ] Verificar relevância dos artigos
- [ ] Avaliar apresentação das referências
- [ ] Medir tempo de resposta
- [ ] Documentar problemas

#### Citação de Fontes
- [ ] Verificar citação natural
- [ ] Avaliar formato de apresentação
- [ ] Verificar links funcionais
- [ ] Testar em diferentes contextos
- [ ] Documentar problemas

### Testes de Performance

#### Tempo de Resposta
- [ ] Medir tempo sem consultas externas (meta: < 3s)
- [ ] Medir tempo com Perplexity (meta: < 10s)
- [ ] Medir tempo com PubMed (meta: < 10s)
- [ ] Identificar gargalos
- [ ] Otimizar se necessário

#### Uso de Tokens
- [ ] Medir tokens do system prompt
- [ ] Medir tokens médios por resposta
- [ ] Verificar limite de contexto
- [ ] Otimizar se necessário

#### Experiência de Streaming
- [ ] Verificar fluidez do streaming
- [ ] Testar em conexões lentas
- [ ] Verificar indicadores de progresso
- [ ] Documentar problemas

### Refinamento Baseado em Feedback

#### Análise de Resultados
- [ ] Compilar todos os resultados de testes
- [ ] Identificar padrões de problemas
- [ ] Priorizar ajustes necessários
- [ ] Criar plano de refinamento

#### Ajustes no System Prompt
- [ ] Ajustar instruções de Método Socrático
- [ ] Ajustar instruções de Scaffolding
- [ ] Ajustar instruções de ZPD
- [ ] Ajustar instruções de consulta a bases
- [ ] Ajustar tom e estilo

#### Ajustes na Interface
- [ ] Otimizar indicadores de consulta
- [ ] Melhorar apresentação de fontes
- [ ] Ajustar timing de animações
- [ ] Refinar feedback visual

#### Validação Final
- [ ] Executar todos os cenários de teste novamente
- [ ] Verificar todos os critérios de sucesso
- [ ] Documentar melhorias
- [ ] Obter aprovação final

---

## 📊 Critérios de Sucesso - Validação Final

### Métricas Técnicas
- [ ] ✅ Apenas 1 agente ativo (`odonto-gpt`)
- [ ] ✅ Apenas 3 ferramentas ativas (askPerplexity, searchPubMed, updateUserProfile)
- [ ] ✅ 0 funcionalidades de artefatos
- [ ] ✅ Tempo de resposta < 3s (sem consultas externas)
- [ ] ✅ Tempo de resposta < 10s (com consultas externas)

### Métricas Pedagógicas
- [ ] ✅ 80%+ das respostas usam perguntas guiadas (Método Socrático)
- [ ] ✅ Adaptação clara ao nível do estudante (ZPD)
- [ ] ✅ Feedback imediato em 100% das interações
- [ ] ✅ Consulta a bases de conhecimento quando apropriado

### Métricas de Experiência
- [ ] ✅ Interface limpa e focada em conversação
- [ ] ✅ Indicadores claros de consulta a bases
- [ ] ✅ Fluxo conversacional sem interrupções
- [ ] ✅ Tom encorajador e empático

---

## 🚀 Deploy e Lançamento

### Preparação
- [ ] Criar branch `feature/conversational-teaching`
- [ ] Fazer commit de todas as mudanças
- [ ] Criar Pull Request
- [ ] Solicitar code review
- [ ] Resolver comentários do review

### Testes em Staging
- [ ] Deploy em ambiente de staging
- [ ] Executar suite completa de testes
- [ ] Testar com usuários beta (se disponível)
- [ ] Coletar feedback
- [ ] Fazer ajustes finais

### Deploy em Produção
- [ ] Merge para branch principal
- [ ] Deploy em produção
- [ ] Monitorar logs e erros
- [ ] Verificar métricas de performance
- [ ] Estar disponível para hotfixes

### Comunicação
- [ ] Preparar anúncio de mudanças
- [ ] Documentar novas funcionalidades
- [ ] Atualizar guia do usuário
- [ ] Comunicar aos usuários
- [ ] Coletar feedback inicial

---

## 📝 Documentação

### Documentação Técnica
- [ ] Atualizar README.md
- [ ] Documentar nova arquitetura
- [ ] Documentar system prompt
- [ ] Documentar ferramentas mantidas
- [ ] Criar guia de desenvolvimento

### Documentação de Usuário
- [ ] Criar guia de uso do Odonto GPT
- [ ] Documentar técnicas pedagógicas
- [ ] Criar exemplos de interações
- [ ] Criar FAQ
- [ ] Criar vídeo tutorial (opcional)

### Documentação de Processo
- [ ] Documentar decisões de design (ADR)
- [ ] Documentar lições aprendidas
- [ ] Documentar problemas encontrados
- [ ] Documentar soluções implementadas
- [ ] Atualizar plano de projeto

---

## 🎯 Próximos Passos Após Lançamento

### Monitoramento
- [ ] Configurar analytics de uso
- [ ] Monitorar métricas de conversação
- [ ] Rastrear uso de ferramentas
- [ ] Coletar feedback de usuários
- [ ] Identificar padrões de uso

### Iteração
- [ ] Analisar feedback coletado
- [ ] Priorizar melhorias
- [ ] Planejar próximas iterações
- [ ] Implementar ajustes
- [ ] Continuar ciclo de melhoria

### Expansão (Futuro)
- [ ] Avaliar demanda por artefatos
- [ ] Considerar reintrodução seletiva
- [ ] Explorar novas técnicas pedagógicas
- [ ] Integrar novas bases de conhecimento
- [ ] Expandir funcionalidades conversacionais

---

**Status Geral**: 🔄 Em Planejamento  
**Progresso**: 0/5 Fases Completas  
**Próximo**: Iniciar Fase 1 - Planejamento e Arquitetura  
**Prazo Estimado**: 12-17 dias
