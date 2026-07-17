/**
 * Reusable type definitions for MyDay Birthday Planning Platform
 */

export type EventVibe = 'elegant' | 'modern' | 'casual' | 'vibrant' | 'luxurious' | 'cozy' | 'adventurous';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string;
  role?: 'customer' | 'vendor' | 'admin';
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string;
  duration: string; // e.g. "2 hours"
  location: string;
  estimatedCost: number;
}

export interface VendorReview {
  author: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
}

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
}

export interface Vendor {
  id: string;
  name: string;
  category: string; // Flexible to support custom marketplace categories
  rating: number;
  reviewsCount: number;
  priceRange: 'low' | 'medium' | 'high' | 'luxury';
  imageUrl: string;
  location: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string; // Business Logo
  startingPrice?: number; // Starting Price
  availability?: string; // E.g. "Available", "Booked", "Weekends Only"
  isVerified?: boolean; // Verified Badge
  gallery?: string[]; // Gallery images
  services?: string[]; // Services list
  reviews?: VendorReview[]; // Detailed Reviews
  pricingTiers?: PricingTier[]; // Pricing tiers
  availableDates?: string[]; // Dates for Calendar
}

export interface BirthdayPlan {
  id: string;
  userId: string;
  celebrantName: string;
  age: number;
  eventDate: string;
  budget: number;
  guestCount: number;
  vibe: EventVibe;
  interests: string[];
  themeTitle?: string;
  themeDescription?: string;
  aiSuggestedItinerary?: ItineraryItem[];
  selectedVendors?: { [category: string]: string }; // category -> vendorId
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'planning' | 'booked' | 'completed';

  // Premium Multi-step Planner Custom Fields
  relationship?: string;
  city?: string;
  budgetRange?: string;
  celebrationStyles?: string[];
  additionalDetails?: string;

  // Rich AI-Generated Plan Fields
  celebrationSummary?: string;
  venueIdeas?: string[];
  cakeIdeas?: string[];
  restaurantSuggestions?: string[];
  decorationIdeas?: string[];
  photographyIdeas?: string[];
  entertainmentIdeas?: string[];
  giftRecommendations?: string[];
  surpriseIdeas?: string[];
  budgetAllocation?: { name: string; percentage: number; cost: number }[];
  helpfulPlanningTips?: string[];
}

export interface AIPlanRequest {
  celebrantName: string;
  age: number;
  eventDate: string;
  budget: number;
  guestCount: number;
  vibe: EventVibe;
  interests: string[];
}

export interface VendorApplication {
  applicationId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsapp: string;
  category: string;
  state: string;
  city: string;
  lga?: string; // Local Government Area
  address: string;
  yearsInBusiness: number;
  description: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  website?: string;
  logo: string;
  coverPhoto?: string; // New: cover photo url
  cacNumber?: string; // New: CAC registration number
  languagesSpoken?: string[]; // New: languages spoken list
  minPrice?: number; // New: pricing info
  maxPrice?: number; // New: pricing info
  avgPrice?: number; // New: pricing info
  govIdUrl?: string; // New: trust & verification document
  businessRegUrl?: string; // New: trust & verification document
  certificatesUrls?: string[]; // New: trust & verification document
  verificationBadgeRequested?: boolean; // New: custom request
  portfolioImages: string[];
  priceList?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
}

export interface Invitation {
  invitationId: string;
  userId: string;
  birthdayPlanId: string;
  template: string;
  title: string;
  guestName?: string;
  eventDate?: string;
  venue?: string;
  theme?: string;
  imageUrl: string;
  pdfUrl: string;
  createdAt: string;
  updatedAt: string;
  message: string;
  designSettings: {
    bgColor: string;
    fontColor: string;
    fontFamily: string;
    borderStyle: string;
    fontSize: number;
    backgroundImage: string;
    patterns: string;
    shapes: string;
    showBalloons: boolean;
    showFlowers: boolean;
    showConfetti: boolean;
    showCake: boolean;
    showAfricanDecor: boolean;
    decorations: string[];
    photoCropX: number;
    photoCropY: number;
    photoScale: number;
    photoRotate: number;
  };
  eventDetails: {
    birthdayName: string;
    age: string;
    eventDate: string;
    eventTime: string;
    venue: string;
    dressCode: string;
    theme: string;
    hostName: string;
    rsvpPhone: string;
    specialMessage: string;
  };
  config?: {
    birthdayName: string;
    age: string;
    eventTime: string;
    dressCode: string;
    rsvpPhone: string;
    specialMessage: string;
    hostName: string;
    style: string;
    wording: string;
    bgColor: string;
    fontColor: string;
    fontFamily: string;
    borderStyle: string;
    celebrantPhotoUrl?: string;
    photoCropX?: number;
    photoCropY?: number;
    photoScale?: number;
    showBalloons: boolean;
    showFlowers: boolean;
    showConfetti: boolean;
    showCake: boolean;
    showAfricanDecor: boolean;
  };
}


