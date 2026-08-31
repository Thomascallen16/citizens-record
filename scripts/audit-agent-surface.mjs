import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', 'dist', 'coverage']);
const textFile = /\.(md|mdx|txt|yml|yaml|json|toml|ini|cfg|sh|bash|ps1)$/i;
const agentFile = /(^|\/)(AGENTS\.md|CLAUDE\.md|GEMINI\.md|llms\.txt|llms-full\.txt)$/i;
const install = /(^|[\s`])(?:npm\s+(?:install|i)|npm\s+exec|npx(?:\s|$)|pnpm\s+(?:add|install|dlx)|yarn\s+(?:add|install|dlx)|pip(?:3)?\s+install|pipx\s+install|(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash))/im;
const findings = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (textFile.test(entry.name)) {
      const text = await readFile(full, 'utf8');
      const path = relative(root, full);
      if (agentFile.test(path) && install.test(text)) findings.push(`${path}: executable installation command in AI-facing file`);
      if (/\b(?:llms\.txt|llms-full\.txt)\b/i.test(text) && install.test(text)) findings.push(`${path}: machine-readable AI documentation plus installation command`);
    }
  }
}
await walk(root);
if (findings.length) {
  console.error('Agent supply-chain audit: REVIEW REQUIRED');
  findings.forEach((x) => console.error(`- ${x}`));
  process.exitCode = 1;
} else console.log('Agent supply-chain audit: no high-risk installation commands found in AI-facing documentation.');
