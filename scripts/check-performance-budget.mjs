import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const budgets = {
  'app.js': 240 * 1024,
  'styles.css': 180 * 1024,
  'data-total': 500 * 1024,
  'single-image': 600 * 1024,
};

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(absolute) : [absolute];
  }));
  return nested.flat();
}

function formatBytes(bytes) {
  return `${Math.round(bytes / 1024)} KiB`;
}

const failures = [];
for (const file of ['app.js', 'styles.css']) {
  const size = (await stat(path.join(root, file))).size;
  if (size > budgets[file]) failures.push(`${file} is ${formatBytes(size)} (budget ${formatBytes(budgets[file])})`);
  console.log(`${file}: ${formatBytes(size)} / ${formatBytes(budgets[file])}`);
}

const dataFiles = (await filesUnder(path.join(root, 'data'))).filter((file) => file.endsWith('.js'));
const dataSizes = await Promise.all(dataFiles.map(async (file) => (await stat(file)).size));
const dataTotal = dataSizes.reduce((sum, size) => sum + size, 0);
if (dataTotal > budgets['data-total']) failures.push(`Question data is ${formatBytes(dataTotal)} (budget ${formatBytes(budgets['data-total'])})`);
console.log(`Question data: ${formatBytes(dataTotal)} / ${formatBytes(budgets['data-total'])}`);

const imageFiles = (await filesUnder(path.join(root, 'assets'))).filter((file) => /\.(?:avif|gif|jpe?g|png|webp)$/i.test(file));
const imageEntries = await Promise.all(imageFiles.map(async (file) => ({ file, size: (await stat(file)).size })));
const largestImage = imageEntries.sort((first, second) => second.size - first.size)[0];
imageEntries.filter((entry) => entry.size > budgets['single-image']).forEach((entry) => {
  failures.push(`${path.relative(root, entry.file)} is ${formatBytes(entry.size)} (budget ${formatBytes(budgets['single-image'])})`);
});
console.log(`Largest image: ${path.relative(root, largestImage.file)} at ${formatBytes(largestImage.size)} / ${formatBytes(budgets['single-image'])}`);

if (failures.length) {
  console.error('\nPerformance budget failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Performance budget passed.');
}
