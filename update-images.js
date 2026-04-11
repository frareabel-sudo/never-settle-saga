#!/usr/bin/env node

/**
 * NSS Image Update Script
 *
 * Watches: C:\Users\giach\Documents\Pictures for Website Update\To Be Updated\
 * Matches filenames to product categories / pages and copies them into the project.
 * Moves originals to the "Updated" folder after processing.
 *
 * FILENAME CONVENTIONS:
 *   Images are matched by filename prefix (case-insensitive, hyphens/underscores/spaces all work):
 *
 *   Product categories:
 *     3d-fdm-*        → public/images/3d-fdm-printing/
 *     fdm-*           → public/images/3d-fdm-printing/
 *     resin-*         → public/images/resin-printing/
 *     lithophane-*    → public/images/lithophane-lamps/
 *     lamp-*          → public/images/lithophane-lamps/
 *     miniature-*     → public/images/miniatures/
 *     mini-*          → public/images/miniatures/
 *     kit-*           → public/images/kit-party/
 *     party-*         → public/images/kit-party/
 *     agenda-*        → public/images/agendas-planners/
 *     planner-*       → public/images/agendas-planners/
 *
 *   Pages:
 *     hero-*          → public/images/hero/
 *     about-*         → public/images/about/
 *     workshop-*      → public/images/about/
 *
 *   If no prefix matches, the image goes to public/images/ (root).
 *
 * USAGE:
 *   node update-images.js          Process all images once
 *   node update-images.js --watch  Watch folder and process on change
 */

const fs = require("fs");
const path = require("path");

const SOURCE_DIR = path.join(
  "C:",
  "Users",
  "giach",
  "Documents",
  "Pictures for Website Update",
  "To Be Updated"
);
const DONE_DIR = path.join(
  "C:",
  "Users",
  "giach",
  "Documents",
  "Pictures for Website Update",
  "Updated"
);
const PROJECT_IMAGES = path.join(__dirname, "public", "images");

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
]);

// Prefix → subfolder mapping (order matters — first match wins)
const RULES = [
  { pattern: /^(3d[_-]?fdm|fdm)/i, folder: "3d-fdm-printing" },
  { pattern: /^(resin)/i, folder: "resin-printing" },
  { pattern: /^(lithophane|litho|lamp)/i, folder: "lithophane-lamps" },
  { pattern: /^(miniature|mini)/i, folder: "miniatures" },
  { pattern: /^(kit|party)/i, folder: "kit-party" },
  { pattern: /^(agenda|planner)/i, folder: "agendas-planners" },
  { pattern: /^(hero)/i, folder: "hero" },
  { pattern: /^(about|workshop|maker)/i, folder: "about" },
];

function getTargetFolder(filename) {
  const name = path.parse(filename).name;
  for (const rule of RULES) {
    if (rule.pattern.test(name)) {
      return rule.folder;
    }
  }
  return null; // root images folder
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function processImages() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`\x1b[31mSource folder not found:\x1b[0m ${SOURCE_DIR}`);
    return;
  }

  const files = fs.readdirSync(SOURCE_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return IMAGE_EXTENSIONS.has(ext) && !f.startsWith(".");
  });

  if (files.length === 0) {
    console.log(
      "\x1b[33mNo images found in To Be Updated folder.\x1b[0m"
    );
    console.log(`  ${SOURCE_DIR}`);
    return;
  }

  console.log(`\n\x1b[36mFound ${files.length} image(s) to process:\x1b[0m\n`);

  const results = [];

  for (const file of files) {
    const srcPath = path.join(SOURCE_DIR, file);
    const subfolder = getTargetFolder(file);
    const destDir = subfolder
      ? path.join(PROJECT_IMAGES, subfolder)
      : PROJECT_IMAGES;
    const destPath = path.join(destDir, file);
    const donePath = path.join(DONE_DIR, file);

    ensureDir(destDir);
    ensureDir(DONE_DIR);

    try {
      // Copy to project
      fs.copyFileSync(srcPath, destPath);

      // Move original to Updated
      fs.renameSync(srcPath, donePath);

      const relDest = path.relative(__dirname, destPath).replace(/\\/g, "/");
      const webPath = "/" + path.relative(path.join(__dirname, "public"), destPath).replace(/\\/g, "/");

      results.push({
        file,
        dest: relDest,
        webPath,
        folder: subfolder || "(root)",
      });

      console.log(
        `  \x1b[32m✓\x1b[0m ${file}` +
          `\n    → Category: \x1b[33m${subfolder || "root"}\x1b[0m` +
          `\n    → Copied to: \x1b[36m${relDest}\x1b[0m` +
          `\n    → Web path:  \x1b[36m${webPath}\x1b[0m` +
          `\n    → Original moved to Updated/\n`
      );
    } catch (err) {
      console.log(`  \x1b[31m✗\x1b[0m ${file} — ${err.message}\n`);
    }
  }

  // Summary
  console.log(`\x1b[36m${"─".repeat(50)}\x1b[0m`);
  console.log(
    `\x1b[32mDone!\x1b[0m Processed ${results.length}/${files.length} image(s).\n`
  );

  if (results.length > 0) {
    console.log(
      "\x1b[33mNext steps:\x1b[0m Update image references in src/lib/data.ts"
    );
    console.log("Use these web paths in your product image arrays:\n");
    for (const r of results) {
      console.log(`  "${r.webPath}"`);
    }
    console.log();
  }
}

// --watch mode
if (process.argv.includes("--watch")) {
  console.log(
    `\x1b[36mWatching for new images...\x1b[0m\n  ${SOURCE_DIR}\n`
  );
  console.log("Drop images into the folder and they'll be processed automatically.");
  console.log("Press Ctrl+C to stop.\n");

  // Process any existing images first
  processImages();

  // Watch for changes
  fs.watch(SOURCE_DIR, { persistent: true }, (eventType, filename) => {
    if (!filename) return;
    const ext = path.extname(filename).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) return;

    // Small delay to ensure file is fully written
    setTimeout(() => {
      const srcPath = path.join(SOURCE_DIR, filename);
      if (fs.existsSync(srcPath)) {
        console.log(`\n\x1b[36mNew image detected:\x1b[0m ${filename}`);
        processImages();
      }
    }, 500);
  });
} else {
  processImages();
}
