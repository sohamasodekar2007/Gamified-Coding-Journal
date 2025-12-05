const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const UserDatabase = require('./database/userDatabase');

const app = express();
const PORT = 3000;
const userDB = new UserDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// ===== AUTHENTICATION ENDPOINTS =====

// Register new user with individual file
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Check if username already exists
        const existingUser = await userDB.getUserByUsername(username);
        if (existingUser.success) {
            return res.status(400).json({ success: false, error: 'Username already exists' });
        }

        const result = await userDB.createUser({ username, email, password });
        
        if (result.success) {
            res.json({ 
                success: true, 
                user: result.user,
                message: `Account created! Welcome bonus: +50 XP! Your user file: ${result.user.id}.json` 
            });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Login user from individual file
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Missing username or password' });
        }

        const userResult = await userDB.getUserByUsername(username);
        
        if (!userResult.success || userResult.user.password !== password) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = userResult.user;

        // Update last login
        user.metadata.lastLoginDate = new Date().toISOString();
        await userDB.saveUser(user.id, user);

        // Award daily login bonus
        const today = new Date().toDateString();
        const lastLogin = user.metadata.lastLoginDate ? new Date(user.metadata.lastLoginDate).toDateString() : null;
        
        let dailyBonus = false;
        if (lastLogin !== today) {
            const xpResult = await userDB.addXP(user.id, 20, 'Daily login bonus');
            dailyBonus = true;
            user.xp = xpResult.user.xp;
            user.level = xpResult.user.level;
        }

        res.json({ 
            success: true, 
            user: user,
            dailyBonus,
            message: dailyBonus ? 'Welcome back! +20 Daily XP!' : 'Welcome back!',
            userFile: `${user.id}.json`
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ===== CODING SESSION ENDPOINTS =====

// Start coding session with individual file storage
app.post('/api/start-session', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const result = await userDB.startSession(userId);
        
        if (result.success) {
            res.json({ 
                success: true, 
                sessionId: result.sessionId,
                user: result.user,
                message: 'Session started! +10 XP',
                userFile: `${userId}.json`
            });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// End coding session
app.post('/api/end-session', async (req, res) => {
    try {
        const { userId, sessionId } = req.body;
        
        const result = await userDB.endSession(userId, sessionId);
        
        if (result.success) {
            res.json({ 
                success: true, 
                session: result.session,
                user: result.user,
                userFile: `${userId}.json`
            });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ===== CODE EXECUTION ENDPOINTS =====

// Run code and award XP to individual file
app.post('/api/run-code', async (req, res) => {
    try {
        const { userId, code, sessionId, compilationResult } = req.body;
        
        // Create detailed execution history entry
        const executionEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            sessionId,
            code: {
                html: code.html,
                css: code.css,
                js: code.js
            },
            stats: {
                lineCount: code.lineCount,
                charCount: code.charCount,
                executionTime: compilationResult.executionTime || 0
            },
            compilation: {
                success: !compilationResult.hasErrors,
                errors: compilationResult.errors || [],
                warnings: compilationResult.warnings || [],
                consoleOutput: compilationResult.consoleOutput || [],
                memoryUsage: compilationResult.memoryUsage,
                syntaxValid: compilationResult.syntaxValid
            },
            performance: {
                executionTime: compilationResult.executionTime,
                memoryUsed: compilationResult.memoryUsage ? compilationResult.memoryUsage.usedJSHeapSize : 0
            }
        };

        // Update session statistics in user file
        const userResult = await userDB.getUser(userId);
        if (userResult.success) {
            const user = userResult.user;
            const sessionIndex = user.sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex !== -1) {
                user.sessions[sessionIndex].codeRuns++;
                user.sessions[sessionIndex].totalExecutions = (user.sessions[sessionIndex].totalExecutions || 0) + 1;
                
                // Add detailed execution history to session
                if (!user.sessions[sessionIndex].executionHistory) {
                    user.sessions[sessionIndex].executionHistory = [];
                }
                user.sessions[sessionIndex].executionHistory.unshift(executionEntry);
                
                // Keep only last 100 executions per session for performance
                if (user.sessions[sessionIndex].executionHistory.length > 100) {
                    user.sessions[sessionIndex].executionHistory = user.sessions[sessionIndex].executionHistory.slice(0, 100);
                }
            }
            
            // Update user-wide statistics
            user.statistics.totalCodeRuns++;
            user.statistics.htmlLines += code.lineCount.html;
            user.statistics.cssLines += code.lineCount.css;
            user.statistics.jsLines += code.lineCount.js;
            user.statistics.totalLines += code.lineCount.total;
            
            // Add to comprehensive execution history
            if (!user.executionHistory) {
                user.executionHistory = [];
            }
            user.executionHistory.unshift(executionEntry);
            
            // Keep only last 500 executions in user history
            if (user.executionHistory.length > 500) {
                user.executionHistory = user.executionHistory.slice(0, 500);
            }
            
            await userDB.saveUser(userId, user);
        }

        // Award XP for running code
        const xpResult = await userDB.addXP(userId, 15, 'Code executed successfully', sessionId);
        
        if (xpResult.success) {
            res.json({ 
                success: true, 
                user: xpResult.user,
                xpGained: 15,
                leveledUp: xpResult.leveledUp,
                levelUpBonus: xpResult.levelUpBonus,
                message: xpResult.leveledUp ? `Code executed! +15 XP + ${xpResult.levelUpBonus} Level Up Bonus!` : 'Code executed successfully! +15 XP',
                userFile: `${userId}.json`,
                executionId: executionEntry.id,
                historyStored: true
            });
        } else {
            res.status(400).json({ success: false, error: xpResult.error });
        }
    } catch (error) {
        console.error('Run code error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Handle JavaScript errors (remove XP from individual file)
app.post('/api/code-error', async (req, res) => {
    try {
        const { userId, compilationResult, sessionId, timestamp } = req.body;
        
        // Create detailed error entry
        const errorEntry = {
            id: Date.now(),
            timestamp: timestamp || new Date().toISOString(),
            sessionId,
            errors: compilationResult.errors || [],
            warnings: compilationResult.warnings || [],
            consoleOutput: compilationResult.consoleOutput || [],
            compilation: {
                success: false,
                syntaxValid: compilationResult.syntaxValid,
                executionTime: compilationResult.executionTime || 0,
                memoryUsage: compilationResult.memoryUsage
            },
            errorCount: compilationResult.errors.length,
            warningCount: compilationResult.warnings.length,
            severity: compilationResult.errors.some(e => e.severity === 'error') ? 'high' : 'medium'
        };

        // Update session error count in user file
        const userResult = await userDB.getUser(userId);
        if (userResult.success) {
            const user = userResult.user;
            const sessionIndex = user.sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex !== -1) {
                user.sessions[sessionIndex].errors += compilationResult.errors.length;
                user.sessions[sessionIndex].xpLost += (compilationResult.errors.length * 5);
                
                // Add error details to session
                if (!user.sessions[sessionIndex].errorHistory) {
                    user.sessions[sessionIndex].errorHistory = [];
                }
                user.sessions[sessionIndex].errorHistory.unshift(errorEntry);
                
                // Keep only last 50 errors per session
                if (user.sessions[sessionIndex].errorHistory.length > 50) {
                    user.sessions[sessionIndex].errorHistory = user.sessions[sessionIndex].errorHistory.slice(0, 50);
                }
            }
            
            // Update user-wide error statistics
            user.statistics.totalErrors = (user.statistics.totalErrors || 0) + compilationResult.errors.length;
            user.statistics.totalWarnings = (user.statistics.totalWarnings || 0) + compilationResult.warnings.length;
            
            // Add to comprehensive error history
            if (!user.errorHistory) {
                user.errorHistory = [];
            }
            user.errorHistory.unshift(errorEntry);
            
            // Keep only last 200 errors in user history
            if (user.errorHistory.length > 200) {
                user.errorHistory = user.errorHistory.slice(0, 200);
            }
            
            await userDB.saveUser(userId, user);
        }

        // Remove XP for each error
        const xpLoss = compilationResult.errors.length * 5;
        const errorMessages = compilationResult.errors.map(e => e.message).join('; ');
        const xpResult = await userDB.removeXP(userId, xpLoss, `${compilationResult.errors.length} compilation error(s): ${errorMessages}`, sessionId, {
            errors: compilationResult.errors,
            warnings: compilationResult.warnings,
            consoleOutput: compilationResult.consoleOutput,
            type: 'compilation',
            errorCount: compilationResult.errors.length
        });
        
        if (xpResult.success) {
            res.json({ 
                success: true, 
                user: xpResult.user,
                xpLost: xpLoss,
                errorId: errorEntry.id,
                errorCount: compilationResult.errors.length,
                warningCount: compilationResult.warnings.length,
                message: `${compilationResult.errors.length} error(s) detected! -${xpLoss} XP`,
                userFile: `${userId}.json`,
                errorDetails: {
                    errors: compilationResult.errors.length,
                    warnings: compilationResult.warnings.length,
                    consoleOutput: compilationResult.consoleOutput.length
                }
            });
        } else {
            res.status(400).json({ success: false, error: xpResult.error });
        }
    } catch (error) {
        console.error('Code error handling error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ===== PROJECT MANAGEMENT ENDPOINTS =====

// Save project to individual user file
app.post('/api/save-project', async (req, res) => {
    try {
        const { userId, projectData } = req.body;
        
        const result = await userDB.saveProject(userId, projectData);
        
        if (result.success) {
            res.json({ 
                success: true, 
                project: result.project,
                user: result.user,
                xpGained: 25,
                leveledUp: result.user.level > (result.user.xp - 25) / 100,
                message: `Project "${result.project.name}" saved! +25 XP`,
                userFile: `${userId}.json`,
                projectStats: result.project.statistics
            });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Save project error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get user projects from individual file
app.get('/api/user-projects/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userResult = await userDB.getUser(parseInt(userId));
        if (!userResult.success) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ 
            success: true, 
            projects: userResult.user.projects || [],
            totalProjects: userResult.user.statistics.totalProjects,
            userFile: `${userId}.json`
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ===== STATISTICS ENDPOINTS =====

// Get comprehensive user statistics from individual file
app.get('/api/user-stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await userDB.getUserStats(parseInt(userId));
        
        if (result.success) {
            res.json({ 
                success: true, 
                stats: result.stats,
                userFile: `${userId}.json`,
                fileLocation: `database/users/${userId}.json`
            });
        } else {
            res.status(404).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get leaderboard from master file
app.get('/api/leaderboard', async (req, res) => {
    try {
        const result = await userDB.getLeaderboard(10);
        
        if (result.success) {
            res.json({ 
                success: true, 
                leaderboard: result.leaderboard,
                source: 'Individual user files via master.json'
            });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ===== ADMIN ENDPOINTS =====

// Get database overview
app.get('/api/admin/overview', async (req, res) => {
    try {
        const masterData = await fs.readFile(path.join(__dirname, 'database', 'master.json'), 'utf8');
        const master = JSON.parse(masterData);
        
        // Get file count in users directory
        const usersDir = path.join(__dirname, 'database', 'users');
        const userFiles = await fs.readdir(usersDir);
        const jsonFiles = userFiles.filter(file => file.endsWith('.json'));
        
        const overview = {
            totalUsers: master.metadata.totalUsers,
            userFilesCount: jsonFiles.length,
            masterFile: 'database/master.json',
            usersDirectory: 'database/users/',
            userFiles: jsonFiles.slice(0, 5), // Show first 5 user files
            statistics: master.statistics,
            databaseVersion: master.metadata.version,
            lastUpdated: master.metadata.lastUpdated
        };

        res.json({ success: true, overview });
    } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get individual user file contents (admin only)
app.get('/api/admin/user-file/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userResult = await userDB.getUser(parseInt(userId));
        
        if (userResult.success) {
            res.json({ 
                success: true, 
                userData: userResult.user,
                filePath: `database/users/${userId}.json`,
                fileSize: JSON.stringify(userResult.user, null, 2).length + ' bytes'
            });
        } else {
            res.status(404).json({ success: false, error: 'User file not found' });
        }
    } catch (error) {
        console.error('Get user file error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Export user data as downloadable JSON
app.get('/api/export-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userResult = await userDB.getUser(parseInt(userId));
        
        if (userResult.success) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${userResult.user.username}_data.json"`);
            res.json(userResult.user);
        } else {
            res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (error) {
        console.error('Export user error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        // Check if database directory exists
        const dbDir = path.join(__dirname, 'database');
        const usersDir = path.join(dbDir, 'users');
        const masterFile = path.join(dbDir, 'master.json');
        
        await fs.access(dbDir);
        await fs.access(usersDir);
        await fs.access(masterFile);
        
        const userFiles = await fs.readdir(usersDir);
        const jsonFiles = userFiles.filter(file => file.endsWith('.json'));
        
        res.json({ 
            success: true, 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            database: {
                status: 'Connected',
                type: 'Individual User Files',
                userFiles: jsonFiles.length,
                masterFile: 'Available',
                usersDirectory: 'Available'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'ERROR',
            database: {
                status: 'Disconnected',
                error: error.message
            }
        });
    }
});

// Get user execution history
app.get('/api/user-history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, type = 'all' } = req.query;
        
        const userResult = await userDB.getUser(parseInt(userId));
        if (!userResult.success) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const user = userResult.user;
        let history = [];

        switch (type) {
            case 'executions':
                history = user.executionHistory || [];
                break;
            case 'errors':
                history = user.errorHistory || [];
                break;
            case 'all':
                const executions = (user.executionHistory || []).map(e => ({ ...e, type: 'execution' }));
                const errors = (user.errorHistory || []).map(e => ({ ...e, type: 'error' }));
                history = [...executions, ...errors].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
        }

        // Limit results
        const limitedHistory = history.slice(0, parseInt(limit));

        res.json({ 
            success: true, 
            history: limitedHistory,
            total: history.length,
            type: type,
            userFile: `${userId}.json`
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get session details with full history
app.get('/api/session/:userId/:sessionId', async (req, res) => {
    try {
        const { userId, sessionId } = req.params;
        
        const userResult = await userDB.getUser(parseInt(userId));
        if (!userResult.success) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const user = userResult.user;
        const session = user.sessions.find(s => s.id === sessionId);
        
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        // Enhanced session data with comprehensive history
        const sessionData = {
            ...session,
            statistics: {
                totalExecutions: session.executionHistory ? session.executionHistory.length : 0,
                totalErrors: session.errorHistory ? session.errorHistory.length : 0,
                successRate: session.codeRuns > 0 ? ((session.codeRuns - session.errors) / session.codeRuns * 100).toFixed(2) : 0,
                avgExecutionTime: session.executionHistory && session.executionHistory.length > 0 
                    ? (session.executionHistory.reduce((sum, e) => sum + (e.performance?.executionTime || 0), 0) / session.executionHistory.length).toFixed(2)
                    : 0
            }
        };

        res.json({ 
            success: true, 
            session: sessionData,
            userFile: `${userId}.json`
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get comprehensive analytics
app.get('/api/analytics/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { timeframe = '30days' } = req.query;
        
        const userResult = await userDB.getUser(parseInt(userId));
        if (!userResult.success) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const user = userResult.user;
        const now = new Date();
        let cutoffDate;

        switch (timeframe) {
            case '7days':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30days':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90days':
                cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffDate = new Date(0); // All time
        }

        // Filter data by timeframe
        const recentExecutions = (user.executionHistory || []).filter(e => new Date(e.timestamp) >= cutoffDate);
        const recentErrors = (user.errorHistory || []).filter(e => new Date(e.timestamp) >= cutoffDate);
        const recentSessions = user.sessions.filter(s => new Date(s.startTime) >= cutoffDate);

        const analytics = {
            timeframe,
            totalExecutions: recentExecutions.length,
            totalErrors: recentErrors.length,
            totalSessions: recentSessions.length,
            successRate: recentExecutions.length > 0 ? ((recentExecutions.length - recentErrors.length) / recentExecutions.length * 100).toFixed(2) : 0,
            avgExecutionTime: recentExecutions.length > 0 
                ? (recentExecutions.reduce((sum, e) => sum + (e.stats?.executionTime || 0), 0) / recentExecutions.length).toFixed(2)
                : 0,
            codeStats: {
                totalLines: recentExecutions.reduce((sum, e) => sum + (e.stats?.lineCount?.total || 0), 0),
                htmlLines: recentExecutions.reduce((sum, e) => sum + (e.stats?.lineCount?.html || 0), 0),
                cssLines: recentExecutions.reduce((sum, e) => sum + (e.stats?.lineCount?.css || 0), 0),
                jsLines: recentExecutions.reduce((sum, e) => sum + (e.stats?.lineCount?.js || 0), 0)
            },
            errorBreakdown: {
                syntaxErrors: recentErrors.reduce((sum, e) => sum + e.errors.filter(err => err.category === 'syntax').length, 0),
                runtimeErrors: recentErrors.reduce((sum, e) => sum + e.errors.filter(err => err.category === 'runtime').length, 0),
                promiseErrors: recentErrors.reduce((sum, e) => sum + e.errors.filter(err => err.category === 'promise').length, 0)
            },
            dailyActivity: generateDailyActivity(recentExecutions, cutoffDate)
        };

        res.json({ 
            success: true, 
            analytics,
            userFile: `${userId}.json`
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Helper function to generate daily activity data
function generateDailyActivity(executions, cutoffDate) {
    const days = {};
    const now = new Date();
    
    // Initialize all days in range with 0
    for (let d = new Date(cutoffDate); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        days[dateStr] = { executions: 0, errors: 0 };
    }
    
    // Count executions by day
    executions.forEach(execution => {
        const dateStr = new Date(execution.timestamp).toISOString().split('T')[0];
        if (days[dateStr]) {
            days[dateStr].executions++;
            if (!execution.compilation.success) {
                days[dateStr].errors++;
            }
        }
    });
    
    return Object.entries(days).map(([date, data]) => ({
        date,
        executions: data.executions,
        errors: data.errors,
        successRate: data.executions > 0 ? ((data.executions - data.errors) / data.executions * 100).toFixed(2) : 0
    }));
}

// Start server
async function startServer() {
    try {
        await userDB.initializeDatabase();
        app.listen(PORT, () => {
            console.log(`🚀 Gamified Coding Journal server running on http://localhost:${PORT}`);
            console.log(`🗃️ Individual User File Database System active`);
            console.log(`📁 Database structure:`);
            console.log(`   └── database/`);
            console.log(`       ├── master.json (user registry)`);
            console.log(`       └── users/`);
            console.log(`           ├── {userId1}.json`);
            console.log(`           ├── {userId2}.json`);
            console.log(`           └── ...`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();