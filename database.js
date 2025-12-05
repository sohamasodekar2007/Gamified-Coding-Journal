const fs = require('fs').promises;
const path = require('path');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, 'database', 'users.json');
        this.initializeDB();
    }

    // Initialize database if it doesn't exist
    async initializeDB() {
        try {
            await fs.access(this.dbPath);
        } catch (error) {
            console.log('📁 Creating new database file...');
            const initialData = {
                users: [],
                metadata: {
                    created: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                    version: "1.0.0",
                    totalUsers: 0
                },
                sessions: [],
                statistics: {
                    totalXpAwarded: 0,
                    totalCodeRuns: 0,
                    totalErrors: 0,
                    totalSessions: 0
                }
            };
            await this.saveDB(initialData);
        }
    }

    // Load database from JSON file
    async loadDB() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Error loading database:', error);
            throw new Error('Failed to load database');
        }
    }

    // Save database to JSON file
    async saveDB(data) {
        try {
            data.metadata.lastUpdated = new Date().toISOString();
            await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
            console.log('💾 Database saved successfully');
            return true;
        } catch (error) {
            console.error('❌ Error saving database:', error);
            throw new Error('Failed to save database');
        }
    }

    // Create new user
    async createUser(username, email, password) {
        try {
            const db = await this.loadDB();
            
            // Check if user exists
            const existingUser = db.users.find(u => u.username === username);
            if (existingUser) {
                throw new Error('Username already exists');
            }

            const newUser = {
                id: Date.now(),
                username,
                email,
                password, // In production, hash this!
                xp: 0,
                level: 1,
                streak: 0,
                totalSessions: 0,
                totalCodeRuns: 0,
                totalErrors: 0,
                achievements: [],
                settings: {
                    theme: 'dark',
                    autoSave: true,
                    notifications: true
                },
                projects: [],
                statistics: {
                    htmlLines: 0,
                    cssLines: 0,
                    jsLines: 0,
                    totalLines: 0,
                    sessionsToday: 0,
                    lastSessionDate: null
                },
                createdAt: new Date().toISOString(),
                lastLoginDate: new Date().toISOString()
            };

            db.users.push(newUser);
            db.metadata.totalUsers = db.users.length;
            
            await this.saveDB(db);
            console.log(`👤 User ${username} created successfully`);
            return { success: true, user: newUser };
        } catch (error) {
            console.error('❌ Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user by username
    async getUserByUsername(username) {
        try {
            const db = await this.loadDB();
            const user = db.users.find(u => u.username === username);
            return user || null;
        } catch (error) {
            console.error('❌ Error getting user:', error);
            return null;
        }
    }

    // Update user data
    async updateUser(userId, updateData) {
        try {
            const db = await this.loadDB();
            const userIndex = db.users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }

            // Merge update data with existing user
            db.users[userIndex] = { ...db.users[userIndex], ...updateData };
            
            await this.saveDB(db);
            console.log(`📝 User ${userId} updated successfully`);
            return { success: true, user: db.users[userIndex] };
        } catch (error) {
            console.error('❌ Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    // Add XP to user and handle level up
    async addXP(userId, xpAmount, reason = 'Code execution') {
        try {
            const db = await this.loadDB();
            const userIndex = db.users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }

            const user = db.users[userIndex];
            const oldXP = user.xp;
            const oldLevel = user.level;
            
            // Add XP
            user.xp += xpAmount;
            
            // Calculate new level (100 XP per level)
            const newLevel = Math.floor(user.xp / 100) + 1;
            const leveledUp = newLevel > oldLevel;
            
            if (leveledUp) {
                user.level = newLevel;
                console.log(`🎉 User ${user.username} leveled up to ${newLevel}!`);
            }

            // Update statistics
            db.statistics.totalXpAwarded += xpAmount;
            
            // Log the XP change
            const xpLog = {
                userId,
                username: user.username,
                xpChange: xpAmount,
                reason,
                oldXP,
                newXP: user.xp,
                leveledUp,
                newLevel,
                timestamp: new Date().toISOString()
            };

            if (!db.xpLogs) db.xpLogs = [];
            db.xpLogs.push(xpLog);

            await this.saveDB(db);
            
            return {
                success: true,
                user: user,
                leveledUp,
                xpGained: xpAmount,
                newLevel,
                totalXP: user.xp
            };
        } catch (error) {
            console.error('❌ Error adding XP:', error);
            return { success: false, error: error.message };
        }
    }

    // Remove XP from user (for errors)
    async removeXP(userId, xpAmount, reason = 'JavaScript error') {
        try {
            const db = await this.loadDB();
            const userIndex = db.users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }

            const user = db.users[userIndex];
            const oldXP = user.xp;
            
            // Remove XP but don't go below 0
            user.xp = Math.max(0, user.xp - xpAmount);
            
            // Recalculate level
            user.level = Math.floor(user.xp / 100) + 1;

            // Update error statistics
            user.totalErrors++;
            db.statistics.totalErrors++;
            
            // Log the XP loss
            const xpLog = {
                userId,
                username: user.username,
                xpChange: -xpAmount,
                reason,
                oldXP,
                newXP: user.xp,
                leveledUp: false,
                newLevel: user.level,
                timestamp: new Date().toISOString()
            };

            if (!db.xpLogs) db.xpLogs = [];
            db.xpLogs.push(xpLog);

            await this.saveDB(db);
            
            return {
                success: true,
                user: user,
                xpLost: xpAmount,
                newLevel: user.level,
                totalXP: user.xp
            };
        } catch (error) {
            console.error('❌ Error removing XP:', error);
            return { success: false, error: error.message };
        }
    }

    // Start coding session
    async startSession(userId) {
        try {
            const db = await this.loadDB();
            const userIndex = db.users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }

            const user = db.users[userIndex];
            const sessionId = Date.now();
            
            // Create session
            const session = {
                id: sessionId,
                userId,
                username: user.username,
                startTime: new Date().toISOString(),
                endTime: null,
                codeRuns: 0,
                errors: 0,
                xpEarned: 0,
                xpLost: 0,
                status: 'active'
            };

            db.sessions.push(session);
            
            // Update user stats
            user.totalSessions++;
            user.statistics.sessionsToday++;
            user.statistics.lastSessionDate = new Date().toISOString();
            
            // Update global stats
            db.statistics.totalSessions++;

            await this.saveDB(db);
            
            console.log(`🚀 Session started for user ${user.username}`);
            return { success: true, sessionId, user };
        } catch (error) {
            console.error('❌ Error starting session:', error);
            return { success: false, error: error.message };
        }
    }

    // End coding session
    async endSession(sessionId) {
        try {
            const db = await this.loadDB();
            const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
            
            if (sessionIndex === -1) {
                throw new Error('Session not found');
            }

            db.sessions[sessionIndex].endTime = new Date().toISOString();
            db.sessions[sessionIndex].status = 'completed';
            
            await this.saveDB(db);
            
            console.log(`✅ Session ${sessionId} ended`);
            return { success: true, session: db.sessions[sessionIndex] };
        } catch (error) {
            console.error('❌ Error ending session:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user statistics
    async getUserStats(userId) {
        try {
            const db = await this.loadDB();
            const user = db.users.find(u => u.id === userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Get user's sessions
            const userSessions = db.sessions.filter(s => s.userId === userId);
            const xpLogs = db.xpLogs ? db.xpLogs.filter(log => log.userId === userId) : [];
            
            return {
                success: true,
                stats: {
                    user,
                    sessions: userSessions,
                    xpLogs,
                    totalSessions: userSessions.length,
                    activeSessions: userSessions.filter(s => s.status === 'active').length,
                    totalXpEarned: xpLogs.filter(log => log.xpChange > 0).reduce((sum, log) => sum + log.xpChange, 0),
                    totalXpLost: xpLogs.filter(log => log.xpChange < 0).reduce((sum, log) => sum + Math.abs(log.xpChange), 0)
                }
            };
        } catch (error) {
            console.error('❌ Error getting user stats:', error);
            return { success: false, error: error.message };
        }
    }

    // Save project to user
    async saveProject(userId, projectData) {
        try {
            const db = await this.loadDB();
            const userIndex = db.users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }

            const project = {
                id: Date.now(),
                ...projectData,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            if (!db.users[userIndex].projects) {
                db.users[userIndex].projects = [];
            }

            db.users[userIndex].projects.unshift(project);
            
            await this.saveDB(db);
            
            return { success: true, project };
        } catch (error) {
            console.error('❌ Error saving project:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = DatabaseManager;