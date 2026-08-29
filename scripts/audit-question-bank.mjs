import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { auditQuestionBank } from '../lib/questionBankValidator.js';
import { questionBankEntries } from '../lib/questionBankSources.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function isReadableImage(source) {
  if (/^(?:data:|https?:|\/\/)/i.test(source)) {
    return true;
  }
  const localPath = path.resolve(repositoryRoot, source.replace(/^\.\//, '').split(/[?#]/)[0]);
  if (!localPath.startsWith(`${repositoryRoot}${path.sep}`) || !fs.existsSync(localPath)) {
    return false;
  }
  const stat = fs.statSync(localPath);
  if (!stat.isFile() || stat.size < 8) {
    return false;
  }
  const header = fs.readFileSync(localPath).subarray(0, 12);
  const extension = path.extname(localPath).toLowerCase();
  if (extension === '.png') return header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === '.jpg' || extension === '.jpeg') return header[0] === 0xff && header[1] === 0xd8;
  if (extension === '.gif') return header.subarray(0, 3).toString() === 'GIF';
  if (extension === '.webp') return header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
  if (extension === '.svg') return fs.readFileSync(localPath, 'utf8').includes('<svg');
  return true;
}

const report = auditQuestionBank(questionBankEntries, { assetExists: isReadableImage });
const groupedIssues = Object.groupBy(report.issues, (issue) => issue.code);

console.log(JSON.stringify({
  total: report.total,
  valid: report.valid,
  issueCount: report.issues.length,
  subtestCounts: report.subtestCounts,
  issuesByType: Object.fromEntries(Object.entries(groupedIssues).map(([code, issues]) => [code, issues.length])),
  issues: report.issues,
}, null, 2));

if (report.issues.length > 0) {
  process.exitCode = 1;
}
