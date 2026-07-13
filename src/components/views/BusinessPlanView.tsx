import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, TrendingUp, Target, Users, Layers, DollarSign, 
  CheckCircle2, ArrowRight, BookOpen, Briefcase, Award, 
  Compass, LineChart, HelpCircle, Lightbulb, Tv, FileText, 
  Calculator, Coins, Building, ChevronLeft, ChevronRight, Play
} from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { SectionContainer } from '../ui/SectionContainer';
import { Button } from '../ui/Button';

export const BusinessPlanView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'deck' | 'document'>('deck');
  const [currentSlide, setCurrentSlide] = useState(0);

  // ROI / Market Estimator States
  const [population, setPopulation] = useState(15000000); // Default: Lagos-scale (15M)
  const [penetration, setPenetration] = useState(1.5); // 1.5% target penetration
  const [averageSpend, setAverageSpend] = useState(150000); // 150,000 NGN or equivalent local currency unit (~$100 - $200)
  const [commissionRate, setCommissionRate] = useState(10); // 10% commission fee

  // Market Calculations
  const totalAnnualBirthdays = population; // Since everyone has 1 birthday per year
  const targetMarketSize = Math.round(totalAnnualBirthdays * (penetration / 100));
  const totalTransactionVolume = targetMarketSize * averageSpend;
  const projectRevenue = Math.round(totalTransactionVolume * (commissionRate / 100));

  const slides = [
    {
      id: 'title',
      title: 'MyDay',
      subtitle: 'Celebrating Life\'s Most Meaningful Moments',
      tagline: 'AI-Powered Celebration Planning Platform',
      icon: <Sparkles className="w-16 h-16 text-[#F4B400] animate-pulse" />,
      bgImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
      bullets: [
        'An intelligent birthday concierge transforming planning stress into seamless experiences.',
        'Initial laser-focus on birthdays—the ultimate high-frequency, recurring celebration market.',
        'Scalable expansion blueprint spanning life milestones, weddings, and corporate celebrations across Africa.'
      ],
      quote: "MyDay isn't building an event marketplace. We're building the infrastructure for celebrating life's most meaningful moments—starting with birthdays, and growing into every occasion that brings people together."
    },
    {
      id: 'problem',
      title: 'The Birthday Problem',
      subtitle: 'Why celebration planning is unnecessarily stressful',
      icon: <HelpCircle className="w-10 h-10 text-rose-500" />,
      bullets: [
        '💡 Ineffective Directory Search: Users search endlessly across disjointed platforms, with no concept coordination beyond cake and dinner.',
        '⏱️ Fragmentation & Overhead: Sifting through, negotiating with, and booking dozens of unverified vendors is extremely time-consuming.',
        '💸 Budget Creep & Last-Minute Friction: Poor coordination causes ballooning costs and high operational anxiety.',
        '💔 Absence of Personalization: Standard solutions miss the emotional target, resulting in formulaic, uninspiring celebrations.'
      ]
    },
    {
      id: 'solution',
      title: 'The Intelligent Concierge',
      subtitle: 'How MyDay transforms celebrations',
      icon: <Award className="w-10 h-10 text-[#6C4CF1]" />,
      bullets: [
        '🤖 Core AI Planning Engine: Beautifully orchestrates a comprehensive, hour-by-hour timeline based on unique recipient profiles, preferences, and vibes.',
        '✨ Unified Experiences over Directories: Instead of booking isolated cake, decor, and photography services, MyDay serves a unified celebration concept.',
        '🎂 Vetted Premium Network: Hand-curates matching boutique bakeries, Michelin-standard gastropubs, covert surprise actors, and elite visual storytellers.',
        '🔒 Covert Surprise Operations: Engineered private invitation feeds and silent scheduling triggers to preserve magic until the exact reveal.'
      ]
    },
    {
      id: 'strategy',
      title: 'Strategic Entry: Birthdays First',
      subtitle: 'The ultimate high-frequency, predictable market segment',
      icon: <Target className="w-10 h-10 text-[#F4B400]" />,
      bullets: [
        '🔁 Predictable, Infinite Demand: Unlike weddings (once-in-a-lifetime), birthdays recur annually with exceptional customer loyalty and lifetime value.',
        '⚡ Low Operational Complexity: Shorter planning cycles allow for quick client onboarding, rapid local database scale, and rapid capital rotation.',
        '📈 Organic Network Effects: Every invitee and guest attending a MyDay celebration experiences the brand firsthand, acting as direct referrals.',
        '🏆 Trust Foundation: Perfecting birthdays builds the ultimate vendor network, localized logistics, and customer trust required for massive event categories.'
      ]
    },
    {
      id: 'expansion',
      title: 'Future Milestone Horizons',
      subtitle: 'Our long-term blueprint to dominate Africa\'s celebration market',
      icon: <Compass className="w-10 h-10 text-teal-500" />,
      bullets: [
        '🎯 Phase 1 (Initial Core): High-frequency Birthdays, personalized surprise frameworks, and localized baker/decor partnerships.',
        '💖 Phase 2 (Intimate Occasions): Milestone anniversaries, custom romantic proposals, bridal showers, and premium baby showers.',
        '⛪ Phase 3 (Grand Ceremonies): Large-scale premium weddings, bespoke engagement parties, and housewarming experiences.',
        '🏢 Phase 4 (Corporate Experiences): Employee milestone celebrations, awards gala nights, products launch events, and high-vibe team retreats.'
      ]
    },
    {
      id: 'market',
      title: 'Target Market Curation',
      subtitle: 'Reaching premium consumers with high disposable income',
      icon: <Users className="w-10 h-10 text-[#6C4CF1]" />,
      bullets: [
        '💼 Primary Focus: Young professionals (aged 20–40) who deeply value convenience, unique social experiences, and seamless execution but lack coordination time.',
        '👩‍❤️‍👨 Secondary Focus: Devoted partners planning luxury romantic milestones, families celebrating grandparents, and high-performing friends co-funding experiences.',
        '🏢 Corporate Segments: Innovative tech start-ups and multinational firms seeking automated, highly stylized employee birthday and anniversary plans.'
      ]
    },
    {
      id: 'monetization',
      title: 'The Revenue Engine',
      subtitle: 'Scalable monetization streams with clear value delivery',
      icon: <Coins className="w-10 h-10 text-emerald-500" />,
      bullets: [
        '💰 Vendor Booking Commission: Dynamic 10-15% margin on all integrated creative bookings (cakes, venues, florists, musicians).',
        '⭐ Featured Listings & Partner Placements: Promotional sponsorship slots for verified premium vendors seeking top-tier exposure.',
        '🎟️ Experience Package Markups: Curated pre-negotiated lifestyle celebration templates sold at a premium.',
        '🤵 Concierge Planning Fees: Specialized tier-based charges for users requesting premium 1-on-1 human planner support and custom physical assets.'
      ]
    }
  ];

  const handleNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <SectionContainer id="business-plan-view" className="py-6 font-sans">
      
      {/* View Header with Mode Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-100 dark:border-neutral-850 pb-5 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-[#6C4CF1] dark:text-[#8B73FF] mb-1.5">
            <Sparkles className="w-4 h-4 text-[#F4B400]" />
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold bg-[#6C4CF1]/10 dark:bg-[#8B73FF]/15 px-2.5 py-0.5 rounded-full text-[#6C4CF1] dark:text-[#8B73FF]">Pitch Room</span>
          </div>
          <h2 className="text-xl md:text-2xl font-display font-black tracking-tight text-neutral-800 dark:text-neutral-100">
            MyDay Business Plan & Pitch Blueprint
          </h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light max-w-2xl mt-0.5">
            Explore our foundational vision, high-growth expansion strategy, and financial modeling as the future leader in celebratory milestone planning.
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 p-1 rounded-xl mt-4 md:mt-0 self-start">
          <button
            onClick={() => setViewMode('deck')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'deck' 
                ? 'bg-white dark:bg-neutral-800 text-[#6C4CF1] dark:text-[#8B73FF] shadow-xs' 
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Interactive Slide Deck</span>
          </button>
          <button
            onClick={() => setViewMode('document')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'document' 
                ? 'bg-white dark:bg-neutral-800 text-[#6C4CF1] dark:text-[#8B73FF] shadow-xs' 
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Editorial Document</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'deck' ? (
          <motion.div
            key="deck-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Interactive Slide Viewer Left (8 cols) */}
            <div className="lg:col-span-8 flex flex-col justify-between bg-white dark:bg-[#030303] border border-neutral-100 dark:border-neutral-800/80 rounded-3xl p-6 md:p-8 min-h-[460px] shadow-sm relative overflow-hidden">
              
              {/* Slide decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6C4CF1]/10 to-transparent dark:from-[#8B73FF]/15 rounded-full blur-xl"></div>
              
              {/* Header inside Slide */}
              <div className="flex items-center justify-between z-10 border-b border-neutral-50 dark:border-neutral-800/50 pb-4 mb-4">
                <span className="text-[10px] font-mono font-bold text-[#6C4CF1] dark:text-[#8B73FF] tracking-widest uppercase">
                  Slide {currentSlide + 1} of {slides.length}
                </span>
                <span className="text-[9px] font-mono bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 px-2.5 py-0.5 rounded-md font-bold border border-neutral-200/10">
                  {slides[currentSlide].id.toUpperCase()}
                </span>
              </div>

              {/* Slide Body Content */}
              <div className="my-auto z-10 space-y-5">
                {slides[currentSlide].id === 'title' ? (
                  /* Title Slide Layout */
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      {slides[currentSlide].icon}
                      <div>
                        <h3 className="text-3xl md:text-4xl font-display font-black tracking-tight text-neutral-800 dark:text-neutral-100">
                          {slides[currentSlide].title}
                        </h3>
                        <p className="text-md text-[#6C4CF1] dark:text-[#8B73FF] font-semibold tracking-wide">
                          {slides[currentSlide].subtitle}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-mono text-[#F4B400] tracking-widest font-extrabold uppercase bg-[#F4B400]/5 dark:bg-[#F4B400]/10 px-3 py-1 rounded-lg inline-block">
                      {slides[currentSlide].tagline}
                    </p>
                    <div className="space-y-2.5 mt-4">
                      {slides[currentSlide].bullets.map((b, i) => (
                        <div key={i} className="flex items-start space-x-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                          <CheckCircle2 className="w-4 h-4 text-[#6C4CF1] dark:text-[#8B73FF] shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                    {slides[currentSlide].quote && (
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-900/35 rounded-2xl border border-neutral-100/50 dark:border-neutral-800/40 mt-4">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic font-light leading-relaxed">
                          "{slides[currentSlide].quote}"
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Slide Layout */
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        {slides[currentSlide].icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-black tracking-tight text-neutral-800 dark:text-neutral-100 leading-none">
                          {slides[currentSlide].title}
                        </h3>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light mt-1.5">
                          {slides[currentSlide].subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 mt-6">
                      {slides[currentSlide].bullets.map((bullet, idx) => (
                        <div 
                          key={idx}
                          className="p-4 bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 border border-neutral-100/60 dark:border-neutral-800 rounded-2xl transition-all duration-300 flex items-start space-x-3"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#6C4CF1]/8 dark:bg-[#8B73FF]/15 flex items-center justify-center shrink-0 text-[10px] font-mono font-bold text-[#6C4CF1] dark:text-[#8B73FF] mt-0.5">
                            {idx + 1}
                          </div>
                          <span className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                            {bullet}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between border-t border-neutral-50 dark:border-neutral-800/50 pt-5 mt-6 z-10">
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlide === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center space-x-1.5 cursor-pointer ${
                    currentSlide === 0 
                      ? 'text-neutral-350 dark:text-neutral-700 bg-neutral-50 dark:bg-neutral-950/20 cursor-not-allowed' 
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/80'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Progress Indicators */}
                <div className="flex items-center space-x-1.5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentSlide ? 'w-6 bg-[#6C4CF1] dark:bg-[#8B73FF]' : 'w-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-400 dark:hover:bg-neutral-600'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNextSlide}
                  disabled={currentSlide === slides.length - 1}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center space-x-1.5 cursor-pointer ${
                    currentSlide === slides.length - 1 
                      ? 'text-neutral-350 dark:text-neutral-700 bg-neutral-50 dark:bg-neutral-950/20 cursor-not-allowed' 
                      : 'bg-[#6C4CF1] dark:bg-[#8B73FF] hover:bg-[#5B3ED6] dark:hover:bg-[#7A5FFF] text-white shadow-xs'
                  }`}
                >
                  <span>Next Slide</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Market Sizing & Commission Estimator Right (4 cols) */}
            <div className="lg:col-span-4 flex flex-col space-y-6">
              
              {/* Interactive ROI Estimator Card */}
              <div className="bg-white dark:bg-[#030303] border border-neutral-100 dark:border-neutral-800/80 rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center space-x-2.5 pb-3 border-b border-neutral-50 dark:border-neutral-800/50">
                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-center justify-center">
                    <Calculator className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100">Dynamic Market Estimator</h4>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light">Interactive projections</p>
                  </div>
                </div>

                {/* Control inputs */}
                <div className="space-y-4">
                  {/* Slider 1: Target Population */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">Urban Population</span>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-100">
                        {(population / 1000000).toFixed(1)}M citizens
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1000000}
                      max={25000000}
                      step={500000}
                      value={population}
                      onChange={(e) => setPopulation(Number(e.target.value))}
                      className="w-full accent-[#6C4CF1] dark:accent-[#8B73FF] h-1.5 bg-neutral-100 dark:bg-neutral-850 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-neutral-400 dark:text-neutral-600 font-mono">
                      <span>1M</span>
                      <span>Lagos / Jo'Burg (15M+)</span>
                      <span>25M</span>
                    </div>
                  </div>

                  {/* Slider 2: Penetration % */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">Market Penetration Target</span>
                      <span className="font-mono font-bold text-[#6C4CF1] dark:text-[#8B73FF]">{penetration}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={10.0}
                      step={0.1}
                      value={penetration}
                      onChange={(e) => setPenetration(Number(e.target.value))}
                      className="w-full accent-[#6C4CF1] dark:accent-[#8B73FF] h-1.5 bg-neutral-100 dark:bg-neutral-850 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-neutral-400 dark:text-neutral-600 font-mono">
                      <span>0.1%</span>
                      <span>Moderate (2%)</span>
                      <span>10%</span>
                    </div>
                  </div>

                  {/* Slider 3: Average Spend */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">Average Celebration Budget</span>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-100">
                        ₦{averageSpend.toLocaleString()} NGN
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20000}
                      max={1000000}
                      step={10000}
                      value={averageSpend}
                      onChange={(e) => setAverageSpend(Number(e.target.value))}
                      className="w-full accent-[#6C4CF1] dark:accent-[#8B73FF] h-1.5 bg-neutral-100 dark:bg-neutral-850 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-neutral-400 dark:text-neutral-600 font-mono">
                      <span>₦20K</span>
                      <span>Intimate (₦150K)</span>
                      <span>₦1M</span>
                    </div>
                  </div>

                  {/* Slider 4: Commission Rate % */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">Vendor Commission Fee</span>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-100">{commissionRate}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={20}
                      step={1}
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full accent-[#6C4CF1] dark:accent-[#8B73FF] h-1.5 bg-neutral-100 dark:bg-neutral-850 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-neutral-400 dark:text-neutral-600 font-mono">
                      <span>5%</span>
                      <span>Average (10%)</span>
                      <span>20%</span>
                    </div>
                  </div>
                </div>

                {/* Real-time projection output indicators */}
                <div className="bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 space-y-3.5">
                  <div className="flex justify-between items-center text-xs pb-1.5 border-b border-neutral-100/60 dark:border-neutral-800/60">
                    <span className="text-neutral-400 dark:text-neutral-500 font-light">Target Users (Annual):</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      {targetMarketSize.toLocaleString()} birthdays
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs pb-1.5 border-b border-neutral-100/60 dark:border-neutral-800/60">
                    <span className="text-neutral-400 dark:text-neutral-500 font-light">Total Marketplace GTV:</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      ₦{totalTransactionVolume.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col pt-1">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-mono font-bold">Projected Annual Revenue</span>
                    <span className="text-xl font-display font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      ₦{projectRevenue.toLocaleString()}
                    </span>
                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-light mt-1">
                      Based on integrated bookings & core concierge fees.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Summary Highlights Box */}
              <div className="bg-[#6C4CF1]/4 dark:bg-[#8B73FF]/5 border border-[#6C4CF1]/10 dark:border-[#8B73FF]/15 rounded-3xl p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#F4B400]/8 rounded-full blur-md"></div>
                <div className="flex items-center space-x-1.5 text-[#6C4CF1] dark:text-[#8B73FF]">
                  <LineChart className="w-4 h-4 text-[#F4B400]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-[#6C4CF1] dark:text-[#8B73FF]">The Seed Edge</span>
                </div>
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Africa's Modern Occasions Infrastructure</h4>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
                  "By establishing our trusted logistics, real-time calendars, and boutique vendor network on Birthdays, MyDay secures the foundation to capture high-ticket Anniversaries, Proposals, Corporate Retreats, and massive weddings."
                </p>
              </div>

            </div>
          </motion.div>
        ) : (
          /* EDITORIAL DOCUMENT VIEW MODE */
          <motion.div
            key="document-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-[#030303] border border-neutral-100 dark:border-neutral-800/80 rounded-3xl p-6 md:p-10 shadow-sm font-sans space-y-8 max-w-4xl mx-auto"
          >
            
            {/* Elegant Title Block */}
            <div className="text-center space-y-3 pb-8 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-mono font-bold tracking-widest text-[#6C4CF1] dark:text-[#8B73FF] uppercase">
                MyDay Celebration Planning Platform
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
                BLOOM Business Plan & Executive Summary
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-light max-w-xl mx-auto">
                Comprehensive blueprint of the AI-driven concierge establishing the infrastructure for celebrating life’s most meaningful moments.
              </p>
            </div>

            {/* Vision and Mission Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-[#6C4CF1]/4 dark:bg-[#8B73FF]/5 rounded-full blur-sm" />
                <div className="flex items-center space-x-2 text-[#6C4CF1] dark:text-[#8B73FF] mb-2">
                  <Compass className="w-4 h-4 text-[#F4B400]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold">Corporate Vision</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                  To become Africa's most trusted platform for celebrating life's meaningful moments.
                </p>
              </div>

              <div className="p-5 bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-[#6C4CF1]/4 dark:bg-[#8B73FF]/5 rounded-full blur-sm" />
                <div className="flex items-center space-x-2 text-[#6C4CF1] dark:text-[#8B73FF] mb-2">
                  <Target className="w-4 h-4 text-[#6C4CF1]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold">Corporate Mission</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                  To make planning extraordinary celebrations simple, personalized, and stress-free by combining technology, trusted vendors, and curated experiences into one seamless platform.
                </p>
              </div>
            </div>

            {/* Core Executive Summary Editorial */}
            <div className="space-y-6 pt-2">
              
              {/* Section 1 */}
              <div className="space-y-2.5">
                <h3 className="text-md font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C4CF1] dark:bg-[#8B73FF]" />
                  <span>1. Executive Summary</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                  MyDay is an AI-powered celebration planning platform that helps people effortlessly create unforgettable birthday experiences. Rather than forcing users to search through hundreds of vendors, MyDay curates and recommends complete birthday experiences based on the recipient, personality, preferences, budget, and desired style, while handling planning and bookings in one place.
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                  Although our long-term vision is to become the leading celebration platform for weddings, anniversaries, proposals, corporate events, baby showers, graduations, and more, our initial focus is birthdays—a high-frequency, emotionally driven market with recurring demand and lower operational complexity.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-2.5">
                <h3 className="text-md font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C4CF1] dark:bg-[#8B73FF]" />
                  <span>2. Problem Statement & The Opportunity</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                  Every year, millions of birthdays are celebrated, yet planning a meaningful birthday remains unnecessarily stressful. Consumers face several challenges: they do not know what to do beyond the usual dinner and cake; planning requires coordinating multiple vendors across different platforms; finding trustworthy vendors is extremely time-consuming; and last-minute planning often results in poor experiences or higher costs.
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                  <strong>The Opportunity:</strong> Birthdays happen every single day. Unlike weddings, which occur once or twice in a lifetime, birthdays generate recurring annual demand. People are increasingly willing to spend on experiences rather than just physical gifts, yet the planning process remains fragmented. This creates a massive opportunity for a centralized platform that combines inspiration, planning, vendor booking, budgeting, and surprise coordination.
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-2.5">
                <h3 className="text-md font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C4CF1] dark:bg-[#8B73FF]" />
                  <span>3. Our Intelligent Solution</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                  MyDay serves as an AI-powered birthday concierge. Instead of asking users to browse endless directories, MyDay asks a few simple questions: <em>Who are you celebrating? What is your budget? What kind of experience do you want?</em> Using these inputs, MyDay generates a complete birthday plan, including personalized experience recommendations, venues, cakes, decor, gifts, photography, entertainment, restaurants, surprise ideas, timeline for the day, and budget allocation.
                </p>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-xl space-y-2">
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-extrabold">Unique Value Proposition</span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-light leading-relaxed">
                    Most event platforms function as directories where users must search, compare, negotiate, and coordinate vendors themselves. MyDay changes this by becoming an intelligent planning assistant. We deliver a complete, cohesive celebration plan rather than isolated services.
                  </p>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-2.5">
                <h3 className="text-md font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C4CF1] dark:bg-[#8B73FF]" />
                  <span>4. Why We Start With Birthdays & Future Horizons</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                  Many startups fail because they attempt to solve too many problems at once. Our entry strategy is to dominate one high-frequency celebration category before expanding. Birthdays offer predictable annual demand, lower planning complexity than weddings, and the opportunity for repeat customers every single year.
                </p>
                
                {/* Horizontal Phases timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                    <span className="text-[9px] font-mono text-[#6C4CF1] dark:text-[#8B73FF] font-bold">PHASE 1</span>
                    <h5 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 mt-1">Birthdays Core</h5>
                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-light mt-1">AI-powered birthday planning, local cakes, surprise timelines.</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                    <span className="text-[9px] font-mono text-[#6C4CF1] dark:text-[#8B73FF] font-bold">PHASE 2</span>
                    <h5 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 mt-1">Intimate</h5>
                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Anniversaries, romantic proposals, baby & bridal showers.</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                    <span className="text-[9px] font-mono text-[#6C4CF1] dark:text-[#8B73FF] font-bold">PHASE 3</span>
                    <h5 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 mt-1">Grand Occasions</h5>
                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Weddings, engagement parties, graduation celebrations.</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                    <span className="text-[9px] font-mono text-[#6C4CF1] dark:text-[#8B73FF] font-bold">PHASE 4</span>
                    <h5 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 mt-1">Corporate</h5>
                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Employee birthdays, product launches, corporate team dinners.</p>
                  </div>
                </div>
              </div>

              {/* Section 5 */}
              <div className="space-y-2.5">
                <h3 className="text-md font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C4CF1] dark:bg-[#8B73FF]" />
                  <span>5. Revenue Model & Competitive Advantage</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                  MyDay monetizes through vendor commissions on booked celebrations, premium featured vendor listings, lifestyle celebration package sales, and personalized 1-on-1 concierge fees. Unlike directories, MyDay’s competitive advantage lies in our end-to-end booking experience, AI budget allocation, surprise timeline coordination, and unified booking carts.
                </p>
              </div>

              {/* Essence statement */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-6">
                <p className="text-center text-xs font-display font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-50/80 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/80 p-4 rounded-2xl max-w-xl mx-auto leading-relaxed">
                  "MyDay isn't building an event marketplace. We're building the infrastructure for celebrating life's most meaningful moments—starting with birthdays, and growing into every occasion that brings people together."
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </SectionContainer>
  );
};
