// Copies the documents Testsmith wrote (our test basis) from the local Toolshop
// checkout into docs/test-basis/upstream/, and saves the API's OpenAPI spec.
// The copies are gitignored: the Toolshop license does not allow publishing them.
//
// Usage: npm run fetch:basis                 (requirements, specs, API spec)
//        npm run fetch:basis -- --answer-key (also the known-bugs list; see docs/test-basis/README.md)
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ quiet: true });

const toolshopRepo = path.resolve(process.env.TOOLSHOP_REPO ?? '../practice-software-testing');
const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:8091';
const outDir = path.resolve('docs/test-basis/upstream');
const withAnswerKey = process.argv.includes('--answer-key');

// Paths are kept as they are upstream so the links between documents still work.
const basis = [
  'README.md',
  'docs/user-stories/v5.md',
  '_user-stories/sprint0',
  'docs/features.md',
  'docs/sprints/sprint5.md',
  'docs/gift-card-validation.md',
  'docs/postcode-lookup.md',
  'docs/http-query-method.md',
  'docs/architecture.md',
  'docs/images',
];
const answerKey = ['docs/sprints/sprint5-with-bugs.md'];

// Requirement IDs: story code + the AC number upstream already uses, e.g. LOGIN-AC4.
// The same codes are used in TEST_PLAN.md section 6 and in test tags.
const storyCodes = {
  'Product Overview': 'PO',
  'Product Detail': 'PD',
  'Rental Products': 'RENT',
  'Checkout – Cart Review': 'CART',
  'Checkout – Sign In': 'CSI',
  'Checkout – Billing Address': 'BILL',
  'Checkout – Payment (Advanced)': 'PAY',
  'User Registration': 'REG',
  'User Login': 'LOGIN',
  'Forgot Password': 'FPW',
  'Two-Factor Authentication Setup': 'TOTP',
  'Customer Profile': 'PROF',
  'Change Password': 'CPW',
  'Favorites': 'FAV',
  'Invoices': 'INV',
  'Messages': 'MSG',
  'Contact Form (Advanced)': 'CONT',
  'Admin Dashboard': 'ADM',
  'Chat Widget': 'CHAT',
  'Geo-Location Discount': 'GEO',
  'Combination Discount': 'COMBO',
  'Multi-Language Support': 'I18N',
  'Privacy Policy': 'PRIV',
  'Browse Products by Category': 'CAT',
};

// Adds IDs to the story and AC headings only; the requirement text is left as is.
// Fails on an unknown story so upstream changes get noticed instead of silently mislabeled.
function addRequirementIds(file) {
  let code = null;
  let count = 0;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/).map((line) => {
    const story = line.match(/^## (.+?)\s*$/);
    if (story) {
      code = storyCodes[story[1]];
      if (!code) throw new Error(`No story code for "${story[1]}": add it to storyCodes`);
      return `## ${story[1]} (${code})`;
    }
    const ac = line.match(/^#### AC(\d+)\s*[–-]\s*(.+)$/);
    if (ac && code) {
      count++;
      return `#### ${code}-AC${ac[1]} — ${ac[2]}`;
    }
    return line;
  });
  writeFileSync(file, lines.join('\n'));
  return count;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const item of withAnswerKey ? [...basis, ...answerKey] : basis) {
  cpSync(path.join(toolshopRepo, item), path.join(outDir, item), { recursive: true });
  console.log(`copied  ${item}`);
}

const acCount = addRequirementIds(path.join(outDir, 'docs/user-stories/v5.md'));
console.log(`labeled ${acCount} acceptance criteria with requirement IDs`);

const commit = execFileSync('git', ['-C', toolshopRepo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
writeFileSync(
  path.join(outDir, 'VERSION.txt'),
  `Toolshop commit: ${commit}\nFetched: ${new Date().toISOString()}\nAnswer key included: ${withAnswerKey}\n`,
);
console.log(`commit  ${commit}`);

try {
  const res = await fetch(`${apiBaseUrl}/docs?api-docs.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  mkdirSync(path.join(outDir, 'api'), { recursive: true });
  writeFileSync(path.join(outDir, 'api/openapi.json'), JSON.stringify(await res.json(), null, 2));
  console.log('saved   api/openapi.json');
} catch (err) {
  console.warn(`skipped api/openapi.json: is the API running at ${apiBaseUrl}? (${err.message})`);
}
