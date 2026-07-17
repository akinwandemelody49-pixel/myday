import { BirthdayPlan, Vendor, VendorApplication, Invitation } from '../types';

// Standard Premium Vendors List for MyDay
export const SAMPLE_VENDORS: Vendor[] = [
  {
    id: 'baking-1',
    name: 'Atelier de Sucre Custom Cakes',
    category: 'Cake',
    rating: 4.9,
    reviewsCount: 165,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=800',
    location: 'GRA, Ilorin',
    description: 'Bespoke custom-crafted luxury Nigerian celebration cakes featuring intricate sugar flowers, velvet textures, and gold leaf accents. Exquisite flavors include Coconut Velvet, Salted Caramel, and White Chocolate Raspberry.',
    contactEmail: 'cakes@atelierdesucre.com',
    contactPhone: '+234 803 123 4567',
    logoUrl: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=150',
    startingPrice: 120000,
    availability: 'Available on weekends',
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800'
    ],
    services: ['Bespoke Wedding & Birthday Cakes', 'Gourmet Cupcake Towers', 'Dessert Table Styling'],
    reviews: [
      { author: 'Amara Okafor', rating: 5, text: 'Absolutely spectacular! The gold leaf detail was breathtaking and the velvet crumb was incredibly moist.', date: '2026-06-12', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=100' },
      { author: 'Tunde Bakare', rating: 4.8, text: 'Stunning cake. Everyone loved the salted caramel layers. Highly recommended.', date: '2026-05-28', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100' }
    ],
    pricingTiers: [
      { name: 'Classic Elegance', price: 120000, features: ['2 Tiers (Serves 40-50)', 'Standard Buttercream Finishes', '1 Custom Flavor'] },
      { name: 'Royal Couture', price: 250000, features: ['3 Tiers (Serves 80-100)', 'Fondant with Gold Leaf Details', 'Sugar Flowers', '2 Custom Flavors'] }
    ],
    availableDates: ['2026-07-18', '2026-07-19', '2026-07-25', '2026-07-26']
  },
  {
    id: 'photography-1',
    name: 'Vogue Lens African Portraits',
    category: 'Photography',
    rating: 4.9,
    reviewsCount: 71,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800',
    location: 'Kwara State Metro',
    description: 'Editorial-style birthday photography capturing real candid laughter, beautiful traditional attire, and premium high-fashion portraits to cherish forever. Led by award-winning visual directors.',
    contactEmail: 'studio@voguelens.com',
    contactPhone: '+234 805 765 4321',
    logoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    startingPrice: 350000,
    availability: 'Limited Slots Left',
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800'
    ],
    services: ['Birthday Portrait Sessions', 'Live Event Coverage', 'High-End Retouching', 'Premium Photobooks'],
    reviews: [
      { author: 'Melody Akinwande', rating: 5, text: 'Vogue Lens made me feel like an absolute superstar for my portrait shoot! The lighting and portraits look like a Vogue cover.', date: '2026-07-02', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' }
    ],
    pricingTiers: [
      { name: 'Editorial Studio', price: 350000, features: ['2-hour studio session', '3 outfit changes', '15 fully edited high-res digital shots'] },
      { name: 'Full Soirée VIP', price: 650000, features: ['Full-day coverage (6 hours)', 'Studio portrait warmup', '150 edited shots', 'Leather-bound Luxury Photobook'] }
    ],
    availableDates: ['2026-07-15', '2026-07-20', '2026-07-22', '2026-07-29']
  },
  {
    id: 'decor-1',
    name: 'Golden Hour Luxury Decor',
    category: 'Decor',
    rating: 4.9,
    reviewsCount: 95,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
    location: 'Design Quarter, Ilorin',
    description: 'Curated luxury birthday event design. Elegant balloon arches, majestic fresh floral backdrops, sophisticated tableware settings, and bespoke ambient warm lighting layouts.',
    contactEmail: 'design@goldenhourdecor.com',
    contactPhone: '+234 812 345 6789',
    logoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    startingPrice: 200000,
    availability: 'Available',
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=800'
    ],
    services: ['Theme Concept Design', 'Fresh Floral Styling', 'Luxury Table Settings', 'Lighting Orchestration'],
    reviews: [
      { author: 'Chidi Benson', rating: 5, text: 'Our guests could not stop talking about the floral installations. Absolute design mastery.', date: '2026-06-25', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' }
    ],
    pricingTiers: [
      { name: 'Intimate Chic', price: 200000, features: ['Main Backdrop Design', 'Organic Balloon/Floral Styling', 'Cake Table setup'] },
      { name: 'Grand Ballroom Luxe', price: 500000, features: ['Full Hall decor transformation', 'Entrance archways', '20 customized luxury guest tables', 'Curated uplighting'] }
    ],
    availableDates: ['2026-07-15', '2026-07-16', '2026-07-21', '2026-07-28']
  },
  {
    id: 'restaurant-1',
    name: 'The Orchid Bistro & Lounge',
    category: 'Restaurants',
    rating: 4.8,
    reviewsCount: 142,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    location: 'GRA, Ilorin',
    description: 'An elegant tropical oasis serving modern fusion gastronomy, premium mixology, and vintage wines. Offers semi-private dining, stellar mood lighting, and cozy lounge spaces perfect for intimate birthdays.',
    contactEmail: 'bistro@theorchid.com',
    contactPhone: '+234 815 122 3344',
    logoUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=150',
    startingPrice: 15000,
    availability: 'Available Daily',
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800'
    ],
    services: ['Group Set-Menus', 'Private Room Bookings', 'Bespoke Mixology Bar', 'Valet Parking'],
    reviews: [
      { author: 'Fatima Yaradua', rating: 4.9, text: 'Perfect venue for my intimate dinner. The lobster pasta and custom cocktail menu were incredible!', date: '2026-07-10', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100' }
    ],
    pricingTiers: [
      { name: 'Patron Platter Menu', price: 15000, features: ['Per guest minimum spend', '3-course fusion set menu', 'Welcome mocktail'] },
      { name: 'Elite Private Vault', price: 250000, features: ['Exclusive room rental (up to 20 guests)', 'Personal sommelier', 'Customized printed menus'] }
    ],
    availableDates: ['2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19']
  },
  {
    id: 'venue-1',
    name: 'The Glass Pavilion Centre',
    category: 'Event Halls',
    rating: 4.9,
    reviewsCount: 124,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
    location: 'Ilorin, Kwara State',
    description: 'An architectural masterpiece featuring floor-to-ceiling glass walls, curated tropical gardens, and stunning modern illumination. Perfect for elegant, luxurious evening birthday celebrations.',
    contactEmail: 'events@glasspavilion.com',
    contactPhone: '+234 803 123 4567',
    logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=150',
    startingPrice: 850000,
    availability: 'Limited slots',
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505232458627-539c97b4ca15?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800'
    ],
    services: ['Exclusive Hall Rental', 'State of the art HVAC & Acoustic Treatment', 'Staging & Presentation Rigging', 'Dedicated VIP suite'],
    reviews: [
      { author: 'Kunle Adeleke', rating: 5, text: 'This venue is out of this world. Clean glass layouts, beautiful landscaping, and premium power backup.', date: '2026-06-30', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=100' }
    ],
    pricingTiers: [
      { name: 'Half-Day Sunset', price: 850000, features: ['6-hour hall rental (up to 300 guests)', 'Standard event lights', 'Secure parking'] },
      { name: 'Full Royal Reservation', price: 1500000, features: ['Full-day exclusive usage (12 hours)', 'VIP lounge access', 'Advanced stage & custom lighting rigs'] }
    ],
    availableDates: ['2026-07-15', '2026-07-20', '2026-07-25', '2026-08-01']
  },
  {
    id: 'mc-1',
    name: 'MC Larry - The Vibe Curator',
    category: 'MC',
    rating: 5.0,
    reviewsCount: 88,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&q=80&w=800',
    location: 'Lagos & Kwara Metro',
    description: 'Charismatic, sophisticated, and energetic bilingual event host specializing in custom high-class birthday events. Larry keeps the crowd laughing, engaged, and dancing, without any cheesy jokes.',
    contactEmail: 'larry@vibecompere.com',
    contactPhone: '+234 816 888 9999',
    logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    startingPrice: 150000,
    availability: 'Available',
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800'
    ],
    services: ['Live Compere / Event Hosting', 'Pre-Event Script & Flow Consultation', 'Interactive Crowd Games'],
    reviews: [
      { author: 'Kareem Alabi', rating: 5, text: 'MC Larry is a top-tier gentleman. He paced our evening perfectly and kept guests from age 18 to 80 engaged.', date: '2026-07-01', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' }
    ],
    pricingTiers: [
      { name: 'Elegant Minimalist', price: 150000, features: ['Up to 4 hours hosting', 'Standard event flow protocol', 'Audience engagement games'] },
      { name: 'Elite Signature', price: 250000, features: ['Full event hosting (up to 8 hours)', 'Pre-event program brainstorming', 'Afterparty hype session'] }
    ],
    availableDates: ['2026-07-15', '2026-07-18', '2026-07-19', '2026-07-26']
  },
  {
    id: 'dj-1',
    name: 'DJ Spin - Sound Alchemist',
    category: 'DJ',
    rating: 4.9,
    reviewsCount: 110,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    location: 'Lagos & Ilorin',
    description: 'Premier open-format DJ with a stellar record of curating beautiful musical atmospheres. Fluent in Afrobeats, Amapiano, Classic Soul, Highlife, Throwback Hip-Hop, and Top 40 charts.',
    contactEmail: 'spin@soundalchemist.com',
    contactPhone: '+234 809 333 4444',
    logoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
    startingPrice: 180000,
    availability: 'Available',
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800'
    ],
    services: ['Custom DJ Set', 'Premium Sound Equipment Lease', 'Curated Custom Playlists', 'Hype Man Collaboration'],
    reviews: [
      { author: 'Damola Olatunji', rating: 4.9, text: 'Our dance floor was packed for 4 straight hours! The Amapiano transition sets were insane.', date: '2026-06-18', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=100' }
    ],
    pricingTiers: [
      { name: 'Performance Only', price: 180000, features: ['Bespoke DJ Set (up to 5 hours)', 'Personal controller & custom set prep'] },
      { name: 'Sound & Spin Package', price: 300000, features: ['Premium sound system (2 active speakers)', '2 cordless mics', 'Professional DJ booth & lighting stand'] }
    ],
    availableDates: ['2026-07-15', '2026-07-17', '2026-07-18', '2026-07-24', '2026-07-25']
  },
  {
    id: 'mua-1',
    name: 'Glow by Shade',
    category: 'Makeup Artist',
    rating: 4.9,
    reviewsCount: 94,
    priceRange: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800',
    location: 'GRA, Ilorin',
    description: 'Bridal and editorial beauty artist specializing in radiant "second skin" custom beauty, clean glam, and luxury soft aesthetic makeovers. Uses only high-end, dermatologist-approved brands.',
    contactEmail: 'shade@glowbeauty.com',
    contactPhone: '+234 813 777 8888',
    logoUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=150',
    startingPrice: 45000,
    availability: 'Available',
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800'
    ],
    services: ['Flawless Birthday Glam', 'On-Site Touch-Ups', 'Lash Application & Grooming'],
    reviews: [
      { author: 'Zainab Balogun', rating: 5, text: 'Shade is the absolute queen of soft glam. I looked beautiful and felt incredibly comfortable all night!', date: '2026-07-05', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100' }
    ],
    pricingTiers: [
      { name: 'Celebrant Soft Glam', price: 45000, features: ['Luxury skincare prep', 'Soft/clean glam look', 'Premium strip lashes', 'Touch-up travel kit'] },
      { name: 'Royal Portrait Glam', price: 80000, features: ['Includes studio trial session', 'Luxury high-definition airbrush look', 'Half-day on-site touchup standby'] }
    ],
    availableDates: ['2026-07-15', '2026-07-18', '2026-07-19', '2026-07-22', '2026-07-26']
  },
  {
    id: 'gift-1',
    name: 'The Keepsake Box & Co',
    category: 'Gift Shops',
    rating: 4.8,
    reviewsCount: 63,
    priceRange: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800',
    location: 'Pipeline, Ilorin',
    description: 'Artisanal gift curators specializing in premium curated party favors, elegant custom gift hampers, and custom engraved items. Give your birthday guests high-class tokens of gratitude they will actually use.',
    contactEmail: 'orders@keepsakebox.com',
    contactPhone: '+234 818 444 5555',
    logoUrl: 'https://images.unsplash.com/photo-1463171359079-3d99966c2176?auto=format&fit=crop&q=80&w=150',
    startingPrice: 8500,
    availability: 'Available for Bulk Orders',
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&q=80&w=800'
    ],
    services: ['Bespoke Guest Souvenir Box', 'Personalized Birthday Hampers', 'Corporate Favor Packing'],
    reviews: [
      { author: 'Chinyere Umeh', rating: 4.8, text: 'Our guests adored the customized leather coasters and mini-diffusers! Beautiful packaging.', date: '2026-06-20', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100' }
    ],
    pricingTiers: [
      { name: 'Petite Souvenir Box', price: 8500, features: ['Custom box packaging', 'Scented candle', 'Personalized thank-you card', 'Handmade soap bar'] },
      { name: 'Vanguard Luxury Hamper', price: 75000, features: ['Premium wicker hamper', 'Imported wine', 'Engraved crystal glass', 'Luxury chocolate selection'] }
    ],
    availableDates: ['2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19']
  },
  {
    id: 'catering-1',
    name: 'Epicurean African Cuisine',
    category: 'Catering',
    rating: 4.9,
    reviewsCount: 112,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&q=80&w=800',
    location: 'Kwara State Metro',
    description: 'Fine-dining multi-course tasting menus highlighting upscale African gourmet delicacies, royal party Jollof rice, and custom culinary plated presentations with organic local ingredients.',
    contactEmail: 'chef@epicureanfood.com',
    contactPhone: '+234 803 987 6543',
    logoUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=150',
    startingPrice: 12000,
    availability: 'Available',
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
    ],
    services: ['Plated Multi-Course Tasting', 'Gourmet Luxury Buffet', 'Chef Live Station / Carving Bar', 'Custom Drinks & Mixology Stand'],
    reviews: [
      { author: 'Babatunde Thomas', rating: 5, text: 'Unbelievable culinary experience. The beef short ribs with plantain purée were incredibly tender. A masterpiece!', date: '2026-06-15', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=100' }
    ],
    pricingTiers: [
      { name: 'Silver Buffet Plan', price: 12000, features: ['Per guest pricing', '2 mains (incl. Signature Jollof)', '3 proteins', '1 salad & small chops starter'] },
      { name: 'Epicurean Plated Tasting', price: 25000, features: ['Per guest pricing', '4-course plated table service', 'Live plating interactive setup'] }
    ],
    availableDates: ['2026-07-15', '2026-07-18', '2026-07-25', '2026-07-26']
  }
];

// In-Memory & Local Storage persistence manager for Demo Mode
const STORAGE_KEY = 'myday_birthday_plans';

import { collection, query, where, getDocs, setDoc, doc, deleteDoc, getDocFromServer, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './db_services';

// Validate Connection to Firestore as per the Firebase Integration Skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Could not reach Cloud Firestore backend'))) {
      console.warn("Please check your Firebase configuration. Client is offline.");
    } else {
      console.log("Firebase initialized and ready.");
    }
  }
}
testConnection();

// Fetch a single plan from Firestore by plan ID (used for shared invitations/summaries)
export const getFirestoreBirthdayPlan = async (planId: string): Promise<BirthdayPlan | null> => {
  try {
    const docRef = doc(db, 'birthday_plans', planId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as BirthdayPlan;
    }
    return null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `birthday_plans/${planId}`);
    return null;
  }
};

// Fetch plans from Firestore for the specific user
export const getFirestoreBirthdayPlans = async (userId: string): Promise<BirthdayPlan[]> => {
  try {
    const actualUid = auth.currentUser?.uid || userId;
    const q = query(collection(db, 'birthday_plans'), where('userId', '==', actualUid));
    const querySnapshot = await getDocs(q);
    const plans: BirthdayPlan[] = [];
    querySnapshot.forEach((docSnap) => {
      plans.push(docSnap.data() as BirthdayPlan);
    });
    return plans;
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'birthday_plans');
    throw e;
  }
};

// Save a single plan to Firestore
export const savePlanToFirestore = async (plan: BirthdayPlan): Promise<void> => {
  try {
    const activeUid = auth.currentUser?.uid || plan.userId;
    const planToSave = { ...plan, userId: activeUid };
    const docRef = doc(db, 'birthday_plans', planToSave.id);
    await setDoc(docRef, planToSave);
    console.log(`Plan ${planToSave.id} saved to Firestore with userId: ${activeUid}`);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `birthday_plans/${plan.id}`);
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
    handleFirestoreError(e, OperationType.DELETE, `birthday_plans/${planId}`);
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

// Save a vendor application to Firestore
export const saveVendorApplicationToFirestore = async (application: VendorApplication): Promise<void> => {
  try {
    const docRef = doc(db, 'vendorApplications', application.applicationId);
    await setDoc(docRef, application);
    console.log(`Vendor Application ${application.applicationId} saved to Firestore`);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `vendorApplications/${application.applicationId}`);
    throw e;
  }
};

// Fetch vendor applications from Firestore
export const getVendorApplicationsFromFirestore = async (): Promise<VendorApplication[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'vendorApplications'));
    const apps: VendorApplication[] = [];
    querySnapshot.forEach((docSnap) => {
      apps.push(docSnap.data() as VendorApplication);
    });
    return apps;
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'vendorApplications');
    return [];
  }
};

// Save a single invitation to Firestore
export const saveInvitationToFirestore = async (invitation: Invitation): Promise<void> => {
  try {
    const docRef = doc(db, 'invitations', invitation.invitationId);
    await setDoc(docRef, invitation);
    console.log(`Invitation ${invitation.invitationId} saved to Firestore`);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `invitations/${invitation.invitationId}`);
    throw e;
  }
};

// Fetch user's invitations from Firestore
export const getFirestoreInvitations = async (userId: string): Promise<Invitation[]> => {
  try {
    const q = query(collection(db, 'invitations'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const invitations: Invitation[] = [];
    querySnapshot.forEach((docSnap) => {
      invitations.push(docSnap.data() as Invitation);
    });
    return invitations;
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'invitations');
    throw e;
  }
};

// Fetch a single invitation from Firestore by ID
export const getFirestoreInvitation = async (invitationId: string): Promise<Invitation | null> => {
  try {
    const docRef = doc(db, 'invitations', invitationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Invitation;
    }
    return null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `invitations/${invitationId}`);
    return null;
  }
};


