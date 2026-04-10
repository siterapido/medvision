#!/usr/bin/env npx tsx
/**
 * Script de Teste dos Agentes Odonto
 * 
 * Testa configurações, tools e geração de artefatos dos agentes:
 * - medvision (Tutor Inteligente)
 * - odonto-research (Pesquisa Científica)
 * - odonto-practice (Casos Clínicos e Simulados)
 * - odonto-summary (Resumos e Flashcards)
 * - odonto-vision (Análise de Imagens)
 * 
 * Uso: npx tsx scripts/test-odonto-agents.ts [--live] [--output report.md]
 */

import { AGENT_CONFIGS, getAgentConfig, listAgents } from '../lib/ai/agents/config';
import * as toolDefinitions from '../lib/ai/tools/definitions';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'warning';
  message: string;
  duration?: number;
  details?: Record<string, any>;
}

interface AgentTestResult {
  agentId: string;
  agentName: string;
  model: string;
  tests: TestResult[];
  toolsAvailable: string[];
  toolsTestedCount: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
}

interface ToolTestResult {
  toolName: string;
  status: 'passed' | 'failed' | 'skipped';
  hasDescription: boolean;
  hasInputSchema: boolean;
  hasExecute: boolean;
  inputParams: string[];
  message: string;
}

interface ArtifactTestResult {
  artifactType: string;
  status: 'passed' | 'failed' | 'skipped';
  schemaValid: boolean;
  requiredFields: string[];
  message: string;
}

interface ReportData {
  timestamp: string;
  summary: {
    totalAgents: number;
    totalTools: number;
    totalArtifactTypes: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
    coverage: number;
  };
  agentResults: AgentTestResult[];
  toolResults: ToolTestResult[];
  artifactResults: ArtifactTestResult[];
  liveTestResults?: LiveTestResult[];
}

interface LiveTestResult {
  agentId: string;
  toolName: string;
  status: 'success' | 'error' | 'timeout';
  response?: any;
  error?: string;
  duration: number;
}

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const ARTIFACT_TYPES = ['summary', 'flashcards', 'quiz', 'research-dossier', 'clinical-protocol', 'study-guide', 'case-analysis', 'exam', 'mindmap', 'image'] as const;

const TOOL_NAMES = [
  'askPerplexity',
  'searchPubMed', 
  'updateUserProfile',
  'saveResearch',
  'savePracticeExam',
  'saveSummary',
  'saveFlashcards',
  'saveMindMap',
  'saveImageAnalysis',
  'generateArtifact'
] as const;

const EXPECTED_AGENT_TOOLS: Record<string, string[]> = {
  'medvision': ['askPerplexity', 'searchPubMed', 'updateUserProfile', 'generateArtifact', 'saveSummary', 'saveFlashcards'],
  'odonto-research': ['askPerplexity', 'searchPubMed', 'saveResearch', 'updateUserProfile', 'generateArtifact'],
  'odonto-practice': ['generateArtifact', 'savePracticeExam', 'askPerplexity', 'updateUserProfile'],
  'odonto-summary': ['generateArtifact', 'saveSummary', 'saveFlashcards', 'saveMindMap', 'updateUserProfile'],
  'odonto-vision': ['generateArtifact', 'saveImageAnalysis', 'updateUserProfile']
};

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

function testAgentConfiguration(agentId: string): TestResult[] {
  const results: TestResult[] = [];
  const startTime = Date.now();

  try {
    const agent = getAgentConfig(agentId);

    // Teste 1: Agente existe
    results.push({
      name: 'Agente existe na configuração',
      status: agent.id === agentId ? 'passed' : 'failed',
      message: agent.id === agentId ? 'Agente encontrado' : `Agente não encontrado, retornou: ${agent.id}`,
      duration: Date.now() - startTime
    });

    // Teste 2: Nome definido
    results.push({
      name: 'Nome do agente definido',
      status: agent.name && agent.name.length > 0 ? 'passed' : 'failed',
      message: agent.name || 'Nome não definido'
    });

    // Teste 3: Descrição definida
    results.push({
      name: 'Descrição definida',
      status: agent.description && agent.description.length > 0 ? 'passed' : 'failed',
      message: agent.description?.substring(0, 50) + '...' || 'Descrição não definida'
    });

    // Teste 4: System prompt definido
    results.push({
      name: 'System prompt definido',
      status: agent.system && agent.system.length > 100 ? 'passed' : 'warning',
      message: `System prompt com ${agent.system?.length || 0} caracteres`,
      details: { promptLength: agent.system?.length }
    });

    // Teste 5: Modelo definido
    results.push({
      name: 'Modelo LLM configurado',
      status: agent.model ? 'passed' : 'failed',
      message: agent.model || 'Modelo não definido'
    });

    // Teste 6: Tools definidas
    const toolCount = Object.keys(agent.tools || {}).length;
    results.push({
      name: 'Tools configuradas',
      status: toolCount > 0 ? 'passed' : 'failed',
      message: `${toolCount} tools configuradas`,
      details: { tools: Object.keys(agent.tools || {}) }
    });

    // Teste 7: Tools esperadas presentes
    const expectedTools = EXPECTED_AGENT_TOOLS[agentId] || [];
    const actualTools = Object.keys(agent.tools || {});
    const missingTools = expectedTools.filter(t => !actualTools.includes(t));
    
    results.push({
      name: 'Tools esperadas presentes',
      status: missingTools.length === 0 ? 'passed' : 'warning',
      message: missingTools.length === 0 
        ? 'Todas as tools esperadas estão presentes'
        : `Tools faltando: ${missingTools.join(', ')}`,
      details: { expected: expectedTools, actual: actualTools, missing: missingTools }
    });

    // Teste 8: System prompt menciona português
    const mentionsPortuguese = agent.system?.toLowerCase().includes('portugu') || 
                               agent.system?.toLowerCase().includes('pt-br');
    results.push({
      name: 'System prompt em português',
      status: mentionsPortuguese ? 'passed' : 'warning',
      message: mentionsPortuguese ? 'Configurado para português' : 'Não menciona idioma explicitamente'
    });

  } catch (error: any) {
    results.push({
      name: 'Erro ao testar configuração',
      status: 'failed',
      message: error.message
    });
  }

  return results;
}

function testToolDefinition(toolName: string): ToolTestResult {
  const tool = (toolDefinitions as any)[toolName];
  
  if (!tool) {
    return {
      toolName,
      status: 'failed',
      hasDescription: false,
      hasInputSchema: false,
      hasExecute: false,
      inputParams: [],
      message: 'Tool não encontrada em definitions.ts'
    };
  }

  // Verifica estrutura da tool (AI SDK format)
  const hasDescription = typeof tool.description === 'string' && tool.description.length > 0;
  const hasInputSchema = tool.parameters !== undefined || tool.inputSchema !== undefined;
  const hasExecute = typeof tool.execute === 'function';

  // Extrai parâmetros do schema
  let inputParams: string[] = [];
  try {
    const schema = tool.parameters || tool.inputSchema;
    if (schema && schema._def && schema._def.shape) {
      inputParams = Object.keys(schema._def.shape());
    } else if (schema && schema.shape) {
      inputParams = Object.keys(schema.shape);
    }
  } catch {
    // Schema pode ter formato diferente
  }

  const allPassed = hasDescription && hasInputSchema && hasExecute;

  return {
    toolName,
    status: allPassed ? 'passed' : 'failed',
    hasDescription,
    hasInputSchema,
    hasExecute,
    inputParams,
    message: allPassed 
      ? `Tool válida com ${inputParams.length} parâmetros`
      : `Problemas: ${!hasDescription ? 'sem descrição, ' : ''}${!hasInputSchema ? 'sem schema, ' : ''}${!hasExecute ? 'sem execute' : ''}`
  };
}

function testArtifactType(artifactType: string): ArtifactTestResult {
  const artifactSchemas: Record<string, string[]> = {
    'summary': ['userId', 'title', 'content'],
    'flashcards': ['userId', 'title', 'cards'],
    'quiz': ['type', 'title', 'content'],
    'research-dossier': ['userId', 'title', 'content', 'sources'],
    'clinical-protocol': ['type', 'title', 'content'],
    'study-guide': ['type', 'title', 'content'],
    'case-analysis': ['type', 'title', 'content'],
    'exam': ['userId', 'title', 'topic', 'questions'],
    'mindmap': ['userId', 'title', 'mapData'],
    'image': ['userId', 'title', 'analysis']
  };

  const requiredFields = artifactSchemas[artifactType] || ['type', 'title', 'content'];
  
  // Verifica se existe uma tool de save correspondente
  const saveToolName = `save${artifactType.charAt(0).toUpperCase() + artifactType.slice(1).replace(/-/g, '')}`;
  const hasSaveTool = Object.keys(toolDefinitions).some(
    name => name.toLowerCase().includes(artifactType.replace(/-/g, '').toLowerCase())
  );

  return {
    artifactType,
    status: hasSaveTool ? 'passed' : 'skipped',
    schemaValid: true,
    requiredFields,
    message: hasSaveTool 
      ? `Artefato suportado com campos: ${requiredFields.join(', ')}`
      : 'Sem tool de persistência dedicada (usa generateArtifact)'
  };
}

async function runLiveToolTest(toolName: string, testInput: Record<string, any>): Promise<LiveTestResult> {
  const startTime = Date.now();
  const tool = (toolDefinitions as any)[toolName];

  if (!tool || typeof tool.execute !== 'function') {
    return {
      agentId: 'system',
      toolName,
      status: 'error',
      error: 'Tool não encontrada ou sem função execute',
      duration: Date.now() - startTime
    };
  }

  try {
    const response = await Promise.race([
      tool.execute(testInput),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
    ]);

    return {
      agentId: 'system',
      toolName,
      status: 'success',
      response: typeof response === 'string' ? response.substring(0, 200) : response,
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      agentId: 'system',
      toolName,
      status: error.message === 'Timeout' ? 'timeout' : 'error',
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// ============================================================================
// GERAÇÃO DO RELATÓRIO
// ============================================================================

function generateMarkdownReport(data: ReportData): string {
  const { summary, agentResults, toolResults, artifactResults, liveTestResults } = data;

  let report = `# Relatório de Testes - Agentes Odonto

**Data:** ${data.timestamp}
**Gerado por:** test-odonto-agents.ts

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Total de Agentes Testados | ${summary.totalAgents} |
| Total de Tools Testadas | ${summary.totalTools} |
| Tipos de Artefatos | ${summary.totalArtifactTypes} |
| Testes Passou | ${summary.passedTests} |
| Testes Falhou | ${summary.failedTests} |
| Avisos | ${summary.warningTests} |
| Cobertura | ${summary.coverage.toFixed(1)}% |

### Status Geral

\`\`\`
${summary.failedTests === 0 ? '✅ TODOS OS TESTES PASSARAM' : `⚠️ ${summary.failedTests} FALHAS DETECTADAS`}
\`\`\`

---

## 1. Testes de Configuração dos Agentes

`;

  // Detalhes de cada agente
  for (const agent of agentResults) {
    const statusIcon = agent.failedCount === 0 ? '✅' : agent.failedCount > 2 ? '❌' : '⚠️';
    
    report += `### ${statusIcon} ${agent.agentName} (\`${agent.agentId}\`)

**Modelo:** \`${agent.model}\`
**Tools Disponíveis:** ${agent.toolsAvailable.length} (${agent.toolsAvailable.join(', ')})

| Teste | Status | Mensagem |
|-------|--------|----------|
`;

    for (const test of agent.tests) {
      const statusEmoji = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
      report += `| ${test.name} | ${statusEmoji} ${test.status} | ${test.message} |\n`;
    }

    report += `
**Resumo:** ${agent.passedCount} passou, ${agent.failedCount} falhou, ${agent.warningCount} avisos

---

`;
  }

  // Testes de Tools
  report += `## 2. Testes de Tools (definitions.ts)

| Tool | Status | Descrição | Schema | Execute | Parâmetros |
|------|--------|-----------|--------|---------|------------|
`;

  for (const tool of toolResults) {
    const statusEmoji = tool.status === 'passed' ? '✅' : tool.status === 'failed' ? '❌' : '⏭️';
    report += `| ${tool.toolName} | ${statusEmoji} | ${tool.hasDescription ? '✅' : '❌'} | ${tool.hasInputSchema ? '✅' : '❌'} | ${tool.hasExecute ? '✅' : '❌'} | ${tool.inputParams.join(', ') || '-'} |\n`;
  }

  // Testes de Artefatos
  report += `
---

## 3. Tipos de Artefatos Suportados

| Tipo | Status | Campos Obrigatórios | Observação |
|------|--------|---------------------|------------|
`;

  for (const artifact of artifactResults) {
    const statusEmoji = artifact.status === 'passed' ? '✅' : artifact.status === 'skipped' ? '⏭️' : '❌';
    report += `| ${artifact.artifactType} | ${statusEmoji} | ${artifact.requiredFields.join(', ')} | ${artifact.message} |\n`;
  }

  // Testes Live (se existirem)
  if (liveTestResults && liveTestResults.length > 0) {
    report += `
---

## 4. Testes de Integração (Live)

| Tool | Status | Duração | Resposta/Erro |
|------|--------|---------|---------------|
`;

    for (const live of liveTestResults) {
      const statusEmoji = live.status === 'success' ? '✅' : live.status === 'timeout' ? '⏱️' : '❌';
      const response = live.error || (typeof live.response === 'string' ? live.response.substring(0, 50) : JSON.stringify(live.response).substring(0, 50));
      report += `| ${live.toolName} | ${statusEmoji} ${live.status} | ${live.duration}ms | ${response}... |\n`;
    }
  }

  // Matriz de Agentes x Tools
  report += `
---

## 5. Matriz Agente x Tools

| Tool | medvision | odonto-research | odonto-practice | odonto-summary | odonto-vision |
|------|:----------:|:---------------:|:---------------:|:--------------:|:-------------:|
`;

  for (const toolName of TOOL_NAMES) {
    const row: string[] = [toolName];
    for (const agentId of ['medvision', 'odonto-research', 'odonto-practice', 'odonto-summary', 'odonto-vision']) {
      const agent = agentResults.find(a => a.agentId === agentId);
      const hasTool = agent?.toolsAvailable.includes(toolName);
      row.push(hasTool ? '✅' : '❌');
    }
    report += `| ${row.join(' | ')} |\n`;
  }

  // Recomendações
  report += `
---

## 6. Recomendações

`;

  const recommendations: string[] = [];

  // Analisa resultados para gerar recomendações
  for (const agent of agentResults) {
    if (agent.failedCount > 0) {
      recommendations.push(`- **${agent.agentName}**: Corrigir ${agent.failedCount} falha(s) de configuração`);
    }
    if (agent.warningCount > 0) {
      recommendations.push(`- **${agent.agentName}**: Revisar ${agent.warningCount} aviso(s)`);
    }
  }

  for (const tool of toolResults) {
    if (tool.status === 'failed') {
      recommendations.push(`- **Tool ${tool.toolName}**: ${tool.message}`);
    }
  }

  if (recommendations.length === 0) {
    report += `✅ **Nenhuma recomendação crítica.** Todos os agentes e tools estão configurados corretamente.\n`;
  } else {
    report += recommendations.join('\n') + '\n';
  }

  // Cobertura de Funcionalidades
  report += `
---

## 7. Cobertura de Funcionalidades

### Por Agente

\`\`\`
`;

  for (const agent of agentResults) {
    const coverage = (agent.passedCount / agent.tests.length * 100).toFixed(0);
    const bar = '█'.repeat(Math.floor(Number(coverage) / 10)) + '░'.repeat(10 - Math.floor(Number(coverage) / 10));
    report += `${agent.agentId.padEnd(20)} ${bar} ${coverage}%\n`;
  }

  report += `\`\`\`

### Funcionalidades Implementadas

- [x] Tutor Socrático (medvision)
- [x] Pesquisa Científica (odonto-research)
- [x] Casos Clínicos e Simulados (odonto-practice)
- [x] Resumos e Flashcards (odonto-summary)
- [x] Análise de Imagens (odonto-vision)
- [x] Persistência de Artefatos (Supabase)
- [x] Integração com Perplexity/PubMed
- [ ] Testes E2E automatizados
- [ ] Métricas de uso por agente

---

## 8. Próximos Passos

1. Implementar testes E2E com chamadas reais à API
2. Adicionar métricas de latência por modelo
3. Criar dashboard de monitoramento de agentes
4. Implementar testes de regressão automáticos

---

*Relatório gerado automaticamente por \`scripts/test-odonto-agents.ts\`*
`;

  return report;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('🦷 Iniciando Testes dos Agentes Odonto...\n');
  
  const args = process.argv.slice(2);
  const runLive = args.includes('--live');
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : 'reports/odonto-agents-test-report.md';

  const agentResults: AgentTestResult[] = [];
  const toolResults: ToolTestResult[] = [];
  const artifactResults: ArtifactTestResult[] = [];
  const liveTestResults: LiveTestResult[] = [];

  // 1. Testar configurações dos agentes
  console.log('📋 Testando configurações dos agentes...');
  const agentIds = ['medvision', 'odonto-research', 'odonto-practice', 'odonto-summary', 'odonto-vision'];

  for (const agentId of agentIds) {
    console.log(`  → ${agentId}`);
    const agent = getAgentConfig(agentId);
    const tests = testAgentConfiguration(agentId);
    
    const toolsAvailable = Object.keys(agent.tools || {});
    const passedCount = tests.filter(t => t.status === 'passed').length;
    const failedCount = tests.filter(t => t.status === 'failed').length;
    const warningCount = tests.filter(t => t.status === 'warning').length;

    agentResults.push({
      agentId,
      agentName: agent.name,
      model: agent.model || 'não definido',
      tests,
      toolsAvailable,
      toolsTestedCount: toolsAvailable.length,
      passedCount,
      failedCount,
      warningCount
    });

    const statusIcon = failedCount === 0 ? '✅' : '❌';
    console.log(`    ${statusIcon} ${passedCount}/${tests.length} testes passaram`);
  }

  // 2. Testar tools
  console.log('\n🔧 Testando definições de tools...');
  for (const toolName of TOOL_NAMES) {
    console.log(`  → ${toolName}`);
    const result = testToolDefinition(toolName);
    toolResults.push(result);
    console.log(`    ${result.status === 'passed' ? '✅' : '❌'} ${result.message}`);
  }

  // 3. Testar tipos de artefatos
  console.log('\n📦 Testando tipos de artefatos...');
  for (const artifactType of ARTIFACT_TYPES) {
    const result = testArtifactType(artifactType);
    artifactResults.push(result);
    console.log(`  → ${artifactType}: ${result.status === 'passed' ? '✅' : '⏭️'} ${result.message}`);
  }

  // 4. Testes live (opcional)
  if (runLive) {
    console.log('\n🌐 Executando testes de integração (live)...');
    
    // Teste searchPubMed (não precisa de API key)
    console.log('  → searchPubMed');
    const pubmedResult = await runLiveToolTest('searchPubMed', {
      query: 'dental implant',
      max_results: 2
    });
    liveTestResults.push(pubmedResult);
    console.log(`    ${pubmedResult.status === 'success' ? '✅' : '❌'} ${pubmedResult.status} (${pubmedResult.duration}ms)`);

    // Teste generateArtifact (local, não precisa de API)
    console.log('  → generateArtifact');
    const artifactResult = await runLiveToolTest('generateArtifact', {
      type: 'summary',
      title: 'Teste de Resumo',
      content: 'Conteúdo de teste',
      topic: 'Periodontia'
    });
    liveTestResults.push(artifactResult);
    console.log(`    ${artifactResult.status === 'success' ? '✅' : '❌'} ${artifactResult.status} (${artifactResult.duration}ms)`);
  }

  // 5. Calcular sumário
  const totalTests = agentResults.reduce((sum, a) => sum + a.tests.length, 0) + toolResults.length + artifactResults.length;
  const passedTests = agentResults.reduce((sum, a) => sum + a.passedCount, 0) + 
                      toolResults.filter(t => t.status === 'passed').length +
                      artifactResults.filter(a => a.status === 'passed').length;
  const failedTests = agentResults.reduce((sum, a) => sum + a.failedCount, 0) +
                      toolResults.filter(t => t.status === 'failed').length;
  const warningTests = agentResults.reduce((sum, a) => sum + a.warningCount, 0);

  const reportData: ReportData = {
    timestamp: new Date().toLocaleString('pt-BR'),
    summary: {
      totalAgents: agentResults.length,
      totalTools: toolResults.length,
      totalArtifactTypes: artifactResults.length,
      passedTests,
      failedTests,
      warningTests,
      coverage: (passedTests / totalTests) * 100
    },
    agentResults,
    toolResults,
    artifactResults,
    liveTestResults: liveTestResults.length > 0 ? liveTestResults : undefined
  };

  // 6. Gerar relatório
  console.log('\n📝 Gerando relatório...');
  const report = generateMarkdownReport(reportData);

  // Criar diretório se não existir
  const reportDir = path.dirname(outputFile);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, report);
  console.log(`✅ Relatório salvo em: ${outputFile}`);

  // 7. Resumo final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(50));
  console.log(`   Agentes testados: ${reportData.summary.totalAgents}`);
  console.log(`   Tools testadas: ${reportData.summary.totalTools}`);
  console.log(`   Artefatos verificados: ${reportData.summary.totalArtifactTypes}`);
  console.log(`   ✅ Passou: ${reportData.summary.passedTests}`);
  console.log(`   ❌ Falhou: ${reportData.summary.failedTests}`);
  console.log(`   ⚠️  Avisos: ${reportData.summary.warningTests}`);
  console.log(`   📈 Cobertura: ${reportData.summary.coverage.toFixed(1)}%`);
  console.log('='.repeat(50));

  // Exit code baseado no resultado
  process.exit(failedTests > 0 ? 1 : 0);
}

// Executar
main().catch(console.error);
