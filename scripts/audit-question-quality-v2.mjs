import { auditQuestionQualityV2 } from '../lib/questionQualityV2.js';
import { questionBankEntries } from '../lib/questionBankSources.js';

const report = auditQuestionQualityV2(questionBankEntries);
const warningCounts = Object.groupBy(report.warnings, (warning) => warning.code);

console.log(JSON.stringify({
  total: report.total,
  errorCount: report.errors.length,
  warningCount: report.warnings.length,
  reviewCoverage: report.reviewCoverage,
  choiceRationaleCoverage: `${report.choiceRationaleCoverage}%`,
  warningsByType: Object.fromEntries(Object.entries(warningCounts).map(([code, warnings]) => [code, warnings.length])),
  errors: report.errors,
  manualReview: report.warnings.filter((warning) => warning.code === 'paper-folding-manual-review'),
  repeatedPrompts: report.nearDuplicateGroups,
}, null, 2));

if (report.errors.length > 0) {
  process.exitCode = 1;
}
