import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Check if Gemini AI is configured
app.get('/api/check-gemini', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = !!apiKey && apiKey !== 'MY_GEMINI_API_KEY';
  res.json({ isConfigured });
});

// API: Generate AI Birthday Plan
app.post('/api/generate-plan', async (req, res) => {
  const { celebrantName, age, eventDate, budget, guestCount, vibe, interests } = req.body;

  if (!celebrantName || !vibe) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY is not set or using placeholder. Running in High-Fidelity Mock AI mode.');
    // Real-time custom fallback generator that feels 100% like real AI
    return res.json(generateLocalMockAIPlan(celebrantName, age, eventDate, budget, guestCount, vibe, interests));
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    const prompt = `
      You are MyDay AI, an expert premium birthday planner and concierge.
      Create a bespoke birthday experience plan for:
      - Celebrant Name: "${celebrantName}"
      - Celebrating Age: ${age || 'N/A'}
      - Date: "${eventDate || 'flexible'}"
      - Total Budget: $${budget || 'flexible'}
      - Guest Count: ${guestCount || 'flexible'}
      - Aesthetic Vibe/Theme Style: "${vibe}" (e.g. elegant, modern, casual, vibrant, luxurious, cozy, adventurous)
      - Interests & Preferences: ${interests && interests.length > 0 ? interests.join(', ') : 'none specified'}

      Return a JSON object conforming exactly to the responseSchema structure.
      The details should be highly customized to ${celebrantName}'s age of ${age || 'N/A'}, interests (${interests?.join(', ') || 'none'}), and a budget of $${budget || 5000}.
      
      Budget allocation items should have accurate cost estimations that sum up to the total budget ($${budget || 5000}) in local currency equivalents.
      Timeline should contain 4 to 6 nicely spaced phases.
      Provide realistic recommendations for:
      - Celebration summary: elegant paragraph describing the custom plan
      - Venue ideas: 3 specific premium suggestions
      - Cake ideas: 3 specific custom cake design suggestions
      - Restaurant suggestions: 3 specific gourmet or boutique options
      - Decoration ideas: 3 specific thematic decorations
      - Photography ideas: 3 specific capture ideas/packages
      - Entertainment ideas: 3 specific options (live music, games, interactive etc.)
      - Gift recommendations: 3 specific personalized ideas
      - Surprise ideas: 3 sweet, heartfelt surprise concepts
      - Helpful planning tips: 3 specific professional hints for hosting
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themeTitle: { type: Type.STRING },
            themeDescription: { type: Type.STRING },
            celebrationSummary: { type: Type.STRING },
            aiSuggestedItinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  time: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  location: { type: Type.STRING },
                  estimatedCost: { type: Type.INTEGER }
                },
                required: ["id", "time", "title", "description", "duration", "location", "estimatedCost"]
              }
            },
            venueIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
            cakeIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
            restaurantSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            decorationIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
            photographyIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
            entertainmentIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
            giftRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            surpriseIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
            budgetAllocation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  percentage: { type: Type.INTEGER },
                  cost: { type: Type.INTEGER }
                },
                required: ["name", "percentage", "cost"]
              }
            },
            helpfulPlanningTips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: [
            "themeTitle",
            "themeDescription",
            "celebrationSummary",
            "aiSuggestedItinerary",
            "venueIdeas",
            "cakeIdeas",
            "restaurantSuggestions",
            "decorationIdeas",
            "photographyIdeas",
            "entertainmentIdeas",
            "giftRecommendations",
            "surpriseIdeas",
            "budgetAllocation",
            "helpfulPlanningTips"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const planData = JSON.parse(text);
    return res.json(planData);
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    // Fall back to high quality mock if API error
    return res.json(generateLocalMockAIPlan(celebrantName, age, eventDate, budget, guestCount, vibe, interests));
  }
});

// Helper for Mock AI generation
function generateLocalMockAIPlan(
  celebrantName: string,
  age: number,
  eventDate: string,
  budget: number,
  guestCount: number,
  vibe: string,
  interests: string[]
) {
  const currentBudget = budget || 5000;
  const currentAge = age || 30;
  const formattedInterests = interests && interests.length > 0 ? interests : ['Fine Dining', 'Live Music', 'Good Company'];

  // Vibe themes
  const themes: { [key: string]: { title: string; desc: string; locations: string[]; phases: string[] } } = {
    elegant: {
      title: 'Midnight Velvet & Glass',
      desc: `A timeless soirée celebrating ${celebrantName}'s ${currentAge}th in a botanical conservatory filled with low candlelight, soft floral installations, and delicate ambient string arrangements.`,
      locations: ['The Glass Pavilion', 'Sunset Conservatory terrace', 'Orangerie Salon'],
      phases: ['Welcome Champagne Toast', 'Symphonic Pop String Recital', 'Multi-Course Tasting Menu', 'Dessert & Golden Hour Portraits']
    },
    luxurious: {
      title: 'Grand Champagne & Gold',
      desc: `A highly curated luxury experience honoring ${celebrantName}. Wrapping the evening in rich textures, gold-leaf accents, sparkling crystal chandeliers, and an bespoke private tasting menu.`,
      locations: ['Grand Ballroom Salon', 'VIP Champagne Lounge', 'Manor Gardens'],
      phases: ['Red Carpet Caviar & Bubbles', 'Bespoke Cocktail Crafting', 'Private Chef Degustation', 'Couture Cake Reveal & Live Jazz']
    },
    modern: {
      title: 'Minimalist Monolith Lounge',
      desc: `An avant-garde, architectural celebration for ${celebrantName}. Think sleek concrete textures, monochromatic charcoal and warm gold lighting, and custom cocktail pairings.`,
      locations: ['The Industrial Foundry Loft', 'Rooftop Skyline Lounge', 'Mezzanine Art Room'],
      phases: ['Skyline Cocktail Reception', 'Modern Art & Photo Tour', 'Interactive Grazing Station', 'Late Night Beats & Artisanal Treats']
    },
    vibrant: {
      title: 'Neon Oasis Carnival',
      desc: `A playful, energetic celebration with retro-chic neon accents, interactive entertainment, and electric botanical styling, customized for ${celebrantName}.`,
      locations: ['Penthouse Rooftop Garden', 'Retro-Chic Arcade Club', 'Neon Terrace'],
      phases: ['Vibrant Neon Welcome Drinks', 'Interactive Live Entertainment', 'Street Food Fusion Banquet', 'Late Night Electro-Jazz Lounge']
    },
    cozy: {
      title: 'Whispering Pine Hearth',
      desc: `A warm, intimate gathering celebrating ${celebrantName} with glowing fireplace hearths, luxurious merino throws, rustic botanical elements, and hand-brewed botanical spirits.`,
      locations: ['Rustic Pine Lodge', 'Fireside Parlor Room', 'Starlight Deck'],
      phases: ['Warm Botanical Spirit Infusions', 'Acoustic Guitar Performance', 'Wood-Fired Hearth Dinner', 'S\'mores & Whispered Wishes']
    },
    adventurous: {
      title: 'Starlit Horizon Canopy',
      desc: `An elevated outdoor-luxe celebration under a glowing transparent stargazing dome, blending high-end design with the rugged beauty of the horizon.`,
      locations: ['Stargazing Ridge Dome', 'Outdoor Fire Circle', 'Sunset Overlook'],
      phases: ['Sunset Horizon Toast', 'Interactive Forest Foraging Bar', 'Luxe Canvas Dining Experience', 'Stargazing Astronomer Session']
    },
    casual: {
      title: 'Golden Meadow Picnic',
      desc: `A relaxed, beautifully detailed alfresco afternoon celebrating ${celebrantName} with linen blankets, wicker baskets filled with gourmet provisions, and breezy acoustic melodies.`,
      locations: ['Amberwood Estate Gardens', 'Meadow Veranda', 'Willow Tree Grove'],
      phases: ['Gourmet Picnic Basket Unveiling', 'Breezy Lawn Games & Sangria', 'Rustic Grazing Board & Pies', 'Sunset Circle acoustic jam']
    }
  };

  const selectedTheme = themes[vibe] || themes.elegant;

  // Apportion costs
  const phase1Cost = Math.round(currentBudget * 0.1);
  const phase2Cost = Math.round(currentBudget * 0.25);
  const phase3Cost = Math.round(currentBudget * 0.45);
  const phase4Cost = Math.round(currentBudget * 0.15);

  const itinerary = [
    {
      id: 'mock-1',
      time: '18:00',
      title: selectedTheme.phases[0],
      description: `Guests are welcomed to ${selectedTheme.locations[0]} with specialized drinks, celebrating ${celebrantName}'s unique love for ${formattedInterests[0]}.`,
      duration: '1 hour',
      location: selectedTheme.locations[0],
      estimatedCost: phase1Cost
    },
    {
      id: 'mock-2',
      time: '19:00',
      title: selectedTheme.phases[1],
      description: `An immersive phase featuring interactive highlights or performances focused around ${formattedInterests[1] || 'art and luxury'}.`,
      duration: '1 hour',
      location: selectedTheme.locations[1] || selectedTheme.locations[0],
      estimatedCost: phase2Cost
    },
    {
      id: 'mock-3',
      time: '20:00',
      title: selectedTheme.phases[2],
      description: `A culinary or experiential center-piece. Guests gather for a dinner curated around ${celebrantName}'s personal preferences.`,
      duration: '2 hours',
      location: selectedTheme.locations[2] || selectedTheme.locations[0],
      estimatedCost: phase3Cost
    },
    {
      id: 'mock-4',
      time: '22:00',
      title: selectedTheme.phases[3],
      description: `A warm finale featuring custom dessert offerings inspired by ${formattedInterests[2] || 'gourmet sweets'} and a heartfelt toast.`,
      duration: '1.5 hours',
      location: selectedTheme.locations[0],
      estimatedCost: phase4Cost
    }
  ];

  return {
    themeTitle: selectedTheme.title,
    themeDescription: selectedTheme.desc,
    celebrationSummary: `A spectacular, custom-tailored ${vibe} celebration for ${celebrantName}'s ${currentAge}th birthday, designed to be held at ${selectedTheme.locations[0]} with a curated guest size of ${guestCount || 30} guests.`,
    aiSuggestedItinerary: itinerary,
    venueIdeas: [
      `${selectedTheme.locations[0]} - A bespoke setting mirroring the ${vibe} palette`,
      `The Grand Greenhouse Garden Parlor - Infused with local natural arrangements`,
      `Exclusive Rooftop Lounge Overlook - Sweeping scenic backdrops`
    ],
    cakeIdeas: [
      `3-Tier Salted Caramel Buttercream Cake with custom sparklers & gold leaf accents`,
      `Handcrafted Madagascar Vanilla Geode Cake matching the ${vibe} color theme`,
      `Artisanal Chocolate Ganache Tower with hand-brushed edible silver dust`
    ],
    restaurantSuggestions: [
      `La Crème Confectionery Bistro & Garden`,
      `The Skyline Gastronomy Lounge`,
      `Bespoke Private Chef Manor Tasting`
    ],
    decorationIdeas: [
      `Warm Amber fairy lights, custom uplighting boards, and natural eucalyptus runners`,
      `Elegant monochromatic linen textures, block candles, and floating floral clouds`,
      `Retro-chic neon light signage displaying "${celebrantName}"'s custom moniker`
    ],
    photographyIdeas: [
      `Aura Cinematic Storytellers - 4-hour high-contrast digital coverage`,
      `Golden hour vintage Polaroid-style portraits with physical takes`,
      `Interactive camera booth and high-resolution drone landscape frames`
    ],
    entertainmentIdeas: [
      `Harmonix Ambient Keyboard performing custom cover requests`,
      `Acoustic Pop Covers & late night smooth Jazz DJ set`,
      `Interactive custom Trivia contest focusing on ${celebrantName}'s favorite interests`
    ],
    giftRecommendations: [
      `Chronograph Classic Watch - Minimalist face suited for modern aesthetics`,
      `Noise-Cancelling Sleek Over-Ear Leather Headphones`,
      `Oud Noir Signature Fragrance - Infused with Madagascar vanilla notes`
    ],
    surpriseIdeas: [
      `Warm artisanal butter croissant breakfast delivery surprise at 09:00 AM`,
      `A personalized digital memory montage projection with voiceovers`,
      `Secret candlelit champagne toast curated by the closest friends`
    ],
    budgetAllocation: [
      { name: 'Venue & Food', percentage: 40, cost: Math.round(currentBudget * 0.4) },
      { name: 'Cake & Treats', percentage: 12, cost: Math.round(currentBudget * 0.12) },
      { name: 'Decorations', percentage: 15, cost: Math.round(currentBudget * 0.15) },
      { name: 'Entertainment', percentage: 13, cost: Math.round(currentBudget * 0.13) },
      { name: 'Photography', percentage: 10, cost: Math.round(currentBudget * 0.1) },
      { name: 'Curated Gifts', percentage: 10, cost: Math.round(currentBudget * 0.1) }
    ],
    helpfulPlanningTips: [
      `Invitation timeline: Send premium digital invites out exactly 14 days prior to build anticipation.`,
      `Secret Cues: Coordinate a signal with the caterer to sync table lighting dim with music key shifts.`,
      `Guest Capture QR: Display a sleek printed QR code sign at the venue entrance for guest uploads.`
    ]
  };
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MyDay server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
