/**
 * Static constants and helpers for premium Vendor Onboarding Flow
 */

export const VENDOR_CATEGORIES = [
  'Cake Vendor',
  'Decorator',
  'Photographer',
  'Videographer',
  'Restaurant',
  'Event Center',
  'MC',
  'DJ',
  'Live Band',
  'Caterer',
  'Makeup Artist',
  'Fashion Designer',
  'Gift Vendor',
  'Florist',
  'Balloon Artist',
  'Surprise Planner',
  'Luxury Picnic',
  'Event Planner',
  'Transportation',
  'Hotel',
  'Security',
  'Cleaning Services',
  'Other'
];

export const NIGERIAN_STATES = [
  'Kwara State',
  'Lagos State',
  'Abuja (FCT)',
  'Abia State',
  'Adamawa State',
  'Akwa Ibom State',
  'Anambra State',
  'Bauchi State',
  'Bayelsa State',
  'Benue State',
  'Borno State',
  'Cross River State',
  'Delta State',
  'Ebonyi State',
  'Edo State',
  'Ekiti State',
  'Enugu State',
  'Gombe State',
  'Imo State',
  'Jigawa State',
  'Kaduna State',
  'Kano State',
  'Katsina State',
  'Kebbi State',
  'Kogi State',
  'Nasarawa State',
  'Niger State',
  'Ogun State',
  'Ondo State',
  'Osun State',
  'Oyo State',
  'Plateau State',
  'Rivers State',
  'Sokoto State',
  'Taraba State',
  'Yobe State',
  'Zamfara State'
];

export const KWARA_CITIES = [
  'Ilorin',
  'Offa',
  'Omu-Aran',
  'Jebba',
  'Kaiama',
  'Lafiagi',
  'Share',
  'Patigi',
  'Other'
];

export const KWARA_LGAS = [
  'Ilorin West',
  'Ilorin East',
  'Ilorin South',
  'Asa',
  'Baruten',
  'Edu',
  'Ekiti',
  'Irepodun',
  'Isin',
  'Kaiama',
  'Moro',
  'Offa',
  'Oke Ero',
  'Oyun',
  'Pategi'
];

export const LANGUAGES_SPOKEN = [
  'English',
  'Yoruba',
  'Hausa',
  'Igbo',
  'Pidgin',
  'French',
  'Arabic',
  'Other'
];

export interface OnboardingFormState {
  applicationId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsapp: string;
  category: string;
  state: string;
  city: string;
  lga: string;
  address: string;
  googleMapsUrl: string;
  yearsInBusiness: number;
  description: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  website: string;
  logo: string;
  coverPhoto: string;
  cacNumber: string;
  languagesSpoken: string[];
  minPrice: string;
  maxPrice: string;
  avgPrice: string;
  govIdUrl: string;
  businessRegUrl: string;
  certificatesUrls: string[];
  verificationBadgeRequested: boolean;
  portfolioImages: string[];
  priceList: string;
  confirmAccurate: boolean;
  agreeTerms: boolean;
}

export const INITIAL_FORM_STATE: OnboardingFormState = {
  applicationId: '',
  businessName: '',
  ownerName: '',
  email: '',
  phone: '',
  whatsapp: '',
  category: 'Cake Vendor',
  state: 'Kwara State',
  city: 'Ilorin',
  lga: 'Ilorin West',
  address: '',
  googleMapsUrl: '',
  yearsInBusiness: 1,
  description: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  website: '',
  logo: '',
  coverPhoto: '',
  cacNumber: '',
  languagesSpoken: ['English'],
  minPrice: '',
  maxPrice: '',
  avgPrice: '',
  govIdUrl: '',
  businessRegUrl: '',
  certificatesUrls: [],
  verificationBadgeRequested: false,
  portfolioImages: [],
  priceList: '',
  confirmAccurate: false,
  agreeTerms: false
};
