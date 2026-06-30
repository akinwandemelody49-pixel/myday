import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ArrowRight, ArrowLeft, Cake, Calendar, DollarSign, Users, 
  MapPin, Gift, Check, ChevronRight, User as UserIcon, Heart, Info,
  AlertCircle, MessageSquare
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { BirthdayPlan, EventVibe, User } from '../../types';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { savePlanToFirestore } from '../../services/db';

interface PlanWizardProps {
  user: User | null;
  onPlanGenerated: (plan: BirthdayPlan) => void;
  onCancel: () => void;
}

export const PlanWizard: React.FC<PlanWizardProps> = ({
  user,
  onPlanGenerated,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [loadingLabel, setLoadingLabel] = useState<string>('Saving curated birthday details to Firestore...');
  const [loadingDesc, setLoadingDesc] = useState<string>('Writing parameters to your secure account dashboard');

  // Form State
  const [celebrantName, setCelebrantName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Friend');
  const [eventDate, setEventDate] = useState<string>('');
  const [age, setAge] = useState<string>('25');
  const [city, setCity] = useState<string>('Lagos');
  const [guestCount, setGuestCount] = useState<string>('30');
  const [budgetRange, setBudgetRange] = useState<string>('₦100,000–₦250,000');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['Elegant']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Food', 'Music']);
  const [additionalDetails, setAdditionalDetails] = useState<string>('');

  // Dropdown lists
  const relationships = ['Partner', 'Friend', 'Parent', 'Child', 'Sibling', 'Colleague', 'Other'];
  
  const budgets = [
    { label: 'Under ₦50,000', desc: 'Casual intimate gathering or backyard celebration' },
    { label: '₦50,000–₦100,000', desc: 'Stylish celebration with close family & friends' },
    { label: '₦100,000–₦250,000', desc: 'Premium private space with tailored decor & dining' },
    { label: '₦250,000–₦500,000', desc: 'Bespoke upscale event at curated local venues' },
    { label: '₦500,000+', desc: 'Elite grand gala celebration with live acts and pro styling' }
  ];

  const celebrationStyles = [
    { name: 'Luxury', icon: '✨', description: 'Gilded details, premium services' },
    { name: 'Romantic', icon: '💖', description: 'Warm candlelight, intimate vibes' },
    { name: 'Family', icon: '🏡', description: 'Cozy, warm multi-generational joy' },
    { name: 'Adventure', icon: '⛰️', description: 'Experiential outdoor excursions' },
    { name: 'Surprise', icon: '🎁', description: 'Thrilling hidden reveals' },
    { name: 'Outdoor', icon: '🌳', description: 'Fresh air, garden or terrace spreads' },
    { name: 'Indoor', icon: '🏰', description: 'Climate-controlled elegant lounges' },
    { name: 'Elegant', icon: '🕯️', description: 'Refined botanical arrangements' },
    { name: 'Fun', icon: '🎈', description: 'Vibrant colors & lighthearted games' },
    { name: 'Kids Party', icon: '🍭', description: 'Playful interactive wonderland' }
  ];

  const interestsList = [
    { name: 'Music', icon: '🎵' },
    { name: 'Movies', icon: '🎬' },
    { name: 'Sports', icon: '⚽' },
    { name: 'Food', icon: '🍳' },
    { name: 'Travel', icon: '✈️' },
    { name: 'Fashion', icon: '🧥' },
    { name: 'Gaming', icon: '🎮' },
    { name: 'Art', icon: '🎨' },
    { name: 'Nature', icon: '🌲' },
    { name: 'Technology', icon: '💻' }
  ];

  const toggleStyle = (styleName: string) => {
    if (selectedStyles.includes(styleName)) {
      setSelectedStyles(selectedStyles.filter(s => s !== styleName));
    } else {
      setSelectedStyles([...selectedStyles, styleName]);
    }
  };

  const toggleInterest = (interestName: string) => {
    if (selectedInterests.includes(interestName)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interestName));
    } else {
      setSelectedInterests([...selectedInterests, interestName]);
    }
  };

  // Convert Nigerian Naira budget range to equivalent number for backwards compatibility
  const getNumericBudget = (range: string): number => {
    if (range.includes('Under ₦50,000')) return 40000;
    if (range.includes('₦50,000–₦100,000')) return 75000;
    if (range.includes('₦100,000–₦250,000')) return 175000;
    if (range.includes('₦250,000–₦500,000')) return 375000;
    if (range.includes('₦500,000+')) return 750000;
    return 150000;
  };

  // Map chosen styles to matching EventVibe union types
  const getEventVibeFromStyles = (styles: string[]): EventVibe => {
    const lowercase = styles.map(s => s.toLowerCase());
    if (lowercase.includes('luxury')) return 'luxurious';
    if (lowercase.includes('elegant')) return 'elegant';
    if (lowercase.includes('family')) return 'cozy';
    if (lowercase.includes('adventure') || lowercase.includes('outdoor')) return 'adventurous';
    if (lowercase.includes('fun') || lowercase.includes('kids party') || lowercase.includes('surprise')) return 'vibrant';
    return 'elegant';
  };

  const isStepValid = (): boolean => {
    if (step === 1) {
      return celebrantName.trim().length > 0 && relationship.trim().length > 0;
    }
    if (step === 2) {
      return (
        eventDate.trim().length > 0 &&
        age.trim().length > 0 && !isNaN(Number(age)) && Number(age) > 0 &&
        city.trim().length > 0 &&
        guestCount.trim().length > 0 && !isNaN(Number(guestCount)) && Number(guestCount) > 0
      );
    }
    if (step === 3) {
      return budgetRange.trim().length > 0;
    }
    if (step === 4) {
      return selectedStyles.length > 0;
    }
    if (step === 5) {
      return selectedInterests.length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (isStepValid()) {
      if (step < 6) {
        setStep(step + 1);
      } else {
        handleSubmitPlan();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  const handleSubmitPlan = async () => {
    setIsSaving(true);
    try {
      const numericBudget = getNumericBudget(budgetRange);
      const chosenVibe = getEventVibeFromStyles(selectedStyles);
      const planId = 'plan-' + Date.now();

      // 1. Construct the questionnaire draft plan
      const questionnairePlan: BirthdayPlan = {
        id: planId,
        userId: user?.uid || 'temp',
        celebrantName,
        age: Number(age),
        eventDate,
        budget: numericBudget,
        guestCount: Number(guestCount),
        vibe: chosenVibe,
        interests: selectedInterests,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Premium multi-step planner specific metadata fields
        relationship,
        city,
        budgetRange,
        celebrationStyles: selectedStyles,
        additionalDetails: additionalDetails.trim() || undefined,

        themeTitle: 'Generating Theme...',
        themeDescription: 'Synthesizing creative details...',
        aiSuggestedItinerary: []
      };

      // 2. Save questionnaire answers to Firestore first
      setLoadingLabel('Saving questionnaire answers to Firestore...');
      setLoadingDesc('Writing your selection parameters to the secure database...');
      if (user) {
        await savePlanToFirestore(questionnairePlan);
      } else {
        // Wait briefly for smooth animation if guest/mock user
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // 3. Show loading screen while AI generates the plan (this state is active)
      setLoadingLabel('Activating Gemini AI to generate your plan...');
      setLoadingDesc('Designing bespoke themes, ambiance blueprints, and hour-by-hour custom itinerary timelines...');

      const primaryStyle = selectedStyles[0] || 'Elegant';
      // Fallback sample itinerary
      const sampleItinerary = [
        {
          id: 'it-1',
          time: '15:00',
          title: `Welcome & Styled Photo Wall`,
          description: `Guests arrive at a beautifully curated venue in ${city} styled to an exquisite ${primaryStyle} theme. Custom portraiture begins immediately.`,
          duration: '1.5 hours',
          location: 'Main Reception Terrace',
          estimatedCost: Math.round(numericBudget * 0.15)
        },
        {
          id: 'it-2',
          time: '17:00',
          title: `Immersive Celebration & Gourmet Dining`,
          description: `Enjoy standard multi-course dining experiences tailored to interests like ${selectedInterests.slice(0, 2).join(' and ')} with beautiful floral settings.`,
          duration: '2.5 hours',
          location: 'Dining Pavilion',
          estimatedCost: Math.round(numericBudget * 0.5)
        },
        {
          id: 'it-3',
          time: '20:00',
          title: `Dynamic Toasting & Sweet Finish`,
          description: `Lively toasts for ${celebrantName}'s milestone ${age}th birthday wrap around the cutting of a tailored signature dessert cake.`,
          duration: '1.5 hours',
          location: 'Grand Ballroom Lounge',
          estimatedCost: Math.round(numericBudget * 0.15)
        }
      ];

      let aiData = null;
      try {
        const response = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            celebrantName,
            age: Number(age),
            eventDate,
            budget: numericBudget,
            guestCount: Number(guestCount),
            vibe: chosenVibe,
            interests: selectedInterests
          })
        });

        if (response.ok) {
          aiData = await response.json();
        } else {
          console.warn('Backend API returned non-ok status. Falling back to high-fidelity mock AI plan.');
        }
      } catch (e) {
        console.warn('Network error or API failed. Falling back to high-fidelity mock AI plan.', e);
      }

      const generatedTitle = aiData?.themeTitle || `${primaryStyle} Jubilee for ${celebrantName}`;
      const generatedDesc = aiData?.themeDescription || `A premium celebration custom tailored in ${city} for ${celebrantName} (${relationship}). Built with a designated budget range of ${budgetRange} styled around: ${selectedStyles.join(', ')}.`;
      const generatedItinerary = aiData?.aiSuggestedItinerary || sampleItinerary;

      // 4. When the plan is ready, save it back to the birthdayPlans collection
      setLoadingLabel('Finalizing and saving your AI birthday plan...');
      setLoadingDesc(`Saving completed plan "${generatedTitle}" to your account database...`);

      const finalPlan: BirthdayPlan = {
        ...questionnairePlan,
        themeTitle: generatedTitle,
        themeDescription: generatedDesc,
        aiSuggestedItinerary: generatedItinerary,
        selectedVendors: {
          venue: chosenVibe === 'luxurious' ? 'venue-1' : chosenVibe === 'elegant' ? 'venue-2' : 'venue-3',
          catering: numericBudget > 200000 ? 'catering-1' : 'catering-2',
          decor: chosenVibe === 'luxurious' ? 'decor-2' : 'decor-1',
          entertainment: numericBudget > 250000 ? 'entertainment-1' : 'entertainment-2',
          baking: numericBudget > 100000 ? 'baking-1' : 'baking-2'
        },
        status: 'planning', // update status to active planning
        updatedAt: new Date().toISOString()
      };

      if (user) {
        await savePlanToFirestore(finalPlan);
      } else {
        // Wait briefly for smooth user transition
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // 5. Navigate to AI results page
      onPlanGenerated(finalPlan);
    } catch (err) {
      console.error("Failed to generate plan:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-neutral-100/60 shadow-xl max-w-3xl mx-auto mt-10">
        <LoadingSpinner size="lg" label={loadingLabel} />
        <p className="mt-4 text-xs font-mono text-neutral-400 uppercase tracking-widest animate-pulse text-center">
          {loadingDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-6 px-4 pb-20">
      
      {/* 1. Header Navigation & Badge */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <span className="text-xs font-mono font-bold text-[#6C4CF1] bg-[#6C4CF1]/8 border border-[#6C4CF1]/10 px-3.5 py-1 rounded-full uppercase">
          Step {step} of 6
        </span>
      </div>

      {/* 2. Top Progress Bar */}
      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mb-8 shadow-inner">
        <motion.div
          className="bg-gradient-to-r from-[#6C4CF1] to-[#F4B400] h-full rounded-full"
          initial={{ width: '16.66%' }}
          animate={{ width: `${(step / 6) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 3. Main Multi-step Interactive Form wrapper */}
      <Card variant="luxury" className="p-6 md:p-10 shadow-xl border border-neutral-100/80 bg-white rounded-3xl">
        <CardBody className="p-0">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Who are you celebrating? */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-neutral-800 tracking-tight flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center">
                      <Cake className="w-5 h-5 text-[#6C4CF1]" />
                    </div>
                    Who are we celebrating?
                  </h3>
                  <p className="text-xs font-sans text-neutral-400 mt-2 ml-12">
                    Let's begin by noting down the name and relationship to the beautiful celebrant.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Melody Akinwande"
                      value={celebrantName}
                      onChange={(e) => setCelebrantName(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4 rounded-2xl text-sm font-sans text-neutral-800 outline-none transition-all shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Relationship
                    </label>
                    <div className="relative">
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4 rounded-2xl text-sm font-sans text-neutral-800 outline-none transition-all shadow-xs appearance-none cursor-pointer"
                      >
                        {relationships.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Birthday Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-neutral-800 tracking-tight flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#6C4CF1]" />
                    </div>
                    Celebration details
                  </h3>
                  <p className="text-xs font-sans text-neutral-400 mt-2 ml-12">
                    Set the timeline parameters, location center, and guest threshold for this event.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Birthday Date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4 rounded-2xl text-sm font-sans text-neutral-800 outline-none transition-all shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="e.g. 28"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4 rounded-2xl text-sm font-sans text-neutral-800 outline-none transition-all shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lagos, Abuja, London"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4 rounded-2xl text-sm font-sans text-neutral-800 outline-none transition-all shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 35"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4 rounded-2xl text-sm font-sans text-neutral-800 outline-none transition-all shadow-xs"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Budget Range Selection */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-neutral-800 tracking-tight flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-[#6C4CF1]" />
                    </div>
                    Financial scale
                  </h3>
                  <p className="text-xs font-sans text-neutral-400 mt-2 ml-12">
                    Select your allocated budget tier. This maps matching vendors and decoration presets.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {budgets.map((b) => {
                    const isSelected = budgetRange === b.label;
                    return (
                      <div
                        key={b.label}
                        onClick={() => setBudgetRange(b.label)}
                        className={`p-4.5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer group ${
                          isSelected
                            ? 'border-[#6C4CF1] bg-[#6C4CF1]/4 shadow-md shadow-[#6C4CF1]/2'
                            : 'border-neutral-150 bg-neutral-50/20 hover:bg-neutral-50/80 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-[#6C4CF1] text-white' : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            ₦
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isSelected ? 'text-[#6C4CF1]' : 'text-neutral-800'}`}>
                              {b.label}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5 leading-none">
                              {b.desc}
                            </p>
                          </div>
                        </div>

                        <div className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'border-[#6C4CF1] bg-[#6C4CF1]' : 'border-neutral-300 bg-white group-hover:border-neutral-400'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Celebration Style */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-neutral-800 tracking-tight flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#6C4CF1]" />
                    </div>
                    Celebration Style
                  </h3>
                  <p className="text-xs font-sans text-neutral-400 mt-2 ml-12">
                    Choose one or more aesthetic styles that characterize this birthday's ideal mood.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-[42vh] overflow-y-auto pr-1 pt-2">
                  {celebrationStyles.map((style) => {
                    const isSelected = selectedStyles.includes(style.name);
                    return (
                      <div
                        key={style.name}
                        onClick={() => toggleStyle(style.name)}
                        className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-start space-x-3 cursor-pointer group select-none relative ${
                          isSelected
                            ? 'border-[#6C4CF1] bg-[#6C4CF1]/4 shadow-sm shadow-[#6C4CF1]/2'
                            : 'border-neutral-150 bg-neutral-50/10 hover:bg-neutral-50 hover:border-neutral-300'
                        }`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{style.icon}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#6C4CF1]' : 'text-neutral-700 group-hover:text-neutral-900'}`}>
                            {style.name}
                          </p>
                          <p className="text-[9px] text-neutral-400 font-light leading-snug mt-1 truncate">
                            {style.description}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#6C4CF1] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedStyles.length === 0 && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1.5 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" /> Please choose at least one celebration style.
                  </p>
                )}
              </motion.div>
            )}

            {/* STEP 5: Interests & Additional details */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-neutral-800 tracking-tight flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center">
                      <Gift className="w-5 h-5 text-[#6C4CF1]" />
                    </div>
                    Select Interests
                  </h3>
                  <p className="text-xs font-sans text-neutral-400 mt-2 ml-12">
                    Pick interest tags. This builds standard tailored timeline suggestions matching their passions.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  <div className="flex flex-wrap gap-2.5">
                    {interestsList.map((interest) => {
                      const isSelected = selectedInterests.includes(interest.name);
                      return (
                        <button
                          key={interest.name}
                          type="button"
                          onClick={() => toggleInterest(interest.name)}
                          className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                            isSelected
                              ? 'bg-[#6C4CF1] text-white shadow-md shadow-[#6C4CF1]/15 border border-transparent'
                              : 'bg-neutral-50 text-neutral-500 border border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <span>{interest.icon}</span>
                          <span>{interest.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#F4B400]" />
                      Tell us anything else about the birthday person (Optional)
                    </label>
                    <textarea
                      placeholder="e.g. List favorite food dishes, custom music requests, surprise triggers, color preferences, or timeline limitations..."
                      rows={3}
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4 rounded-2xl text-sm font-sans text-neutral-800 outline-none transition-all shadow-xs resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Final Summary display */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-neutral-800 tracking-tight flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#F4B400] animate-pulse" />
                    </div>
                    Review Celebration
                  </h3>
                  <p className="text-xs font-sans text-neutral-400 mt-2 ml-12">
                    Confirm your details. We will save this customized birthday plan to your account database.
                  </p>
                </div>

                {/* Styled summary card */}
                <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-150 space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Celebrant</span>
                      <span className="text-xs font-bold text-neutral-800 block mt-1 truncate">{celebrantName}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Relationship</span>
                      <span className="text-xs font-bold text-neutral-800 block mt-1">{relationship}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Birthday Date</span>
                      <span className="text-xs font-bold text-neutral-800 block mt-1">{eventDate}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Target Age</span>
                      <span className="text-xs font-bold text-neutral-800 block mt-1">{age} years</span>
                    </div>
                  </div>

                  <div className="h-px bg-neutral-200/60" />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">City / Location</span>
                      <span className="text-xs font-bold text-neutral-800 block mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#6C4CF1]" />
                        <span>{city}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Guest Count</span>
                      <span className="text-xs font-bold text-neutral-800 block mt-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#6C4CF1]" />
                        <span>{guestCount} Guests</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Budget Range</span>
                      <span className="text-xs font-bold text-[#F4B400] block mt-1 font-mono font-extrabold bg-[#F4B400]/5 px-2 py-0.5 rounded-lg border border-[#F4B400]/10 w-fit">
                        {budgetRange}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-neutral-200/60" />

                  <div className="space-y-3.5">
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Mood & Celebration Styles</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStyles.map((s) => (
                          <span key={s} className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-[10px] font-bold rounded-lg border border-neutral-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Interests Tagged</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedInterests.map((i) => (
                          <span key={i} className="px-2.5 py-1 bg-[#6C4CF1]/8 text-[#6C4CF1] text-[10px] font-bold rounded-lg border border-[#6C4CF1]/10">
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>

                    {additionalDetails.trim() && (
                      <div>
                        <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Additional Instructions</span>
                        <p className="text-[11px] text-neutral-500 leading-relaxed mt-1 italic font-light">
                          "{additionalDetails.trim()}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-[#6C4CF1]/5 border border-[#6C4CF1]/10 rounded-2xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#6C4CF1] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-neutral-500 leading-normal font-light">
                    Your details will be written as a premium birthday plan in Firestore. You can update budget parameters, timeline logs, and link local vendors from your Celebrations Hub.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* 4. Controls Footer buttons */}
          <div className="flex items-center justify-between border-t border-neutral-100/80 pt-6 mt-8">
            <button
              onClick={handleBack}
              className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer py-3 px-4 rounded-xl hover:bg-neutral-50"
            >
              Back
            </button>
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-md shadow-[#6C4CF1]/10 flex items-center space-x-2 cursor-pointer transition-all duration-300 ${
                !isStepValid() ? 'opacity-50 cursor-not-allowed bg-neutral-300 hover:bg-neutral-300 text-neutral-500 shadow-none' : ''
              }`}
              rightIcon={step === 6 ? <Sparkles className="w-4 h-4 text-[#F4B400] animate-pulse" /> : <ArrowRight className="w-4 h-4" />}
            >
              <span>{step === 6 ? 'Generate My AI Birthday Plan' : 'Next Step'}</span>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
