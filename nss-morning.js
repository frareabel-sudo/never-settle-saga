#!/usr/bin/env node

const https = require('https');

// ── Colors ──────────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  amber:  '\x1b[33m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
  white:  '\x1b[37m',
};

const CHECK  = `${c.green}\u2713${c.reset}`;
const CROSS  = `${c.red}\u2717${c.reset}`;
const BULLET = `${c.amber}\u2022${c.reset}`;

// ── HTTP helper ─────────────────────────────────────────────────────────────
function httpGet(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'curl/7.0' } }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks).toString() });
      });
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── Content ideas ───────────────────────────────────────────────────────────
const CONTENT_IDEAS = [
  'Write a blog post about the story behind your latest jewellery collection',
  'Share a behind-the-scenes reel of your crafting process on Instagram',
  'Create a "Style Guide" post pairing NSS pieces with seasonal outfits',
  'Feature a customer story or testimonial with photos of them wearing NSS',
  'Post a carousel explaining the meaning behind your brand name "Never Settle"',
  'Go live on Instagram for a Q&A about materials, sourcing, and design inspiration',
  'Design a limited-time bundle and announce it with a countdown story',
  'Write a short newsletter about upcoming drops and what inspired them',
  'Collaborate with a micro-influencer for a styled product shoot',
  'Create a TikTok showing the transformation from raw materials to finished piece',
];

// ── Sections ────────────────────────────────────────────────────────────────

function printHeader() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const title = `  NSS Morning Briefing — ${today}  `;
  const border = '\u2550'.repeat(title.length);

  console.log('');
  console.log(`${c.amber}  \u2554${border}\u2557${c.reset}`);
  console.log(`${c.amber}  \u2551${c.bold}${c.white}${title}${c.reset}${c.amber}\u2551${c.reset}`);
  console.log(`${c.amber}  \u255A${border}\u255D${c.reset}`);
  console.log('');
}

async function printWeather() {
  console.log(`${c.amber}${c.bold}  \u2601  Weather (London)${c.reset}`);
  try {
    const { body } = await httpGet('https://wttr.in/London?format=j1');
    const data = JSON.parse(body);
    const current = data.current_condition[0];
    const tempC = current.temp_C;
    const feelsLike = current.FeelsLikeC;
    const desc = current.weatherDesc[0].value;
    const humidity = current.humidity;

    console.log(`     ${CHECK} ${c.bold}${tempC}\u00B0C${c.reset} (feels like ${feelsLike}\u00B0C) — ${desc}`);
    console.log(`     ${c.dim}Humidity: ${humidity}%${c.reset}`);
  } catch (e) {
    console.log(`     ${CROSS} Could not fetch weather: ${e.message}`);
  }
  console.log('');
}

function printEmail() {
  console.log(`${c.amber}${c.bold}  \u2709  Email${c.reset}`);
  console.log(`     ${BULLET} Run ${c.cyan}'claude'${c.reset} to check emails via Gmail MCP`);
  console.log('');
}

function printOrders() {
  console.log(`${c.amber}${c.bold}  \u00A3  Orders${c.reset}`);
  console.log(`     ${BULLET} Connect Stripe to see overnight orders`);
  console.log('');
}

function printSocial() {
  console.log(`${c.amber}${c.bold}  \u266A  Social Media${c.reset}`);
  console.log(`     ${BULLET} Connect Buffer to see engagement stats`);
  console.log('');
}

function printContentIdea() {
  const idea = CONTENT_IDEAS[Math.floor(Math.random() * CONTENT_IDEAS.length)];
  console.log(`${c.amber}${c.bold}  \u2728  Today's Content Idea${c.reset}`);
  console.log(`     ${c.cyan}${idea}${c.reset}`);
  console.log('');
}

async function printWebsiteStatus() {
  console.log(`${c.amber}${c.bold}  \u25CF  Website Status${c.reset}`);
  try {
    const { statusCode } = await httpGet('https://never-settle-saga.vercel.app', 10000);
    if (statusCode >= 200 && statusCode < 400) {
      console.log(`     ${CHECK} ${c.green}never-settle-saga.vercel.app is UP${c.reset} (HTTP ${statusCode})`);
    } else {
      console.log(`     ${CROSS} ${c.red}never-settle-saga.vercel.app returned HTTP ${statusCode}${c.reset}`);
    }
  } catch (e) {
    console.log(`     ${CROSS} ${c.red}never-settle-saga.vercel.app is DOWN${c.reset} — ${e.message}`);
  }
  console.log('');
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  printHeader();

  // Fetch weather and website status in parallel
  const [weatherResult, websiteResult] = await Promise.allSettled([
    httpGet('https://wttr.in/London?format=j1').catch(() => null),
    httpGet('https://never-settle-saga.vercel.app', 10000).catch(() => null),
  ]);

  // Weather
  console.log(`${c.amber}${c.bold}  \u2601  Weather (London)${c.reset}`);
  try {
    const weather = weatherResult.status === 'fulfilled' && weatherResult.value;
    if (weather && weather.body) {
      const data = JSON.parse(weather.body);
      const cur = data.current_condition[0];
      console.log(`     ${CHECK} ${c.bold}${cur.temp_C}\u00B0C${c.reset} (feels like ${cur.FeelsLikeC}\u00B0C) — ${cur.weatherDesc[0].value}`);
      console.log(`     ${c.dim}Humidity: ${cur.humidity}%${c.reset}`);
    } else {
      throw new Error('No response');
    }
  } catch {
    console.log(`     ${CROSS} Could not fetch weather`);
  }
  console.log('');

  printEmail();
  printOrders();
  printSocial();
  printContentIdea();

  // Website status
  console.log(`${c.amber}${c.bold}  \u25CF  Website Status${c.reset}`);
  try {
    const site = websiteResult.status === 'fulfilled' && websiteResult.value;
    if (site && site.statusCode >= 200 && site.statusCode < 400) {
      console.log(`     ${CHECK} ${c.green}never-settle-saga.vercel.app is UP${c.reset} (HTTP ${site.statusCode})`);
    } else if (site) {
      console.log(`     ${CROSS} ${c.red}never-settle-saga.vercel.app returned HTTP ${site.statusCode}${c.reset}`);
    } else {
      throw new Error('No response');
    }
  } catch {
    console.log(`     ${CROSS} ${c.red}never-settle-saga.vercel.app is DOWN${c.reset}`);
  }
  console.log('');

  // Footer
  const divider = `${c.dim}${'─'.repeat(52)}${c.reset}`;
  console.log(divider);
  console.log(`${c.dim}  Have a productive day! Never settle. \u2764${c.reset}\n`);
}

main();
