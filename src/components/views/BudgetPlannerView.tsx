import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Sparkles, DollarSign, TrendingUp, AlertTriangle, CheckCircle, 
  Save, Plus, Trash2, HelpCircle, Edit2, ArrowLeft, Calendar, 
  Users, MapPin, Activity, Download, FileText, RefreshCw, Layers
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { 
  saveBudgetPlanToFirestore, 
  getBudgetPlansFromFirestore, 
  deleteBudgetPlanFromFirestore, 
  DBBudgetPlan 
} from '../../services/db_services';
import { User } from '../../types';

interface BudgetPlannerViewProps {
  user: User | null;
  onNavigateToTab?: (tab: string) => void;
}

const CATEGORY_COLORS = [
  '#6C4CF1', // Purply Indigo
  '#10B981', // Emerald Green
  '#F59E0B', // Amber Gold
  '#EC4899', // Rose Pink
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1'  // Indigo
];

export const BudgetPlannerView: React.FC<BudgetPlannerViewProps> = ({ user, onNavigateToTab }) => {
  const [viewMode, setViewMode] = useState<'create' | 'dashboard' | 'history'>('create');
  
  // Input fields
  const [budget, setBudget] = useState<number>(500000);
  const [eventType, setEventType] = useState<string>('Birthday Soirée');
  const [guestCount, setGuestCount] = useState<number>(50);
  const [theme, setTheme] = useState<string>('Elegant');
  const [location, setLocation] = useState<string>('Lagos');

  // Loading & active plan state
  const [loading, setLoading] = useState<boolean>(false);
  const [activePlan, setActivePlan] = useState<DBBudgetPlan | null>(null);
  const [originalSuggestedPlan, setOriginalSuggestedPlan] = useState<DBBudgetPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<DBBudgetPlan[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load user's saved budgets
  useEffect(() => {
    if (user) {
      loadSavedPlans();
    } else {
      // Load offline budgets from localStorage
      try {
        const offlineBudgetsStr = localStorage.getItem('myday_cached_budgets');
        if (offlineBudgetsStr) {
          setSavedPlans(JSON.parse(offlineBudgetsStr));
        }
      } catch (e) {
        console.warn('Failed to load cached budgets:', e);
      }
    }
  }, [user]);

  const loadSavedPlans = async () => {
    if (!user) return;
    try {
      const plans = await getBudgetPlansFromFirestore(user.uid);
      setSavedPlans(plans);
    } catch (e) {
      console.error('Failed to load saved budgets:', e);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Generate budget via Express backend (uses Gemini or dynamic local mock fallback)
  const handleGenerateBudget = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budget,
          eventType,
          guestCount,
          theme,
          location
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate budget via AI endpoint');
      }

      const data = await response.json();
      
      const newPlan: DBBudgetPlan = {
        userId: user?.uid || 'offline_user',
        totalBudget: budget,
        eventType,
        guestCount,
        theme,
        location,
        explanation: data.explanation || 'Curated AI generated budget layout.',
        allocatedCategories: data.allocatedCategories || [],
        warnings: data.warnings || [],
        savingsSuggestions: data.savingsSuggestions || [],
        createdAt: new Date().toISOString()
      };

      setActivePlan(newPlan);
      // Keep copy of original suggested plan to allow resets
      setOriginalSuggestedPlan(JSON.parse(JSON.stringify(newPlan)));
      setViewMode('dashboard');
    } catch (e) {
      console.error(e);
      showStatus('error', 'Failed to generate budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Manual modifications handler
  const handleCategoryCostChange = (categoryName: string, newCost: number) => {
    if (!activePlan) return;

    // Constrain cost to non-negative numbers
    const finalCost = Math.max(0, Math.round(newCost));

    const updatedCategories = activePlan.allocatedCategories.map(cat => {
      if (cat.categoryName === categoryName) {
        const percentage = Math.round((finalCost / activePlan.totalBudget) * 100);
        return {
          ...cat,
          cost: finalCost,
          percentage
        };
      }
      return cat;
    });

    setActivePlan({
      ...activePlan,
      allocatedCategories: updatedCategories
    });
  };

  // Save plan to Firestore
  const handleSaveBudget = async () => {
    if (!activePlan) return;

    // Check if total matches, but don't prevent saving—just warn.
    const currentSum = activePlan.allocatedCategories.reduce((sum, cat) => sum + cat.cost, 0);
    const diff = activePlan.totalBudget - currentSum;

    try {
      const planToSave = {
        ...activePlan,
        userId: user?.uid || 'offline_user',
        // Update percentages dynamically before saving
        allocatedCategories: activePlan.allocatedCategories.map(cat => ({
          ...cat,
          percentage: Math.round((cat.cost / activePlan.totalBudget) * 100)
        }))
      };

      const budgetId = await saveBudgetPlanToFirestore(planToSave);
      
      // Update active plan state with the returned ID
      setActivePlan({
        ...planToSave,
        id: budgetId
      });

      showStatus('success', user 
        ? 'Budget Plan saved successfully to cloud storage!' 
        : 'Budget saved locally! Sign in to back it up to the cloud.'
      );

      // Refresh listings
      if (user) {
        await loadSavedPlans();
      } else {
        const offlineBudgetsStr = localStorage.getItem('myday_cached_budgets');
        if (offlineBudgetsStr) {
          setSavedPlans(JSON.parse(offlineBudgetsStr));
        }
      }
    } catch (err) {
      console.error(err);
      showStatus('error', 'Could not save budget plan. Please check your network.');
    }
  };

  const handleDeleteSavedPlan = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved budget?')) return;

    try {
      await deleteBudgetPlanFromFirestore(id);
      showStatus('success', 'Budget plan deleted.');
      if (user) {
        loadSavedPlans();
      } else {
        const offlineBudgetsStr = localStorage.getItem('myday_cached_budgets');
        if (offlineBudgetsStr) {
          setSavedPlans(JSON.parse(offlineBudgetsStr));
        }
      }
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to delete budget.');
    }
  };

  const handleSelectSavedPlan = (plan: DBBudgetPlan) => {
    setActivePlan(plan);
    setOriginalSuggestedPlan(JSON.parse(JSON.stringify(plan)));
    setViewMode('dashboard');
  };

  // Helper calculation values
  const currentCategorySum = activePlan ? activePlan.allocatedCategories.reduce((sum, cat) => sum + cat.cost, 0) : 0;
  const remainingBudget = activePlan ? activePlan.totalBudget - currentCategorySum : 0;
  const isOverBudget = remainingBudget < 0;

  // Format Recharts Data
  const chartData = activePlan ? activePlan.allocatedCategories
    .filter(cat => cat.cost > 0)
    .map(cat => ({
      name: cat.categoryName,
      value: cat.cost,
      percentage: Math.round((cat.cost / activePlan.totalBudget) * 100)
    })) : [];

  // Export to simple text file / print
  const handleExportTxt = () => {
    if (!activePlan) return;
    
    let text = `==================================================\n`;
    text += ` MYDAY AI EVENT BUDGET PLANNER REPORT\n`;
    text += `==================================================\n\n`;
    text += `Event Type: ${activePlan.eventType}\n`;
    text += `Theme/Style: ${activePlan.theme}\n`;
    text += `Location: ${activePlan.location}\n`;
    text += `Guest Count: ${activePlan.guestCount} guests\n`;
    text += `Total Allocated Target: ₦${activePlan.totalBudget.toLocaleString()}\n`;
    text += `Current Sum of Categories: ₦${currentCategorySum.toLocaleString()}\n`;
    text += `Remaining Balance: ₦${remainingBudget.toLocaleString()}\n\n`;
    text += `--- STRATEGY SUMMARY ---\n`;
    text += `${activePlan.explanation}\n\n`;
    text += `--- CATEGORY BREAKDOWN ---\n`;
    
    activePlan.allocatedCategories.forEach((cat, index) => {
      text += `${index + 1}. ${cat.categoryName}: ₦${cat.cost.toLocaleString()} (${Math.round((cat.cost / activePlan.totalBudget) * 100)}%)\n`;
      text += `   Info: ${cat.description}\n\n`;
    });

    text += `--- EXPERT SAVINGS TIPS ---\n`;
    activePlan.savingsSuggestions.forEach((sug, i) => {
      text += `• ${sug}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MyDay_Budget_${activePlan.eventType.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] dark:bg-[#09080F] text-neutral-800 dark:text-neutral-200 transition-colors duration-300">
      
      {/* Notifications Toast */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border text-white font-medium flex items-center gap-3 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-600 border-emerald-500 shadow-emerald-600/15' 
                : 'bg-red-600 border-red-500 shadow-red-600/15'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        
        {/* Header Title Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-neutral-100 dark:border-neutral-900 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6C4CF1]/10 text-[#6C4CF1] rounded-full text-xs font-semibold mb-3 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Intelligence Suite
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-neutral-900 dark:text-white">
              AI Budget Planner
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-xl">
              Model, distribute, and customize your birthday and event budgets with the guidance of premium event planners.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant={viewMode === 'create' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('create')}
              leftIcon={<Plus className="w-4 h-4" />}
              className="flex-1 md:flex-none"
            >
              New Planner
            </Button>
            <Button
              variant={viewMode === 'history' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('history')}
              leftIcon={<Layers className="w-4 h-4" />}
              className="flex-1 md:flex-none relative"
            >
              Saved Budgets
              {savedPlans.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {savedPlans.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Dynamic Views */}
        <AnimatePresence mode="wait">
          {viewMode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column - User input form */}
              <div className="lg:col-span-7 bg-white dark:bg-[#12111A] border border-neutral-100 dark:border-white/[0.04] rounded-3xl p-6 md:p-8 shadow-xs">
                <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#6C4CF1]" />
                  Event Parameters
                </h2>

                <div className="space-y-6">
                  {/* Budget Parameter */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex justify-between">
                      <span>Total Target Budget</span>
                      <span className="text-[#6C4CF1] font-bold">₦{budget.toLocaleString()}</span>
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 font-bold">
                        ₦
                      </div>
                      <input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-[#6C4CF1] focus:border-transparent outline-none transition-all"
                        placeholder="Enter total event budget"
                      />
                    </div>
                    {/* Presets */}
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {[150000, 500000, 1500000, 5000000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBudget(val)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex-shrink-0 transition-all cursor-pointer ${
                            budget === val 
                              ? 'bg-[#6C4CF1]/10 border-[#6C4CF1] text-[#6C4CF1]' 
                              : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          ₦{val.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Event Type & Theme */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Event Occasion
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-3 px-4 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-[#6C4CF1] focus:border-transparent outline-none transition-all"
                      >
                        <option value="Birthday Soirée">Birthday Soirée</option>
                        <option value="Milestone Jubilee (50th/60th)">Milestone Jubilee (50th/60th)</option>
                        <option value="Intimate Dinner Party">Intimate Dinner Party</option>
                        <option value="Children's Theme Party">Children's Theme Party</option>
                        <option value="Cocktail Gala Reception">Cocktail Gala Reception</option>
                        <option value="Outdoor Garden Gathering">Outdoor Garden Gathering</option>
                        <option value="Club Rave/Dance Party">Club Rave/Dance Party</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Design Theme Style
                      </label>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-3 px-4 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-[#6C4CF1] focus:border-transparent outline-none transition-all"
                      >
                        <option value="Elegant">Elegant (Candlelight & Roses)</option>
                        <option value="Luxury">Luxury (Royal Gold & Velvet)</option>
                        <option value="Modern">Modern Minimalist (Sleek Charcoal)</option>
                        <option value="Vibrant">Vibrant Festive (Neon Brights)</option>
                        <option value="Cozy">Cozy Warm (Fireside & Acoustic)</option>
                        <option value="Adventurous">Adventurous Canopy (Starlit Outdoor)</option>
                        <option value="Royal Purple">Royal Purple & Silver</option>
                        <option value="African Luxury">African Luxury (Aso-Ebi & Brass)</option>
                        <option value="Black & Gold">Black & Gold Opulence</option>
                      </select>
                    </div>
                  </div>

                  {/* Guest Count & Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex justify-between">
                        <span>Expected Guest Count</span>
                        <span className="text-[#6C4CF1] font-bold">{guestCount} guests</span>
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="5"
                          max="500"
                          step="5"
                          value={guestCount}
                          onChange={(e) => setGuestCount(Number(e.target.value))}
                          className="w-full accent-[#6C4CF1] bg-neutral-200 dark:bg-neutral-800 h-2 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          value={guestCount}
                          onChange={(e) => setGuestCount(Number(e.target.value))}
                          className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-2 px-3 text-sm text-neutral-950 dark:text-white font-medium outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Event Location
                      </label>
                      <div className="relative rounded-xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-[#6C4CF1] focus:border-transparent outline-none transition-all"
                          placeholder="E.g. Lekki Phase 1, Lagos"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full font-bold shadow-md shadow-[#6C4CF1]/20 py-4"
                      isLoading={loading}
                      onClick={handleGenerateBudget}
                      leftIcon={<Sparkles className="w-5 h-5" />}
                    >
                      Automatically Distribute with AI
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column - Informational instructions card */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <Card className="bg-gradient-to-br from-[#6C4CF1]/10 via-[#6C4CF1]/5 to-transparent border border-[#6C4CF1]/20 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <TrendingUp className="w-32 h-32 text-[#6C4CF1]" />
                  </div>
                  
                  <CardBody>
                    <h3 className="text-lg font-display font-bold text-[#6C4CF1] mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Premium Planner Core
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
                      MyDay's budget coordinator uses expert event modeling to divide your total capital across ten foundational vendor areas including Catering, Venues, Decor, and Photography.
                    </p>
                    <ul className="space-y-3 text-xs text-neutral-500 dark:text-neutral-400">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Balances allocation percentages automatically to align with your chosen event style.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Highlights cost per guest and flags category deficits in prime areas.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Allows fine-grained custom editing to reflect real quotes.</span>
                      </li>
                    </ul>
                  </CardBody>
                </Card>

                {savedPlans.length > 0 && (
                  <div className="bg-white dark:bg-[#12111A] border border-neutral-100 dark:border-white/[0.04] rounded-3xl p-6 shadow-xs">
                    <h3 className="text-base font-display font-bold text-neutral-900 dark:text-white mb-4">
                      Recent Saved Budgets
                    </h3>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {savedPlans.slice(0, 3).map((plan) => (
                        <div
                          key={plan.id}
                          onClick={() => handleSelectSavedPlan(plan)}
                          className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-xl cursor-pointer hover:border-[#6C4CF1]/30 hover:bg-neutral-100/50 dark:hover:bg-[#1C1A26] transition-all flex justify-between items-center"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 truncate">
                              {plan.eventType}
                            </p>
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                              ₦{plan.totalBudget.toLocaleString()} • {plan.guestCount} guests
                            </p>
                          </div>
                          <span className="text-[10px] text-[#6C4CF1] bg-[#6C4CF1]/10 px-2.5 py-1 rounded-full font-semibold">
                            Load
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {viewMode === 'dashboard' && activePlan && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Top Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-[#12111A] border border-neutral-100 dark:border-white/[0.04] p-6 rounded-3xl shadow-xs">
                
                <div className="border-r border-neutral-100 dark:border-neutral-900 last:border-0 pr-4">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider block">
                    Total Budget Target
                  </span>
                  <span className="text-2xl font-display font-bold text-neutral-900 dark:text-white block mt-1">
                    ₦{activePlan.totalBudget.toLocaleString()}
                  </span>
                  <span className="text-xs text-neutral-400 block mt-1">
                    {activePlan.eventType}
                  </span>
                </div>

                <div className="border-r border-neutral-100 dark:border-neutral-900 last:border-0 pr-4 pl-0 md:pl-4">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider block">
                    Sum Allocated
                  </span>
                  <span className="text-2xl font-display font-bold text-neutral-900 dark:text-white block mt-1">
                    ₦{currentCategorySum.toLocaleString()}
                  </span>
                  <span className="text-xs text-neutral-400 block mt-1">
                    {Math.round((currentCategorySum / activePlan.totalBudget) * 100)}% distributed
                  </span>
                </div>

                <div className="border-r border-neutral-100 dark:border-neutral-900 last:border-0 pr-4 pl-0 md:pl-4">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider block">
                    Remaining Balance
                  </span>
                  <span className={`text-2xl font-display font-bold block mt-1 ${
                    isOverBudget ? 'text-red-600 dark:text-red-400' : remainingBudget === 0 ? 'text-[#10B981]' : 'text-amber-500'
                  }`}>
                    ₦{remainingBudget.toLocaleString()}
                  </span>
                  <span className="text-xs block mt-1 font-semibold">
                    {isOverBudget ? '⚠️ Red alert: Overspent!' : remainingBudget === 0 ? '✓ Balanced' : '✓ Under budget'}
                  </span>
                </div>

                <div className="pl-0 md:pl-4">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider block">
                    Specs & Location
                  </span>
                  <span className="text-base font-display font-bold text-neutral-900 dark:text-white block mt-1 truncate">
                    {activePlan.guestCount} guests • {activePlan.location}
                  </span>
                  <span className="text-xs text-neutral-400 block mt-1 truncate">
                    Theme: {activePlan.theme}
                  </span>
                </div>

              </div>

              {/* Over Budget Notice */}
              {isOverBudget && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-800 dark:text-red-300 text-sm">
                      Over Budget Alert
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                      You are over budget by ₦{Math.abs(remainingBudget).toLocaleString()}! Please reduce costs on some category sliders to realign with your budget constraints.
                    </p>
                  </div>
                </div>
              )}

              {/* Main Workspace: Left Charts & Tips, Right Category Editors */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left side: visualizers & expert summaries */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Recharts Pie Visualizer */}
                  <div className="bg-white dark:bg-[#12111A] border border-neutral-100 dark:border-white/[0.04] p-6 rounded-3xl shadow-xs">
                    <h3 className="text-base font-display font-bold text-neutral-900 dark:text-white mb-4">
                      Allocation Matrix
                    </h3>
                    <div className="h-64 w-full relative">
                      {chartData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-xs">
                          All category allocations are currently set to zero.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any) => `₦${Number(value).toLocaleString()}`} 
                              contentStyle={{ background: '#12111A', border: '1px solid #23222F', borderRadius: '8px', color: '#fff' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                      
                      {/* Centered Total Label */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Total</span>
                        <span className="block text-sm font-bold text-neutral-950 dark:text-white mt-0.5">
                          ₦{currentCategorySum.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Chart Legend Labels */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs">
                      {chartData.map((item, idx) => (
                        <div key={item.name} className="flex items-center gap-2 truncate">
                          <span 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                          />
                          <span className="text-neutral-600 dark:text-neutral-400 truncate">{item.name}</span>
                          <span className="font-semibold text-neutral-400 ml-auto">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic AI Warnings & Strategy Explanation */}
                  <div className="bg-white dark:bg-[#12111A] border border-neutral-100 dark:border-white/[0.04] p-6 rounded-3xl shadow-xs space-y-4">
                    <div>
                      <h4 className="text-sm font-display font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#6C4CF1]" />
                        Strategic Logic
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-neutral-900 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800/50">
                        {activePlan.explanation}
                      </p>
                    </div>

                    {/* Deficit / Health Warnings */}
                    {activePlan.warnings && activePlan.warnings.length > 0 && (
                      <div>
                        <h4 className="text-sm font-display font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Budget Health Check
                        </h4>
                        <ul className="space-y-2">
                          {activePlan.warnings.map((warn, i) => (
                            <li key={i} className="text-xs text-neutral-500 dark:text-neutral-400 flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5 flex-shrink-0">●</span>
                              <span>{warn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Savings suggestions */}
                  <div className="bg-white dark:bg-[#12111A] border border-neutral-100 dark:border-white/[0.04] p-6 rounded-3xl shadow-xs">
                    <h3 className="text-sm font-display font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#6C4CF1]" />
                      Cost Saving Suggestions
                    </h3>
                    <div className="space-y-3">
                      {activePlan.savingsSuggestions.map((sug, i) => (
                        <div key={i} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          {sug}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right side: Detailed category sliders & editors */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
                      Category Customization
                    </h3>
                    <span className="text-xs text-neutral-400">
                      Use sliders or input fields to fine-tune
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activePlan.allocatedCategories.map((cat, idx) => {
                      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                      return (
                        <div 
                          key={cat.categoryName} 
                          className="bg-white dark:bg-[#12111A] border border-neutral-100 dark:border-white/[0.04] p-5 rounded-2xl shadow-xs hover:border-[#6C4CF1]/20 transition-all"
                        >
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                <h4 className="font-display font-bold text-neutral-900 dark:text-white text-sm">
                                  {cat.categoryName}
                                </h4>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-full font-bold">
                                  {Math.round((cat.cost / activePlan.totalBudget) * 100)}%
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                                {cat.description}
                              </p>
                            </div>

                            {/* Direct amount numeric input */}
                            <div className="flex items-center gap-1 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                              <span className="text-neutral-400 text-xs font-semibold">₦</span>
                              <input
                                type="number"
                                value={cat.cost}
                                onChange={(e) => handleCategoryCostChange(cat.categoryName, Number(e.target.value))}
                                className="w-24 bg-transparent border-0 text-right p-0 font-bold text-xs text-neutral-950 dark:text-white outline-none focus:ring-0"
                              />
                            </div>
                          </div>

                          {/* Cost range slider */}
                          <div className="mt-3 flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max={activePlan.totalBudget * 0.8}
                              step={activePlan.totalBudget * 0.01}
                              value={cat.cost}
                              onChange={(e) => handleCategoryCostChange(cat.categoryName, Number(e.target.value))}
                              className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg cursor-pointer accent-[#6C4CF1]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions Bar */}
                  <div className="bg-white dark:bg-[#12111A] border border-neutral-100 dark:border-white/[0.04] p-5 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (originalSuggestedPlan) {
                          setActivePlan(JSON.parse(JSON.stringify(originalSuggestedPlan)));
                          showStatus('success', 'Reset allocations back to the initial suggested baseline.');
                        }
                      }}
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                    >
                      Reset Suggestion
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportTxt}
                        leftIcon={<FileText className="w-4 h-4" />}
                      >
                        Export Text Report
                      </Button>
                      
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveBudget}
                        leftIcon={<Save className="w-4 h-4" />}
                      >
                        Save Budget to Cloud
                      </Button>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {viewMode === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-white">
                  Your Saved Budgets
                </h2>
                <span className="text-xs text-neutral-400">
                  {savedPlans.length} budget profiles recorded
                </span>
              </div>

              {savedPlans.length === 0 ? (
                <div className="bg-white dark:bg-[#12111A] border border-dashed border-neutral-200 dark:border-neutral-800 p-12 rounded-3xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#6C4CF1]/10 flex items-center justify-center mx-auto text-[#6C4CF1]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-200">No saved budgets found</h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      Generate and customize an event budget allocation, then save it to Firestore to view it in your list.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setViewMode('create')}>
                    Create Budget Profile
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => handleSelectSavedPlan(plan)}
                      className="bg-white dark:bg-[#12111A] border border-neutral-100 dark:border-white/[0.04] p-5 rounded-2xl shadow-xs hover:border-[#6C4CF1]/30 hover:bg-neutral-100/30 dark:hover:bg-[#1C1A26] transition-all cursor-pointer flex flex-col justify-between h-48 group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#6C4CF1] bg-[#6C4CF1]/10 px-2 py-0.5 rounded-md">
                              {plan.theme}
                            </span>
                            <h3 className="font-display font-bold text-neutral-900 dark:text-white text-base mt-2 group-hover:text-[#6C4CF1] transition-colors">
                              {plan.eventType}
                            </h3>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedPlan(e, plan.id || '')}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-400 hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                          {plan.explanation}
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-900 pt-3 mt-4 text-[11px] text-neutral-400">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{plan.guestCount} guests</span>
                        </div>
                        <div className="font-bold text-neutral-900 dark:text-white text-xs">
                          ₦{plan.totalBudget.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
