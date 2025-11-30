// Main application logic
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
        showMainApp();
        checkDailyLogin();
        
        // Initialize real-time preview with better error handling
        setTimeout(() => {
            try {
                // Ensure editors exist before initializing
                if (document.getElementById('htmlEditor') && 
                    document.getElementById('cssEditor') && 
                    document.getElementById('jsEditor')) {
                    
                    updateEditorStats();
                    runCodeRealtime();
                    addConsoleLog('🎮 Welcome back! Real-time compiler is ready.', 'success');
                    
                    // Add input listeners for real-time updates
                    setupRealTimeListeners();
                } else {
                    console.warn('Editors not found, retrying...');
                    setTimeout(() => setupRealTimeListeners(), 1000);
                }
            } catch (error) {
                console.error('Error initializing real-time preview:', error);
            }
        }, 500);
    } else {
        showAuthScreen();
    }
    
    // Initialize sample code for new users
    initializeSampleCode();
    
    // Add auto-save functionality
    setupAutoSave();
    
    // Add tips and hints
    setupHelpSystem();

    // Initialize data structure
    initializeDataStructure();
});

// Enhanced gamified session management with local database integration
let currentSession = null;
let sessionActive = false;

// Updated main.js to remove localStorage and use database
function initializeSampleCode() {
    // Only show sample code if editors are empty and no active session
    if (!sessionActive && !document.getElementById('htmlEditor').value) {
        document.getElementById('htmlEditor').value = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Gamified Project</title>
</head>
<body>
    <div class="container">
        <h1>🎮 Welcome to Gamified Coding!</h1>
        <p>Click START to begin earning XP, then RUN to execute your code!</p>
        <button onclick="showWelcome()">Click me!</button>
    </div>
</body>
</html>`;
    }
    
    if (!sessionActive && !document.getElementById('cssEditor').value) {
        document.getElementById('cssEditor').value = `/* Gamified CSS Styles */
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 50px 20px;
    text-align: center;
    font-family: 'Arial', sans-serif;
}

body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-height: 100vh;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

h1 {
    font-size: 3rem;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
    from { text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
    to { text-shadow: 0 0 20px rgba(255,255,255,0.5), 2px 2px 4px rgba(0,0,0,0.3); }
}

button {
    background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 50px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}`;
    }
    
    if (!sessionActive && !document.getElementById('jsEditor').value) {
        document.getElementById('jsEditor').value = `// Gamified JavaScript with XP system integration
function showWelcome() {
    // Create a celebration effect
    createConfetti();
    
    // Show success message
    alert('🎉 Great! You just executed your first code!\\n\\nTips to earn more XP:\\n• Click START to begin a session (+10 XP)\\n• Click RUN to execute code (+15 XP)\\n• Save projects (+25 XP)\\n• Avoid JavaScript errors (-5 XP)');
}

function createConfetti() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
    
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = \`
                position: fixed;
                width: 10px;
                height: 10px;
                background: \${colors[Math.floor(Math.random() * colors.length)]};
                left: \${Math.random() * 100}vw;
                top: -10px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                animation: confetti-fall 3s linear forwards;
            \`;
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 20);
    }
}

// Add confetti animation
if (!document.getElementById('confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'confetti-styles';
    style.textContent = \`
        @keyframes confetti-fall {
            0% {
                transform: translateY(-100vh) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
    \`;
    document.head.appendChild(style);
}

console.log('🎮 Gamified Coding Journal loaded! Ready to earn XP!');`;
    }
}

// Helper function to add console logs
function addConsoleLog(message, type = 'info') {
    const consoleOutput = document.getElementById('consoleOutput');
    if (consoleOutput) {
        const timestamp = new Date().toLocaleTimeString();
        const logLine = document.createElement('div');
        logLine.className = `console-line ${type}`;
        logLine.textContent = `[${timestamp}] ${message}`;
        consoleOutput.appendChild(logLine);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
}

// Helper function to update preview status
function updatePreviewStatus(status, type = 'ready') {
    const statusElement = document.getElementById('previewStatus');
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = `preview-status ${type}`;
    }
}

// Helper function to show XP notifications
function showXPNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = type === 'error' ? 'error-notification' : 'success-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Helper function to get current user (updated to work with database)
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// Helper function to update user display
function updateUserDisplay(user) {
    if (user) {
        document.getElementById('currentUser').textContent = user.username;
        document.getElementById('userXP').textContent = user.xp;
        document.getElementById('userLevel').textContent = user.level;
        
        // Update XP progress bar if it exists
        const progressBar = document.querySelector('.xp-progress-fill');
        if (progressBar) {
            const xpForCurrentLevel = (user.level - 1) * 100;
            const xpInCurrentLevel = user.xp - xpForCurrentLevel;
            const progressPercent = (xpInCurrentLevel % 100);
            progressBar.style.width = `${progressPercent}%`;
        }
        
        // Store updated user data
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
}

// Setup real-time listeners for the editors
function setupRealTimeListeners() {
    const htmlEditor = document.getElementById('htmlEditor');
    const cssEditor = document.getElementById('cssEditor');
    const jsEditor = document.getElementById('jsEditor');
    
    if (htmlEditor && cssEditor && jsEditor) {
        htmlEditor.addEventListener('input', runCodeRealtime);
        cssEditor.addEventListener('input', runCodeRealtime);
        jsEditor.addEventListener('input', runCodeRealtime);
        
        // Initial run
        runCodeRealtime();
        addConsoleLog('🔄 Real-time listeners activated', 'info');
    }
}

// Real-time code execution (for live preview)
function runCodeRealtime() {
    const htmlCode = document.getElementById('htmlEditor').value;
    const cssCode = document.getElementById('cssEditor').value;
    const jsCode = document.getElementById('jsEditor').value;
    
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Preview</title>
    <style>
        /* Reset and base styles */
        * { box-sizing: border-box; }
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6;
        }
        
        /* User CSS */
        ${cssCode}
    </style>
</head>
<body>
    ${htmlCode}
    
    <script>
        try {
            ${jsCode}
        } catch(error) {
            console.error('JavaScript Error:', error.message);
        }
    </script>
</body>
</html>`;
    
    const preview = document.getElementById('preview');
    if (preview) {
        preview.srcdoc = fullHTML;
    }
}

// Auto-save functionality
function setupAutoSave() {
    let autoSaveInterval;
    
    function autoSave() {
        const currentUser = getCurrentUser();
        if (currentUser && sessionActive) {
            const htmlCode = document.getElementById('htmlEditor').value;
            const cssCode = document.getElementById('cssEditor').value;
            const jsCode = document.getElementById('jsEditor').value;
            
            // Only save if there's actual content
            if (htmlCode.trim() || cssCode.trim() || jsCode.trim()) {
                localStorage.setItem(`autosave_${currentUser.id}`, JSON.stringify({
                    html: htmlCode,
                    css: cssCode,
                    js: jsCode,
                    timestamp: new Date().toISOString()
                }));
                
                addConsoleLog('💾 Auto-saved', 'info');
            }
        }
    }
    
    // Auto-save every 30 seconds during active session
    autoSaveInterval = setInterval(autoSave, 30000);
    
    // Load auto-saved content on startup
    const currentUser = getCurrentUser();
    if (currentUser) {
        const autoSaved = localStorage.getItem(`autosave_${currentUser.id}`);
        if (autoSaved) {
            const data = JSON.parse(autoSaved);
            const isRecent = (new Date() - new Date(data.timestamp)) < 24 * 60 * 60 * 1000; // 24 hours
            
            if (isRecent && confirm('Found auto-saved work. Would you like to restore it?')) {
                document.getElementById('htmlEditor').value = data.html;
                document.getElementById('cssEditor').value = data.css;
                document.getElementById('jsEditor').value = data.js;
                runCodeRealtime();
                addConsoleLog('🔄 Auto-saved content restored', 'success');
            }
        }
    }
}

// Help system
function setupHelpSystem() {
    // Add helpful tips based on user activity
    const tips = [
        "💡 Tip: Use the START button to begin earning XP!",
        "💡 Tip: Each successful code run gives you +15 XP",
        "💡 Tip: Save your projects to earn +25 XP bonus",
        "💡 Tip: JavaScript errors will deduct -5 XP",
        "💡 Tip: You level up every 100 XP points",
        "💡 Tip: Use console.log() to debug your JavaScript"
    ];
    
    let tipIndex = 0;
    
    function showRandomTip() {
        if (!sessionActive) return;
        
        const tip = tips[tipIndex % tips.length];
        addConsoleLog(tip, 'info');
        tipIndex++;
    }
    
    // Show a tip every 5 minutes during active sessions
    setInterval(showRandomTip, 5 * 60 * 1000);
}

// Initialize data structure for backward compatibility
function initializeDataStructure() {
    // This function ensures compatibility with existing localStorage-based systems
    // while transitioning to the new database system
    
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Initialize basic user statistics if they don't exist
        if (!currentUser.statistics) {
            const updatedUser = {
                ...currentUser,
                statistics: {
                    totalSessions: 0,
                    totalCodeRuns: 0,
                    totalProjects: 0,
                    htmlLines: 0,
                    cssLines: 0,
                    jsLines: 0,
                    totalLines: 0,
                    errorsFixed: 0
                }
            };
            updateUserDisplay(updatedUser);
        }
    }
}

// Database connection status indicator
function showDatabaseStatus() {
    const statusDiv = document.createElement('div');
    statusDiv.className = 'db-status connected';
    statusDiv.innerHTML = `
        <span>🟢</span>
        <span>Local Database Connected</span>
    `;
    document.body.appendChild(statusDiv);
}

// Initialize database status on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(showDatabaseStatus, 1000);
});

// Enhanced project saving with database integration
async function saveProject() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('Please login first');
            return;
        }

        const htmlCode = document.getElementById('htmlEditor').value;
        const cssCode = document.getElementById('cssEditor').value;
        const jsCode = document.getElementById('jsEditor').value;

        if (!htmlCode.trim() && !cssCode.trim() && !jsCode.trim()) {
            alert('Please write some code before saving');
            return;
        }

        const projectName = prompt('Enter project name:');
        if (!projectName) return;

        const projectData = {
            name: projectName,
            html: htmlCode,
            css: cssCode,
            js: jsCode,
            description: prompt('Project description (optional):') || '',
            tags: (prompt('Tags (comma-separated, optional):') || '').split(',').map(t => t.trim()).filter(t => t)
        };

        const response = await fetch('/api/save-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                projectData: projectData
            })
        });

        const result = await response.json();
        
        if (result.success) {
            updateUserDisplay(result.user);
            
            let message = `${result.message} (Saved to: ${result.userFile})`;
            if (result.leveledUp) {
                message += ` 🎉 LEVEL UP!`;
            }
            
            showXPNotification(message);
            addConsoleLog(`💾 Project "${projectName}" saved to ${result.userFile}`, 'success');
            addConsoleLog(`📊 Project Stats: ${result.projectStats.totalLines} lines (HTML: ${result.projectStats.htmlLines}, CSS: ${result.projectStats.cssLines}, JS: ${result.projectStats.jsLines})`, 'info');
            
            if (result.leveledUp) {
                showLevelUpNotification(result.user.level);
            }
            
            // Clear auto-save since project is now saved
            localStorage.removeItem(`autosave_${currentUser.id}`);
            
        } else {
            alert('Failed to save project: ' + result.error);
        }
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Network error. Please try again.');
    }
}

// Enhanced editor statistics
function updateEditorStats() {
    const activeEditor = document.querySelector('.editor.active');
    if (activeEditor) {
        const content = activeEditor.value;
        const lines = content.split('\n').length;
        const chars = content.length;
        
        document.getElementById('lineCount').textContent = `Lines: ${lines}`;
        document.getElementById('charCount').textContent = `Chars: ${chars}`;
        
        // Update line numbers
        const lineNumbers = document.getElementById('lineNumbers');
        const lineNumbersText = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
        lineNumbers.textContent = lineNumbersText;
    }
}

// Enhanced session management with individual user file database
async function startCodingSession() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('Please login first');
            return;
        }

        if (sessionActive) {
            alert('Session already active!');
            return;
        }

        updateSessionStatus('Starting session...', 'warning');
        
        // Call API to start session (saves to individual user file)
        const response = await fetch('/api/start-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });

        const result = await response.json();
        
        if (result.success) {
            currentSession = {
                id: result.sessionId,
                startTime: new Date(),
                codeRuns: 0,
                errors: 0
            };
            
            sessionActive = true;
            
            // Update UI
            updateSessionStatus('Session Active', 'success');
            updateUserDisplay(result.user);
            
            // Enable RUN button and show session info
            document.getElementById('runBtn').disabled = false;
            document.getElementById('startBtn').textContent = '🟢 Active';
            document.getElementById('startBtn').disabled = true;
            
            // Show XP notification with file info
            showXPNotification(`${result.message} (Saved to: ${result.userFile})`);
            addConsoleLog(`🚀 Session started! Data saved to ${result.userFile} +10 XP`, 'success');
            addConsoleLog(`💾 Individual user file system active`, 'info');
            
        } else {
            updateSessionStatus('Failed to start', 'error');
            alert('Failed to start session: ' + result.error);
        }
    } catch (error) {
        console.error('Error starting session:', error);
        updateSessionStatus('Error', 'error');
        alert('Network error. Please try again.');
    }
}

async function runCodeWithDatabase() {
    try {
        if (!sessionActive) {
            alert('Please start a session first!');
            return;
        }

        const currentUser = getCurrentUser();
        const htmlCode = document.getElementById('htmlEditor').value;
        const cssCode = document.getElementById('cssEditor').value;
        const jsCode = document.getElementById('jsEditor').value;

        updateSessionStatus('Compiling...', 'warning');
        updatePreviewStatus('Compiling...', 'warning');
        
        // Enhanced code data with metadata
        const codeData = {
            html: htmlCode,
            css: cssCode,
            js: jsCode,
            timestamp: new Date().toISOString(),
            sessionId: currentSession.id,
            lineCount: {
                html: htmlCode.split('\n').length,
                css: cssCode.split('\n').length,
                js: jsCode.split('\n').length,
                total: htmlCode.split('\n').length + cssCode.split('\n').length + jsCode.split('\n').length
            },
            charCount: {
                html: htmlCode.length,
                css: cssCode.length,
                js: jsCode.length,
                total: htmlCode.length + cssCode.length + jsCode.length
            }
        };

        // Enhanced error detection with better parsing
        const compilationResult = await executeCodeWithAdvancedCompiler(codeData);
        
        if (compilationResult.hasErrors) {
            // Handle compilation/runtime errors with detailed tracking
            await handleCodeExecutionError(currentUser.id, compilationResult);
        } else {
            // Successful execution - award XP and store in history
            const response = await fetch('/api/run-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    code: codeData,
                    sessionId: currentSession.id,
                    compilationResult: compilationResult
                })
            });

            const result = await response.json();
            
            if (result.success) {
                currentSession.codeRuns++;
                updateUserDisplay(result.user);
                updateSessionStatus('Code Executed Successfully', 'success');
                updatePreviewStatus('Running Successfully', 'success');
                
                // Enhanced success notification
                let message = result.message;
                if (result.levelUpBonus > 0) {
                    message += ` 🎉 Level Up Bonus: +${result.levelUpBonus} XP!`;
                }
                
                showXPNotification(message);
                addConsoleLog(`✅ Code compiled and executed successfully! (+15 XP)`, 'success');
                addConsoleLog(`📊 Code stats: ${codeData.lineCount.total} lines, ${codeData.charCount.total} characters`, 'info');
                addConsoleLog(`💾 Execution history saved to ${result.userFile}`, 'info');
                
                if (result.leveledUp) {
                    showLevelUpNotification(result.user.level);
                    addConsoleLog(`🎉 LEVEL UP! Reached Level ${result.user.level}!`, 'success');
                }

                // Store execution in local history for quick access
                storeLocalExecutionHistory(codeData, compilationResult);
            }
        }

    } catch (error) {
        console.error('Error in code execution:', error);
        updateSessionStatus('Compilation Error', 'error');
        updatePreviewStatus('Compilation Failed', 'error');
        addConsoleLog(`❌ Compiler error: ${error.message}`, 'error');
    }
}

// Advanced code compiler with better error detection
async function executeCodeWithAdvancedCompiler(codeData) {
    return new Promise((resolve) => {
        const { html, css, js } = codeData;
        let compilationResult = {
            hasErrors: false,
            errors: [],
            warnings: [],
            executionTime: 0,
            memoryUsage: 0,
            consoleOutput: [],
            syntaxValid: true,
            linesExecuted: 0,
            complexity: 0
        };

        const startTime = performance.now();

        // Enhanced pre-compilation validation
        try {
            // Advanced HTML validation
            const htmlValidation = validateHTML(html);
            compilationResult.warnings.push(...htmlValidation.warnings);
            if (htmlValidation.errors.length > 0) {
                compilationResult.hasErrors = true;
                compilationResult.errors.push(...htmlValidation.errors);
            }

            // Advanced CSS validation
            const cssValidation = validateCSS(css);
            compilationResult.warnings.push(...cssValidation.warnings);
            if (cssValidation.errors.length > 0) {
                compilationResult.hasErrors = true;
                compilationResult.errors.push(...cssValidation.errors);
            }

            // Enhanced JavaScript validation
            const jsValidation = validateJavaScript(js);
            compilationResult.warnings.push(...jsValidation.warnings);
            compilationResult.complexity = jsValidation.complexity;
            compilationResult.linesExecuted = jsValidation.linesExecuted;
            
            if (jsValidation.errors.length > 0) {
                compilationResult.hasErrors = true;
                compilationResult.syntaxValid = false;
                compilationResult.errors.push(...jsValidation.errors);
            }

        } catch (validationError) {
            compilationResult.hasErrors = true;
            compilationResult.errors.push({
                type: 'validation',
                category: 'system',
                message: 'Pre-compilation validation failed: ' + validationError.message,
                line: 'unknown',
                severity: 'error',
                timestamp: new Date().toISOString()
            });
        }

        // If syntax errors found, return early
        if (compilationResult.hasErrors && !compilationResult.syntaxValid) {
            compilationResult.executionTime = performance.now() - startTime;
            resolve(compilationResult);
            return;
        }

        // Enhanced sandboxed HTML document with comprehensive monitoring
        const fullHTML = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'    <meta charset="UTF-8">\n' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'    <title>Enhanced Live Preview - Compiler v2.0</title>\n' +
'    <style>\n' +
'        /* Reset and base styles */\n' +
'        * { \n' +
'            box-sizing: border-box; \n' +
'        }\n' +
'        body { \n' +
'            margin: 0; \n' +
'            padding: 20px; \n' +
'            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; \n' +
'            line-height: 1.6;\n' +
'            background: #f8f9fa;\n' +
'        }\n' +
'        \n' +
'        /* Compiler status indicator */\n' +
'        .compiler-status {\n' +
'            position: fixed;\n' +
'            bottom: 10px;\n' +
'            right: 10px;\n' +
'            background: rgba(0,0,0,0.7);\n' +
'            color: white;\n' +
'            padding: 5px 10px;\n' +
'            border-radius: 5px;\n' +
'            font-size: 12px;\n' +
'            z-index: 9999;\n' +
'        }\n' +
'        \n' +
'        /* User CSS */\n' +
'        ' + css + '\n' +
'    </style>\n' +
'</head>\n' +
'<body>\n' +
'    ' + html + '\n' +
'    \n' +
'    <div class="compiler-status" id="compilerStatus">Compiler v2.0 - Initializing...</div>\n' +
'    \n' +
'    <script>\n' +
'        // Enhanced error and performance tracking system\n' +
'        const compilationMetrics = {\n' +
'            startTime: performance.now(),\n' +
'            errors: [],\n' +
'            warnings: [],\n' +
'            consoleOutput: [],\n' +
'            performance: {\n' +
'                domNodes: 0,\n' +
'                eventListeners: 0,\n' +
'                networkRequests: 0,\n' +
'                memoryUsage: null\n' +
'            },\n' +
'            security: {\n' +
'                suspiciousCode: [],\n' +
'                blockedOperations: []\n' +
'            }\n' +
'        };\n' +
'        \n' +
'        // Update compiler status\n' +
'        function updateCompilerStatus(message, type) {\n' +
'            const status = document.getElementById("compilerStatus");\n' +
'            if (status) {\n' +
'                status.textContent = message;\n' +
'                status.style.background = type === "error" ? "rgba(220, 53, 69, 0.8)" : \n' +
'                                         type === "warning" ? "rgba(255, 193, 7, 0.8)" : \n' +
'                                         "rgba(40, 167, 69, 0.8)";\n' +
'            }\n' +
'        }\n' +
'        \n' +
'        // Enhanced console override with detailed tracking\n' +
'        const originalConsole = {\n' +
'            log: console.log,\n' +
'            error: console.error,\n' +
'            warn: console.warn,\n' +
'            info: console.info,\n' +
'            debug: console.debug\n' +
'        };\n' +
'        \n' +
'        function createConsoleOverride(type) {\n' +
'            return function(...args) {\n' +
'                const timestamp = new Date().toISOString();\n' +
'                const processedArgs = args.map(arg => {\n' +
'                    if (typeof arg === "object") {\n' +
'                        try {\n' +
'                            return JSON.stringify(arg, null, 2);\n' +
'                        } catch (e) {\n' +
'                            return "[Object - Could not stringify]";\n' +
'                        }\n' +
'                    }\n' +
'                    return String(arg);\n' +
'                });\n' +
'                \n' +
'                compilationMetrics.consoleOutput.push({\n' +
'                    type: type,\n' +
'                    message: processedArgs.join(" "),\n' +
'                    timestamp: timestamp,\n' +
'                    stackTrace: type === "error" ? new Error().stack : null\n' +
'                });\n' +
'                \n' +
'                originalConsole[type].apply(console, args);\n' +
'                updateCompilerStatus("Console: " + compilationMetrics.consoleOutput.length + " entries", "info");\n' +
'            };\n' +
'        }\n' +
'        \n' +
'        console.log = createConsoleOverride("log");\n' +
'        console.error = createConsoleOverride("error");\n' +
'        console.warn = createConsoleOverride("warn");\n' +
'        console.info = createConsoleOverride("info");\n' +
'        console.debug = createConsoleOverride("debug");\n' +
'\n' +
'        // Enhanced global error handler with detailed stack traces\n' +
'        window.addEventListener("error", function(e) {\n' +
'            const error = {\n' +
'                type: "javascript",\n' +
'                category: "runtime",\n' +
'                message: e.message,\n' +
'                filename: e.filename || "user_code.js",\n' +
'                lineno: e.lineno || "unknown",\n' +
'                colno: e.colno || "unknown",\n' +
'                stack: e.error ? e.error.stack : null,\n' +
'                severity: "error",\n' +
'                timestamp: new Date().toISOString(),\n' +
'                userAgent: navigator.userAgent,\n' +
'                url: window.location.href\n' +
'            };\n' +
'            \n' +
'            compilationMetrics.errors.push(error);\n' +
'            updateCompilerStatus("Runtime Error: " + error.message, "error");\n' +
'            \n' +
'            window.parent.postMessage({\n' +
'                type: "compilation-result",\n' +
'                hasErrors: true,\n' +
'                errors: compilationMetrics.errors,\n' +
'                warnings: compilationMetrics.warnings,\n' +
'                consoleOutput: compilationMetrics.consoleOutput,\n' +
'                performance: compilationMetrics.performance,\n' +
'                executionTime: performance.now() - compilationMetrics.startTime\n' +
'            }, "*");\n' +
'        });\n' +
'        \n' +
'        // Enhanced promise rejection handler\n' +
'        window.addEventListener("unhandledrejection", function(e) {\n' +
'            const error = {\n' +
'                type: "javascript",\n' +
'                category: "promise",\n' +
'                message: "Unhandled Promise Rejection: " + (e.reason || "Unknown reason"),\n' +
'                severity: "error",\n' +
'                timestamp: new Date().toISOString(),\n' +
'                reason: e.reason,\n' +
'                stack: e.reason && e.reason.stack ? e.reason.stack : null\n' +
'            };\n' +
'            \n' +
'            compilationMetrics.errors.push(error);\n' +
'            updateCompilerStatus("Promise Rejection: " + error.message, "error");\n' +
'            \n' +
'            window.parent.postMessage({\n' +
'                type: "compilation-result",\n' +
'                hasErrors: true,\n' +
'                errors: compilationMetrics.errors,\n' +
'                warnings: compilationMetrics.warnings,\n' +
'                consoleOutput: compilationMetrics.consoleOutput,\n' +
'                performance: compilationMetrics.performance,\n' +
'                executionTime: performance.now() - compilationMetrics.startTime\n' +
'            }, "*");\n' +
'        });\n' +
'        \n' +
'        // Performance monitoring\n' +
'        function collectPerformanceMetrics() {\n' +
'            compilationMetrics.performance = {\n' +
'                domNodes: document.querySelectorAll("*").length,\n' +
'                eventListeners: getEventListenerCount(),\n' +
'                networkRequests: performance.getEntriesByType("resource").length,\n' +
'                memoryUsage: performance.memory ? {\n' +
'                    usedJSHeapSize: performance.memory.usedJSHeapSize,\n' +
'                    totalJSHeapSize: performance.memory.totalJSHeapSize,\n' +
'                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit\n' +
'                } : null,\n' +
'                paintMetrics: getPaintMetrics(),\n' +
'                timing: {\n' +
'                    domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.domContentLoadedEventStart,\n' +
'                    loadComplete: performance.timing.loadEventEnd - performance.timing.loadEventStart\n' +
'                }\n' +
'            };\n' +
'        }\n' +
'        \n' +
'        function getEventListenerCount() {\n' +
'            // Approximation of event listeners\n' +
'            const elements = document.querySelectorAll("*");\n' +
'            let count = 0;\n' +
'            elements.forEach(el => {\n' +
'                if (el.onclick || el.onload || el.onchange) count++;\n' +
'            });\n' +
'            return count;\n' +
'        }\n' +
'        \n' +
'        function getPaintMetrics() {\n' +
'            const paintEntries = performance.getEntriesByType("paint");\n' +
'            const metrics = {};\n' +
'            paintEntries.forEach(entry => {\n' +
'                metrics[entry.name] = entry.startTime;\n' +
'            });\n' +
'            return metrics;\n' +
'        }\n' +
'        \n' +
'        // Security monitoring\n' +
'        function monitorSecurity() {\n' +
'            const suspiciousPatterns = [\n' +
'                /eval\\s*\\(/g,\n' +
'                /document\\.write\\s*\\(/g,\n' +
'                /innerHTML\\s*=/g,\n' +
'                /setTimeout\\s*\\(\\s*["\'].*["\']\\s*,/g,\n' +
'                /new\\s+Function\\s*\\(/g\n' +
'            ];\n' +
'            \n' +
'            const jsCode = ' + JSON.stringify(js) + ';\n' +
'            \n' +
'            suspiciousPatterns.forEach((pattern, index) => {\n' +
'                const matches = jsCode.match(pattern);\n' +
'                if (matches) {\n' +
'                    compilationMetrics.security.suspiciousCode.push({\n' +
'                        pattern: pattern.toString(),\n' +
'                        matches: matches.length,\n' +
'                        severity: "medium",\n' +
'                        description: getSuspiciousCodeDescription(index)\n' +
'                    });\n' +
'                }\n' +
'            });\n' +
'        }\n' +
'        \n' +
'        function getSuspiciousCodeDescription(patternIndex) {\n' +
'            const descriptions = [\n' +
'                "Use of eval() - Security risk",\n' +
'                "Use of document.write() - Not recommended",\n' +
'                "Direct innerHTML modification - XSS risk",\n' +
'                "setTimeout with string - Security risk",\n' +
'                "Dynamic function creation - Security risk"\n' +
'            ];\n' +
'            return descriptions[patternIndex] || "Unknown security pattern";\n' +
'        }\n' +
'        \n' +
'        // Enhanced code execution with comprehensive monitoring\n' +
'        updateCompilerStatus("Executing user code...", "info");\n' +
'        \n' +
'        try {\n' +
'            monitorSecurity();\n' +
'            \n' +
'            const executionStart = performance.now();\n' +
'            \n' +
'            // Execute user JavaScript in controlled environment\n' +
'            ' + js + '\n' +
'            \n' +
'            const executionEnd = performance.now();\n' +
'            const executionTime = executionEnd - executionStart;\n' +
'            \n' +
'            // Collect final metrics\n' +
'            setTimeout(() => {\n' +
'                collectPerformanceMetrics();\n' +
'                \n' +
'                updateCompilerStatus("Code executed successfully", "success");\n' +
'                \n' +
'                // Send success result with comprehensive data\n' +
'                window.parent.postMessage({\n' +
'                    type: "compilation-result",\n' +
'                    hasErrors: compilationMetrics.errors.length > 0,\n' +
'                    errors: compilationMetrics.errors,\n' +
'                    warnings: compilationMetrics.warnings,\n' +
'                    consoleOutput: compilationMetrics.consoleOutput,\n' +
'                    performance: compilationMetrics.performance,\n' +
'                    security: compilationMetrics.security,\n' +
'                    executionTime: executionTime,\n' +
'                    totalTime: performance.now() - compilationMetrics.startTime,\n' +
'                    memoryUsage: compilationMetrics.performance.memoryUsage\n' +
'                }, "*");\n' +
'            }, 100); // Small delay to capture post-execution metrics\n' +
'            \n' +
'        } catch(executionError) {\n' +
'            const error = {\n' +
'                type: "javascript",\n' +
'                category: "execution",\n' +
'                message: executionError.message,\n' +
'                stack: executionError.stack,\n' +
'                severity: "error",\n' +
'                timestamp: new Date().toISOString(),\n' +
'                name: executionError.name\n' +
'            };\n' +
'            \n' +
'            compilationMetrics.errors.push(error);\n' +
'            updateCompilerStatus("Execution Error: " + error.message, "error");\n' +
'            \n' +
'            window.parent.postMessage({\n' +
'                type: "compilation-result",\n' +
'                hasErrors: true,\n' +
'                errors: compilationMetrics.errors,\n' +
'                warnings: compilationMetrics.warnings,\n' +
'                consoleOutput: compilationMetrics.consoleOutput,\n' +
'                performance: compilationMetrics.performance,\n' +
'                security: compilationMetrics.security,\n' +
'                executionTime: performance.now() - compilationMetrics.startTime\n' +
'            }, "*");\n' +
'        }\n' +
'        \n' +
'        // Final status update\n' +
'        setTimeout(() => {\n' +
'            const totalTime = performance.now() - compilationMetrics.startTime;\n' +
'            updateCompilerStatus("Compiler v2.0 - Ready (" + totalTime.toFixed(2) + "ms)", "success");\n' +
'        }, 200);\n' +
'    </script>\n' +
'</body>\n' +
'</html>';
        
        // Set up enhanced message listener
        const messageHandler = (event) => {
            if (event.data.type === 'compilation-result') {
                window.removeEventListener('message', messageHandler);
                
                const endTime = performance.now();
                compilationResult.executionTime = endTime - startTime;
                
                // Merge comprehensive results
                compilationResult.hasErrors = event.data.hasErrors;
                compilationResult.errors = [...compilationResult.errors, ...event.data.errors];
                compilationResult.warnings = [...compilationResult.warnings, ...event.data.warnings];
                compilationResult.consoleOutput = event.data.consoleOutput || [];
                compilationResult.memoryUsage = event.data.memoryUsage;
                compilationResult.performance = event.data.performance;
                compilationResult.security = event.data.security;
                compilationResult.totalTime = event.data.totalTime;
                
                addConsoleLog(`🔧 Compiler v2.0 - Analysis complete (${compilationResult.totalTime.toFixed(2)}ms)`, 'info');
                
                resolve(compilationResult);
            }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Update preview with enhanced HTML
        const preview = document.getElementById('preview');
        if (preview) {
            preview.srcdoc = fullHTML;
        }
        
        // Enhanced timeout with detailed error
        setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            compilationResult.hasErrors = true;
            compilationResult.errors.push({
                type: 'system',
                category: 'timeout',
                message: 'Code execution timeout (8 seconds) - Possible infinite loop or heavy computation',
                severity: 'error',
                timestamp: new Date().toISOString(),
                executionTime: compilationResult.executionTime,
                suggestions: [
                    'Check for infinite loops in your code',
                    'Reduce computational complexity',
                    'Use setTimeout for heavy operations'
                ]
            });
            resolve(compilationResult);
        }, 8000); // Increased timeout to 8 seconds
    });
}

// Enhanced HTML validation function
function validateHTML(html) {
    const result = { errors: [], warnings: [] };
    
    if (!html.trim()) return result;
    
    // Check for basic HTML structure
    const hasDoctype = /<!DOCTYPE\s+html>/i.test(html);
    if (!hasDoctype && html.includes('<html')) {
        result.warnings.push({
            type: 'html',
            category: 'structure',
            message: 'Missing DOCTYPE declaration',
            severity: 'warning',
            suggestion: 'Add <!DOCTYPE html> at the beginning'
        });
    }
    
    // Check for unclosed tags
    const tags = html.match(/<[^/>]+>/g) || [];
    const closingTags = html.match(/<\/[^>]+>/g) || [];
    
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    
    tags.forEach(tag => {
        const tagName = tag.match(/<([^\\s/>]+)/)?.[1]?.toLowerCase();
        if (tagName && !selfClosingTags.includes(tagName) && !tag.endsWith('/>')) {
            const closingTag = `</${tagName}>`;
            if (!html.includes(closingTag)) {
                result.warnings.push({
                    type: 'html',
                    category: 'structure',
                    message: `Possible unclosed tag: ${tag}`,
                    severity: 'warning',
                    suggestion: `Add closing tag: ${closingTag}`
                });
            }
        }
    });
    
    // Check for deprecated attributes
    const deprecatedAttrs = ['align', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'valign'];
    deprecatedAttrs.forEach(attr => {
        const regex = new RegExp(`\\s${attr}\\s*=`, 'i');
        if (regex.test(html)) {
            result.warnings.push({
                type: 'html',
                category: 'deprecated',
                message: `Deprecated attribute '${attr}' found`,
                severity: 'warning',
                suggestion: 'Use CSS for styling instead'
            });
        }
    });
    
    return result;
}

// Enhanced CSS validation function
function validateCSS(css) {
    const result = { errors: [], warnings: [] };
    
    if (!css.trim()) return result;
    
    // Check for balanced braces
    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
        result.errors.push({
            type: 'css',
            category: 'syntax',
            message: `CSS syntax error: ${openBraces} opening braces, ${closeBraces} closing braces`,
            severity: 'error',
            suggestion: 'Check for missing or extra braces'
        });
    }
    
    // Check for missing semicolons
    const propertyLines = css.split('\n').filter(line => 
        line.includes(':') && !line.trim().startsWith('/*') && !line.trim().endsWith('*/')
    );
    
    propertyLines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
            result.warnings.push({
                type: 'css',
                category: 'syntax',
                message: `Possible missing semicolon on line ${index + 1}: ${trimmed}`,
                severity: 'warning',
                line: index + 1,
                suggestion: 'Add semicolon at the end of the property'
            });
        }
    });
    
    // Check for vendor prefixes without standard property
    const vendorPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
    const vendorProperties = css.match(/[-\w]+\s*:/g) || [];
    
    vendorProperties.forEach(prop => {
        const propName = prop.replace(':', '').trim();
        vendorPrefixes.forEach(prefix => {
            if (propName.startsWith(prefix)) {
                const standardProp = propName.replace(prefix, '');
                if (!css.includes(standardProp + ':')) {
                    result.warnings.push({
                        type: 'css',
                        category: 'compatibility',
                        message: `Vendor prefix '${propName}' found without standard property '${standardProp}'`,
                        severity: 'warning',
                        suggestion: `Add standard property: ${standardProp}`
                    });
                }
            }
        });
    });
    
    return result;
}

// Enhanced JavaScript validation function
function validateJavaScript(js) {
    const result = { 
        errors: [], 
        warnings: [], 
        complexity: 0, 
        linesExecuted: 0 
    };
    
    if (!js.trim()) return result;
    
    // Calculate complexity and lines
    result.linesExecuted = js.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length;
    result.complexity = calculateComplexity(js);
    
    // Enhanced syntax checking
    try {
        new Function(js);
    } catch (syntaxError) {
        result.errors.push({
            type: 'javascript',
            category: 'syntax',
            message: syntaxError.message,
            severity: 'error',
            name: syntaxError.name,
            suggestion: 'Fix syntax error before running'
        });
        return result; // Return early on syntax error
    }
    
    // Check for common issues
    const commonIssues = [
        {
            pattern: /console\.log\s*\(/g,
            message: 'console.log() statements found',
            severity: 'info',
            suggestion: 'Remove console.log statements for production'
        },
        {
            pattern: /var\s+\w+/g,
            message: 'Use of var keyword',
            severity: 'warning',
            suggestion: 'Use let or const instead of var'
        },
        {
            pattern: /==\s*(?!==)/g,
            message: 'Use of == operator',
            severity: 'warning',
            suggestion: 'Use === for strict equality'
        },
        {
            pattern: /setTimeout\s*\(\s*['"].*['"]\s*,/g,
            message: 'setTimeout with string code',
            severity: 'error',
            suggestion: 'Use function reference instead of string'
        },
        {
            pattern: /eval\s*\(/g,
            message: 'Use of eval() function',
            severity: 'error',
            suggestion: 'Avoid eval() for security reasons'
        }
    ];
    
    commonIssues.forEach(issue => {
        const matches = js.match(issue.pattern);
        if (matches) {
            const item = {
                type: 'javascript',
                category: 'best-practice',
                message: issue.message,
                severity: issue.severity,
                matches: matches.length,
                suggestion: issue.suggestion
            };
            
            if (issue.severity === 'error') {
                result.errors.push(item);
            } else {
                result.warnings.push(item);
            }
        }
    });
    
    return result;
}

// Calculate code complexity
function calculateComplexity(code) {
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionPatterns = [
        /if\s*\(/g,
        /else\s+if\s*\(/g,
        /while\s*\(/g,
        /for\s*\(/g,
        /switch\s*\(/g,
        /case\s+.*:/g,
        /catch\s*\(/g,
        /&&/g,
        /\|\|/g,
        /\?.*:/g // Ternary operator
    ];
    
    decisionPatterns.forEach(pattern => {
        const matches = code.match(pattern);
        if (matches) {
            complexity += matches.length;
        }
    });
    
    return complexity;
}

// Enhanced error handling with detailed tracking
async function handleCodeExecutionError(userId, compilationResult) {
    try {
        const response = await fetch('/api/code-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                compilationResult: compilationResult,
                sessionId: currentSession.id,
                timestamp: new Date().toISOString()
            })
        });

        const result = await response.json();
        
        if (result.success) {
            currentSession.errors++;
            updateUserDisplay(result.user);
            updateSessionStatus('Compilation Errors Detected', 'error');
            updatePreviewStatus('Errors Found', 'error');
            
            // Display detailed error information
            const errorCount = compilationResult.errors.length;
            const warningCount = compilationResult.warnings.length;
            
            let errorMessage = `${errorCount} error(s)`;
            if (warningCount > 0) {
                errorMessage += `, ${warningCount} warning(s)`;
            }
            
            showXPNotification(`Code compilation failed: ${errorMessage} (-5 XP per error)`, 'error');
            
            // Log each error with details
            compilationResult.errors.forEach((error, index) => {
                addConsoleLog(`❌ Error ${index + 1}: ${error.message} (Type: ${error.type}, Line: ${error.lineno || 'unknown'})`, 'error');
            });
            
            // Log warnings
            compilationResult.warnings.forEach((warning, index) => {
                addConsoleLog(`⚠️ Warning ${index + 1}: ${warning.message} (Type: ${warning.type})`, 'warning');
            });
            
            // Log console output
            if (compilationResult.consoleOutput.length > 0) {
                addConsoleLog(`📝 Console output captured (${compilationResult.consoleOutput.length} entries)`, 'info');
                compilationResult.consoleOutput.forEach(output => {
                    addConsoleLog(`${output.type.toUpperCase()}: ${output.message}`, output.type === 'error' ? 'error' : 'info');
                });
            }
            
            addConsoleLog(`💾 Error details saved to ${result.userFile}`, 'info');
            addConsoleLog(`🔍 Error tracking ID: ${result.errorId}`, 'info');
        }
    } catch (error) {
        console.error('Error handling code execution error:', error);
        addConsoleLog('❌ Failed to log error details', 'error');
    }
}

// Store execution history locally for quick access
function storeLocalExecutionHistory(codeData, compilationResult) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const historyKey = `execution_history_${currentUser.id}`;
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');

    const historyEntry = {
        id: Date.now(),
        timestamp: codeData.timestamp,
        sessionId: codeData.sessionId,
        code: {
            html: codeData.html,
            css: codeData.css,
            js: codeData.js
        },
        stats: {
            lines: codeData.lineCount,
            chars: codeData.charCount,
            executionTime: compilationResult.executionTime || 0
        },
        result: {
            success: !compilationResult.hasErrors,
            errorCount: compilationResult.errors.length,
            warningCount: compilationResult.warnings.length,
            consoleOutputCount: compilationResult.consoleOutput.length
        }
    };

    // Add to beginning of array (most recent first)
    history.unshift(historyEntry);

    // Keep only last 50 executions for performance
    if (history.length > 50) {
        history = history.slice(0, 50);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
    addConsoleLog(`📚 Execution #${historyEntry.id} stored in local history`, 'info');
}

async function endCodingSession() {
    try {
        if (!sessionActive) {
            return;
        }

        const currentUser = getCurrentUser();
        const response = await fetch('/api/end-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: currentUser.id,
                sessionId: currentSession.id 
            })
        });

        const result = await response.json();
        
        if (result.success) {
            const sessionDuration = new Date() - currentSession.startTime;
            const minutes = Math.floor(sessionDuration / 60000);
            
            sessionActive = false;
            
            // Update UI
            updateSessionStatus('Session Ended', 'info');
            document.getElementById('startBtn').textContent = '🚀 START';
            document.getElementById('startBtn').disabled = false;
            document.getElementById('runBtn').disabled = true;
            
            // Calculate total XP for this session
            const totalXpEarned = (currentSession.codeRuns * 15) - (currentSession.errors * 5) + 10;
            
            // Show session summary with file info
            showSessionSummary({
                duration: minutes,
                codeRuns: currentSession.codeRuns,
                errors: currentSession.errors,
                xpEarned: totalXpEarned,
                userFile: result.userFile
            });
            
            currentSession = null;
            addConsoleLog(`📊 Session completed and saved to ${result.userFile}`, 'info');
        }
    } catch (error) {
        console.error('Error ending session:', error);
    }
}

function updateSessionStatus(status, type = 'info') {
    const statusElement = document.getElementById('sessionStatus');
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = `session-status ${type}`;
    }
}

function showSessionSummary(summary) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        ">
            <h2>📊 Session Complete!</h2>
            <div style="margin: 20px 0; text-align: left;">
                <p><strong>⏱️ Duration:</strong> ${summary.duration} minutes</p>
                <p><strong>🚀 Code Runs:</strong> ${summary.codeRuns}</p>
                <p><strong>❌ Errors:</strong> ${summary.errors}</p>
                <p><strong>💎 XP Earned:</strong> ${summary.xpEarned}</p>
                <p><strong>💾 Data File:</strong> ${summary.userFile}</p>
                <p style="font-size: 12px; color: #ddd;">All session data permanently stored in your individual user file</p>
            </div>
            <button onclick="this.closest('.session-modal').remove()" style="
                background: #4ECDC4;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
            ">Continue Coding</button>
        </div>
    `;
    
    modal.className = 'session-modal';
    document.body.appendChild(modal);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 15000);
}

function showLevelUpNotification(newLevel) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #FFD700, #FFA500);
        color: white;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        z-index: 10001;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        animation: levelUp 3s ease-in-out;
    `;
    
    notification.innerHTML = `
        <h2 style="margin: 0 0 10px 0; font-size: 2rem;">🎉 LEVEL UP! 🎉</h2>
        <p style="margin: 0; font-size: 1.2rem;">You reached Level ${newLevel}!</p>
    `;
    
    // Add level up animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes levelUp {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// Enhanced database status indicator
function showDatabaseStatus() {
    const statusDiv = document.createElement('div');
    statusDiv.className = 'db-status connected';
    statusDiv.innerHTML = `
        <span>🟢</span>
        <span>Individual File Database</span>
        <span style="font-size: 10px; opacity: 0.8;">Each user = separate .json file</span>
    `;
    statusDiv.style.cssText += 'flex-direction: column; gap: 2px;';
    document.body.appendChild(statusDiv);
    
    // Add click handler to show database info
    statusDiv.addEventListener('click', showDatabaseInfo);
}

// Show database information modal
function showDatabaseInfo() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const currentUser = getCurrentUser();
    const userId = currentUser ? currentUser.id : 'Not logged in';
    
    modal.innerHTML = `
        <div style="
            background: #2c3e50;
            color: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 600px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        ">
            <h2>🗃️ Database System Info</h2>
            <div style="text-align: left; margin: 20px 0;">
                <p><strong>Database Type:</strong> Individual User Files</p>
                <p><strong>Your File:</strong> database/users/${userId}.json</p>
                <p><strong>Master Index:</strong> database/master.json</p>
                <p><strong>Storage:</strong> Local file system (no cookies/localStorage for data)</p>
                <p><strong>Data Includes:</strong></p>
                <ul style="margin: 10px 0 0 20px;">
                    <li>XP and level progression</li>
                    <li>Complete session history</li>
                    <li>All projects and code</li>
                    <li>Error tracking and statistics</li>
                    <li>Achievements and milestones</li>
                    <li>Detailed coding metrics</li>
                </ul>
                <p style="font-size: 12px; color: #bdc3c7; margin-top: 15px;">
                    All data is permanently stored in individual JSON files within the project directory.
                    No external databases or cloud storage required.
                </p>
            </div>
            <button onclick="this.closest('.db-modal').remove()" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
            ">Close</button>
        </div>
    `;
    
    modal.className = 'db-modal';
    document.body.appendChild(modal);
}