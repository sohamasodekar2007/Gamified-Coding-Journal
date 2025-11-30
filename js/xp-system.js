// XP and Gamification System

// XP values for different actions
const XP_VALUES = {
    RUN_CODE: 10,
    SAVE_PROJECT: 25,
    LOAD_PROJECT: 5,
    FIRST_HTML: 50,
    FIRST_CSS: 50,
    FIRST_JS: 50,
    DAILY_LOGIN: 20,
    STREAK_BONUS: 10,
    COMPLETE_PROJECT: 100,
    CODE_LENGTH_BONUS: 1 // 1 XP per 10 lines of code
};

// Level thresholds
const LEVEL_THRESHOLDS = [
    0,     // Level 1
    100,   // Level 2
    250,   // Level 3
    450,   // Level 4
    700,   // Level 5
    1000,  // Level 6
    1400,  // Level 7
    1900,  // Level 8
    2500,  // Level 9
    3200,  // Level 10
    4000   // Level 11+
];

function awardXP(amount, message) {
    const currentUser = getCurrentUser();
    const oldXP = currentUser.xp || 0;
    const oldLevel = currentUser.level || 1;
    
    // Add XP
    currentUser.xp = oldXP + amount;
    
    // Calculate new level
    const newLevel = calculateLevel(currentUser.xp);
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
        currentUser.level = newLevel;
        showXPNotification(`🎉 LEVEL UP! You're now level ${newLevel}! (+${amount} XP)`);
        playLevelUpAnimation();
    } else {
        showXPNotification(message + ` (+${amount} XP)`);
    }
    
    // Update user data
    updateCurrentUser(currentUser);
    updateUserStats();
    
    // Track XP in xp_users.json
    updateXpUsersData(currentUser.id, currentUser.username, amount, message);
    
    // Check for achievements
    checkAchievements(currentUser);
}

function calculateLevel(xp) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
}

function updateUserStats() {
    const currentUser = getCurrentUser();
    document.getElementById('userXP').textContent = currentUser.xp || 0;
    document.getElementById('userLevel').textContent = currentUser.level || 1;
    
    // Update progress bar if it exists
    updateProgressBar(currentUser.xp, currentUser.level);
}

function updateProgressBar(xp, level) {
    // Create progress bar if it doesn't exist
    if (!document.getElementById('progressBar')) {
        const xpContainer = document.querySelector('.xp-container');
        const progressBarHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div id="progressBar" class="progress-fill"></div>
                </div>
                <span id="progressText">0 / 0</span>
            </div>
        `;
        xpContainer.insertAdjacentHTML('beforeend', progressBarHTML);
        
        // Add CSS for progress bar
        if (!document.getElementById('progressBarStyles')) {
            const style = document.createElement('style');
            style.id = 'progressBarStyles';
            style.textContent = `
                .progress-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 5px;
                }
                .progress-bar {
                    width: 150px;
                    height: 8px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #2ed573, #17c0eb);
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }
                #progressText {
                    font-size: 12px;
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextLevelXP = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const progressXP = xp - currentLevelXP;
    const totalXPNeeded = nextLevelXP - currentLevelXP;
    const progressPercentage = (progressXP / totalXPNeeded) * 100;
    
    document.getElementById('progressBar').style.width = `${Math.min(progressPercentage, 100)}%`;
    document.getElementById('progressText').textContent = `${progressXP} / ${totalXPNeeded}`;
}

function showXPNotification(message) {
    const notification = document.getElementById('xpNotification');
    const messageSpan = document.getElementById('xpMessage');
    
    messageSpan.textContent = message;
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function playLevelUpAnimation() {
    // Create temporary level up overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
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
        animation: fadeIn 0.5s ease;
    `;
    
    overlay.innerHTML = `
        <div style="
            text-align: center;
            color: white;
            font-size: 4rem;
            animation: bounce 1s ease;
        ">
            🎉 LEVEL UP! 🎉
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Remove after 2 seconds
    setTimeout(() => {
        overlay.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 500);
    }, 2000);
    
    // Add bounce animation
    if (!document.getElementById('levelUpStyles')) {
        const style = document.createElement('style');
        style.id = 'levelUpStyles';
        style.textContent = `
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-30px); }
                60% { transform: translateY(-15px); }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function checkAchievements(user) {
    // Check for first-time achievements
    if (!user.achievements) {
        user.achievements = [];
    }
    
    // First HTML code
    if (document.getElementById('htmlEditor').value.length > 0 && !user.achievements.includes('FIRST_HTML')) {
        user.achievements.push('FIRST_HTML');
        awardXP(XP_VALUES.FIRST_HTML, '🎨 First HTML code written!');
    }
    
    // First CSS code
    if (document.getElementById('cssEditor').value.length > 0 && !user.achievements.includes('FIRST_CSS')) {
        user.achievements.push('FIRST_CSS');
        awardXP(XP_VALUES.FIRST_CSS, '💅 First CSS styles added!');
    }
    
    // First JavaScript code
    if (document.getElementById('jsEditor').value.length > 0 && !user.achievements.includes('FIRST_JS')) {
        user.achievements.push('FIRST_JS');
        awardXP(XP_VALUES.FIRST_JS, '⚡ First JavaScript code executed!');
    }
    
    // Project milestones
    const projectCount = user.projects?.length || 0;
    if (projectCount >= 5 && !user.achievements.includes('FIVE_PROJECTS')) {
        user.achievements.push('FIVE_PROJECTS');
        awardXP(50, '🏆 Five projects completed!');
    }
    
    if (projectCount >= 10 && !user.achievements.includes('TEN_PROJECTS')) {
        user.achievements.push('TEN_PROJECTS');
        awardXP(100, '🌟 Ten projects completed!');
    }
}

function getCodeLineBonus() {
    const htmlLines = document.getElementById('htmlEditor').value.split('\n').filter(line => line.trim()).length;
    const cssLines = document.getElementById('cssEditor').value.split('\n').filter(line => line.trim()).length;
    const jsLines = document.getElementById('jsEditor').value.split('\n').filter(line => line.trim()).length;
    
    const totalLines = htmlLines + cssLines + jsLines;
    return Math.floor(totalLines / 10) * XP_VALUES.CODE_LENGTH_BONUS;
}

// Daily login bonus
function checkDailyLogin() {
    const currentUser = getCurrentUser();
    const today = new Date().toDateString();
    
    if (!currentUser.lastLoginDate || currentUser.lastLoginDate !== today) {
        currentUser.lastLoginDate = today;
        awardXP(XP_VALUES.DAILY_LOGIN, '🌅 Daily login bonus!');
        updateCurrentUser(currentUser);
    }
}