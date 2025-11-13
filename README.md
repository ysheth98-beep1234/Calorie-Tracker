# Calorie Tracker 🍽️

A beautiful web application to track your meals and get instant calorie estimates. Simply describe what you ate for breakfast, lunch, or dinner, and the app will intelligently estimate the calorie content.

## Features

- 🔐 User authentication with User ID login
- 🎨 Modern, responsive UI with a chat-like interface
- 🍳 Support for breakfast, lunch, and dinner tracking
- 📊 Real-time calorie estimation using AI-powered food recognition
- 📈 Daily calorie statistics dashboard
- 💬 Interactive chat experience with meal breakdowns
- 👤 User session management with logout functionality

## File Structure

```
Calorie-Tracker/
├── index.html      # Main application page (protected)
├── login.html      # Login page
├── styles.css      # Main app styling
├── login.css       # Login page styling
├── script.js       # Main app JavaScript logic
├── login.js        # Login page JavaScript logic
├── server.js       # Backend API server
├── package.json    # Node.js dependencies
└── README.md       # This file
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - A `.env` file has been created with your OpenAI API key
   - The `.env` file is already in `.gitignore` to keep your API key secret
   - If you need to set it up manually, copy `.env.example` to `.env` and add your API key:
   ```bash
   cp .env.example .env
   # Then edit .env and add your OpenAI API key
   ```

3. Start the backend server:
```bash
npm start
```

The server will start on `http://localhost:3000`

**Note:** The server will exit with an error if the `OPENAI_API_KEY` environment variable is not set.

4. Open the application:
   - Open `login.html` in your web browser (this is the entry point), or
   - Use a local server like Live Server in VS Code, or
   - Run `python -m http.server 8000` and visit `http://localhost:8000/login.html`

## Usage

### Authentication
1. When you first open the app, you'll be presented with a login page
2. Enter your User ID (minimum 3 characters)
3. Click "Sign In" to access the calorie tracker

### Using the App
1. Select a meal type (Breakfast, Lunch, or Dinner) using the buttons at the top
2. Type your meal description in the input box (e.g., "2 eggs, toast with butter, orange juice")
3. Click the send button or press Enter
4. The AI will analyze your meal and display the estimated calories
5. View your daily totals in the statistics cards at the bottom
6. Click the logout button in the header to sign out

## How It Works

The application uses OpenAI's GPT-3.5-turbo model to intelligently analyze meal descriptions and provide accurate calorie estimates:
- Analyzes natural language meal descriptions
- Recognizes food items, quantities, and serving sizes
- Provides accurate calorie estimates based on nutrition knowledge
- Returns a detailed breakdown of calories per food item

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI Model**: OpenAI GPT-3.5-turbo for calorie estimation
- **API**: RESTful API with OpenAI integration

## API Configuration

The OpenAI API key is stored securely in a `.env` file (which is gitignored):
- The API key is loaded from the `OPENAI_API_KEY` environment variable
- The `.env` file contains your API key and is not committed to version control
- A `.env.example` file is provided as a template for other developers
- The server will exit with an error if the API key is not found

**Security Note:** Never commit your `.env` file to version control. It's already in `.gitignore`.

## Future Enhancements

- User accounts and meal history
- Export functionality for meal logs
- Mobile app version
- Integration with additional nutrition databases for enhanced accuracy

## License

MIT