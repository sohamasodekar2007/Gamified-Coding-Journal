// Enhanced editor functionality with improved real-time compilation
let currentTab = 'html';
let consoleOpen = false;
let responsiveMode = 'desktop';
let autoRunEnabled = true;
let debounceTimer = null;
let isRunning = false;

function switchTab(tab) {
    // Remove active class from all tabs and editors
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.editor').forEach(editor => editor.classList.remove('active'));
    
    // Add active class to selected tab and editor
    document.querySelector(`button[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(`${tab}Editor`).classList.add('active');
    
    currentTab = tab;
    updateEditorStats();
    updateLineNumbers();
    
    // Focus the active editor
    setTimeout(() => {
        document.getElementById(`${currentTab}Editor`).focus();
    }, 100);
}

function updateEditorStats() {
    try {
        const activeEditor = document.getElementById(`${currentTab}Editor`);
        if (!activeEditor) return;
        
        const content = activeEditor.value || '';
        const lines = content.split('\n').length;
        const chars = content.length;
        
        const lineCountEl = document.getElementById('lineCount');
        const charCountEl = document.getElementById('charCount');
        
        if (lineCountEl) lineCountEl.textContent = `Lines: ${lines}`;
        if (charCountEl) charCountEl.textContent = `Chars: ${chars}`;
        
        updateLineNumbers();
        
        // Auto-run code if enabled and not currently running
        if (autoRunEnabled && !isRunning) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                runCodeRealtime();
            }, 500); // Increased delay to prevent hanging
        }
    } catch (error) {
        console.error('Error updating editor stats:', error);
    }
}

function updateLineNumbers() {
    try {
        const activeEditor = document.getElementById(`${currentTab}Editor`);
        const lineNumbers = document.getElementById('lineNumbers');
        
        if (!activeEditor || !lineNumbers) return;
        
        const lines = activeEditor.value.split('\n').length;
        let lineNumbersHtml = '';
        
        for (let i = 1; i <= Math.max(lines, 20); i++) {
            lineNumbersHtml += i + '\n';
        }
        
        lineNumbers.textContent = lineNumbersHtml.trim();
        
        // Sync scroll with editor
        activeEditor.onscroll = function() {
            lineNumbers.scrollTop = activeEditor.scrollTop;
        };
    } catch (error) {
        console.error('Error updating line numbers:', error);
    }
}

function updatePreviewStatus(status, type = 'success') {
    try {
        const statusElement = document.getElementById('previewStatus');
        if (!statusElement) return;
        
        statusElement.textContent = status;
        statusElement.className = `preview-status ${type}`;
        
        const colors = {
            success: '#48bb78',
            warning: '#ed8936',
            error: '#f56565',
            info: '#4299e1'
        };
        
        statusElement.style.background = colors[type] || colors.success;
    } catch (error) {
        console.error('Error updating preview status:', error);
    }
}

function addConsoleLog(message, type = 'info') {
    try {
        const consoleOutput = document.getElementById('consoleOutput');
        if (!consoleOutput) return;
        
        const logLine = document.createElement('div');
        logLine.className = `console-line ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        logLine.innerHTML = `<span style="opacity: 0.7;">[${timestamp}]</span> ${message}`;
        
        consoleOutput.appendChild(logLine);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
        
        // Keep only last 50 logs
        const logs = consoleOutput.querySelectorAll('.console-line');
        if (logs.length > 50) {
            logs[0].remove();
        }
    } catch (error) {
        console.error('Error adding console log:', error);
    }
}

function runCodeRealtime() {
    if (isRunning) return; // Prevent multiple simultaneous runs
    
    try {
        isRunning = true;
        
        const htmlCode = document.getElementById('htmlEditor').value || '';
        const cssCode = document.getElementById('cssEditor').value || '';
        const jsCode = document.getElementById('jsEditor').value || '';
        
        // Show empty state if no content
        if (!htmlCode.trim() && !cssCode.trim() && !jsCode.trim()) {
            const preview = document.getElementById('preview');
            if (preview) {
                preview.srcdoc = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; color: #666; flex-direction: column; background: #f8f9fa;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🎨</div>
                        <h3 style="margin: 0 0 10px 0;">Start coding to see live preview!</h3>
                        <p style="margin: 0; opacity: 0.7;">Write HTML, CSS, or JavaScript code to see instant results.</p>
                    </div>
                `;
            }
            updatePreviewStatus('Ready', 'info');
            isRunning = false;
            return;
        }
        
        updatePreviewStatus('Compiling...', 'warning');
        
        // Create safe HTML document
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
        (function() {
            try {
                // Safe console override
                if (window.parent && window.parent.postMessage) {
                    const originalLog = console.log;
                    const originalError = console.error;
                    
                    console.log = function(...args) {
                        originalLog.apply(console, args);
                        try {
                            window.parent.postMessage({
                                type: 'console',
                                level: 'info',
                                message: args.join(' ')
                            }, '*');
                        } catch(e) {}
                    };
                    
                    console.error = function(...args) {
                        originalError.apply(console, args);
                        try {
                            window.parent.postMessage({
                                type: 'console',
                                level: 'error',
                                message: args.join(' ')
                            }, '*');
                        } catch(e) {}
                    };
                    
                    // Global error handler
                    window.addEventListener('error', function(e) {
                        try {
                            window.parent.postMessage({
                                type: 'console',
                                level: 'error',
                                message: 'Error: ' + e.message + ' (line ' + e.lineno + ')'
                            }, '*');
                        } catch(err) {}
                    });
                }
                
                // Execute user JavaScript in try-catch
                ${jsCode}
                
                // Send success message if JS exists
                if (${JSON.stringify(jsCode.trim().length > 0)}) {
                    if (window.parent && window.parent.postMessage) {
                        window.parent.postMessage({
                            type: 'console',
                            level: 'success',
                            message: '✅ JavaScript executed successfully'
                        }, '*');
                    }
                }
                
            } catch(error) {
                console.error('JavaScript Error:', error.message);
            }
        })();
    </script>
</body>
</html>`;
        
        // Update preview safely
        const preview = document.getElementById('preview');
        if (preview) {
            preview.srcdoc = fullHTML;
        }
        
        setTimeout(() => {
            updatePreviewStatus('Running', 'success');
            isRunning = false;
        }, 200);
        
    } catch (error) {
        console.error('Error in runCodeRealtime:', error);
        updatePreviewStatus('Error', 'error');
        addConsoleLog(`❌ Compilation error: ${error.message}`, 'error');
        isRunning = false;
    }
}

function runCode() {
    try {
        addConsoleLog('🚀 Running code manually...', 'info');
        runCodeRealtime();
        
        // Award XP for manual run
        if (typeof awardXP === 'function') {
            awardXP(10, 'Code executed successfully! 🚀');
        }
    } catch (error) {
        console.error('Error in runCode:', error);
        addConsoleLog(`❌ Error running code: ${error.message}`, 'error');
    }
}

function playPreview() {
    try {
        const htmlCode = document.getElementById('htmlEditor').value || '';
        const cssCode = document.getElementById('cssEditor').value || '';
        const jsCode = document.getElementById('jsEditor').value || '';
        
        if (!htmlCode.trim() && !cssCode.trim() && !jsCode.trim()) {
            alert('Please write some code before opening preview!');
            return;
        }
        
        updatePreviewStatus('Opening preview...', 'warning');
        addConsoleLog('▶️ Opening preview window...', 'info');
        
        // Create enhanced HTML for popup
        const popupHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Preview - Gamified Coding Journal</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .preview-toolbar {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 12px 20px;
            font-size: 14px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .preview-info {
            display: flex;
            align-items: center;
            gap: 15px;
            font-weight: 500;
        }
        .preview-controls {
            display: flex;
            gap: 10px;
        }
        .preview-btn {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s;
        }
        .preview-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-1px);
        }
        .preview-content {
            margin-top: 50px;
            min-height: calc(100vh - 50px);
            padding: 20px;
        }
        ${cssCode}
    </style>
</head>
<body>
    <div class="preview-toolbar">
        <div class="preview-info">
            <span>🎮 Gamified Coding Journal</span>
            <span style="opacity: 0.8; font-size: 12px;">Live Preview | F5 to refresh</span>
        </div>
        <div class="preview-controls">
            <button class="preview-btn" onclick="window.print()">🖨️ Print</button>
            <button class="preview-btn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
            <button class="preview-btn" onclick="window.close()">✕ Close</button>
        </div>
    </div>
    <div class="preview-content">
        ${htmlCode}
    </div>
    
    <script>
        function toggleFullscreen() {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen().catch(err => {
                    alert('Fullscreen not supported');
                });
            }
        }
        
        // Error handler for popup
        window.addEventListener('error', function(e) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = \`
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #ff4757;
                color: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                max-width: 400px;
                z-index: 10001;
                font-family: monospace;
                font-size: 12px;
                line-height: 1.4;
            \`;
            errorDiv.innerHTML = '<strong>❌ JavaScript Error:</strong><br>' + e.message;
            document.body.appendChild(errorDiv);
            
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 5000);
        });
        
        // Execute user JavaScript
        try {
            ${jsCode}
        } catch(error) {
            console.error('JavaScript Error:', error);
        }
    </script>
</body>
</html>`;
        
        // Open popup with better error handling
        const popup = window.open('', 'codePreview', 'width=1200,height=800,resizable=yes,scrollbars=yes');
        
        if (popup) {
            popup.document.write(popupHTML);
            popup.document.close();
            popup.focus();
            
            updatePreviewStatus('Preview opened', 'success');
            addConsoleLog('✅ Preview window opened successfully', 'success');
            
            // Award XP
            if (typeof awardXP === 'function') {
                awardXP(15, 'Preview opened in new window! ▶️');
            }
        } else {
            alert('Popup blocked! Please allow popups for this site and try again.');
            updatePreviewStatus('Popup blocked', 'error');
            addConsoleLog('❌ Popup window blocked by browser', 'error');
        }
        
    } catch (error) {
        console.error('Error in playPreview:', error);
        addConsoleLog(`❌ Error opening preview: ${error.message}`, 'error');
        updatePreviewStatus('Error', 'error');
    }
}

function refreshPreview() {
    try {
        addConsoleLog('🔄 Refreshing preview...', 'info');
        runCodeRealtime();
        
        if (typeof awardXP === 'function') {
            awardXP(5, 'Preview refreshed! 🔄');
        }
    } catch (error) {
        console.error('Error refreshing preview:', error);
        addConsoleLog(`❌ Error refreshing preview: ${error.message}`, 'error');
    }
}

function toggleFullscreen() {
    try {
        const previewFrame = document.getElementById('preview');
        if (!previewFrame) return;
        
        if (document.fullscreenElement) {
            document.exitFullscreen();
            addConsoleLog('🖼️ Exited fullscreen mode', 'info');
        } else {
            previewFrame.requestFullscreen().catch(err => {
                addConsoleLog(`❌ Fullscreen error: ${err.message}`, 'error');
            });
            addConsoleLog('🖼️ Entered fullscreen mode', 'info');
        }
    } catch (error) {
        console.error('Error toggling fullscreen:', error);
    }
}

function toggleResponsiveMode() {
    try {
        const deviceFrame = document.getElementById('deviceFrame');
        const responsiveBtn = document.getElementById('responsiveBtn');
        
        if (!deviceFrame || !responsiveBtn) return;
        
        const modes = ['desktop', 'tablet', 'mobile'];
        const currentIndex = modes.indexOf(responsiveMode);
        responsiveMode = modes[(currentIndex + 1) % modes.length];
        
        // Remove all mode classes
        deviceFrame.classList.remove('desktop', 'tablet', 'mobile');
        deviceFrame.classList.add(responsiveMode);
        
        // Update button icon and device URL
        const icons = { desktop: '🖥️', tablet: '📱', mobile: '📱' };
        const iconElement = responsiveBtn.querySelector('.icon');
        if (iconElement) {
            iconElement.textContent = icons[responsiveMode];
        }
        
        const deviceUrl = document.querySelector('.device-url');
        if (deviceUrl) {
            deviceUrl.textContent = `localhost:3000/preview - ${responsiveMode}`;
        }
        
        addConsoleLog(`📱 Switched to ${responsiveMode} mode`, 'info');
        
        if (typeof awardXP === 'function') {
            awardXP(3, `Responsive mode: ${responsiveMode}! 📱`);
        }
    } catch (error) {
        console.error('Error toggling responsive mode:', error);
    }
}

function toggleConsole() {
    try {
        const consoleOutput = document.getElementById('consoleOutput');
        const toggleIcon = document.getElementById('consoleToggleIcon');
        
        if (!consoleOutput || !toggleIcon) return;
        
        consoleOpen = !consoleOpen;
        
        if (consoleOpen) {
            consoleOutput.classList.add('show');
            toggleIcon.textContent = '▼';
            addConsoleLog('📋 Console opened', 'info');
        } else {
            consoleOutput.classList.remove('show');
            toggleIcon.textContent = '▲';
        }
    } catch (error) {
        console.error('Error toggling console:', error);
    }
}

function formatCode() {
    try {
        const activeEditor = document.getElementById(`${currentTab}Editor`);
        if (!activeEditor) return;
        
        let code = activeEditor.value || '';
        
        if (!code.trim()) {
            addConsoleLog('⚠️ No code to format', 'warning');
            return;
        }
        
        let formatted = '';
        
        if (currentTab === 'html') {
            formatted = formatHTML(code);
        } else if (currentTab === 'css') {
            formatted = formatCSS(code);
        } else if (currentTab === 'js') {
            formatted = formatJS(code);
        }
        
        activeEditor.value = formatted;
        updateEditorStats();
        addConsoleLog(`✨ ${currentTab.toUpperCase()} code formatted`, 'success');
        
        if (typeof awardXP === 'function') {
            awardXP(5, 'Code formatted! ✨');
        }
    } catch (error) {
        console.error('Error formatting code:', error);
        addConsoleLog(`❌ Error formatting ${currentTab.toUpperCase()} code: ${error.message}`, 'error');
    }
}

function formatHTML(html) {
    try {
        let formatted = html
            .replace(/></g, '>\n<')
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n');
        
        return formatIndentation(formatted, 2);
    } catch (error) {
        throw new Error('HTML formatting failed: ' + error.message);
    }
}

function formatCSS(css) {
    try {
        let formatted = css
            .replace(/\s*{\s*/g, ' {\n')
            .replace(/;\s*/g, ';\n')
            .replace(/\s*}\s*/g, '\n}\n')
            .replace(/,\s*/g, ',\n')
            .replace(/\n\s*\n/g, '\n');
        
        return formatIndentation(formatted, 2);
    } catch (error) {
        throw new Error('CSS formatting failed: ' + error.message);
    }
}

function formatJS(js) {
    try {
        let formatted = js
            .replace(/\s*{\s*/g, ' {\n')
            .replace(/;\s*/g, ';\n')
            .replace(/\s*}\s*/g, '\n}\n')
            .replace(/,\s*/g, ', ')
            .replace(/\n\s*\n/g, '\n');
        
        return formatIndentation(formatted, 2);
    } catch (error) {
        throw new Error('JavaScript formatting failed: ' + error.message);
    }
}

function formatIndentation(code, indentSize = 2) {
    try {
        const lines = code.split('\n');
        let indentLevel = 0;
        
        return lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            
            // Decrease indent for closing tags/brackets
            if (trimmed.includes('</') || trimmed.startsWith('}') || trimmed.startsWith(']')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            const formatted = ' '.repeat(indentLevel * indentSize) + trimmed;
            
            // Increase indent for opening tags/brackets
            if ((trimmed.includes('<') && !trimmed.includes('</') && !trimmed.endsWith('/>')) || 
                trimmed.endsWith('{') || trimmed.endsWith('[')) {
                indentLevel++;
            }
            
            return formatted;
        }).join('\n');
    } catch (error) {
        throw new Error('Indentation formatting failed: ' + error.message);
    }
}

function saveProject() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('Please login first');
            return;
        }
        
        const htmlCode = document.getElementById('htmlEditor').value || '';
        const cssCode = document.getElementById('cssEditor').value || '';
        const jsCode = document.getElementById('jsEditor').value || '';
        
        if (!htmlCode.trim() && !cssCode.trim() && !jsCode.trim()) {
            alert('Please write some code before saving!');
            return;
        }
        
        const projectName = prompt('Enter a name for your project:');
        if (!projectName) return;
        
        const project = {
            id: Date.now(),
            name: projectName,
            html: htmlCode,
            css: cssCode,
            js: jsCode,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Add project to user's projects
        currentUser.projects = currentUser.projects || [];
        currentUser.projects.unshift(project);
        
        // Update user data
        updateCurrentUser(currentUser);
        
        // Save compiled code
        const userProjects = currentUser.projects || [];
        const compiledCode = {
            projects: userProjects.map(proj => ({
                id: proj.id,
                name: proj.name,
                compiledHtml: generateCompiledHtml(proj),
                sourceCode: {
                    html: proj.html,
                    css: proj.css,
                    js: proj.js
                },
                metadata: {
                    created: proj.createdAt,
                    lastModified: proj.lastModified,
                    linesOfCode: {
                        html: (proj.html || '').split('\n').filter(line => line.trim()).length,
                        css: (proj.css || '').split('\n').filter(line => line.trim()).length,
                        js: (proj.js || '').split('\n').filter(line => line.trim()).length
                    }
                }
            }))
        };
        
        // Auto-save user's compiled code file
        if (typeof saveUserCompiledCode === 'function') {
            saveUserCompiledCode(currentUser.id, compiledCode);
        }
        
        // Auto-update users.json
        if (typeof updateUsersJsonFile === 'function') {
            updateUsersJsonFile();
        }
        
        // Reload projects display
        loadProjects();
        
        // Award XP and log
        if (typeof awardXP === 'function') {
            awardXP(25, `Project "${projectName}" saved! 💾`);
        }
        addConsoleLog(`💾 Project "${projectName}" saved successfully`, 'success');
        
        alert('Project saved successfully!');
    } catch (error) {
        console.error('Error saving project:', error);
        addConsoleLog(`❌ Error saving project: ${error.message}`, 'error');
    }
}

function loadProjects() {
    try {
        const currentUser = getCurrentUser();
        const projectsList = document.getElementById('projectsList');
        
        if (!currentUser || !projectsList) return;
        
        if (!currentUser.projects || currentUser.projects.length === 0) {
            projectsList.innerHTML = '<p style="color: #666; text-align: center;">No projects yet. Create your first project!</p>';
            return;
        }
        
        projectsList.innerHTML = currentUser.projects.map(project => `
            <div class="project-card" onclick="loadProject('${project.id}')">
                <h4>${project.name}</h4>
                <p>Created: ${new Date(project.createdAt).toLocaleDateString()}</p>
                <p>Last modified: ${new Date(project.lastModified).toLocaleDateString()}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function loadProject(projectId) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        
        const project = currentUser.projects.find(p => p.id == projectId);
        
        if (project) {
            document.getElementById('htmlEditor').value = project.html || '';
            document.getElementById('cssEditor').value = project.css || '';
            document.getElementById('jsEditor').value = project.js || '';
            
            // Update editor stats and run code
            updateEditorStats();
            setTimeout(() => runCodeRealtime(), 100);
            
            // Award XP and log
            if (typeof awardXP === 'function') {
                awardXP(5, `Project "${project.name}" loaded! 📂`);
            }
            addConsoleLog(`📂 Project "${project.name}" loaded`, 'success');
        }
    } catch (error) {
        console.error('Error loading project:', error);
        addConsoleLog(`❌ Error loading project: ${error.message}`, 'error');
    }
}

function clearEditor() {
    try {
        if (confirm('Are you sure you want to clear all code? This cannot be undone.')) {
            document.getElementById('htmlEditor').value = '';
            document.getElementById('cssEditor').value = '';
            document.getElementById('jsEditor').value = '';
            
            // Update editor stats and clear preview
            updateEditorStats();
            setTimeout(() => runCodeRealtime(), 100);
            
            addConsoleLog('🗑️ All code cleared', 'info');
        }
    } catch (error) {
        console.error('Error clearing editor:', error);
    }
}

function generateCompiledHtml(project) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name || 'Compiled Project'}</title>
    <style>
        ${project.css || ''}
    </style>
</head>
<body>
    ${project.html || ''}
    <script>
        ${project.js || ''}
    </script>
</body>
</html>`;
}

// Listen for console messages from iframe
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'console') {
        addConsoleLog(event.data.message, event.data.level);
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    try {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveProject();
        }
        
        // Ctrl+Enter to run code
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
        
        // Ctrl+Shift+F to format code
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            formatCode();
        }
        
        // Tab switching shortcuts
        if (e.ctrlKey) {
            if (e.key === '1') {
                e.preventDefault();
                switchTab('html');
            } else if (e.key === '2') {
                e.preventDefault();
                switchTab('css');
            } else if (e.key === '3') {
                e.preventDefault();
                switchTab('js');
            }
        }
    } catch (error) {
        console.error('Error in keyboard shortcut handler:', error);
    }
});