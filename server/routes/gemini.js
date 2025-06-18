const express = require('express');
const axios = require('axios');
const router = express.Router();

// Gemini API configuration
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Chat with Gemini
router.post('/chat', async (req, res) => {
  try {
    const { message, apiKey, model = 'gemini-pro', context = [] } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const requestBody = {
      contents: [
        ...context.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    const response = await axios.post(
      `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    if (response.data.candidates && response.data.candidates[0]) {
      const candidate = response.data.candidates[0];
      const text = candidate.content.parts[0].text;
      
      res.json({
        response: text,
        usage: response.data.usageMetadata || {},
        finishReason: candidate.finishReason
      });
    } else {
      res.status(500).json({ error: 'No response generated' });
    }
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      res.status(400).json({ 
        error: 'Invalid request to Gemini API',
        details: error.response.data
      });
    } else if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid API key' });
    } else if (error.response?.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded' });
    } else {
      res.status(500).json({ 
        error: 'Failed to communicate with Gemini API',
        message: error.message
      });
    }
  }
});

// Stream chat with Gemini
router.post('/stream', async (req, res) => {
  try {
    const { message, apiKey, model = 'gemini-pro', context = [] } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const requestBody = {
      contents: [
        ...context.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    const response = await axios.post(
      `${GEMINI_API_BASE}/models/${model}:streamGenerateContent?key=${apiKey}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'stream'
      }
    );

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
              const text = data.candidates[0].content.parts[0].text;
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    });

    response.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    response.data.on('error', (error) => {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Gemini Stream Error:', error.response?.data || error.message);
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    res.end();
  }
});

// Get available models
router.get('/models', async (req, res) => {
  try {
    const { apiKey } = req.query;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const response = await axios.get(
      `${GEMINI_API_BASE}/models?key=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const models = response.data.models
      .filter(model => model.supportedGenerationMethods.includes('generateContent'))
      .map(model => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        inputTokenLimit: model.inputTokenLimit,
        outputTokenLimit: model.outputTokenLimit
      }));

    res.json({ models });
  } catch (error) {
    console.error('Models API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch models',
      message: error.message
    });
  }
});

// Validate API key
router.post('/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Test the API key with a simple request
    const response = await axios.get(
      `${GEMINI_API_BASE}/models?key=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );

    res.json({ 
      valid: true,
      modelsCount: response.data.models?.length || 0
    });
  } catch (error) {
    if (error.response?.status === 401) {
      res.json({ valid: false, error: 'Invalid API key' });
    } else {
      res.status(500).json({ 
        valid: false,
        error: 'Failed to validate API key',
        message: error.message
      });
    }
  }
});

module.exports = router;