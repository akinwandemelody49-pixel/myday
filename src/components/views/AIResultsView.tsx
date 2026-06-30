import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Calendar, Users, MapPin, DollarSign, Clock, ArrowLeft,
  Cake, Gift, Camera, Music, Scissors, Heart, Share2, Edit3, 
  CheckCircle, ChevronRight, AlertCircle, Info, Download, BookOpen,
  Check, Smile, HelpCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader, CardFooter } from '../ui/Card';
import { BirthdayPlan } from '../../types';

interface AIResultsViewProps {
  plan: BirthdayPlan;
  onSavePlan?: () => void;
  onEditPlan?: () => void;
  onBookVendors?: () => void;
  onSharePlan?: () => void;
  onBack: () => void;
  showNotification: (message: string) => void;
}

export const AIResultsView: React.FC<AIResultsViewProps> = ({
  plan,
  onSavePlan,
  onEditPlan,
  onBookVendors,
  onSharePlan,
  onBack,
  showNotification,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [bookedStatus, setBookedStatus] = useState(false);

  // Fallbacks for standard values
  const celebrantName = plan.celebrantName || 'Guest of Honor';
  const relationship = plan.relationship || 'Friend';
  const eventDate = plan.eventDate ? new Date(plan.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Scheduled Date';
  const budgetVal = plan.budget || 150000;
  const guestCount = plan.guestCount || 30;
  const city = plan.city || 'Lagos';

  // Currency Formatter
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Formatted percentages and exact calculations for custom CSS Budget Chart
  const budgetBreakdown = plan.budgetAllocation && plan.budgetAllocation.length > 0
    ? plan.budgetAllocation
    : [
        { name: 'Venue & Food', percentage: 40, cost: Math.round(budgetVal * 0.4) },
        { name: 'Cake & Treats', percentage: 12, cost: Math.round(budgetVal * 0.12) },
        { name: 'Decorations', percentage: 15, cost: Math.round(budgetVal * 0.15) },
        { name: 'Entertainment', percentage: 13, cost: Math.round(budgetVal * 0.13) },
        { name: 'Photography', percentage: 10, cost: Math.round(budgetVal * 0.1) },
        { name: 'Curated Gifts', percentage: 10, cost: Math.round(budgetVal * 0.1) }
      ];

  const handleShare = () => {
    if (onSharePlan) {
      onSharePlan();
    } else {
      setCopiedLink(true);
      navigator.clipboard.writeText(window.location.href);
      showNotification("Celebration plan link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleBook = () => {
    if (onBookVendors) {
      onBookVendors();
    } else {
      setBookedStatus(true);
      showNotification("Our luxury AI Concierge is connecting you with premium verified vendors!");
    }
  };

  // Recommended Timeline Sequence from Gemini Plan
  const timeline = plan.aiSuggestedItinerary && plan.aiSuggestedItinerary.length > 0
    ? plan.aiSuggestedItinerary.map((item, index) => {
        const icons = ['🥐', '💆', '🛍️', '🥂', '🎂', '🎻', '📸', '✨'];
        const icon = icons[index % icons.length];
        return {
          time: item.time,
          title: item.title,
          desc: `${item.description} (Duration: ${item.duration} | Location: ${item.location})`,
          icon: icon,
          cost: item.estimatedCost
        };
      })
    : [
        { time: '09:00 AM', title: 'Breakfast Surprise delivery', desc: 'A delightful warm breakfast delivery featuring artisanal butter croissants, fresh local berries, and a handwritten custom card.', icon: '🥐' },
        { time: '12:00 PM', title: 'Premium Pampering Experience', desc: 'A soothing 90-minute aromatherapy massage session at a highly rated local wellness lounge.', icon: '💆' },
        { time: '03:00 PM', title: 'Curated Boutique Styling Session', desc: 'A personal styling walk or private styling box reveal matching the birthday theme colors.', icon: '🛍️' },
        { time: '06:00 PM', title: 'Luxury Intimate Celebration Dinner', desc: 'A reserved custom-dressed table at a premium local bistro featuring a special tasting menu.', icon: '🥂' },
        { time: '08:00 PM', title: 'Candlelight Toasting & Cake Cutting', desc: 'A celebratory sparkler moment, customized toast speeches by friends, and cake cutting.', icon: '🎂' },
        { time: '09:00 PM', title: 'Live Acoustic Soul Cover Music', desc: 'Rounding off the elegant evening with custom playlist requests, champagne toast, and late-night snapshots.', icon: '🎻' }
      ];

  // Venue Concepts
  const mainVenueTitle = plan.venueIdeas && plan.venueIdeas[0]
    ? plan.venueIdeas[0].split(' - ')[0]
    : 'The Glasshouse Pavilion & Terrace';
  const mainVenueDesc = plan.venueIdeas && plan.venueIdeas[0]
    ? (plan.venueIdeas[0].split(' - ')[1] || plan.venueIdeas[0])
    : 'A beautiful premium glass-walled greenhouse venue featuring hanging botanical arrangements, cozy lounge sets, amber fairy lights, and standard exquisite catering service perfect for birthday milestone moments.';
  const alternativeVenues = plan.venueIdeas && plan.venueIdeas.slice(1);

  // Cake Suggestions
  const mainCakeTitle = plan.cakeIdeas && plan.cakeIdeas[0]
    ? plan.cakeIdeas[0]
    : 'Gold-Leaf Caramel Buttercream Cake';
  const mainCakeDesc = plan.cakeIdeas && plan.cakeIdeas[1]
    ? `Suggested styles/designs: ${plan.cakeIdeas.slice(1).join(', ')}`
    : 'A premium handcrafted 3-tier Madagascan vanilla cake infused with salted caramel ganache, edible gold leaf accents, and styled custom sparkler displays.';

  // Curated Gifts
  const defaultGifts = [
    {
      name: 'Chronograph Classic Watch',
      price: Math.round(budgetVal * 0.1),
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=250',
      desc: 'A beautiful minimalist face watch perfect for everyday luxury.'
    },
    {
      name: 'Noise-Cancelling Sleek Headphones',
      price: Math.round(budgetVal * 0.08),
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=250',
      desc: 'Immersive soundscapes with elegant custom leather headband.'
    },
    {
      name: 'Oud Noir Signature Fragrance',
      price: Math.round(budgetVal * 0.05),
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=250',
      desc: 'Notes of dark leather, warm spices, and Madagascar vanilla.'
    }
  ];

  const renderedGifts = plan.giftRecommendations && plan.giftRecommendations.length > 0
    ? plan.giftRecommendations.map((giftStr, idx) => {
        const defaultImages = [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=250',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=250',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=250'
        ];
        return {
          name: giftStr.split(' - ')[0] || giftStr,
          price: Math.round(budgetVal * (idx === 0 ? 0.1 : idx === 1 ? 0.08 : 0.05)),
          image: defaultImages[idx % defaultImages.length],
          desc: giftStr.split(' - ')[1] || 'Exquisitely handpicked for the celebrant.'
        };
      })
    : defaultGifts;

  // Decorations
  const mainDecorTitle = plan.decorationIdeas && plan.decorationIdeas[0]
    ? plan.decorationIdeas[0]
    : 'Amber & Botanical Elegance Theme';
  const mainDecorDesc = plan.decorationIdeas && plan.decorationIdeas.length > 1
    ? `Thematic design elements: ${plan.decorationIdeas.slice(1).join(', ')}`
    : 'Includes beautiful natural eucalyptus foliage runners, ivory block candles, amber uplighting panels, and dynamic gold foil balloon lettering spelling custom celebratory words.';

  // Photography
  const mainPhotoTitle = plan.photographyIdeas && plan.photographyIdeas[0]
    ? plan.photographyIdeas[0]
    : 'Aura Cinematic Storytellers';
  const mainPhotoDesc = plan.photographyIdeas && plan.photographyIdeas.length > 1
    ? `Creative capture details: ${plan.photographyIdeas.slice(1).join(', ')}`
    : 'High-contrast retouch logs & drone coverage';

  // Entertainment
  const mainEntertainmentTitle = plan.entertainmentIdeas && plan.entertainmentIdeas[0]
    ? plan.entertainmentIdeas[0]
    : 'Harmonix Ambient Keyboard';
  const mainEntertainmentDesc = plan.entertainmentIdeas && plan.entertainmentIdeas.length > 1
    ? `Suggested musical combinations: ${plan.entertainmentIdeas.slice(1).join(', ')}`
    : 'Acoustic Pop Covers & Jazz DJ Set';

  // Helpful Planning Tips
  const renderedTips = plan.helpfulPlanningTips && plan.helpfulPlanningTips.length > 0
    ? plan.helpfulPlanningTips
    : [
        'Invitation timeline: Send premium digital invites out exactly 14 days prior to build anticipation and secure accurate guest response numbers.',
        'Secret Cues: Coordinate a signal with the caterer to sync table lighting dim, background music volume, and custom cake sparkler entry perfectly.',
        'Guest Capture QR: Display a sleek printed QR code sign at the venue entrance. Guests can scan and instantly upload candid snaps to a shared memory board.'
      ];

  return (
    <div id="ai-birthday-results-root" className="max-w-4xl mx-auto px-4 py-8 font-sans bg-[#FAFAFA]">
      
      {/* Back to Hub Header Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-neutral-700 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>
        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#F4B400]" />
          AI Orchestration Completed
        </span>
      </div>

      {/* Hero Welcome Badge & Heading */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center space-x-2 bg-[#6C4CF1]/8 border border-[#6C4CF1]/10 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-[#6C4CF1] tracking-wide uppercase">
          <Sparkles className="w-4 h-4 text-[#F4B400] shrink-0" />
          <span>Exclusive Concierge Curation</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-neutral-800">
          Your Personalized Birthday Plan
        </h1>
        <p className="text-xs md:text-sm text-neutral-400 font-light max-w-xl mx-auto leading-relaxed">
          Crafted with love for <span className="text-[#6C4CF1] font-semibold">{celebrantName}</span> ({relationship}). Here is an elite, fully conceptualized experience tailored perfectly around your aesthetic vision, budget limits, and personal style requests.
        </p>
      </div>

      {/* Celebration Summary accent banner */}
      {(plan.celebrationSummary || plan.themeDescription) && (
        <div className="mb-10 p-6 bg-gradient-to-r from-[#6C4CF1]/5 to-transparent border-l-4 border-[#6C4CF1] rounded-r-2xl">
          <h4 className="text-xs font-mono uppercase tracking-widest text-[#6C4CF1] font-bold mb-1">Celebration Summary</h4>
          <p className="text-xs md:text-sm text-neutral-600 font-light leading-relaxed">
            {plan.celebrationSummary || plan.themeDescription}
          </p>
        </div>
      )}

      {/* Grid of Sections */}
      <div className="space-y-8">
        
        {/* 1. Celebration Summary Section */}
        <div id="section-celebration-summary">
          <Card variant="luxury" className="bg-white overflow-hidden rounded-3xl border border-neutral-100/80 shadow-md">
            <div className="bg-gradient-to-r from-[#6C4CF1]/5 via-[#6C4CF1]/2 to-transparent px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-neutral-700 flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-[#6C4CF1]" />
                1. Celebration Parameters
              </h3>
              <span className="text-[9px] font-mono uppercase font-bold text-neutral-400">Metadata Sync</span>
            </div>
            <CardBody className="p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Celebrant / Relationship</span>
                <p className="text-sm font-extrabold text-neutral-800 leading-tight truncate">{celebrantName}</p>
                <p className="text-[10px] text-neutral-400 leading-none">Your {relationship}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Date & Location</span>
                <p className="text-sm font-extrabold text-neutral-800 leading-tight">{eventDate}</p>
                <p className="text-[10px] text-neutral-400 leading-none">Scheduled for {city}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Assigned Budget</span>
                <p className="text-sm font-extrabold text-[#F4B400] leading-tight font-mono">{formatNaira(budgetVal)}</p>
                <p className="text-[10px] text-neutral-400 leading-none">Naira Currency Tier</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Invited Guests</span>
                <p className="text-sm font-extrabold text-neutral-800 leading-tight">{guestCount} Expected Guests</p>
                <p className="text-[10px] text-neutral-400 leading-none">Intimate capacity scope</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Layout with Sideboards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main 2-Column Section */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 2. AI Recommended Timeline */}
            <div id="section-ai-timeline" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-xl text-neutral-800 tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#6C4CF1]" />
                  2. AI Recommended Timeline
                </h2>
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest bg-neutral-100 px-2 py-0.5 rounded">Hourly Log</span>
              </div>
              
              <Card className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-100 shadow-xs">
                <div className="relative border-l border-neutral-100 ml-3 space-y-6">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="relative pl-8 group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[14px] top-1 w-7 h-7 rounded-full bg-white border border-neutral-150 flex items-center justify-center text-xs shadow-2xs group-hover:border-[#6C4CF1]/30 group-hover:scale-105 transition-all">
                        {item.icon}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-[#6C4CF1] bg-[#6C4CF1]/5 border border-[#6C4CF1]/10 px-2 py-0.5 rounded">
                          {item.time}
                        </span>
                        <h4 className="text-xs font-bold text-neutral-800 mt-1">{item.title}</h4>
                        <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 3. Venue Recommendation */}
            <div id="section-venue" className="space-y-4">
              <h2 className="font-display font-black text-xl text-neutral-800 tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#6C4CF1]" />
                3. Premium Venue Recommendation
              </h2>
              <Card className="bg-white overflow-hidden rounded-3xl border border-neutral-100 shadow-xs group hover:shadow-sm transition-all">
                <div className="h-48 md:h-56 overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600" 
                    alt="Glasshouse Event Venue"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent flex items-end p-5">
                    <div>
                      <span className="text-[8px] font-mono font-bold bg-[#F4B400] text-neutral-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ★ Concierge Pick
                      </span>
                      <h4 className="text-white text-base font-bold mt-1">{mainVenueTitle}</h4>
                    </div>
                  </div>
                </div>
                <CardBody className="p-6 space-y-4">
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    {mainVenueDesc}
                  </p>
                  
                  {alternativeVenues && alternativeVenues.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-neutral-100/50 space-y-1">
                      <span className="block text-[9px] font-mono uppercase text-neutral-400 font-bold">Alternative Venues Considered:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {alternativeVenues.map((v, i) => (
                          <li key={i} className="text-[10px] text-neutral-400 font-light">{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-400 uppercase">Estimated Venue Cost</span>
                      <span className="text-xs font-bold text-[#F4B400] font-mono">{formatNaira(Math.round(budgetVal * 0.3))}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => showNotification("Redirecting to exclusive Venue booking partner portal...")}
                      rightIcon={<ChevronRight className="w-3 h-3" />}
                    >
                      View Details
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* 3b. Restaurant Suggestions */}
            {plan.restaurantSuggestions && plan.restaurantSuggestions.length > 0 && (
              <div id="section-restaurants" className="space-y-4">
                <h2 className="font-display font-black text-xl text-neutral-800 tracking-tight flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#6C4CF1]" />
                  3b. Elite Restaurant Suggestions
                </h2>
                <Card className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plan.restaurantSuggestions.map((restaurant, idx) => (
                      <div key={idx} className="p-4 bg-neutral-50/50 rounded-xl border border-neutral-100/60 flex flex-col justify-between">
                        <div className="flex items-start gap-2">
                          <span className="text-base shrink-0 mt-0.5">🍽️</span>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-800 leading-tight">{restaurant.split(' - ')[0]}</h4>
                            <p className="text-[10px] text-neutral-400 font-light leading-normal mt-1">
                              {restaurant.split(' - ')[1] || 'A premium culinary layout tailored for high-end dining expectations.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* 4. Cake Recommendation */}
            <div id="section-cake" className="space-y-4">
              <h2 className="font-display font-black text-xl text-neutral-800 tracking-tight flex items-center gap-2">
                <Cake className="w-5 h-5 text-[#6C4CF1]" />
                4. Bespoke Cake Suggestion
              </h2>
              <Card className="bg-white overflow-hidden rounded-3xl border border-neutral-100 shadow-xs flex flex-col md:flex-row group">
                <div className="md:w-1/3 h-40 md:h-auto overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400" 
                    alt="Premium cake"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="md:w-2/3 p-6 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-[#6C4CF1] bg-[#6C4CF1]/5 border border-[#6C4CF1]/10 px-2.5 py-0.5 rounded-full uppercase font-bold">
                      Artisan Bakery Partner
                    </span>
                    <h4 className="text-sm font-bold text-neutral-800 pt-1">{mainCakeTitle}</h4>
                    <p className="text-[11px] text-neutral-500 font-light mt-2 leading-relaxed">
                      {mainCakeDesc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4">
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-400 uppercase">Estimated Cake Cost</span>
                      <span className="text-xs font-bold text-neutral-800 font-mono">{formatNaira(Math.round(budgetVal * 0.1))}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5" /> Order Available
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* 5. Gift Ideas Section */}
            <div id="section-gifts" className="space-y-4">
              <h2 className="font-display font-black text-xl text-neutral-800 tracking-tight flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#6C4CF1]" />
                5. Curated Gift Suggestions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderedGifts.map((gift, index) => (
                  <Card key={index} className="bg-white overflow-hidden rounded-2xl border border-neutral-100 shadow-xs flex flex-col justify-between group animate-fadeIn">
                    <div className="h-36 overflow-hidden">
                      <img 
                        src={gift.image} 
                        alt={gift.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-4 space-y-2.5 flex-grow flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-neutral-800 leading-snug">{gift.name}</h5>
                        <p className="text-[10px] text-neutral-400 mt-1 leading-normal font-light">{gift.desc}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                        <span className="text-[10px] font-mono font-bold text-[#6C4CF1]">{formatNaira(gift.price)}</span>
                        <button 
                          onClick={() => showNotification(`Added ${gift.name} to planning checklist.`)}
                          className="text-[9px] font-mono uppercase font-bold text-neutral-400 hover:text-[#6C4CF1] transition-colors cursor-pointer"
                        >
                          Add List +
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>

          {/* Sideboards / Details Column (Budget breakdown, decorations, photography, tips) */}
          <div className="space-y-8">
            
            {/* 9. Budget Breakdown Visual Chart */}
            <div id="section-budget-breakdown" className="space-y-4">
              <h3 className="font-display font-black text-lg text-neutral-800 tracking-tight flex items-center gap-1.5">
                <DollarSign className="w-5 h-5 text-[#6C4CF1]" />
                9. Budget Breakdown
              </h3>
              <Card className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-5">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Total Celebration Budget</span>
                  <p className="text-2xl font-black text-neutral-800 font-mono mt-0.5">{formatNaira(budgetVal)}</p>
                </div>

                {/* Custom CSS Bars Chart */}
                <div className="space-y-3.5">
                  {budgetBreakdown.map((item, idx) => {
                    const exactCost = item.cost || Math.round(budgetVal * (item.percentage / 100));
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-neutral-700 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.percentage > 30 ? '#6C4CF1' : item.percentage > 13 ? '#F4B400' : '#10B981' }} />
                            {item.name}
                          </span>
                          <span className="font-mono text-neutral-400">({item.percentage}%) <b className="text-neutral-800 font-bold">{formatNaira(exactCost)}</b></span>
                        </div>
                        <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.percentage > 30 ? '#6C4CF1' : item.percentage > 13 ? '#F4B400' : '#10B981' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-[10px] text-neutral-400 font-light leading-normal">
                  Values are calculated based on premium local vendor metrics and estimated delivery fees.
                </div>
              </Card>
            </div>

            {/* 6. Decorations */}
            <div id="section-decorations" className="space-y-4">
              <h3 className="font-display font-black text-lg text-neutral-800 tracking-tight flex items-center gap-1.5">
                <Scissors className="w-5 h-5 text-[#6C4CF1]" />
                6. Premium Decorations
              </h3>
              <Card className="bg-white overflow-hidden rounded-2xl border border-neutral-100 shadow-xs group">
                <div className="h-32 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=400" 
                    alt="Gold decorations and sparklers"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4 space-y-1.5">
                  <h4 className="text-xs font-bold text-neutral-800">{mainDecorTitle}</h4>
                  <p className="text-[10px] text-neutral-500 leading-normal font-light">
                    {mainDecorDesc}
                  </p>
                </div>
              </Card>
            </div>

            {/* 7. Photography */}
            <div id="section-photography" className="space-y-4">
              <h3 className="font-display font-black text-lg text-neutral-800 tracking-tight flex items-center gap-1.5">
                <Camera className="w-5 h-5 text-[#6C4CF1]" />
                7. Photography Partner
              </h3>
              <Card className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs flex items-center space-x-3.5 group">
                <img 
                  src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=200" 
                  alt="Photography lens"
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-neutral-800">{mainPhotoTitle}</h4>
                  <p className="text-[9px] text-[#6C4CF1] font-bold">Recommended Capture Package</p>
                  <p className="text-[9px] text-neutral-400 truncate mt-0.5">{mainPhotoDesc}</p>
                </div>
              </Card>
            </div>

            {/* 8. Entertainment */}
            <div id="section-entertainment" className="space-y-4">
              <h3 className="font-display font-black text-lg text-neutral-800 tracking-tight flex items-center gap-1.5">
                <Music className="w-5 h-5 text-[#6C4CF1]" />
                8. Selected Entertainment
              </h3>
              <Card className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs flex items-center space-x-3.5 group">
                <img 
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200" 
                  alt="Music microphone"
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-neutral-800">{mainEntertainmentTitle}</h4>
                  <p className="text-[10px] text-emerald-600 font-bold">Recommended Entertainment Choice</p>
                  <p className="text-[9px] text-neutral-400 truncate mt-0.5">{mainEntertainmentDesc}</p>
                </div>
              </Card>
            </div>

            {/* 10. AI Tips for Celebration */}
            <div id="section-ai-tips" className="space-y-4">
              <h3 className="font-display font-black text-lg text-neutral-800 tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-[#F4B400]" />
                10. Professional AI Tips
              </h3>
              <Card className="bg-[#6C4CF1]/2 border border-[#6C4CF1]/10 p-5 rounded-2xl space-y-3.5">
                {renderedTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <span className="text-xs bg-white text-[#6C4CF1] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-3xs mt-0.5">{index + 1}</span>
                    <p className="text-[10px] text-neutral-600 leading-normal font-light">
                      {tip}
                    </p>
                  </div>
                ))}
              </Card>
            </div>

            {/* 10b. Custom Surprise Elements */}
            {plan.surpriseIdeas && plan.surpriseIdeas.length > 0 && (
              <div id="section-surprises" className="space-y-4">
                <h3 className="font-display font-black text-lg text-neutral-800 tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-[#F4B400]" />
                  10b. Sweet Surprise Elements
                </h3>
                <Card className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-xs space-y-3">
                  {plan.surpriseIdeas.map((surprise, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 animate-fadeIn">
                      <span className="text-xs bg-[#F4B400]/10 text-[#F4B400] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">🎁</span>
                      <p className="text-[10px] text-neutral-600 leading-normal font-light">
                        {surprise}
                      </p>
                    </div>
                  ))}
                </Card>
              </div>
            )}

          </div>

        </div>

        {/* 11. Bottom Luxury Action Controls Section */}
        <div id="section-actions" className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 pb-12">
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onBack}
              className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition-colors py-3 px-4 rounded-xl hover:bg-neutral-50 cursor-pointer"
            >
              Back
            </button>
            {onEditPlan && (
              <button
                onClick={onEditPlan}
                className="text-xs font-mono font-bold uppercase tracking-wider text-[#6C4CF1] hover:text-[#5B3ED6] transition-colors py-3 px-4 rounded-xl hover:bg-[#6C4CF1]/5 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                Edit Plan
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              onClick={handleShare}
              className="px-5 py-3 rounded-xl text-xs uppercase tracking-wider border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-800 flex items-center justify-center space-x-2 bg-white"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'Copied!' : 'Share Plan'}</span>
            </Button>
            
            {onSavePlan && (
              <Button
                variant="secondary"
                onClick={() => {
                  onSavePlan();
                  showNotification("Celebration plan successfully written & synced to Firestore!");
                }}
                className="px-5 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 bg-white border border-neutral-200"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Save to Account</span>
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleBook}
              disabled={bookedStatus}
              className="bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-[#6C4CF1]/10 flex items-center justify-center space-x-2 cursor-pointer transition-all duration-300"
              rightIcon={<Sparkles className="w-4 h-4 text-[#F4B400] animate-pulse" />}
            >
              <span>{bookedStatus ? 'Vendors Contacted!' : 'Book Premium Vendors'}</span>
            </Button>
          </div>

        </div>

      </div>

    </div>
  );
};
