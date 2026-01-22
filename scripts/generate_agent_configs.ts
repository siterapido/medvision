
import fs from 'fs';
import path from 'path';

const agentsDir = path.join(process.cwd(), '.context/agents');
const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md') && f !== 'README.md');

console.log('import { askPerplexity } from "../tools/definitions";');
console.log('import { AgentConfig } from "./config";');
console.log('\nexport const DEV_AGENT_CONFIGS: Record<string, AgentConfig> = {');

files.forEach(file => {
  const content = fs.readFileSync(path.join(agentsDir, file), 'utf-8');
  
  // Extract frontmatter
  const match = content.match(/---\n([\s\S]+?)\n---/);
  if (!match) return;
  
  const frontmatter = match[1];
  const nameMatch = frontmatter.match(/name: (.*)/);
  const descMatch = frontmatter.match(/description: (.*)/);
  
  if (!nameMatch || !descMatch) return;
  
  const name = nameMatch[1].trim();
  const description = descMatch[1].trim();
  const id = path.basename(file, '.md');

  // Skip if it's an odonto agent (already exists manually)
  if (id.startsWith('odonto-')) return;

  // Clean content for system prompt
  let systemPrompt = content.replace(/---\n[\s\S]+?\n---/, '').trim();
  
  // Cut off at "Repository Starting Points" or "Key Files" to avoid huge context dumps
  const cutOffIndex = systemPrompt.indexOf('## Repository Starting Points');
  if (cutOffIndex !== -1) {
      systemPrompt = systemPrompt.substring(0, cutOffIndex).trim();
  }
  
  const cutOffIndex2 = systemPrompt.indexOf('## Key Files');
  if (cutOffIndex2 !== -1) {
      systemPrompt = systemPrompt.substring(0, cutOffIndex2).trim();
  }

  // Escape backticks for template literal
  systemPrompt = systemPrompt.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

  console.log(`  "${id}": {`);
  console.log(`    id: "${id}",`);
  console.log(`    name: "${name}",`);
  console.log(`    description: "${description}",`);
  console.log(`    system: \`${systemPrompt}\`,`);
  console.log('    tools: { askPerplexity },');
  console.log('  },');
});

console.log('};');
