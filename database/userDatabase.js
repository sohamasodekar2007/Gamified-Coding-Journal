const fs = require('fs').promises;
const path = require('path');

class UserDatabase {
    constructor() {
        this.usersDir = path.join(__dirname, 'users');
        this.masterFile = path.join(__dirname, 'master.json');
        this.initializeDatabase();
    }

    // Initialize database structure
    async initializeDatabase() {
        try {
            // Ensure users directory exists
            await fs.mkdir(this.usersDir, { recursive: true });
            
            // Initialize master file if it doesn't exist
            try {
                await fs.access(this.masterFile);
            } catch (error) {
                const masterData = {
                    users: [],
                    metadata: {
                        created: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                        totalUsers: 0,
                        version: "2.0.0"
                    },
                    statistics: {
                        totalXpAwarded: 0,
                        totalSessions: 0,
                        totalProjects: 0,
                        totalErrors: 0
                    }
                };
                await fs.writeFile(this.masterFile, JSON.stringify(masterData, null, 2));
                console.log('📁 Master database file created');
            }
            
            console.log('🗃️ Individual User Database System initialized');
        } catch (error) {
            console.error('❌ Error initializing database:', error);
            throw error;
        }
    }

    // Generate user file path
    getUserFilePath(userId) {
        return path.join(this.usersDir, `${userId}.json`);
    }

    // Create new user with individual file
    async createUser(userData) {
        try {
            const userId = Date.now();
            const userFilePath = this.getUserFilePath(userId);
            
            // Create complete user data structure
            const completeUserData = {
                id: userId,
                username: userData.username,
                email: userData.email,
                password: userData.password, // In production, hash this!
                
                // XP and Level System
                xp: 50, // Welcome bonus
                level: 1,
                streak: 0,
                
                // Statistics
                statistics: {
                    totalSessions: 0,
                    totalCodeRuns: 0,
                    totalProjects: 0,
                    totalErrors: 0,
                    totalXpEarned: 50,
                    totalXpLost: 0,
                    htmlLines: 0,
                    cssLines: 0,
                    jsLines: 0,
                    totalLines: 0,
                    averageSessionDuration: 0,
                    longestStreak: 0,
                    errorsFixed: 0,
                    perfectSessions: 0, // Sessions with no errors
                    productiveSessions: 0 // Sessions with >5 code runs
                },
                
                // Achievements System
                achievements: [
                    {
                        id: 'welcome',
                        name: 'Welcome to Coding!',
                        description: 'Created your account',
                        unlockedAt: new Date().toISOString(),
                        xpBonus: 50
                    }
                ],
                
                // Projects Storage
                projects: [],
                
                // Session History
                sessions: [],
                
                // XP History
                xpHistory: [
                    {
                        id: Date.now(),
                        change: 50,
                        reason: 'Welcome bonus',
                        timestamp: new Date().toISOString(),
                        sessionId: null
                    }
                ],
                
                // Error History
                errorHistory: [],
                
                // Settings
                settings: {
                    theme: 'dark',
                    autoSave: true,
                    notifications: true,
                    soundEnabled: true,
                    difficulty: 'beginner',
                    language: 'en'
                },
                
                // Metadata
                metadata: {
                    createdAt: new Date().toISOString(),
                    lastLoginDate: new Date().toISOString(),
                    lastActivity: new Date().toISOString(),
                    version: "2.0.0",
                    migrated: false
                }
            };
            
            // Save individual user file
            await fs.writeFile(userFilePath, JSON.stringify(completeUserData, null, 2));
            
            // Update master file
            await this.updateMasterFile(completeUserData, 'create');
            
            console.log(`👤 User ${userData.username} created with ID: ${userId}`);
            console.log(`📁 User file: ${userFilePath}`);
            
            return { success: true, user: completeUserData };
            
        } catch (error) {
            console.error('❌ Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user data from individual file
    async getUser(userId) {
        try {
            const userFilePath = this.getUserFilePath(userId);
            
            // Check if user file exists
            try {
                await fs.access(userFilePath);
            } catch (error) {
                return { success: false, error: 'User not found' };
            }
            
            // Read user data
            const userData = await fs.readFile(userFilePath, 'utf8');
            const user = JSON.parse(userData);
            
            return { success: true, user };
            
        } catch (error) {
            console.error('❌ Error getting user:', error);
            return { success: false, error: error.message };
        }
    }

    // Save user data to individual file
    async saveUser(userId, userData) {
        try {
            const userFilePath = this.getUserFilePath(userId);
            
            // Update metadata
            userData.metadata.lastActivity = new Date().toISOString();
            userData.metadata.version = "2.0.0";
            
            // Save to individual file
            await fs.writeFile(userFilePath, JSON.stringify(userData, null, 2));
            
            // Update master file statistics
            await this.updateMasterFile(userData, 'update');
            
            console.log(`💾 User ${userId} data saved to individual file`);
            return { success: true, user: userData };
            
        } catch (error) {
            console.error('❌ Error saving user:', error);
            return { success: false, error: error.message };
        }
    }

    // Add XP and handle level up automatically
    async addXP(userId, xpAmount, reason = 'Code execution', sessionId = null) {
        try {
            const userResult = await this.getUser(userId);
            if (!userResult.success) {
                return userResult;
            }
            
            const user = userResult.user;
            const oldXP = user.xp;
            const oldLevel = user.level;
            
            // Add XP
            user.xp += xpAmount;
            user.statistics.totalXpEarned += xpAmount;
            
            // Calculate new level (100 XP per level)
            const newLevel = Math.floor(user.xp / 100) + 1;
            const leveledUp = newLevel > oldLevel;
            
            if (leveledUp) {
                user.level = newLevel;
                
                // Add level up achievement
                const levelAchievement = {
                    id: `level_${newLevel}`,
                    name: `Level ${newLevel} Achieved!`,
                    description: `Reached level ${newLevel}`,
                    unlockedAt: new Date().toISOString(),
                    xpBonus: newLevel * 10
                };
                
                user.achievements.push(levelAchievement);
                user.xp += levelAchievement.xpBonus; // Level up bonus
                
                console.log(`🎉 User ${user.username} leveled up to ${newLevel}!`);
            }
            
            // Add to XP history
            const xpEntry = {
                id: Date.now() + Math.random(),
                change: xpAmount,
                reason,
                oldXP,
                newXP: user.xp,
                leveledUp,
                newLevel: user.level,
                sessionId,
                timestamp: new Date().toISOString()
            };
            
            user.xpHistory.push(xpEntry);
            
            // Keep only last 100 XP entries for performance
            if (user.xpHistory.length > 100) {
                user.xpHistory = user.xpHistory.slice(-100);
            }
            
            // Save updated user data
            const saveResult = await this.saveUser(userId, user);
            
            return {
                success: true,
                user: user,
                xpGained: xpAmount,
                leveledUp,
                newLevel: user.level,
                totalXP: user.xp,
                levelUpBonus: leveledUp ? newLevel * 10 : 0
            };
            
        } catch (error) {
            console.error('❌ Error adding XP:', error);
            return { success: false, error: error.message };
        }
    }

    // Remove XP (for errors)
    async removeXP(userId, xpAmount, reason = 'JavaScript error', sessionId = null, errorDetails = {}) {
        try {
            const userResult = await this.getUser(userId);
            if (!userResult.success) {
                return userResult;
            }
            
            const user = userResult.user;
            const oldXP = user.xp;
            
            // Remove XP but don't go below 0
            user.xp = Math.max(0, user.xp - xpAmount);
            user.statistics.totalXpLost += xpAmount;
            user.statistics.totalErrors++;
            
            // Recalculate level
            const newLevel = Math.floor(user.xp / 100) + 1;
            user.level = newLevel;
            
            // Add to XP history
            const xpEntry = {
                id: Date.now() + Math.random(),
                change: -xpAmount,
                reason,
                oldXP,
                newXP: user.xp,
                leveledUp: false,
                newLevel: user.level,
                sessionId,
                timestamp: new Date().toISOString()
            };
            
            user.xpHistory.push(xpEntry);
            
            // Add to error history
            const errorEntry = {
                id: Date.now() + Math.random(),
                message: errorDetails.message || reason,
                type: errorDetails.type || 'javascript',
                line: errorDetails.line || null,
                file: errorDetails.file || 'user_code',
                xpLost: xpAmount,
                sessionId,
                timestamp: new Date().toISOString(),
                fixed: false
            };
            
            user.errorHistory.push(errorEntry);
            
            // Keep only last 50 errors
            if (user.errorHistory.length > 50) {
                user.errorHistory = user.errorHistory.slice(-50);
            }
            
            // Save updated user data
            const saveResult = await this.saveUser(userId, user);
            
            return {
                success: true,
                user: user,
                xpLost: xpAmount,
                newLevel: user.level,
                totalXP: user.xp,
                errorId: errorEntry.id
            };
            
        } catch (error) {
            console.error('❌ Error removing XP:', error);
            return { success: false, error: error.message };
        }
    }

    // Start coding session
    async startSession(userId) {
        try {
            const userResult = await this.getUser(userId);
            if (!userResult.success) {
                return userResult;
            }
            
            const user = userResult.user;
            const sessionId = Date.now();
            
            // Create session object
            const session = {
                id: sessionId,
                startTime: new Date().toISOString(),
                endTime: null,
                duration: 0,
                codeRuns: 0,
                errors: 0,
                xpEarned: 10, // Starting session bonus
                xpLost: 0,
                projects: [],
                achievements: [],
                status: 'active'
            };
            
            user.sessions.push(session);
            user.statistics.totalSessions++;
            
            // Award session start XP
            await this.addXP(userId, 10, 'Session started', sessionId);
            
            // Save updated user
            const saveResult = await this.saveUser(userId, user);
            
            return { success: true, sessionId, user: saveResult.user };
            
        } catch (error) {
            console.error('❌ Error starting session:', error);
            return { success: false, error: error.message };
        }
    }

    // End coding session
    async endSession(userId, sessionId) {
        try {
            const userResult = await this.getUser(userId);
            if (!userResult.success) {
                return userResult;
            }
            
            const user = userResult.user;
            const sessionIndex = user.sessions.findIndex(s => s.id === sessionId);
            
            if (sessionIndex === -1) {
                return { success: false, error: 'Session not found' };
            }
            
            const session = user.sessions[sessionIndex];
            const endTime = new Date();
            const startTime = new Date(session.startTime);
            const duration = Math.floor((endTime - startTime) / 1000 / 60); // minutes
            
            // Update session
            session.endTime = endTime.toISOString();
            session.duration = duration;
            session.status = 'completed';
            
            // Update user statistics
            const totalDuration = user.statistics.averageSessionDuration * (user.statistics.totalSessions - 1);
            user.statistics.averageSessionDuration = (totalDuration + duration) / user.statistics.totalSessions;
            
            // Check for session achievements
            if (session.errors === 0 && session.codeRuns > 0) {
                user.statistics.perfectSessions++;
                
                // Perfect session achievement
                const perfectAchievement = {
                    id: `perfect_${Date.now()}`,
                    name: 'Perfect Session!',
                    description: 'Completed a session with no errors',
                    unlockedAt: new Date().toISOString(),
                    xpBonus: 20
                };
                
                user.achievements.push(perfectAchievement);
                await this.addXP(userId, 20, 'Perfect session bonus', sessionId);
            }
            
            if (session.codeRuns >= 5) {
                user.statistics.productiveSessions++;
            }
            
            // Save updated user
            const saveResult = await this.saveUser(userId, user);
            
            return { success: true, session, user: saveResult.user };
            
        } catch (error) {
            console.error('❌ Error ending session:', error);
            return { success: false, error: error.message };
        }
    }

    // Save project to user file
    async saveProject(userId, projectData, sessionId = null) {
        try {
            const userResult = await this.getUser(userId);
            if (!userResult.success) {
                return userResult;
            }
            
            const user = userResult.user;
            
            const project = {
                id: Date.now(),
                name: projectData.name,
                html: projectData.html,
                css: projectData.css,
                js: projectData.js,
                description: projectData.description || '',
                tags: projectData.tags || [],
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                sessionId,
                statistics: {
                    htmlLines: (projectData.html || '').split('\n').filter(line => line.trim()).length,
                    cssLines: (projectData.css || '').split('\n').filter(line => line.trim()).length,
                    jsLines: (projectData.js || '').split('\n').filter(line => line.trim()).length
                }
            };
            
            project.statistics.totalLines = project.statistics.htmlLines + 
                                           project.statistics.cssLines + 
                                           project.statistics.jsLines;
            
            user.projects.unshift(project); // Add to beginning
            user.statistics.totalProjects++;
            
            // Update line statistics
            user.statistics.htmlLines += project.statistics.htmlLines;
            user.statistics.cssLines += project.statistics.cssLines;
            user.statistics.jsLines += project.statistics.jsLines;
            user.statistics.totalLines += project.statistics.totalLines;
            
            // Check for project milestones
            if (user.statistics.totalProjects === 1) {
                const firstProjectAchievement = {
                    id: 'first_project',
                    name: 'First Project!',
                    description: 'Created your first project',
                    unlockedAt: new Date().toISOString(),
                    xpBonus: 50
                };
                user.achievements.push(firstProjectAchievement);
                await this.addXP(userId, 50, 'First project milestone', sessionId);
            }
            
            // Award project save XP
            await this.addXP(userId, 25, `Project "${project.name}" saved`, sessionId);
            
            // Save updated user
            const saveResult = await this.saveUser(userId, user);
            
            return { success: true, project, user: saveResult.user };
            
        } catch (error) {
            console.error('❌ Error saving project:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user by username (search all user files)
    async getUserByUsername(username) {
        try {
            const masterData = await fs.readFile(this.masterFile, 'utf8');
            const master = JSON.parse(masterData);
            
            // Find user ID by username in master file
            const userInfo = master.users.find(u => u.username === username);
            if (!userInfo) {
                return { success: false, error: 'User not found' };
            }
            
            // Get full user data from individual file
            return await this.getUser(userInfo.id);
            
        } catch (error) {
            console.error('❌ Error finding user by username:', error);
            return { success: false, error: error.message };
        }
    }

    // Update master file with user info
    async updateMasterFile(userData, action) {
        try {
            const masterData = await fs.readFile(this.masterFile, 'utf8');
            const master = JSON.parse(masterData);
            
            if (action === 'create') {
                // Add user to master list
                master.users.push({
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    level: userData.level,
                    xp: userData.xp,
                    createdAt: userData.metadata.createdAt,
                    lastActivity: userData.metadata.lastActivity
                });
                
                master.metadata.totalUsers++;
            } else if (action === 'update') {
                // Update user info in master list
                const userIndex = master.users.findIndex(u => u.id === userData.id);
                if (userIndex !== -1) {
                    master.users[userIndex] = {
                        id: userData.id,
                        username: userData.username,
                        email: userData.email,
                        level: userData.level,
                        xp: userData.xp,
                        createdAt: userData.metadata.createdAt,
                        lastActivity: userData.metadata.lastActivity
                    };
                }
            }
            
            // Update master statistics
            master.statistics.totalXpAwarded = master.users.reduce((sum, u) => sum + (u.xp || 0), 0);
            master.metadata.lastUpdated = new Date().toISOString();
            
            // Save master file
            await fs.writeFile(this.masterFile, JSON.stringify(master, null, 2));
            
        } catch (error) {
            console.error('❌ Error updating master file:', error);
        }
    }

    // Get user statistics
    async getUserStats(userId) {
        try {
            const userResult = await this.getUser(userId);
            if (!userResult.success) {
                return userResult;
            }
            
            const user = userResult.user;
            
            // Calculate additional statistics
            const activeSessions = user.sessions.filter(s => s.status === 'active').length;
            const completedSessions = user.sessions.filter(s => s.status === 'completed').length;
            const totalSessionTime = user.sessions
                .filter(s => s.status === 'completed')
                .reduce((sum, s) => sum + (s.duration || 0), 0);
            
            const recentXP = user.xpHistory.slice(-10);
            const recentErrors = user.errorHistory.slice(-10);
            
            return {
                success: true,
                stats: {
                    user: user,
                    summary: {
                        activeSessions,
                        completedSessions,
                        totalSessionTime,
                        averageSessionTime: totalSessionTime / completedSessions || 0,
                        xpPerSession: user.xp / completedSessions || 0,
                        errorRate: user.statistics.totalErrors / user.statistics.totalCodeRuns || 0,
                        projectsThisWeek: user.projects.filter(p => {
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return new Date(p.createdAt) > weekAgo;
                        }).length
                    },
                    recent: {
                        xpHistory: recentXP,
                        errorHistory: recentErrors,
                        lastProject: user.projects[0] || null,
                        lastAchievement: user.achievements[user.achievements.length - 1] || null
                    }
                }
            };
            
        } catch (error) {
            console.error('❌ Error getting user stats:', error);
            return { success: false, error: error.message };
        }
    }

    // Get leaderboard from all user files
    async getLeaderboard(limit = 10) {
        try {
            const masterData = await fs.readFile(this.masterFile, 'utf8');
            const master = JSON.parse(masterData);
            
            // Sort users by XP
            const leaderboard = master.users
                .sort((a, b) => (b.xp || 0) - (a.xp || 0))
                .slice(0, limit)
                .map((user, index) => ({
                    rank: index + 1,
                    username: user.username,
                    xp: user.xp || 0,
                    level: user.level || 1,
                    lastActivity: user.lastActivity
                }));
            
            return { success: true, leaderboard };
            
        } catch (error) {
            console.error('❌ Error getting leaderboard:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = UserDatabase;