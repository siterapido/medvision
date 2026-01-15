#!/usr/bin/env python3
"""
Demonstração Visual do Sistema de Roteamento - Odonto Suite
============================================================

Este script fornece uma interface interativa para testar o roteamento
de mensagens em tempo real.
"""

import sys
from typing import Optional, Dict, Any


def rotear_para_agente_apropriado(
    mensagem_usuario: str,
    tem_imagem: bool = False,
    contexto: Optional[Dict[str, Any]] = None
) -> str:
    """Função de roteamento (cópia da implementação real)"""
    mensagem_lower = mensagem_usuario.lower()
    
    keywords_ciencia = [
        'pesquisar', 'pesquisa', 'artigos', 'artigo', 'evidências', 'evidência',
        'pubmed', 'estudos', 'estudo', 'literatura', 'científico', 'científica',
        'revisão sistemática', 'meta-análise', 'rct', 'ensaio clínico',
        'referências', 'citação', 'citar', 'fonte', 'fontes'
    ]
    
    keywords_estudo = [
        'questão', 'questões', 'simulado', 'simulados', 'prova', 'teste',
        'exercício', 'exercícios', 'avaliar', 'avaliação', 'gabarito',
        'enade', 'residência', 'concurso', 'múltipla escolha', 'dissertativa'
    ]
    
    keywords_redator = [
        'tcc', 'monografia', 'artigo científico', 'paper', 'escrever',
        'escrita', 'metodologia', 'imrad', 'abstract', 'resumo',
        'introdução', 'discussão', 'conclusão', 'revisão de literatura',
        'revisar texto', 'corrigir', 'formatação', 'abnt', 'vancouver', 'apa'
    ]
    
    keywords_imagem = [
        'imagem', 'radiografia', 'raio-x', 'raio x', 'rx', 'foto',
        'analisar imagem', 'interpretar', 'diagnóstico por imagem'
    ]
    
    matches_ciencia = sum(1 for kw in keywords_ciencia if kw in mensagem_lower)
    matches_estudo = sum(1 for kw in keywords_estudo if kw in mensagem_lower)
    matches_redator = sum(1 for kw in keywords_redator if kw in mensagem_lower)
    matches_imagem = sum(1 for kw in keywords_imagem if kw in mensagem_lower)
    
    if tem_imagem or matches_imagem > 0:
        if matches_ciencia > 0 or matches_estudo > 0:
            return 'equipe'
        return 'imagem'
    
    high_matches = sum([
        matches_ciencia >= 2,
        matches_estudo >= 2,
        matches_redator >= 2
    ])
    
    if high_matches >= 2:
        return 'equipe'
    
    max_matches = max(matches_ciencia, matches_estudo, matches_redator)
    
    if max_matches == 0:
        return 'ciencia'
    
    if matches_ciencia == max_matches:
        return 'ciencia'
    elif matches_estudo == max_matches:
        return 'estudo'
    elif matches_redator == max_matches:
        return 'redator'
    else:
        return 'ciencia'


def exibir_resultado_detalhado(mensagem: str, tem_imagem: bool = False):
    """Exibe análise detalhada do roteamento"""
    mensagem_lower = mensagem.lower()
    
    # Contadores
    keywords_ciencia = [
        'pesquisar', 'pesquisa', 'artigos', 'artigo', 'evidências', 'evidência',
        'pubmed', 'estudos', 'estudo', 'literatura', 'científico', 'científica',
        'revisão sistemática', 'meta-análise', 'rct', 'ensaio clínico',
        'referências', 'citação', 'citar', 'fonte', 'fontes'
    ]
    
    keywords_estudo = [
        'questão', 'questões', 'simulado', 'simulados', 'prova', 'teste',
        'exercício', 'exercícios', 'avaliar', 'avaliação', 'gabarito',
        'enade', 'residência', 'concurso', 'múltipla escolha', 'dissertativa'
    ]
    
    keywords_redator = [
        'tcc', 'monografia', 'artigo científico', 'paper', 'escrever',
        'escrita', 'metodologia', 'imrad', 'abstract', 'resumo',
        'introdução', 'discussão', 'conclusão', 'revisão de literatura',
        'revisar texto', 'corrigir', 'formatação', 'abnt', 'vancouver', 'apa'
    ]
    
    keywords_imagem = [
        'imagem', 'radiografia', 'raio-x', 'raio x', 'rx', 'foto',
        'analisar imagem', 'interpretar', 'diagnóstico por imagem'
    ]
    
    matches_ciencia = [kw for kw in keywords_ciencia if kw in mensagem_lower]
    matches_estudo = [kw for kw in keywords_estudo if kw in mensagem_lower]
    matches_redator = [kw for kw in keywords_redator if kw in mensagem_lower]
    matches_imagem = [kw for kw in keywords_imagem if kw in mensagem_lower]
    
    resultado = rotear_para_agente_apropriado(mensagem, tem_imagem)
    
    # Mapear para nomes bonitos
    nomes_agentes = {
        'ciencia': '🔬 Odonto Research (Dr. Ciência)',
        'estudo': '📚 Odonto Practice (Prof. Estudo)',
        'redator': '✍️ Odonto Write (Dr. Redator)',
        'imagem': '🖼️ Odonto Vision',
        'equipe': '👥 Odonto Flow (Equipe Multi-Agente)'
    }
    
    print("\n" + "=" * 80)
    print("📋 ANÁLISE DE ROTEAMENTO")
    print("=" * 80)
    print(f"\n💬 Mensagem: {mensagem}")
    print(f"🖼️  Tem Imagem: {'Sim' if tem_imagem else 'Não'}")
    
    print(f"\n🎯 ROTEADO PARA: {nomes_agentes.get(resultado, resultado)}")
    
    print("\n📊 ANÁLISE DE KEYWORDS:")
    print(f"  🔬 Dr. Ciência:  {len(matches_ciencia)} matches")
    if matches_ciencia:
        print(f"     Keywords: {', '.join(matches_ciencia[:5])}")
    
    print(f"  📚 Prof. Estudo: {len(matches_estudo)} matches")
    if matches_estudo:
        print(f"     Keywords: {', '.join(matches_estudo[:5])}")
    
    print(f"  ✍️  Dr. Redator:  {len(matches_redator)} matches")
    if matches_redator:
        print(f"     Keywords: {', '.join(matches_redator[:5])}")
    
    print(f"  🖼️  Odonto Vision: {len(matches_imagem)} matches")
    if matches_imagem:
        print(f"     Keywords: {', '.join(matches_imagem[:5])}")
    
    print("\n" + "=" * 80 + "\n")


def modo_interativo():
    """Modo interativo para testar mensagens"""
    print("\n" + "=" * 80)
    print("🤖 MODO INTERATIVO - TESTE DE ROTEAMENTO")
    print("=" * 80)
    print("\nDigite mensagens para testar o roteamento.")
    print("Comandos especiais:")
    print("  - Digite 'imagem' antes da mensagem para simular envio com imagem")
    print("  - Digite 'sair' para encerrar")
    print("=" * 80 + "\n")
    
    while True:
        try:
            entrada = input("💬 Sua mensagem: ").strip()
            
            if not entrada:
                continue
                
            if entrada.lower() == 'sair':
                print("\n👋 Até logo!\n")
                break
            
            tem_imagem = False
            if entrada.lower().startswith('imagem '):
                tem_imagem = True
                entrada = entrada[7:].strip()
            
            if entrada:
                exibir_resultado_detalhado(entrada, tem_imagem)
        
        except KeyboardInterrupt:
            print("\n\n👋 Até logo!\n")
            break
        except EOFError:
            print("\n\n👋 Até logo!\n")
            break


def modo_demonstracao():
    """Modo demonstração com exemplos pré-definidos"""
    print("\n" + "=" * 80)
    print("🎬 MODO DEMONSTRAÇÃO - EXEMPLOS DE ROTEAMENTO")
    print("=" * 80 + "\n")
    
    exemplos = [
        ("Quais são os estudos mais recentes sobre implantes dentários?", False),
        ("Crie 10 questões de múltipla escolha sobre periodontia", False),
        ("Preciso de ajuda para escrever meu TCC sobre implantodontia", False),
        ("Analise esta radiografia panorâmica", True),
        ("Pesquise artigos e crie questões sobre o tema", False),
        ("Oi, tudo bem?", False),
    ]
    
    for i, (mensagem, tem_imagem) in enumerate(exemplos, 1):
        print(f"\n{'─' * 80}")
        print(f"EXEMPLO {i}/{len(exemplos)}")
        exibir_resultado_detalhado(mensagem, tem_imagem)
        
        if i < len(exemplos):
            input("Pressione ENTER para o próximo exemplo...")
    
    print("\n" + "=" * 80)
    print("✅ Demonstração concluída!")
    print("=" * 80 + "\n")


def main():
    """Função principal"""
    print("\n" + "🏥" * 40)
    print("            ODONTO SUITE - SISTEMA DE ROTEAMENTO DE AGENTES")
    print("🏥" * 40)
    
    print("\nEscolha o modo:")
    print("  1. Modo Interativo (teste suas próprias mensagens)")
    print("  2. Modo Demonstração (exemplos pré-definidos)")
    print("  3. Sair")
    
    while True:
        try:
            escolha = input("\nSua escolha (1/2/3): ").strip()
            
            if escolha == '1':
                modo_interativo()
                break
            elif escolha == '2':
                modo_demonstracao()
                break
            elif escolha == '3':
                print("\n👋 Até logo!\n")
                break
            else:
                print("❌ Opção inválida. Digite 1, 2 ou 3.")
        except KeyboardInterrupt:
            print("\n\n👋 Até logo!\n")
            break


if __name__ == "__main__":
    main()
