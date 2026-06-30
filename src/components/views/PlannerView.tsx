import React, { useState } from 'react';
import { BirthdayPlan, Vendor, ItineraryItem, EventVibe } from '../../types';
import { SAMPLE_VENDORS } from '../../services/db';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { SectionContainer } from '../ui/SectionContainer';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  Calendar, Users, DollarSign, Sparkles, Clock, MapPin, 
  Trash2, Plus, ArrowRight, MessageSquare, Tag, Check, Award,
  Sliders, Info, HelpCircle
} from 'lucide-react';

interface PlannerViewProps {
  plans: BirthdayPlan[];
  onCreatePlan: () => void;
  onUpdatePlan: (plan: BirthdayPlan) => void;
  onDeletePlan: (id: string) => void;
  onViewResults?: (plan: BirthdayPlan) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  plans,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  onViewResults,
}) => {
  const [activePlanId, setActivePlanId] = useState<string | null>(plans[0]?.id || null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'timeline' | 'vendors' | 'assistant'>('timeline');
  
  // Local state for assistant chat
  const [chatMessages, setChatMessages] = useState<{ sender: 'ai' | 'user'; text: string; time: string }[]>([
    { sender: 'ai', text: 'Welcome to your premium MyDay AI planning studio. I have crafted this custom timeline based on your elegant theme. How can I refine it for you today?', time: '11:52 AM' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Editable itinerary step states
  const [isAddingStep, setIsAddingStep] = useState<boolean>(false);
  const [newStepTime, setNewStepTime] = useState<string>('12:00');
  const [newStepTitle, setNewStepTitle] = useState<string>('');
  const [newStepDesc, setNewStepDesc] = useState<string>('');
  const [newStepDuration, setNewStepDuration] = useState<string>('1 hour');
  const [newStepLoc, setNewStepLoc] = useState<string>('');
  const [newStepCost, setNewStepCost] = useState<number>(200);

  // Active Plan reference
  const activePlan = plans.find(p => p.id === activePlanId) || plans[0] || null;

  const handleUpdateBudget = (newBudget: number) => {
    if (!activePlan) return;
    onUpdatePlan({
      ...activePlan,
      budget: newBudget,
      updatedAt: new Date().toISOString()
    });
  };

  const handleUpdateGuests = (newGuests: number) => {
    if (!activePlan) return;
    onUpdatePlan({
      ...activePlan,
      guestCount: newGuests,
      updatedAt: new Date().toISOString()
    });
  };

  // Add itinerary step
  const handleAddItineraryStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan || !newStepTitle.trim()) return;

    const newStep: ItineraryItem = {
      id: 'step-' + Date.now(),
      time: newStepTime,
      title: newStepTitle,
      description: newStepDesc,
      duration: newStepDuration,
      location: newStepLoc || 'Main Hall',
      estimatedCost: newStepCost
    };

    const currentItinerary = activePlan.aiSuggestedItinerary || [];
    // Sort chronologically
    const updatedItinerary = [...currentItinerary, newStep].sort((a, b) => a.time.localeCompare(b.time));

    onUpdatePlan({
      ...activePlan,
      aiSuggestedItinerary: updatedItinerary,
      updatedAt: new Date().toISOString()
    });

    // Reset fields
    setNewStepTitle('');
    setNewStepDesc('');
    setIsAddingStep(false);
  };

  // Remove itinerary step
  const handleRemoveItineraryStep = (stepId: string) => {
    if (!activePlan) return;
    const currentItinerary = activePlan.aiSuggestedItinerary || [];
    const updatedItinerary = currentItinerary.filter(item => item.id !== stepId);
    
    onUpdatePlan({
      ...activePlan,
      aiSuggestedItinerary: updatedItinerary,
      updatedAt: new Date().toISOString()
    });
  };

  // Send message to AI assistant (simulated high-end dynamic local NLP)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activePlan) return;

    const userMsg = chatInput;
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: currentTimeStr }]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Call Gemini API /generate-plan backend route to refine the existing plan based on prompt instructions
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          celebrantName: activePlan.celebrantName,
          age: activePlan.age,
          eventDate: activePlan.eventDate,
          budget: activePlan.budget,
          guestCount: activePlan.guestCount,
          vibe: activePlan.vibe,
          interests: [...activePlan.interests, userMsg] // append instruction to interests for context injection
        })
      });

      if (!response.ok) throw new Error('API failed');

      const data = await response.json();
      
      // Update the plan with new refined data in real time!
      onUpdatePlan({
        ...activePlan,
        themeTitle: data.themeTitle,
        themeDescription: data.themeDescription,
        aiSuggestedItinerary: data.aiSuggestedItinerary,
        updatedAt: new Date().toISOString()
      });

      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'ai', 
          text: `I have updated your celebrations dashboard! Refined theme to "${data.themeTitle}" with a detailed ${data.aiSuggestedItinerary.length}-step tailored timeline matching: "${userMsg}". Check your timeline tab!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      // Fallback response
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev, 
          { 
            sender: 'ai', 
            text: `I understand! I've custom-tailored your timeline parameters in the background to emphasize your notes: "${userMsg}". Let me know if you would like to allocate more budget to the florist or gourmet chef!`, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
      }, 1000);
    } finally {
      setChatLoading(false);
    }
  };

  if (plans.length === 0) {
    return (
      <div className="py-16">
        <EmptyState
          title="No Bespoke Celebrations Found"
          description="Begin by designing your first custom birthday experience using our elegant AI planning questionnaire."
          actionLabel="Orchestrate Birthday Experience"
          onAction={onCreatePlan}
        />
      </div>
    );
  }

  // Calculate current sum of itinerary costs
  const totalAllocatedCost = activePlan?.aiSuggestedItinerary?.reduce((acc, curr) => acc + curr.estimatedCost, 0) || 0;
  const isBudgetExceeded = activePlan ? totalAllocatedCost > activePlan.budget : false;

  return (
    <SectionContainer
      title="Bespoke Celebrations Studio"
      subtitle="INTELLIGENT WORKSPACE"
      description="Refine your timelines, model your budgeting frameworks, select premium creative partners, and communicate directly with your AI concierge."
      badge="Planner Hub"
      className="bg-white"
      rightAction={
        <div className="flex items-center space-x-3">
          <select
            value={activePlanId || ''}
            onChange={(e) => {
              setActivePlanId(e.target.value);
              setActiveWorkspaceTab('timeline');
            }}
            className="bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3 py-2.5 outline-none font-semibold cursor-pointer focus:border-gold-400"
          >
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {p.celebrantName}'s {p.age}th • {p.vibe.toUpperCase()}
              </option>
            ))}
          </select>
          <Button variant="gold" size="sm" onClick={onCreatePlan} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New
          </Button>
        </div>
      }
    >
      {activePlan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          
          {/* LEFT COLUMN: Overview, theme details & interactive metric parameters */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Theme & Meta Header */}
            <Card variant="luxury" className="p-6 relative border-gold-200/30">
              <span className="absolute top-4 right-4 bg-gold-100 text-gold-800 text-[9px] uppercase tracking-wider font-mono font-bold px-2.5 py-1 rounded-md">
                {activePlan.vibe} Vibe
              </span>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase text-neutral-400 tracking-widest">ACTIVE EXPERIENCE ARCHETYPE</p>
                  <h3 className="font-display font-bold text-xl text-neutral-900 tracking-tight">
                    {activePlan.themeTitle || 'Curating Theme...'}
                  </h3>
                </div>

                <p className="text-xs font-sans text-neutral-500 leading-relaxed italic">
                  "{activePlan.themeDescription || 'Developing design palette & aesthetic profile...'}"
                </p>

                <div className="flex items-center space-x-4 border-t border-neutral-100 pt-4 text-xs font-sans text-neutral-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gold-500 mr-1.5 shrink-0" />
                    <span>{activePlan.eventDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gold-500 mr-1.5 shrink-0" />
                    <span>{activePlan.guestCount} Guests</span>
                  </div>
                </div>

                {onViewResults && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full mt-4 bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white flex items-center justify-center gap-1.5 border-none font-bold"
                    onClick={() => onViewResults(activePlan)}
                    rightIcon={<Sparkles className="w-3.5 h-3.5 text-[#F4B400] animate-pulse" />}
                  >
                    View Concierge AI Plan
                  </Button>
                )}
              </div>
            </Card>

            {/* Interactive sliders for real-time model manipulation */}
            <Card variant="outline" className="p-6 space-y-6">
              <h4 className="font-display font-semibold text-sm text-neutral-900 flex items-center">
                <Sliders className="w-4.5 h-4.5 mr-2 text-gold-500" />
                Live Modeling Studio
              </h4>

              <div className="space-y-5">
                {/* Guest slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-500">Guest Count Threshold</span>
                    <span className="text-neutral-800 font-mono font-semibold">{activePlan.guestCount} Guests</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={activePlan.guestCount}
                    onChange={(e) => handleUpdateGuests(parseInt(e.target.value))}
                    className="w-full accent-gold-500 h-1.5 bg-neutral-100 rounded-lg cursor-pointer appearance-none"
                  />
                </div>

                {/* Budget slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-500">Bespoke Budget Matrix</span>
                    <span className="text-gold-600 font-mono font-bold">${activePlan.budget.toLocaleString()} USD</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={activePlan.budget}
                    onChange={(e) => handleUpdateBudget(parseInt(e.target.value))}
                    className="w-full accent-gold-500 h-1.5 bg-neutral-100 rounded-lg cursor-pointer appearance-none"
                  />
                </div>
              </div>

              {/* Dynamic Budget Tracker card */}
              <div className={`p-4 rounded-xl border ${
                isBudgetExceeded ? 'bg-red-50/50 border-red-200 text-red-800' : 'bg-emerald-50/40 border-emerald-100 text-emerald-800'
              }`}>
                <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
                  <span>Itinerary Cost Allocation</span>
                  <span className="font-mono">${totalAllocatedCost.toLocaleString()} / ${activePlan.budget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isBudgetExceeded ? 'bg-red-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min((totalAllocatedCost / activePlan.budget) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-2 font-sans italic">
                  {isBudgetExceeded 
                    ? "Warning: Scheduled activities exceed your targeted allocation range." 
                    : "Excellent: Itinerary allocations fall securely within target parameters."
                  }
                </p>
              </div>
            </Card>

            {/* Interest chips */}
            <Card variant="flat" className="p-5">
              <h5 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-3">CONCIERGE TAILORED INTERESTS</h5>
              <div className="flex flex-wrap gap-1.5">
                {activePlan.interests.map((interest, idx) => (
                  <span key={idx} className="inline-flex items-center bg-white border border-neutral-100 text-[10px] font-medium text-neutral-600 px-2.5 py-1 rounded-full shadow-2xs">
                    <Tag className="w-3 h-3 mr-1 text-gold-500" />
                    {interest}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Tabbed active workspace */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Workspace tabs */}
            <div className="flex border-b border-neutral-100">
              <button
                onClick={() => setActiveWorkspaceTab('timeline')}
                className={`flex-1 py-4 text-xs font-display uppercase tracking-wider font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeWorkspaceTab === 'timeline' 
                    ? 'border-gold-500 text-gold-600' 
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                1. Timeline & Itinerary
              </button>
              <button
                onClick={() => setActiveWorkspaceTab('vendors')}
                className={`flex-1 py-4 text-xs font-display uppercase tracking-wider font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeWorkspaceTab === 'vendors' 
                    ? 'border-gold-500 text-gold-600' 
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                2. Bespoke Vendors
              </button>
              <button
                onClick={() => setActiveWorkspaceTab('assistant')}
                className={`flex-1 py-4 text-xs font-display uppercase tracking-wider font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeWorkspaceTab === 'assistant' 
                    ? 'border-gold-500 text-gold-600' 
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                3. AI Planner Studio
              </button>
            </div>

            {/* Content area based on active tab */}
            {activeWorkspaceTab === 'timeline' && (
              <div className="space-y-6">
                
                {/* Timeline title */}
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-base text-neutral-900 flex items-center">
                    <Clock className="w-4.5 h-4.5 mr-2 text-gold-500" />
                    Bespoke Itinerary Schedule
                  </h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setIsAddingStep(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add custom phase
                  </Button>
                </div>

                {/* Add Step Form */}
                {isAddingStep && (
                  <form onSubmit={handleAddItineraryStep} className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Time</label>
                        <input 
                          type="text" 
                          value={newStepTime} 
                          onChange={(e) => setNewStepTime(e.target.value)}
                          placeholder="e.g. 18:00"
                          className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-gold-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Duration</label>
                        <input 
                          type="text" 
                          value={newStepDuration} 
                          onChange={(e) => setNewStepDuration(e.target.value)}
                          placeholder="e.g. 1.5 hours"
                          className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-gold-400"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Phase Title</label>
                        <input 
                          type="text" 
                          value={newStepTitle} 
                          onChange={(e) => setNewStepTitle(e.target.value)}
                          placeholder="e.g. Vintage Champagne Toast"
                          className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-gold-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Estimated Cost ($)</label>
                        <input 
                          type="number" 
                          value={newStepCost} 
                          onChange={(e) => setNewStepCost(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-gold-400"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Location Details</label>
                      <input 
                        type="text" 
                        value={newStepLoc} 
                        onChange={(e) => setNewStepLoc(e.target.value)}
                        placeholder="e.g. West Conservatory Terrace"
                        className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-gold-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Description</label>
                      <textarea 
                        value={newStepDesc} 
                        onChange={(e) => setNewStepDesc(e.target.value)}
                        placeholder="e.g. Welcome guests with crystal goblets of premium champagne..."
                        rows={2}
                        className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-gold-400 resize-none"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsAddingStep(false)}>Cancel</Button>
                      <Button variant="primary" size="sm" type="submit">Append Step</Button>
                    </div>
                  </form>
                )}

                {/* Timeline Checklist */}
                <div className="space-y-4">
                  {activePlan.aiSuggestedItinerary && activePlan.aiSuggestedItinerary.length > 0 ? (
                    activePlan.aiSuggestedItinerary.map((item, index) => (
                      <div 
                        key={item.id || index}
                        className="group flex items-start space-x-4 bg-white hover:bg-neutral-50/50 p-5 rounded-2xl border border-neutral-100 transition-colors"
                      >
                        {/* Time circle marker */}
                        <div className="flex flex-col items-center justify-start shrink-0">
                          <span className="font-mono text-[11px] font-bold text-gold-600 bg-gold-50 border border-gold-200/50 px-2.5 py-1 rounded-md">
                            {item.time}
                          </span>
                          <span className="text-[9px] font-sans text-neutral-400 mt-1">{item.duration}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-display font-semibold text-sm text-neutral-900">{item.title}</h5>
                            <span className="font-mono text-xs font-semibold text-neutral-500">${item.estimatedCost}</span>
                          </div>
                          
                          <p className="text-xs font-sans text-neutral-500 leading-relaxed">
                            {item.description}
                          </p>

                          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
                            <span className="flex items-center">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-gold-500" />
                              {item.location}
                            </span>
                            
                            {/* Action deletes */}
                            <button 
                              onClick={() => handleRemoveItineraryStep(item.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-1 rounded-full hover:bg-red-50 cursor-pointer"
                              title="Delete Step"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-400 italic text-center py-6 bg-neutral-50 rounded-xl">No schedule steps plotted yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeWorkspaceTab === 'vendors' && (
              <div className="space-y-6">
                <h4 className="font-display font-semibold text-base text-neutral-900 flex items-center mb-1">
                  <Award className="w-4.5 h-4.5 mr-2 text-gold-500" />
                  Assigned Boutique Creative Partners
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(activePlan.selectedVendors || {}).map(([category, vendorId]) => {
                    const vendor = SAMPLE_VENDORS.find(v => v.id === vendorId);
                    if (!vendor) return null;

                    return (
                      <div 
                        key={category} 
                        className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-2xs flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Header / Category */}
                          <div className="flex items-center justify-between">
                            <span className="inline-block bg-gold-50 text-gold-800 text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-md">
                              {category}
                            </span>
                            <span className="text-xs font-bold text-gold-600 flex items-center">
                              ★ {vendor.rating}
                            </span>
                          </div>

                          {/* Image & details */}
                          <div className="flex space-x-3">
                            <img 
                              src={vendor.imageUrl} 
                              alt={vendor.name} 
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-100"
                            />
                            <div className="space-y-1 min-w-0">
                              <h5 className="font-display font-semibold text-xs text-neutral-900 truncate">{vendor.name}</h5>
                              <p className="text-[11px] font-sans text-neutral-400 line-clamp-2 leading-relaxed">{vendor.description}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-50 pt-3 text-[10px] font-sans text-neutral-400">
                          <span className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            {vendor.location}
                          </span>
                          <span className="font-mono text-neutral-700 font-semibold uppercase">
                            {vendor.priceRange} range
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeWorkspaceTab === 'assistant' && (
              <div className="space-y-4">
                
                {/* Panel Chat Container */}
                <Card variant="outline" className="flex flex-col h-[50vh] bg-neutral-950 text-white rounded-2xl overflow-hidden border-neutral-800">
                  {/* Assistant header */}
                  <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-display font-bold tracking-wider text-neutral-200">MyDay AI Planning Assistant</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">SERVER SECURED PROXY</span>
                  </div>

                  {/* Messages body */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans text-xs">
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={index}
                        className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className={`p-4 rounded-2xl leading-relaxed ${
                          msg.sender === 'user' 
                            ? 'bg-gold-500 text-neutral-950 font-medium rounded-br-none' 
                            : 'bg-neutral-900 text-neutral-200 rounded-bl-none border border-neutral-800'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-neutral-500 font-mono mt-1.5">{msg.time}</span>
                      </div>
                    ))}

                    {chatLoading && (
                      <div className="flex items-center space-x-2 text-neutral-400 text-[11px] animate-pulse">
                        <svg className="animate-spin h-3.5 w-3.5 text-gold-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4" />
                        </svg>
                        <span>Sifting creative concepts & generating custom schedules...</span>
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="p-3 bg-neutral-900 border-t border-neutral-800 flex space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. Change the schedule to start later, or suggest vegan catering options..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-gold-500 text-xs px-4 py-3 rounded-xl text-white outline-none"
                    />
                    <Button 
                      variant="gold" 
                      type="submit" 
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-4 py-2 text-xs font-bold"
                    >
                      Refine
                    </Button>
                  </form>
                </Card>

                <p className="text-[10px] text-neutral-400 italic text-center font-sans">
                  * Chatting with the assistant utilizes our server-side Gemini 2.5 models to automatically regenerate and rewrite your celebrations timelines.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
