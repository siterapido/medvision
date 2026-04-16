# Documento de Especificações do Produto (DSP)

**Produto:** MedVision  
**Repositório:** [github.com/siterapido/medvision](https://github.com/siterapido/medvision)  
**Versão do documento:** 1.0  
**Última atualização:** 15/04/2026  

---

## 1. Resumo executivo

O **MedVision** é uma aplicação web para profissionais e estudantes de odontologia que precisam **analisar imagens clínicas** (radiografias, tomografias e imagens correlatas) com apoio de **modelos de linguagem e visão** (via OpenRouter), em um fluxo guiado (wizard) com recorte, validação de qualidade, anotações e exportação de relatório (PDF).

O produto inclui um **painel administrativo** para gestão de usuários, cursos, materiais e agentes de IA, sustentando operação, conteúdo e automação.

Este documento fixa a visão do produto, públicos, escopo funcional, requisitos não funcionais e critérios de sucesso, servindo de referência para priorização, desenvolvimento e comunicação com stakeholders.

---

## 2. Contexto e problema

### 2.1 Problema

- Interpretação de imagens odontológicas exige tempo, experiência e acesso a segunda opinião nem sempre disponível.
- Fluxos ad hoc (enviar imagem por mensagem, usar ferramentas genéricas) geram inconsistência, pouca rastreabilidade e risco de uso inadequado de IA sem contexto clínico estruturado.

### 2.2 Proposta de valor

- Fluxo único e profissional: upload → descrição do caso → escolha de modelos → ajustes (crop) → confirmação → análise → resultado com possibilidade de refinamento, anotações e documentação.
- Experiência alinhada à prática clínica (tecnologia médica, foco em imagem e laudo), com UI preparada para uso recorrente.
- Base técnica preparada para integrações (pagamentos, mensageria, e-mail, armazenamento) quando necessário ao negócio.

---

## 3. Objetivos do produto


| Objetivo                      | Descrição                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| **O1 — Análise assistida**    | Oferecer análise de imagens odontológicas com saída estruturada e exportável.                           |
| **O2 — Confiança e controle** | Permitir revisão humana (crop, regiões, anotações, feedback de qualidade) antes e depois da inferência. |
| **O3 — Operação**             | Viabilizar administração de usuários, conteúdo (cursos/materiais) e agentes de IA para o time interno.  |
| **O4 — Confiabilidade**       | Manter autenticação, autorização e dados alinhados às boas práticas do stack em produção.               |


---

## 4. Públicos e personas


| Persona                         | Necessidades principais                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| **Clínico / especialista**      | Análise rápida e legível, suporte a múltiplos modelos, documento para prontuário ou paciente. |
| **Estudante**                   | Aprendizado com feedback visual e texto explicativo; exploração de casos.                     |
| **Administrador da plataforma** | Gestão de usuários, catálogo de cursos e materiais, configuração de agentes de IA.            |
| **Operações / suporte**         | Comunicação (e-mail, WhatsApp conforme integrações), trials e assinaturas quando ativos.      |


---

## 5. Escopo funcional

### 5.1 Área do usuário autenticado (dashboard)

**Experiência principal — Med Vision (`/dashboard` → `/dashboard/odonto-vision`)**

- **Wizard de estados:** Imagem → Problema (contexto clínico) → Modelos → Ajustes (recorte/crop) → Confirmar → Análise → Resultado (com tratamento de erro).
- **Upload** de imagens (arrastar e soltar), com validação e compressão quando aplicável.
- **Seleção de modelos** de visão/LLM disponíveis (lista configurável no código).
- **Ferramentas de imagem:** recorte, zoom, rotação, anotações e seleção de regiões para análise focal.
- **Qualidade da imagem:** validação com feedback ao usuário.
- **Resultado:** apresentação estruturada (achados, severidade quando aplicável), comparação ou refinamentos conforme implementado.
- **Exportação:** geração de PDF do relatório de análise.
- **Artefatos / histórico:** integração com APIs de artefatos e histórico quando o utilizador navega pelos fluxos correspondentes.

**Outras rotas sob `/dashboard`**

O repositório mantém módulos adicionais (biblioteca, chat, certificados, OdontoFlix, configurações, etc.). A **navegação principal exposta na sidebar** está focada em **Med Vision**; demais rotas podem existir para compatibilidade, migração ou funcionalidades complementares — a prioridade de produto atual é a ferramenta de visão.

### 5.2 Autenticação e conta

- **Login** e **cadastro** (`/login`, `/register`), recuperação de senha e fluxos de trial quando habilitados.
- **Perfil** e **configurações** acessíveis ao usuário autenticado.
- **Sessão** respeitando o mecanismo de auth configurado no deploy (evolução do stack deve ser refletida em variáveis de ambiente e documentação de deploy).

### 5.3 Painel administrativo (`/admin`)


| Área            | Finalidade                                                                           |
| --------------- | ------------------------------------------------------------------------------------ |
| **Visão geral** | Resumo operacional do painel.                                                        |
| **Usuários**    | Listagem, detalhe, exportação e atributos (ex.: papel de vendedor quando aplicável). |
| **Cursos**      | Gestão de cursos e aulas (incluindo importação de aulas onde implementado).          |
| **Materiais**   | Gestão de materiais e uploads associados.                                            |
| **Agentes IA**  | Configuração e geração relacionada a agentes.                                        |


**Áreas administrativas adicionais** no repositório (lives, trials, certificados, notificações, funis, pipeline, etc.) entram no escopo quando o negócio as mantém ativas no ambiente; devem ser tratadas como módulos opcionais de operação e marketing.

### 5.4 APIs e automação (visão de produto)

- **Análise de visão:** `POST` em rotas de API dedicadas à análise de imagem (ex.: `/api/vision/analyze`).
- **Webhooks:** integrações com provedores de pagamento e mensageria (ex.: Cakto, Z-API/Evolution) para eventos de cobrança e comunicação.
- **Cron:** tarefas agendadas (notificações, pipeline, lembretes de lives) quando configuradas no provedor de hospedagem.

---

## 6. Requisitos não funcionais

### 6.1 Segurança e privacidade

- Dados de saúde e imagens clínicas exigem **mínimo necessário** de retenção e **acesso autenticado** às áreas sensíveis.
- Chaves de API e segredos apenas em variáveis de ambiente; nunca versionados.
- Conformidade com a política de dados e LGPD deve ser definida pelo operador do produto e refletida em termos de uso e política de privacidade.

### 6.2 Desempenho e disponibilidade

- Tempo de resposta da análise depende de provedores externos (LLM); a UI deve comunicar estados de carregamento e erro de forma clara.
- Objetivo de referência: interface responsiva e utilizável em desktop e tablet (uso clínico frequente em telas maiores).

### 6.3 Observabilidade

- Health check de API (`/api/health`) para monitoramento.
- Recomenda-se integração com monitoramento de erros e analytics em produção (conforme `docs/DEPLOY_PRODUCTION.md`).

### 6.4 Acessibilidade

- Contraste e foco visível em componentes críticos (alinhado ao guia de UI/UX do projeto e WCAG como referência).

---

## 7. Integrações (ecossistema)

As integrações abaixo são **suportadas pelo código e documentação**; a ativação depende de variáveis de ambiente e contratos comerciais.


| Categoria        | Exemplos no projeto                                                         |
| ---------------- | --------------------------------------------------------------------------- |
| **IA**           | OpenRouter (chat, visão, embeddings); chave opcional dedicada a Med Vision. |
| **Dados / auth** | PostgreSQL (Neon), evolução de auth documentada em `.env.example` e guias.  |
| **Pagamentos**   | Cakto (checkout, assinatura, histórico, webhooks).                          |
| **Comunicação**  | Z-API / Evolution (WhatsApp), Resend (e-mail).                              |
| **Mídia**        | Bunny, Vercel Blob (uploads e materiais).                                   |
| **Hospedagem**   | Vercel (frontend), serviços externos para jobs/cron conforme deploy.        |


---

## 8. Fora de escopo (explícito)

- **Diagnóstico definitivo ou substituição do julgamento clínico:** a ferramenta é **suporte à decisão**, não dispositivo médico certificado, salvo posicionamento regulatório futuro.
- **Responsabilidade única do software** por desfechos clínicos: permanece com o profissional e com o operador da plataforma conforme termos legais.

---

## 9. Métricas de sucesso (sugestão)


| Métrica                 | Descrição                                                                      |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Ativação**            | Usuários que completam primeira análise com sucesso.                           |
| **Retenção**            | Sessões recorrentes com exportação PDF ou refinamento.                         |
| **Qualidade percebida** | Uso de feedback de qualidade de imagem e taxa de abandono por etapa do wizard. |
| **Operação**            | Tempo médio de resolução no admin; taxa de erro em webhooks e crons.           |


*(Valores-alvo são definidos pelo negócio.)*

---

## 10. Glossário


| Termo          | Significado                                                                  |
| -------------- | ---------------------------------------------------------------------------- |
| **Med Vision** | Nome da funcionalidade principal de análise de imagens odontológicas com IA. |
| **Wizard**     | Sequência de passos (upload → … → resultado).                                |
| **Artefato**   | Objeto gerado ou armazenado por fluxos de IA/documento associados à sessão.  |


---

## 11. Referências internas

- `README.md` — visão geral do repositório e primeiros passos.
- `AGENTS.md` — convenções de código e estrutura Next.js.
- `UI_UX_GUIDE.md` — diretrizes visuais (herança Odonto GPT / identidade médica).
- `docs/DEPLOY_PRODUCTION.md` — arquitetura de deploy e integrações.

---

## 12. Histórico de revisões


| Versão | Data       | Alterações                                                         |
| ------ | ---------- | ------------------------------------------------------------------ |
| 1.0    | 15/04/2026 | Versão inicial do DSP alinhada ao foco Med Vision + administração. |
