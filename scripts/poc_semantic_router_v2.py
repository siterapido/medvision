# POC: Semantic Router v2 (Multilingual Support)
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# 1. Use a Multilingual Model
model_name = "paraphrase-multilingual-MiniLM-L12-v2"
print(f"Loading multilingual model {model_name}...")
model = SentenceTransformer(model_name)

# 2. Localized Personas (Portuguese)
agent_personas = {
    "odonto-research": "Pesquisa científica, busca de artigos médicos, PubMed, evidência clínica, revisões sistemáticas, citações e referências.",
    "odonto-practice": "Questões de estudo, preparação para provas, quizzes, múltipla escolha, ENADE, residência, exercícios acadêmicos.",
    "odonto-write": "Escrita acadêmica, revisão de texto, estrutura de TCC, formatação ABNT, Vancouver, metodologia científica, auxílio na escrita.",
    "odonto-vision": "Análise de imagens, interpretação radiográfica, diagnóstico por Raio-X, identificação de lesões em fotos, laudos.",
    "odonto-marketing": "Marketing odontológico, posts para redes sociais, legendas para instagram, estratégias de captação, promoção de clínica.",
}

# Pre-compute anchor embeddings
print("Encoding localized personas...")
persona_embeddings = {name: model.encode(desc) for name, desc in agent_personas.items()}

# 3. Test Cases (Difficult scenarios for keyword matching)
test_queries = [
    # Clear cases
    ("Quais os artigos mais recentes sobre implantes?", "odonto-research"),
    ("Crie uma questão de prova sobre cárie.", "odonto-practice"),
    # Ambiguous / Mixed cases
    ("Como escrever a metodologia do meu TCC?", "odonto-write"),
    ("Analise esta radiografia para mim.", "odonto-vision"),
    ("Crie um post para o Instagram da minha clínica.", "odonto-marketing"),
    # Hard cases (Keyword overlap)
    ("Pesquise artigos para embasar meu TCC.", "odonto-research"),  # or mixed
    ("Formate as referências deste artigo.", "odonto-write"),
]


def classify_query(query):
    query_emb = model.encode(query)
    scores = {}

    for agent, agent_emb in persona_embeddings.items():
        # Cosine similarity
        score = cosine_similarity([query_emb], [agent_emb])[0][0]
        scores[agent] = score

    # Sort by score
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_scores


print("\n--- Running Semantic Routing Tests (v2) ---\n")

for query, expected in test_queries:
    results = classify_query(query)
    top_agent, top_score = results[0]
    second_agent, second_score = results[1]

    status = "✅" if top_agent == expected else "❌"
    print(f"Query: '{query}'")
    print(f"  Expected: {expected}")
    print(f"  Result:   {status} {top_agent} ({top_score:.3f})")
    print(f"  RunnerUp: {second_agent} ({second_score:.3f})")
    print("-" * 40)

# 4. Multi-intent Detection Logic (Mock)
print("\n--- Testing Multi-Intent Logic ---\n")
complex_query = (
    "Pesquise artigos sobre clareamento e escreva um resumo para o Instagram."
)
print(f"Query: '{complex_query}'")
results = classify_query(complex_query)

print("Top 3 scores:")
for agent, score in results[:3]:
    print(f"  {agent}: {score:.3f}")

# Heuristic: If top 2 scores are close and high (>0.5), flag as 'orchestrator'
top1 = results[0]
top2 = results[1]
if top1[1] > 0.5 and top2[1] > 0.5:
    print("\nDecision: ROUTE TO ORCHESTRATOR (Multi-intent detected)")
else:
    print(f"\nDecision: ROUTE TO {top1[0]}")
