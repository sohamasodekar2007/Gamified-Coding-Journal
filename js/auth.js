// Authentication functions
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // Call the server API to register the user
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const result = await response.json();

        if (result.success) {
            // Save user to localStorage as well for offline access
            let users = JSON.parse(localStorage.getItem('codingJournalUsers') || '[]');
            
            // Remove any duplicate username from localStorage
            users = users.filter(u => u.username !== username);
            users.push(result.user);
            localStorage.setItem('codingJournalUsers', JSON.stringify(users));
            
            alert(result.message || 'Account created successfully! Please login.');
            showLogin();
            
            // Clear form
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
        } else {
            alert(result.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error connecting to server. Make sure the server is running on port 3000.');
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // Call the server API to login
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            // Store current user session
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            
            // Update users list in localStorage
            let users = JSON.parse(localStorage.getItem('codingJournalUsers') || '[]');
            const userIndex = users.findIndex(u => u.id === result.user.id);
            if (userIndex !== -1) {
                users[userIndex] = result.user;
            } else {
                users.push(result.user);
            }
            localStorage.setItem('codingJournalUsers', JSON.stringify(users));
            
            alert(result.message || 'Welcome back!');
            showMainApp();
        } else {
            alert(result.error || 'Invalid username or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        // Fallback to localStorage if server is not available
        const users = JSON.parse(localStorage.getItem('codingJournalUsers') || '[]');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            alert('Logged in with offline data (server not available)');
            showMainApp();
        } else {
            alert('Invalid username or password. Server is not available.');
        }
    }
    
    // Clear form
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function logout() {
    // Save data to server before logout
    exportUsersData();
    localStorage.removeItem('currentUser');
    showAuthScreen();
}

function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('mainScreen').style.display = 'none';
}

function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'block';
    
    // Load user data
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('currentUser').textContent = currentUser.username;
    updateUserStats();
    loadProjects();
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function updateCurrentUser(userData) {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Update the user in the users array
    let users = JSON.parse(localStorage.getItem('codingJournalUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === userData.id);
    if (userIndex !== -1) {
        users[userIndex] = userData;
        localStorage.setItem('codingJournalUsers', JSON.stringify(users));
        
        // Auto-export updated data every 5 actions (to avoid too many downloads)
        if (!window.updateCounter) window.updateCounter = 0;
        window.updateCounter++;
        if (window.updateCounter >= 5) {
            exportUsersData();
            window.updateCounter = 0;
        }
    }
}

// File-based data management functions
function exportUsersData() {
    const users = JSON.parse(localStorage.getItem('codingJournalUsers') || '[]');
    const dataToExport = {
        users: users,
        exportedAt: new Date().toISOString(),
        version: "1.0"
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "users.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    console.log('Users data exported to users.json');
}

function importUsersData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (importedData.users && Array.isArray(importedData.users)) {
                        // Merge with existing users or replace
                        const shouldReplace = confirm('Do you want to replace all existing users with imported data? Click Cancel to merge instead.');
                        
                        let users = shouldReplace ? [] : JSON.parse(localStorage.getItem('codingJournalUsers') || '[]');
                        
                        if (shouldReplace) {
                            users = importedData.users;
                        } else {
                            // Merge users, avoiding duplicates
                            importedData.users.forEach(importedUser => {
                                const existingUserIndex = users.findIndex(u => u.username === importedUser.username);
                                if (existingUserIndex === -1) {
                                    users.push(importedUser);
                                } else {
                                    // Update existing user if imported data is newer
                                    const existingUser = users[existingUserIndex];
                                    const importedDate = new Date(importedUser.lastLoginDate || importedUser.createdAt);
                                    const existingDate = new Date(existingUser.lastLoginDate || existingUser.createdAt);
                                    
                                    if (importedDate > existingDate) {
                                        users[existingUserIndex] = importedUser;
                                    }
                                }
                            });
                        }
                        
                        localStorage.setItem('codingJournalUsers', JSON.stringify(users));
                        alert(`Successfully imported ${importedData.users.length} users from users.json!`);
                        
                        // Refresh the page to reload data
                        location.reload();
                    } else {
                        alert('Invalid JSON format. Expected format: {"users": [...], ...}');
                    }
                } catch (error) {
                    alert('Error parsing JSON file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
        document.body.removeChild(fileInput);
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

function createBackup() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please login first');
        return;
    }
    
    const backupData = {
        user: currentUser,
        allUsers: JSON.parse(localStorage.getItem('codingJournalUsers') || '[]'),
        backupDate: new Date().toISOString(),
        version: "1.0"
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `backup_${currentUser.username}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    alert('Backup created successfully!');
}