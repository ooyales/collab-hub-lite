# Collaboration Hub - SharePoint Lists Configuration
# Version 3.0 (Non-Premium Edition)

$Global:TenantName = "YOUR-TENANT"
$Global:SiteUrl = "https://$($Global:TenantName).sharepoint.com/sites/CollaborationHub"
$Global:SiteName = "Collaboration Hub"
$Global:M365GroupId = "YOUR-GROUP-ID-HERE"
$Global:PlannerPlanId = "YOUR-PLAN-ID-HERE"

# Planner Buckets
$Global:PlannerBuckets = @{
    Hardware = "YOUR-HARDWARE-BUCKET-ID"
    Software = "YOUR-SOFTWARE-BUCKET-ID"
    Contract = "YOUR-CONTRACT-BUCKET-ID"
    Project = "YOUR-PROJECT-BUCKET-ID"
    General = "YOUR-GENERAL-BUCKET-ID"
}

Write-Host "Configuration loaded for: $Global:SiteUrl" -ForegroundColor Green
