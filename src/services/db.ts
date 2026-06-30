import { BirthdayPlan, Vendor } from '../types';

// Standard Premium Vendors List for MyDay
export const SAMPLE_VENDORS: Vendor[] = [
  {
    id: 'venue-1',
    name: 'The Glass Pavilion',
    category: 'venue',
    rating: 4.9,
    reviewsCount: 124,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
    location: 'Metropolitan Arts District',
    description: 'An architectural masterpiece featuring floor-to-ceiling glass walls, curated botanical gardens, and stellar city views. Perfect for elegant evening soirées.',
    contactEmail: 'events@glasspavilion.com',
    contactPhone: '+1 (555) 123-4567'
  },
  {
    id: 'venue-2',
    name: 'Amberwood Estate Garden',
    category: 'venue',
    rating: 4.8,
    reviewsCount: 89,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1545232979-8bf34eb9757b?auto=format&fit=crop&q=80&w=800',
    location: 'Amberwood Hills',
    description: 'A historic French-country manor wrapped in ivy, showcasing lush rolling lawns, white rose gardens, and sparkling fairy lights.',
    contactEmail: 'concierge@amberwoodestate.com',
    contactPhone: '+1 (555) 765-4321'
  },
  {
    id: 'venue-3',
    name: 'The Foundry Loft',
    category: 'venue',
    rating: 4.7,
    reviewsCount: 156,
    priceRange: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=800',
    location: 'Downtown Industrial Loop',
    description: 'A beautifully restored warehouse featuring raw brick walls, high timber beams, and industrial-chic metal windows with warm ambient lighting.',
    contactEmail: 'bookings@foundryloft.com'
  },
  {
    id: 'catering-1',
    name: 'Epicurean Table',
    category: 'catering',
    rating: 4.9,
    reviewsCount: 112,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800',
    location: 'Greater Metro Area',
    description: 'Fine-dining multi-course tasting menus crafted from organic, hyper-local ingredients. Accompanied by interactive chef stations and sommelier wine pairings.',
    contactEmail: 'chef@epicureantable.com'
  },
  {
    id: 'catering-2',
    name: 'Harvest & Gather Co.',
    category: 'catering',
    rating: 4.7,
    reviewsCount: 74,
    priceRange: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
    location: 'Greater Metro Area',
    description: 'Artisanal grazing tables, rustic wood-fired small plates, and bespoke handcrafted botanical cocktails tailored to your theme.',
    contactEmail: 'hello@harvestandgather.co'
  },
  {
    id: 'decor-1',
    name: 'Golden Hour Florals & Styling',
    category: 'decor',
    rating: 4.9,
    reviewsCount: 95,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
    location: 'Design Quarter',
    description: 'Curated tablescapes, structural floral installations, luxury linens, and warm, golden-hour custom lighting designs.',
    contactEmail: 'design@goldenhourdecor.com'
  },
  {
    id: 'decor-2',
    name: 'Noir Avant-Garde Decor',
    category: 'decor',
    rating: 4.8,
    reviewsCount: 53,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1478812954026-9c750f0e89fc?auto=format&fit=crop&q=80&w=800',
    location: 'Design Quarter',
    description: 'Modern, minimalist, and striking visual elements. Think charcoal tones, glowing neon accents, and bold geometric structures.',
    contactEmail: 'luxe@noiravantgarde.com'
  },
  {
    id: 'entertainment-1',
    name: 'Starlight Chamber Strings',
    category: 'entertainment',
    rating: 5.0,
    reviewsCount: 42,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800',
    location: 'City Center',
    description: 'A premium classical string quartet performing elegant orchestral arrangements of contemporary pop, rock, and cinematic favorites.',
    contactEmail: 'booking@starlightstrings.com'
  },
  {
    id: 'entertainment-2',
    name: 'Acoustic Soul Trio',
    category: 'entertainment',
    rating: 4.8,
    reviewsCount: 88,
    priceRange: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1487180142328-054b783fc471?auto=format&fit=crop&q=80&w=800',
    location: 'Metropolitan',
    description: 'Smooth, soulful acoustic versions of classic rhythm and blues, neo-soul, and warm jazz standards to create an upscale yet conversational backdrop.',
    contactEmail: 'info@acousticsoultrio.com'
  },
  {
    id: 'baking-1',
    name: 'Atelier de Sucre (The Sugar Studio)',
    category: 'baking',
    rating: 4.9,
    reviewsCount: 165,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=800',
    location: 'Northside Blvd',
    description: 'Bespoke custom-crafted celebration cakes featuring intricate sugar flowers, velvet textures, and gold leaf accents. Flavors include Lavender Honey and Dark Chocolate Espresso.',
    contactEmail: 'cakes@atelierdesucre.com'
  },
  {
    id: 'baking-2',
    name: 'Minimalist Crumb Bakery',
    category: 'baking',
    rating: 4.7,
    reviewsCount: 62,
    priceRange: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
    location: 'West End',
    description: 'Sophisticated, modern, single-tier and multi-tier naked cakes with minimal styling and organic botanical garnishes.',
    contactEmail: 'hello@minimalistcrumb.com'
  },
  {
    id: 'photography-1',
    name: 'Vogue Lens Editorial',
    category: 'photography',
    rating: 4.9,
    reviewsCount: 71,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
    location: 'Metro Area',
    description: 'Editorial-style birthday portraiture and event coverage. Captures candid, elegant moments with a high-fashion, cinematic aesthetic.',
    contactEmail: 'studio@voguelens.com'
  }
];

// In-Memory & Local Storage persistence manager for Demo Mode
const STORAGE_KEY = 'myday_birthday_plans';

import { collection, query, where, getDocs, setDoc, doc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';

// Validate Connection to Firestore as per the Firebase Integration Skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client is offline.");
    } else {
      console.log("Firebase initialized and ready.");
    }
  }
}
testConnection();

// Fetch plans from Firestore for the specific user
export const getFirestoreBirthdayPlans = async (userId: string): Promise<BirthdayPlan[]> => {
  try {
    const q = query(collection(db, 'birthday_plans'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const plans: BirthdayPlan[] = [];
    querySnapshot.forEach((docSnap) => {
      plans.push(docSnap.data() as BirthdayPlan);
    });
    return plans;
  } catch (e) {
    console.error('Error reading from Firestore', e);
    throw e;
  }
};

// Save a single plan to Firestore
export const savePlanToFirestore = async (plan: BirthdayPlan): Promise<void> => {
  try {
    const docRef = doc(db, 'birthday_plans', plan.id);
    await setDoc(docRef, plan);
    console.log(`Plan ${plan.id} saved to Firestore`);
  } catch (e) {
    console.error('Error saving to Firestore', e);
    throw e;
  }
};

// Delete a single plan from Firestore
export const deletePlanFromFirestore = async (planId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'birthday_plans', planId);
    await deleteDoc(docRef);
    console.log(`Plan ${planId} deleted from Firestore`);
  } catch (e) {
    console.error('Error deleting from Firestore', e);
    throw e;
  }
};

export const getLocalBirthdayPlans = (): BirthdayPlan[] => {
  try {
    const plansJson = localStorage.getItem(STORAGE_KEY);
    if (plansJson) {
      return JSON.parse(plansJson);
    }
  } catch (e) {
    console.error('Error reading local plans', e);
  }
  
  // Default Sample Plan if none exists
  const defaultPlan: BirthdayPlan = {
    id: 'plan-default',
    userId: 'user-demo',
    celebrantName: 'Melody Akinwande',
    age: 28,
    eventDate: '2026-07-15',
    budget: 5000,
    guestCount: 25,
    vibe: 'elegant',
    interests: ['Fine Dining', 'Live Jazz', 'Floral Installation', 'Sunset Portraits'],
    themeTitle: 'Amber & Glass Soirée',
    themeDescription: 'A sophisticated evening centered around glowing amber illumination, floral arrangements, and premium contemporary string arrangements.',
    status: 'planning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    selectedVendors: {
      venue: 'venue-1',
      catering: 'catering-1',
      decor: 'decor-1',
      entertainment: 'entertainment-1',
      baking: 'baking-1',
    },
    aiSuggestedItinerary: [
      {
        id: 'it-1',
        time: '18:00',
        title: 'Arrival & Welcome Drinks',
        description: 'Guests arrive at The Glass Pavilion, greeted with bespoke elderflower champagne cocktails.',
        duration: '1 hour',
        location: 'West Terrace Garden',
        estimatedCost: 350
      },
      {
        id: 'it-2',
        time: '19:00',
        title: 'Chamber Pop Live Recital',
        description: 'Starlight Chamber Strings performs a special modern tribute while guests mingle and find their seats.',
        duration: '45 mins',
        location: 'Main Pavilion Hall',
        estimatedCost: 1200
      },
      {
        id: 'it-3',
        time: '20:00',
        title: 'Gastronomic Dinner Service',
        description: 'A 4-course organic tasting menu curated by Epicurean Table, highlighting seasonal lavender and gold ingredients.',
        duration: '2 hours',
        location: 'Dining Veranda',
        estimatedCost: 2500
      },
      {
        id: 'it-4',
        time: '22:00',
        title: 'Toast & Cake Cutting Ceremony',
        description: 'Cutting the custom atelier cake with champagne toast, accompanied by background acoustic standards.',
        duration: '1 hour',
        location: 'Main Pavilion Hall',
        estimatedCost: 600
      }
    ]
  };

  return [defaultPlan];
};

export const saveBirthdayPlans = (plans: BirthdayPlan[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error('Error saving plans locally', e);
  }
};
