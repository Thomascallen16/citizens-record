import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', 'dist', 'coverage']);
const textFile = /\.(md|mdx|txt|yml|yaml|json|toml|ini|cfg|sh|bash|ps1)$/i;
const agentFile = /(^|\/)(AGENTS\.md|CLAUDE\.md|GEMINI\.md|llms\.txt|llms-full\.txt)$/i;
const install = /(?:^|[\s`])(?:npm\s+(?:install|i)|npm\s+exec|npx(?:\s|$)|pnpm\s+(?:add|install|dlx)|yarn\s+(?:add|install|dlx)|pip(?:3)?\s+install|pipx\s+install|(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash))/i;
const commandStart = /^(?:[$>#]\s*)?(?:npm\s+(?:install|i)|npm\s+exec|npx(?:\s|$)|pnpm\s+(?:add|install|dlx)|yarn\s+(?:add|install|dlx)|pip(?:3)?\s+install|pipx\s+install|(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash))/i;
const imperative = /^(?:[-*]\s*)?(?:(?:agent|assistant)\s+(?:must|should|shall|needs to)\s+)?(?:run|execute|install|use|invoke|automatically|please\s+(?:run|execute|install|use|invoke))\b/i;
const defensive = /\b(?:never|do not|don't|must not|should not|prohibited|forbidden|disallowed|not permitted|requires? (?:human|independent|manual) (?:review|verification|approval)|requiring independent verification|without (?:human|explicit) (?:review|approval|authorization))\b/i;

function isActionableInstallLine(line, inCodeFence) {
  if (!install.test(line)) return false;
  const trimmed = line.trim();
  if (inCodeFence || commandStart.test(trimmed)) return true;
  if (defensive.test(trimmed)) return false;
  return imperative.test(trimmed);
}

export function findActionableInstallCommands(text) {
  const findings = [];
  let inCodeFence = false;
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (/^\s*(```|~~~)/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (isActionableInstallLine(line, inCodeFence)) findings.push(index + 1);
  }
  return findings;
}

async function walk(dir) {
  const findings = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findings.push(...await walk(full));
    else if (textFile.test(entry.name)) {
      const text = await readFile(full, 'utf8');
      const path = relative(root, full);
      const lines = findActionableInstallCommands(text);
      if (agentFile.test(path)) {
        findings.push(...lines.map((line) => `${path}:${line}: executable installation command in AI-facing file`));
      }
      if (/\b(?:llms\.txt|llms-full\.txt)\b/i.test(text) && lines.length) {
        findings.push(`${path}: machine-readable AI documentation plus installation command`);
      }
    }
  }
  return findings;
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const findings = await walk(root);
  if (findings.length) {
    console.error('Agent supply-chain audit: REVIEW REQUIRED');
    findings.forEach((x) => console.error(`- ${x}`));
    process.exitCode = 1;
  } else console.log('Agent supply-chain audit: no high-risk installation commands found in AI-facing documentation.');
}
