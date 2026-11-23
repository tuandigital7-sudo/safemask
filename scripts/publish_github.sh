#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./scripts/publish_github.sh https://github.com/<YOUR_USERNAME>/safemask.git"
  exit 1
fi

REPO_URL="$1"
cd "$(dirname "$0")/.."

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git branch -M main
git push -u origin main

echo ""
echo "Done! GitHub Actions is now building:"
echo "  1. QA Tests (13/13)"
echo "  2. Auto-SEO Website + Web App PWA"
echo "  3. Android APK -> https://safemask.tuandigital.vn/downloads/safemask-latest.apk"
echo ""
echo "Next on GitHub: Settings -> Pages -> Source: GitHub Actions"
echo "Next on DNS (tuandigital.vn): Add CNAME record 'safemask' -> '<YOUR_USERNAME>.github.io'"
