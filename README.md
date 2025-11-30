# Gamified-Coding-Journal
Gamified-Coding-Journal


# Gamified Coding Journal

A gamified coding journal application with XP system, project management, and user authentication. This web application allows users to write HTML, CSS, and JavaScript code in an interactive editor while earning XP points and tracking their progress.

## 🚀 Features

- **User Authentication**: Register and login system with individual user files
- **XP & Leveling System**: Earn XP for coding activities and level up
- **Live Code Editor**: Write HTML, CSS, and JavaScript with real-time preview
- **Session Tracking**: Track coding sessions with detailed statistics
- **Project Management**: Save and manage multiple coding projects
- **Error Tracking**: Monitor compilation errors and warnings
- **Detailed Statistics**: View comprehensive coding statistics and history
- **Leaderboard**: Compete with other users

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 14.x or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning the repository)

## 🛠️ Installation

### Step 1: Clone or Download the Repository

```bash
git clone <your-repository-url>
cd Gamified-Coding-Journal
```

Or download and extract the ZIP file, then navigate to the project directory.

### Step 2: Install Required NPM Packages

Run the following command in the project root directory:

```bash
npm install
```

This will install all required dependencies:
- **express** (v4.21.2 or higher) - Web framework for Node.js
- **cors** (v2.8.5 or higher) - Enable Cross-Origin Resource Sharing
- **nodemon** (v3.0.1 or higher, dev dependency) - Auto-restart server on file changes

### Step 3: Create Required Directories

The application requires certain directories to exist. Run these commands:

**For Windows:**
```bash
mkdir database\users
```

**For Linux/Mac:**
```bash
mkdir -p database/users
```

### Step 4: Initialize Database Files

Create the master database file:

**For Windows:**
```bash
echo {} > database\master.json
echo {} > database\users.json
```

**For Linux/Mac:**
```bash
echo "{}" > database/master.json
echo "{}" > database/users.json
```

## 🚀 Running the Application

### Development Mode (with auto-restart)

```bash
npm run dev
```

This uses nodemon to automatically restart the server when you make changes.

### Production Mode

```bash
npm start
```

Or directly:

```bash
node server.js
```

The server will start on **http://localhost:3000**

## 📂 Project Structure

```
Gamified-Coding-Journal/
├── server.js              # Main server file with API endpoints
├── index.html             # Main HTML page
├── package.json           # NPM dependencies and scripts
├── database.js            # Database configuration (if exists)
├── css/
│   └── styles.css         # Application styles
├── js/
│   ├── main.js           # Main application logic
│   ├── editor.js         # Code editor functionality
│   ├── auth.js           # Authentication logic
│   └── xp-system.js      # XP and leveling system
├── database/
│   ├── master.json       # Master database file
│   ├── users.json        # Users index file
│   ├── userDatabase.js   # User database operations
│   └── users/            # Individual user data files
└── data/                 # Additional data storage
```

## 🔧 Configuration

### Port Configuration

By default, the server runs on port **3000**. To change this, modify the `PORT` constant in `server.js`:

```javascript
const PORT = 3000; // Change to your desired port
```

### CORS Configuration

CORS is enabled for all origins by default. To restrict origins, modify the CORS middleware in `server.js`:

```javascript
app.use(cors({
  origin: 'http://yourdomain.com'
}));
```

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login existing user

### Coding Sessions
- `POST /api/start-session` - Start a coding session
- `POST /api/end-session` - End a coding session

### Code Execution
- `POST /api/run-code` - Execute code and award XP
- `POST /api/code-error` - Handle code errors

### Projects
- `POST /api/save-project` - Save a coding project
- `GET /api/user-projects/:userId` - Get user's projects

### Statistics
- `GET /api/user-stats/:userId` - Get user statistics

## 🎮 Usage

1. **Open the Application**: Navigate to `http://localhost:3000` in your browser
2. **Register**: Create a new account to start earning XP
3. **Start Coding**: Write HTML, CSS, and JavaScript in the editor
4. **Run Code**: Execute your code to see results and earn XP
5. **Save Projects**: Save your work as projects
6. **Track Progress**: View your statistics and level up!

## 🐛 Troubleshooting

### Port Already in Use
If you get an "EADDRINUSE" error, the port is already in use. Either:
1. Stop the process using that port
2. Change the PORT in `server.js`

### Cannot Find Module
If you get module errors, run:
```bash
npm install
```

### Database Errors
Ensure the `database/users/` directory exists and has proper permissions.

## 📦 Dependencies

### Production Dependencies
```json
{
  "express": "^4.21.2",
  "cors": "^2.8.5"
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.0.1"
}
```

## 🔒 Security Notes

- **Passwords**: Currently stored as plain text. Consider implementing password hashing (bcrypt) for production.
- **Authentication**: No JWT or session tokens. Consider adding proper authentication for production.
- **Input Validation**: Add additional input validation and sanitization.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Happy Coding! 🎉**
