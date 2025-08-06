const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const genAI = new GoogleGenAI({});

// Generate tasks from project description
router.post('/generate-tasks', async (req, res) => {
    try {
        const { projectDescription } = req.body;
        

        const prompt = `Break down the following project into main tasks and subtasks. Return a JSON array with this structure:
[
  {
    "title": "Main Task Title",
    "description": "Detailed description of what this task involves",
    "subtasks": [
      {
        "title": "Subtask Title",
        "description": "Detailed description of this subtask"
      }
    ]
  }
]

Project: ${projectDescription}

Keep tasks actionable and specific. Each main task should have 2-5 subtasks. Focus on practical steps.`;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        const text = response.text;
        
        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Could not parse AI response');
        }
        
        const tasks = JSON.parse(jsonMatch[0]);
        res.json({ tasks });
    } catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({ error: 'Failed to generate tasks. Please try again.' });
    }
});

module.exports = router;
