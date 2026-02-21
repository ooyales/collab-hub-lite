# Collaboration Hub - Deployment Checklist & Go-Live Guide

## Overview

This document provides a comprehensive checklist for deploying the Collaboration Hub solution to production. Follow each section in order.

---

## Pre-Deployment Requirements

### Environment Verification

- [ ] Microsoft 365 tenant with E3 or E5 licenses for all 200 users
- [ ] SharePoint Online enabled
- [ ] Power Apps for M365 enabled (included with E3/E5)
- [ ] Power Automate for M365 enabled (included with E3/E5)
- [ ] Power BI Pro or Premium (for dashboard sharing)
- [ ] Microsoft Planner enabled
- [ ] Azure AD with CAC/PIV authentication configured

### Permissions Required

| Task | Required Role |
|------|---------------|
| Create SharePoint site | SharePoint Admin |
| Create Term Store taxonomy | Term Store Admin |
| Create Power Automate flows | Power Platform Environment Maker |
| Publish Power Apps | Power Platform Environment Maker |
| Create Power BI workspace | Power BI Admin or Workspace Admin |
| Create Planner Plan | Microsoft 365 Group Owner |
| Assign user permissions | SharePoint Site Collection Admin |

### Tools Required

- PowerShell 7.x
- PnP.PowerShell module (`Install-Module -Name PnP.PowerShell`)
- Power BI Desktop
- Web browser for Power Apps Studio and Power Automate

---

## Phase 1: SharePoint Foundation (Day 1)

### 1.1 Create SharePoint Site

```powershell
# Run from session1 folder
.\01-Install-Prerequisites.ps1
.\02-Configuration.ps1  # Edit with your tenant details first
.\03-Create-SharePoint-Site.ps1
```

**Verification:**
- [ ] Site accessible at: `https://[tenant].sharepoint.com/sites/CollaborationHub`
- [ ] Site logo and title set correctly
- [ ] Navigation shows expected links

### 1.2 Create Term Store Taxonomy

```powershell
.\04-Create-Term-Store.ps1
```

**Verification:**
- [ ] Term Group "Collaboration Hub" exists
- [ ] Term Sets: Asset Types, Document Types, CUI Categories, Departments, Task Priorities

### 1.3 Create Document Libraries

```powershell
.\05-Create-Document-Libraries.ps1
```

**Verification:**
- [ ] Contract Documents library exists with metadata columns
- [ ] Financial Documents library exists with metadata columns
- [ ] Technical Documents library exists with metadata columns
- [ ] Term Store columns linked correctly

### 1.4 Create SharePoint Lists

```powershell
# Run from sharepoint-refactor folder
.\02-Create-SharePoint-Lists.ps1
```

**Verification:**
- [ ] Assets list with all columns
- [ ] Tasks list with all columns
- [ ] Journals list with all columns
- [ ] Document Registry list with all columns
- [ ] ID Counters list with initial values (0, 0, 0, 0)
- [ ] All indexed columns configured
- [ ] Lookup relationships working

---

## Phase 2: Microsoft Planner Setup (Day 1)

### 2.1 Create Microsoft 365 Group

1. Go to Microsoft 365 Admin Center
2. Create new Microsoft 365 Group: "Collaboration Hub Team"
3. Add initial members (department leads)
4. Note the Group ID from Azure AD

**Group ID:** `_________________________________`

### 2.2 Create Planner Plan

1. Open Planner from Microsoft 365 app launcher
2. Create new plan: "Collaboration Hub Tasks"
3. Associate with the M365 Group created above

**Plan ID:** `_________________________________`

### 2.3 Create Buckets

Create the following buckets and note their IDs:

| Bucket Name | Bucket ID |
|-------------|-----------|
| Hardware | `_________________________________` |
| Software | `_________________________________` |
| Contract | `_________________________________` |
| Project | `_________________________________` |
| General | `_________________________________` |

### 2.4 Configure Category Labels

In Planner Plan settings, set category labels:
- Category 1 (Pink): Critical
- Category 2 (Red): High
- Category 3 (Yellow): Medium
- Category 4 (Green): Low

---

## Phase 3: Power Automate Flows (Day 2)

### 3.1 Import Flows

Import each flow from the `/flows` folder in Power Automate:

| Flow | Purpose | Status |
|------|---------|--------|
| CollabHub_GenerateID | Auto-generate sequential IDs | [ ] Imported |
| CollabHub_CreatePlannerTask_SP | Create tasks in Planner + SharePoint | [ ] Imported |
| CollabHub_SyncPlannerToSharePoint | Two-way sync every 15 min | [ ] Imported |
| CollabHub_RenewalAlerts_SP | Daily renewal notifications | [ ] Imported |
| CollabHub_DocumentUpload_SP | Handle document uploads | [ ] Imported |

### 3.2 Configure Flow Connections

For each flow:
1. Open the flow in edit mode
2. Update SharePoint site URL parameter
3. Update Planner Plan ID and Bucket IDs
4. Configure connections (SharePoint, Planner, Outlook, Teams)
5. Save and test

### 3.3 Flow Testing Checklist

| Test | Expected Result | Pass |
|------|-----------------|------|
| Generate Asset ID | Returns "AST-00001" | [ ] |
| Generate Task ID | Returns "TSK-00001" | [ ] |
| Create Planner Task | Task appears in Planner | [ ] |
| Planner Sync | Status changes sync both ways | [ ] |
| Document Upload | File appears in library | [ ] |

### 3.4 Enable Scheduled Flows

After testing, turn on:
- [ ] CollabHub_SyncPlannerToSharePoint (runs every 15 min)
- [ ] CollabHub_RenewalAlerts_SP (runs daily 8 AM)

---

## Phase 4: Power Apps Deployment (Day 2-3)

### 4.1 Import or Create Canvas App

1. Open Power Apps Studio (make.powerapps.com)
2. Create new Canvas App (Tablet format 1366×768)
3. Name: "Collaboration Hub"

### 4.2 Add Data Sources

Connect to SharePoint site and add:
- [ ] Assets
- [ ] Tasks
- [ ] Journals
- [ ] Document Registry
- [ ] ID Counters

### 4.3 Add Flow Connections

Connect Power Automate flows:
- [ ] CollabHub_GenerateID
- [ ] CollabHub_CreatePlannerTask_SP
- [ ] CollabHub_DocumentUpload_SP

### 4.4 Build/Update Screens

Using formulas from `03-PowerApps-Formulas.txt`:

| Screen | Components | Status |
|--------|------------|--------|
| Home (scrHome) | KPI cards, Quick Actions, Task preview | [ ] |
| My Tasks (scrMyTasks) | Task gallery, filters, checkboxes | [ ] |
| Assets (scrAssets) | Asset gallery, search, filters | [ ] |
| Asset Detail (scrAssetDetail) | Tabs, budget display, related items | [ ] |
| New Task (scrNewTask) | Form, flow trigger | [ ] |
| Journal Feed (scrJournalFeed) | Entry gallery, filters | [ ] |
| Upload Document (scrUploadDocument) | 3-step wizard | [ ] |

### 4.5 Test Power Apps

| Test | Steps | Pass |
|------|-------|------|
| Home loads | Open app, verify KPIs display | [ ] |
| Create task | Fill form, submit, verify in Planner | [ ] |
| View asset | Navigate to asset, check tabs | [ ] |
| Upload document | Use wizard, verify file in library | [ ] |
| Mark task complete | Check box, verify status updates | [ ] |

### 4.6 Publish App

1. File > Save
2. File > Publish
3. Share with Security Group for all users
4. Set app icon and description

---

## Phase 5: Power BI Dashboard (Day 3)

### 5.1 Create Power BI Report

1. Open Power BI Desktop
2. Get Data > SharePoint Online List
3. Connect to site: `https://[tenant].sharepoint.com/sites/CollaborationHub`
4. Select lists: Assets, Tasks, Journals, Document Registry

### 5.2 Apply Power Query Transformations

Copy M code from `powerbi/01-PowerBI-Configuration.ps1` for each table:
- [ ] Assets query updated
- [ ] Tasks query updated
- [ ] Journals query updated
- [ ] Documents query updated
- [ ] DateTable created

### 5.3 Create Relationships

| From | To | Cardinality |
|------|----|-------------|
| Tasks[RelatedAssetID] | Assets[AssetID] | Many:1 |
| Journals[RelatedAssetID] | Assets[AssetID] | Many:1 |
| Documents[RelatedAssetID] | Assets[AssetID] | Many:1 |
| DateTable[Date] | Assets[EndDate] | 1:Many |
| DateTable[Date] | Tasks[DueDate] | 1:Many |

### 5.4 Create Measures

Add measures from `powerbi/02-DAX-Measures.dax`:
- [ ] Asset measures (12 measures)
- [ ] Budget measures (9 measures)
- [ ] Task measures (17 measures)
- [ ] Consolidation measures (3 measures)
- [ ] Journal/Document measures (5 measures)
- [ ] Time intelligence measures (4 measures)
- [ ] Department measures (7 measures)

### 5.5 Build Dashboard Pages

| Page | Visuals | Status |
|------|---------|--------|
| Executive Summary | KPI cards, timeline, donuts | [ ] |
| Renewal Management | Gantt, table, bar charts | [ ] |
| Budget Analysis | Clustered bars, trend line, table | [ ] |
| Task Performance | Funnel, trend, stacked bar | [ ] |
| Consolidation Opportunities | Matrix, timeline, card | [ ] |
| Department Scorecard | Slicer, KPIs, table | [ ] |

### 5.6 Apply Theme

1. View > Themes > Browse for themes
2. Import `CollabHub_Theme.json`
3. Verify colors applied

### 5.7 Publish to Service

1. File > Publish > Publish to Power BI
2. Select workspace: "Collaboration Hub"
3. Configure scheduled refresh (daily 6 AM)
4. Share with appropriate users

---

## Phase 6: Security & Permissions (Day 4)

### 6.1 SharePoint Permissions

| Group | Members | Permission Level |
|-------|---------|------------------|
| Collaboration Hub Owners | Admins | Full Control |
| Collaboration Hub Members | All 200 users | Edit |
| Collaboration Hub Visitors | Executives (read-only) | Read |

### 6.2 Create Department Views (for filtering)

For each list, create views filtered by department:
- [ ] Assets - Operations View
- [ ] Assets - Engineering View
- [ ] Assets - Finance View
- [ ] Assets - Logistics View
- [ ] Assets - Administration View

(Repeat for Tasks, Journals, Documents)

### 6.3 Power BI Security

- [ ] Row-level security configured (optional)
- [ ] Workspace access granted to appropriate users
- [ ] Dashboard shared with organization

### 6.4 Power Apps Sharing

- [ ] App shared with Security Group "CollabHub-Users"
- [ ] Connection sharing verified
- [ ] Guest access disabled (NIPR requirement)

---

## Phase 7: User Training (Day 4-5)

### 7.1 Training Materials

- [ ] User Quick Start Guide (1-pager)
- [ ] Video walkthrough (5 min)
- [ ] FAQ document
- [ ] Support contact information

### 7.2 Training Sessions

| Session | Audience | Duration | Date |
|---------|----------|----------|------|
| Admin Training | IT Admins | 2 hours | _____ |
| Department Lead Training | 5 Leads | 1 hour | _____ |
| All-Hands Overview | 200 users | 30 min | _____ |
| Office Hours | Optional | 1 hour | _____ |

### 7.3 Support Plan

- Primary contact: _______________________
- Backup contact: _______________________
- Escalation path: _______________________
- Support hours: _______________________

---

## Phase 8: Go-Live (Day 5)

### 8.1 Final Pre-Launch Checklist

| Item | Verified By | Date |
|------|-------------|------|
| All flows running without errors | | |
| Power App accessible to all users | | |
| Power BI dashboard showing correct data | | |
| Planner tasks syncing properly | | |
| Document upload working | | |
| Email notifications sending | | |
| CAC authentication working | | |

### 8.2 Go-Live Steps

1. [ ] Send announcement email to all users
2. [ ] Enable all scheduled flows
3. [ ] Monitor first batch of user logins
4. [ ] Check flow run history for errors
5. [ ] Verify data appearing in dashboard

### 8.3 Post-Launch Monitoring (Week 1)

| Day | Check | Notes |
|-----|-------|-------|
| Day 1 | Flow errors, user access issues | |
| Day 2 | Planner sync working | |
| Day 3 | Renewal alerts sent | |
| Day 4 | Dashboard refresh working | |
| Day 5 | User feedback collection | |

---

## Rollback Plan

If critical issues occur:

1. **Power Apps**: Revert to previous published version
2. **Flows**: Turn off scheduled flows
3. **Data**: SharePoint versioning allows item restore
4. **Communication**: Pre-drafted email to users

---

## Post-Deployment Tasks

### Week 1-2
- [ ] Collect user feedback
- [ ] Address bug reports
- [ ] Fine-tune delegation queries if needed

### Month 1
- [ ] Review flow run history for errors
- [ ] Check Power BI refresh success rate
- [ ] Gather KPI baseline metrics

### Ongoing
- [ ] Monthly admin review
- [ ] Quarterly user survey
- [ ] Annual architecture review

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Lead | | | |
| IT Admin | | | |
| Business Owner | | | |
| Security Officer | | | |

---

## Appendix: Quick Reference

### Important URLs

| Resource | URL |
|----------|-----|
| SharePoint Site | https://[tenant].sharepoint.com/sites/CollaborationHub |
| Power Apps | https://make.powerapps.com |
| Power Automate | https://make.powerautomate.com |
| Power BI Service | https://app.powerbi.com |
| Planner | https://tasks.office.com |

### Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| IT Support | | | |
| Power Platform Admin | | | |
| SharePoint Admin | | | |

### Flow Schedule Summary

| Flow | Schedule | Purpose |
|------|----------|---------|
| Planner Sync | Every 15 min | Two-way task sync |
| Renewal Alerts | Daily 8 AM | Expiration notifications |
| Excel Sync | Every 15 min | Spreadsheet sync (if enabled) |

---

*Document Version: 3.0 (SharePoint Lists Edition)*
*Last Updated: January 2026*
