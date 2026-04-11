#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Paths ───────────────────────────────────────────────────────────────────
const INPUT_DIR  = path.join('C:', 'Users', 'giach', 'Documents', 'Pictures for Website Update', 'To Be Updated');
const OUTPUT_DIR = path.join('C:', 'Users', 'giach', 'Documents', 'Pictures for Website Update', 'Processed');
const DONE_DIR   = path.join('C:', 'Users', 'giach', 'Documents', 'Pictures for Website Update', 'Updated');
const PROJECT_ROOT = __dirname;

const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

// ── Colors ──────────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  amber:  '\x1b[33m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
};

function log(msg)  { console.log(`${c.green}[remove-bg]${c.reset} ${msg}`); }
function warn(msg) { console.log(`${c.amber}[remove-bg]${c.reset} ${msg}`); }
function err(msg)  { console.log(`${c.red}[remove-bg]${c.reset} ${msg}`); }

// ── Load API key ────────────────────────────────────────────────────────────
function loadApiKey() {
  if (process.env.REMOVE_BG_API_KEY) {
    return process.env.REMOVE_BG_API_KEY;
  }

  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) continue;
      const match = trimmed.match(/^REMOVE_BG_API_KEY\s*=\s*(.+)$/);
      if (match) {
        return match[1].replace(/^["']|["']$/g, '').trim();
      }
    }
  }

  return null;
}

// ── Remove background via API ───────────────────────────────────────────────
function removeBackground(imagePath, apiKey) {
  return new Promise((resolve, reject) => {
    const imageData = fs.readFileSync(imagePath);
    const boundary = '----FormBoundary' + Date.now().toString(36);

    const header = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="image_file"; filename="' + path.basename(imagePath) + '"',
      'Content-Type: application/octet-stream',
      '',
      '',
    ].join('\r\n');

    const footer = `\r\n--${boundary}--\r\n`;

    const headerBuf = Buffer.from(header, 'utf8');
    const footerBuf = Buffer.from(footer, 'utf8');
    const body = Buffer.concat([headerBuf, imageData, footerBuf]);

    const options = {
      hostname: 'api.remove.bg',
      path: '/v1.0/removebg',
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Accept': 'application/octet-stream',
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const result = Buffer.concat(chunks);
        if (res.statusCode === 200) {
          resolve(result);
        } else {
          let errorMsg;
          try {
            errorMsg = JSON.parse(result.toString()).errors.map(e => e.title).join(', ');
          } catch {
            errorMsg = `HTTP ${res.statusCode}: ${result.toString().slice(0, 200)}`;
          }
          reject(new Error(errorMsg));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Process a single image ──────────────────────────────────────────────────
async function processImage(filePath, apiKey) {
  const basename = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (!VALID_EXTENSIONS.has(ext)) {
    warn(`Skipping ${basename} (unsupported format)`);
    return false;
  }

  const outputName = path.basename(filePath, path.extname(filePath)) + '.png';
  const outputPath = path.join(OUTPUT_DIR, outputName);
  const donePath   = path.join(DONE_DIR, basename);

  log(`Processing ${c.cyan}${basename}${c.reset} ...`);

  try {
    const result = await removeBackground(filePath, apiKey);
    fs.writeFileSync(outputPath, result);
    log(`  ${c.green}\u2713${c.reset} Saved to ${c.cyan}Processed/${outputName}${c.reset}`);

    fs.renameSync(filePath, donePath);
    log(`  ${c.green}\u2713${c.reset} Moved original to ${c.cyan}Updated/${basename}${c.reset}`);
    return true;
  } catch (e) {
    err(`  \u2717 Failed: ${e.message}`);
    return false;
  }
}

// ── Process all images in input folder ──────────────────────────────────────
async function processAll(apiKey) {
  const files = fs.readdirSync(INPUT_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return VALID_EXTENSIONS.has(ext);
  });

  if (files.length === 0) {
    warn('No images found in "To Be Updated" folder.');
    return;
  }

  log(`Found ${c.bold}${files.length}${c.reset} image(s) to process.\n`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const ok = await processImage(path.join(INPUT_DIR, file), apiKey);
    if (ok) success++; else failed++;
  }

  console.log('');
  log(`Done. ${c.green}${success} processed${c.reset}, ${failed > 0 ? c.red : c.dim}${failed} failed${c.reset}.`);
}

// ── Watch mode ──────────────────────────────────────────────────────────────
function watchMode(apiKey) {
  log(`Watching ${c.cyan}To Be Updated${c.reset} for new images ... (Ctrl+C to stop)\n`);

  const processing = new Set();

  fs.watch(INPUT_DIR, async (eventType, filename) => {
    if (!filename) return;
    const ext = path.extname(filename).toLowerCase();
    if (!VALID_EXTENSIONS.has(ext)) return;
    if (processing.has(filename)) return;

    const filePath = path.join(INPUT_DIR, filename);

    // Wait a moment for the file to finish writing
    await new Promise(r => setTimeout(r, 1000));

    if (!fs.existsSync(filePath)) return;

    processing.add(filename);
    try {
      await processImage(filePath, apiKey);
    } finally {
      processing.delete(filename);
    }
  });
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.amber}${c.bold}  remove-bg  ${c.reset}${c.dim} — Background removal for Never Settle Saga${c.reset}\n`);

  const apiKey = loadApiKey();
  if (!apiKey) {
    err('No API key found.');
    err('Set REMOVE_BG_API_KEY in your environment or in .env.local');
    process.exit(1);
  }
  log(`API key loaded ${c.green}\u2713${c.reset}\n`);

  // Ensure output dirs exist
  for (const dir of [OUTPUT_DIR, DONE_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const watchFlag = process.argv.includes('--watch');

  if (watchFlag) {
    // Process existing files first, then watch
    await processAll(apiKey);
    watchMode(apiKey);
  } else {
    await processAll(apiKey);
  }
}

main().catch(e => {
  err(e.message);
  process.exit(1);
});
