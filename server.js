// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = 3000;

// OpenAI API Configuration - get from environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY environment variable is not set!');
    console.error('Please create a .env file with your OpenAI API key.');
    console.error('See .env.example for reference.');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

// Supabase Configuration - get from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('❌ ERROR: Supabase configuration is missing!');
    console.error('Please set SUPABASE_URL and SUPABASE_SECRET_KEY in your .env file.');
    process.exit(1);
}

// Validate Supabase URL format
if (SUPABASE_URL.includes('your-project-ref') || SUPABASE_URL === 'https://your-project-ref.supabase.co') {
    console.error('❌ ERROR: SUPABASE_URL is still set to placeholder value!');
    console.error('Please update SUPABASE_URL in your .env file with your actual Supabase project URL.');
    console.error('Get it from: https://app.supabase.com → Your Project → Settings → API → Project URL');
    process.exit(1);
}

// Initialize Supabase client with service role key (for admin operations)
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('✅ Supabase client initialized');
console.log(`   URL: ${SUPABASE_URL.substring(0, 30)}...`);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(__dirname));

// Estimate calories using OpenAI API
async function estimateCaloriesWithAI(mealText, mealType) {
    try {
        const prompt = `You are a nutrition expert. Analyze the following meal description and provide an accurate calorie estimate.

Meal Type: ${mealType}
Meal Description: "${mealText}"

Please provide:
1. Total estimated calories (as a number only)
2. A brief breakdown of the main items and their approximate calorie contributions

Format your response as JSON with this exact structure:
{
    "totalCalories": <number>,
    "breakdown": ["item 1: X kcal", "item 2: Y kcal", ...]
}

Be accurate and consider typical serving sizes. If quantities are mentioned (like "2 eggs"), account for that.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful nutrition expert that provides accurate calorie estimates. Always respond with valid JSON only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 300
        });

        const responseText = completion.choices[0].message.content.trim();
        
        // Try to extract JSON from the response
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                calories: Math.round(result.totalCalories || 0),
                breakdown: result.breakdown || []
            };
        } else {
            // Fallback: try to extract just the number
            const numberMatch = responseText.match(/\d+/);
            const calories = numberMatch ? parseInt(numberMatch[0]) : 0;
            return {
                calories: calories,
                breakdown: [`Estimated: ${calories} kcal`]
            };
        }
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw error;
    }
}

// API endpoint
app.post('/api/estimate-calories', async (req, res) => {
    try {
        const { meal, mealType } = req.body;
        
        if (!meal || typeof meal !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Meal description is required'
            });
        }
        
        const result = await estimateCaloriesWithAI(meal, mealType || 'meal');
        
        res.json({
            success: true,
            calories: result.calories,
            breakdown: result.breakdown,
            mealType: mealType || 'unknown'
        });
    } catch (error) {
        console.error('Error estimating calories:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to estimate calories. Please try again.'
        });
    }
});

// API endpoint to register a new user
app.post('/api/register', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId || typeof userId !== 'string' || userId.trim().length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Valid User ID is required (minimum 3 characters)'
            });
        }
        
        const trimmedUserId = userId.trim();
        
        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('Users')
            .select('userid, created_at')
            .eq('userid', trimmedUserId)
            .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error checking user:', checkError);
            
            // Handle connection errors
            if (checkError.message && checkError.message.includes('fetch failed')) {
                return res.status(500).json({
                    success: false,
                    error: 'Cannot connect to Supabase. Please check your SUPABASE_URL in .env file.',
                    hint: 'Make sure SUPABASE_URL is set correctly (format: https://[project-ref].supabase.co)'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Database error while checking user',
                details: checkError.message
            });
        }
        
        // If user already exists, return error
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'This User ID is already taken. Please choose a different one or login instead.'
            });
        }
        
        // User doesn't exist, create new user
        const { data: newUser, error: insertError } = await supabase
            .from('Users')
            .insert([
                {
                    userid: trimmedUserId,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();
        
        if (insertError) {
            console.error('Error creating user:', insertError);
            
            // Handle connection errors
            if (insertError.message && insertError.message.includes('fetch failed')) {
                return res.status(500).json({
                    success: false,
                    error: 'Cannot connect to Supabase. Please check your SUPABASE_URL in .env file.',
                    hint: 'Make sure SUPABASE_URL is set correctly (format: https://[project-ref].supabase.co)'
                });
            }
            
            // If table doesn't exist, provide helpful error
            if (insertError.code === '42P01' || insertError.message.includes('relation') || insertError.message.includes('does not exist')) {
                return res.status(500).json({
                    success: false,
                    error: 'Users table does not exist. Please create it in your Supabase project.',
                    hint: 'Create a table named "Users" with columns: userid (text, primary key), created_at (timestamp)'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Failed to create user in database',
                details: insertError.message
            });
        }
        
        console.log(`✅ New user registered: ${trimmedUserId}`);
        
        return res.json({
            success: true,
            userId: trimmedUserId,
            message: 'User registered successfully'
        });
        
    } catch (error) {
        console.error('Error in register endpoint:', error);
        
        // Handle network/connection errors
        if (error.message && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED'))) {
            return res.status(500).json({
                success: false,
                error: 'Cannot connect to Supabase. Please check your SUPABASE_URL and network connection.',
                hint: 'Verify SUPABASE_URL in .env file is correct (format: https://[project-ref].supabase.co)'
            });
        }
        
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process user registration'
        });
    }
});

// API endpoint to login (check if user exists)
app.post('/api/login', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId || typeof userId !== 'string' || userId.trim().length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Valid User ID is required (minimum 3 characters)'
            });
        }
        
        const trimmedUserId = userId.trim();
        
        // Check if user exists
        const { data: existingUser, error: checkError } = await supabase
            .from('Users')
            .select('userid, created_at')
            .eq('userid', trimmedUserId)
            .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error checking user:', checkError);
            
            // Handle connection errors
            if (checkError.message && checkError.message.includes('fetch failed')) {
                return res.status(500).json({
                    success: false,
                    error: 'Cannot connect to Supabase. Please check your SUPABASE_URL in .env file.',
                    hint: 'Make sure SUPABASE_URL is set correctly (format: https://[project-ref].supabase.co)'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Database error while checking user',
                details: checkError.message
            });
        }
        
        // If user doesn't exist, return error
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: 'User ID not found. Please register first.'
            });
        }
        
        // User exists, login successful
        console.log(`✅ User logged in: ${trimmedUserId}`);
        
        return res.json({
            success: true,
            userId: trimmedUserId,
            message: 'Login successful'
        });
        
    } catch (error) {
        console.error('Error in login endpoint:', error);
        
        // Handle network/connection errors
        if (error.message && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED'))) {
            return res.status(500).json({
                success: false,
                error: 'Cannot connect to Supabase. Please check your SUPABASE_URL and network connection.',
                hint: 'Verify SUPABASE_URL in .env file is correct (format: https://[project-ref].supabase.co)'
            });
        }
        
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process login'
        });
    }
});

// API endpoint to save meal data to Output table
app.post('/api/save-meal', async (req, res) => {
    try {
        const { userId, meal, mealType, calories } = req.body;
        
        if (!userId || !meal || !mealType || calories === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, meal, mealType, calories'
            });
        }
        
        // Insert into Output table
        const { data, error } = await supabase
            .from('Output')
            .insert([
                {
                    userid: userId,
                    'Meal': meal,
                    'Type of Meal': mealType,
                    'Calories': calories
                }
            ])
            .select();
        
        if (error) {
            console.error('Error saving meal to database:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save meal to database',
                details: error.message
            });
        }
        
        console.log(`✅ Meal saved for user ${userId}: ${meal} (${calories} kcal)`);
        
        return res.json({
            success: true,
            message: 'Meal saved successfully',
            data: data
        });
        
    } catch (error) {
        console.error('Error in save-meal endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to save meal'
        });
    }
});

// API endpoint to get user's meal history
app.post('/api/get-meals', async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }
        
        let query = supabase
            .from('Output')
            .select('*')
            .eq('userid', userId)
            .order('created_at', { ascending: false });
        
        // If date range provided, filter by dates
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Error fetching meals:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch meals from database',
                details: error.message
            });
        }
        
        return res.json({
            success: true,
            meals: data || []
        });
        
    } catch (error) {
        console.error('Error in get-meals endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch meals'
        });
    }
});

// API endpoint to get daily calorie totals for last 7 days
app.post('/api/get-daily-totals', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }
        
        // Get data from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const startDate = sevenDaysAgo.toISOString();
        
        const { data, error } = await supabase
            .from('Output')
            .select('created_at, Calories, "Type of Meal"')
            .eq('userid', userId)
            .gte('created_at', startDate)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('Error fetching daily totals:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch daily totals',
                details: error.message
            });
        }
        
        // Aggregate by date
        const dailyTotals = {};
        const mealTypeTotals = {};
        
        (data || []).forEach(meal => {
            const date = meal.created_at.split('T')[0]; // Get YYYY-MM-DD
            
            // Total for the day
            if (!dailyTotals[date]) {
                dailyTotals[date] = 0;
            }
            dailyTotals[date] += meal.Calories || 0;
            
            // Total by meal type
            if (!mealTypeTotals[date]) {
                mealTypeTotals[date] = { breakfast: 0, lunch: 0, dinner: 0 };
            }
            const mealType = (meal['Type of Meal'] || '').toLowerCase();
            if (mealTypeTotals[date][mealType] !== undefined) {
                mealTypeTotals[date][mealType] += meal.Calories || 0;
            }
        });
        
        return res.json({
            success: true,
            dailyTotals: dailyTotals,
            mealTypeTotals: mealTypeTotals
        });
        
    } catch (error) {
        console.error('Error in get-daily-totals endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch daily totals'
        });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Test Supabase connection
        const { error } = await supabase.from('Users').select('count').limit(1);
        const dbStatus = error ? 'disconnected' : 'connected';
        
        res.json({ 
            status: 'ok',
            database: dbStatus,
            openai: OPENAI_API_KEY ? 'configured' : 'not configured'
        });
    } catch (error) {
        res.json({ 
            status: 'ok',
            database: 'error',
            error: error.message
        });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Start server
const port = process.env.PORT || PORT;
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Calorie Tracker API server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
});

