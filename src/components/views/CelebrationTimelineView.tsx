import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Calendar, CheckCircle2, Circle, Clock, Trash2, Plus, 
  ChevronRight, AlertCircle, Bell, ArrowRight, Check, Send, 
  TrendingUp, CreditCard, Inbox, FileText, BarChart2, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { 
  saveTimelineTaskToFirestore, 
  getTimelineTasksFromFirestore, 
  deleteTimelineTaskFromFirestore, 
  getBookings,
  getBirthdayPlans,
  createNotification,
  DBTimelineTask,
  DBBooking
} from '../../services/db_services';
import { User } from '../../types';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface CelebrationTimelineViewProps {
  user: User | null;
  onNavigateToTab?: (tab: string) => void;
}

export const CelebrationTimelineView: React.FC<CelebrationTimelineViewProps> = ({ user, onNavigateToTab }) => {
  // Wizard state (for creating the timeline)
  const [eventDate, setEventDate] = useState<string>('');
  const [eventType, setEventType] = useState<string>('Birthday Soirée');
  const [theme, setTheme] = useState<string>('Cosmic Twilight');
  const [interestInput, setInterestInput] = useState<string>('');
  const [interests, setInterests] = useState<string[]>(['music', 'elegant decor']);

  // Core planning states
  const [tasks, setTasks] = useState<DBTimelineTask[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('pending');
  const [activePhase, setActivePhase] = useState<'all' | 'planning' | 'booking' | 'invitations' | 'final_touches' | 'day_of'>('all');
  
  // Custom task form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newPhase, setNewPhase] = useState<'planning' | 'booking' | 'invitations' | 'final_touches' | 'day_of'>('planning');
  const [newDaysBefore, setNewDaysBefore] = useState<number>(7);

  // Integrations fetched states
  const [hasInvitations, setHasInvitations] = useState<boolean>(false);
  const [bookingsCount, setBookingsCount] = useState<number>(0);
  const [activeBirthdayPlanId, setActiveBirthdayPlanId] = useState<string>('default');

  // Time remaining countdown clock state
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Load User Plans & Integrations on mount or user change
  useEffect(() => {
    loadTimelineAndIntegrations();
  }, [user]);

  const loadTimelineAndIntegrations = async () => {
    setLoading(true);
    try {
      const uId = user?.uid || 'guest';
      
      // 1. Fetch Birthday Plans to pre-populate Event Date & active ID
      let planId = 'default';
      let foundDate = '';
      let foundType = 'Birthday Soirée';
      
      const plans = await getBirthdayPlans(uId);
      if (plans && plans.length > 0) {
        const latestPlan = plans[0];
        planId = latestPlan.id || 'default';
        setActiveBirthdayPlanId(planId);
        if (latestPlan.birthdayDate) {
          foundDate = latestPlan.birthdayDate.split('T')[0];
          setEventDate(foundDate);
        }
        if (latestPlan.celebrationStyle) {
          setTheme(latestPlan.celebrationStyle);
        }
      }

      // 2. Fetch bookings count
      const bookings = await getBookings(uId);
      const confirmedBookings = bookings.filter(b => b.bookingStatus === 'confirmed' || b.bookingStatus === 'accepted');
      setBookingsCount(confirmedBookings.length);

      // 3. Fetch invitations
      let invitesExist = false;
      try {
        const q = query(collection(db, 'invitations'), where('userId', '==', uId));
        const snap = await getDocs(q);
        invitesExist = !snap.empty;
        setHasInvitations(invitesExist);
      } catch (err) {
        // Fallback checks
        const cached = localStorage.getItem('myday_cached_invitations');
        if (cached) {
          invitesExist = true;
          setHasInvitations(true);
        }
      }

      // 4. Fetch existing timeline tasks
      const fetchedTasks = await getTimelineTasksFromFirestore(uId, planId);
      
      // Auto-update linked tasks if integrations changed
      let tasksUpdated = false;
      const verifiedTasks = fetchedTasks.map(task => {
        let updatedTask = { ...task };
        if (task.linkedType === 'booking' && confirmedBookings.length > 0 && !task.completed) {
          updatedTask.completed = true;
          updatedTask.completedAt = new Date().toISOString();
          tasksUpdated = true;
        }
        if (task.linkedType === 'invitation' && invitesExist && !task.completed) {
          updatedTask.completed = true;
          updatedTask.completedAt = new Date().toISOString();
          tasksUpdated = true;
        }
        return updatedTask;
      });

      if (tasksUpdated) {
        for (const t of verifiedTasks) {
          if (t.id) await saveTimelineTaskToFirestore(t);
        }
        setTasks(verifiedTasks);
      } else {
        setTasks(fetchedTasks);
      }
    } catch (e) {
      console.error('Error loading timeline context:', e);
    } finally {
      setLoading(false);
    }
  };

  // Live countdown timer calculation
  useEffect(() => {
    if (!eventDate) return;

    const interval = setInterval(() => {
      const targetTime = new Date(`${eventDate}T18:00:00`).getTime();
      const currentTime = new Date().getTime();
      const difference = targetTime - currentTime;

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds, expired: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [eventDate]);

  // Generate Personalized Timeline Checklist via Express API
  const handleGenerateTimeline = async () => {
    if (!eventDate) {
      showStatus('error', 'Please select an event celebration date.');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/generate-timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventDate,
          eventType,
          theme,
          interests
        })
      });

      if (!res.ok) {
        throw new Error('API server failed to respond correctly.');
      }

      const data = await res.json();
      const rawTasks = data.tasks || [];
      const uId = user?.uid || 'guest';

      // Map raw API tasks into complete DB fields & save them
      const savedTasks: DBTimelineTask[] = [];
      for (const t of rawTasks) {
        // Calculate exact due date based on daysBefore
        const eventMs = new Date(eventDate).getTime();
        const dueMs = eventMs - (t.daysBefore * 24 * 60 * 60 * 1000);
        const dueDateStr = new Date(dueMs).toISOString().split('T')[0];

        // Check if already auto-complete from integrations
        let autoCompleted = false;
        if (t.linkedType === 'booking' && bookingsCount > 0) autoCompleted = true;
        if (t.linkedType === 'invitation' && hasInvitations) autoCompleted = true;

        const newTask: DBTimelineTask = {
          userId: uId,
          birthdayPlanId: activeBirthdayPlanId,
          title: t.title,
          description: t.description,
          dueDate: dueDateStr,
          phase: t.phase as DBTimelineTask['phase'],
          completed: autoCompleted,
          completedAt: autoCompleted ? new Date().toISOString() : null,
          linkedType: t.linkedType,
          reminderDaysBefore: t.reminderDaysBefore || 2,
          automaticReminderSent: false,
          createdAt: new Date().toISOString()
        };

        const taskId = await saveTimelineTaskToFirestore(newTask);
        savedTasks.push({ ...newTask, id: taskId });
      }

      setTasks(savedTasks);
      showStatus('success', 'Custom AI Celebration Timeline generated successfully!');
    } catch (e) {
      console.error('Timeline generation failed:', e);
      showStatus('error', 'Failed to generate timeline. Using fallback tracker.');
    } finally {
      setGenerating(false);
    }
  };

  // Add a brand-new custom task
  const handleAddCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showStatus('error', 'Task title is required.');
      return;
    }

    try {
      const uId = user?.uid || 'guest';
      const eventMs = new Date(eventDate || new Date()).getTime();
      const dueMs = eventMs - (newDaysBefore * 24 * 60 * 60 * 1000);
      const dueDateStr = new Date(dueMs).toISOString().split('T')[0];

      const newTask: DBTimelineTask = {
        userId: uId,
        birthdayPlanId: activeBirthdayPlanId,
        title: newTitle,
        description: newDescription,
        dueDate: dueDateStr,
        phase: newPhase,
        completed: false,
        completedAt: null,
        linkedType: 'none',
        reminderDaysBefore: 2,
        automaticReminderSent: false,
        createdAt: new Date().toISOString()
      };

      const taskId = await saveTimelineTaskToFirestore(newTask);
      setTasks(prev => [...prev, { ...newTask, id: taskId }]);
      
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setShowAddForm(false);
      showStatus('success', 'Custom task successfully added to timeline!');
    } catch (err) {
      console.error('Error adding custom task:', err);
      showStatus('error', 'Failed to add custom task.');
    }
  };

  // Toggle complete / incomplete status
  const handleToggleComplete = async (task: DBTimelineTask) => {
    try {
      const updated = {
        ...task,
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
      };

      await saveTimelineTaskToFirestore(updated);
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      
      if (updated.completed) {
        showStatus('success', `Completed: "${task.title}"!`);
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      showStatus('error', 'Could not save task state.');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!taskId) return;
    try {
      await deleteTimelineTaskFromFirestore(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showStatus('success', 'Task removed from timeline.');
    } catch (err) {
      console.error('Error deleting task:', err);
      showStatus('error', 'Failed to delete task.');
    }
  };

  // Simulation of Automatic Reminders trigger
  const handleSimulateReminder = async (task: DBTimelineTask) => {
    try {
      const uId = user?.uid || 'guest';
      
      // Save notification to Firestore
      await createNotification({
        userId: uId,
        title: `Reminder: ${task.title}`,
        message: `Your planning milestone is upcoming: "${task.description}". Make sure to mark it complete!`,
        read: false,
        createdAt: new Date().toISOString()
      });

      // Show native/in-app feedback
      showStatus('success', `Simulated automatic reminder dispatched for "${task.title}"!`);
    } catch (e) {
      console.error(e);
      showStatus('error', 'Failed to trigger reminder simulation.');
    }
  };

  // Interest Tag helpers
  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim().toLowerCase())) {
      setInterests([...interests, interestInput.trim().toLowerCase()]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter(i => i !== item));
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Split by phase
    const phaseCounts = {
      planning: tasks.filter(t => t.phase === 'planning').length,
      booking: tasks.filter(t => t.phase === 'booking').length,
      invitations: tasks.filter(t => t.phase === 'invitations').length,
      final_touches: tasks.filter(t => t.phase === 'final_touches').length,
      day_of: tasks.filter(t => t.phase === 'day_of').length
    };

    return { total, completed, percentage, phaseCounts };
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Tab filter
      if (activeTab === 'pending' && t.completed) return false;
      if (activeTab === 'completed' && !t.completed) return false;

      // Phase filter
      if (activePhase !== 'all' && t.phase !== activePhase) return false;

      return true;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, activeTab, activePhase]);

  // CSS mappings
  const phaseColors = {
    planning: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900/60', dot: 'bg-indigo-500' },
    booking: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/60', dot: 'bg-emerald-500' },
    invitations: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/60', dot: 'bg-amber-500' },
    final_touches: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/60', dot: 'bg-rose-500' },
    day_of: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-900/60', dot: 'bg-violet-500' }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0A0A0C] text-neutral-900 dark:text-neutral-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold bg-[#6C4CF1]/10 text-[#6C4CF1] dark:bg-[#8B73FF]/10 dark:text-[#8B73FF] rounded-full">
                AI Concierge
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-sans">
              Celebration Timeline
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
              Chronologically ordered planning track customized to your event date, featuring automatic reminders and real-time app modules integration.
            </p>
          </div>

          {tasks.length > 0 && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddForm(true)}
                variant="outline"
                className="flex items-center gap-2 cursor-pointer border-neutral-200 dark:border-neutral-800"
              >
                <Plus className="w-4 h-4 text-[#6C4CF1] dark:text-[#8B73FF]" /> Add Milestone
              </Button>
              <Button 
                onClick={() => setGenerating(true)}
                className="flex items-center gap-2 cursor-pointer bg-[#6C4CF1] text-white hover:bg-[#5B3EE0]"
              >
                <RefreshCw className="w-4 h-4" /> Re-generate
              </Button>
            </div>
          )}
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3.5 rounded-xl border flex items-center gap-3 shadow-sm ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-300' 
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-300'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{statusMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboarding Wizard - Shown if no tasks exist */}
        {tasks.length === 0 && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-5 gap-8"
          >
            <div className="md:col-span-3 bg-white dark:bg-neutral-900/50 dark:border dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#6C4CF1]/10 text-[#6C4CF1] dark:bg-[#8B73FF]/10 dark:text-[#8B73FF] rounded-2xl">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-sans">Setup Your AI Planner</h2>
                  <p className="text-xs text-neutral-400">Generate a comprehensive, bespoke event itinerary checklist</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Event Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                    <input 
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#6C4CF1]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Event Category</label>
                  <select 
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm focus:outline-none focus:border-[#6C4CF1]"
                  >
                    <option value="Birthday Soirée">Birthday Soirée</option>
                    <option value="Milestone Jubilee">Milestone Jubilee</option>
                    <option value="Surprise Gala">Surprise Gala</option>
                    <option value="Boutique Gathering">Boutique Gathering</option>
                    <option value="Corporate Celebration">Corporate Celebration</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Design Theme & Aesthetic</label>
                <select 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm focus:outline-none focus:border-[#6C4CF1]"
                >
                  <option value="Cosmic Twilight">Cosmic Twilight (Dark Rich Indigo)</option>
                  <option value="Elegant Pearl">Elegant Pearl (Pure Off-white)</option>
                  <option value="Vibrant Carnival">Vibrant Carnival (Bright Festive Colors)</option>
                  <option value="Luxury Royal Gold">Luxury Royal Gold (Deep Rich Velvet)</option>
                  <option value="Minimalist Slate">Minimalist Slate (Modern Swiss Aesthetics)</option>
                </select>
              </div>

              {/* Interests tag builder */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Celebration Keywords & Interests</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. live band, photography, cocktails"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                    className="flex-1 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C4CF1]"
                  />
                  <Button 
                    type="button"
                    onClick={handleAddInterest}
                    variant="outline"
                    className="border-neutral-200 dark:border-neutral-800 py-2.5 px-4 text-xs font-semibold"
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {interests.map((item, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg"
                    >
                      {item}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveInterest(item)}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleGenerateTimeline}
                className="w-full bg-[#6C4CF1] hover:bg-[#5839DF] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#6C4CF1]/20"
              >
                <Sparkles className="w-5 h-5" /> Generate Personalized Timeline
              </Button>
            </div>

            {/* Side Tips Card */}
            <div className="md:col-span-2 space-y-6">
              <Card className="bg-gradient-to-br from-[#6C4CF1]/5 to-emerald-500/5 border-neutral-200 dark:border-neutral-800">
                <CardBody className="p-6 space-y-4">
                  <h3 className="font-bold text-lg font-sans text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    How MyDay AI Works
                  </h3>
                  <div className="space-y-3.5">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#6C4CF1]/10 text-[#6C4CF1] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        <strong>Target Date Calculation:</strong> We anchor your milestones based on your specific event date to produce real, calendar-aligned deadlines.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        <strong>Integrated Actions:</strong> Platform bookings and invitation drafts are linked automatically. When you book a hall or build your digital RSVPs, related timeline blocks check off instantly!
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        <strong>Smart Reminders:</strong> Push automatic background reminder sequences triggered 2 to 3 days before any critical milestone.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Status card preview */}
              <div className="p-5 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-2 py-8 bg-white/40 dark:bg-transparent">
                <Clock className="w-8 h-8 text-neutral-300 dark:text-neutral-700 animate-spin" style={{ animationDuration: '6s' }} />
                <h4 className="font-semibold text-sm">No Active Timeline</h4>
                <p className="text-xs text-neutral-400 max-w-[200px]">Enter your celebration details on the left to activate your personalized timeline countdown.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading Spinner */}
        {loading && tasks.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-10 h-10 text-[#6C4CF1] dark:text-[#8B73FF] animate-spin" />
            <p className="text-sm text-neutral-400 font-medium">Analyzing active bookings & synchronizing timeline...</p>
          </div>
        )}

        {/* Generating AI State */}
        {generating && (
          <div className="py-16 bg-white dark:bg-neutral-900/20 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-500 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-lg">MyDay AI Orchestrating Timeline</h3>
              <p className="text-xs text-neutral-400 max-w-sm mt-1 mx-auto leading-relaxed">
                Formulating custom deadlines, auto-linking platform dependencies, and scheduling triggers for your {theme} celebration.
              </p>
            </div>
          </div>
        )}

        {/* ACTIVE TIMELINE CONTENT */}
        {tasks.length > 0 && !generating && (
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Left sidebar: Stats, Countdown Clock, Integrations */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Countdown Clock Widget */}
              <Card className="bg-gradient-to-br from-[#121216] to-[#1E1E28] text-white border-0 shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C4CF1]/10 rounded-full blur-2xl pointer-events-none"></div>
                <CardBody className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-widest font-bold text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> Countdown
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                      Active
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm text-neutral-300 font-medium font-sans">
                      Days to {eventType}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Event Date: {new Date(eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {countdown.expired ? (
                    <div className="text-center py-4">
                      <span className="text-xl font-bold text-neutral-200">The Celebration is Here! 🎉</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 text-center pt-2">
                      <div className="bg-white/5 p-2 rounded-xl">
                        <span className="block text-xl font-bold font-mono text-white">{countdown.days}</span>
                        <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-semibold">Days</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl">
                        <span className="block text-xl font-bold font-mono text-white">{countdown.hours}</span>
                        <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-semibold">Hours</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl">
                        <span className="block text-xl font-bold font-mono text-white">{countdown.minutes}</span>
                        <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-semibold">Mins</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl">
                        <span className="block text-xl font-bold font-mono text-white">{countdown.seconds}</span>
                        <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-semibold">Secs</span>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Progress Completion Bar Widget */}
              <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
                <CardBody className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold font-sans">Overall Progress</span>
                    <span className="text-xl font-bold font-mono text-[#6C4CF1] dark:text-[#8B73FF]">
                      {stats.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-[#6C4CF1] to-emerald-400 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.percentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>{stats.completed} milestones met</span>
                    <span>{stats.total} total tasks</span>
                  </div>

                  <hr className="border-neutral-100 dark:border-neutral-800" />

                  {/* Phase list mini items */}
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium text-neutral-500">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" /> Planning
                      </span>
                      <span className="font-mono text-neutral-400">{stats.phaseCounts.planning} tasks</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium text-neutral-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Vendor Booking
                      </span>
                      <span className="font-mono text-neutral-400">{stats.phaseCounts.booking} tasks</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium text-neutral-500">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> RSVPs & Invites
                      </span>
                      <span className="font-mono text-neutral-400">{stats.phaseCounts.invitations} tasks</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium text-neutral-500">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Final Touches
                      </span>
                      <span className="font-mono text-neutral-400">{stats.phaseCounts.final_touches} tasks</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium text-neutral-500">
                        <span className="w-2 h-2 rounded-full bg-violet-500" /> Day of Event
                      </span>
                      <span className="font-mono text-neutral-400">{stats.phaseCounts.day_of} tasks</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Integration Status Checks */}
              <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
                <CardBody className="p-6 space-y-4">
                  <h4 className="font-bold text-sm font-sans text-neutral-800 dark:text-neutral-200">
                    Application Modules Sync
                  </h4>

                  <div className="space-y-3">
                    {/* Booking module status */}
                    <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold font-sans">Vendor Bookings</p>
                          <p className="text-[10px] text-neutral-400">
                            {bookingsCount > 0 ? `${bookingsCount} Confirmed Booking(s)` : 'No active bookings'}
                          </p>
                        </div>
                      </div>
                      {onNavigateToTab && (
                        <button 
                          onClick={() => onNavigateToTab('vendors')}
                          className="text-[10px] bg-[#6C4CF1]/10 text-[#6C4CF1] hover:bg-[#6C4CF1]/10 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Find Vendors <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Invitation module status */}
                    <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                          <Send className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold font-sans">Digital RSVP Invites</p>
                          <p className="text-[10px] text-neutral-400">
                            {hasInvitations ? 'Invitation Generated' : 'Not dispatched yet'}
                          </p>
                        </div>
                      </div>
                      {onNavigateToTab && (
                        <button 
                          onClick={() => onNavigateToTab('invitation-generator')}
                          className="text-[10px] bg-[#6C4CF1]/10 text-[#6C4CF1] hover:bg-[#6C4CF1]/10 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Design Card <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Budget module status */}
                    <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                          <BarChart2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold font-sans">Budget Allocation</p>
                          <p className="text-[10px] text-neutral-400">Full-stack Sync Connected</p>
                        </div>
                      </div>
                      {onNavigateToTab && (
                        <button 
                          onClick={() => onNavigateToTab('budget-planner')}
                          className="text-[10px] bg-[#6C4CF1]/10 text-[#6C4CF1] hover:bg-[#6C4CF1]/10 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Open Planner <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>

            </div>

            {/* Right block: Main checklist tracking */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Add Custom Milestone Form Panel */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form 
                      onSubmit={handleAddCustomTask}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4"
                    >
                      <h3 className="font-bold text-base font-sans flex items-center gap-2">
                        <Plus className="w-5 h-5 text-[#6C4CF1]" /> Create Custom Task
                      </h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Task Title</label>
                          <input 
                            type="text"
                            placeholder="e.g., Dress fitting session"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C4CF1]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Due Days Before Event</label>
                          <input 
                            type="number"
                            min="0"
                            placeholder="e.g. 10 days before"
                            value={newDaysBefore}
                            onChange={(e) => setNewDaysBefore(Number(e.target.value))}
                            className="w-full bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C4CF1]"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Aesthetic Phase</label>
                          <select 
                            value={newPhase}
                            onChange={(e) => setNewPhase(e.target.value as any)}
                            className="w-full bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C4CF1]"
                          >
                            <option value="planning">Planning (Phase 1)</option>
                            <option value="booking">Booking Vendors (Phase 2)</option>
                            <option value="invitations">RSVP & Invites (Phase 3)</option>
                            <option value="final_touches">Final Touches (Phase 4)</option>
                            <option value="day_of">Day of Event (Phase 5)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Task Description</label>
                          <input 
                            type="text"
                            placeholder="Brief tips or instructions..."
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C4CF1]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          type="button" 
                          onClick={() => setShowAddForm(false)} 
                          variant="outline"
                          className="cursor-pointer border-neutral-200 dark:border-neutral-800 text-xs py-2"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-[#6C4CF1] hover:bg-[#5B3EE0] text-white font-bold text-xs py-2 px-5 cursor-pointer rounded-xl"
                        >
                          Save Task
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filter controls and timeline headers */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 md:p-6 space-y-4 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                  {/* Tabs Completed vs Pending */}
                  <div className="flex gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-950/50 rounded-xl">
                    <button 
                      onClick={() => setActiveTab('pending')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        activeTab === 'pending' 
                          ? 'bg-white dark:bg-neutral-800 text-[#6C4CF1] dark:text-[#8B73FF] shadow-xs' 
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      Upcoming Tasks
                    </button>
                    <button 
                      onClick={() => setActiveTab('completed')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        activeTab === 'completed' 
                          ? 'bg-white dark:bg-neutral-800 text-[#6C4CF1] dark:text-[#8B73FF] shadow-xs' 
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      Completed Tasks
                    </button>
                    <button 
                      onClick={() => setActiveTab('all')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        activeTab === 'all' 
                          ? 'bg-white dark:bg-neutral-800 text-[#6C4CF1] dark:text-[#8B73FF] shadow-xs' 
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      All Tasks
                    </button>
                  </div>

                  {/* Phase Select */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Phase:</span>
                    <select
                      value={activePhase}
                      onChange={(e) => setActivePhase(e.target.value as any)}
                      className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 text-xs rounded-xl p-2 font-medium focus:outline-none"
                    >
                      <option value="all">All Phases</option>
                      <option value="planning">1. Planning</option>
                      <option value="booking">2. Booking Vendors</option>
                      <option value="invitations">3. Invites & RSVPs</option>
                      <option value="final_touches">4. Final Touches</option>
                      <option value="day_of">5. Day of Celebration</option>
                    </select>
                  </div>
                </div>

                {/* Empty check state */}
                {filteredTasks.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-neutral-200 dark:text-neutral-800" />
                    <h4 className="font-semibold text-sm">No tasks found</h4>
                    <p className="text-xs text-neutral-400 max-w-[240px]">
                      {activeTab === 'pending' 
                        ? 'Congratulations! You have completed all tasks in this phase or category.' 
                        : 'No tasks are in this section yet. Generate timeline or complete some milestones!'}
                    </p>
                  </div>
                )}

                {/* Tasks loop rendering as a beautiful vertical timeline */}
                <div className="relative border-l border-neutral-100 dark:border-neutral-800/80 ml-3 md:ml-4 space-y-6 pt-2">
                  {filteredTasks.map((task) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative pl-7 md:pl-8 group"
                    >
                      {/* Timeline dot circle indicators */}
                      <span className="absolute -left-[9px] top-1.5 flex h-4.5 w-4.5 items-center justify-center bg-white dark:bg-[#0A0A0C]">
                        {task.completed ? (
                          <div className="h-4.5 w-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className={`h-3 w-3 rounded-full border-2 transition-transform group-hover:scale-125 ${
                            task.phase === 'planning' ? 'border-indigo-500' :
                            task.phase === 'booking' ? 'border-emerald-500' :
                            task.phase === 'invitations' ? 'border-amber-500' :
                            task.phase === 'final_touches' ? 'border-rose-500' :
                            'border-violet-500'
                          }`} />
                        )}
                      </span>

                      {/* Main task card layout */}
                      <div className="border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 rounded-2xl p-4 transition-all duration-200 hover:shadow-xs hover:border-neutral-200 dark:hover:border-neutral-800 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1 flex-1">
                            {/* Phase badge */}
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold rounded-md flex items-center gap-1.5 ${phaseColors[task.phase].bg} ${phaseColors[task.phase].text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${phaseColors[task.phase].dot}`} />
                                {task.phase === 'planning' ? 'Planning' :
                                 task.phase === 'booking' ? 'Vendor Booking' :
                                 task.phase === 'invitations' ? 'Invites & RSVPs' :
                                 task.phase === 'final_touches' ? 'Final Touches' :
                                 'Day of Celebration'}
                              </span>

                              <span className="text-[10px] text-neutral-400 font-medium">
                                Target Date: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>

                            {/* Title with strike-through on complete */}
                            <h4 className={`text-sm md:text-base font-bold font-sans transition-all duration-200 ${
                              task.completed ? 'text-neutral-400 line-through' : 'text-neutral-800 dark:text-neutral-100'
                            }`}>
                              {task.title}
                            </h4>

                            {/* Tailored Tip */}
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans font-normal">
                              {task.description}
                            </p>
                          </div>

                          {/* Quick complete checkbox / tick trigger */}
                          <button 
                            onClick={() => handleToggleComplete(task)}
                            className={`p-1.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                              task.completed 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-neutral-100 dark:hover:bg-neutral-800' 
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-emerald-500 hover:bg-emerald-50/20'
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Integration contextual cards */}
                        {task.linkedType && task.linkedType !== 'none' && (
                          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                            <span className="text-neutral-400 flex items-center gap-1.5">
                              {task.linkedType === 'booking' && <CreditCard className="w-4 h-4 text-emerald-500" />}
                              {task.linkedType === 'invitation' && <Send className="w-4 h-4 text-amber-500" />}
                              {task.linkedType === 'budget' && <BarChart2 className="w-4 h-4 text-[#6C4CF1]" />}
                              This milestone updates automatically with our 
                              <strong className="text-neutral-600 dark:text-neutral-300">
                                {task.linkedType === 'booking' ? ' Vendors ' :
                                 task.linkedType === 'invitation' ? ' Invitation Generator ' :
                                 ' Budget Planner '}
                              </strong>
                              module.
                            </span>

                            {onNavigateToTab && (
                              <button
                                onClick={() => onNavigateToTab(
                                  task.linkedType === 'booking' ? 'vendors' :
                                  task.linkedType === 'invitation' ? 'invitation-generator' :
                                  'budget-planner'
                                )}
                                className="text-[10px] text-[#6C4CF1] dark:text-[#8B73FF] font-bold hover:underline self-end md:self-auto cursor-pointer"
                              >
                                Configure now →
                              </button>
                            )}
                          </div>
                        )}

                        {/* Reminders / Delete Panel inside Task */}
                        <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800/60 pt-2 text-[10px]">
                          <span className="text-neutral-400 flex items-center gap-1 font-medium">
                            <Bell className="w-3.5 h-3.5 text-neutral-400" />
                            Auto-reminder triggers {task.reminderDaysBefore || 2} days before deadline.
                          </span>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleSimulateReminder(task)}
                              className="text-[#6C4CF1] dark:text-[#8B73FF] hover:underline font-bold tracking-wider cursor-pointer"
                            >
                              Test Reminder
                            </button>
                            <button 
                              onClick={() => handleDeleteTask(task.id!)}
                              className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  ))}
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
