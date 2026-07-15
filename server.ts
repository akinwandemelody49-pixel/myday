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

// API: Generate AI Invitation Wording
app.post('/api/generate-invitation-wording', async (req, res) => {
  const { birthdayName, age, eventDate, eventTime, venue, dressCode, specialMessage, hostName, style } = req.body;

  if (!birthdayName || !venue) {
    return res.status(400).json({ error: 'Missing required parameters: birthdayName and venue are required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY is not set or using placeholder. Running in High-Fidelity Mock AI mode for Invitations.');
    return res.json(generateLocalMockInvitationWording(birthdayName, age, eventDate, eventTime, venue, dressCode, specialMessage, hostName, style));
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
      You are MyDay AI, an expert bespoke designer of premium invitations.
      Generate beautiful, creative, and captivating birthday invitation wording based on these details:
      - Birthday Person Name: "${birthdayName}"
      - Celebrating Age: ${age || 'N/A'}
      - Event Date: "${eventDate}"
      - Event Time: "${eventTime || 'N/A'}"
      - Venue: "${venue}"
      - Dress Code: "${dressCode || 'N/A'}"
      - Special Message: "${specialMessage || 'none'}"
      - Host Name: "${hostName || 'none'}"
      - Style Selected: "${style}" (e.g. Elegant, Luxury, Modern, Fun, Kids, Traditional, Romantic, Minimal)

      Return a JSON object conforming exactly to the responseSchema structure.
      The phrasing must be highly customized to the selected style.
      For example:
      - Luxury: use royal, opulent, upscale words (e.g., "The pleasure of your company is requested at the grand soirée...", "Dressed in gold...")
      - Traditional: use culturally rich, warm words (e.g., "Join us for a celebration of grace, culture, and life...")
      - Minimal: clean, direct, stylish, simple.
      - Fun: energetic, exciting, cheerful.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motto: { type: Type.STRING },
            body: { type: Type.STRING },
            rsvpText: { type: Type.STRING }
          },
          required: ["motto", "body", "rsvpText"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const invitationWording = JSON.parse(text);
    return res.json(invitationWording);
  } catch (err: any) {
    console.error('Gemini API Error for invitation wording:', err);
    return res.json(generateLocalMockInvitationWording(birthdayName, age, eventDate, eventTime, venue, dressCode, specialMessage, hostName, style));
  }
});

// Helper for Mock Invitation Wording Generation
function generateLocalMockInvitationWording(
  birthdayName: string,
  age: string,
  eventDate: string,
  eventTime: string,
  venue: string,
  dressCode: string,
  specialMessage: string,
  hostName: string,
  style: string
) {
  const yearsOldStr = age ? `${age}th ` : '';
  const hostIntro = hostName ? `Together with their host, ${hostName}, ` : '';
  const dressCodeStr = dressCode ? `\nDress Code: ${dressCode}` : '';
  const msgStr = specialMessage ? `\n\n"${specialMessage}"` : '';
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Special Day';

  const styles: { [key: string]: { motto: string; body: string; rsvpText: string } } = {
    Elegant: {
      motto: `An Evening of Grace and Celebration`,
      body: `${hostIntro}you are cordially invited to celebrate the ${yearsOldStr}Birthday of ${birthdayName}.\n\nJoin us for a curated soirée filled with fine dining, music, and beautiful memories at the stunning ${venue}.\n\nDate: ${formattedDate}\nTime: ${eventTime || '18:00 PM'}${dressCodeStr}${msgStr}`,
      rsvpText: `Kindly RSVP to confirm your attendance`
    },
    Luxury: {
      motto: `The Grand Golden Jubilee`,
      body: `Requesting the honor of your presence at the grand birthday celebration honoring ${birthdayName}'s ${yearsOldStr}milestone.\n\nPrepare for an exquisite evening of opulence, fine champagne, and bespoke experiences under the stars at ${venue}.\n\nDate: ${formattedDate}\nTime: ${eventTime || '19:00 PM'}${dressCodeStr}${msgStr}`,
      rsvpText: `RSVP is strictly required for entry`
    },
    Modern: {
      motto: `Let's Celebrate: ${birthdayName}`,
      body: `It's a milestone year! We are marking ${birthdayName}'s ${yearsOldStr}Birthday with sleek beats, modern aesthetics, and interactive culinary stations at ${venue}.\n\nDate: ${formattedDate}\nTime: ${eventTime || '20:00 PM'}${dressCodeStr}${msgStr}`,
      rsvpText: `Hit us back by Friday to save your spot`
    },
    Fun: {
      motto: `Pop the Bubbly, Let's Party!`,
      body: `Ready, set, celebrate! ${birthdayName} is turning ${age || 'another year older'} and we are throwing an epic bash at ${venue}.\n\nExpect delicious small chops, high-energy tracks, and a whole lot of laughter. Don't miss out!\n\nDate: ${formattedDate}\nTime: ${eventTime || '17:00 PM'}${dressCodeStr}${msgStr}`,
      rsvpText: `RSVP now and get ready to dance!`
    },
    Kids: {
      motto: `A Magical Fun Adventure!`,
      body: `Calling all friends! Join us for a fun-filled birthday adventure as we celebrate ${birthdayName}'s ${yearsOldStr}Birthday!\n\nThere will be cake, fun games, balloons, and sweet treats at ${venue}.\n\nDate: ${formattedDate}\nTime: ${eventTime || '14:00 PM'}${dressCodeStr}${msgStr}`,
      rsvpText: `Please let parents know if you can make it!`
    },
    Traditional: {
      motto: `Honoring Culture, Grace, and Life`,
      body: `Join us in giving thanks as we celebrate the ${yearsOldStr}Birthday of our beloved ${birthdayName}.\n\nWe gather in cultural elegance, traditional attire, and joyous gratitude at ${venue}.\n\nDate: ${formattedDate}\nTime: ${eventTime || '16:00 PM'}${dressCodeStr}${msgStr}`,
      rsvpText: `Kindly RSVP to join us in celebration`
    },
    Romantic: {
      motto: `Under the Stars & Candlelight`,
      body: `With warm hearts and starlit skies, we invite you to an intimate evening celebrating ${birthdayName}'s ${yearsOldStr}Birthday.\n\nA gentle celebration of love, life, and sweet friendship at ${venue}.\n\nDate: ${formattedDate}\nTime: ${eventTime || '18:30 PM'}${dressCodeStr}${msgStr}`,
      rsvpText: `Please share your RSVP response with us`
    },
    Minimal: {
      motto: `${birthdayName} • ${yearsOldStr || ''}Birthday`,
      body: `Please join us to celebrate ${birthdayName}.\n\nVenue: ${venue}\nDate: ${formattedDate}\nTime: ${eventTime || '19:00 PM'}${dressCodeStr}${msgStr}`,
      rsvpText: `RSVP requested`
    }
  };

  const key = style ? (style.charAt(0).toUpperCase() + style.slice(1).toLowerCase()) : 'Elegant';
  return styles[key] || styles.Elegant;
}

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

// API: Generate AI Budget Plan
app.post('/api/generate-budget', async (req, res) => {
  const { budget, eventType, guestCount, theme, location } = req.body;

  if (!budget || !eventType) {
    return res.status(400).json({ error: 'Missing required parameters: budget and eventType are required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY is not set or using placeholder. Running in High-Fidelity Mock AI mode for Budgets.');
    return res.json(generateLocalMockAIBudget(Number(budget), eventType, Number(guestCount || 50), theme || 'Elegant', location || 'Lagos'));
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
      You are MyDay Budget AI, a premium luxury event budget strategist.
      Create a highly optimized, professional budget distribution for a birthday or event:
      - Total Budget: ${budget}
      - Event Type: "${eventType}"
      - Guest Count: ${guestCount || 'unspecified'}
      - Theme/Style: "${theme || 'Elegant'}"
      - Location: "${location || 'unspecified'}"

      You MUST distribute the total budget of ${budget} across these EXACT 10 categories:
      1. "Cake"
      2. "Photography"
      3. "Decor"
      4. "Restaurants"
      5. "Event Halls"
      6. "MC"
      7. "DJ"
      8. "Makeup Artist"
      9. "Gift Shops"
      10. "Catering"

      The sum of the costs for all 10 categories MUST sum up exactly to the total budget: ${budget}.
      Provide a highly realistic, premium allocation tailored to the event type "${eventType}", theme "${theme}", and location "${location}".
      
      Generate:
      - allocatedCategories: array of objects representing the distribution with properties: categoryName, percentage (integer), cost (integer), description (concise reason why this is allocated)
      - warnings: array of strings containing potential issues (e.g. if budget per guest is tight, if any essential category has insufficient funds for the chosen style/location, etc.)
      - savingsSuggestions: array of strings containing smart, custom, elite ways to save on categories based on the event description
      - explanation: a beautiful summary explaining the overall financial strategy for this luxury event.

      Return a JSON object conforming exactly to the responseSchema structure.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            allocatedCategories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  categoryName: { type: Type.STRING },
                  percentage: { type: Type.INTEGER },
                  cost: { type: Type.INTEGER },
                  description: { type: Type.STRING }
                },
                required: ["categoryName", "percentage", "cost", "description"]
              }
            },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            savingsSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["explanation", "allocatedCategories", "warnings", "savingsSuggestions"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const budgetData = JSON.parse(text);
    return res.json(budgetData);
  } catch (err: any) {
    console.error('Gemini API Error for budget planner:', err);
    return res.json(generateLocalMockAIBudget(Number(budget), eventType, Number(guestCount || 50), theme || 'Elegant', location || 'Lagos'));
  }
});

// API: Generate AI Celebration Timeline
app.post('/api/generate-timeline', async (req, res) => {
  const { eventDate, eventType, theme, interests } = req.body;

  if (!eventDate || !eventType) {
    return res.status(400).json({ error: 'Missing required parameters: eventDate and eventType are required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY is not set or using placeholder. Running in High-Fidelity Mock AI mode for Timelines.');
    return res.json(generateLocalMockTimeline(eventDate, eventType, theme || 'Elegant'));
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
      You are MyDay Celebration Timeline AI, an expert premium event coordinator.
      Create a comprehensive, highly personalized chronological planning checklist and timeline leading up to the celebration date:
      - Celebration Date: "${eventDate}"
      - Event Type/Occasion: "${eventType}"
      - Theme/Style: "${theme || 'Elegant'}"
      - Interests/Affinities: "${interests ? interests.join(', ') : 'None'}"

      Create 6-10 chronological checklist tasks distributed across these 5 phases of event execution:
      - "planning" (e.g., 30 to 45 days before: concept, theme, initial estimates, guest cap)
      - "booking" (e.g., 18 to 30 days before: contracting key vendors like venue, music, photography)
      - "invitations" (e.g., 10 to 18 days before: invitation creation, sending, dress-code communication, RSVP monitoring)
      - "final_touches" (e.g., 3 to 10 days before: catering headcount confirmation, beauty/glam appointment, coordinate surprise details)
      - "day_of" (e.g., 0 days before: setups, MC sound check, cake, and enjoyment)

      For each task, return:
      - title: A specific, descriptive action title (e.g. "Select Venue" or "Dispatch Digital Invitations via MyDay")
      - description: A premium, tailored tip or checklist instruction specific to the theme "${theme || 'Elegant'}" and event type "${eventType}".
      - daysBefore: Number of days before the celebration date when this task is due (e.g. 30, 20, 14, 5, 0).
      - phase: One of "planning" | "booking" | "invitations" | "final_touches" | "day_of"
      - linkedType: If this task represents a platform module, link it: "booking" for finding/securing vendors, "invitation" for digital RSVP dispatch, "budget" for financial allocation, or "none".
      - reminderDaysBefore: Number of days before the task's due date when an automatic reminder should trigger (e.g. 2 or 3 days before).

      Ensure the dates correspond logically to the target celebration date. Return a JSON object matching the responseSchema exactly.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  daysBefore: { type: Type.INTEGER },
                  phase: { type: Type.STRING },
                  linkedType: { type: Type.STRING },
                  reminderDaysBefore: { type: Type.INTEGER }
                },
                required: ["title", "description", "daysBefore", "phase", "linkedType", "reminderDaysBefore"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const timelineData = JSON.parse(text);
    return res.json(timelineData);
  } catch (err: any) {
    console.error('Gemini API Error for timeline planner:', err);
    return res.json(generateLocalMockTimeline(eventDate, eventType, theme || 'Elegant'));
  }
});

function generateLocalMockTimeline(eventDate: string, eventType: string, theme: string) {
  return {
    tasks: [
      {
        title: `Establish ${theme} Budget & Vision`,
        description: `Set up your MyDay Budget Planner with a clear outline of allocations for the ${theme} ${eventType} theme.`,
        daysBefore: 30,
        phase: 'planning',
        linkedType: 'budget',
        reminderDaysBefore: 2
      },
      {
        title: `Draft Celebration Guest List`,
        description: `Define your initial guest list limit matching the planned capacity of your desired venue layout.`,
        daysBefore: 28,
        phase: 'planning',
        linkedType: 'none',
        reminderDaysBefore: 1
      },
      {
        title: `Book Core Vendors`,
        description: `Browse and book premium verified Vendors (Venues, Caterers, and Photographers) matching the ${theme} aesthetic.`,
        daysBefore: 21,
        phase: 'booking',
        linkedType: 'booking',
        reminderDaysBefore: 3
      },
      {
        title: `Design and Dispatch Custom Digital Invites`,
        description: `Generate high-contrast MyDay digital invitations complete with RSVPs, dress code instructions, and directions.`,
        daysBefore: 14,
        phase: 'invitations',
        linkedType: 'invitation',
        reminderDaysBefore: 2
      },
      {
        title: `Finalize Catering and Theme Decor Orders`,
        description: `Coordinate with your booked caterer and decorators to lock in specific catering counts and decoration options.`,
        daysBefore: 5,
        phase: 'final_touches',
        linkedType: 'booking',
        reminderDaysBefore: 1
      },
      {
        title: `Coordinate Surprise & Celebration Flow`,
        description: `Create a brief timeline sequence of surprises, guest toast timings, and cake-cutting coordinates.`,
        daysBefore: 3,
        phase: 'final_touches',
        linkedType: 'none',
        reminderDaysBefore: 1
      },
      {
        title: `Pre-event Walkthrough & Enjoyment!`,
        description: `Ensure sound checks are ready and celebrate the ${eventType} under the gorgeous ${theme} atmosphere!`,
        daysBefore: 0,
        phase: 'day_of',
        linkedType: 'none',
        reminderDaysBefore: 0
      }
    ]
  };
}

function generateLocalMockAIBudget(
  budget: number,
  eventType: string,
  guestCount: number,
  theme: string,
  location: string
) {
  // Define base percentages based on Event Type
  let percentages: { [key: string]: number } = {
    'Event Halls': 25,
    'Catering': 20,
    'Decor': 12,
    'Photography': 10,
    'Cake': 8,
    'MC': 6,
    'DJ': 6,
    'Makeup Artist': 5,
    'Gift Shops': 4,
    'Restaurants': 4,
  };

  // Adjust percentages dynamically based on eventType
  const typeLower = eventType.toLowerCase();
  if (typeLower.includes('dinner') || typeLower.includes('restaurant') || typeLower.includes('intimate')) {
    percentages['Restaurants'] = 30;
    percentages['Catering'] = 5;
    percentages['Event Halls'] = 5;
    percentages['Decor'] = 15;
    percentages['MC'] = 5;
    percentages['DJ'] = 5;
    percentages['Photography'] = 12;
    percentages['Cake'] = 10;
    percentages['Makeup Artist'] = 8;
    percentages['Gift Shops'] = 5;
  } else if (typeLower.includes('club') || typeLower.includes('party') || typeLower.includes('dance')) {
    percentages['DJ'] = 15;
    percentages['MC'] = 10;
    percentages['Event Halls'] = 20;
    percentages['Catering'] = 15;
    percentages['Decor'] = 10;
    percentages['Restaurants'] = 3;
    percentages['Photography'] = 8;
    percentages['Cake'] = 7;
    percentages['Makeup Artist'] = 6;
    percentages['Gift Shops'] = 6;
  } else if (typeLower.includes('outdoor') || typeLower.includes('garden') || typeLower.includes('picnic')) {
    percentages['Decor'] = 20;
    percentages['Event Halls'] = 10;
    percentages['Catering'] = 25;
    percentages['Photography'] = 12;
    percentages['Cake'] = 8;
    percentages['DJ'] = 7;
    percentages['MC'] = 6;
    percentages['Makeup Artist'] = 4;
    percentages['Gift Shops'] = 4;
    percentages['Restaurants'] = 4;
  }

  // Ensure sum is exactly 100%
  const keys = Object.keys(percentages);
  let sum = keys.reduce((acc, k) => acc + percentages[k], 0);
  if (sum !== 100) {
    const diff = 100 - sum;
    percentages['Catering'] += diff; // adjust catering with the difference
  }

  const allocatedCategories = keys.map(key => {
    const pct = percentages[key];
    const cost = Math.round((budget * pct) / 100);
    let description = '';

    switch (key) {
      case 'Event Halls':
        description = `Allocated ${pct}% for reserving a premium hall matching your ${theme} theme in ${location}.`;
        break;
      case 'Catering':
        description = `Premium food, refreshments and service catering for your estimated ${guestCount} guests.`;
        break;
      case 'Decor':
        description = `Curated thematic styling and ambiance setups to match your ${theme} preference.`;
        break;
      case 'Photography':
        description = `Professional portraits and live event coverage to capture the golden memories.`;
        break;
      case 'Cake':
        description = `Custom-crafted multi-tier cake tailored to your celebration style.`;
        break;
      case 'MC':
        description = `Elite event compere to handle crowd engagement and program flow smoothly.`;
        break;
      case 'DJ':
        description = `Professional sound systems and curated sets to keep the energy high.`;
        break;
      case 'Makeup Artist':
        description = `Full glam beauty session for the celebrant and close party.`;
        break;
      case 'Gift Shops':
        description = `Personalized party favors and gifts for your special attendees.`;
        break;
      case 'Restaurants':
        description = `Intimate dining or semi-private culinary experiences.`;
        break;
    }

    return {
      categoryName: key,
      percentage: pct,
      cost,
      description
    };
  });

  // Re-adjust cost to ensure absolute sum precision match to the user budget
  let runningCostSum = allocatedCategories.reduce((acc, item) => acc + item.cost, 0);
  if (runningCostSum !== budget) {
    const diff = budget - runningCostSum;
    allocatedCategories[0].cost += diff; // adjust first item
  }

  // Generate intelligent warnings
  const warnings: string[] = [];
  const costPerGuest = budget / (guestCount || 1);
  
  if (costPerGuest < 5000) {
    warnings.push(`Tight Budget warning: Your budget averages ₦${Math.round(costPerGuest).toLocaleString()}/guest. Standard luxury catering averages ₦8,000/guest.`);
  }
  if (guestCount > 150 && percentages['Event Halls'] * budget / 100 < 300000) {
    warnings.push(`Hall Budget Alert: ₦${Math.round(percentages['Event Halls'] * budget / 100).toLocaleString()} might be insufficient to book a 150+ capacity hall in prime locations.`);
  }
  if (budget < 100000) {
    warnings.push(`Micro Budget constraint: Essential vendors (Photographer/Cake/Decor) may need to be boutique or micro-vendors.`);
  }

  if (warnings.length === 0) {
    warnings.push(`Optimized budget: Your budget of ₦${budget.toLocaleString()} is extremely healthy for ${guestCount} guests (₦${Math.round(costPerGuest).toLocaleString()} per guest).`);
  }

  // Generate intelligent savings suggestions
  const savingsSuggestions: string[] = [
    `Consolidate Sound & MC: Look for a premium DJ who also provides high-quality crowd hype/compering services to save up to 15% on entertainment.`,
    `Afternoon Soirée: Hosting your event between 2:00 PM and 5:00 PM usually reduces catering costs by 20%, as guests expect finger-foods (small chops) rather than full multi-course meals.`,
    `Local Floral Accents: Request your Decor vendor to use in-season local foliage rather than imported fresh roses. This retains premium density while saving up to ₦100,000.`,
    `Semi-Private Dining: For smaller guest counts, book a semi-private lounge area in a luxury restaurant instead of a full event hall. This completely waives the rental fee.`
  ];

  const explanation = `This premium budget strategy is optimized for your ${theme} ${eventType} in ${location}. We have front-loaded ${percentages['Catering']}% of the funds into Catering and ${percentages['Event Halls']}% into Venues to secure the fundamental pillars of guest comfort, while reserving an elegant ${percentages['Decor']}% for personalized ${theme} design features.`;

  return {
    explanation,
    allocatedCategories,
    warnings,
    savingsSuggestions
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
