Param()
Write-Host "This script sets repository secrets using the GitHub CLI (gh)." -ForegroundColor Cyan

$repo = 'Coffee-s-Crafts/coffee-s-crafts'

$siteTitle = Read-Host "SITE_TITLE (default: Coffee's Crafts)"
if ([string]::IsNullOrWhiteSpace($siteTitle)) { $siteTitle = "Coffee's Crafts" }
$siteTitle | gh secret set SITE_TITLE --repo $repo

$contact = Read-Host "CONTACT_EMAIL (default: coffee@coffeescrafts.com)"
if ([string]::IsNullOrWhiteSpace($contact)) { $contact = 'coffee@coffeescrafts.com' }
$contact | gh secret set CONTACT_EMAIL --repo $repo

$vgenPortfolio = Read-Host "VGEN_PORTFOLIO (optional)"
if (-not [string]::IsNullOrWhiteSpace($vgenPortfolio)) { $vgenPortfolio | gh secret set VGEN_PORTFOLIO --repo $repo }

$vgenUrl = Read-Host "VGEN_URL (optional)"
if (-not [string]::IsNullOrWhiteSpace($vgenUrl)) { $vgenUrl | gh secret set VGEN_URL --repo $repo }

$sampleCount = Read-Host "SAMPLE_COUNT (default: 6)"
if ([string]::IsNullOrWhiteSpace($sampleCount)) { $sampleCount = '6' }
$sampleCount | gh secret set SAMPLE_COUNT --repo $repo

Write-Host "Secrets set. Verify in repository settings -> Secrets." -ForegroundColor Green
