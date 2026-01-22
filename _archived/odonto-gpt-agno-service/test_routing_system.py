#!/usr/bin/env python3
"""
Sistema de Testes do Roteamento de Agentes - Odonto Suite (Simplificado)
=========================================================================

Este script testa criticamente o sistema de roteamento inteligente que
decide qual agente especializado deve responder a cada tipo de mensagem.

Versão simplificada que testa apenas a lógica de roteamento sem instanciar agentes.

Autor: Análise Crítica do Sistema
Data: 2026-01-14
"""

import sys
import os
from typing import List, Dict, Optional, Any
import re
import logging

# Add the project root to the python path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.router import hybrid_router, MODEL_AVAILABLE

    if not MODEL_AVAILABLE:
        print("\n" + "!" * 80)
        print("AVISO CRÍTICO: Semantic Engine (sentence-transformers) NÃO CARREGADO.")
        print("O sistema está rodando em modo FALLBACK (apenas keywords).")
        print("Para resultados reais, certifique-se de instalar as dependências:")
        print("pip install -r requirements.txt")
        print("!" * 80 + "\n")
except ImportError as e:
    print(f"Erro ao importar app.router: {e}")
    print("Verifique se o script está sendo executado do diretório raiz do projeto.")
    sys.exit(1)

# Configurar logger dummy para testes
logging.basicConfig(level=logging.ERROR)  # Só mostra erros para não poluir
logger = logging.getLogger(__name__)

# ============================================================================
# CÓPIA DA FUNÇÃO DE ROTEAMENTO PARA TESTES ISOLADOS (ATUALIZADA)
# ============================================================================


def rotear_para_agente_apropriado(
    mensagem_usuario: str,
    tem_imagem: bool = False,
    contexto: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Roteia requisição para agente apropriado usando o HybridRouter real.
    """
    return hybrid_router.route(text=mensagem_usuario, has_image=tem_imagem)


# ============================================================================
# CLASSES DE TESTE
# ============================================================================


class RoutingTestCase:
    """Classe para representar um caso de teste de roteamento"""

    def __init__(
        self,
        mensagem: str,
        esperado: str,
        tem_imagem: bool = False,
        categoria: str = "",
        descricao: str = "",
    ):
        self.mensagem = mensagem
        self.esperado = esperado
        self.tem_imagem = tem_imagem
        self.categoria = categoria
        self.descricao = descricao


class RoutingTester:
    """Classe principal para executar testes de roteamento"""

    def __init__(self):
        self.test_cases: List[RoutingTestCase] = []
        self.results: List[Dict] = []

    def add_test(
        self,
        mensagem: str,
        esperado: str,
        tem_imagem: bool = False,
        categoria: str = "",
        descricao: str = "",
    ):
        """Adiciona um caso de teste"""
        self.test_cases.append(
            RoutingTestCase(mensagem, esperado, tem_imagem, categoria, descricao)
        )

    def run_tests(self, verbose: bool = True):
        """Executa todos os testes"""
        print("\n" + "=" * 80)
        print("SISTEMA DE TESTES DE ROTEAMENTO - ODONTO SUITE")
        print("=" * 80 + "\n")

        passed = 0
        failed = 0

        for i, test in enumerate(self.test_cases, 1):
            resultado = rotear_para_agente_apropriado(
                mensagem_usuario=test.mensagem, tem_imagem=test.tem_imagem
            )

            success = resultado == test.esperado

            if success:
                passed += 1
                status = "✓ PASSOU"
            else:
                failed += 1
                status = "✗ FALHOU"

            # Armazenar resultado
            self.results.append(
                {
                    "numero": i,
                    "mensagem": test.mensagem,
                    "esperado": test.esperado,
                    "obtido": resultado,
                    "sucesso": success,
                    "categoria": test.categoria,
                    "descricao": test.descricao,
                }
            )

            if verbose:
                print(f"{status}")
                print(f"  Teste #{i}: {test.categoria}")
                print(f"  Mensagem: {test.mensagem[:80]}...")
                print(f"  Esperado: {test.esperado}")
                print(f"  Obtido: {resultado}")
                if not success:
                    print(f"  ❌ MISMATCH!")
                if test.descricao:
                    print(f"  Descrição: {test.descricao}")
                print()

        # Relatório final
        total = len(self.test_cases)
        taxa_sucesso = (passed / total * 100) if total > 0 else 0

        print("\n" + "=" * 80)
        print("RELATÓRIO FINAL")
        print("=" * 80 + "\n")
        print(f"  Total de testes: {total}")
        print(f"  Testes passados: {passed}")
        print(f"  Testes falhados: {failed}")
        print(f"  Taxa de sucesso: {taxa_sucesso:.1f}%\n")

        if failed > 0:
            print("Testes que falharam:")
            for result in self.results:
                if not result["sucesso"]:
                    print(f"  - Teste #{result['numero']}: {result['categoria']}")
                    print(
                        f"    Esperado '{result['esperado']}' mas obteve '{result['obtido']}'"
                    )
            print()

        return passed, failed, taxa_sucesso

    def analyze_routing_logic(self):
        """Análise crítica da lógica de roteamento"""
        print("\n" + "=" * 80)
        print("ANÁLISE CRÍTICA DO SISTEMA DE ROTEAMENTO")
        print("=" * 80 + "\n")

        # Análise por categoria
        categorias = {}
        for result in self.results:
            cat = result["categoria"]
            if cat not in categorias:
                categorias[cat] = {"total": 0, "sucesso": 0, "falhas": 0}
            categorias[cat]["total"] += 1
            if result["sucesso"]:
                categorias[cat]["sucesso"] += 1
            else:
                categorias[cat]["falhas"] += 1

        print("Desempenho por Categoria:\n")
        for cat, stats in categorias.items():
            taxa = (
                (stats["sucesso"] / stats["total"] * 100) if stats["total"] > 0 else 0
            )
            print(f"  {cat}:")
            print(
                f"    Total: {stats['total']}, Sucesso: {stats['sucesso']}, "
                f"Falhas: {stats['falhas']} ({taxa:.0f}%)"
            )

        print("\nPontos Fortes Identificados:\n")
        print("  ✓ Sistema usa contagem de keywords específicas por agente")
        print("  ✓ Priorização de imagens quando presente")
        print("  ✓ Detecção de cenários multi-agente (equipe)")
        print("  ✓ Fallback para 'ciencia' em casos ambíguos")

        print("\nPontos Fracos / Vulnerabilidades:\n")
        problemas = []

        # Verificar falhas
        for result in self.results:
            if not result["sucesso"]:
                problemas.append(
                    {
                        "tipo": "Roteamento Incorreto",
                        "detalhes": f"'{result['mensagem'][:50]}...' → {result['obtido']} (esperado: {result['esperado']})",
                    }
                )

        if problemas:
            for i, prob in enumerate(problemas, 1):
                print(f"  {i}. {prob['tipo']}")
                print(f"     {prob['detalhes']}")
        else:
            print("  ✓ Nenhum problema crítico identificado!")

        print("\nRecomendações de Melhoria:\n")
        print("  1. Implementar sistema de pesos para keywords (não apenas contagem)")
        print("  2. Adicionar análise semântica com embeddings para melhor precisão")
        print("  3. Considerar histórico da conversa para roteamento contextual")
        print("  4. Adicionar logging de decisões de roteamento para análise")
        print("  5. Implementar testes A/B para validar mudanças no algoritmo")
        print("  6. Criar mecanismo de feedback do usuário sobre roteamento")


def setup_comprehensive_tests(tester: RoutingTester):
    """Configura conjunto abrangente de testes"""

    # ========================================================================
    # CATEGORIA 1: DR. CIÊNCIA (odonto-research) - Pesquisa Científica
    # ========================================================================

    tester.add_test(
        mensagem="Quais são os estudos mais recentes sobre implantes dentários?",
        esperado="ciencia",
        categoria="Dr. Ciência - Pesquisa",
        descricao="Busca por estudos recentes - claramente pesquisa científica",
    )

    tester.add_test(
        mensagem="Preciso de artigos sobre tratamento de periodontite no PubMed",
        esperado="ciencia",
        categoria="Dr. Ciência - Pesquisa",
        descricao="Menção explícita a PubMed e artigos",
    )

    tester.add_test(
        mensagem="Qual é a evidência científica para uso de laser em endodontia?",
        esperado="ciencia",
        categoria="Dr. Ciência - Evidência",
        descricao="Pergunta sobre evidência científica",
    )

    tester.add_test(
        mensagem="Me mostre referências sobre cárie dentária em crianças",
        esperado="ciencia",
        categoria="Dr. Ciência - Referências",
        descricao="Solicitação de referências bibliográficas",
    )

    tester.add_test(
        mensagem="Encontre revisões sistemáticas sobre clareamento dental",
        esperado="ciencia",
        categoria="Dr. Ciência - Revisão",
        descricao="Busca por revisões sistemáticas",
    )

    # ========================================================================
    # CATEGORIA 2: PROF. ESTUDO (odonto-practice) - Questões e Simulados
    # ========================================================================

    tester.add_test(
        mensagem="Crie 10 questões de múltipla escolha sobre periodontia",
        esperado="estudo",
        categoria="Prof. Estudo - Questões",
        descricao="Solicitação explícita de questões",
    )

    tester.add_test(
        mensagem="Preciso de um simulado para o ENADE de odontologia",
        esperado="estudo",
        categoria="Prof. Estudo - Simulado",
        descricao="Criação de simulado para prova",
    )

    tester.add_test(
        mensagem="Me ajude a estudar para a prova de endodontia",
        esperado="estudo",
        categoria="Prof. Estudo - Prova",
        descricao="Preparação para prova",
    )

    tester.add_test(
        mensagem="Quero fazer exercícios sobre diagnóstico por imagem",
        esperado="estudo",
        categoria="Prof. Estudo - Exercícios",
        descricao="Solicitação de exercícios práticos",
    )

    tester.add_test(
        mensagem="Monte um teste de residência em cirurgia bucomaxilofacial",
        esperado="estudo",
        categoria="Prof. Estudo - Residência",
        descricao="Teste para residência médica",
    )

    # ========================================================================
    # CATEGORIA 3: DR. REDATOR (odonto-write) - Escrita Acadêmica
    # ========================================================================

    tester.add_test(
        mensagem="Preciso de ajuda para escrever meu TCC sobre implantodontia",
        esperado="redator",
        categoria="Dr. Redator - TCC",
        descricao="Elaboração de TCC",
    )

    tester.add_test(
        mensagem="Como estruturar um artigo científico no formato IMRAD?",
        esperado="redator",
        categoria="Dr. Redator - Artigo",
        descricao="Estruturação de artigo científico",
    )

    tester.add_test(
        mensagem="Revise este trecho da minha introdução de monografia",
        esperado="redator",
        categoria="Dr. Redator - Revisão",
        descricao="Revisão de texto acadêmico",
    )

    tester.add_test(
        mensagem="Qual metodologia usar para pesquisa clínica em ortodontia?",
        esperado="redator",
        categoria="Dr. Redator - Metodologia",
        descricao="Orientação metodológica",
    )

    tester.add_test(
        mensagem="Formate estas referências em ABNT para meu trabalho",
        esperado="redator",
        categoria="Dr. Redator - Formatação",
        descricao="Formatação de referências",
    )

    # ========================================================================
    # CATEGORIA 4: ODONTO VISION (odonto-vision) - Análise de Imagens
    # ========================================================================

    tester.add_test(
        mensagem="Analise esta radiografia panorâmica",
        esperado="imagem",
        categoria="Odonto Vision - Radiografia",
        descricao="Análise de radiografia",
    )

    tester.add_test(
        mensagem="O que você vê nesta imagem intraoral?",
        tem_imagem=True,
        esperado="imagem",
        categoria="Odonto Vision - Com Imagem",
        descricao="Análise com imagem anexada",
    )

    tester.add_test(
        mensagem="Interprete este raio-x periapical",
        esperado="imagem",
        categoria="Odonto Vision - Raio-X",
        descricao="Interpretação de raio-x",
    )

    tester.add_test(
        mensagem="Diagnóstico por imagem de lesão cariosa",
        esperado="imagem",
        categoria="Odonto Vision - Diagnóstico",
        descricao="Diagnóstico através de imagem",
    )

    # ========================================================================
    # CATEGORIA 5: CASOS AMBÍGUOS E MULTI-AGENTE
    # ========================================================================

    tester.add_test(
        mensagem="Preciso pesquisar artigos e criar questões sobre implantes",
        esperado="equipe",
        categoria="Multi-Agente - Pesquisa + Questões",
        descricao="Requer tanto Dr. Ciência quanto Prof. Estudo",
    )

    tester.add_test(
        mensagem="Escreva um TCC com base em pesquisa científica sobre periodontia",
        esperado="equipe",
        categoria="Multi-Agente - Pesquisa + Redação",
        descricao="Requer Dr. Ciência + Dr. Redator",
    )

    tester.add_test(
        mensagem="Analise esta imagem e crie questões sobre o caso",
        tem_imagem=True,
        esperado="equipe",
        categoria="Multi-Agente - Imagem + Questões",
        descricao="Requer Odonto Vision + Prof. Estudo",
    )

    tester.add_test(
        mensagem="Oi, tudo bem?",
        esperado="ciencia",
        categoria="Caso Ambíguo - Saudação",
        descricao="Mensagem genérica - deve usar fallback (ciencia)",
    )

    tester.add_test(
        mensagem="Qual a melhor técnica para restauração de dente?",
        esperado="ciencia",
        categoria="Caso Ambíguo - Pergunta Técnica",
        descricao="Pergunta técnica geral - fallback para ciencia",
    )

    # ========================================================================
    # CATEGORIA 6: TESTES DE KEYWORDS ESPECÍFICAS
    # ========================================================================

    tester.add_test(
        mensagem="meta-análise sobre eficácia do flúor",
        esperado="ciencia",
        categoria="Keyword - Meta-análise",
        descricao="Keyword específica de pesquisa científica",
    )

    tester.add_test(
        mensagem="questão dissertativa sobre anatomia dental",
        esperado="estudo",
        categoria="Keyword - Dissertativa",
        descricao="Keyword específica de avaliação",
    )

    tester.add_test(
        mensagem="abstract do meu paper sobre biomateriais",
        esperado="redator",
        categoria="Keyword - Abstract",
        descricao="Keyword específica de escrita acadêmica",
    )

    # ========================================================================
    # CATEGORIA 7: TESTES DE PRIORIZAÇÃO
    # ========================================================================

    tester.add_test(
        mensagem="Pesquise estudos e formate as citações em Vancouver",
        esperado="equipe",  # Múltiplos matches altos
        categoria="Priorização - Multi-keywords",
        descricao="Múltiplas keywords de diferentes agentes",
    )

    tester.add_test(
        mensagem="Veja esta foto de lesão oral",
        tem_imagem=True,
        esperado="imagem",
        categoria="Priorização - Imagem tem prioridade",
        descricao="Imagem deve ter prioridade sobre outras keywords",
    )


def main():
    """Função principal"""
    tester = RoutingTester()

    # Configurar testes
    setup_comprehensive_tests(tester)

    # Executar testes
    passed, failed, taxa = tester.run_tests(verbose=True)

    # Análise crítica
    tester.analyze_routing_logic()

    # Conclusão
    print("\n" + "=" * 80)
    print("CONCLUSÃO DA ANÁLISE")
    print("=" * 80 + "\n")

    if taxa >= 90:
        print("✓ Sistema de roteamento está funcionando EXCELENTEMENTE!")
        print(f"  Taxa de sucesso: {taxa:.1f}%")
    elif taxa >= 75:
        print(
            "⚠ Sistema de roteamento está funcionando BEM, mas há espaço para melhorias."
        )
        print(f"  Taxa de sucesso: {taxa:.1f}%")
    else:
        print("✗ Sistema de roteamento precisa de ATENÇÃO URGENTE!")
        print(f"  Taxa de sucesso: {taxa:.1f}%")

    print("\nPróximos Passos Recomendados:")
    print("  1. Revisar casos que falharam e ajustar keywords")
    print("  2. Implementar testes automatizados no CI/CD")
    print("  3. Adicionar logging detalhado das decisões de roteamento")
    print("  4. Coletar feedback real dos usuários sobre precisão do roteamento")
    print("  5. Considerar ML para aprender padrões de roteamento ao longo do tempo\n")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
