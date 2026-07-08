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

export interface Vendor {
  id: string;
  name: string;
  category: 'venue' | 'catering' | 'decor' | 'entertainment' | 'photography' | 'gifts' | 'baking';
  rating: number;
  reviewsCount: number;
  priceRange: 'low' | 'medium' | 'high' | 'luxury';
  imageUrl: string;
  location: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
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
  address: string;
  yearsInBusiness: number;
  description: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  website?: string;
  logo: string;
  portfolioImages: string[];
  priceList?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
}

