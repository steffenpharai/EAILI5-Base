#!/usr/bin/env pwsh
# EAILI5 Base Mini App - Google Cloud Deployment Script
# Deploys backend and frontend to Google Cloud Run on eaili5 project
# Usage: ./deploy-gcloud.ps1

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$SkipTests
)

Write-Host "`n🚀 EAILI5 Base Mini App - Google Cloud Deployment" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Switch to EAILI5 project
Write-Host "📦 Switching to eaili5 Google Cloud project..." -ForegroundColor Yellow
gcloud config set project eaili5
$currentProject = gcloud config get-value project
Write-Host "✓ Using project: $currentProject`n" -ForegroundColor Green

# Verify we're in the right directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Error: Must run from apps/base/ directory!" -ForegroundColor Red
    exit 1
}

# Run tests unless skipped
if (-not $SkipTests) {
    Write-Host "🧪 Running tests before deployment..." -ForegroundColor Yellow
    
    # Backend tests
    if (-not $FrontendOnly) {
        Write-Host "  Testing backend..." -ForegroundColor Gray
        docker-compose exec -T backend pytest -v
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Backend tests failed! Aborting deployment." -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Backend tests passed" -ForegroundColor Green
    }
    
    # Frontend tests
    if (-not $BackendOnly) {
        Write-Host "  Testing frontend..." -ForegroundColor Gray
        docker-compose exec -T frontend npm test -- --watchAll=false
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Frontend tests failed! Aborting deployment." -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Frontend tests passed`n" -ForegroundColor Green
    }
}

# Deploy Backend
if (-not $FrontendOnly) {
    Write-Host "🐍 Deploying Backend to Cloud Run..." -ForegroundColor Yellow
    Write-Host "  Building and pushing Docker image..." -ForegroundColor Gray
    
    Set-Location backend
    gcloud builds submit --config cloudbuild.yaml
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
    Write-Host "✓ Backend deployed successfully`n" -ForegroundColor Green
}

# Deploy Frontend
if (-not $BackendOnly) {
    Write-Host "⚛️ Deploying Frontend to Cloud Run..." -ForegroundColor Yellow
    Write-Host "  Building and pushing Docker image..." -ForegroundColor Gray
    
    Set-Location frontend
    gcloud builds submit --config cloudbuild.yaml
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
    Write-Host "✓ Frontend deployed successfully`n" -ForegroundColor Green
}

# Get deployment URLs
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "`n📝 Service URLs:" -ForegroundColor Cyan

if (-not $FrontendOnly) {
    $backendUrl = gcloud run services describe eaili5-base-backend --region=us-central1 --format="value(status.url)" --project=eaili5 2>$null
    if ($backendUrl) {
        Write-Host "  Backend:  $backendUrl" -ForegroundColor White
    }
}

if (-not $BackendOnly) {
    $frontendUrl = gcloud run services describe eaili5-base-frontend --region=us-central1 --format="value(status.url)" --project=eaili5 2>$null
    if ($frontendUrl) {
        Write-Host "  Frontend: $frontendUrl" -ForegroundColor White
    }
}

Write-Host "`n🔗 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Configure custom domain mappings:" -ForegroundColor Gray
Write-Host "     • base.explainailikeimfive.com → frontend" -ForegroundColor Gray
Write-Host "     • base-api.explainailikeimfive.com → backend" -ForegroundColor Gray
Write-Host "  2. Update DNS records to point to ghs.googlehosted.com" -ForegroundColor Gray
Write-Host "  3. Test deployment on Base Sepolia testnet" -ForegroundColor Gray
Write-Host "  4. Sign farcaster.json at https://base.dev" -ForegroundColor Gray
Write-Host "  5. Submit to Base Batches before Oct 24, 2025`n" -ForegroundColor Gray

Write-Host "🎉 Deployment script completed successfully!" -ForegroundColor Green

