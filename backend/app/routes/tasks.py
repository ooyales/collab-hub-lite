from flask import Blueprint, request, jsonify
from app import db
from app.models import Asset, Task, Journal, IDCounter, Notification
from app.routes.auth import get_current_user
from datetime import date, datetime

tasks_bp = Blueprint('tasks', __name__)


@tasks_bp.route('', methods=['GET'])
def list_tasks():
    """List all tasks with optional filters.
    ---
    tags:
      - Tasks
    parameters:
      - name: status
        in: query
        type: string
        required: false
        description: "Filter by status. Use 'not_completed' to exclude completed tasks."
        enum: [Not Started, In Progress, Blocked, Completed, not_completed]
      - name: priority
        in: query
        type: string
        required: false
        enum: [Critical, High, Medium, Low]
      - name: department
        in: query
        type: string
        required: false
      - name: assigned_to_id
        in: query
        type: integer
        required: false
      - name: bucket
        in: query
        type: string
        required: false
        enum: [Hardware, Software, Contract, Project, General]
      - name: asset_id
        in: query
        type: integer
        required: false
        description: Filter by linked asset
      - name: search
        in: query
        type: string
        required: false
        description: Search across title, task_id, description
      - name: sort
        in: query
        type: string
        required: false
        default: due_date
      - name: order
        in: query
        type: string
        required: false
        default: asc
        enum: [asc, desc]
    responses:
      200:
        description: List of tasks
        schema:
          type: array
          items:
            $ref: '#/definitions/Task'
    """
    try:
        query = Task.query

        # Filters
        status = request.args.get('status')
        if status:
            if status == 'not_completed':
                query = query.filter(Task.status != 'Completed')
            else:
                query = query.filter(Task.status == status)

        priority = request.args.get('priority')
        if priority:
            query = query.filter(Task.priority == priority)

        department = request.args.get('department')
        if department:
            query = query.filter(Task.department == department)

        assigned_to_id = request.args.get('assigned_to_id')
        if assigned_to_id:
            query = query.filter(Task.assigned_to_id == int(assigned_to_id))

        bucket = request.args.get('bucket')
        if bucket:
            query = query.filter(Task.bucket == bucket)

        asset_id = request.args.get('asset_id')
        if asset_id:
            query = query.filter(Task.asset_id == int(asset_id))

        search = request.args.get('search')
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Task.title.ilike(pattern),
                    Task.task_id.ilike(pattern),
                    Task.description.ilike(pattern),
                )
            )

        # Sorting
        sort_field = request.args.get('sort', 'due_date')
        order = request.args.get('order', 'asc')

        sort_column = getattr(Task, sort_field, Task.due_date)
        if order == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        tasks = query.all()
        return jsonify([t.to_dict() for t in tasks])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/<int:id>', methods=['GET'])
def get_task(id):
    """Get a single task by ID.
    ---
    tags:
      - Tasks
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Task details
        schema:
          $ref: '#/definitions/Task'
      404:
        description: Task not found
    """
    try:
        task = Task.query.get(id)
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        return jsonify(task.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('', methods=['POST'])
def create_task():
    """Create a new task. Auto-generates task_id, journal entry, and notification.
    ---
    tags:
      - Tasks
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - title
          properties:
            title:
              type: string
            description:
              type: string
            priority:
              type: string
              default: Medium
              enum: [Critical, High, Medium, Low]
            status:
              type: string
              default: Not Started
            due_date:
              type: string
              format: date
            assigned_to_id:
              type: integer
            assigned_by_id:
              type: integer
            asset_id:
              type: integer
              description: Link to an asset (auto-derives bucket and department)
            bucket:
              type: string
              default: General
            department:
              type: string
            percent_complete:
              type: integer
              default: 0
    responses:
      201:
        description: Task created
        schema:
          $ref: '#/definitions/Task'
      400:
        description: Title is required
    """
    try:
        data = request.get_json()
        if not data or not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400

        task_id = IDCounter.generate_id('Tasks')

        # Determine bucket from related asset's asset_type if provided
        bucket = data.get('bucket', 'General')
        related_asset = None
        asset_id_val = data.get('asset_id')
        if asset_id_val:
            related_asset = Asset.query.get(int(asset_id_val))
            if related_asset and not data.get('bucket'):
                bucket = related_asset.asset_type  # Hardware, Software, Contract, Project

        current_user = get_current_user()

        task = Task(
            task_id=task_id,
            title=data['title'],
            description=data.get('description'),
            priority=data.get('priority', 'Medium'),
            status=data.get('status', 'Not Started'),
            due_date=_parse_date(data.get('due_date')),
            assigned_to_id=data.get('assigned_to_id'),
            assigned_by_id=current_user.id if current_user else data.get('assigned_by_id'),
            asset_id=asset_id_val,
            related_asset_id_str=related_asset.asset_id if related_asset else data.get('related_asset_id_str'),
            percent_complete=data.get('percent_complete', 0),
            department=data.get('department') or (related_asset.department if related_asset else None),
            bucket=bucket,
        )
        db.session.add(task)
        db.session.flush()

        # Auto-create journal entry linked to the asset
        if asset_id_val:
            journal_id = IDCounter.generate_id('Journals')
            journal = Journal(
                journal_id=journal_id,
                title=f'Task created: {task.title}',
                body=f'New task "{task.title}" ({task_id}) was created for this asset.',
                entry_type='Update',
                asset_id=asset_id_val,
                related_asset_id_str=task.related_asset_id_str,
                department=task.department,
                author_id=current_user.id if current_user else None,
            )
            db.session.add(journal)

        # Create notification for assigned_to user
        if task.assigned_to_id:
            notification = Notification(
                user_id=task.assigned_to_id,
                title='New Task Assigned',
                message=f'You have been assigned task "{task.title}" ({task_id}).',
                notification_type='info',
                link=f'/tasks/{task.id}',
            )
            db.session.add(notification)

        db.session.commit()
        return jsonify(task.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/<int:id>', methods=['PUT'])
def update_task(id):
    """Update a task. Setting percent_complete auto-derives status.
    ---
    tags:
      - Tasks
    parameters:
      - name: id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
            description:
              type: string
            priority:
              type: string
            status:
              type: string
              description: Setting to Completed auto-sets completed_date and percent_complete=100
            due_date:
              type: string
              format: date
            completed_date:
              type: string
              format: date
            assigned_to_id:
              type: integer
            asset_id:
              type: integer
            percent_complete:
              type: integer
              description: "0=Not Started, 1-99=In Progress, 100=Completed"
            department:
              type: string
            bucket:
              type: string
    responses:
      200:
        description: Updated task
        schema:
          $ref: '#/definitions/Task'
      400:
        description: No data provided
      404:
        description: Task not found
    """
    try:
        task = Task.query.get(id)
        if not task:
            return jsonify({'error': 'Task not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Track if status or percent_complete is changing
        new_status = data.get('status', task.status)
        new_pct = data.get('percent_complete', task.percent_complete)

        # Apply simple field updates
        simple_fields = [
            'title', 'description', 'priority', 'department', 'bucket',
            'assigned_to_id', 'assigned_by_id', 'asset_id', 'related_asset_id_str',
        ]
        for field in simple_fields:
            if field in data:
                setattr(task, field, data[field])

        if 'due_date' in data:
            task.due_date = _parse_date(data['due_date'])
        if 'completed_date' in data:
            task.completed_date = _parse_date(data['completed_date'])

        # Handle status change to Completed
        if 'status' in data:
            task.status = data['status']
            if data['status'] == 'Completed':
                task.completed_date = date.today()
                task.percent_complete = 100

        # Handle percent_complete change -> auto-derive status
        if 'percent_complete' in data:
            task.percent_complete = data['percent_complete']
            if data['percent_complete'] == 0:
                task.status = 'Not Started'
            elif data['percent_complete'] >= 100:
                task.status = 'Completed'
                task.percent_complete = 100
                if not task.completed_date:
                    task.completed_date = date.today()
            else:
                task.status = 'In Progress'

        db.session.commit()
        return jsonify(task.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/<int:id>', methods=['DELETE'])
def delete_task(id):
    """Delete a task.
    ---
    tags:
      - Tasks
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Task deleted
      404:
        description: Task not found
    """
    try:
        task = Task.query.get(id)
        if not task:
            return jsonify({'error': 'Task not found'}), 404

        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def _parse_date(value):
    """Parse a date string (YYYY-MM-DD) into a date object, or return None."""
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None
