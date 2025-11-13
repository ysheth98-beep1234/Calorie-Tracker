const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const app = express();
const PORT = 3000;

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Calorie Tracker API server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

