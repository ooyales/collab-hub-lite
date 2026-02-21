<#
.SYNOPSIS
    Collaboration Hub - Power BI Configuration (SharePoint Lists Version)
    
.DESCRIPTION
    Updated Power BI configuration and DAX measures for SharePoint Lists data source.
    This replaces the Dataverse-based Power BI configuration from Session 5.
    
.NOTES
    Version: 3.0 (SharePoint Lists Edition)
    Data Source: SharePoint Online Lists (not Dataverse)
#>

#=============================================================================
# POWER BI DATA SOURCE CONFIGURATION
#=============================================================================

$Global:PowerBIConfig = @{
    WorkspaceName = "Collaboration Hub"
    ReportName = "CollabHub Executive Dashboard"
    
    # SharePoint site URL for data connection
    SharePointSiteUrl = "https://YOUR-TENANT.sharepoint.com/sites/CollaborationHub"
    
    # Lists to connect (replacing Dataverse tables)
    DataSources = @{
        Assets = @{
            ListName = "Assets"
            RefreshMode = "Import"    # Import for better performance
        }
        Tasks = @{
            ListName = "Tasks"
            RefreshMode = "Import"
        }
        Journals = @{
            ListName = "Journals"
            RefreshMode = "Import"
        }
        Documents = @{
            ListName = "Document Registry"
            RefreshMode = "Import"
        }
    }
    
    # Refresh schedule
    RefreshSchedule = @{
        Enabled = $true
        Frequency = "Daily"
        Times = @("06:00", "12:00", "18:00")
        TimeZone = "Eastern Standard Time"
    }
}

#=============================================================================
# POWER QUERY M CODE FOR SHAREPOINT LISTS
#=============================================================================

# Use these in Power BI Desktop: Home > Transform Data > Advanced Editor

$Global:PowerQueryCode = @{
    
    # Assets List
    Assets = @'
let
    Source = SharePoint.Tables("https://YOUR-TENANT.sharepoint.com/sites/CollaborationHub", [Implementation="2.0", ViewMode="All"]),
    Assets_Table = Source{[Title="Assets"]}[Items],
    
    // Select and rename columns
    SelectColumns = Table.SelectColumns(Assets_Table, {
        "ID", "AssetID", "Title", "AssetType", "Status", "Description",
        "StartDate", "EndDate", "TotalBudget", "SpentToDate", 
        "Vendor", "ContractNumber", "Department", "Owner", "Notes", "Modified"
    }),
    
    // Extract choice values
    ExtractAssetType = Table.TransformColumns(SelectColumns, {"AssetType", each if _ = null then null else _[Value], type text}),
    ExtractStatus = Table.TransformColumns(ExtractAssetType, {"Status", each if _ = null then null else _[Value], type text}),
    ExtractDepartment = Table.TransformColumns(ExtractStatus, {"Department", each if _ = null then null else _[Value], type text}),
    
    // Extract person fields
    ExtractOwner = Table.TransformColumns(ExtractDepartment, {"Owner", each if _ = null then null else _[DisplayName], type text}),
    
    // Type conversions
    ChangeTypes = Table.TransformColumnTypes(ExtractOwner, {
        {"ID", Int64.Type},
        {"StartDate", type date},
        {"EndDate", type date},
        {"TotalBudget", Currency.Type},
        {"SpentToDate", Currency.Type},
        {"Modified", type datetime}
    }),
    
    // Add calculated columns
    AddDaysUntilExpiration = Table.AddColumn(ChangeTypes, "DaysUntilExpiration", 
        each if [EndDate] = null then null else Duration.Days([EndDate] - DateTime.Date(DateTime.LocalNow())), Int64.Type),
    
    AddIsExpired = Table.AddColumn(AddDaysUntilExpiration, "IsExpired", 
        each if [EndDate] = null then false else [EndDate] < DateTime.Date(DateTime.LocalNow()), type logical),
    
    AddIsExpiringSoon = Table.AddColumn(AddIsExpired, "IsExpiringSoon", 
        each if [DaysUntilExpiration] = null then false else [DaysUntilExpiration] <= 30 and [DaysUntilExpiration] > 0, type logical),
    
    AddRemainingBudget = Table.AddColumn(AddIsExpiringSoon, "RemainingBudget", 
        each if [TotalBudget] = null then null else [TotalBudget] - (if [SpentToDate] = null then 0 else [SpentToDate]), Currency.Type),
    
    AddBudgetUtilization = Table.AddColumn(AddRemainingBudget, "BudgetUtilizationPct", 
        each if [TotalBudget] = null or [TotalBudget] = 0 then null else [SpentToDate] / [TotalBudget], Percentage.Type),
    
    AddExpirationCategory = Table.AddColumn(AddBudgetUtilization, "ExpirationCategory", each 
        if [IsExpired] then "Expired"
        else if [DaysUntilExpiration] <= 7 then "7 Days"
        else if [DaysUntilExpiration] <= 30 then "30 Days"
        else if [DaysUntilExpiration] <= 60 then "60 Days"
        else if [DaysUntilExpiration] <= 90 then "90 Days"
        else "90+ Days", type text)
        
in
    AddExpirationCategory
'@

    # Tasks List
    Tasks = @'
let
    Source = SharePoint.Tables("https://YOUR-TENANT.sharepoint.com/sites/CollaborationHub", [Implementation="2.0", ViewMode="All"]),
    Tasks_Table = Source{[Title="Tasks"]}[Items],
    
    // Select columns
    SelectColumns = Table.SelectColumns(Tasks_Table, {
        "ID", "TaskID", "Title", "Description", "Priority", "Status",
        "DueDate", "CompletedDate", "AssignedTo", "AssignedBy",
        "RelatedAssetID", "PlannerTaskId", "PercentComplete", "Department", "Modified", "Created"
    }),
    
    // Extract choice values
    ExtractPriority = Table.TransformColumns(SelectColumns, {"Priority", each if _ = null then null else _[Value], type text}),
    ExtractStatus = Table.TransformColumns(ExtractPriority, {"Status", each if _ = null then null else _[Value], type text}),
    ExtractDepartment = Table.TransformColumns(ExtractStatus, {"Department", each if _ = null then null else _[Value], type text}),
    
    // Extract person fields
    ExtractAssignedTo = Table.TransformColumns(ExtractDepartment, {"AssignedTo", each if _ = null then null else _[DisplayName], type text}),
    ExtractAssignedBy = Table.TransformColumns(ExtractAssignedTo, {"AssignedBy", each if _ = null then null else _[DisplayName], type text}),
    
    // Type conversions
    ChangeTypes = Table.TransformColumnTypes(ExtractAssignedBy, {
        {"ID", Int64.Type},
        {"DueDate", type date},
        {"CompletedDate", type date},
        {"PercentComplete", Int64.Type},
        {"Modified", type datetime},
        {"Created", type datetime}
    }),
    
    // Add calculated columns
    AddIsOverdue = Table.AddColumn(ChangeTypes, "IsOverdue", 
        each if [DueDate] = null then false 
        else if [Status] = "Completed" then false 
        else [DueDate] < DateTime.Date(DateTime.LocalNow()), type logical),
    
    AddDaysOverdue = Table.AddColumn(AddIsOverdue, "DaysOverdue", 
        each if [IsOverdue] then Duration.Days(DateTime.Date(DateTime.LocalNow()) - [DueDate]) else 0, Int64.Type),
    
    AddCompletedOnTime = Table.AddColumn(AddDaysOverdue, "CompletedOnTime", 
        each if [Status] <> "Completed" then null 
        else if [CompletedDate] = null then null 
        else [CompletedDate] <= [DueDate], type logical)
        
in
    AddCompletedOnTime
'@

    # Journals List
    Journals = @'
let
    Source = SharePoint.Tables("https://YOUR-TENANT.sharepoint.com/sites/CollaborationHub", [Implementation="2.0", ViewMode="All"]),
    Journals_Table = Source{[Title="Journals"]}[Items],
    
    SelectColumns = Table.SelectColumns(Journals_Table, {
        "ID", "JournalID", "Title", "Body", "EntryDate", 
        "RelatedAssetID", "Department", "EntryType", "Author", "Created"
    }),
    
    ExtractDepartment = Table.TransformColumns(SelectColumns, {"Department", each if _ = null then null else _[Value], type text}),
    ExtractEntryType = Table.TransformColumns(ExtractDepartment, {"EntryType", each if _ = null then null else _[Value], type text}),
    ExtractAuthor = Table.TransformColumns(ExtractEntryType, {"Author", each if _ = null then null else _[DisplayName], type text}),
    
    ChangeTypes = Table.TransformColumnTypes(ExtractAuthor, {
        {"ID", Int64.Type},
        {"EntryDate", type datetime},
        {"Created", type datetime}
    })
in
    ChangeTypes
'@

    # Document Registry List
    Documents = @'
let
    Source = SharePoint.Tables("https://YOUR-TENANT.sharepoint.com/sites/CollaborationHub", [Implementation="2.0", ViewMode="All"]),
    Docs_Table = Source{[Title="Document Registry"]}[Items],
    
    SelectColumns = Table.SelectColumns(Docs_Table, {
        "ID", "DocumentID", "Title", "DocumentType", "CUICategory",
        "DateReceived", "RelatedAssetID", "LibraryName", "UploadedBy", "Department", "Created"
    }),
    
    ExtractDocType = Table.TransformColumns(SelectColumns, {"DocumentType", each if _ = null then null else _[Value], type text}),
    ExtractCUI = Table.TransformColumns(ExtractDocType, {"CUICategory", each if _ = null then null else _[Value], type text}),
    ExtractDepartment = Table.TransformColumns(ExtractCUI, {"Department", each if _ = null then null else _[Value], type text}),
    ExtractUploadedBy = Table.TransformColumns(ExtractDepartment, {"UploadedBy", each if _ = null then null else _[DisplayName], type text}),
    
    ChangeTypes = Table.TransformColumnTypes(ExtractUploadedBy, {
        {"ID", Int64.Type},
        {"DateReceived", type date},
        {"Created", type datetime}
    })
in
    ChangeTypes
'@

    # Date Table (unchanged from Dataverse version)
    DateTable = @'
let
    StartDate = #date(2024, 1, 1),
    EndDate = #date(2027, 12, 31),
    NumberOfDays = Duration.Days(EndDate - StartDate) + 1,
    DateList = List.Dates(StartDate, NumberOfDays, #duration(1, 0, 0, 0)),
    DateTable = Table.FromList(DateList, Splitter.SplitByNothing(), {"Date"}, null, ExtraValues.Error),
    ChangeType = Table.TransformColumnTypes(DateTable, {{"Date", type date}}),
    
    AddYear = Table.AddColumn(ChangeType, "Year", each Date.Year([Date]), Int64.Type),
    AddMonth = Table.AddColumn(AddYear, "Month", each Date.Month([Date]), Int64.Type),
    AddMonthName = Table.AddColumn(AddMonth, "MonthName", each Date.MonthName([Date]), type text),
    AddQuarter = Table.AddColumn(AddMonthName, "Quarter", each Date.QuarterOfYear([Date]), Int64.Type),
    AddWeek = Table.AddColumn(AddQuarter, "WeekOfYear", each Date.WeekOfYear([Date]), Int64.Type),
    AddDayOfWeek = Table.AddColumn(AddWeek, "DayOfWeek", each Date.DayOfWeek([Date]), Int64.Type),
    AddDayName = Table.AddColumn(AddDayOfWeek, "DayName", each Date.DayOfWeekName([Date]), type text),
    AddIsWeekend = Table.AddColumn(AddDayName, "IsWeekend", each Date.DayOfWeek([Date]) >= 5, type logical),
    
    // Fiscal year (Oct-Sep)
    AddFiscalYear = Table.AddColumn(AddIsWeekend, "FiscalYear", 
        each if Date.Month([Date]) >= 10 then Date.Year([Date]) + 1 else Date.Year([Date]), Int64.Type),
    AddFiscalQuarter = Table.AddColumn(AddFiscalYear, "FiscalQuarter", each 
        if Date.Month([Date]) >= 10 then Date.Month([Date]) - 9
        else if Date.Month([Date]) >= 7 then 4
        else if Date.Month([Date]) >= 4 then 3
        else if Date.Month([Date]) >= 1 then 2
        else 1, Int64.Type),
    
    AddYearMonth = Table.AddColumn(AddFiscalQuarter, "YearMonth", 
        each Date.Year([Date]) * 100 + Date.Month([Date]), Int64.Type),
    AddYearMonthName = Table.AddColumn(AddYearMonth, "YearMonthName", 
        each Text.From(Date.Year([Date])) & "-" & Text.PadStart(Text.From(Date.Month([Date])), 2, "0"), type text)
in
    AddYearMonthName
'@
}

Write-Host "Power BI configuration for SharePoint Lists loaded." -ForegroundColor Green
