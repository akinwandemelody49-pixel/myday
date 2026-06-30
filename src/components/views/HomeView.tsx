import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Cake, Gift, Camera, DollarSign, PartyPopper, 
  ChevronDown, ChevronUp, Star, ArrowRight, Quote, Check, 
  Clock, Shield, Heart, Compass, ShieldCheck, Users, Play, Cpu, X, Volume2, VolumeX, CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { SectionContainer } from '../ui/SectionContainer';

const heroCelebrationImg = '/src/assets/images/luxury_birthday_celebration_1782822265439.jpg';

interface HomeViewProps {
  onStartPlanning: () => void;
  onExploreVendors: () => void;
  onSelectQuickTheme: (vibe: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartPlanning,
  onExploreVendors,
  onSelectQuickTheme,
}) => {
  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showWatchDemo, setShowWatchDemo] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const featuredInspirations = [
    {
      vibe: 'elegant',
      title: 'Midnight Botanical Soirée',
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600',
      tag: 'Botanical & Strings',
      budget: '$$$$'
    },
    {
      vibe: 'luxurious',
      title: 'Grand Velvet & Champagne',
      image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600',
      tag: 'Couture Gastronomy',
      budget: '$$$$$'
    },
    {
      vibe: 'cozy',
      title: 'Rustic Fireside Hearth',
      image: 'https://images.unsplash.com/photo-1545232979-8bf34eb9757b?auto=format&fit=crop&q=80&w=600',
      tag: 'Intimate Lodge',
      budget: '$$$'
    }
  ];

  const trustedPartners = [
    { name: 'Vogue Events', role: 'Editorial Curation' },
    { name: 'Ritz-Carlton', role: 'Premium Venues' },
    { name: 'Moët & Chandon', role: 'Champagne Partners' },
    { name: 'Aman Resorts', role: 'Destinations' },
    { name: 'Assouline', role: 'Aesthetic Design' },
  ];

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-[#6C4CF1]" />,
      title: '🤖 AI Birthday Planner',
      desc: 'Our intelligent design engine crafts a cohesive aesthetic and hyper-personalized timeline based on the celebrant\'s unique profile, personality type, and dreams.'
    },
    {
      icon: <Cake className="w-6 h-6 text-[#6C4CF1]" />,
      title: '🎂 Cake Recommendations',
      desc: 'Partner with Michelin-starred pastry houses and boutique bakers to custom-craft sculptural multi-tiered statement cakes aligned with your theme.'
    },
    {
      icon: <Gift className="w-6 h-6 text-[#6C4CF1]" />,
      title: '🎁 Personalized Gift Ideas',
      desc: 'Bespoke gift guides curated by expert shoppers, from customized luxury goods and rare collectibles to immersive once-in-a-lifetime physical experiences.'
    },
    {
      icon: <Camera className="w-6 h-6 text-[#6C4CF1]" />,
      title: '📸 Photography & Entertainment',
      desc: 'Connect with elite visual artists, portrait photographers, and custom musicians—from private jazz trios to top-tier festival DJs.'
    },
    {
      icon: <DollarSign className="w-6 h-6 text-[#6C4CF1]" />,
      title: '💰 Smart Budget Planning',
      desc: 'Dynamic real-time expense modeling ensures your custom milestone celebration remains perfectly aligned with your target budget framework.'
    },
    {
      icon: <PartyPopper className="w-6 h-6 text-[#6C4CF1]" />,
      title: '🎉 Surprise Coordination',
      desc: 'Engineered covert scheduling, private invitations, and timeline triggers designed to keep secret parameters perfectly hidden until the absolute reveal.'
    }
  ];

  const steps = [
    {
      step: 'Step 1',
      title: 'Answer a few questions',
      desc: 'Tell our AI assistant about the celebrant\'s passions, relationship dynamics, target budget, and the general vibe you wish to evoke.'
    },
    {
      step: 'Step 2',
      title: 'Receive an AI plan',
      desc: 'Instantly view a complete bespoke itinerary, including customized themes, matching venue templates, and curated vendor alignments.'
    },
    {
      step: 'Step 3',
      title: 'Book & celebrate',
      desc: 'Seamlessly link vetted creative partners to your active schedule, download your finalized timeline, and enjoy an unforgettable day.'
    }
  ];

  const testimonials = [
    {
      quote: "MyDay turned my husband's 40th birthday into a masterpiece. The AI captured his love for mid-century design and vinyl records perfectly, aligning a private chef and a jazz trio in minutes.",
      name: "Sophia Sterling",
      role: "Creative Director",
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
    },
    {
      quote: "As someone who hates planning, this was a lifesaver. Within 5 minutes, I had an hour-by-hour timeline, a spectacular cake concept, and recommendations for the best cocktail mixers in the city.",
      name: "Julian Vance",
      role: "Tech Co-founder",
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
    },
    {
      quote: "The luxury aesthetic and level of details are unparalleled. The platform works exactly like booking an ultra-premium Airbnb experience, with the intelligent convenience of a personal Apple-grade assistant.",
      name: "Marcus Dupont",
      role: "Art Curator",
      img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
    }
  ];

  const faqs = [
    {
      q: "How does the AI create a personalized birthday experience?",
      a: "Our planning studio uses fine-tuned semantic models (powered by Google Gemini) to map the celebrant's age, personality markers, personal interests, and hobbies into a cohesive thematic archetype. It then designs an hour-by-hour timeline, complete with culinary cues, atmospheric suggestions, and aligned creative vendor roles."
    },
    {
      q: "Can I customize the generated birthday plans?",
      a: "Absolutely. The AI-generated plan is your canvas. You can edit any schedule phase, add custom events, alter budget limits, and directly chat with our AI planner to regenerate specific segments of your celebration."
    },
    {
      q: "How are the vendors selected on MyDay?",
      a: "We only feature premium, vetted local professionals who specialize in luxury hospitality, pastry arts, design, and audio-visual storytelling. Every vendor goes through strict quality auditing to ensure they maintain our signature high-end execution standard."
    },
    {
      q: "What types of budgets do you support?",
      a: "MyDay scales fluidly across budget tiers. Whether you are orchestrating an intimate, high-vibe dinner gathering ($1,500+) or a fully structured milestone production with florists, lighting designers, and live performers ($20,000+), the AI allocates expenses logically."
    },
    {
      q: "Is there any cost to generate a planning draft?",
      a: "Draft generation is completely free. You can design, model, and play with unlimited birthday concepts. We only charge when you decide to lock down bookings with premium vendor partners or request dedicated 1-on-1 human concierge coordination."
    }
  ];

  return (
    <div className="bg-white min-h-screen text-[#1A1A1A] overflow-x-hidden selection:bg-[#6C4CF1]/10 selection:text-[#6C4CF1]">
      
      {/* 2. Hero Section */}
      <section id="hero" className="relative pt-16 pb-24 md:py-32 px-4 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 overflow-visible">
        {/* Decorative subtle ambient glows */}
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-[#6C4CF1]/8 blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-96 h-96 rounded-full bg-[#F4B400]/8 blur-[130px] pointer-events-none" />

        {/* Hero Left Content */}
        <div className="w-full lg:w-1/2 space-y-10 text-left z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-[#6C4CF1]/5 border border-[#6C4CF1]/10 text-[#6C4CF1] text-xs font-semibold tracking-wide"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F4B400] animate-pulse" />
            <span className="font-sans uppercase tracking-wider text-[10px] font-bold">AI-Powered Birthday Studio</span>
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-[1.08] text-neutral-900"
            >
              Every Birthday Deserves to Be <br />
              <span className="relative inline-block">
                <span className="absolute -inset-1 bg-gradient-to-r from-[#6C4CF1]/10 to-[#F4B400]/10 rounded-lg blur-xs -z-10" />
                <span className="bg-gradient-to-r from-[#6C4CF1] via-[#8E75F5] to-[#F4B400] bg-clip-text text-transparent">
                  Unforgettable.
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-sans text-neutral-500 text-base sm:text-[17px] leading-relaxed font-light max-w-xl"
            >
              MyDay uses AI to design personalized birthday experiences based on your relationship, personality, budget, and celebration style. From venues and cakes to gifts and surprises, everything is planned in minutes.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="space-y-8"
          >
            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartPlanning}
                className="w-full sm:w-auto bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white px-8 py-4 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-lg shadow-[#6C4CF1]/20 hover:shadow-xl hover:shadow-[#6C4CF1]/30 flex items-center justify-center space-x-2 cursor-pointer border border-[#6C4CF1]/10"
              >
                <span>✨ Plan My Birthday</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowWatchDemo(true)}
                className="w-full sm:w-auto text-center border border-neutral-200 hover:border-[#6C4CF1] text-neutral-800 hover:text-[#6C4CF1] px-8 py-4 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 bg-white shadow-2xs hover:shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>▶ Watch Demo</span>
              </motion.button>
            </div>

            {/* Trust Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-neutral-100 max-w-md">
              <div className="flex items-center space-x-1 text-[#F4B400] text-sm">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div className="text-xs font-medium text-neutral-500 tracking-wide">
                Trusted by people creating unforgettable celebrations.
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hero Right: Beautifully Decorated Visual & Floating Premium Card */}
        <div className="w-full lg:w-1/2 relative flex items-center justify-center">
          <div className="relative w-full max-w-lg">
            {/* Ambient Background Gold/Purple Border Glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#6C4CF1] to-[#F4B400] rounded-[2rem] opacity-20 blur-md -z-10" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full aspect-square sm:aspect-[4/3] rounded-[1.8rem] overflow-hidden shadow-2xl border border-white/50 group"
            >
              {/* Premium Hero Visual with Zoom Effect */}
              <motion.img
                src={heroCelebrationImg}
                alt="Bespoke Luxury Birthday Celebration"
                className="w-full h-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-105"
              />
              {/* Overlay styling for rich depth and contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/50 via-neutral-900/10 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-neutral-900/5 mix-blend-overlay pointer-events-none" />
            </motion.div>

            {/* Floating Premium AI Card */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: 40 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                y: [0, -12, 0],
              }}
              transition={{
                opacity: { duration: 0.8, delay: 0.4 },
                x: { duration: 0.8, delay: 0.4 },
                y: {
                  repeat: Infinity,
                  duration: 6,
                  ease: "easeInOut"
                }
              }}
              className="absolute -bottom-8 -right-4 sm:-right-8 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-neutral-100/80 w-72 sm:w-80 z-20"
            >
              <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-[#6C4CF1]/10 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-[#6C4CF1]" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-800 tracking-wide">AI Celebration Plan</h4>
                </div>
                <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Ready to Book</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-[11px]">
                <div>
                  <span className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider">Recipient</span>
                  <p className="font-semibold text-neutral-800 mt-0.5">Sarah</p>
                </div>
                <div>
                  <span className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider">Occasion</span>
                  <p className="font-semibold text-neutral-800 mt-0.5">Birthday</p>
                </div>
                <div>
                  <span className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider">Style</span>
                  <p className="font-semibold text-[#6C4CF1] mt-0.5 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4B400] mr-1.5" />
                    Luxury Romantic
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider">Budget</span>
                  <p className="font-bold text-neutral-900 mt-0.5 font-mono text-xs">₦250,000</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Watch Demo Modal */}
      <AnimatePresence>
        {showWatchDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-neutral-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 max-w-3xl w-full relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowWatchDemo(false)}
                className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Video Interface Mockup */}
              <div className="relative aspect-video bg-neutral-950 flex flex-col justify-between p-6">
                {/* Simulated ambient light */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/30" />

                {/* Top bar info */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#6C4CF1] flex items-center justify-center text-white">
                      <Sparkles className="w-4 h-4 text-[#F4B400]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold tracking-wider uppercase">MyDay AI Walkthrough</h4>
                      <p className="text-[10px] text-neutral-400">Duration: 1:42</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider animate-pulse">
                    LIVE PREVIEW
                  </span>
                </div>

                {/* Simulated playback visual */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 my-auto">
                  <div className="w-14 h-14 rounded-full bg-[#6C4CF1] hover:bg-[#5B3ED6] flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110 shadow-lg shadow-[#6C4CF1]/45">
                    <Play className="w-6 h-6 text-white ml-1 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Generating Sarah's Perfect Birthday...</h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                      See how the AI models themes, books luxury caterers, and formats a minutes-perfect timeline.
                    </p>
                  </div>
                </div>

                {/* Bottom play controls bar */}
                <div className="relative z-10 space-y-3 pt-4 border-t border-neutral-800">
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "25%" }}
                      animate={{ width: ["25%", "65%", "25%"] }}
                      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                      className="bg-gradient-to-r from-[#6C4CF1] to-[#F4B400] h-full rounded-full" 
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <div className="flex items-center space-x-4">
                      <span className="font-mono text-[11px]">0:24 / 1:42</span>
                      <button className="hover:text-white transition-colors">
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={onStartPlanning}
                      className="bg-white hover:bg-neutral-100 text-neutral-950 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm"
                    >
                      Start Free Draft
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Trusted By Section */}
      <section className="bg-neutral-50 border-y border-neutral-100 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-neutral-400">
            INTEGRATED CONCIERGE & TRUSTED CREATIVE PARTNERS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
            {trustedPartners.map((partner, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="font-serif font-semibold text-base tracking-tight text-neutral-800">
                  {partner.name}
                </span>
                <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
                  {partner.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-24 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-[#6C4CF1]/5 text-[#6C4CF1] text-[10px] font-bold uppercase tracking-widest">
            FEATURES INDEX
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 tracking-tight">
            Designed for flawless celebrations.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed font-sans max-w-lg mx-auto">
            Our technology stack takes care of every architectural detail so you can remain present as the perfect host.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-xs hover:shadow-lg hover:border-neutral-200/50 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-[#6C4CF1]/5 flex items-center justify-center border border-[#6C4CF1]/10 group-hover:bg-[#6C4CF1] group-hover:text-white transition-colors duration-300">
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-neutral-950">
                  {feature.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="bg-[#6C4CF1]/5 py-24 px-4 md:px-8 border-y border-[#6C4CF1]/10 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-[#6C4CF1]/10 text-[#6C4CF1] text-[10px] font-bold uppercase tracking-widest">
              STEP-BY-STEP ORCHESTRATION
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 tracking-tight">
              An elegant planning sequence.
            </h2>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto font-sans">
              Go from zero concept draft to locked-in booking in less than five minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative bg-white p-8 rounded-3xl border border-neutral-100 shadow-xs flex flex-col justify-between">
                {/* Connecting lines for large screens */}
                {idx < 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-[1px] bg-neutral-200 z-10" />
                )}
                
                <div className="space-y-4">
                  <span className="font-mono text-xs font-bold text-[#F4B400] uppercase tracking-widest">
                    {step.step}
                  </span>
                  <h3 className="font-display font-bold text-lg text-neutral-900">
                    {step.title}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curated Theme Previews (Integrated from earlier code) */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-[#6C4CF1]/5 text-[#6C4CF1] text-[10px] font-bold uppercase tracking-widest">
              DESIGN ARCHETYPES
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 tracking-tight">
              Begin with curated inspiration.
            </h3>
            <p className="text-xs text-neutral-400 font-sans">
              Select an aesthetic archetype to instantiate a customizable timeline layout immediately.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onStartPlanning} 
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="hover:border-[#6C4CF1] hover:text-[#6C4CF1] self-start md:self-auto shrink-0"
          >
            Interactive Studio
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredInspirations.map((item, index) => (
            <Card
              key={index}
              hoverEffect
              onClick={() => onSelectQuickTheme(item.vibe)}
              className="rounded-3xl border border-neutral-100 overflow-hidden cursor-pointer group hover:border-[#6C4CF1]/20 transition-all shadow-xs hover:shadow-lg"
            >
              <div className="relative h-60 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-4 left-4 inline-block px-2.5 py-1 text-[9px] uppercase tracking-wider font-mono font-bold text-white bg-neutral-950/70 backdrop-blur-md rounded-md">
                  {item.tag}
                </span>
                <span className="absolute bottom-4 right-4 inline-block px-2.5 py-0.5 text-[10px] font-bold text-[#F4B400] bg-neutral-950 rounded-md">
                  {item.budget}
                </span>
              </div>
              <CardBody className="p-6 text-left">
                <h4 className="font-display font-bold text-base text-neutral-900 mb-1 group-hover:text-[#6C4CF1] transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-neutral-400 font-mono tracking-wider">PLAN ARCHETYPE</span>
                  <span className="text-xs text-[#6C4CF1] font-semibold flex items-center">
                    Select Draft <Compass className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. Testimonials Section */}
      <section className="bg-neutral-50 border-y border-neutral-100 py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-[#6C4CF1]/5 text-[#6C4CF1] text-[10px] font-bold uppercase tracking-widest">
              CELEBRANT TESTIMONIALS
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 tracking-tight">
              Rave reviews from elegant hosts.
            </h2>
            <p className="text-xs text-neutral-400 font-sans max-w-sm mx-auto">
              Read how our digital planning concierge orchestrates memorable physical experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-2xs flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <Quote className="w-8 h-8 text-[#6C4CF1] opacity-20" />
                  <p className="text-xs text-neutral-500 leading-relaxed font-sans italic">
                    "{testimonial.quote}"
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-neutral-50">
                  <img
                    src={testimonial.img}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-100"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 font-sans">{testimonial.name}</h4>
                    <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="py-24 px-4 md:px-8 max-w-4xl mx-auto scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-[#6C4CF1]/5 text-[#6C4CF1] text-[10px] font-bold uppercase tracking-widest">
            FAQ SEGMENT
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 tracking-tight">
            Frequently asked questions.
          </h2>
          <p className="text-xs text-neutral-400 font-sans">
            Clear information about our automated planning system.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-neutral-100 overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-6 text-left cursor-pointer hover:bg-neutral-50/55 transition-colors"
              >
                <span className="font-display font-bold text-xs sm:text-sm text-neutral-900">
                  {faq.q}
                </span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-[#6C4CF1] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                )}
              </button>

              {openFaq === idx && (
                <div className="px-6 pb-6 pt-1 text-xs text-neutral-500 leading-relaxed font-sans border-t border-neutral-50 bg-neutral-50/20">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Final Call to Action */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="relative bg-gradient-to-br from-[#6C4CF1] to-[#5B3ED6] text-white p-12 sm:p-16 md:p-24 rounded-3xl overflow-hidden shadow-xl text-center space-y-8">
          {/* Abstract ambient decor */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F4B400]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[#F4B400] text-[9px] uppercase tracking-widest font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ORCHESTRATE YOUR CELEBRATION</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-white leading-tight">
              Ready to create unforgettable birthdays?
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg mx-auto font-sans font-light">
              Create an account or start as a guest. Our intelligent algorithms are primed to map your visual taste palette.
            </p>
          </div>

          <div className="relative z-10 pt-4">
            <button
              onClick={onStartPlanning}
              className="bg-[#F4B400] hover:bg-[#DCA200] text-neutral-900 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#F4B400]/20 flex items-center justify-center space-x-2.5 mx-auto cursor-pointer"
            >
              <span>Start Planning</span>
              <ArrowRight className="w-4 h-4 text-neutral-900" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
