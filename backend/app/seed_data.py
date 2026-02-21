"""
Seed data for Collaboration Hub Lite.
Creates realistic federal IT asset management demo data.
"""
from datetime import date, datetime, timedelta
from app.models import User, Asset, Task, Journal, Document, IDCounter, Notification


def seed_all(db):
    """Seed the database with demo data for all models."""

    today = date.today()
    now = datetime.utcnow()

    # ------------------------------------------------------------------ #
    # 1. USERS (10)
    # ------------------------------------------------------------------ #
    users_data = [
        ('admin@collabhub.local',    'Admin User',        'admin',   'Administration'),
        ('ops.lead@collabhub.local', 'Sarah Mitchell',    'member',  'Operations'),
        ('eng.lead@collabhub.local', 'James Rodriguez',   'member',  'Engineering'),
        ('fin.lead@collabhub.local', 'Patricia Chen',     'member',  'Finance'),
        ('log.lead@collabhub.local', 'Michael Thompson',  'member',  'Logistics'),
        ('admin.lead@collabhub.local', 'Karen Williams',  'member',  'Administration'),
        ('ops.analyst@collabhub.local', 'David Kim',      'member',  'Operations'),
        ('eng.analyst@collabhub.local', 'Lisa Patel',     'member',  'Engineering'),
        ('fin.analyst@collabhub.local', 'Robert Johnson', 'member',  'Finance'),
        ('exec@collabhub.local',     'Director Reynolds', 'visitor', 'Administration'),
    ]

    users = []
    for email, name, role, dept in users_data:
        u = User(email=email, display_name=name, role=role, department=dept)
        u.set_password('demo123')
        users.append(u)
    db.session.add_all(users)
    db.session.flush()  # get user IDs

    # Quick reference by index (0-based)
    admin_user    = users[0]   # Admin User
    ops_lead      = users[1]   # Sarah Mitchell
    eng_lead      = users[2]   # James Rodriguez
    fin_lead      = users[3]   # Patricia Chen
    log_lead      = users[4]   # Michael Thompson
    admin_lead    = users[5]   # Karen Williams
    ops_analyst   = users[6]   # David Kim
    eng_analyst   = users[7]   # Lisa Patel
    fin_analyst   = users[8]   # Robert Johnson
    exec_user     = users[9]   # Director Reynolds

    # ------------------------------------------------------------------ #
    # 2. ASSETS (20)
    # ------------------------------------------------------------------ #
    assets_data = [
        # --- HARDWARE (5) ---
        dict(
            asset_id='AST-00001', title='Cisco Catalyst 9300 Network Switches',
            asset_type='Hardware', status='Active',
            description='48-port PoE+ managed switches deployed across Building A and Building C server rooms. Supports 802.1X, MACsec, and SD-Access fabric.',
            start_date=today - timedelta(days=540), end_date=today + timedelta(days=180),
            total_budget=185000, spent_to_date=185000, vendor='Cisco Systems',
            contract_number='GS-35F-0123X', department='Engineering', owner_id=eng_lead.id,
            notes='Maintenance renewal due in 6 months. 24x7x4 TAC support.',
        ),
        dict(
            asset_id='AST-00002', title='Dell PowerEdge R750 Rack Servers',
            asset_type='Hardware', status='Active',
            description='Twelve rack-mounted servers hosting on-prem VMware cluster. Dual Xeon Gold 6348, 512GB RAM each. Located in primary data center.',
            start_date=today - timedelta(days=365), end_date=today + timedelta(days=365),
            total_budget=420000, spent_to_date=420000, vendor='Dell Technologies',
            contract_number='47QTCA20D0012', department='Engineering', owner_id=eng_lead.id,
            notes='ProSupport Plus with next business day on-site. Warranty extends to end date.',
        ),
        dict(
            asset_id='AST-00003', title='Palo Alto PA-5260 Firewalls',
            asset_type='Hardware', status='Pending Renewal',
            description='HA pair of next-gen firewalls at the network perimeter. Threat Prevention, URL Filtering, WildFire subscriptions.',
            start_date=today - timedelta(days=720), end_date=today + timedelta(days=22),
            total_budget=310000, spent_to_date=295000, vendor='Palo Alto Networks',
            contract_number='GS-35F-0456Y', department='Engineering', owner_id=eng_lead.id,
            notes='URGENT: Subscription renewal package under review. Threat feeds expire with contract.',
        ),
        dict(
            asset_id='AST-00004', title='Aruba Wireless Access Points (120 units)',
            asset_type='Hardware', status='Active',
            description='Campus-wide Wi-Fi 6E deployment. Aruba AP-635 access points managed by Aruba Central cloud controller.',
            start_date=today - timedelta(days=210), end_date=today + timedelta(days=520),
            total_budget=275000, spent_to_date=275000, vendor='Aruba Networks (HPE)',
            contract_number='47QTCA21D0098', department='Operations', owner_id=ops_lead.id,
            notes='Phase 2 expansion to annex building planned for Q3.',
        ),
        dict(
            asset_id='AST-00005', title='NetApp AFF A400 Storage Array',
            asset_type='Hardware', status='Expired',
            description='Primary SAN providing iSCSI and NFS for VMware datastores. 200TB raw NVMe flash. Support contract has lapsed.',
            start_date=today - timedelta(days=1100), end_date=today - timedelta(days=15),
            total_budget=580000, spent_to_date=580000, vendor='NetApp',
            contract_number='GS-35F-0789Z', department='Engineering', owner_id=eng_lead.id,
            notes='CRITICAL: Support expired. Replacement procurement in progress under AST-00020.',
        ),

        # --- SOFTWARE (6) ---
        dict(
            asset_id='AST-00006', title='ServiceNow ITSM Platform License',
            asset_type='Software', status='Active',
            description='Enterprise ITSM suite: Incident, Problem, Change, CMDB, Service Catalog. 500 fulfiller licenses, unlimited requestors.',
            start_date=today - timedelta(days=300), end_date=today + timedelta(days=65),
            total_budget=890000, spent_to_date=667500, vendor='ServiceNow',
            contract_number='GS-35F-0234A', department='Operations', owner_id=ops_lead.id,
            notes='Annual true-up in 60 days. Usage trending 12% above licensed count.',
        ),
        dict(
            asset_id='AST-00007', title='Microsoft 365 GCC High Licenses',
            asset_type='Software', status='Active',
            description='2,400 E5 GCC High licenses covering Exchange, Teams, SharePoint, Defender, Intune, Purview. FedRAMP High authorized.',
            start_date=today - timedelta(days=180), end_date=today + timedelta(days=185),
            total_budget=2500000, spent_to_date=1250000, vendor='Microsoft',
            contract_number='47QTCA22D0055', department='Administration', owner_id=admin_lead.id,
            notes='Co-term renewal aligned with ELA anniversary date.',
        ),
        dict(
            asset_id='AST-00008', title='VMware vSphere Enterprise Plus',
            asset_type='Software', status='Pending Renewal',
            description='On-prem virtualization for 12 hosts. vCenter Server, vSAN, NSX-T included. Broadcom acquisition changed licensing model.',
            start_date=today - timedelta(days=365), end_date=today + timedelta(days=5),
            total_budget=210000, spent_to_date=210000, vendor='VMware (Broadcom)',
            contract_number='GS-35F-0567B', department='Engineering', owner_id=eng_lead.id,
            notes='URGENT: New Broadcom subscription pricing significantly higher. Evaluate alternatives.',
        ),
        dict(
            asset_id='AST-00009', title='Splunk Enterprise Security (SIEM)',
            asset_type='Software', status='Active',
            description='Security information and event management. 500GB/day ingest license. Deployed in FedRAMP boundary for continuous monitoring.',
            start_date=today - timedelta(days=200), end_date=today + timedelta(days=165),
            total_budget=475000, spent_to_date=316667, vendor='Splunk (Cisco)',
            contract_number='GS-35F-0890C', department='Engineering', owner_id=eng_analyst.id,
            notes='Ingest growing 8% quarterly. May need uplift at renewal.',
        ),
        dict(
            asset_id='AST-00010', title='Tenable.sc Vulnerability Scanner',
            asset_type='Software', status='Active',
            description='On-prem vulnerability management. Nessus scanners covering 5,000 assets. Feeds into Splunk SIEM for risk scoring.',
            start_date=today - timedelta(days=150), end_date=today + timedelta(days=215),
            total_budget=125000, spent_to_date=51370, vendor='Tenable',
            contract_number='47QTCA23D0071', department='Engineering', owner_id=eng_analyst.id,
            notes='Considering migration to Tenable.io cloud version at next renewal.',
        ),
        dict(
            asset_id='AST-00011', title='Tableau Server Analytics Platform',
            asset_type='Software', status='Retired',
            description='Business intelligence and data visualization. Replaced by Power BI as part of Microsoft 365 consolidation.',
            start_date=today - timedelta(days=900), end_date=today - timedelta(days=60),
            total_budget=95000, spent_to_date=95000, vendor='Tableau (Salesforce)',
            contract_number='GS-35F-0345D', department='Finance', owner_id=fin_lead.id,
            notes='Decommissioned. Migration to Power BI completed. 42 dashboards migrated.',
        ),

        # --- CONTRACTS (5) ---
        dict(
            asset_id='AST-00012', title='SAIC Help Desk Support Contract',
            asset_type='Contract', status='Active',
            description='Tier 1-3 help desk operations, 18 FTEs. 24x7 coverage, 15-min SLA for P1 incidents. Option year 3 of 5.',
            start_date=today - timedelta(days=900), end_date=today + timedelta(days=82),
            total_budget=2200000, spent_to_date=1870000, vendor='SAIC',
            contract_number='47QTCA19D0033', department='Operations', owner_id=ops_lead.id,
            notes='Option year 4 exercise due within 60 days. CPARS rating: Exceptional.',
        ),
        dict(
            asset_id='AST-00013', title='Leidos Cloud Migration Services',
            asset_type='Contract', status='Active',
            description='Cloud migration and managed services for AWS GovCloud. Lift-and-shift plus re-architecture for 35 applications.',
            start_date=today - timedelta(days=450), end_date=today + timedelta(days=280),
            total_budget=1800000, spent_to_date=1080000, vendor='Leidos',
            contract_number='47QTCA21D0044', department='Engineering', owner_id=eng_lead.id,
            notes='22 of 35 apps migrated. On track for completion by end of performance period.',
        ),
        dict(
            asset_id='AST-00014', title='Booz Allen Cybersecurity Assessment',
            asset_type='Contract', status='Active',
            description='Annual security assessment, penetration testing, and ATO support. Includes FISMA audit preparation and POA&M remediation tracking.',
            start_date=today - timedelta(days=120), end_date=today + timedelta(days=245),
            total_budget=650000, spent_to_date=214500, vendor='Booz Allen Hamilton',
            contract_number='GS-35F-0678E', department='Engineering', owner_id=eng_lead.id,
            notes='Phase 1 (assessment) complete. Phase 2 (remediation support) in progress.',
        ),
        dict(
            asset_id='AST-00015', title='Deloitte ERP Modernization Advisory',
            asset_type='Contract', status='Expired',
            description='Advisory services for legacy ERP replacement. Market research, AoA, and acquisition strategy development.',
            start_date=today - timedelta(days=400), end_date=today - timedelta(days=35),
            total_budget=480000, spent_to_date=480000, vendor='Deloitte',
            contract_number='GS-35F-0901F', department='Finance', owner_id=fin_lead.id,
            notes='Contract ended. Final deliverable (Acquisition Strategy) accepted. Procurement phase begins Q2.',
        ),
        dict(
            asset_id='AST-00016', title='AWS GovCloud Infrastructure (IaaS)',
            asset_type='Contract', status='Active',
            description='AWS GovCloud (US-West) consumption contract via GSA Cloud SIN. EC2, RDS, S3, Lambda, CloudFront. Monthly spend tracking.',
            start_date=today - timedelta(days=365), end_date=today + timedelta(days=365),
            total_budget=960000, spent_to_date=540000, vendor='Amazon Web Services',
            contract_number='47QTCA22D0088', department='Engineering', owner_id=eng_lead.id,
            notes='FinOps review identified $8K/month savings opportunity in reserved instances.',
        ),

        # --- PROJECTS (4) ---
        dict(
            asset_id='AST-00017', title='Network Modernization Phase 2',
            asset_type='Project', status='Active',
            description='Replace legacy Catalyst 6500 core switches with Nexus 9000 spine-leaf fabric. Includes SD-WAN deployment to 6 regional offices.',
            start_date=today - timedelta(days=90), end_date=today + timedelta(days=180),
            total_budget=1250000, spent_to_date=437500, vendor='Cisco Systems',
            contract_number='GS-35F-0123X', department='Engineering', owner_id=eng_lead.id,
            notes='Phase 1 (core switch replacement) 90% complete. SD-WAN pilot at 2 sites underway.',
        ),
        dict(
            asset_id='AST-00018', title='Zero Trust Architecture Implementation',
            asset_type='Project', status='Active',
            description='Implement Zero Trust per OMB M-22-09 and CISA maturity model. Identity pillar (Okta), device pillar (CrowdStrike), network pillar (Zscaler).',
            start_date=today - timedelta(days=150), end_date=today + timedelta(days=210),
            total_budget=2100000, spent_to_date=840000, vendor='Multiple (Okta, CrowdStrike, Zscaler)',
            contract_number='Multiple', department='Engineering', owner_id=eng_lead.id,
            notes='Identity pillar 80% deployed. Device pillar in pilot. Network pillar procurement pending.',
        ),
        dict(
            asset_id='AST-00019', title='FY26 IT Budget Planning and Forecasting',
            asset_type='Project', status='Active',
            description='Annual IT budget development for FY26 submission. Includes OMB Exhibit 53, IT Dashboard updates, and TBM cost model refresh.',
            start_date=today - timedelta(days=60), end_date=today + timedelta(days=50),
            total_budget=0, spent_to_date=0, vendor=None,
            contract_number=None, department='Finance', owner_id=fin_lead.id,
            notes='Draft budget due to CFO in 45 days. 70% of inputs collected from program offices.',
        ),
        dict(
            asset_id='AST-00020', title='Data Center Storage Refresh (NetApp Replacement)',
            asset_type='Project', status='Active',
            description='Replace end-of-life NetApp AFF A400 (AST-00005). Evaluating Pure Storage FlashArray, Dell PowerStore, and NetApp AFF A900.',
            start_date=today - timedelta(days=30), end_date=today + timedelta(days=150),
            total_budget=750000, spent_to_date=25000, vendor='TBD (Procurement in progress)',
            contract_number=None, department='Engineering', owner_id=eng_lead.id,
            notes='Market research complete. RFQ drafting in progress. Target award date: 60 days.',
        ),
    ]

    assets = []
    for a_data in assets_data:
        assets.append(Asset(**a_data))
    db.session.add_all(assets)
    db.session.flush()

    # Build asset lookup by asset_id string for convenience
    asset_map = {a.asset_id: a for a in assets}

    # ------------------------------------------------------------------ #
    # 3. TASKS (30)
    # ------------------------------------------------------------------ #
    tasks_data = [
        # --- Hardware tasks ---
        dict(
            task_id='TSK-00001', title='Renew Palo Alto firewall subscriptions',
            description='Threat Prevention, URL Filtering, and WildFire subscriptions expire with the support contract. Obtain renewal quote and submit requisition.',
            priority='Critical', status='In Progress', due_date=today + timedelta(days=10),
            assigned_to_id=eng_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00003'].id, related_asset_id_str='AST-00003',
            percent_complete=60, department='Engineering', bucket='Hardware',
        ),
        dict(
            task_id='TSK-00002', title='Schedule Cisco switch firmware upgrade',
            description='Catalyst 9300 switches need IOS-XE 17.12 for critical CVE patches. Coordinate maintenance window with NOC.',
            priority='High', status='Not Started', due_date=today + timedelta(days=14),
            assigned_to_id=eng_analyst.id, assigned_by_id=eng_lead.id,
            asset_id=asset_map['AST-00001'].id, related_asset_id_str='AST-00001',
            percent_complete=0, department='Engineering', bucket='Hardware',
        ),
        dict(
            task_id='TSK-00003', title='Inventory Aruba AP serial numbers for annex expansion',
            description='Verify current AP inventory and identify coverage gaps in annex building for Phase 2 wireless deployment.',
            priority='Medium', status='Completed', due_date=today - timedelta(days=5),
            completed_date=today - timedelta(days=7),
            assigned_to_id=ops_analyst.id, assigned_by_id=ops_lead.id,
            asset_id=asset_map['AST-00004'].id, related_asset_id_str='AST-00004',
            percent_complete=100, department='Operations', bucket='Hardware',
        ),
        dict(
            task_id='TSK-00004', title='Decommission expired NetApp storage array',
            description='Initiate ITAD process for the NetApp AFF A400. Coordinate data migration, sanitize drives per NIST 800-88, update CMDB.',
            priority='High', status='In Progress', due_date=today + timedelta(days=30),
            assigned_to_id=eng_analyst.id, assigned_by_id=eng_lead.id,
            asset_id=asset_map['AST-00005'].id, related_asset_id_str='AST-00005',
            percent_complete=30, department='Engineering', bucket='Hardware',
        ),
        dict(
            task_id='TSK-00005', title='Update Dell server BIOS and iDRAC firmware',
            description='Apply latest BIOS 2.18 and iDRAC 7.10 firmware to all 12 PowerEdge R750 servers. Follow change management process.',
            priority='Medium', status='Not Started', due_date=today + timedelta(days=21),
            assigned_to_id=eng_analyst.id, assigned_by_id=eng_lead.id,
            asset_id=asset_map['AST-00002'].id, related_asset_id_str='AST-00002',
            percent_complete=0, department='Engineering', bucket='Hardware',
        ),

        # --- Software tasks ---
        dict(
            task_id='TSK-00006', title='Evaluate VMware licensing alternatives',
            description='Broadcom changed VMware licensing significantly. Evaluate Nutanix AHV, Proxmox, and Microsoft Hyper-V as potential replacements. Prepare cost comparison.',
            priority='Critical', status='In Progress', due_date=today + timedelta(days=3),
            assigned_to_id=eng_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00008'].id, related_asset_id_str='AST-00008',
            percent_complete=75, department='Engineering', bucket='Software',
        ),
        dict(
            task_id='TSK-00007', title='Conduct ServiceNow license true-up audit',
            description='Usage is 12% over licensed fulfiller count. Identify inactive accounts, shared logins, and potential reclamation before true-up.',
            priority='High', status='In Progress', due_date=today + timedelta(days=20),
            assigned_to_id=ops_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00006'].id, related_asset_id_str='AST-00006',
            percent_complete=40, department='Operations', bucket='Software',
        ),
        dict(
            task_id='TSK-00008', title='Complete Tableau to Power BI dashboard migration',
            description='Final 3 dashboards (CFO Executive, Budget Variance, Travel Spend) still reference Tableau data sources. Update connections.',
            priority='Low', status='Completed', due_date=today - timedelta(days=30),
            completed_date=today - timedelta(days=25),
            assigned_to_id=fin_analyst.id, assigned_by_id=fin_lead.id,
            asset_id=asset_map['AST-00011'].id, related_asset_id_str='AST-00011',
            percent_complete=100, department='Finance', bucket='Software',
        ),
        dict(
            task_id='TSK-00009', title='Configure Splunk dashboards for ZTA telemetry',
            description='Create Splunk dashboards to ingest and visualize Zero Trust telemetry from Okta, CrowdStrike, and Zscaler. Align with CISA maturity model metrics.',
            priority='High', status='In Progress', due_date=today + timedelta(days=28),
            assigned_to_id=eng_analyst.id, assigned_by_id=eng_lead.id,
            asset_id=asset_map['AST-00009'].id, related_asset_id_str='AST-00009',
            percent_complete=25, department='Engineering', bucket='Software',
        ),
        dict(
            task_id='TSK-00010', title='Run quarterly Tenable vulnerability scan',
            description='Execute full credentialed scan across all 5,000 assets. Generate FISMA quarterly report and update POA&M tracker.',
            priority='High', status='Not Started', due_date=today + timedelta(days=7),
            assigned_to_id=eng_analyst.id, assigned_by_id=eng_lead.id,
            asset_id=asset_map['AST-00010'].id, related_asset_id_str='AST-00010',
            percent_complete=0, department='Engineering', bucket='Software',
        ),
        dict(
            task_id='TSK-00011', title='Renew Microsoft 365 GCC High E5 licenses',
            description='Co-term renewal for 2,400 E5 GCC High licenses. Coordinate with Microsoft account team and GSA schedule holder.',
            priority='Medium', status='Not Started', due_date=today + timedelta(days=90),
            assigned_to_id=admin_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00007'].id, related_asset_id_str='AST-00007',
            percent_complete=0, department='Administration', bucket='Software',
        ),

        # --- Contract tasks ---
        dict(
            task_id='TSK-00012', title='Submit SAIC option year 4 exercise justification',
            description='Prepare option year justification memo, updated IGCE, and D&F for COR signature. Option must be exercised 60 days before current period ends.',
            priority='Critical', status='In Progress', due_date=today + timedelta(days=15),
            assigned_to_id=ops_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00012'].id, related_asset_id_str='AST-00012',
            percent_complete=50, department='Operations', bucket='Contract',
        ),
        dict(
            task_id='TSK-00013', title='Review Leidos monthly progress report',
            description='Review January cloud migration progress report. Verify 3 application migrations completed and SLA compliance metrics.',
            priority='Medium', status='Completed', due_date=today - timedelta(days=3),
            completed_date=today - timedelta(days=2),
            assigned_to_id=eng_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00013'].id, related_asset_id_str='AST-00013',
            percent_complete=100, department='Engineering', bucket='Contract',
        ),
        dict(
            task_id='TSK-00014', title='Complete CPARS evaluation for Deloitte advisory contract',
            description='Final CPARS evaluation due for the completed ERP Modernization Advisory contract. Assess quality, schedule, cost, and management.',
            priority='High', status='Blocked', due_date=today - timedelta(days=10),
            assigned_to_id=fin_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00015'].id, related_asset_id_str='AST-00015',
            percent_complete=20, department='Finance', bucket='Contract',
        ),
        dict(
            task_id='TSK-00015', title='Review Booz Allen Phase 2 remediation plan',
            description='Review the POA&M remediation plan from Phase 1 assessment findings. Prioritize critical and high findings for immediate action.',
            priority='High', status='Not Started', due_date=today + timedelta(days=10),
            assigned_to_id=eng_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00014'].id, related_asset_id_str='AST-00014',
            percent_complete=0, department='Engineering', bucket='Contract',
        ),
        dict(
            task_id='TSK-00016', title='Analyze AWS GovCloud monthly billing for FinOps savings',
            description='Review last 3 months of AWS Cost Explorer data. Identify reserved instance opportunities and right-sizing recommendations for EC2 and RDS.',
            priority='Medium', status='In Progress', due_date=today + timedelta(days=18),
            assigned_to_id=fin_analyst.id, assigned_by_id=fin_lead.id,
            asset_id=asset_map['AST-00016'].id, related_asset_id_str='AST-00016',
            percent_complete=45, department='Finance', bucket='Contract',
        ),
        dict(
            task_id='TSK-00017', title='Prepare SAIC help desk performance scorecard',
            description='Compile monthly SLA performance data: average speed to answer, first-call resolution rate, P1 response times, customer satisfaction score.',
            priority='Medium', status='Completed', due_date=today - timedelta(days=8),
            completed_date=today - timedelta(days=6),
            assigned_to_id=ops_analyst.id, assigned_by_id=ops_lead.id,
            asset_id=asset_map['AST-00012'].id, related_asset_id_str='AST-00012',
            percent_complete=100, department='Operations', bucket='Contract',
        ),

        # --- Project tasks ---
        dict(
            task_id='TSK-00018', title='Complete spine-leaf fabric cabling in Building A',
            description='Install and terminate fiber cabling for Nexus 9000 spine-leaf topology in Building A MDF/IDFs. 48-strand OM4 multimode.',
            priority='High', status='In Progress', due_date=today + timedelta(days=25),
            assigned_to_id=eng_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00017'].id, related_asset_id_str='AST-00017',
            percent_complete=65, department='Engineering', bucket='Project',
        ),
        dict(
            task_id='TSK-00019', title='Deploy Okta SSO for remaining 15 applications',
            description='ZTA Identity pillar: integrate remaining 15 SAML/OIDC applications with Okta. Includes conditional access policies and MFA enforcement.',
            priority='High', status='In Progress', due_date=today + timedelta(days=45),
            assigned_to_id=eng_analyst.id, assigned_by_id=eng_lead.id,
            asset_id=asset_map['AST-00018'].id, related_asset_id_str='AST-00018',
            percent_complete=35, department='Engineering', bucket='Project',
        ),
        dict(
            task_id='TSK-00020', title='Collect FY26 IT budget inputs from program offices',
            description='Send budget data call to 8 program offices. Collect FY26 requirements, FY25 carryover estimates, and unfunded requirements list.',
            priority='High', status='In Progress', due_date=today + timedelta(days=12),
            assigned_to_id=fin_analyst.id, assigned_by_id=fin_lead.id,
            asset_id=asset_map['AST-00019'].id, related_asset_id_str='AST-00019',
            percent_complete=70, department='Finance', bucket='Project',
        ),
        dict(
            task_id='TSK-00021', title='Draft storage refresh RFQ for contracting officer',
            description='Prepare RFQ package for the NetApp replacement. Include performance specs, evaluation criteria, and Section 508 requirements.',
            priority='Critical', status='In Progress', due_date=today + timedelta(days=14),
            assigned_to_id=eng_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00020'].id, related_asset_id_str='AST-00020',
            percent_complete=40, department='Engineering', bucket='Project',
        ),
        dict(
            task_id='TSK-00022', title='Validate SD-WAN pilot site configurations',
            description='Verify Viptela SD-WAN overlay configurations at regional office pilot sites (Atlanta and Denver). Run iPerf and voice quality tests.',
            priority='Medium', status='Not Started', due_date=today + timedelta(days=35),
            assigned_to_id=eng_analyst.id, assigned_by_id=eng_lead.id,
            asset_id=asset_map['AST-00017'].id, related_asset_id_str='AST-00017',
            percent_complete=0, department='Engineering', bucket='Project',
        ),

        # --- General / cross-cutting tasks ---
        dict(
            task_id='TSK-00023', title='Update asset inventory in ServiceNow CMDB',
            description='Reconcile physical asset inventory with CMDB records. 15 new assets, 8 disposals, and 22 attribute changes identified during audit.',
            priority='Medium', status='In Progress', due_date=today + timedelta(days=10),
            assigned_to_id=ops_analyst.id, assigned_by_id=ops_lead.id,
            asset_id=None, related_asset_id_str=None,
            percent_complete=55, department='Operations', bucket='General',
        ),
        dict(
            task_id='TSK-00024', title='Prepare quarterly IT governance briefing',
            description='Compile slides for OCIO quarterly governance board: portfolio health, budget status, risk register updates, and major milestones.',
            priority='High', status='Not Started', due_date=today + timedelta(days=18),
            assigned_to_id=admin_lead.id, assigned_by_id=exec_user.id,
            asset_id=None, related_asset_id_str=None,
            percent_complete=0, department='Administration', bucket='General',
        ),
        dict(
            task_id='TSK-00025', title='Conduct annual disaster recovery tabletop exercise',
            description='Coordinate DR tabletop exercise with all IT teams. Scenario: primary data center outage. Validate RTO/RPO for Tier 1 applications.',
            priority='High', status='Not Started', due_date=today + timedelta(days=40),
            assigned_to_id=ops_lead.id, assigned_by_id=admin_user.id,
            asset_id=None, related_asset_id_str=None,
            percent_complete=0, department='Operations', bucket='General',
        ),
        dict(
            task_id='TSK-00026', title='Review and update IT contingency plans (ISCP)',
            description='Annual review of Information System Contingency Plans for 12 FISMA systems. Update contact lists, recovery procedures, and test results.',
            priority='Medium', status='Blocked', due_date=today - timedelta(days=5),
            assigned_to_id=ops_analyst.id, assigned_by_id=ops_lead.id,
            asset_id=None, related_asset_id_str=None,
            percent_complete=10, department='Operations', bucket='General',
        ),
        dict(
            task_id='TSK-00027', title='Onboard new CrowdStrike Falcon agents to endpoints',
            description='Deploy CrowdStrike Falcon Insight EDR agents to 400 remaining endpoints as part of Zero Trust device pillar rollout.',
            priority='High', status='In Progress', due_date=today + timedelta(days=30),
            assigned_to_id=eng_analyst.id, assigned_by_id=eng_lead.id,
            asset_id=asset_map['AST-00018'].id, related_asset_id_str='AST-00018',
            percent_complete=50, department='Engineering', bucket='Project',
        ),
        dict(
            task_id='TSK-00028', title='Finalize Exhibit 53 and IT Dashboard submission',
            description='Complete OMB Exhibit 53 for FY26 budget. Update IT Dashboard investment entries for all major and standard IT investments.',
            priority='Critical', status='Not Started', due_date=today + timedelta(days=40),
            assigned_to_id=fin_lead.id, assigned_by_id=exec_user.id,
            asset_id=asset_map['AST-00019'].id, related_asset_id_str='AST-00019',
            percent_complete=0, department='Finance', bucket='Project',
        ),
        dict(
            task_id='TSK-00029', title='Migrate 5 applications to AWS GovCloud',
            description='Leidos contract deliverable: migrate batch 8 applications (HR Portal, Travel System, Grants Tracker, Fleet Manager, Time & Attendance).',
            priority='High', status='In Progress', due_date=today + timedelta(days=60),
            assigned_to_id=eng_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00013'].id, related_asset_id_str='AST-00013',
            percent_complete=20, department='Engineering', bucket='Contract',
        ),
        dict(
            task_id='TSK-00030', title='Complete Zscaler ZPA procurement package',
            description='ZTA network pillar: prepare acquisition package for Zscaler Private Access. Includes market research, IGCE, sole source J&A (if applicable).',
            priority='Medium', status='Not Started', due_date=today + timedelta(days=50),
            assigned_to_id=eng_lead.id, assigned_by_id=admin_user.id,
            asset_id=asset_map['AST-00018'].id, related_asset_id_str='AST-00018',
            percent_complete=0, department='Engineering', bucket='Project',
        ),
    ]

    tasks = []
    for t_data in tasks_data:
        tasks.append(Task(**t_data))
    db.session.add_all(tasks)
    db.session.flush()

    # ------------------------------------------------------------------ #
    # 4. JOURNAL ENTRIES (25)
    # ------------------------------------------------------------------ #
    journals_data = [
        dict(
            journal_id='JRN-00001', title='Palo Alto firewall renewal pricing received',
            body='Received renewal quote from Palo Alto via CDW-G. 3-year Threat Prevention + WildFire bundle: $142,000 (12% increase from current term). URL Filtering add-on: $18,500. Forwarded to Patricia Chen for budget availability check.',
            entry_date=now - timedelta(days=3), entry_type='Update',
            asset_id=asset_map['AST-00003'].id, related_asset_id_str='AST-00003',
            department='Engineering', author_id=eng_lead.id,
        ),
        dict(
            journal_id='JRN-00002', title='Decision: Proceed with Palo Alto renewal over Fortinet alternative',
            body='After evaluating Fortinet FortiGate 3700F as an alternative, the team decided to renew existing Palo Alto PA-5260 pair. Rationale: (1) Rip-and-replace cost exceeds renewal premium, (2) Staff certified on PAN-OS, (3) Integration with Splunk SIEM already configured. CTO approved via email.',
            entry_date=now - timedelta(days=1), entry_type='Decision',
            asset_id=asset_map['AST-00003'].id, related_asset_id_str='AST-00003',
            department='Engineering', author_id=admin_user.id,
        ),
        dict(
            journal_id='JRN-00003', title='NetApp storage array support lapse notification',
            body='NetApp support contract expired on schedule. All data has been replicated to temporary Dell storage. No new writes to NetApp arrays. ITAD ticket ITAD-2026-0041 opened for sanitization and disposal.',
            entry_date=now - timedelta(days=15), entry_type='Issue',
            asset_id=asset_map['AST-00005'].id, related_asset_id_str='AST-00005',
            department='Engineering', author_id=eng_analyst.id,
        ),
        dict(
            journal_id='JRN-00004', title='VMware licensing change impact assessment complete',
            body='Broadcom new subscription model would increase VMware costs by approximately 185% ($389K vs current $210K). Assessment of alternatives: Nutanix AHV (estimated $195K, 6-month migration), Proxmox VE (OSS, $45K support contract, 9-month migration), Hyper-V (included in EA, 8-month migration). Recommending Nutanix AHV short-list for deeper evaluation.',
            entry_date=now - timedelta(days=5), entry_type='Update',
            asset_id=asset_map['AST-00008'].id, related_asset_id_str='AST-00008',
            department='Engineering', author_id=eng_lead.id,
        ),
        dict(
            journal_id='JRN-00005', title='SAIC help desk SLA performance review - January',
            body='January metrics: ASA 18 seconds (SLA: 30 sec), FCR 78% (SLA: 75%), P1 response 8 min (SLA: 15 min), CSAT 4.3/5.0. All SLAs met. One P1 incident (Exchange outage) handled within SLA. Ticket volume up 6% MoM due to Windows update issues.',
            entry_date=now - timedelta(days=8), entry_type='Note',
            asset_id=asset_map['AST-00012'].id, related_asset_id_str='AST-00012',
            department='Operations', author_id=ops_analyst.id,
        ),
        dict(
            journal_id='JRN-00006', title='Leidos cloud migration: Batch 7 complete',
            body='Batch 7 migration complete: Financial Reporting System, Inventory Tracker, and Document Archive successfully migrated to AWS GovCloud. All three passed smoke testing and are in 2-week parallel operation period. Running total: 22/35 applications migrated.',
            entry_date=now - timedelta(days=12), entry_type='Milestone',
            asset_id=asset_map['AST-00013'].id, related_asset_id_str='AST-00013',
            department='Engineering', author_id=eng_lead.id,
        ),
        dict(
            journal_id='JRN-00007', title='Booz Allen Phase 1 assessment findings summary',
            body='Phase 1 assessment identified 147 findings: 3 Critical, 18 High, 67 Medium, 59 Low. Critical findings: (1) Unpatched Exchange 2016 CVE-2024-21410, (2) Default credentials on 4 network devices, (3) Missing MFA on 2 admin portals. All 3 critical findings have been immediately remediated. High findings remediation plan due in 30 days.',
            entry_date=now - timedelta(days=20), entry_type='Update',
            asset_id=asset_map['AST-00014'].id, related_asset_id_str='AST-00014',
            department='Engineering', author_id=eng_lead.id,
        ),
        dict(
            journal_id='JRN-00008', title='Deloitte advisory contract closeout complete',
            body='All deliverables accepted and invoiced. Final deliverable (Acquisition Strategy for ERP Modernization) received Satisfactory rating. Lessons learned documented. Recommended follow-on procurement strategy: full and open competition via GSA OASIS+.',
            entry_date=now - timedelta(days=35), entry_type='Milestone',
            asset_id=asset_map['AST-00015'].id, related_asset_id_str='AST-00015',
            department='Finance', author_id=fin_lead.id,
        ),
        dict(
            journal_id='JRN-00009', title='AWS GovCloud FinOps review findings',
            body='Monthly AWS spend: $72K (up from $68K). Identified $8K/month savings: (1) Convert 14 EC2 instances to reserved ($4.2K), (2) Right-size 8 over-provisioned RDS instances ($2.1K), (3) Enable S3 Intelligent Tiering on archive buckets ($1.7K). Implementation plan drafted.',
            entry_date=now - timedelta(days=6), entry_type='Update',
            asset_id=asset_map['AST-00016'].id, related_asset_id_str='AST-00016',
            department='Finance', author_id=fin_analyst.id,
        ),
        dict(
            journal_id='JRN-00010', title='Network Modernization Phase 1 core switches installed',
            body='Successfully installed and configured 4x Nexus 9364C spine switches and 12x Nexus 93180YC-FX3 leaf switches in Building A. OSPF underlay and VXLAN EVPN overlay validated. Traffic cutover from legacy Catalyst 6500 completed during Saturday maintenance window with zero downtime.',
            entry_date=now - timedelta(days=14), entry_type='Milestone',
            asset_id=asset_map['AST-00017'].id, related_asset_id_str='AST-00017',
            department='Engineering', author_id=eng_lead.id,
        ),
        dict(
            journal_id='JRN-00011', title='Zero Trust: Okta deployment progress update',
            body='20 of 35 applications now integrated with Okta SSO. Conditional access policies enforcing MFA for all admin roles and off-network access. Remaining 15 apps scheduled for integration over next 45 days. User adoption metrics: 94% MFA enrollment, 12 helpdesk tickets related to Okta (down from 47 in first month).',
            entry_date=now - timedelta(days=7), entry_type='Update',
            asset_id=asset_map['AST-00018'].id, related_asset_id_str='AST-00018',
            department='Engineering', author_id=eng_analyst.id,
        ),
        dict(
            journal_id='JRN-00012', title='FY26 budget data call sent to program offices',
            body='Sent FY26 IT budget data call to all 8 program offices with 3-week response deadline. Template includes: current year spend, FY26 requirements, unfunded requirements, and new initiative requests. 6 of 8 offices acknowledged receipt.',
            entry_date=now - timedelta(days=10), entry_type='Note',
            asset_id=asset_map['AST-00019'].id, related_asset_id_str='AST-00019',
            department='Finance', author_id=fin_analyst.id,
        ),
        dict(
            journal_id='JRN-00013', title='Storage refresh: Market research results',
            body='Completed market research for NetApp replacement. Vendors evaluated: Pure Storage FlashArray//X70 ($680K), Dell PowerStore 5200T ($590K), NetApp AFF A900 ($720K). All meet FIPS 140-2 and FedRAMP requirements. Pure Storage offers best price-performance ratio. Dell offers lowest TCO with existing ProSupport agreements. Recommending competitive procurement.',
            entry_date=now - timedelta(days=4), entry_type='Update',
            asset_id=asset_map['AST-00020'].id, related_asset_id_str='AST-00020',
            department='Engineering', author_id=eng_lead.id,
        ),
        dict(
            journal_id='JRN-00014', title='ServiceNow fulfiller license over-utilization alert',
            body='ServiceNow admin report shows 561 active fulfiller accounts against 500 licensed. 47 accounts have not logged in for 90+ days. Recommending immediate deactivation of dormant accounts and establishing quarterly license reclamation process.',
            entry_date=now - timedelta(days=2), entry_type='Issue',
            asset_id=asset_map['AST-00006'].id, related_asset_id_str='AST-00006',
            department='Operations', author_id=ops_lead.id,
        ),
        dict(
            journal_id='JRN-00015', title='Splunk SIEM ingest trending above licensed capacity',
            body='Current daily ingest averaging 480GB/day against 500GB/day license. Growth rate of 8% quarterly means we will exceed license within 2 months. Options: (1) Optimize data sources to reduce noise ($0), (2) Purchase ingest uplift to 750GB ($125K), (3) Implement Splunk SmartStore for cold tier ($40K). Recommend option 1 first, then option 3.',
            entry_date=now - timedelta(days=9), entry_type='Issue',
            asset_id=asset_map['AST-00009'].id, related_asset_id_str='AST-00009',
            department='Engineering', author_id=eng_analyst.id,
        ),
        dict(
            journal_id='JRN-00016', title='Microsoft 365 GCC High tenant security review complete',
            body='Completed quarterly security review of M365 tenant. Findings: DLP policies need updating for new CUI categories, 12 shared mailboxes lack MFA, conditional access policy gap for mobile devices. All findings documented in POA&M tracker.',
            entry_date=now - timedelta(days=11), entry_type='Note',
            asset_id=asset_map['AST-00007'].id, related_asset_id_str='AST-00007',
            department='Administration', author_id=admin_lead.id,
        ),
        dict(
            journal_id='JRN-00017', title='Aruba wireless Phase 2 site survey scheduled',
            body='Scheduled professional wireless site survey for annex building on March 15. Aruba engineer will conduct predictive survey using Ekahau. Expected AP count for annex: 24 additional AP-635 units. Budget impact under existing contract ceiling.',
            entry_date=now - timedelta(days=6), entry_type='Note',
            asset_id=asset_map['AST-00004'].id, related_asset_id_str='AST-00004',
            department='Operations', author_id=ops_lead.id,
        ),
        dict(
            journal_id='JRN-00018', title='CrowdStrike Falcon EDR pilot results',
            body='30-day pilot on 200 endpoints complete. Results: 4 true positive detections (2 adware, 1 unauthorized USB, 1 policy violation), 0 false positives, average CPU impact 1.2%, no user complaints. Proceeding with full deployment to remaining 400 endpoints.',
            entry_date=now - timedelta(days=18), entry_type='Milestone',
            asset_id=asset_map['AST-00018'].id, related_asset_id_str='AST-00018',
            department='Engineering', author_id=eng_analyst.id,
        ),
        dict(
            journal_id='JRN-00019', title='Decision: Extend SAIC option year 4',
            body='COR, CO, and Program Manager agreed to exercise SAIC option year 4. Justification: consistent Exceptional CPARS ratings, below-ceiling pricing, and operational continuity risk of re-compete during ZTA implementation. Option year 4 ceiling: $2.4M.',
            entry_date=now - timedelta(days=1), entry_type='Decision',
            asset_id=asset_map['AST-00012'].id, related_asset_id_str='AST-00012',
            department='Operations', author_id=admin_user.id,
        ),
        dict(
            journal_id='JRN-00020', title='Tenable scan results: 12 critical findings',
            body='Q4 vulnerability scan completed. 12 critical findings (all in DMZ web servers), 89 high, 234 medium. Critical findings relate to Apache Struts and OpenSSL CVEs. Patch deployment scheduled for this weekend maintenance window.',
            entry_date=now - timedelta(days=16), entry_type='Update',
            asset_id=asset_map['AST-00010'].id, related_asset_id_str='AST-00010',
            department='Engineering', author_id=eng_analyst.id,
        ),
        dict(
            journal_id='JRN-00021', title='Cisco TAC case for Catalyst 9300 memory leak',
            body='Opened TAC case SR-12345678 for intermittent memory leak on 3 Catalyst 9300 switches running IOS-XE 17.9.4a. TAC confirmed known bug CSCwh12345. Workaround: scheduled reboot every 30 days. Permanent fix in IOS-XE 17.12 (scheduled upgrade per TSK-00002).',
            entry_date=now - timedelta(days=22), entry_type='Issue',
            asset_id=asset_map['AST-00001'].id, related_asset_id_str='AST-00001',
            department='Engineering', author_id=eng_analyst.id,
        ),
        dict(
            journal_id='JRN-00022', title='IT governance board quarterly update prepared',
            body='Draft quarterly briefing includes: 20 tracked assets (3 at risk), $14.5M portfolio value, 85% budget utilization on track, 3 critical projects (Network Mod, ZTA, Storage Refresh) green status. Director Reynolds to present at next board meeting.',
            entry_date=now - timedelta(days=2), entry_type='Note',
            asset_id=None, related_asset_id_str=None,
            department='Administration', author_id=admin_lead.id,
        ),
        dict(
            journal_id='JRN-00023', title='SD-WAN pilot site Atlanta: connectivity verified',
            body='Atlanta regional office SD-WAN overlay established. iPerf results: 450 Mbps throughput (target: 400 Mbps). VoIP MOS score: 4.2 (target: 4.0). Failover test: 3-second recovery. Denver site activation scheduled for next week.',
            entry_date=now - timedelta(days=8), entry_type='Update',
            asset_id=asset_map['AST-00017'].id, related_asset_id_str='AST-00017',
            department='Engineering', author_id=eng_lead.id,
        ),
        dict(
            journal_id='JRN-00024', title='Tableau decommissioning complete',
            body='All 42 Tableau dashboards successfully migrated to Power BI. Tableau Server decommissioned and VM resources reclaimed (8 vCPU, 32GB RAM, 500GB storage returned to pool). License cancellation confirmed with Salesforce.',
            entry_date=now - timedelta(days=55), entry_type='Milestone',
            asset_id=asset_map['AST-00011'].id, related_asset_id_str='AST-00011',
            department='Finance', author_id=fin_lead.id,
        ),
        dict(
            journal_id='JRN-00025', title='Dell server DRAC vulnerability advisory',
            body='Dell security advisory DSA-2026-042 affects iDRAC firmware versions prior to 7.10 on PowerEdge R750. CVE-2026-1234 rated High (CVSS 7.8). Firmware update task TSK-00005 created. No evidence of exploitation in our environment.',
            entry_date=now - timedelta(days=3), entry_type='Issue',
            asset_id=asset_map['AST-00002'].id, related_asset_id_str='AST-00002',
            department='Engineering', author_id=eng_analyst.id,
        ),
    ]

    journals = []
    for j_data in journals_data:
        journals.append(Journal(**j_data))
    db.session.add_all(journals)
    db.session.flush()

    # ------------------------------------------------------------------ #
    # 5. DOCUMENTS (15)
    # ------------------------------------------------------------------ #
    documents_data = [
        dict(
            document_id='DOC-00001', title='SAIC Help Desk - Base Contract and Modifications',
            document_type='Contract', cui_category='CUI Basic',
            date_received=today - timedelta(days=900),
            asset_id=asset_map['AST-00012'].id, related_asset_id_str='AST-00012',
            library_name='Contract Documents', department='Operations',
            uploaded_by_id=ops_lead.id, file_url='/documents/saic-helpdesk-contract.pdf',
        ),
        dict(
            document_id='DOC-00002', title='SAIC Option Year 3 Exercise Letter',
            document_type='Contract', cui_category='Not CUI',
            date_received=today - timedelta(days=365),
            asset_id=asset_map['AST-00012'].id, related_asset_id_str='AST-00012',
            library_name='Contract Documents', department='Operations',
            uploaded_by_id=ops_lead.id, file_url='/documents/saic-oy3-exercise.pdf',
        ),
        dict(
            document_id='DOC-00003', title='Leidos Cloud Migration - Statement of Work',
            document_type='SOW', cui_category='CUI Basic',
            date_received=today - timedelta(days=450),
            asset_id=asset_map['AST-00013'].id, related_asset_id_str='AST-00013',
            library_name='Contract Documents', department='Engineering',
            uploaded_by_id=eng_lead.id, file_url='/documents/leidos-cloud-sow.pdf',
        ),
        dict(
            document_id='DOC-00004', title='Booz Allen Cybersecurity Assessment - Phase 1 Report',
            document_type='Technical', cui_category='CUI Basic',
            date_received=today - timedelta(days=20),
            asset_id=asset_map['AST-00014'].id, related_asset_id_str='AST-00014',
            library_name='Technical Documents', department='Engineering',
            uploaded_by_id=eng_lead.id, file_url='/documents/bah-phase1-assessment.pdf',
        ),
        dict(
            document_id='DOC-00005', title='Deloitte ERP Advisory - Final Acquisition Strategy',
            document_type='Proposal', cui_category='Not CUI',
            date_received=today - timedelta(days=40),
            asset_id=asset_map['AST-00015'].id, related_asset_id_str='AST-00015',
            library_name='Contract Documents', department='Finance',
            uploaded_by_id=fin_lead.id, file_url='/documents/deloitte-erp-acq-strategy.pdf',
        ),
        dict(
            document_id='DOC-00006', title='AWS GovCloud - Monthly Invoice February 2026',
            document_type='Invoice', cui_category='Not CUI',
            date_received=today - timedelta(days=5),
            asset_id=asset_map['AST-00016'].id, related_asset_id_str='AST-00016',
            library_name='Financial Documents', department='Finance',
            uploaded_by_id=fin_analyst.id, file_url='/documents/aws-invoice-2026-02.pdf',
        ),
        dict(
            document_id='DOC-00007', title='Network Modernization Phase 2 - Project Plan',
            document_type='Technical', cui_category='Not CUI',
            date_received=today - timedelta(days=90),
            asset_id=asset_map['AST-00017'].id, related_asset_id_str='AST-00017',
            library_name='Technical Documents', department='Engineering',
            uploaded_by_id=eng_lead.id, file_url='/documents/network-mod-phase2-plan.pdf',
        ),
        dict(
            document_id='DOC-00008', title='Zero Trust Architecture - Implementation Roadmap',
            document_type='Technical', cui_category='CUI Basic',
            date_received=today - timedelta(days=150),
            asset_id=asset_map['AST-00018'].id, related_asset_id_str='AST-00018',
            library_name='Technical Documents', department='Engineering',
            uploaded_by_id=eng_lead.id, file_url='/documents/zta-roadmap.pdf',
        ),
        dict(
            document_id='DOC-00009', title='FY26 IT Budget Data Call Template',
            document_type='Other', cui_category='Not CUI',
            date_received=today - timedelta(days=10),
            asset_id=asset_map['AST-00019'].id, related_asset_id_str='AST-00019',
            library_name='Financial Documents', department='Finance',
            uploaded_by_id=fin_analyst.id, file_url='/documents/fy26-budget-datacall.xlsx',
        ),
        dict(
            document_id='DOC-00010', title='Palo Alto Firewall Renewal Quote - CDW-G',
            document_type='Proposal', cui_category='Not CUI',
            date_received=today - timedelta(days=3),
            asset_id=asset_map['AST-00003'].id, related_asset_id_str='AST-00003',
            library_name='Contract Documents', department='Engineering',
            uploaded_by_id=eng_lead.id, file_url='/documents/paloalto-renewal-quote.pdf',
        ),
        dict(
            document_id='DOC-00011', title='VMware vs Alternatives Cost Analysis',
            document_type='Technical', cui_category='Not CUI',
            date_received=today - timedelta(days=5),
            asset_id=asset_map['AST-00008'].id, related_asset_id_str='AST-00008',
            library_name='Technical Documents', department='Engineering',
            uploaded_by_id=eng_lead.id, file_url='/documents/vmware-alternatives-analysis.pdf',
        ),
        dict(
            document_id='DOC-00012', title='Storage Refresh - Market Research Report',
            document_type='Technical', cui_category='Not CUI',
            date_received=today - timedelta(days=4),
            asset_id=asset_map['AST-00020'].id, related_asset_id_str='AST-00020',
            library_name='Technical Documents', department='Engineering',
            uploaded_by_id=eng_lead.id, file_url='/documents/storage-refresh-market-research.pdf',
        ),
        dict(
            document_id='DOC-00013', title='ServiceNow License Agreement - GSA Schedule',
            document_type='Contract', cui_category='Not CUI',
            date_received=today - timedelta(days=300),
            asset_id=asset_map['AST-00006'].id, related_asset_id_str='AST-00006',
            library_name='Contract Documents', department='Operations',
            uploaded_by_id=ops_lead.id, file_url='/documents/servicenow-gsa-agreement.pdf',
        ),
        dict(
            document_id='DOC-00014', title='Cisco Catalyst 9300 - Maintenance Agreement',
            document_type='Contract', cui_category='Not CUI',
            date_received=today - timedelta(days=540),
            asset_id=asset_map['AST-00001'].id, related_asset_id_str='AST-00001',
            library_name='Contract Documents', department='Engineering',
            uploaded_by_id=eng_lead.id, file_url='/documents/cisco-catalyst-maintenance.pdf',
        ),
        dict(
            document_id='DOC-00015', title='SAIC Help Desk - January Performance Report',
            document_type='Other', cui_category='Not CUI',
            date_received=today - timedelta(days=8),
            asset_id=asset_map['AST-00012'].id, related_asset_id_str='AST-00012',
            library_name='Contract Documents', department='Operations',
            uploaded_by_id=ops_analyst.id, file_url='/documents/saic-jan-performance.pdf',
        ),
    ]

    documents = []
    for d_data in documents_data:
        documents.append(Document(**d_data))
    db.session.add_all(documents)
    db.session.flush()

    # ------------------------------------------------------------------ #
    # 6. ID COUNTERS (4)
    # ------------------------------------------------------------------ #
    counters = [
        IDCounter(list_type='Assets',    prefix='AST', current_value=20),
        IDCounter(list_type='Tasks',     prefix='TSK', current_value=30),
        IDCounter(list_type='Journals',  prefix='JRN', current_value=25),
        IDCounter(list_type='Documents', prefix='DOC', current_value=15),
    ]
    db.session.add_all(counters)

    # ------------------------------------------------------------------ #
    # 7. NOTIFICATIONS (20)
    # ------------------------------------------------------------------ #
    notifications_data = [
        # Critical - expired / expiring assets
        dict(
            user_id=eng_lead.id,
            title='CRITICAL: NetApp AFF A400 support contract expired',
            message='Asset AST-00005 (NetApp AFF A400 Storage Array) support contract has expired. No vendor support available for hardware failures. Replacement procurement in progress under AST-00020.',
            notification_type='critical', is_read=True,
            link='/assets/AST-00005', created_at=now - timedelta(days=15),
        ),
        dict(
            user_id=eng_lead.id,
            title='URGENT: VMware vSphere license expires in 5 days',
            message='Asset AST-00008 (VMware vSphere Enterprise Plus) expires in 5 days. Broadcom subscription renewal or alternative solution required immediately.',
            notification_type='critical', is_read=False,
            link='/assets/AST-00008', created_at=now - timedelta(hours=6),
        ),
        dict(
            user_id=eng_lead.id,
            title='Palo Alto firewall subscriptions expire in 22 days',
            message='Asset AST-00003 (Palo Alto PA-5260 Firewalls) threat prevention and URL filtering subscriptions expire in 22 days. Renewal in progress.',
            notification_type='warning', is_read=False,
            link='/assets/AST-00003', created_at=now - timedelta(days=1),
        ),

        # Warning - 60/90 day renewals
        dict(
            user_id=ops_lead.id,
            title='ServiceNow ITSM license renewal in 65 days',
            message='Asset AST-00006 (ServiceNow ITSM Platform License) renews in 65 days. License true-up audit recommended before renewal. Current usage exceeds licensed count by 12%.',
            notification_type='warning', is_read=False,
            link='/assets/AST-00006', created_at=now - timedelta(days=2),
        ),
        dict(
            user_id=ops_lead.id,
            title='SAIC contract option year exercise due in 82 days',
            message='Asset AST-00012 (SAIC Help Desk Support Contract) option year 4 must be exercised within 60 days of period end. Justification memo in progress.',
            notification_type='warning', is_read=True,
            link='/assets/AST-00012', created_at=now - timedelta(days=5),
        ),

        # Task assignments
        dict(
            user_id=eng_lead.id,
            title='New task assigned: Evaluate VMware licensing alternatives',
            message='Admin User assigned you TSK-00006 (Critical priority). Due in 3 days. Broadcom licensing changes require immediate evaluation of alternatives.',
            notification_type='info', is_read=True,
            link='/tasks/TSK-00006', created_at=now - timedelta(days=7),
        ),
        dict(
            user_id=eng_analyst.id,
            title='New task assigned: Schedule Cisco switch firmware upgrade',
            message='James Rodriguez assigned you TSK-00002 (High priority). Due in 14 days. IOS-XE 17.12 needed for critical CVE patches.',
            notification_type='info', is_read=False,
            link='/tasks/TSK-00002', created_at=now - timedelta(days=3),
        ),
        dict(
            user_id=eng_analyst.id,
            title='New task assigned: Run quarterly Tenable vulnerability scan',
            message='James Rodriguez assigned you TSK-00010 (High priority). Due in 7 days. Full credentialed scan across all 5,000 assets required.',
            notification_type='info', is_read=False,
            link='/tasks/TSK-00010', created_at=now - timedelta(days=2),
        ),
        dict(
            user_id=fin_analyst.id,
            title='New task assigned: Collect FY26 IT budget inputs',
            message='Patricia Chen assigned you TSK-00020 (High priority). Due in 12 days. Budget data call sent to 8 program offices.',
            notification_type='info', is_read=True,
            link='/tasks/TSK-00020', created_at=now - timedelta(days=10),
        ),
        dict(
            user_id=ops_lead.id,
            title='New task assigned: Submit SAIC option year 4 justification',
            message='Admin User assigned you TSK-00012 (Critical priority). Due in 15 days. Option exercise justification memo and IGCE required.',
            notification_type='info', is_read=True,
            link='/tasks/TSK-00012', created_at=now - timedelta(days=8),
        ),

        # Overdue tasks
        dict(
            user_id=fin_lead.id,
            title='OVERDUE: Complete CPARS evaluation for Deloitte contract',
            message='Task TSK-00014 is 10 days overdue. CPARS evaluation for the Deloitte ERP Advisory contract must be completed. Task is currently blocked.',
            notification_type='critical', is_read=False,
            link='/tasks/TSK-00014', created_at=now - timedelta(hours=12),
        ),
        dict(
            user_id=ops_analyst.id,
            title='OVERDUE: Review and update IT contingency plans',
            message='Task TSK-00026 is 5 days overdue. Annual ISCP review for 12 FISMA systems. Task is currently blocked pending DR exercise results.',
            notification_type='warning', is_read=False,
            link='/tasks/TSK-00026', created_at=now - timedelta(hours=8),
        ),

        # Document uploads
        dict(
            user_id=eng_lead.id,
            title='New document uploaded: Palo Alto Renewal Quote',
            message='DOC-00010 (Palo Alto Firewall Renewal Quote - CDW-G) uploaded to Contract Documents library for asset AST-00003.',
            notification_type='info', is_read=True,
            link='/documents/DOC-00010', created_at=now - timedelta(days=3),
        ),
        dict(
            user_id=eng_lead.id,
            title='New document uploaded: Storage Refresh Market Research',
            message='DOC-00012 (Storage Refresh - Market Research Report) uploaded to Technical Documents library for asset AST-00020.',
            notification_type='info', is_read=False,
            link='/documents/DOC-00012', created_at=now - timedelta(days=4),
        ),
        dict(
            user_id=fin_lead.id,
            title='New document uploaded: AWS February Invoice',
            message='DOC-00006 (AWS GovCloud - Monthly Invoice February 2026) uploaded to Financial Documents library for asset AST-00016.',
            notification_type='info', is_read=False,
            link='/documents/DOC-00006', created_at=now - timedelta(days=5),
        ),

        # Success - completed tasks / milestones
        dict(
            user_id=ops_lead.id,
            title='Task completed: Aruba AP inventory verified',
            message='David Kim completed TSK-00003 (Inventory Aruba AP serial numbers) on time. Coverage gaps identified for annex expansion.',
            notification_type='success', is_read=True,
            link='/tasks/TSK-00003', created_at=now - timedelta(days=7),
        ),
        dict(
            user_id=eng_lead.id,
            title='Milestone: Leidos Batch 7 migration complete',
            message='22 of 35 applications now migrated to AWS GovCloud. Batch 7 (Financial Reporting, Inventory Tracker, Document Archive) passed smoke testing.',
            notification_type='success', is_read=True,
            link='/assets/AST-00013', created_at=now - timedelta(days=12),
        ),
        dict(
            user_id=fin_lead.id,
            title='Task completed: Tableau to Power BI migration finished',
            message='Robert Johnson completed TSK-00008 (Complete Tableau to Power BI dashboard migration). All 42 dashboards migrated successfully.',
            notification_type='success', is_read=True,
            link='/tasks/TSK-00008', created_at=now - timedelta(days=25),
        ),
        dict(
            user_id=admin_user.id,
            title='Decision logged: Proceed with Palo Alto renewal',
            message='Engineering team decided to renew existing Palo Alto PA-5260 pair rather than replace with Fortinet. CTO approved.',
            notification_type='info', is_read=False,
            link='/journals/JRN-00002', created_at=now - timedelta(days=1),
        ),
        dict(
            user_id=exec_user.id,
            title='Quarterly IT governance briefing draft ready',
            message='Karen Williams has prepared the draft quarterly IT governance briefing for your review. 20 tracked assets, $14.5M portfolio value.',
            notification_type='info', is_read=False,
            link='/journals/JRN-00022', created_at=now - timedelta(days=2),
        ),
    ]

    notifications = []
    for n_data in notifications_data:
        notifications.append(Notification(**n_data))
    db.session.add_all(notifications)

    # ------------------------------------------------------------------ #
    # COMMIT
    # ------------------------------------------------------------------ #
    db.session.commit()

    print("--- Seed data loaded ---")
    print(f"  Users:         {len(users)}")
    print(f"  Assets:        {len(assets)}")
    print(f"  Tasks:         {len(tasks)}")
    print(f"  Journals:      {len(journals)}")
    print(f"  Documents:     {len(documents)}")
    print(f"  ID Counters:   {len(counters)}")
    print(f"  Notifications: {len(notifications)}")
