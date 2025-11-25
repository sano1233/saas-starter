#!/bin/bash
set -e

echo "🔄 Merging fixes to main and deploying..."

# Fetch latest
git fetch origin

# Switch to main
git checkout main
git pull origin main

# Merge the fix branch
git merge origin/claude/fix-netlify-build-errors-01HePh3U3xbLTvwuAqY3rYoY --no-ff -m "Fix Netlify build errors"

# Push to main (this will trigger Netlify deployment)
git push origin main

echo "✅ Pushed to main! Netlify will deploy automatically."
echo "🔗 Check deployment at: https://app.netlify.com/sites/YOUR_SITE/deploys"
