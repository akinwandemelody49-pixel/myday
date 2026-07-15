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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);

    // 1. Validate all required form fields before submission
    if (!celebrantName.trim()) {
      setError("Please specify the celebrant's name.");
      return;
    }
    if (!relationship.trim()) {
      setError("Please specify your relationship with the celebrant.");
      return;
    }
    if (!eventDate.trim()) {
      setError("Please specify the celebration date.");
      return;
    }
    const ageNum = Number(age);
    if (!age.trim() || isNaN(ageNum) || ageNum <= 0) {
      setError("Please specify a valid target age greater than 0.");
      return;
    }
    if (!city.trim()) {
      setError("Please specify the city/location.");
      return;
    }
    const guestNum = Number(guestCount);
    if (!guestCount.trim() || isNaN(guestNum) || guestNum <= 0) {
      setError("Please specify a valid guest count greater than 0.");
      return;
    }
    if (!budgetRange.trim()) {
      setError("Please select a budget range.");
      return;
    }
    if (selectedStyles.length === 0) {
      setError("Please select at least one celebration style.");
      return;
    }
    if (selectedInterests.length === 0) {
      setError("Please select at least one interest.");
      return;
    }

    setIsSaving(true);
    try {
      const numericBudget = getNumericBudget(budgetRange);
      const chosenVibe = getEventVibeFromStyles(selectedStyles);
      const planId = 'plan-' + Date.now();

      // Construct the questionnaire draft plan
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
      try {
        await savePlanToFirestore(questionnairePlan);
      } catch (firestoreErr) {
        console.error("Firestore Save (Draft) Failed:", firestoreErr);
        // We log detailed error to console, but don't abort to ensure we always perform an action.
      }

      // Check if Gemini AI is configured
      setLoadingLabel('Checking Gemini AI configuration...');
      setLoadingDesc('Detecting connection to the Google GenAI secure API...');
      
      let isGeminiConfigured = false;
      try {
        const checkResponse = await fetch('/api/check-gemini');
        if (checkResponse.ok) {
          const contentType = checkResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const checkData = await checkResponse.json();
            isGeminiConfigured = !!checkData.isConfigured;
          }
        }
      } catch (checkErr) {
        console.warn("Failed to contact configuration API, falling back to mock detection:", checkErr);
      }

      let finalPlan: BirthdayPlan;
      const primaryStyle = selectedStyles[0] || 'Elegant';
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

      if (isGeminiConfigured) {
        // 4. Gemini AI is configured
        setLoadingLabel('Activating Gemini AI to generate your plan...');
        setLoadingDesc('Designing bespoke themes, ambiance blueprints, and hour-by-hour custom itinerary timelines...');
        
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
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              aiData = await response.json();
            } else {
              throw new Error('Expected JSON response but received non-JSON HTML error page');
            }
          } else {
            throw new Error(`Server returned status ${response.status}`);
          }
        } catch (apiErr) {
          console.error("Gemini Generation API call failed:", apiErr);
          throw new Error("Gemini AI service encountered an error during plan synthesis.");
        }

        const generatedTitle = aiData?.themeTitle || `Splendid celebration for ${celebrantName}`;
        const generatedDesc = aiData?.themeDescription || `A premium celebration custom tailored in ${city} for ${celebrantName}.`;
        const generatedItinerary = aiData?.aiSuggestedItinerary || sampleItinerary;

        finalPlan = {
          ...questionnairePlan,
          ...aiData,
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
          status: 'planning',
          updatedAt: new Date().toISOString()
        };

        // Save generated plan to Firestore
        setLoadingLabel('Saving your AI-generated birthday plan...');
        setLoadingDesc(`Writing final completed plan "${generatedTitle}" to your account database...`);
        try {
          await savePlanToFirestore(finalPlan);
        } catch (firestoreErr) {
          console.error("Failed to save final AI plan to Firestore:", firestoreErr);
        }

      } else {
        // 5. Gemini AI is NOT configured
        setLoadingLabel('Generating realistic birthday plan data...');
        setLoadingDesc('Creating a tailored celebration package with local design parameters...');

        // Wait briefly to feel realistic and provide loading spinner feedback
        await new Promise((resolve) => setTimeout(resolve, 1500));

        let placeholderData = null;
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
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              placeholderData = await response.json();
            } else {
              console.warn('Placeholder response is not JSON');
            }
          }
        } catch (apiErr) {
          console.warn("Could not get placeholder from server, falling back to client generation:", apiErr);
        }

        const generatedTitle = placeholderData?.themeTitle || `${primaryStyle} Jubilee for ${celebrantName}`;
        const generatedDesc = placeholderData?.themeDescription || `A premium celebration custom tailored in ${city} for ${celebrantName} (${relationship}). Built with a designated budget range of ${budgetRange} styled around: ${selectedStyles.join(', ')}.`;
        const generatedItinerary = placeholderData?.aiSuggestedItinerary || sampleItinerary;

        finalPlan = {
          ...questionnairePlan,
          ...placeholderData,
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
          status: 'planning',
          updatedAt: new Date().toISOString()
        };

        // Save generated placeholder plan to Firestore
        setLoadingLabel('Saving your completed birthday plan...');
        setLoadingDesc(`Writing final plan "${generatedTitle}" to your account database...`);
        try {
          await savePlanToFirestore(finalPlan);
        } catch (firestoreErr) {
          console.error("Failed to save placeholder plan to Firestore:", firestoreErr);
        }
      }

      // Redirect user to the AI Results page
      onPlanGenerated(finalPlan);
    } catch (err) {
      console.error("Error inside plan generation flow:", err);
      setError(err instanceof Error ? err.message : String(err));
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
                  <h3 className="font-display font-extrabold text-[24px] sm:text-[28px] text-[#111827] tracking-tight flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center shrink-0">
                      <Cake className="w-6 h-6 text-[#6C4CF1]" />
                    </div>
                    Who are we celebrating?
                  </h3>
                  <p className="text-[15px] sm:text-[16px] text-[#4B5563] font-medium mt-3 ml-15">
                    Let's begin by noting down the name and relationship to the beautiful celebrant.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  <div>
                    <label className="block text-[15px] font-semibold text-[#111827] mb-2.5">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Melody Akinwande"
                      value={celebrantName}
                      onChange={(e) => setCelebrantName(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4.5 rounded-2xl text-[16px] font-sans text-[#374151] font-medium outline-none transition-all shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[15px] font-semibold text-[#111827] mb-2.5">
                      Relationship
                    </label>
                    <div className="relative">
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4.5 rounded-2xl text-[16px] font-sans text-[#374151] font-medium outline-none transition-all shadow-xs appearance-none cursor-pointer"
                      >
                        {relationships.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#4B5563]">
                        <ChevronRight className="w-4.5 h-4.5 rotate-90" />
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
                  <h3 className="font-display font-extrabold text-[24px] sm:text-[28px] text-[#111827] tracking-tight flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-[#6C4CF1]" />
                    </div>
                    Celebration details
                  </h3>
                  <p className="text-[15px] sm:text-[16px] text-[#4B5563] font-medium mt-3 ml-15">
                    Set the timeline parameters, location center, and guest threshold for this event.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div>
                    <label className="block text-[15px] font-semibold text-[#111827] mb-2.5">
                      Birthday Date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4.5 rounded-2xl text-[16px] font-sans text-[#374151] font-medium outline-none transition-all shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[15px] font-semibold text-[#111827] mb-2.5">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="e.g. 28"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4.5 rounded-2xl text-[16px] font-sans text-[#374151] font-medium outline-none transition-all shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[15px] font-semibold text-[#111827] mb-2.5">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lagos, Abuja, London"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4.5 rounded-2xl text-[16px] font-sans text-[#374151] font-medium outline-none transition-all shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[15px] font-semibold text-[#111827] mb-2.5">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 35"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4.5 rounded-2xl text-[16px] font-sans text-[#374151] font-medium outline-none transition-all shadow-xs"
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
                  <h3 className="font-display font-extrabold text-[24px] sm:text-[28px] text-[#111827] tracking-tight flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center shrink-0">
                      <DollarSign className="w-6 h-6 text-[#6C4CF1]" />
                    </div>
                    Financial scale
                  </h3>
                  <p className="text-[15px] sm:text-[16px] text-[#4B5563] font-medium mt-3 ml-15">
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
                        className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer group ${
                          isSelected
                            ? 'border-[#6C4CF1] bg-[#6C4CF1]/4 shadow-md'
                            : 'border-neutral-150 bg-neutral-50/20 hover:bg-neutral-50/80 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isSelected ? 'bg-[#6C4CF1] text-white' : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            ₦
                          </div>
                          <div>
                            <p className={`text-[16px] font-bold ${isSelected ? 'text-[#6C4CF1]' : 'text-[#111827]'}`}>
                              {b.label}
                            </p>
                            <p className="text-[13px] text-[#6B7280] font-medium mt-1 leading-normal">
                              {b.desc}
                            </p>
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'border-[#6C4CF1] bg-[#6C4CF1]' : 'border-neutral-300 bg-white group-hover:border-neutral-400'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white stroke-[3px]" />}
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
                  <h3 className="font-display font-extrabold text-[24px] sm:text-[28px] text-[#111827] tracking-tight flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-[#6C4CF1]" />
                    </div>
                    Celebration Style
                  </h3>
                  <p className="text-[15px] sm:text-[16px] text-[#4B5563] font-medium mt-3 ml-15">
                    Choose one or more aesthetic styles that characterize this birthday's ideal mood.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-h-[42vh] overflow-y-auto pr-1 pt-2">
                  {celebrationStyles.map((style) => {
                    const isSelected = selectedStyles.includes(style.name);
                    return (
                      <div
                        key={style.name}
                        onClick={() => toggleStyle(style.name)}
                        className={`p-5 rounded-2xl border transition-all duration-300 flex items-start space-x-3.5 cursor-pointer group select-none relative ${
                          isSelected
                            ? 'border-[#6C4CF1] bg-[#6C4CF1]/4 shadow-sm'
                            : 'border-neutral-150 bg-neutral-50/10 hover:bg-neutral-50 hover:border-neutral-300'
                        }`}
                      >
                        <span className="text-2xl shrink-0 mt-0.5">{style.icon}</span>
                        <div className="min-w-0">
                          <p className={`text-[15px] font-bold leading-tight ${isSelected ? 'text-[#6C4CF1]' : 'text-[#374151] group-hover:text-[#111827]'}`}>
                            {style.name}
                          </p>
                          <p className="text-[13px] text-[#6B7280] font-medium leading-snug mt-1.5 truncate">
                            {style.description}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-4 right-4 w-5.5 h-5.5 rounded-full bg-[#6C4CF1] flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedStyles.length === 0 && (
                  <p className="text-[12px] text-rose-500 flex items-center gap-1.5 font-mono">
                    <AlertCircle className="w-4.5 h-4.5" /> Please choose at least one celebration style.
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
                    <label className="block text-[15px] font-semibold text-[#111827] mb-2.5 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#F4B400]" />
                      Tell us anything else about the birthday person (Optional)
                    </label>
                    <textarea
                      placeholder="e.g. List favorite food dishes, custom music requests, surprise triggers, color preferences, or timeline limitations..."
                      rows={3}
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white px-5 py-4 rounded-2xl text-[16px] font-sans text-[#374151] outline-none transition-all shadow-xs resize-none leading-relaxed"
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
                  <h3 className="font-display font-extrabold text-[24px] sm:text-[28px] text-[#111827] tracking-tight flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-[#F4B400] animate-pulse" />
                    </div>
                    Review Celebration
                  </h3>
                  <p className="text-[15px] sm:text-[16px] text-[#4B5563] font-medium mt-3 ml-15">
                    Confirm your details. We will save this customized birthday plan to your account database.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-150 rounded-2xl flex items-start gap-3.5 shadow-sm">
                    <AlertCircle className="w-5.5 h-5.5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-800">Plan Generation Issue</h4>
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Styled summary card */}
                <div className="bg-neutral-50 rounded-3xl p-8 border border-neutral-150 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">Celebrant</span>
                      <span className="text-[15px] font-bold text-[#111827] block mt-1.5 truncate">{celebrantName}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">Relationship</span>
                      <span className="text-[15px] font-bold text-[#111827] block mt-1.5">{relationship}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">Birthday Date</span>
                      <span className="text-[15px] font-bold text-[#111827] block mt-1.5">{eventDate}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">Target Age</span>
                      <span className="text-[15px] font-bold text-[#111827] block mt-1.5">{age} years</span>
                    </div>
                  </div>

                  <div className="h-px bg-neutral-200" />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">City / Location</span>
                      <span className="text-[15px] font-bold text-[#111827] block mt-1.5 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#6C4CF1]" />
                        <span>{city}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">Guest Count</span>
                      <span className="text-[15px] font-bold text-[#111827] block mt-1.5 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#6C4CF1]" />
                        <span>{guestCount} Guests</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">Budget Range</span>
                      <span className="text-[15px] font-bold text-[#F4B400] block mt-1.5 font-mono font-extrabold bg-[#F4B400]/5 px-2.5 py-0.5 rounded-lg border border-[#F4B400]/10 w-fit">
                        {budgetRange}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-neutral-200" />

                  <div className="space-y-4">
                    <div>
                      <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280] mb-2">Mood & Celebration Styles</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedStyles.map((s) => (
                          <span key={s} className="px-3 py-1.5 bg-neutral-100 text-[#374151] text-[13px] font-bold rounded-lg border border-neutral-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280] mb-2">Interests Tagged</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedInterests.map((i) => (
                          <span key={i} className="px-3 py-1.5 bg-[#6C4CF1]/8 text-[#6C4CF1] text-[13px] font-bold rounded-lg border border-[#6C4CF1]/10">
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>

                    {additionalDetails.trim() && (
                      <div>
                        <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">Additional Instructions</span>
                        <p className="text-[15px] text-[#4B5563] leading-relaxed mt-2 italic font-medium">
                          "{additionalDetails.trim()}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 bg-[#6C4CF1]/5 border border-[#6C4CF1]/10 rounded-2xl flex items-start gap-3.5">
                  <Info className="w-5.5 h-5.5 text-[#6C4CF1] shrink-0 mt-0.5" />
                  <p className="text-[14px] text-[#4B5563] leading-relaxed font-semibold">
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
              disabled={isSaving || !isStepValid()}
              isLoading={isSaving}
              className={`bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-md shadow-[#6C4CF1]/10 flex items-center space-x-2 cursor-pointer transition-all duration-300 ${
                isSaving || !isStepValid() ? 'opacity-50 cursor-not-allowed bg-neutral-300 hover:bg-neutral-300 text-neutral-500 shadow-none' : ''
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
