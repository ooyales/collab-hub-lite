from flask import Blueprint, jsonify
from app import db
from app.models import Asset, Task, Journal, Document, Notification, User
from datetime import date, datetime, timedelta
from collections import defaultdict

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/summary', methods=['GET'])
def summary():
    try:
        today = date.today()
        first_of_month = today.replace(day=1)

        # Asset KPIs
        all_assets = Asset.query.all()
        total_assets = len(all_assets)
        active_assets = sum(1 for a in all_assets if a.status == 'Active')
        pending_renewal = sum(1 for a in all_assets if a.status == 'Pending Renewal')
        expired_assets = sum(1 for a in all_assets if a.status == 'Expired' or a.is_expired)

        # Budget KPIs
        total_budget = sum(a.total_budget or 0 for a in all_assets)
        total_spent = sum(a.spent_to_date or 0 for a in all_assets)
        remaining_budget = total_budget - total_spent
        budget_utilization_pct = (total_spent / total_budget) if total_budget > 0 else 0

        # Task KPIs
        all_tasks = Task.query.all()
        total_tasks = len(all_tasks)
        open_tasks = sum(1 for t in all_tasks if t.status != 'Completed')
        completed_tasks = sum(1 for t in all_tasks if t.status == 'Completed')
        overdue_tasks = sum(1 for t in all_tasks if t.is_overdue)

        week_from_now = today + timedelta(days=7)
        tasks_due_this_week = sum(
            1 for t in all_tasks
            if t.due_date and today <= t.due_date <= week_from_now and t.status != 'Completed'
        )

        # Journal KPIs
        total_journals = Journal.query.count()
        journals_this_month = Journal.query.filter(
            Journal.entry_date >= datetime(first_of_month.year, first_of_month.month, first_of_month.day)
        ).count()

        # Document KPIs
        total_documents = Document.query.count()
        documents_this_month = Document.query.filter(
            Document.created_at >= datetime(first_of_month.year, first_of_month.month, first_of_month.day)
        ).count()
        cui_documents = Document.query.filter(Document.cui_category != 'Not CUI').count()

        return jsonify({
            'total_assets': total_assets,
            'active_assets': active_assets,
            'pending_renewal': pending_renewal,
            'expired_assets': expired_assets,
            'total_budget': total_budget,
            'total_spent': total_spent,
            'remaining_budget': remaining_budget,
            'budget_utilization_pct': round(budget_utilization_pct, 4),
            'total_tasks': total_tasks,
            'open_tasks': open_tasks,
            'completed_tasks': completed_tasks,
            'overdue_tasks': overdue_tasks,
            'tasks_due_this_week': tasks_due_this_week,
            'total_journals': total_journals,
            'journals_this_month': journals_this_month,
            'total_documents': total_documents,
            'documents_this_month': documents_this_month,
            'cui_documents': cui_documents,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/renewals', methods=['GET'])
def renewals():
    try:
        assets = Asset.query.filter(
            Asset.end_date.isnot(None),
            Asset.status.in_(['Active', 'Pending Renewal', 'Expired']),
        ).all()

        categories = ['Expired', '7 Days', '30 Days', '60 Days', '90 Days', '90+ Days']
        grouped = {cat: [] for cat in categories}

        for a in assets:
            cat = a.expiration_category
            if cat in grouped:
                grouped[cat].append(a.to_dict())

        result = []
        for cat in categories:
            result.append({
                'category': cat,
                'count': len(grouped[cat]),
                'assets': grouped[cat],
            })

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/budget', methods=['GET'])
def budget():
    try:
        assets = Asset.query.all()
        dept_data = defaultdict(lambda: {
            'total_budget': 0, 'spent': 0, 'asset_count': 0,
        })

        for a in assets:
            dept = a.department or 'Unassigned'
            dept_data[dept]['total_budget'] += a.total_budget or 0
            dept_data[dept]['spent'] += a.spent_to_date or 0
            dept_data[dept]['asset_count'] += 1

        result = []
        for dept, data in sorted(dept_data.items()):
            remaining = data['total_budget'] - data['spent']
            utilization = (data['spent'] / data['total_budget']) if data['total_budget'] > 0 else 0
            result.append({
                'department': dept,
                'total_budget': data['total_budget'],
                'spent': data['spent'],
                'remaining': remaining,
                'utilization_pct': round(utilization, 4),
                'asset_count': data['asset_count'],
            })

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/tasks-performance', methods=['GET'])
def tasks_performance():
    try:
        today = date.today()
        first_of_month = today.replace(day=1)

        # Previous month boundaries
        last_month_end = first_of_month - timedelta(days=1)
        first_of_last_month = last_month_end.replace(day=1)

        all_tasks = Task.query.all()
        total = len(all_tasks)

        # Tasks by status
        by_status = defaultdict(int)
        for t in all_tasks:
            by_status[t.status] += 1

        # Tasks by priority
        by_priority = defaultdict(int)
        for t in all_tasks:
            by_priority[t.priority] += 1

        # Completion rate
        completed = [t for t in all_tasks if t.status == 'Completed']
        completion_rate = (len(completed) / total) if total > 0 else 0

        # Average days to complete
        days_list = []
        for t in completed:
            if t.completed_date and t.created_at:
                created_date = t.created_at.date() if isinstance(t.created_at, datetime) else t.created_at
                delta = (t.completed_date - created_date).days
                days_list.append(delta)
        avg_days_to_complete = (sum(days_list) / len(days_list)) if days_list else 0

        # This month vs last month completed
        tasks_completed_this_month = sum(
            1 for t in completed
            if t.completed_date and t.completed_date >= first_of_month
        )
        tasks_completed_last_month = sum(
            1 for t in completed
            if t.completed_date and first_of_last_month <= t.completed_date <= last_month_end
        )

        mom_change = 0
        if tasks_completed_last_month > 0:
            mom_change = ((tasks_completed_this_month - tasks_completed_last_month) / tasks_completed_last_month)

        return jsonify({
            'tasks_by_status': dict(by_status),
            'tasks_by_priority': dict(by_priority),
            'completion_rate': round(completion_rate, 4),
            'avg_days_to_complete': round(avg_days_to_complete, 1),
            'tasks_completed_this_month': tasks_completed_this_month,
            'tasks_completed_last_month': tasks_completed_last_month,
            'mom_change': round(mom_change, 4),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/consolidation', methods=['GET'])
def consolidation():
    try:
        assets = Asset.query.filter(Asset.status == 'Active').all()

        vendor_map = defaultdict(list)
        for a in assets:
            if a.vendor:
                vendor_map[a.vendor].append(a)

        # Only vendors with 2+ assets
        consolidation_opportunities = []
        total_consolidatable_budget = 0

        for vendor, vendor_assets in sorted(vendor_map.items()):
            if len(vendor_assets) >= 2:
                vendor_budget = sum(a.total_budget or 0 for a in vendor_assets)
                total_consolidatable_budget += vendor_budget
                consolidation_opportunities.append({
                    'vendor': vendor,
                    'asset_count': len(vendor_assets),
                    'total_budget': vendor_budget,
                    'assets': [a.to_dict() for a in vendor_assets],
                })

        potential_savings = round(total_consolidatable_budget * 0.12, 2)

        return jsonify({
            'opportunities': consolidation_opportunities,
            'total_consolidatable_budget': total_consolidatable_budget,
            'potential_savings': potential_savings,
            'savings_pct': 0.12,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/department-scorecard', methods=['GET'])
def department_scorecard():
    try:
        assets = Asset.query.all()
        tasks = Task.query.all()

        # Build per-department data
        dept_data = defaultdict(lambda: {
            'active_assets': 0,
            'open_tasks': 0,
            'overdue_tasks': 0,
            'completed_tasks': 0,
            'total_tasks': 0,
            'total_budget': 0,
            'spent': 0,
        })

        for a in assets:
            dept = a.department or 'Unassigned'
            if a.status == 'Active':
                dept_data[dept]['active_assets'] += 1
            dept_data[dept]['total_budget'] += a.total_budget or 0
            dept_data[dept]['spent'] += a.spent_to_date or 0

        for t in tasks:
            dept = t.department or 'Unassigned'
            dept_data[dept]['total_tasks'] += 1
            if t.status == 'Completed':
                dept_data[dept]['completed_tasks'] += 1
            else:
                dept_data[dept]['open_tasks'] += 1
            if t.is_overdue:
                dept_data[dept]['overdue_tasks'] += 1

        result = []
        for dept, data in sorted(dept_data.items()):
            remaining = data['total_budget'] - data['spent']
            task_completion_rate = (
                (data['completed_tasks'] / data['total_tasks'])
                if data['total_tasks'] > 0 else 0
            )
            result.append({
                'department': dept,
                'active_assets': data['active_assets'],
                'open_tasks': data['open_tasks'],
                'overdue_tasks': data['overdue_tasks'],
                'total_budget': data['total_budget'],
                'spent': data['spent'],
                'remaining': remaining,
                'task_completion_rate': round(task_completion_rate, 4),
            })

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/renewal-alerts/run', methods=['GET', 'POST'])
def run_renewal_alerts():
    try:
        today = date.today()
        thresholds = [90, 60, 30, 14, 7]

        active_assets = Asset.query.filter(
            Asset.status == 'Active',
            Asset.end_date.isnot(None),
        ).all()

        alerts_created = 0

        for asset in active_assets:
            days_left = asset.days_until_expiration
            if days_left is None or days_left < 0:
                continue

            for threshold in thresholds:
                if days_left <= threshold:
                    # Determine notification type based on urgency
                    if threshold <= 7:
                        n_type = 'critical'
                    elif threshold <= 14:
                        n_type = 'warning'
                    else:
                        n_type = 'info'

                    # Notify the asset owner (or skip if no owner)
                    if asset.owner_id:
                        notification = Notification(
                            user_id=asset.owner_id,
                            title=f'Renewal Alert: {asset.title}',
                            message=(
                                f'Asset "{asset.title}" ({asset.asset_id}) expires in '
                                f'{days_left} days (threshold: {threshold} days).'
                            ),
                            notification_type=n_type,
                            link=f'/assets/{asset.id}',
                        )
                        db.session.add(notification)
                        alerts_created += 1

                    # Only create one notification per asset (the tightest threshold)
                    break

        db.session.commit()
        return jsonify({
            'alerts_created': alerts_created,
            'alerts_generated': alerts_created,
            'assets_checked': len(active_assets),
            'message': f'Checked {len(active_assets)} assets, created {alerts_created} renewal alerts.',
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
