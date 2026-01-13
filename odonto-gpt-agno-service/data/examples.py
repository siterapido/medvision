"""
Few-Shot Learning Examples for Dental Q&A Agent

Provides example question-answer pairs to establish response patterns,
structure, and quality standards for the dental education assistant.
"""

from typing import List, Dict
from agno.models.message import Message


DENTAL_QA_EXAMPLES: List[Message] = [
    # Example 1: Periodontia
    Message(
        role="user",
        content="Quais são os sinais e sintomas da periodontite?"
    ),
    Message(
        role="assistant",
        content="""# Periodontite: Sinais e Sintomas

A periodontite é uma doença inflamatória que afeta os tecidos periodontais. Aqui estão os principais sinais e sintomas:

## Sinais Clínicos Principais

**Gengivas:**
- Sangramento gengival (espontâneo ou durante escovação)
- Gengivas vermelhas, inchadas e doloridas
- Retração gengival (dentes parecendo mais longos)
- Formação de bolsas periodontais

**Dentes:**
- Mobilidade dentária aumentada
- Deslocamento ou rotação dos dentes
- Espaços aumentando entre os dentes

**Outros Sintomas:**
- Halitose (mau hálito persistente)
- Dor ou desconforto ao mastigar
- Sensibilidade dentária
- Pus entre os dentes e gengivas

## Progressão da Doença

A periodontite geralmente se desenvolve em estágios:

1. **Gengivite** (reversível)
   - Inflamação gengival sem perda óssea

2. **Periodontite Inicial**
   - Perda óssea mínima (1-2mm)
   - Bolsas superficiais (3-4mm)

3. **Periodontite Moderada**
   - Perda óssea moderada (3-4mm)
   - Bolsas mais profundas (5-6mm)

4. **Periodontite Avançada**
   - Perda óssea severa (>5mm)
   - Mobilidade dentária significativa
   - Risco de perda dentária

## Recomendação

Se você apresenta esses sintomas, é importante **agendar uma consulta com um periodontista** para:
- Avaliação completa (sondagem periodontal, radiografias)
- Diagnóstico preciso do estágio da doença
- Plano de tratamento adequado

O tratamento precoce pode prevenir a progressão e perda dentária.

---

**Fonte:** Baseado em evidências clínicas e diretrizes da Academia Americana de Periodontia

*Deseja mais informações sobre tratamento ou prevenção de periodontite?*"""
    ),

    # Example 2: Endodontia
    Message(
        role="user",
        content="O que é tratamento de canal e quando é necessário?"
    ),
    Message(
        role="assistant",
        content="""# Tratamento Endodôntico (Tratamento de Canal)

O tratamento de canal, ou tratamento endodôntico, é um procedimento que visa salvar um dente severamente danificado ou infectado.

## Quando é Necessário?

O tratamento é indicado quando há:

**Infecção ou Inflamação da Polpa:**
- Cárie profunda reaching a polpa dentária
- Trauma dentário (quedas, acidentes)
- Fraturas dentárias
- Procedimentos dentários repetidos no mesmo dente
- Pulpite (inflamação da polpa) irreversível

**Sintomas que Podem Indicar Necessidade:**
- Dor espontânea (sem estímulo externo)
- Sensibilidade prolongada a frio/calor
- Dor ao mastigar ou tocar o dente
- Escurecimento do dente
- Inchaço na gengiva próximo ao dente
- Fístula ou abscesso

## O Procedimento - Passo a Passo

**1. Diagnóstico**
- Exame clínico e radiográfico
- Testes de vitalidade pulpar
- Avaliação da estrutura dentária

**2. Anestesia**
- Anestesia local para conforto
- Isolamento do campo operatório

**3. Acesso e Remoção da Polpa**
- Abertura da coroa para acesso aos canais
- Remoção da polpa doente/necrosada
- Limpeza dos canais radiculares

**4. Preparo dos Canais**
- Alargamento e modelagem dos canais
- Irrigação com soluções antisépticas
- Remoção de bactérias e tecido infectado

**5. Obturação**
- Preenchimento dos canais com guta-percha
- Selamento hermético para prevenir reinfecção

**6. Restauração Final**
- Reconstrução coronária
- Frequentemente com coroa protética

## Taxa de Sucesso

- **Taxa de sucesso geral: 85-95%**
- **Dentes com restauração adequada: >95%**
- Sucesso a longo prazo com bons cuidados

## Pós-Operatório

- Sensibilidade leve por alguns dias (normal)
- Evitar mastigar alimentos duros no dente tratado
- Manter boa higiene oral
- Comparecer às consultas de acompanhamento

## Importante

Este procedimento é uma **alternativa à extração dentária**. Com tratamento adequado, o dente pode ser mantido em função por muitos anos.

**Procure um endodontista** se você apresenta sintomas sugeridos acima.

---

*Precisa de mais informações sobre cuidados pós-tratamento ou alternativas?*"""
    ),

    # Example 3: Cirurgia/Implantes
    Message(
        role="user",
        content="Quais são as contraindicações para implantes dentários?"
    ),
    Message(
        role="assistant",
        content="""# Contraindicações para Implantes Dentários

Os implantes dentários são uma excelente opção para reposição dentária, mas existem situações que requerem avaliação cuidadosa ou contraindicam o procedimento.

## Contraindicações Absolutas

**Condições que tornam o implante inviável:**

### 1. Problemas Médicos Graves
- Infarto do miocárdio recente (<6 meses)
- Acidente vascular cerebral (AVC) recente
- Cirurgia cardíaca ou vascular recente
- Imunossupressão severa
- Radioterapia recente na região (especialmente mandíbula)

### 2. Doenças Ósseas Graves
- Osteoporose severa com alto risco de fratura
- Doenças metabólicas ósseas não controladas
- Metástases ósseas na maxila/mandíbula

## Contraindicações Relativas

**Situações que requerem avaliação especial:**

### 1. Diabetes Mellitus
- **Não controlada (HbA1c >7.5%):** Alto risco de falha
- **Controlada (HbA1c <7.0%):** Pode ser realizada
- Recomenda-se estabilização glicêmica antes da cirurgia

### 2. Tabagismo
- **Fumantes de >10 cigarros/dia:** Taxa de falha significativamente maior
- **Risco:** 2-3x maior de falha do implante
- **Recomendação:** Cessação do tabagismo antes do procedimento

### 3. Doenças Periodontais Não Tratadas
- Periodontite ativa aumenta risco de peri-implantite
- Tratar doença periodontal antes dos implantes
- Manutenção periodontal rigorosa após

### 4. Uso de Medicamentos
- **Bisfosfonatos orais:** Risco de osteonecrose
- **Anticoagulantes:** Avaliar risco/benefício, possível suspensão temporária
- **Imunossupressores:** Maior risco de infecção

### 5. Idade
- **Desenvolvimento ósseo incompleto:** <18-20 anos
- **Idosos avançados:** Avaliar condição geral, não a idade isoladamente

### 6. Hábitos Parafuncionais
- Bruxismo severo não tratado
- Apertamento dentário excessivo
- Recomenda-se tratamento concomitante

## Contraindicações Locais

**Problemas no sítio cirúrgico:**

- **Espaço insuficiente:** <6mm de distância interdental
- **Osso insuficiente:** Altura <8-10mm, espessura <4-5mm
- **Anatomia desfavorável:** Proximidade de nervos ou seios maxilares
- **Infecção ativa:** Deve ser tratada antes

## Avaliação Pré-Operatória Essencial

Antes de proceder com implantes, é necessário:

1. **Exame clínico completo**
2. **Tomografia Cone Beam (TCFC)**
3. **Avaliação laboratorial** (se indicado)
4. **Avaliação médica** (para pacientes com comorbidades)
5. **Modelos diagnósticos**
6. **Planejamento virtual** (quando disponível)

## Taxa de Sucesso

- **Em pacientes saudáveis:** 95-98%
- **Com fatores de risco controlados:** 85-95%
- **Com contraindicações não tratadas:** <70%

## Recomendação Final

A avaliação de um **cirurgião bucomaxilofacial ou implantologista experiente** é essencial para:

- Avaliar seus fatores de risco individuais
- Discutir alternativas de tratamento
- Planejar procedimentos adjunctivos (enxertos, etc.)
- Otimizar condições para sucesso

Muitas contraindicações relativas podem ser **controladas ou modificadas** com preparo adequado.

---

*Deseja informações sobre alternativas aos implantes ou como preparar-se para o procedimento?*"""
    ),

    # Example 4: Diagnóstico por Imagem
    Message(
        role="user",
        content="Como interpretar uma radiografia para cárie interproximal?"
    ),
    Message(
        role="assistant",
        content="""# Interpretação Radiográfica: Cárie Interproximal

A detecção de cáries entre os dentes (lesões interproximais) requer conhecimento específico de interpretação radiográfica.

## Fundamentos Técnicos

**Melhores Incidências:**
- **Radiografias interproximais (bitewing):** Padrão ouro
- **Radiografias periapicais:** Úteis mas menos sensíveis
- **Fatores:** Ângulação correta, contraste adequado, sobreposição mínima

## Classificação Radiográfica das Lesões de Cárie

**Sistema recomendado ( depth of penetration):**

### Classe 1: Lesão Superficial (<1/3 esmalte externo)
- **Aparência:** Área radiolúcida sutil no esmalte
- **Localização:** Primeiro terço do esmalte
- **Conduta:** Preventiva, fluorterapia, selante
- **Reversível:** Sim

### Classe 2: Lesão Moderada (1/3 a 2/3 esmalte)
- **Aparência:** Radiolucidez mais evidente no esmalte
- **Localização:** Dois terços externos do esmalte
- **Conduta:** Restauração preventiva ou resina composta
- **Risco:** Progressão se não tratada

### Classe 3: Lesão Avançada (sem envolvimento dentinário)
- **Apariência:** Radiolucidez atingindo junção amelodentária
- **Localização:** Terço interno do esmalte
- **Conduta:** Restauração obrigatória
- **Urgência:** Moderada

### Classe 4: Lesão com Envolvimento Dentinário Leve
- **Apariência:** Radiolucidez penetrando na dentina superficial
- **Localização:** Primeiro terço da dentina
- **Conduta:** Restauração imediata
- **Sintomas:** Geralmente assintomático

### Classe 5: Lesão Dentinária Profunda
- **Apariencia:** Grande radiolucidez na dentina
- **Localização:** Dois terços ou mais da dentina
- **Conduta:** Tratamento endodôntico se houver exposição pulpar
- **Sintomas:** Pode apresentar sensibilidade ou dor

## Achados Radiográficos Característicos

**Cárie Ativa vs. Arrestada:**

| Característica | Cárie Ativa | Cárie Arrestada |
|----------------|-------------|-----------------|
| Radiolucidez | Mais escura (menos densa) | Mais clara (densidade aumentada) |
| Bordas | Mal definidas | Bem definidas |
| Progressão | Rápida | Lenta/nenhuma |
| Localização | Frequentemente cervical | Frequentemente gengival |

## Erros Comuns de Interpretação

### Falsos Positivos
- Sobreposição de imagem cervical
- Hipomineralização do esmalte
- Abrasão cervical
- Anomalias do esmalte (hipoplasia)

### Falsos Negativos
- Cáries em superfícies não visíveis radiograficamente
- Lesões iniciais (<30% de desmineralização)
- Superposições ósseas

## Limitações da Radiografia

**Sensibilidade:**
- Detecta apenas ~40-60% das lesões de cárie
- Lesões iniciais podem ser invisíveis
- Superfícies oclusais e linguais/vestibulares mal avaliadas

**Recomendações Atuais:**
- Combinar exame clínico com radiográfico
- Usar critérios visuais (ICDAS) quando disponível
- Considerar tomografia para casos complexos

## Fluxograma de Decisão

```
Lesão interproximal detectada radiograficamente
         ↓
Classe 1-2: Preventivo/Restauração simples
         ↓
Classe 3-4: Restauração imediata
         ↓
Classe 5: Avaliar vitalidade pulpar
         ↓
        Tratamento endodôntico se sintomático
```

## Recomendação Clínica

Para interpretação confiável:

1. **Use radiografias de alta qualidade** (técnica correta)
2. **Compare com dentes adjacentes** (referência)
3. **Avalie clinicamente** (coloração, textura)
4. **Documente com fotografia** quando possível
5. **Considere o risco de cárie do paciente**
6. **Monitore lesões incipientes** a cada 6-12 meses

## Importante

A radiografia é **apenas uma ferramenta complementar**. O diagnóstico final deve considerar:

- Exame clínico completo
- Sintomas do paciente
- Histórico de cáries
- Fatores de risco
- Higiene oral

---

*Necessita ajuda com casos específicos ou outras interpretações radiográficas?*"""
    ),

    # Example 5: Urgência Odontológica
    Message(
        role="user",
        content="O que fazer em caso de trauma dentário com avulsão?"
    ),
    Message(
        role="assistant",
        content="""# ⚠️ EMERGÊNCIA: Avulsão Dentária - Protocolo Imediato

A avulsão (perda completa do dente) é uma emergência dental. **O tempo é crítico** para o sucesso do reimplante.

## ⏱️ Janela Crítica: Primeiros 30 Minutos

**Taxa de sucesso do reimplante:**
- **<30 minutos:** 90%+ de sucesso
- **30-60 minutos:** 70-80% de sucesso
- **>60 minutos:** <50% de sucesso
- **>2 horas:** Prognóstico reservado

## 🚨 Ações Imediatas (PASSO A PASSO)

### 1. Localizar o Dente
- Encontrar o dente imediatamente
- **Segurar APENAS pela coroa** (parte branca)
- **NUNCA toque na raiz**
- **NÃO lave ou esfregue a raiz**

### 2. Limpeza (SE necessário)
- Se o dente estiver sujo de terra/debris:
  - Enxágue BREVEMENTE com **soro fisiológico** ou **leite**
  - **NUNCA use água** (danifica células do ligamento)
  - **NUNCA esfregue ou escove** o dente
  - Máximo 10 segundos de enxágue

### 3. Transporte Adequado

**OPÇÃO IDEAL (Melhor Prognóstico):**
- **Reimplantar IMEDIATAMENTE** no alvéolo
- Colocar o dente no lugar com orientação correta
- Morder delicadamente um lenço/gaze para manter posição
- Ir IMEDIATAMENTE ao dentista

**SE NÃO FOR POSSÍVEL REIMPLANTAR:**
Transportar em meio de conservação:

**Meios aprovados (em ordem de preferência):**
1. **Leite** (frio ou temperatura ambiente) - Melhor opção
2. **Saliva** (dentes dentro da boca, entre bochecha e dente)
3. **Soro fisiológico**
4. **Hanks Balanced Salt Solution (HBSS)** - Se disponível

**NUNCA use:**
- ❌ Água (causa dano celular irreversível)
- ❌ Papel/toalha (seca e danifica o ligamento)
- ❌ Tecido embrulhado (resseca o dente)

### 4. Durante o Transporte
- Manter o dente **sempre úmido**
- Não deixar secar em momento algum
- Chegar ao dentista **o mais rápido possível**
- **Ligar para o dentista antes** para preparar atendimento

## 👨‍⚕️ Tratamento no Consultório

O dentista realizará:

1. **Anestesia local**
2. **Limpeza do alvéolo** (remoção de coágulo)
3. **Reimplante cuidadoso** com orientação correta
4. **Flexão do dente** para verificar estabilidade
5. **Contenção** (fio ou splint por 7-14 dias)
6. **Antibioticoterapia** (geralmente tetraciclina ou amoxicilina)
7. **Radiografia** para confirmar posição
8. **Tétano** (verificar vacinação)

## Cuidados Pós-Reimplante

### Primeiros 7 Dias
- Dieta líquida/pastosa
- Não tocar no dente
- Escovação suave ao redor
- Bochechos com clorexidina 0,12%
- Evitar atividades que possam traumatizar

### Medicações Típicas
- **Antibiótico** por 7-10 dias
- **Analgésicos** para dor
- **Anti-inflamatório** se necessário

### Acompanhamento
- **1 semana:** Avaliar estabilidade, radiografia
- **2 semanas:** Remover contenção
- **4 semanas:** Avaliar vitalidade pulpar
- **6-12 meses:** Monitorar reabsorção radicular

## Possíveis Complicações

**Comuns:**
- Reabsorção radicular (25-50% dos casos)
- Anquilose (fusão com o osso)
- Perda de vitalidade pulpar (necessita tratamento de canal)

**Sinais de Alerta:**
- Dor persistente ou crescente
- Mobilidade aumentada após 2 semanas
- Mudança de cor do dente (escurecimento)
- Inchaço ou secreção gengival

## Prevenção de Futuros Traumas

Após cicatrização:
- **Protetor bucal** durante esportes
- Capacete para atividades de risco
- Evitar brinquedos/balizas perigosas
- Tratar bruxismo se presente

## 📞 Números de Emergência

- **Dentista de emergência:** [Seu número]
- **Plantão odontológico:** [Número local]
- **Pronto-socorro:** Se houver sangramento incontrolável ou trauma facial extenso

---

## ⚠️ LEMBRETE CRÍTICO

**CADA MINUTO CONTA!**

1. Minuto 1-15: Reimplantar se possível → Sucesso ~95%
2. Minuto 15-30: Transportar em leite → Sucesso ~85%
3. Minuto 30-60: Transportar rápido → Sucesso ~60%
4. Após 2 horas: Prognóstico ruim

**Não espere! Aja imediatamente!**

---

*Esta é uma emergência. Guarde estas informações para acesso rápido em caso de necessidade.*

**Deseja informações sobre outros tipos de trauma dental?*"""
    ),
]


def get_few_shot_examples(
    category: Optional[str] = None
) -> List[Message]:
    """
    Return few-shot examples for dental Q&A.

    Args:
        category: Filter by category (e.g., "periodontia", "endodontia")

    Returns:
        List of Message examples
    """
    # For now, return all examples
    # TODO: Filter by category when more examples are added
    return DENTAL_QA_EXAMPLES


if __name__ == "__main__":
    # Test examples
    print("Few-Shot Examples Loaded:")
    print(f"Total examples: {len(DENTAL_QA_EXAMPLES)}")
    print(f"Messages: {len(DENTAL_QA_EXAMPLES)}")
