#!/usr/bin/env node
/**
 * SafeMask Auto-SEO Generator
 * Automatically builds:
 * - public/robots.txt
 * - public/sitemap.xml
 * - public/privacy/index.html, public/terms/index.html, public/support/index.html
 * - 8 high-intent US/Global SEO guide pages under public/guides/<slug>/index.html
 *   with Schema.org HowTo + SoftwareApplication JSON-LD and 3-platform download CTAs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DOMAIN = 'https://safemask.tuandigital.vn';
const TODAY = new Date().toISOString().slice(0, 10);

const GUIDES = [
  {
    slug: 'how-to-remove-gps-from-iphone-photo',
    title: 'How to Remove GPS Location & EXIF Data from iPhone Photos (Free & Local)',
    description:
      'Every iPhone photo embeds exact GPS coordinates and camera metadata. Learn how to inspect, strip, and verify 0 EXIF/GPS tags locally on your device.',
    h1: 'How to Remove Hidden GPS & EXIF Data from iPhone Photos',
    steps: [
      'Open SafeMask and tap Metadata Cleaner (or Photo Privacy Score).',
      'Select your photo from Photos or Files — SafeMask inspects real EXIF and GPS tags locally.',
      'Tap Strip Metadata & Export. SafeMask re-encodes pixels cleanly and re-scans the output to verify 0 EXIF/GPS tags remain.',
      'Save directly to Photos or share safely anywhere.',
    ],
  },
  {
    slug: 'how-to-redact-pdf-safely',
    title: 'How to Redact PDF Documents Permanently Without Leaving Recoverable Text',
    description:
      'Drawing a black rectangle over a PDF leaves original text selectable underneath. Learn how rasterized PDF redaction permanently destroys sensitive data.',
    h1: 'How to Redact PDFs Permanently (True Rasterized Export)',
    steps: [
      'Open PDF Shield in SafeMask and import your PDF document locally.',
      'Navigate to each page and draw Blackout, Blur, or Pixelate boxes over sensitive lines.',
      'Tap Export Redacted PDF — SafeMask flattens every page into rasterized images so zero underlying text can be copied or extracted.',
    ],
  },
  {
    slug: 'how-to-hide-ssn-before-chatgpt',
    title: 'How to Hide SSN, Emails & Phone Numbers Before Pasting into ChatGPT or AI',
    description:
      'Protect contracts, resumes, and client emails before sending to AI tools. Automatically replace SSNs, phones, and accounts with safe tokens locally.',
    h1: 'Sanitize Sensitive Text Before Pasting into ChatGPT or Gemini',
    steps: [
      'Open AI Privacy Copy in SafeMask and paste your email, resume, or contract.',
      'Tap Scan & Sanitize — SafeMask replaces SSNs, phone numbers, emails, and bank accounts with [ID_1], [PHONE_1], [EMAIL_1].',
      'Copy the sanitized text into your AI tool. When done, tap Restore Original from volatile session RAM (never saved to storage).',
    ],
  },
  {
    slug: 'how-to-blur-id-card-photo',
    title: 'How to Blur & Watermark Driver’s License or ID Card Photos Safely',
    description:
      'Protect your driver’s license, passport, or national ID before online verification using permanent pixel redaction and diagonal verification watermarks.',
    h1: 'Protect Your ID or Driver’s License Photo in 5 Seconds',
    steps: [
      'Open Image Shield or Photo Privacy Score in SafeMask and select your ID photo.',
      'Draw Blackout or Pixelate bars over ID numbers and sensitive fields.',
      'Enable Watermark Protect and select "FOR VERIFICATION ONLY" with Date & Time stamp.',
      'Tap Save or Share Safe — edits and watermark are permanently burned into pixels.',
    ],
  },
  {
    slug: 'photo-privacy-score-checker',
    title: 'Free Photo Privacy Score Checker (0–100) — Test Your Photo Before Posting',
    description:
      'Drop any photo to get an instant 0–100 Privacy Score across GPS coordinates, device EXIF, and visible sensitive text, then 1-Tap Auto-Shield to 100/100.',
    h1: 'Check Your Photo’s Privacy Score (0–100) Before Sharing',
    steps: [
      'Tap Photo Privacy Score on the SafeMask home screen and choose any photo.',
      'Review your 0–100 score and exact risk breakdown (GPS, Device EXIF, Phone, SSN/ID).',
      'Tap 1-Tap Auto-Shield to 100/100 to strip metadata and redact sensitive regions permanently.',
    ],
  },
  {
    slug: 'how-to-hide-phone-number-in-screenshot',
    title: 'How to Hide Phone Numbers & Bank Accounts in Screenshots in 5 Seconds',
    description:
      'Cleanly redact phone numbers, bank accounts, and names in screenshots with permanent Blackout, Blur, or Pixelate — processed 100% locally on your phone.',
    h1: 'Hide Phone Numbers & Account Details in Screenshots Cleanly',
    steps: [
      'Open Image Shield (or Smart Redact OCR for auto-detection).',
      'Drag over the phone number or bank account using Blackout, Blur, or Pixelate.',
      'Tap Share Safe to send directly to Messages, WhatsApp, or social media.',
    ],
  },
  {
    slug: 'blur-vs-pixelate-vs-blackout-redaction',
    title: 'Blur vs Pixelate vs Blackout: Which Photo Redaction Method Is Safest?',
    description:
      'Compare Blackout, destructive Blur, and Mosaic Pixelation for hiding sensitive text in screenshots and documents.',
    h1: 'Blur vs Pixelate vs Blackout — Security Guide',
    steps: [
      'Use Solid Blackout for maximum security on SSNs, bank numbers, passwords, and legal documents.',
      'Use Heavy Mosaic Pixelate for license plates, usernames, and social media aesthetics.',
      'Use Destructive Blur for faces and backgrounds — always ensure redactions are burned into pixels on export.',
    ],
  },
  {
    slug: 'how-to-add-verification-watermark-to-id',
    title: 'How to Add a Diagonal "FOR VERIFICATION ONLY" Watermark with Timestamp',
    description:
      'Prevent identity theft and document reuse by stamping repeating diagonal verification watermarks with date and time locally on your device.',
    h1: 'Stamp Verification Watermarks on Sensitive Documents',
    steps: [
      'Open Watermark Protect in SafeMask and select your document photo.',
      'Choose "FOR VERIFICATION ONLY" or "NO AI TRAINING • PERSONAL USE" and enable Date & Time.',
      'Adjust opacity, angle, and tiled spacing, then export permanently flattened.',
    ],
  },
];

function pageShell({ title, description, canonical, body, jsonLd }) {
  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${DOMAIN}/icons/icon-512.png" />
  <meta name="theme-color" content="#080A0D" />
  <link rel="icon" type="image/svg+xml" href="/logo.svg" />
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',Inter,sans-serif;background:#080A0D;color:#F1F5F9;line-height:1.65}
    .wrap{max-width:760px;margin:0 auto;padding:28px 20px 64px}
    header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1E2631;padding-bottom:16px;margin-bottom:32px}
    a{color:#34D399;text-decoration:none}
    .brand{display:flex;align-items:center;gap:10px;color:#fff;font-weight:800;font-size:18px}
    .btn{display:inline-block;background:#10B981;color:#080A0D;font-weight:800;padding:12px 20px;border-radius:14px;font-size:14px}
    .btn-outline{display:inline-block;background:#161C24;color:#F1F5F9;border:1px solid #26303D;font-weight:700;padding:12px 18px;border-radius:14px;font-size:14px}
    .card{background:#10141A;border:1px solid #26303D;border-radius:20px;padding:22px;margin:22px 0}
    h1{font-size:30px;line-height:1.2;margin:0 0 14px;color:#fff}
    h2{font-size:20px;color:#34D399;margin-top:26px}
    ol{padding-left:22px}
    li{margin-bottom:10px;color:#CBD5E1}
    .cta-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
    footer{margin-top:48px;padding-top:20px;border-top:1px solid #1E2631;font-size:12px;color:#64748B;display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="/">
        <img src="/logo.svg" width="32" height="32" alt="SafeMask" />
        <span>SafeMask</span>
      </a>
      <a class="btn" href="/web/">Launch Web App →</a>
    </header>
    ${body}
    <footer>
      <span>SafeMask – Privacy Toolkit • Hide it. Share it. Stay safe.</span>
      <span>
        <a href="/">Home</a> ·
        <a href="/privacy/">Privacy</a> ·
        <a href="/terms/">Terms</a> ·
        <a href="/support/">Support</a>
      </span>
    </footer>
  </div>
</body>
</html>`;
}

// 1. Write 8 SEO Guide Pages
for (const g of GUIDES) {
  const dir = path.join(PUBLIC, 'guides', g.slug);
  fs.mkdirSync(dir, { recursive: true });
  const canonical = `${DOMAIN}/guides/${g.slug}/`;
  const html = pageShell({
    title: `${g.title} | SafeMask`,
    description: g.description,
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: g.h1,
      description: g.description,
      step: g.steps.map((text, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        text,
      })),
    },
    body: `
      <article>
        <h1>${g.h1}</h1>
        <p style="color:#94A3B8;font-size:16px">${g.description}</p>
        <div class="card">
          <h2 style="margin-top:0">Step-by-Step Guide (100% On-Device)</h2>
          <ol>${g.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        </div>
        <div class="card">
          <h2 style="margin-top:0">Try SafeMask Free on All 3 Platforms</h2>
          <p style="color:#94A3B8;font-size:14px">Zero cloud uploads. No account required. Core processing runs locally on your device.</p>
          <div class="cta-row">
            <a class="btn" href="/web/">Launch Web App (PWA)</a>
            <a class="btn-outline" href="https://apps.apple.com/app/id6838570167" target="_blank" rel="noopener noreferrer">App Store (iOS)</a>
            <a class="btn-outline" href="/downloads/safemask-latest.apk" download>Download Android APK</a>
          </div>
        </div>
      </article>
    `,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

// 2. Write Mandatory App Store Connect Legal & Support Pages (/privacy, /terms, /support)
const legalPages = [
  {
    dir: 'privacy',
    title: 'Privacy Policy | SafeMask – Privacy Toolkit',
    description: 'SafeMask processes photos, PDFs, EXIF metadata, and text locally on your device with zero cloud uploads.',
    body: `
      <h1>SafeMask Privacy Policy</h1>
      <p style="color:#94A3B8">Effective Date: November 2026 • Domain: ${DOMAIN}</p>
      <div class="card">
        <h2>1. Local On-Device Processing</h2>
        <p>SafeMask processes your photos, PDFs, EXIF/GPS metadata, and text locally on your device. We NEVER upload your images, documents, IDs, SSNs, phone numbers, emails, bank accounts, or GPS coordinates to any server.</p>
        <h2>2. Ephemeral Session Memory</h2>
        <p>AI Privacy Copy stores token-to-original mappings strictly in temporary RAM and wipes them when you tap Reset or leave the screen.</p>
        <h2>3. Clear Network Separation</h2>
        <p>Core redaction, PDF rasterization, EXIF cleaning, and text sanitization work offline. On-device OCR downloads its local language model once on first scan and caches it on your device. Pro purchases connect only to Apple StoreKit / Google Play Billing.</p>
        <h2>4. Contact</h2>
        <p>Privacy questions: <a href="/support/">SafeMask Support</a>.</p>
      </div>
    `,
  },
  {
    dir: 'terms',
    title: 'Terms of Service | SafeMask – Privacy Toolkit',
    description: 'Terms of Service for SafeMask – Privacy Toolkit across Web PWA, iOS App Store, and Android.',
    body: `
      <h1>Terms of Service</h1>
      <p style="color:#94A3B8">Effective Date: November 2026</p>
      <div class="card">
        <h2>1. Local Privacy Utility</h2>
        <p>SafeMask helps redact personal information locally before sharing. Users are responsible for reviewing exported images, PDFs, and text before publishing or transmitting them.</p>
        <h2>2. Automated Detection Notice</h2>
        <p>Local OCR and automated text pattern detection do not guarantee 100% accuracy. Always review and apply manual redactions where needed.</p>
        <h2>3. Subscriptions & Lifetime Access</h2>
        <p>SafeMask Pro subscriptions and lifetime unlocks are billed transparently through Apple App Store or Google Play and can be managed or cancelled anytime in store settings.</p>
      </div>
    `,
  },
  {
    dir: 'support',
    title: 'Support & Help | SafeMask – Privacy Toolkit',
    description: 'Official support, FAQ, and troubleshooting for SafeMask on iOS, Android APK, and Web PWA.',
    body: `
      <h1>SafeMask Support</h1>
      <p style="color:#94A3B8">Need help with SafeMask on iOS, Android APK, or Web PWA?</p>
      <div class="card">
        <h2>Quick Help</h2>
        <ul>
          <li><strong>iOS Save Image:</strong> Tap Save or Share Safe and choose "Save Image" in the iOS share sheet.</li>
          <li><strong>Restore Purchases:</strong> Open Settings → SafeMask Pro → Restore Purchases.</li>
          <li><strong>Android APK Install:</strong> Download <a href="/downloads/safemask-latest.apk" download>safemask-latest.apk</a> and allow installation from your browser.</li>
        </ul>
        <p>Contact Email: <strong>support@tuandigital.vn</strong></p>
      </div>
    `,
  },
];

for (const lp of legalPages) {
  const dir = path.join(PUBLIC, lp.dir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    pageShell({
      title: lp.title,
      description: lp.description,
      canonical: `${DOMAIN}/${lp.dir}/`,
      body: lp.body,
    }),
    'utf8'
  );
}

// 3. Write robots.txt & sitemap.xml
fs.writeFileSync(
  path.join(PUBLIC, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}/sitemap.xml\n`,
  'utf8'
);

const urls = [
  { loc: `${DOMAIN}/`, priority: '1.0' },
  { loc: `${DOMAIN}/web/`, priority: '0.95' },
  { loc: `${DOMAIN}/privacy/`, priority: '0.6' },
  { loc: `${DOMAIN}/terms/`, priority: '0.6' },
  { loc: `${DOMAIN}/support/`, priority: '0.6' },
  ...GUIDES.map((g) => ({ loc: `${DOMAIN}/guides/${g.slug}/`, priority: '0.85' })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Auto-SEO generated ${GUIDES.length} guides, 3 legal/support pages, robots.txt & sitemap.xml for ${DOMAIN}`);
