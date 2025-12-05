/* editor.js — Modernized (Option C)
   Preserves original structure & public functions, but:
   - Uses ES6+ syntax (const/let, arrow functions)
   - Better error handling and consistent logging
   - Debounced auto-run using requestIdleCallback when available
   - Cleaner formatting utilities
   - Reduced duplicated code
*/

/* ---------------------------
   Module-level state
   --------------------------- */
   let currentTab = 'html';
   let consoleOpen = false;
   let responsiveMode = 'desktop';
   let autoRunEnabled = true;
   let debounceTimer = null;
   let isRunning = false;
   
   /* ----- Utilities ----- */
   const qs = (sel, ctx = document) => ctx.querySelector(sel);
   const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
   const safe = (fn) => (...args) => { try { return fn(...args); } catch (e) { console.error(e); } };
   
   /* ----- Logging helpers (used internally) ----- */
   const updatePreviewStatus = (status, type = 'success') => {
     try {
       const el = qs('#previewStatus');
       if (!el) return;
       el.textContent = status;
       el.className = `preview-status ${type}`;
       const colors = { success: '#48bb78', warning: '#ed8936', error: '#f56565', info: '#4299e1' };
       el.style.background = colors[type] || colors.success;
     } catch (error) {
       console.error('updatePreviewStatus error:', error);
     }
   };
   
   const addConsoleLog = (message, type = 'info') => {
     try {
       const consoleOutput = qs('#consoleOutput');
       if (!consoleOutput) return;
       const logLine = document.createElement('div');
       logLine.className = `console-line ${type}`;
       const timestamp = new Date().toLocaleTimeString();
       logLine.innerHTML = `<span style="opacity:0.7">[${timestamp}]</span> ${message}`;
       consoleOutput.appendChild(logLine);
       consoleOutput.scrollTop = consoleOutput.scrollHeight;
       // Keep last 50 logs
       const logs = consoleOutput.querySelectorAll('.console-line');
       if (logs.length > 50) logs[0].remove();
     } catch (err) {
       console.error('addConsoleLog error:', err);
     }
   };
   
   /* ---------------------------
      Editor UI / Tab handling
      --------------------------- */
   function switchTab(tab) {
     try {
       qsa('.tab-btn').forEach(btn => btn.classList.remove('active'));
       qsa('.editor').forEach(ed => ed.classList.remove('active'));
   
       const btn = qs(`button[onclick="switchTab('${tab}')"]`);
       const editor = qs(`#${tab}Editor`);
       if (btn) btn.classList.add('active');
       if (editor) editor.classList.add('active');
   
       currentTab = tab;
       updateEditorStats();
       updateLineNumbers();
   
       setTimeout(() => {
         const activeEditor = qs(`#${currentTab}Editor`);
         if (activeEditor) activeEditor.focus();
       }, 100);
     } catch (error) {
       console.error('switchTab error:', error);
     }
   }
   
   /* ---------------------------
      Editor stats & line numbers
      --------------------------- */
   function updateEditorStats() {
     try {
       const activeEditor = qs(`#${currentTab}Editor`);
       if (!activeEditor) return;
       const content = activeEditor.value || '';
       const lines = content.split('\n').length;
       const chars = content.length;
   
       const lineCountEl = qs('#lineCount');
       const charCountEl = qs('#charCount');
       if (lineCountEl) lineCountEl.textContent = `Lines: ${lines}`;
       if (charCountEl) charCountEl.textContent = `Chars: ${chars}`;
   
       updateLineNumbers();
   
       // Debounced auto-run
       if (autoRunEnabled && !isRunning) {
         if (debounceTimer) clearTimeout(debounceTimer);
         debounceTimer = setTimeout(() => {
           // Prefer requestIdleCallback when available to avoid blocking
           if ('requestIdleCallback' in window) {
             requestIdleCallback(runCodeRealtime, { timeout: 500 });
           } else {
             runCodeRealtime();
           }
         }, 500);
       }
     } catch (error) {
       console.error('updateEditorStats error:', error);
     }
   }
   
   function updateLineNumbers() {
     try {
       const activeEditor = qs(`#${currentTab}Editor`);
       const lineNumbers = qs('#lineNumbers');
       if (!activeEditor || !lineNumbers) return;
   
       const lines = Math.max(activeEditor.value.split('\n').length, 20);
       let html = '';
       for (let i = 1; i <= lines; i++) html += `${i}\n`;
       lineNumbers.textContent = html.trim();
   
       // Sync scroll
       activeEditor.onscroll = () => { lineNumbers.scrollTop = activeEditor.scrollTop; };
     } catch (error) {
       console.error('updateLineNumbers error:', error);
     }
   }
   
   /* ---------------------------
      Real-time compilation & preview
      --------------------------- */
   function runCodeRealtime() {
     if (isRunning) return;
     try {
       isRunning = true;
   
       const htmlCode = (qs('#htmlEditor')?.value) || '';
       const cssCode = (qs('#cssEditor')?.value) || '';
       const jsCode = (qs('#jsEditor')?.value) || '';
   
       const preview = qs('#preview');
       if (!preview) {
         console.warn('No preview element found');
         isRunning = false;
         return;
       }
   
       // Show empty state if nothing to render
       if (!htmlCode.trim() && !cssCode.trim() && !jsCode.trim()) {
         preview.srcdoc = `
           <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#666;flex-direction:column;background:#f8f9fa;">
             <div style="font-size:48px;margin-bottom:20px;">🎨</div>
             <h3 style="margin:0 0 10px 0;">Start coding to see live preview!</h3>
             <p style="margin:0;opacity:0.7;">Write HTML, CSS, or JavaScript code to see instant results.</p>
           </div>`;
         updatePreviewStatus('Ready', 'info');
         isRunning = false;
         return;
       }
   
       updatePreviewStatus('Compiling...', 'warning');
   
       const fullHTML = buildPreviewDocument({ html: htmlCode, css: cssCode, js: jsCode });
   
       // Apply to iframe
       preview.srcdoc = fullHTML;
   
       // Small delay to give iframe time to initialize before marking running
       setTimeout(() => {
         updatePreviewStatus('Running', 'success');
         isRunning = false;
       }, 200);
   
     } catch (error) {
       console.error('runCodeRealtime error:', error);
       updatePreviewStatus('Error', 'error');
       addConsoleLog(`❌ Compilation error: ${error.message}`, 'error');
       isRunning = false;
     }
   }
   
   /* Helper: Creates the full HTML for iframe srcdoc with safe console forwarding */
   function buildPreviewDocument({ html = '', css = '', js = '' } = {}) {
     // Ensure JS is wrapped to avoid breaking the wrapper
     const hasJS = Boolean(js.trim());
     // Escape script end sequences if present in user code (best-effort)
     const safeJS = js.replace(/<\/script>/gi, '<\\/script>');
   
     return `<!doctype html>
   <html lang="en">
   <head>
   <meta charset="utf-8" />
   <meta name="viewport" content="width=device-width,initial-scale=1" />
   <title>Live Preview</title>
   <style>
   * { box-sizing: border-box; }
   body { margin:0; padding:20px; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height:1.6; }
   ${css}
   </style>
   </head>
   <body>
   ${html}
   <script>
   (function(){
     try {
       // Intercept console and errors and forward to parent safely
       if (window.parent && window.parent.postMessage) {
         ['log','info','warn','error'].forEach(level => {
           const orig = console[level] || console.log;
           console[level] = function(...args) {
             try { window.parent.postMessage({ type:'console', level, message: args.join(' ') }, '*'); } catch(e){}
             orig.apply(console, args);
           }
         });
         window.addEventListener('error', function(e){
           try { window.parent.postMessage({ type:'console', level:'error', message:'Error: ' + e.message + ' (line ' + e.lineno + ')' }, '*'); } catch(e){}
         });
       }
   
       // Execute user JS
       try {
         ${safeJS}
         if (${JSON.stringify(hasJS)}) {
           if (window.parent && window.parent.postMessage) {
             window.parent.postMessage({ type:'console', level:'success', message:'✅ JavaScript executed successfully' }, '*');
           }
         }
       } catch (err) {
         console.error('JavaScript Error:', err.message || err);
       }
   
     } catch (err) {
       console.error('Preview wrapper error:', err);
     }
   })();
   <\/script>
   </body>
   </html>`;
   }
   
   /* ---------------------------
      Manual run / preview popup
      --------------------------- */
   function runCode() {
     try {
       addConsoleLog('🚀 Running code manually...', 'info');
       runCodeRealtime();
       if (typeof awardXP === 'function') awardXP(10, 'Code executed successfully! 🚀');
     } catch (error) {
       console.error('runCode error:', error);
       addConsoleLog(`❌ Error running code: ${error.message}`, 'error');
     }
   }
   
   function playPreview() {
     try {
       const htmlCode = (qs('#htmlEditor')?.value) || '';
       const cssCode = (qs('#cssEditor')?.value) || '';
       const jsCode = (qs('#jsEditor')?.value) || '';
   
       if (!htmlCode.trim() && !cssCode.trim() && !jsCode.trim()) {
         alert('Please write some code before opening preview!');
         return;
       }
   
       updatePreviewStatus('Opening preview...', 'warning');
       addConsoleLog('▶️ Opening preview window...', 'info');
   
       const popupHTML = createPopupHtml({ html: htmlCode, css: cssCode, js: jsCode });
   
       const popup = window.open('', 'codePreview', 'width=1200,height=800,resizable=yes,scrollbars=yes');
       if (popup) {
         popup.document.open();
         popup.document.write(popupHTML);
         popup.document.close();
         popup.focus();
   
         updatePreviewStatus('Preview opened', 'success');
         addConsoleLog('✅ Preview window opened successfully', 'success');
         if (typeof awardXP === 'function') awardXP(15, 'Preview opened in new window! ▶️');
       } else {
         alert('Popup blocked! Please allow popups for this site and try again.');
         updatePreviewStatus('Popup blocked', 'error');
         addConsoleLog('❌ Popup window blocked by browser', 'error');
       }
     } catch (error) {
       console.error('playPreview error:', error);
       addConsoleLog(`❌ Error opening preview: ${error.message}`, 'error');
       updatePreviewStatus('Error', 'error');
     }
   }
   
   /* Helper: Builds popup HTML (very similar to iframe document) */
   function createPopupHtml({ html = '', css = '', js = '' } = {}) {
     const safeJS = js.replace(/<\/script>/gi, '<\\/script>');
     return `<!doctype html>
   <html lang="en">
   <head>
   <meta charset="utf-8" />
   <meta name="viewport" content="width=device-width,initial-scale=1" />
   <title>Live Preview - Gamified Coding Journal</title>
   <style>
   body { margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
   .preview-toolbar {
     background: linear-gradient(135deg,#667eea,#764ba2);
     color:#fff; padding:12px 20px; font-size:14px; position:fixed; top:0; left:0; right:0; z-index:10000;
     box-shadow:0 2px 10px rgba(0,0,0,0.3); display:flex; justify-content:space-between; align-items:center;
   }
   .preview-content { margin-top:54px; padding:20px; min-height:calc(100vh - 54px); }
   .preview-btn { background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); color:white; padding:6px 12px; border-radius:4px; cursor:pointer; }
   .preview-btn:hover { transform:translateY(-1px); }
   ${css}
   </style>
   </head>
   <body>
   <div class="preview-toolbar">
     <div class="preview-info">🎮 Gamified Coding Journal <span style="opacity:0.8; font-size:12px; margin-left:12px;">Live Preview | F5 to refresh</span></div>
     <div class="preview-controls">
       <button class="preview-btn" onclick="window.print()">🖨️ Print</button>
       <button class="preview-btn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
       <button class="preview-btn" onclick="window.close()">✕ Close</button>
     </div>
   </div>
   <div class="preview-content">
   ${html}
   </div>
   
   <script>
   function toggleFullscreen(){
     if (document.fullscreenElement) document.exitFullscreen();
     else document.documentElement.requestFullscreen().catch(()=>alert('Fullscreen not supported'));
   }
   
   // Error handler toast
   window.addEventListener('error', function(e) {
     const d = document.createElement('div');
     d.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#ff4757;color:#fff;padding:15px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.3);max-width:400px;z-index:10001;font-family:monospace;font-size:12px;';
     d.innerHTML = '<strong>❌ JavaScript Error:</strong><br>' + (e.message || e);
     document.body.appendChild(d);
     setTimeout(()=>d.remove(), 5000);
   });
   
   try {
     ${safeJS}
   } catch (err) {
     console.error('JavaScript Error:', err);
   }
   <\/script>
   </body>
   </html>`;
   }
   
   /* ---------------------------
      Refresh / Fullscreen / Responsive
      --------------------------- */
   function refreshPreview() {
     try {
       addConsoleLog('🔄 Refreshing preview...', 'info');
       runCodeRealtime();
       if (typeof awardXP === 'function') awardXP(5, 'Preview refreshed! 🔄');
     } catch (error) {
       console.error('refreshPreview error:', error);
       addConsoleLog(`❌ Error refreshing preview: ${error.message}`, 'error');
     }
   }
   
   function toggleFullscreen() {
     try {
       const previewFrame = qs('#preview');
       if (!previewFrame) return;
       if (document.fullscreenElement) {
         document.exitFullscreen();
         addConsoleLog('🖼️ Exited fullscreen mode', 'info');
       } else {
         previewFrame.requestFullscreen().catch(err => addConsoleLog(`❌ Fullscreen error: ${err.message}`, 'error'));
         addConsoleLog('🖼️ Entered fullscreen mode', 'info');
       }
     } catch (error) {
       console.error('toggleFullscreen error:', error);
     }
   }
   
   function toggleResponsiveMode() {
     try {
       const deviceFrame = qs('#deviceFrame');
       const responsiveBtn = qs('#responsiveBtn');
       if (!deviceFrame || !responsiveBtn) return;
   
       const modes = ['desktop', 'tablet', 'mobile'];
       const idx = (modes.indexOf(responsiveMode) + 1) % modes.length;
       responsiveMode = modes[idx];
   
       deviceFrame.classList.remove(...modes);
       deviceFrame.classList.add(responsiveMode);
   
       const icons = { desktop: '🖥️', tablet: '📱', mobile: '📱' };
       const iconEl = responsiveBtn.querySelector('.icon');
       if (iconEl) iconEl.textContent = icons[responsiveMode] || '📱';
   
       const deviceUrl = qs('.device-url');
       if (deviceUrl) deviceUrl.textContent = `localhost:3000/preview - ${responsiveMode}`;
   
       addConsoleLog(`📱 Switched to ${responsiveMode} mode`, 'info');
       if (typeof awardXP === 'function') awardXP(3, `Responsive mode: ${responsiveMode}! 📱`);
     } catch (error) {
       console.error('toggleResponsiveMode error:', error);
     }
   }
   
   /* ---------------------------
      Console toggle & formatting
      --------------------------- */
   function toggleConsole() {
     try {
       const consoleOutput = qs('#consoleOutput');
       const toggleIcon = qs('#consoleToggleIcon');
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
       console.error('toggleConsole error:', error);
     }
   }
   
   function formatCode() {
     try {
       const activeEditor = qs(`#${currentTab}Editor`);
       if (!activeEditor) return;
   
       const code = activeEditor.value || '';
       if (!code.trim()) {
         addConsoleLog('⚠️ No code to format', 'warning');
         return;
       }
   
       let formatted = '';
       if (currentTab === 'html') formatted = formatHTML(code);
       else if (currentTab === 'css') formatted = formatCSS(code);
       else if (currentTab === 'js') formatted = formatJS(code);
   
       activeEditor.value = formatted;
       updateEditorStats();
       addConsoleLog(`✨ ${currentTab.toUpperCase()} code formatted`, 'success');
       if (typeof awardXP === 'function') awardXP(5, 'Code formatted! ✨');
     } catch (error) {
       console.error('formatCode error:', error);
       addConsoleLog(`❌ Error formatting ${currentTab.toUpperCase()} code: ${error.message}`, 'error');
     }
   }
   
   /* Formatting helpers — simple, safe, deterministic */
   function formatHTML(html) {
     try {
       let formatted = html.replace(/></g, '>\n<').replace(/\n\s*\n/g, '\n');
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
       return lines
         .map((ln) => {
           const trimmed = ln.trim();
           if (!trimmed) return '';
           if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith('</')) indentLevel = Math.max(0, indentLevel - 1);
           const line = ' '.repeat(indentLevel * indentSize) + trimmed;
           if ((trimmed.includes('<') && !trimmed.includes('</') && !trimmed.endsWith('/>')) || trimmed.endsWith('{') || trimmed.endsWith('[')) indentLevel++;
           return line;
         })
         .join('\n');
     } catch (error) {
       throw new Error('Indentation formatting failed: ' + error.message);
     }
   }
   
   /* ---------------------------
      Projects: Save / Load / Generate compiled
      --------------------------- */
   function saveProject() {
     try {
       const currentUser = getCurrentUser && getCurrentUser();
       if (!currentUser) {
         alert('Please login first');
         return;
       }
   
       const htmlCode = (qs('#htmlEditor')?.value) || '';
       const cssCode = (qs('#cssEditor')?.value) || '';
       const jsCode = (qs('#jsEditor')?.value) || '';
   
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
   
       currentUser.projects = currentUser.projects || [];
       currentUser.projects.unshift(project);
       updateCurrentUser && updateCurrentUser(currentUser);
   
       // Build compiled package for persistence if helper exists
       const compiledCode = {
         projects: currentUser.projects.map(proj => ({
           id: proj.id,
           name: proj.name,
           compiledHtml: generateCompiledHtml(proj),
           sourceCode: { html: proj.html, css: proj.css, js: proj.js },
           metadata: {
             created: proj.createdAt,
             lastModified: proj.lastModified,
             linesOfCode: {
               html: (proj.html || '').split('\n').filter(l => l.trim()).length,
               css: (proj.css || '').split('\n').filter(l => l.trim()).length,
               js: (proj.js || '').split('\n').filter(l => l.trim()).length
             }
           }
         }))
       };
   
       if (typeof saveUserCompiledCode === 'function' && currentUser.id) saveUserCompiledCode(currentUser.id, compiledCode);
       if (typeof updateUsersJsonFile === 'function') updateUsersJsonFile();
   
       loadProjects();
   
       if (typeof awardXP === 'function') awardXP(25, `Project "${projectName}" saved! 💾`);
       addConsoleLog(`💾 Project "${projectName}" saved successfully`, 'success');
       alert('Project saved successfully!');
     } catch (error) {
       console.error('saveProject error:', error);
       addConsoleLog(`❌ Error saving project: ${error.message}`, 'error');
     }
   }
   
   function loadProjects() {
     try {
       const currentUser = getCurrentUser && getCurrentUser();
       const projectsList = qs('#projectsList');
       if (!projectsList) return;
       if (!currentUser || !currentUser.projects || currentUser.projects.length === 0) {
         projectsList.innerHTML = '<p style="color:#666;text-align:center;">No projects yet. Create your first project!</p>';
         return;
       }
   
       projectsList.innerHTML = currentUser.projects.map(project => `
         <div class="project-card" onclick="loadProject('${project.id}')">
           <h4>${escapeHtml(project.name)}</h4>
           <p>Created: ${new Date(project.createdAt).toLocaleDateString()}</p>
           <p>Last modified: ${new Date(project.lastModified).toLocaleDateString()}</p>
         </div>`).join('');
     } catch (error) {
       console.error('loadProjects error:', error);
     }
   }
   
   function loadProject(projectId) {
     try {
       const currentUser = getCurrentUser && getCurrentUser();
       if (!currentUser) return;
       const project = (currentUser.projects || []).find(p => p.id == projectId);
       if (!project) return;
   
       qs('#htmlEditor').value = project.html || '';
       qs('#cssEditor').value = project.css || '';
       qs('#jsEditor').value = project.js || '';
   
       updateEditorStats();
       setTimeout(() => runCodeRealtime(), 100);
   
       if (typeof awardXP === 'function') awardXP(5, `Project "${project.name}" loaded! 📂`);
       addConsoleLog(`📂 Project "${project.name}" loaded`, 'success');
     } catch (error) {
       console.error('loadProject error:', error);
       addConsoleLog(`❌ Error loading project: ${error.message}`, 'error');
     }
   }
   
   function clearEditor() {
     try {
       if (!confirm('Are you sure you want to clear all code? This cannot be undone.')) return;
       qs('#htmlEditor').value = '';
       qs('#cssEditor').value = '';
       qs('#jsEditor').value = '';
       updateEditorStats();
       setTimeout(() => runCodeRealtime(), 100);
       addConsoleLog('🗑️ All code cleared', 'info');
     } catch (error) {
       console.error('clearEditor error:', error);
     }
   }
   
   function generateCompiledHtml(project) {
     return `<!doctype html>
   <html lang="en">
   <head>
   <meta charset="utf-8" />
   <meta name="viewport" content="width=device-width,initial-scale=1" />
   <title>${escapeHtml(project.name || 'Compiled Project')}</title>
   <style>${project.css || ''}</style>
   </head>
   <body>${project.html || ''}
   <script>${project.js || ''}</script>
   </body>
   </html>`;
   }
   
   /* ---------------------------
      Messaging from iframe (console forwarding)
      --------------------------- */
   window.addEventListener('message', (event) => {
     try {
       const data = event.data || {};
       if (data.type === 'console') addConsoleLog(data.message, data.level || 'info');
     } catch (error) {
       console.error('message event handler error:', error);
     }
   });
   
   /* ---------------------------
      Keyboard shortcuts
      --------------------------- */
   document.addEventListener('keydown', (e) => {
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
       // Ctrl+1 / 2 / 3 to switch tabs
       if (e.ctrlKey && !e.shiftKey) {
         if (e.key === '1') { e.preventDefault(); switchTab('html'); }
         else if (e.key === '2') { e.preventDefault(); switchTab('css'); }
         else if (e.key === '3') { e.preventDefault(); switchTab('js'); }
       }
     } catch (error) {
       console.error('keydown handler error:', error);
     }
   });
   
   /* ---------------------------
      Small helpers (escape)
      --------------------------- */
   function escapeHtml(str = '') {
     return String(str)
       .replace(/&/g, '&amp;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#39;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;');
   }
   
   // Toggle Preview Panel for Full-Screen Coding
   function togglePreviewPanel() {
       const previewContainer = document.querySelector('.preview-container');
       const mainContent = document.querySelector('.main-content');
       const toggleBtn = document.getElementById('togglePreviewBtn');
       const icon = toggleBtn.querySelector('.icon');
       
       previewContainer.classList.toggle('collapsed');
       mainContent.classList.toggle('preview-collapsed');
       
       // Update button icon and tooltip
       if (previewContainer.classList.contains('collapsed')) {
           icon.textContent = '▶';
           toggleBtn.title = 'Expand Preview Panel';
       } else {
           icon.textContent = '◀';
           toggleBtn.title = 'Collapse Preview Panel';
       }
       
       // Save preference to localStorage
       const isCollapsed = previewContainer.classList.contains('collapsed');
       localStorage.setItem('previewCollapsed', isCollapsed);
   }
   
   // Restore preview panel state on page load
   function restorePreviewState() {
       const isCollapsed = localStorage.getItem('previewCollapsed') === 'true';
       if (isCollapsed) {
           togglePreviewPanel();
       }
   }
   
   // Call restore function when page loads
   window.addEventListener('DOMContentLoaded', restorePreviewState);
   
   /* ---------------------------
      Expose some functions globally (keeps original API)
      --------------------------- */
   window.switchTab = switchTab;
   window.updateEditorStats = updateEditorStats;
   window.updateLineNumbers = updateLineNumbers;
   window.updatePreviewStatus = updatePreviewStatus;
   window.addConsoleLog = addConsoleLog;
   window.runCodeRealtime = runCodeRealtime;
   window.runCode = runCode;
   window.playPreview = playPreview;
   window.refreshPreview = refreshPreview;
   window.toggleFullscreen = toggleFullscreen;
   window.toggleResponsiveMode = toggleResponsiveMode;
   window.toggleConsole = toggleConsole;
   window.formatCode = formatCode;
   window.saveProject = saveProject;
   window.loadProjects = loadProjects;
   window.loadProject = loadProject;
   window.clearEditor = clearEditor;
   window.generateCompiledHtml = generateCompiledHtml;
   window.togglePreviewPanel = togglePreviewPanel;
   
   /* End of editor.js */
