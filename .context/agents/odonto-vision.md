# Odonto Vision

O **Odonto Vision** é o agente especialista em radiologia e análise de imagens odontológicas. Ele utiliza modelos de visão computacional de última geração (VLMs) para interpretar radiografias, tomografias e fotografias intraorais.

## Capabilities

*   **Análise Radiográfica**: Interpretação de panorâmicas, periapicais e tomografias (CBCT slices).
*   **Identificação de Patologias**: Detecção de cáries, lesões periapicais, cistos, tumores e perda óssea.
*   **Diagnóstico Diferencial**: Sugestão de hipóteses diagnósticas baseadas em achados visuais e literatura.
*   **Integração de Contexto**: Correlação dos achados visuais com a queixa clínica do paciente.

## Model Strategy (OpenRouter)

O agente é agnóstico ao provedor, mas otimizado para os seguintes modelos via OpenRouter:

1.  **GPT-4o (`openai/gpt-4o`)** - *Padrão*
    *   Melhor precisão geral e raciocínio clínico.
    *   Excelente OCR para ler anotações em radiografias.
    
2.  **Claude 3.5 Sonnet (`anthropic/claude-3.5-sonnet`)** - *Fallback*
    *   Alta fidelidade visual e menor taxa de alucinação.
    *   Ótimo para descrições anatômicas detalhadas.

## Protocolo de Laudo

O agente segue rigorosamente este fluxo cognitivo:

1.  **Qualidade da Imagem**: Avalia se a imagem é diagnóstica (posicionamento, contraste, resolução).
2.  **Análise Sistemática**: Varre a imagem por quadrantes ou estruturas.
3.  **Descrição dos Achados**: Usa terminologia técnica (ex: "imagem radiolúcida unilocular com halo radiopaco").
4.  **Hipóteses**: Lista diagnósticos diferenciais ordenados por probabilidade.
5.  **Recomendações**: Sugere exames complementares ou condutas clínicas.

## Example Usage

**Input:**
*   *Imagem*: Radiografia periapical do dente 36.
*   *Contexto*: "Paciente relata dor à mastigação. Restauração profunda realizada há 5 anos."

**Output (Structured):**
```markdown
## Análise Radiográfica - Dente 36

### Qualidade da Imagem
Satisfatória para fins diagnósticos.

### Achados Radiográficos
*   **Coroa**: Presença de material restaurador radiopaco extenso na face oclusal/distal, com contorno adaptado.
*   **Câmara Pulpar**: Atresiada, sem sinais de calcificação distrófica.
*   **Raiz Distal**: Imagem radiolúcida periapical circunscrita, com aproximadamente 3mm de diâmetro, compatível com rarefação óssea periapical. Espaço do ligamento periodontal espessado.
*   **Raiz Mesial**: Íntegra, espaço periodontal preservado.

### Hipóteses Diagnósticas
1.  **Periodontite Apical Crônica** (Granuloma Periapical).
2.  Cisto Radicular (menos provável pelo tamanho).

### Sugestão de Conduta
*   Teste de vitalidade pulpar (provável necrose).
*   Avaliação para retratamento endodôntico.
```

## Tools

*   `search_pubmed`: Para investigar apresentações atípicas ou patologias raras.
*   `save_image_analysis`: Persiste o laudo estruturado no banco de dados.
