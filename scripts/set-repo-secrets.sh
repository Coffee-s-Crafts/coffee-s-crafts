#!/usr/bin/env bash
# Usage: ./set-repo-secrets.sh
# Requires: GitHub CLI (`gh`) authenticated and repo write access.

REPO="Coffee-s-Crafts/coffee-s-crafts"

echo "Setting repository secrets for $REPO. You will be prompted by gh for values."

read -p "SITE_TITLE (default: Coffee's Crafts): " SITE_TITLE
[ -z "$SITE_TITLE" ] && SITE_TITLE="Coffee's Crafts"
echo "$SITE_TITLE" | gh secret set SITE_TITLE --repo "$REPO"

read -p "CONTACT_EMAIL (default: artist@example.com): " CONTACT_EMAIL
[ -z "$CONTACT_EMAIL" ] && CONTACT_EMAIL="artist@example.com"
echo "$CONTACT_EMAIL" | gh secret set CONTACT_EMAIL --repo "$REPO"

read -p "VGEN_PORTFOLIO (optional): " VGEN_PORTFOLIO
if [ -n "$VGEN_PORTFOLIO" ]; then
  echo "$VGEN_PORTFOLIO" | gh secret set VGEN_PORTFOLIO --repo "$REPO"
fi

read -p "VGEN_URL (optional): " VGEN_URL
if [ -n "$VGEN_URL" ]; then
  echo "$VGEN_URL" | gh secret set VGEN_URL --repo "$REPO"
fi

read -p "SAMPLE_COUNT (default: 6): " SAMPLE_COUNT
[ -z "$SAMPLE_COUNT" ] && SAMPLE_COUNT=6
echo "$SAMPLE_COUNT" | gh secret set SAMPLE_COUNT --repo "$REPO"

echo "Secrets set. Verify in repository settings -> Secrets."
