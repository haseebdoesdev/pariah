# WilP2.0 - AI-Enhanced To-Do Application

A simple, ADHD-friendly to-do application that uses AI to break down projects into manageable tasks and subtasks.

## Features

- **AI-Powered Task Generation**: Describe your project and let Gemini AI break it down into actionable tasks and subtasks
- **Hierarchical Organization**: Projects contain tasks, tasks contain subtasks
- **Completion Tracking**: Simple checkbox interface with visual and audio feedback
- **Notes System**: Add personal notes to any task or subtask
- **ADHD-Friendly Design**: Dark theme, clear structure, immediate feedback for dopamine rewards

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env` file and add your Gemini API key
   - Get your API key from: https://makersuite.google.com/app/apikey
   - Make sure MongoDB is running on your system

3. **Start the application**:
   ```bash
   npm start
   ```

4. **Open your browser** and go to `http://localhost:3000`

## Usage

1. Click "New Project" to create a project
2. Enter a project title and detailed description
3. Click "Generate Tasks with AI" to let Gemini break it down
4. Check off tasks and subtasks as you complete them
5. Add personal notes to any item using the "Notes" button
6. View task details by clicking "Details"

## Project Structure

```
├── server.js              # Main server file
├── models/
│   └── Project.js         # MongoDB schema
├── routes/
│   ├── projects.js        # Project CRUD operations
│   └── ai.js             # AI task generation
└── public/
    ├── index.html        # Main page
    ├── style.css         # Dark theme styling
    └── app.js           # Frontend JavaScript
```

## Requirements

- Node.js
- MongoDB
- Gemini API key

## Environment Variables

- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/wilp2`)
- `GEMINI_API_KEY`: Your Google Gemini API key
- `PORT`: Server port (default: 3000)
