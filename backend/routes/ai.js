const express = require('express');
const router = express.Router();
const { Ollama } = require('ollama');
const auth = require('../middleware/auth');

const ollama = new Ollama();

// @route   POST /api/ai/ask
// @desc    Send a prompt to Ollama and get a response
// @access  Private
router.post('/ask', auth, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const response = await ollama.chat({
      model: 'llama2',
      messages: [{ role: 'user', content: prompt }],
    });

    if (response.message) {
      res.json({ response: response.message.content });
    } else {
      res.status(500).json({ message: 'Failed to get a valid response from AI' });
    }
  } catch (error) {
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      console.error('Ollama connection refused. Is Ollama running?');
      return res.status(500).json({ message: 'Could not connect to AI service. Please ensure Ollama is running.' });
    }
    console.error('Ollama API error:', error);
    res.status(500).json({ message: 'Error communicating with AI service' });
  }
});

module.exports = router; 