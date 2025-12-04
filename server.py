import json
import os
import time
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_DIR = os.path.join(BASE_DIR, 'database')
USERS_DIR = os.path.join(DATABASE_DIR, 'users')
MASTER_FILE = os.path.join(DATABASE_DIR, 'master.json')

# Initialize database
def initialize_database():
    """Create database structure if it doesn't exist"""
    try:
        # Create database directory
        os.makedirs(USERS_DIR, exist_ok=True)
        
        # Create master file if it doesn't exist
        if not os.path.exists(MASTER_FILE):
            master_data = {
                "users": [],
                "metadata": {
                    "created": datetime.now().isoformat(),
                    "lastUpdated": datetime.now().isoformat(),
                    "totalUsers": 0,
                    "version": "2.0.0"
                },
                "statistics": {
                    "totalXpAwarded": 0,
                    "totalSessions": 0,
                    "totalProjects": 0,
                    "totalErrors": 0
                }
            }
            with open(MASTER_FILE, 'w') as f:
                json.dump(master_data, f, indent=2)
            print('📁 Master database file created')
        
        print('🗃️ Individual User Database System initialized')
    except Exception as e:
        print(f'❌ Error initializing database: {e}')
        raise

# User database operations
def get_user_file_path(user_id):
    """Get the file path for a user"""
    return os.path.join(USERS_DIR, f'{user_id}.json')

def load_master_file():
    """Load master.json file"""
    try:
        with open(MASTER_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f'❌ Error loading master file: {e}')
        return None

def save_master_file(master_data):
    """Save master.json file"""
    try:
        master_data['metadata']['lastUpdated'] = datetime.now().isoformat()
        with open(MASTER_FILE, 'w') as f:
            json.dump(master_data, f, indent=2)
    except Exception as e:
        print(f'❌ Error saving master file: {e}')

def create_user(username, email, password):
    """Create a new user with individual file"""
    try:
        user_id = int(time.time() * 1000)  # Millisecond timestamp
        user_file_path = get_user_file_path(user_id)
        
        # Create complete user data structure
        user_data = {
            "id": user_id,
            "username": username,
            "email": email,
            "password": password,  # In production, hash this!
            "xp": 50,  # Welcome bonus
            "level": 1,
            "streak": 0,
            "statistics": {
                "totalSessions": 0,
                "totalCodeRuns": 0,
                "totalProjects": 0,
                "totalErrors": 0,
                "totalXpEarned": 50,
                "totalXpLost": 0,
                "htmlLines": 0,
                "cssLines": 0,
                "jsLines": 0,
                "totalLines": 0,
                "averageSessionDuration": 0,
                "longestStreak": 0,
                "errorsFixed": 0,
                "perfectSessions": 0,
                "productiveSessions": 0
            },
            "achievements": [
                {
                    "id": "welcome",
                    "name": "Welcome to Coding!",
                    "description": "Created your account",
                    "unlockedAt": datetime.now().isoformat(),
                    "xpBonus": 50
                }
            ],
            "projects": [],
            "sessions": [],
            "xpHistory": [
                {
                    "id": int(time.time() * 1000),
                    "change": 50,
                    "reason": "Welcome bonus",
                    "timestamp": datetime.now().isoformat(),
                    "sessionId": None
                }
            ],
            "errorHistory": [],
            "settings": {
                "theme": "dark",
                "autoSave": True,
                "notifications": True,
                "soundEnabled": True,
                "difficulty": "beginner",
                "language": "en"
            },
            "metadata": {
                "createdAt": datetime.now().isoformat(),
                "lastLoginDate": datetime.now().isoformat(),
                "lastActivity": datetime.now().isoformat(),
                "version": "2.0.0",
                "migrated": False
            }
        }
        
        # Save individual user file
        with open(user_file_path, 'w') as f:
            json.dump(user_data, f, indent=2)
        
        # Update master file
        master = load_master_file()
        if master:
            master['users'].append({
                "id": user_id,
                "username": username,
                "email": email,
                "level": 1,
                "xp": 50,
                "createdAt": user_data['metadata']['createdAt'],
                "lastActivity": user_data['metadata']['lastActivity']
            })
            master['metadata']['totalUsers'] += 1
            master['statistics']['totalXpAwarded'] += 50
            save_master_file(master)
        
        print(f'👤 User {username} created with ID: {user_id}')
        print(f'📁 User file: {user_file_path}')
        
        return {"success": True, "user": user_data}
    except Exception as e:
        print(f'❌ Error creating user: {e}')
        return {"success": False, "error": str(e)}

def get_user_by_username(username):
    """Get user by username from master file"""
    try:
        master = load_master_file()
        if not master:
            return {"success": False, "error": "Master file not found"}
        
        # Find user in master file
        user_info = next((u for u in master['users'] if u['username'] == username), None)
        if not user_info:
            return {"success": False, "error": "User not found"}
        
        # Load full user data from individual file
        user_file_path = get_user_file_path(user_info['id'])
        if not os.path.exists(user_file_path):
            return {"success": False, "error": "User file not found"}
        
        with open(user_file_path, 'r') as f:
            user_data = json.load(f)
        
        return {"success": True, "user": user_data}
    except Exception as e:
        print(f'❌ Error getting user by username: {e}')
        return {"success": False, "error": str(e)}

def get_user(user_id):
    """Get user by ID"""
    try:
        user_file_path = get_user_file_path(user_id)
        if not os.path.exists(user_file_path):
            return {"success": False, "error": "User not found"}
        
        with open(user_file_path, 'r') as f:
            user_data = json.load(f)
        
        return {"success": True, "user": user_data}
    except Exception as e:
        print(f'❌ Error getting user: {e}')
        return {"success": False, "error": str(e)}

def save_user(user_id, user_data):
    """Save user data to individual file"""
    try:
        user_file_path = get_user_file_path(user_id)
        
        # Update metadata
        user_data['metadata']['lastActivity'] = datetime.now().isoformat()
        user_data['metadata']['version'] = "2.0.0"
        
        # Save to individual file
        with open(user_file_path, 'w') as f:
            json.dump(user_data, f, indent=2)
        
        # Update master file
        master = load_master_file()
        if master:
            user_index = next((i for i, u in enumerate(master['users']) if u['id'] == user_id), None)
            if user_index is not None:
                master['users'][user_index] = {
                    "id": user_id,
                    "username": user_data['username'],
                    "email": user_data['email'],
                    "level": user_data['level'],
                    "xp": user_data['xp'],
                    "createdAt": user_data['metadata']['createdAt'],
                    "lastActivity": user_data['metadata']['lastActivity']
                }
                master['statistics']['totalXpAwarded'] = sum(u.get('xp', 0) for u in master['users'])
                save_master_file(master)
        
        print(f'💾 User {user_id} data saved to individual file')
        return {"success": True, "user": user_data}
    except Exception as e:
        print(f'❌ Error saving user: {e}')
        return {"success": False, "error": str(e)}

def add_xp(user_id, xp_amount, reason="Code execution", session_id=None):
    """Add XP to user and handle level up"""
    try:
        result = get_user(user_id)
        if not result['success']:
            return result
        
        user = result['user']
        old_xp = user['xp']
        old_level = user['level']
        
        # Add XP
        user['xp'] += xp_amount
        user['statistics']['totalXpEarned'] += xp_amount
        
        # Calculate new level (100 XP per level)
        new_level = (user['xp'] // 100) + 1
        leveled_up = new_level > old_level
        
        if (leveled_up):
            user['level'] = new_level
            
            # Add level up achievement
            level_achievement = {
                "id": f"level_{new_level}",
                "name": f"Level {new_level} Achieved!",
                "description": f"Reached level {new_level}",
                "unlockedAt": datetime.now().isoformat(),
                "xpBonus": new_level * 10
            }
            
            user['achievements'].append(level_achievement)
            user['xp'] += level_achievement['xpBonus']
            
            print(f"🎉 User {user['username']} leveled up to {new_level}!")
        
        # Add to XP history
        xp_entry = {
            "id": int(time.time() * 1000),
            "change": xp_amount,
            "reason": reason,
            "oldXP": old_xp,
            "newXP": user['xp'],
            "leveledUp": leveled_up,
            "newLevel": user['level'],
            "sessionId": session_id,
            "timestamp": datetime.now().isoformat()
        }
        
        user['xpHistory'].append(xp_entry)
        
        # Keep only last 100 XP entries
        if len(user['xpHistory']) > 100:
            user['xpHistory'] = user['xpHistory'][-100:]
        
        # Save updated user data
        save_result = save_user(user_id, user)
        
        return {
            "success": True,
            "user": user,
            "xpGained": xp_amount,
            "leveledUp": leveled_up,
            "newLevel": user['level'],
            "totalXP": user['xp'],
            "levelUpBonus": new_level * 10 if leveled_up else 0
        }
    except Exception as e:
        print(f'❌ Error adding XP: {e}')
        return {"success": False, "error": str(e)}

def start_session(user_id):
    """Start a coding session"""
    try:
        result = get_user(user_id)
        if not result['success']:
            return result
        
        user = result['user']
        session_id = int(time.time() * 1000)
        
        # Create session object
        session = {
            "id": session_id,
            "startTime": datetime.now().isoformat(),
            "endTime": None,
            "duration": 0,
            "codeRuns": 0,
            "errors": 0,
            "xpEarned": 10,
            "xpLost": 0,
            "projects": [],
            "achievements": [],
            "status": "active"
        }
        
        user['sessions'].append(session)
        user['statistics']['totalSessions'] += 1
        
        # Award session start XP
        add_xp(user_id, 10, "Session started", session_id)
        
        # Save updated user
        save_result = save_user(user_id, user)
        
        return {"success": True, "sessionId": session_id, "user": save_result['user']}
    except Exception as e:
        print(f'❌ Error starting session: {e}')
        return {"success": False, "error": str(e)}

# ===== API ENDPOINTS =====

@app.route('/')
def index():
    """Serve the main HTML file"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('.', path)

@app.route('/api/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({"success": False, "error": "Missing required fields"}), 400
        
        # Check if username already exists
        existing_user = get_user_by_username(username)
        if existing_user['success']:
            return jsonify({"success": False, "error": "Username already exists"}), 400
        
        result = create_user(username, email, password)
        
        if result['success']:
            return jsonify({
                "success": True,
                "user": result['user'],
                "message": f"Account created! Welcome bonus: +50 XP! Your user file: {result['user']['id']}.json"
            })
        else:
            return jsonify({"success": False, "error": result['error']}), 400
    except Exception as e:
        print(f'Register error: {e}')
        return jsonify({"success": False, "error": "Server error"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"success": False, "error": "Missing username or password"}), 400
        
        user_result = get_user_by_username(username)
        
        if not user_result['success'] or user_result['user']['password'] != password:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401
        
        user = user_result['user']
        
        # Update last login
        user['metadata']['lastLoginDate'] = datetime.now().isoformat()
        save_user(user['id'], user)
        
        # Award daily login bonus
        today = datetime.now().date().isoformat()
        last_login = user['metadata'].get('lastLoginDate', '')
        last_login_date = last_login.split('T')[0] if last_login else None
        
        daily_bonus = False
        if last_login_date != today:
            xp_result = add_xp(user['id'], 20, "Daily login bonus")
            daily_bonus = True
            user['xp'] = xp_result['user']['xp']
            user['level'] = xp_result['user']['level']
        
        return jsonify({
            "success": True,
            "user": user,
            "dailyBonus": daily_bonus,
            "message": "Welcome back! +20 Daily XP!" if daily_bonus else "Welcome back!",
            "userFile": f"{user['id']}.json"
        })
    except Exception as e:
        print(f'Login error: {e}')
        return jsonify({"success": False, "error": "Server error"}), 500

@app.route('/api/start-session', methods=['POST'])
def api_start_session():
    """Start coding session"""
    try:
        data = request.json
        user_id = data.get('userId')
        
        result = start_session(user_id)
        
        if result['success']:
            return jsonify({
                "success": True,
                "sessionId": result['sessionId'],
                "user": result['user'],
                "message": "Session started! +10 XP",
                "userFile": f"{user_id}.json"
            })
        else:
            return jsonify({"success": False, "error": result['error']}), 400
    except Exception as e:
        print(f'Start session error: {e}')
        return jsonify({"success": False, "error": "Server error"}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Check if database directory exists
        db_exists = os.path.exists(DATABASE_DIR)
        users_dir_exists = os.path.exists(USERS_DIR)
        master_exists = os.path.exists(MASTER_FILE)
        
        user_files = [f for f in os.listdir(USERS_DIR) if f.endswith('.json')] if users_dir_exists else []
        
        return jsonify({
            "success": True,
            "status": "OK",
            "timestamp": datetime.now().isoformat(),
            "database": {
                "status": "Connected",
                "type": "Individual User Files",
                "userFiles": len(user_files),
                "masterFile": "Available" if master_exists else "Missing",
                "usersDirectory": "Available" if users_dir_exists else "Missing"
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "status": "ERROR",
            "database": {
                "status": "Disconnected",
                "error": str(e)
            }
        }), 500

@app.route('/api/user-stats/<int:user_id>', methods=['GET'])
def user_stats(user_id):
    """Get user statistics"""
    try:
        result = get_user(user_id)
        if not result['success']:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        user = result['user']
        
        # Calculate statistics
        active_sessions = len([s for s in user['sessions'] if s['status'] == 'active'])
        completed_sessions = len([s for s in user['sessions'] if s['status'] == 'completed'])
        total_session_time = sum(s.get('duration', 0) for s in user['sessions'] if s['status'] == 'completed')
        
        return jsonify({
            "success": True,
            "stats": {
                "user": user,
                "summary": {
                    "activeSessions": active_sessions,
                    "completedSessions": completed_sessions,
                    "totalSessionTime": total_session_time,
                    "averageSessionTime": total_session_time / completed_sessions if completed_sessions > 0 else 0,
                    "xpPerSession": user['xp'] / completed_sessions if completed_sessions > 0 else 0
                }
            },
            "userFile": f"{user_id}.json"
        })
    except Exception as e:
        print(f'Get stats error: {e}')
        return jsonify({"success": False, "error": "Server error"}), 500

if __name__ == '__main__':
    print('🚀 Starting Gamified Coding Journal Python Server...')
    initialize_database()
    print('🚀 Server running on http://localhost:3000')
    print('🗃️ Individual User File Database System active')
    print('📁 Database structure:')
    print('   └── database/')
    print('       ├── master.json (user registry)')
    print('       └── users/')
    print('           ├── {userId1}.json')
    print('           ├── {userId2}.json')
    print('           └── ...')
    app.run(host='0.0.0.0', port=3000, debug=True)
