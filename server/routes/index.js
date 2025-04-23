var express = require('express');
var router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// Helper to call Gemini 2.5 Pro
async function getGeminiRecommendations({ appUrl, vertical, goals }) {
  // Compose a prompt for Gemini
  const prompt = `You are a Customer Engagement expert. Given the following details, suggest a list of at least 20 user attributes and at least 20 event touch points (with 3-4 properties for each event, and each property should have a name, type, and example) that the client should track for analytics and client engagement.\n\nClient App Link: ${appUrl}\nBusiness Vertical: ${vertical}\nBusiness Goals: ${goals && goals.length ? goals.join(', ') : 'N/A'}\n\nRespond in JSON with the following structure:\n{\n  userAttributes: [{ name, type, example }],\n  events: [{ name, properties: [{ name, type, example }] }],\n  goals: []\n}`;

  // Call Gemini API (replace with your actual endpoint and API key)
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    // Always write to the correct server folder, regardless of CWD
    const geminiPath = path.join(process.cwd(), 'server', 'gemini_response.txt');
    // Ensure the directory exists before writing
    fs.mkdirSync(path.dirname(geminiPath), { recursive: true });
    fs.writeFileSync(geminiPath, JSON.stringify(response.data, null, 2));
    console.log('Gemini API raw response:', JSON.stringify(response.data, null, 2));
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let json = null;
    try {
      // Find the first {...} block in the response
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        json = JSON.parse(match[0]);
      } else {
        throw new Error('No JSON block found in Gemini response');
      }
    } catch (err) {
      console.error('Failed to parse Gemini JSON:', err.message, 'Raw text:', text);
      return null;
    }
    return json;
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return null;
  }
}

// Detect business vertical from website HTML using Gemini
router.post('/detect-vertical', async function(req, res) {
  const { appUrl } = req.body;
  if (!appUrl) return res.status(400).json({ error: 'appUrl is required' });
  try {
    // Fetch homepage HTML
    const htmlResp = await axios.get(appUrl, { timeout: 10000 });
    // Optionally, extract only visible text for a cleaner prompt
    const $ = cheerio.load(htmlResp.data);
    const visibleText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000); // limit for prompt
    // Compose Gemini prompt
    const prompt = `Given the following website homepage content, what is the most likely business vertical? Respond with a single word from this list: ecommerce, fintech, travel, edtech, gaming, healthcare, media, saas, realestate, food, fitness, social, marketplace, automotive, logistics, entertainment, education, insurance, hospitality, telecom, retail.\n\nContent:\n${visibleText}`;
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const geminiResp = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const text = geminiResp.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Extract the first word (vertical)
    const detected = text.match(/\b\w+\b/);
    res.json({ vertical: detected ? detected[0].toLowerCase() : '' });
  } catch (err) {
    console.error('Vertical detection error:', err.message);
    res.status(500).json({ error: 'Failed to detect vertical' });
  }
});


// Simple mock mapping for demo
const mockMappings = {
  ecommerce: {
    defaultGoals: ['Increase conversions', 'Reduce cart abandonment'],
    userAttributes: [
      { name: 'user_id', type: 'string', example: 'u123' },
      { name: 'email', type: 'string', example: 'john.doe@email.com' },
      { name: 'signup_date', type: 'date', example: '2023-01-01' }
    ],
    events: [
      { name: 'Product Viewed', properties: [
        { name: 'product_id', type: 'string', example: 'P123' },
        { name: 'category', type: 'string', example: 'Shoes' }
      ] },
      { name: 'Added to Cart', properties: [
        { name: 'product_id', type: 'string', example: 'P123' },
        { name: 'quantity', type: 'number', example: 2 }
      ] },
      { name: 'Purchase', properties: [
        { name: 'order_id', type: 'string', example: 'O123' },
        { name: 'amount', type: 'number', example: 1999 }
      ] }
    ]
  },
  fintech: {
    defaultGoals: ['Increase app engagement', 'Drive transactions'],
    userAttributes: [
      { name: 'user_id', type: 'string', example: 'u123' },
      { name: 'kyc_status', type: 'string', example: 'verified' }
    ],
    events: [
      { name: 'Transaction Initiated', properties: [
        { name: 'txn_id', type: 'string', example: 'T123' },
        { name: 'amount', type: 'number', example: 500 }
      ] },
      { name: 'Transaction Success', properties: [
        { name: 'txn_id', type: 'string', example: 'T123' },
        { name: 'amount', type: 'number', example: 500 }
      ] }
    ]
  },
  travel: {
    defaultGoals: ['Increase bookings', 'Reduce cancellations'],
    userAttributes: [
      { name: 'user_id', type: 'string', example: 'u123' },
      { name: 'loyalty_tier', type: 'string', example: 'Gold' }
    ],
    events: [
      { name: 'Flight Searched', properties: [
        { name: 'origin', type: 'string', example: 'SFO' },
        { name: 'destination', type: 'string', example: 'JFK' }
      ] },
      { name: 'Booking Completed', properties: [
        { name: 'booking_id', type: 'string', example: 'B123' },
        { name: 'amount', type: 'number', example: 1200 }
      ] }
    ]
  },
  edtech: {
    defaultGoals: ['Increase course completions', 'Boost engagement'],
    userAttributes: [
      { name: 'user_id', type: 'string', example: 'u123' },
      { name: 'subscription_status', type: 'string', example: 'active' }
    ],
    events: [
      { name: 'Lesson Started', properties: [
        { name: 'lesson_id', type: 'string', example: 'L123' },
        { name: 'course_id', type: 'string', example: 'C123' }
      ] },
      { name: 'Quiz Completed', properties: [
        { name: 'quiz_id', type: 'string', example: 'Q123' },
        { name: 'score', type: 'number', example: 85 }
      ] }
    ]
  },
  gaming: {
    defaultGoals: ['Increase daily active users', 'Boost in-app purchases'],
    userAttributes: [
      { name: 'user_id', type: 'string', example: 'u123' },
      { name: 'level', type: 'number', example: 10 }
    ],
    events: [
      { name: 'Level Up', properties: [
        { name: 'level', type: 'number', example: 11 }
      ] },
      { name: 'Purchase', properties: [
        { name: 'item_id', type: 'string', example: 'I123' },
        { name: 'amount', type: 'number', example: 5 }
      ] }
    ]
  },
  healthcare: {
    defaultGoals: ['Increase appointment bookings', 'Improve patient retention'],
    userAttributes: [
      { name: 'user_id', type: 'string', example: 'u123' },
      { name: 'insurance_status', type: 'string', example: 'active' }
    ],
    events: [
      { name: 'Appointment Booked', properties: [
        { name: 'appointment_id', type: 'string', example: 'A123' },
        { name: 'doctor_id', type: 'string', example: 'D123' }
      ] },
      { name: 'Prescription Refilled', properties: [
        { name: 'prescription_id', type: 'string', example: 'P123' }
      ] }
    ]
  },
  media: {
    defaultGoals: ['Increase watch time', 'Boost subscriptions'],
    userAttributes: [
      { name: 'user_id', type: 'string', example: 'u123' },
      { name: 'subscription_type', type: 'string', example: 'premium' }
    ],
    events: [
      { name: 'Video Played', properties: [
        { name: 'video_id', type: 'string', example: 'V123' },
        { name: 'duration', type: 'number', example: 120 }
      ] },
      { name: 'Subscription Upgraded', properties: [
        { name: 'plan', type: 'string', example: 'premium' }
      ] }
    ]
  },
  saas: {
    defaultGoals: ['Increase trial conversions', 'Reduce churn'],
    userAttributes: [
      { name: 'user_id', type: 'string', example: 'u123' },
      { name: 'plan', type: 'string', example: 'Pro' }
    ],
    events: [
      { name: 'Trial Started', properties: [
        { name: 'trial_id', type: 'string', example: 'T123' }
      ] },
      { name: 'Subscription Cancelled', properties: [
        { name: 'reason', type: 'string', example: 'No longer needed' }
      ] }
    ]
  }
};

router.post('/recommend', async function(req, res) {
  const { appUrl, vertical, goals } = req.body;
  // Use Gemini for recommendations only if API key is set
  let usedGoals = goals && goals.length > 0 ? goals : (mockMappings[vertical]?.defaultGoals || mockMappings['ecommerce'].defaultGoals);
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
    const geminiResult = await getGeminiRecommendations({ appUrl, vertical, goals: usedGoals });
    if (geminiResult) {
      return res.json(geminiResult);
    }
  } else {
    console.warn('GEMINI_API_KEY is not set or is a placeholder. Skipping Gemini call.');
  }
  // fallback to mock if Gemini fails or not configured
  const mapping = mockMappings[vertical] || mockMappings['ecommerce'];
  res.json({
    userAttributes: mapping.userAttributes,
    events: mapping.events,
    goals: usedGoals
  });
});

// Gemini-powered usecase fetcher
router.post('/ai-usecases', async function(req, res) {
  const { vertical } = req.body;
  if (!vertical) return res.status(400).json({ error: 'vertical is required' });
  const prompt = `You are a marketing automation expert. Suggest 12-15 creative campaign usecases for a ${vertical} business. For each usecase, provide: name, segment/cohort, sample message (with personalisation), and the most suitable channel (Push, Email, SMS, WhatsApp). Respond in JSON as an array of objects: [{ name, segment, message, channel }].`;
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Write Gemini response for debugging
    const geminiPath = path.join(process.cwd(), 'server', 'gemini_usecases_response.txt');
    fs.mkdirSync(path.dirname(geminiPath), { recursive: true });
    fs.writeFileSync(geminiPath, JSON.stringify(response.data, null, 2));
    // Try to extract JSON array from the response
    const match = text.match(/\[.*\]/s);
    if (match) {
      return res.json({ usecases: JSON.parse(match[0]) });
    }
    throw new Error('No valid JSON array in Gemini response');
  } catch (err) {
    console.error('Gemini AI usecase error:', err.message);
    res.status(500).json({ error: 'Failed to get AI usecases' });
  }
});

module.exports = router;
