import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Calendar, MapPin, Clock, Cake, Gift, Heart, 
  CheckCircle, AlertCircle, Info, Smile, Music, Users, 
  Send, Compass, Home, Coffee, ArrowRight
} from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { BirthdayPlan } from '../../types';
import { getFirestoreBirthdayPlan, savePlanToFirestore } from '../../services/db';

interface RSVP {
  name: string;
  status: 'yes' | 'no';
  timestamp: string;
}

interface InvitationViewProps {
  onGoHome?: () => void;
}

export const InvitationView: React.FC<InvitationViewProps> = ({ onGoHome }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<BirthdayPlan | null>(null);
  
  // RSVP Form States
  const [guestName, setGuestName] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'yes' | 'no' | null>(null);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpsList, setRsvpsList] = useState<RSVP[]>([]);

  // Parse query parameters
  useEffect(() => {
    const loadPlan = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const planId = searchParams.get('planId') || searchParams.get('invite');
        const encodedData = searchParams.get('data');

        if (planId) {
          // Fetch from Firestore
          const fetchedPlan = await getFirestoreBirthdayPlan(planId);
          if (fetchedPlan) {
            setPlan(fetchedPlan);
            // Cast or handle dynamic rsvps field
            const existingRsvps = (fetchedPlan as any).rsvps || [];
            setRsvpsList(existingRsvps);
          } else {
            setError("We couldn't find this celebration plan. The link may have expired or is incorrect.");
          }
        } else if (encodedData) {
          // Decode from base64 safely supporting Unicode characters
          try {
            const decodedString = decodeURIComponent(atob(encodedData).split('').map((c) => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const parsedPlan = JSON.parse(decodedString) as BirthdayPlan;
            setPlan(parsedPlan);
            setRsvpsList((parsedPlan as any).rsvps || []);
          } catch (e) {
            console.error("Failed to decode base64 data", e);
            setError("Invalid invitation link data.");
          }
        } else {
          setError("No celebration plan was specified in the link.");
        }
      } catch (err) {
        console.error("Error loading shared plan", err);
        setError("An unexpected error occurred while loading this invitation.");
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, []);

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !rsvpStatus || !plan) return;

    setRsvpSubmitting(true);
    try {
      const newRsvp: RSVP = {
        name: guestName.trim(),
        status: rsvpStatus,
        timestamp: new Date().toISOString()
      };

      // Create updated RSVPs list
      const updatedRsvps = [newRsvp, ...rsvpsList.filter(r => r.name.toLowerCase() !== guestName.trim().toLowerCase())];
      
      const updatedPlan = {
        ...plan,
        rsvps: updatedRsvps
      };

      // Save to Firestore if it's a real plan in Firestore
      if (plan.id && plan.id !== 'temp' && !window.location.search.includes('data=')) {
        await savePlanToFirestore(updatedPlan);
      }

      setRsvpsList(updatedRsvps);
      setPlan(updatedPlan);
      setRsvpSuccess(true);
      setGuestName('');
      setRsvpStatus(null);
    } catch (err) {
      console.error("Error submitting RSVP", err);
      alert("Failed to submit RSVP. Please try again.");
    } finally {
      setRsvpSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] font-sans p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#6C4CF1] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">Loading Invitation Summary...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] font-sans p-4">
        <div className="max-w-md w-full bg-white border border-neutral-100 rounded-3xl p-8 text-center space-y-6 shadow-sm">
          <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-display font-black text-neutral-800">Invitation Unreachable</h2>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              {error || "The plan is unavailable or could not be loaded."}
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={onGoHome} 
            className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white text-xs font-bold uppercase tracking-wider py-3"
          >
            Go to MyDay Home
          </Button>
        </div>
      </div>
    );
  }

  const celebrant = plan.celebrantName || 'Guest of Honor';
  const eventDateStr = plan.eventDate ? new Date(plan.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Scheduled Date';

  // Extract primary venue and cake
  const venueTitle = plan.venueIdeas && plan.venueIdeas[0] ? plan.venueIdeas[0].split(' - ')[0] : 'The Selected Celebration Venue';
  const venueDesc = plan.venueIdeas && plan.venueIdeas[0] ? (plan.venueIdeas[0].split(' - ')[1] || plan.venueIdeas[0]) : 'Details will be updated soon.';
  
  const cakeTitle = plan.cakeIdeas && plan.cakeIdeas[0] ? plan.cakeIdeas[0] : 'Celebration Cake';
  const cakeDesc = plan.cakeIdeas && plan.cakeIdeas[1] ? `Suggested style: ${plan.cakeIdeas[1]}` : 'A beautiful curated custom birthday cake.';

  const timelineItems = plan.aiSuggestedItinerary || [
    { id: '1', time: '06:00 PM', title: 'Arrival & Gathering', description: 'Guests gather and enjoy signature welcome treats.', duration: '1 hour', location: 'Main Entrance Lounge', estimatedCost: 0 },
    { id: '2', time: '07:00 PM', title: 'Celebration Dinner', description: 'A wonderful custom culinary experience with fine dining.', duration: '2 hours', location: 'Grand Pavilion table', estimatedCost: 0 },
    { id: '3', time: '09:00 PM', title: 'Toast & Cake Cutting', description: 'Cake cutting, speeches, and champagne toasts.', duration: '1 hour', location: 'Celebration Stage', estimatedCost: 0 }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#6C4CF1]/10 selection:text-[#6C4CF1]">
      
      {/* Decorative Top Accent */}
      <div className="bg-gradient-to-r from-[#6C4CF1] to-[#F4B400] h-2 w-full"></div>

      {/* Floating Logo / Home Trigger */}
      <div className="max-w-4xl mx-auto px-4 pt-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-[#6C4CF1] flex items-center justify-center text-white font-display font-black text-xs shadow-md">
            M
          </div>
          <span className="font-display font-black text-sm tracking-tight text-neutral-800">MyDay <span className="text-[#6C4CF1]">Concierge</span></span>
        </div>
        <button 
          onClick={onGoHome}
          className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-neutral-700 font-mono uppercase tracking-widest transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main invitation info column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Celebration Card Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-100 rounded-3xl p-6 md:p-10 shadow-xs relative overflow-hidden text-center space-y-5"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6C4CF1]/10 via-transparent to-[#F4B400]/10"></div>
            
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#6C4CF1]/5 border border-[#6C4CF1]/10 text-[#6C4CF1]">
              <Sparkles className="w-6 h-6 text-[#F4B400] animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#6C4CF1] uppercase">You are cordially invited to celebrate</span>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-neutral-800">
                {plan.themeTitle || `${celebrant}'s Birthday Celebration`}
              </h1>
              <p className="text-xs text-neutral-400 font-light max-w-lg mx-auto leading-relaxed">
                {plan.themeDescription || `Join us for an unforgettable milestone celebration curated perfectly around ${celebrant}'s preferences, passions, and unique style.`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto pt-4">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-[#6C4CF1] shrink-0" />
                <div className="text-left">
                  <span className="text-[8px] font-mono text-neutral-400 uppercase font-bold">When</span>
                  <p className="text-[11px] font-bold text-neutral-800 leading-tight">{eventDateStr}</p>
                </div>
              </div>
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="text-left">
                  <span className="text-[8px] font-mono text-neutral-400 uppercase font-bold">Where</span>
                  <p className="text-[11px] font-bold text-neutral-800 leading-tight truncate">{venueTitle} in {plan.city || 'Lagos'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Timing details timeline block */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="font-display font-black text-md text-neutral-800 uppercase tracking-wider flex items-center gap-2 px-1">
              <Clock className="w-4.5 h-4.5 text-[#6C4CF1]" />
              Celebration Timing & Schedule
            </h2>

            <Card className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-100 shadow-xs">
              <div className="relative border-l border-neutral-100 ml-3 space-y-6">
                {timelineItems.map((item, idx) => (
                  <div key={idx} className="relative pl-8 group">
                    <div className="absolute -left-[14px] top-1 w-7 h-7 rounded-full bg-[#6C4CF1]/5 border border-[#6C4CF1]/10 flex items-center justify-center text-[10px] shadow-2xs group-hover:bg-[#6C4CF1]/10 group-hover:border-[#6C4CF1]/20 transition-all">
                      {idx === 0 ? '🥐' : idx === 1 ? '🥂' : idx === 2 ? '🎂' : '✨'}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#6C4CF1] bg-[#6C4CF1]/5 border border-[#6C4CF1]/10 px-2 py-0.5 rounded">
                        {item.time}
                      </span>
                      <h4 className="text-xs font-bold text-neutral-800 mt-1">{item.title}</h4>
                      <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                        {item.description}
                      </p>
                      {item.location && item.location !== 'TBD' && (
                        <p className="text-[9px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-neutral-300" />
                          <span>{item.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Venue & Stylings Detail Block */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Venue Highlight */}
            <div className="space-y-3">
              <h3 className="font-display font-black text-xs text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                The Venue
              </h3>
              <Card className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-xs h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-neutral-800">{venueTitle}</h4>
                  <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                    {venueDesc}
                  </p>
                </div>
                <div className="pt-4 flex items-center space-x-1.5 text-[9px] font-mono font-bold text-[#6C4CF1] uppercase">
                  <span>Explore Directions</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Card>
            </div>

            {/* Cake & Style Highlight */}
            <div className="space-y-3">
              <h3 className="font-display font-black text-xs text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                <Cake className="w-4 h-4 text-rose-500" />
                Cake & Decor Style
              </h3>
              <Card className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-xs h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-neutral-800">{cakeTitle}</h4>
                  <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                    {cakeDesc}
                  </p>
                  {plan.decorationIdeas && plan.decorationIdeas[0] && (
                    <p className="text-[11px] text-neutral-400 font-light leading-relaxed border-t border-neutral-50 pt-2 mt-2">
                      <strong>Styling:</strong> {plan.decorationIdeas[0]}
                    </p>
                  )}
                </div>
                <div className="pt-2 text-[9px] font-mono text-[#F4B400] font-bold uppercase tracking-wider">
                  ✨ Aesthetic Mode: {plan.vibe || 'Elegant'}
                </div>
              </Card>
            </div>
          </motion.div>

        </div>

        {/* RSVP Card & Guest List column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Interactive RSVP Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-xs space-y-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#6C4CF1]/2 rounded-full blur-xl"></div>
            
            <div className="border-b border-neutral-50 pb-3 flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-[#6C4CF1]">
                <Send className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-800 uppercase">RSVP To Invitation</h3>
                <p className="text-[9px] text-neutral-400">Let the host know your status</p>
              </div>
            </div>

            {rsvpSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center space-y-3"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle className="w-5 h-5 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-800">RSVP Submitted!</h4>
                  <p className="text-[10px] text-emerald-600 font-light">
                    Your response has been registered successfully. Thank you!
                  </p>
                </div>
                <button
                  onClick={() => setRsvpSuccess(false)}
                  className="text-[9px] font-mono uppercase font-bold text-[#6C4CF1] hover:underline block mx-auto pt-1 cursor-pointer"
                >
                  Change RSVP Status
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleRSVPSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-neutral-100 rounded-xl px-4 py-2.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#6C4CF1]/30 transition-all font-sans font-light"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Are you attending?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRsvpStatus('yes')}
                      className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        rsvpStatus === 'yes'
                          ? 'bg-emerald-600 text-white border-transparent shadow-xs'
                          : 'bg-[#FAFAFA] border border-neutral-100 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <span>Yes, absolutely!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpStatus('no')}
                      className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        rsvpStatus === 'no'
                          ? 'bg-rose-500 text-white border-transparent shadow-xs'
                          : 'bg-[#FAFAFA] border border-neutral-100 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <span>Sorry, I can't</span>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={rsvpSubmitting || !rsvpStatus || !guestName.trim()}
                  className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white text-xs font-bold uppercase tracking-wider py-3"
                >
                  {rsvpSubmitting ? 'Submitting...' : 'Submit Response'}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Guest RSVP List Feed */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
              <h4 className="text-xs font-bold text-neutral-800 uppercase flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#6C4CF1]" />
                Guest RSVPs
              </h4>
              <span className="text-[9px] font-mono bg-[#6C4CF1]/5 text-[#6C4CF1] px-2 py-0.5 rounded-full font-bold">
                {rsvpsList.filter(r => r.status === 'yes').length} Attending
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {rsvpsList.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[10px] text-neutral-400 font-light">No responses recorded yet.</p>
                  <p className="text-[9px] text-neutral-300 mt-0.5">Be the first to RSVP above!</p>
                </div>
              ) : (
                rsvpsList.map((rsvp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-neutral-50/50 rounded-xl border border-neutral-100/50">
                    <span className="text-xs text-neutral-700 font-medium truncate max-w-[140px]">{rsvp.name}</span>
                    <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                      rsvp.status === 'yes'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-rose-50 text-rose-500 border border-rose-100'
                    }`}>
                      {rsvp.status === 'yes' ? 'Attending' : 'Declined'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Curated Tip footer inside shared view */}
          <div className="p-4 bg-neutral-50/50 border border-neutral-100 rounded-2xl">
            <p className="text-[10px] text-neutral-400 font-light leading-relaxed italic text-center">
              Powered by MyDay — Africa's luxury modern milestone planning & celebration platform.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
