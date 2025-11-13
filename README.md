# Calorie Tracker 🍽️

A beautiful web application to track your meals and get instant calorie estimates. Simply describe what you ate for breakfast, lunch, or dinner, and the app will intelligently estimate the calorie content.

## Features

- 🔐 User authentication with User ID login
- 💾 Database integration with Supabase for user management
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
   - A `.env` file has been created with your API keys
   - The `.env` file is already in `.gitignore` to keep your secrets safe
   - **Important:** Update the `SUPABASE_URL` in `.env` with your actual Supabase project URL
     - Get it from: https://app.supabase.com/project/_/settings/api
     - Format: `https://[your-project-ref].supabase.co`
   - If you need to set it up manually, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   # Then edit .env and add your API keys
   ```

3. Set up Supabase database:
   - Create a table named `Users` in your Supabase project
   - SQL to create the table:
   ```sql
   CREATE TABLE Users (
     userid TEXT PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
   - Or use the Supabase dashboard: Table Editor → New Table → Add columns as above

4. Start the backend server:
```bash
npm start
```

The server will start on `http://localhost:3000`

**Note:** The server will exit with an error if required environment variables are not set.

5. Open the application:
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

### Environment Variables

All sensitive keys are stored in a `.env` file (which is gitignored):

- **OPENAI_API_KEY**: Your OpenAI API key for calorie estimation
- **SUPABASE_URL**: Your Supabase project URL (format: `https://[project-ref].supabase.co`)
- **SUPABASE_SECRET_KEY**: Your Supabase service role secret key

The `.env` file is not committed to version control. A `.env.example` file is provided as a template.

**Security Note:** Never commit your `.env` file to version control. It's already in `.gitignore`.

### Database Schema

The app uses a `Users` table in Supabase with the following structure:
- `userid` (TEXT, PRIMARY KEY): The user's unique identifier
- `created_at` (TIMESTAMP): When the user was first registered

New users are automatically registered in the database when they log in for the first time.

## Future Enhancements

- User accounts and meal history
- Export functionality for meal logs
- Mobile app version
- Integration with additional nutrition databases for enhanced accuracy

## License

MIT