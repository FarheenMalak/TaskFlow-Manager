// Helper function to make Gemini API calls
export async function callGeminiApi(endpoint, data) {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API KEY exists:", !!apiKey);

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error response:', errorText);
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('Gemini API response:', JSON.stringify(result, null, 2));
  return result;
}

// Generate AI-powered task suggestions
export async function generateTaskSuggestions(description) {
  try {
    const prompt = `Based on this user description: "${description}"

Generate 1 specific, actionable tasks in EXACT JSON format like this:
[
  {
    "title": "Task title here",
    "description": "Detailed description here"
  }
]

Return ONLY the JSON array, no other text or explanation. Each task should be specific and actionable.`;

    const result = await callGeminiApi('generateContent', {
      contents: [{
        role: 'user',
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
      },
    });

    // Extract the text response
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Raw Gemini response text:', text);

    // Try to parse the response
    let tasks = [];

    // Attempt 1: Direct JSON parse
    try {
      tasks = JSON.parse(text);
      // Validate structure
      if (Array.isArray(tasks) && tasks.every(task => task.title && task.description)) {
        return tasks;
      }
    } catch (e) {
      console.log('Direct JSON parse failed, trying to extract JSON from text');
    }

    // Attempt 2: Extract JSON array from text using regex
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      try {
        tasks = JSON.parse(jsonMatch[0]);
        if (Array.isArray(tasks) && tasks.length > 0) {
          return tasks;
        }
      } catch (e) {
        console.log('Extracted JSON parse failed');
      }
    }

    // Attempt 3: Parse line by line for fallback tasks
    tasks = extractTasksFromText(text);

    if (tasks.length === 0) {
      // Return default tasks if all parsing fails
      return [
        {
          title: "Research the topic",
          description: `Research and gather information about: ${description.substring(0, 100)}`
        },
        {
          title: "Create an action plan",
          description: `Develop a step-by-step plan for: ${description.substring(0, 100)}`
        },
        {
          title: "Set specific goals",
          description: "Define measurable objectives and timelines"
        },
        {
          title: "Gather required resources",
          description: "Identify and collect all necessary tools and materials"
        },
        {
          title: "Execute first steps",
          description: "Begin with the most critical actions"
        }
      ];
    }

    return tasks;
  } catch (error) {
    console.error('Error generating task suggestions:', error);
    throw error;
  }
}

// Helper function to extract tasks from text
function extractTasksFromText(text) {
  const tasks = [];

  // Try to find numbered or bullet points
  const lines = text.split('\n');
  let currentTask = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check for task patterns (numbered, bullet points, or "Title:" format)
    const taskMatch = line.match(/^\s*[\d\-\*•]+\s*(.+?)(?::|$)/);
    const titleMatch = line.match(/^(?:Title|Task)[:\s]+(.+)/i);
    const descMatch = line.match(/^(?:Description)[:\s]+(.+)/i);

    if (titleMatch) {
      if (currentTask && currentTask.title) {
        tasks.push(currentTask);
      }
      currentTask = { title: titleMatch[1].trim(), description: '' };
    } else if (descMatch && currentTask) {
      currentTask.description = descMatch[1].trim();
      tasks.push(currentTask);
      currentTask = null;
    } else if (taskMatch && !currentTask) {
      // Start a new task from bullet point
      currentTask = { title: taskMatch[1].trim(), description: '' };
    } else if (currentTask && !currentTask.description) {
      // Use line as description if it doesn't have a title pattern
      currentTask.description = line;
      tasks.push(currentTask);
      currentTask = null;
    }
  }

  // Add last task if exists
  if (currentTask && currentTask.title) {
    if (!currentTask.description) {
      currentTask.description = "Complete this task as described";
    }
    tasks.push(currentTask);
  }

  // If no structured tasks found, create some from the full text
  if (tasks.length === 0 && text.length > 0) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    for (let i = 0; i < Math.min(5, sentences.length); i++) {
      tasks.push({
        title: `Task ${i + 1}`,
        description: sentences[i].trim()
      });
    }
  }

  return tasks;
}

// Generate AI-powered priority assignment
export async function generatePriority(title, description) {
  try {
    const result = await callGeminiApi('generateContent', {
      contents: [{
        role: 'user',
        parts: [{
          text: `Analyze this task and assign a priority level (High, Medium, or Low):
          
          Title: "${title}"
          Description: "${description || 'No description provided'}"
          
          Return only the priority level: High, Medium, or Low. No other text.`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 100,
      },
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const priority = text.trim().match(/(High|Medium|Low)/i)?.[0] || 'Medium';
    return priority;
  } catch (error) {
    console.error('Error generating priority:', error);
    return 'Medium';
  }
}

// Generate weekly summary
export async function generateWeeklySummary(tasks) {
  try {
    const result = await callGeminiApi('generateContent', {
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate a concise weekly summary of completed tasks from the last 7 days:
          
          Completed tasks (${tasks.length} tasks):
          ${tasks.map(task => `- ${task.title}: ${task.description || 'No description'}`).join('\n')}
          
          Provide a short paragraph summary highlighting key accomplishments and patterns. Keep it to 2-3 sentences.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text.trim() || "No tasks completed this week. Keep up the momentum!";
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return "Unable to generate weekly summary at this time.";
  }
} 