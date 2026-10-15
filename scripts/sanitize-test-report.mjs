// Rewrites absolute paths in the Jest JSON report to repo-relative ones (no local home paths in the repo).
import { readFileSync, writeFileSync } from 'node:fs';

const reportPath = process.argv[2] ?? 'docs/test-results/jest-results.json';
const root = `${process.cwd()}/`;
const report = readFileSync(reportPath, 'utf8').split(root).join('');

writeFileSync(reportPath, report);
console.log(`Sanitized ${reportPath}`);
