# Checklist de Testes Manuais - OdontoGPT Chat

URL: https://www.odontogpt.com/dashboard/chat

Use este checklist para testes rapidos manuais no navegador.

---

## Pre-requisitos

- [ ] Navegador atualizado (Chrome/Firefox/Safari)
- [ ] Conta de teste ativa
- [ ] Conexao de internet estavel
- [ ] DevTools aberto (F12) para monitorar erros

---

## 1. Acesso e Autenticacao

- [ ] Acessar /dashboard/chat sem login redireciona para /login
- [ ] Login com credenciais validas funciona
- [ ] Apos login, chat carrega corretamente
- [ ] Logout funciona e redireciona

---

## 2. Agentes - Teste Rapido (5 min cada)

### 2.1 Odonto GPT (GPT)

```
Prompt: "O que e carie dentaria?"
```

- [ ] Selecionar agente funciona
- [ ] Input aceita texto
- [ ] Botao enviar funciona
- [ ] Loading indicator aparece
- [ ] Resposta e recebida
- [ ] Resposta e relevante sobre carie
- [ ] Mensagem aparece no historico

### 2.2 Pesquisa Cientifica (Research)

```
Prompt: "Qual a eficacia do hipoclorito na endodontia?"
```

- [ ] Selecionar agente funciona
- [ ] Resposta contem referencias
- [ ] Artefato "Research" e gerado (painel lateral)
- [ ] Artefato contem fontes/links
- [ ] Links sao clicaveis

### 2.3 Casos Clinicos (Practice)

```
Prompt: "Crie um caso clinico sobre periodontite"
```

- [ ] Selecionar agente funciona
- [ ] Resposta descreve um caso
- [ ] Artefato "Quiz" e gerado
- [ ] Questoes tem alternativas
- [ ] Selecao de alternativa funciona
- [ ] Feedback de acerto/erro aparece

### 2.4 Resumos (Summary)

```
Prompt: "Resuma os principais tipos de protese dentaria"
```

- [ ] Selecionar agente funciona
- [ ] Resposta e um resumo estruturado
- [ ] Artefato "Summary" e gerado
- [ ] Pontos-chave estao listados
- [ ] Botao copiar funciona
- [ ] Botao exportar funciona

### 2.5 Analise de Imagens (Vision)

```
Acao: Enviar uma radiografia panoramica
Prompt: "Analise esta imagem"
```

- [ ] Selecionar agente funciona
- [ ] Botao de upload aparece
- [ ] Upload de imagem funciona
- [ ] Formatos aceitos: PNG, JPG
- [ ] Preview da imagem aparece
- [ ] Analise e gerada
- [ ] Artefato "Report" (laudo) e gerado
- [ ] Laudo contem achados
- [ ] Laudo contem recomendacoes

---

## 3. Artefatos - Funcionalidades

### Summary

- [ ] Titulo visivel
- [ ] Conteudo renderiza Markdown
- [ ] Pontos-chave listados
- [ ] Botao "Copiar" funciona
- [ ] Botao "Exportar" funciona

### Flashcards

- [ ] Cards renderizam
- [ ] Clique vira o card (flip)
- [ ] Navegacao proximo/anterior
- [ ] Contador de cards visivel

### Quiz

- [ ] Questoes carregam
- [ ] Alternativas clicaveis
- [ ] Uma alternativa selecionavel
- [ ] Botao confirmar resposta
- [ ] Feedback correto/incorreto
- [ ] Explicacao aparece
- [ ] Proxima questao funciona
- [ ] Score final exibido

### Research

- [ ] Query de pesquisa visivel
- [ ] Conteudo formatado
- [ ] Fontes listadas
- [ ] Links clicaveis (abrem em nova aba)
- [ ] Metodologia descrita

### Report (Laudo)

- [ ] Tipo de exame indicado
- [ ] Imagem referenciada
- [ ] Achados listados
- [ ] Recomendacoes presentes
- [ ] Qualidade indicada
- [ ] Botao exportar PDF

---

## 4. Acessibilidade

- [ ] Tab navega entre elementos
- [ ] Enter envia mensagem
- [ ] Escape fecha modais
- [ ] Focus visivel em todos elementos
- [ ] Cores tem contraste adequado
- [ ] Texto legivel (fonte >= 14px)
- [ ] Botoes tem labels descritivos

---

## 5. Mobile (Testar em dispositivo ou DevTools)

- [ ] Layout adapta para tela pequena
- [ ] Input nao fica escondido pelo teclado
- [ ] Botoes tem tamanho adequado (44x44px)
- [ ] Scroll funciona suavemente
- [ ] Agentes acessiveis (menu ou swipe)
- [ ] Artefatos abrem corretamente

---

## 6. Erros e Edge Cases

- [ ] Enviar mensagem vazia (deve bloquear)
- [ ] Desconectar internet e enviar (deve mostrar erro)
- [ ] Mensagem muito longa (deve funcionar ou truncar)
- [ ] Multiplas mensagens rapidas (deve enfileirar)
- [ ] Trocar agente durante resposta (deve cancelar ou avisar)
- [ ] Atualizar pagina (deve manter historico)

---

## 7. Performance

Usar DevTools > Network e Performance

- [ ] Pagina carrega em < 3s
- [ ] Primeira resposta em < 30s
- [ ] Sem erros 4xx/5xx no console
- [ ] Sem memory leaks (uso de memoria estavel)

---

## Registro de Bugs

| # | Severidade | Descricao | Passos | Screenshot |
|---|-----------|-----------|--------|------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Severidade:** Critico / Alto / Medio / Baixo

---

## Notas Adicionais

```
[ESCREVER OBSERVACOES AQUI]
```

---

**Testado por:** _________________
**Data:** _________________
**Versao:** _________________
