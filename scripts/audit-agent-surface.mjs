import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', 'dist', 'coverage']);
const textFile = /\.(md|mdx|txt|yml|yaml|json|toml|ini|cfg|sh|bash|ps1)$/i;
const agentFile = /(^|\/)(AGENTS\.md|CLAUDE\.md|GEMINI\.md|llms\.txt|llms-full\.txt)$/i;
const shellFence = /^(?:bash|sh|shell|zsh|fish|powershell|pwsh|ps|cmd)$/i;
const command = /^(?:npm\s+(?:install|i|exec)|npx(?:\s|$)|pnpm\s+(?:add|install|dlx)|yarn\s+(?:add|install|dlx)|pip(?:3)?\s+install|pipx\s+install)\b/i;
const inlineCommand = /`\s*(?:npm\s+(?:install|i|exec)|npx(?:\s|$)|pnpm\s+(?:add|install|dlx)|yarn\s+(?:add|install|dlx)|pip(?:3)?\s+install|pipx\s+install)\b[^`]*`/i;
const promptCommand = /^(?:[$#]\s+)?(?:npm\s+(?:install|i|exec)|npx(?:\s|$)|pnpm\s+(?:add|install|dlx)|yarn\s+(?:add|install|dlx)|pip(?:3)?\s+install|pipx\s+install)\b/i;
const remoteExecution = /(?:\b(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash|zsh|fish)|\beval\s+["'`]\s*\$\(\s*(?:curl|wget)\b[^\n)]*\)\s*["'`])/i;
const imperative = /\b(?:run|execute|install|copy\s+and\s+paste|before\s+continuing|required\s+command|automatically\s+install|execute\s+the\s+following|run\s+this\s+command)\b/i;
const defensive = /\b(?:never\s+execute|do\s+not\s+(?:run|execute|install)|must\s+not|prohibited|blocked\s+patterns?|forbidden|require\s+human\s+approval|requiring\s+independent\s+verification|independently\s+verify)\b|\b(?:proposals?|examples?)\b[^\n]{0,120}\b(?:verify|verification)\b/i;
const explanatory = /\b(?:security\s+(?:documentation|guidance|policy)|(?:dangerous|risk|threat|attack|malicious|unsafe))\b/i;
const suspiciousUnicode = /[\u202A-\u202E\u2066-\u2069\u200B-\u200D\uFEFF]/;

function excerpt(line) {
  return line.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\u202A-\u202E\u2066-\u2069\uFEFF]/g, '�').slice(0, 180);
}

function finding(lineNumber, ruleId, context, line) {
  return { lineNumber, ruleId, context, excerpt: excerpt(line) };
}

export function auditText(text) {
  const lines = text.split(/\r?\n/);
  const findings = [];
  let inFence = false;
  let shellLikeFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const lineNumber = index + 1;

    if (suspiciousUnicode.test(line)) {
      findings.push(finding(lineNumber, 'AGENT-UNICODE-CONTROL', 'hidden-unicode', line));
    }

    const fence = trimmed.match(/^```\s*([\w-]*)\s*$/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        shellLikeFence = shellFence.test(fence[1] || '');
      } else {
        inFence = false;
        shellLikeFence = false;
      }
      continue;
    }

    if (inFence && !shellLikeFence) continue;

    const previous = lines[index - 1]?.trim() ?? '';
    const hasCommand = command.test(trimmed);
    const hasInlineCommand = inlineCommand.test(line);
    const hasPromptCommand = promptCommand.test(trimmed);
    const hasRemoteExecution = remoteExecution.test(line);
    const previousIsDefensive = defensive.test(previous) || explanatory.test(previous);
    const imperativeContext = imperative.test(line) || (imperative.test(previous) && !previousIsDefensive);
    const defensiveContext = defensive.test(line) || explanatory.test(line);
    const commandLike = shellLikeFence || (!inFence && (hasPromptCommand || hasInlineCommand || hasCommand));
    const actionableImperative = /(?:\brun\b|\bexecute\b|\binstall\b|copy\s+and\s+paste|automatically\s+install|required\s+command|execute\s+the\s+following|run\s+this\s+command)/i.test(line) || /(?:\brun\b|\bexecute\b|\binstall\b|copy\s+and\s+paste|automatically\s+install|required\s+command|execute\s+the\s+following|run\s+this\s+command)/i.test(previous);

    if (shellLikeFence && hasRemoteExecution) {
      findings.push(finding(lineNumber, 'AGENT-REMOTE-EXEC', 'shell-fence', line));
      continue;
    }

    if (shellLikeFence && hasCommand) {
      findings.push(finding(lineNumber, 'AGENT-PACKAGE-COMMAND', 'shell-fence', line));
      continue;
    }

    if (hasRemoteExecution && !defensiveContext) {
      findings.push(finding(lineNumber, 'AGENT-REMOTE-EXEC', imperativeContext ? 'imperative' : 'command-like', line));
      continue;
    }

    if (commandLike && !defensiveContext) {
      findings.push(finding(lineNumber, 'AGENT-PACKAGE-COMMAND', hasPromptCommand ? 'command-position' : imperativeContext ? 'imperative' : 'inline-command', line));
      continue;
    }

    if (actionableImperative && !defensiveContext && (hasCommand || hasInlineCommand || hasPromptCommand)) {
      findings.push(finding(lineNumber, 'AGENT-PACKAGE-COMMAND', 'imperative', line));
      continue;
    }

    if (actionableImperative && !defensiveContext && !hasCommand && !hasInlineCommand && !hasPromptCommand && /\b(?:package|tool|dependency|utility)\b/i.test(line)) {
      findings.push(finding(lineNumber, 'AGENT-PACKAGE-COMMAND', 'imperative', line));
    }
  }

  return findings;
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (textFile.test(entry.name)) files.push(full);
  }
  return files;
}

export async function auditRepository(baseDir = root) {
  const findings = [];
  for (const full of await walk(baseDir)) {
    const path = relative(baseDir, full).replaceAll('\\', '/');
    if (!agentFile.test(path)) continue;
    const text = await readFile(full, 'utf8');
    for (const item of auditText(text)) findings.push({ path, ...item });
  }
  return findings;
}

async function main() {
  const findings = await auditRepository();
  if (findings.length) {
    console.error('Agent supply-chain audit: REVIEW REQUIRED');
    for (const item of findings) {
      console.error(`- ${item.path}:${item.lineNumber} [${item.ruleId}] ${item.context}: ${item.excerpt}`);
    }
    process.exitCode = 1;
  } else {
    console.log('Agent supply-chain audit: no high-risk actionable commands found in AI-facing documentation.');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();