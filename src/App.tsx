import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { HomeView } from './components/views/HomeView';
import { PlanWizard } from './components/views/PlanWizard';
import { PlannerView } from './components/views/PlannerView';
import { VendorsView } from './components/views/VendorsView';
import { DashboardView } from './components/views/DashboardView';
import { AIResultsView } from './components/views/AIResultsView';
import { BusinessPlanView } from './components/views/BusinessPlanView';
import { InvitationView } from './components/views/InvitationView';
import { InvitationGeneratorView } from './components/views/InvitationGeneratorView';
import { VendorOnboardingView } from './components/views/VendorOnboardingView';
import { VendorDashboardView } from './components/views/VendorDashboardView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { ProfileSettingsView } from './components/views/ProfileSettingsView';
import { CheckoutView } from './components/views/CheckoutView';
import { BudgetPlannerView } from './components/views/BudgetPlannerView';
import { CelebrationTimelineView } from './components/views/CelebrationTimelineView';
import { NotificationCenterView } from './components/views/NotificationCenterView';
import { getUserProfile, saveUserProfile, logSystemActivity } from './services/db_services';
import { User, BirthdayPlan, Vendor } from './types';
import { getStoredUser, saveStoredUser, DEFAULT_MOCK_USER } from './services/auth';
import { getLocalBirthdayPlans, saveBirthdayPlans, getFirestoreBirthdayPlans, savePlanToFirestore, deletePlanFromFirestore } from './services/db';
import { Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';

import { LoginView } from './components/views/LoginView';
import { SignupView } from './components/views/SignupView';
import { ForgotPasswordView } from './components/views/ForgotPasswordView';
import { auth } from './services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<BirthdayPlan[]>([]);
  const [selectedPlanForResults, setSelectedPlanForResults] = useState<BirthdayPlan | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  // Global Theme Toggle State
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('myday_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('myday_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('myday_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Handle manual history changes (back/forward browser buttons)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let loggedUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=100',
          emailVerified: firebaseUser.emailVerified,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          role: 'customer' // default fallback
        };

        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            loggedUser.role = profile.role || 'customer';
            loggedUser.displayName = profile.fullName || loggedUser.displayName;
            if (profile.profileImage) {
              loggedUser.photoURL = profile.profileImage;
            }
          } else {
            const isEmailAdmin = firebaseUser.email?.toLowerCase() === 'akinwandemelody49@gmail.com';
            const determinedRole = isEmailAdmin ? 'admin' : 'customer';
            
            await saveUserProfile(firebaseUser.uid, {
              uid: firebaseUser.uid,
              fullName: loggedUser.displayName || 'Anonymous User',
              email: firebaseUser.email || '',
              role: determinedRole
            });
            loggedUser.role = determinedRole;
          }
        } catch (e) {
          console.error("Error setting up user profile role", e);
        }

        setUser(loggedUser);
        saveStoredUser(loggedUser);

        const currentLoc = window.location.pathname;
        if (loggedUser.role === 'admin') {
          setActiveTab('admin-dashboard');
          if (currentLoc !== '/admin/dashboard') {
            navigate('/admin/dashboard');
          }
        } else if (loggedUser.role === 'vendor') {
          setActiveTab('vendor-dashboard');
          if (currentLoc !== '/vendor/dashboard') {
            navigate('/vendor/dashboard');
          }
        } else {
          setActiveTab('dashboard');
          if (currentLoc !== '/dashboard') {
            navigate('/dashboard');
          }
        }
      } else {
        // If they logged out of firebase, clear the local session too
        const storedUser = getStoredUser();
        if (storedUser && storedUser.uid !== DEFAULT_MOCK_USER.uid) {
          setUser(null);
          saveStoredUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync state with local storage on startup and redirect
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      if (storedUser.role === 'admin') {
        setActiveTab('admin-dashboard');
        if (window.location.pathname !== '/admin/dashboard') {
          navigate('/admin/dashboard');
        }
      } else if (storedUser.role === 'vendor') {
        setActiveTab('vendor-dashboard');
        if (window.location.pathname !== '/vendor/dashboard') {
          navigate('/vendor/dashboard');
        }
      } else {
        setActiveTab('dashboard');
        if (window.location.pathname !== '/dashboard') {
          navigate('/dashboard');
        }
      }
    }
  }, []);

  // Sync tab with URL paths
  useEffect(() => {
    if (currentPath === '/dashboard') {
      if (activeTab === 'home') {
        setActiveTab(user ? 'dashboard' : 'planner');
      }
    } else if (currentPath === '/') {
      if (activeTab !== 'home' && activeTab !== 'plan-wizard' && activeTab !== 'planner' && activeTab !== 'vendors' && activeTab !== 'dashboard' && activeTab !== 'business-plan') {
        setActiveTab('home');
      }
    }
  }, [currentPath, user]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      navigate('/');
    } else if (tab === 'admin-dashboard') {
      navigate('/admin/dashboard');
    } else if (tab === 'vendor-dashboard') {
      navigate('/vendor/dashboard');
    } else if (tab === 'planner' || tab === 'vendors' || tab === 'plan-wizard' || tab === 'dashboard' || tab === 'business-plan' || tab === 'settings' || tab === 'checkout' || tab === 'notifications') {
      navigate('/dashboard');
    }
  };

  // Fetch from Firestore if user is logged in, else from local storage
  useEffect(() => {
    const loadPlans = async () => {
      if (user) {
        try {
          const firestorePlans = await getFirestoreBirthdayPlans(user.uid);
          if (firestorePlans && firestorePlans.length > 0) {
            setPlans(firestorePlans);
            saveBirthdayPlans(firestorePlans); // Keep local storage sync'd
            return;
          }
        } catch (e) {
          console.error("Failed to load plans from Firestore, falling back to local storage", e);
        }
      }
      
      const localPlans = getLocalBirthdayPlans();
      setPlans(localPlans);
    };

    loadPlans();
  }, [user]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Create plan triggers
  const handleCreatePlanTrigger = () => {
    setActiveTab('plan-wizard');
  };

  const handlePlanGenerated = async (newPlan: BirthdayPlan) => {
    const planWithUser = user ? { ...newPlan, userId: user.uid } : newPlan;
    const updatedPlans = [planWithUser, ...plans];
    setPlans(updatedPlans);
    saveBirthdayPlans(updatedPlans);

    if (user) {
      try {
        await savePlanToFirestore(planWithUser);
        // Log plan creation activity
        await logSystemActivity({
          type: 'plan_created',
          userEmail: user.email || 'guest@myday.com',
          userName: user.displayName || 'Guest User',
          details: `Created new birthday plan "${planWithUser.themeTitle}" for ${planWithUser.celebrantName}`,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
      } catch (e) {
        console.error("Failed to save plan to Firestore", e);
      }
    }

    setSelectedPlanForResults(planWithUser);
    setActiveTab('ai-results');
    showNotification(`Successfully orchestrated "${planWithUser.themeTitle}" via AI!`);
  };

  const handleUpdatePlan = async (updatedPlan: BirthdayPlan) => {
    const updatedPlans = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setPlans(updatedPlans);
    saveBirthdayPlans(updatedPlans);

    if (user) {
      try {
        await savePlanToFirestore(updatedPlan);
      } catch (e) {
        console.error("Failed to update plan in Firestore", e);
      }
    }

    showNotification('Workspace updated successfully.');
  };

  const handleDeletePlan = async (id: string) => {
    const planToDelete = plans.find(p => p.id === id);
    const updatedPlans = plans.filter(p => p.id !== id);
    setPlans(updatedPlans);
    saveBirthdayPlans(updatedPlans);

    if (user) {
      try {
        await deletePlanFromFirestore(id);
      } catch (e) {
        console.error("Failed to delete plan from Firestore", e);
      }
    }

    showNotification(`Removed plan for ${planToDelete?.celebrantName}.`);
  };

  // Link selected Vendor to the first planning/draft plan
  const handleLinkVendorToPlan = (vendor: Vendor) => {
    if (plans.length === 0) {
      showNotification('Please create a birthday plan first to link this vendor!');
      setActiveTab('plan-wizard');
      return;
    }
    
    // Pick the first plan as the active workspace target
    const targetPlan = plans[0];
    const category = vendor.category;
    const updatedVendors = {
      ...(targetPlan.selectedVendors || {}),
      [category]: vendor.id
    };

    const updatedPlan: BirthdayPlan = {
      ...targetPlan,
      selectedVendors: updatedVendors,
      updatedAt: new Date().toISOString()
    };

    handleUpdatePlan(updatedPlan);
    showNotification(`Successfully linked "${vendor.name}" as your custom ${category}!`);
  };

  // Redirect authenticated users trying to visit guest-only auth pages
  useEffect(() => {
    if (user && ['/login', '/signup', '/forgot-password'].includes(currentPath)) {
      const targetPath = user.role === 'admin' ? '/admin/dashboard' : (user.role === 'vendor' ? '/vendor/dashboard' : '/dashboard');
      navigate(targetPath);
    }
  }, [user, currentPath]);

  // Real Login and Logout handlers linked to Firebase Auth
  const handleLogin = () => {
    navigate('/login');
  };

  const handleStartPlanning = () => {
    if (user) {
      setActiveTab('plan-wizard');
    } else {
      navigate('/signup');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error', e);
    }
    setUser(null);
    saveStoredUser(null);
    showNotification('Logged out successfully.');
    navigate('/');
  };

  // Dedicated full-screen rendering for Authentication views
  if (currentPath === '/login') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#1A1A1A] selection:bg-[#6C4CF1]/10 selection:text-[#6C4CF1] font-sans">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-5 py-3 rounded-full bg-neutral-900 border border-[#6C4CF1]/20 text-white text-xs font-medium shadow-xl"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F4B400] shrink-0 animate-bounce" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <LoginView
          onNavigate={navigate}
          onSuccess={(u) => {
            setUser(u);
            setActiveTab('dashboard');
          }}
          showNotification={showNotification}
        />
      </div>
    );
  }

  if (currentPath === '/signup') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#1A1A1A] selection:bg-[#6C4CF1]/10 selection:text-[#6C4CF1] font-sans">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-5 py-3 rounded-full bg-neutral-900 border border-[#6C4CF1]/20 text-white text-xs font-medium shadow-xl"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F4B400] shrink-0 animate-bounce" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <SignupView
          onNavigate={navigate}
          onSuccess={(u) => {
            setUser(u);
            setActiveTab('dashboard');
          }}
          showNotification={showNotification}
        />
      </div>
    );
  }

  if (currentPath === '/forgot-password') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#1A1A1A] selection:bg-[#6C4CF1]/10 selection:text-[#6C4CF1] font-sans">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-5 py-3 rounded-full bg-neutral-900 border border-[#6C4CF1]/20 text-white text-xs font-medium shadow-xl"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F4B400] shrink-0 animate-bounce" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <ForgotPasswordView
          onNavigate={navigate}
          showNotification={showNotification}
        />
      </div>
    );
  }

  if (currentPath === '/invite' || window.location.search.includes('planId=') || window.location.search.includes('invite=') || window.location.search.includes('data=')) {
    return (
      <InvitationView onGoHome={() => navigate('/')} />
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA] dark:bg-[#030303] text-[#1A1A1A] dark:text-[#F3F4F6] selection:bg-[#6C4CF1]/10 selection:text-[#6C4CF1] font-sans transition-colors duration-300">
        
        {/* Floating Status Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-5 py-3 rounded-full bg-neutral-900 border border-[#6C4CF1]/20 text-white text-xs font-medium shadow-xl"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-[#F4B400] shrink-0 animate-bounce" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive Sidebar Layout */}
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onLogout={handleLogout}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />

        {/* Workspace panel right of sidebar */}
        <div className="flex-grow flex flex-col min-w-0 md:max-h-screen md:overflow-y-auto">
          <main className="flex-grow pb-16 md:pb-8">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <DashboardView
                    user={user}
                    onNavigateTab={handleTabChange}
                    onPlanBirthday={() => setActiveTab('plan-wizard')}
                    onBrowseVendors={() => setActiveTab('vendors')}
                    showNotification={showNotification}
                  />
                </motion.div>
              )}

              {activeTab === 'payments' && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <DashboardView
                    user={user}
                    onNavigateTab={handleTabChange}
                    onPlanBirthday={() => setActiveTab('plan-wizard')}
                    onBrowseVendors={() => setActiveTab('vendors')}
                    showNotification={showNotification}
                    forceShowPayments={true}
                  />
                </motion.div>
              )}

              {activeTab === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <HomeView
                    onStartPlanning={handleStartPlanning}
                    onExploreVendors={() => setActiveTab('vendors')}
                    onSelectQuickTheme={(vibe) => {
                      setActiveTab('plan-wizard');
                    }}
                  />
                </motion.div>
              )}

              {activeTab === 'plan-wizard' && (
                <motion.div
                  key="wizard"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  <PlanWizard
                    user={user}
                    onPlanGenerated={handlePlanGenerated}
                    onCancel={() => setActiveTab('dashboard')}
                  />
                </motion.div>
              )}

              {activeTab === 'planner' && (
                <motion.div
                  key="planner"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <PlannerView
                    plans={plans}
                    onCreatePlan={handleCreatePlanTrigger}
                    onUpdatePlan={handleUpdatePlan}
                    onDeletePlan={handleDeletePlan}
                    onViewResults={(p) => {
                      setSelectedPlanForResults(p);
                      setActiveTab('ai-results');
                    }}
                  />
                </motion.div>
              )}

              {activeTab === 'ai-results' && (
                <motion.div
                  key="ai-results"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  <AIResultsView
                    plan={selectedPlanForResults || plans[0] || {
                      id: 'temp',
                      userId: 'temp',
                      celebrantName: 'Sarah',
                      age: 28,
                      eventDate: new Date().toISOString().split('T')[0],
                      budget: 150000,
                      guestCount: 20,
                      vibe: 'elegant',
                      interests: ['Fashion', 'Music'],
                      status: 'planning',
                      themeTitle: 'Sarah\'s 28th Elegance Jubilee',
                      themeDescription: 'A custom elegant celebration crafted with love.'
                    }}
                    onSavePlan={() => {
                      if (selectedPlanForResults) {
                        handleUpdatePlan(selectedPlanForResults);
                      }
                    }}
                    onEditPlan={() => {
                      setActiveTab('planner');
                    }}
                    onBookVendors={() => {
                      setActiveTab('checkout');
                    }}
                    onDesignInvitation={() => {
                      setActiveTab('invitation-generator');
                    }}
                    onBack={() => {
                      setActiveTab('dashboard');
                    }}
                    showNotification={showNotification}
                  />
                </motion.div>
              )}

              {activeTab === 'invitation-generator' && (
                <motion.div
                  key="invitation-generator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <InvitationGeneratorView
                    user={user}
                    activePlan={selectedPlanForResults || plans[0] || null}
                    onGoBack={() => {
                      if (selectedPlanForResults) {
                        setActiveTab('ai-results');
                      } else {
                        setActiveTab('dashboard');
                      }
                    }}
                    showNotification={showNotification}
                  />
                </motion.div>
              )}

              {activeTab === 'budget-planner' && (
                <motion.div
                  key="budget-planner"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <BudgetPlannerView
                    user={user}
                    onNavigateToTab={handleTabChange}
                  />
                </motion.div>
              )}

              {activeTab === 'celebration-timeline' && (
                <motion.div
                  key="celebration-timeline"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <CelebrationTimelineView
                    user={user}
                    onNavigateToTab={handleTabChange}
                  />
                </motion.div>
              )}

              {activeTab === 'vendors' && (
                <motion.div
                  key="vendors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <VendorsView
                    user={user}
                    plans={plans}
                    onLinkVendorToPlan={handleLinkVendorToPlan}
                    activePlanName={plans[0]?.celebrantName}
                    showNotification={showNotification}
                  />
                </motion.div>
              )}

              {activeTab === 'checkout' && (
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <CheckoutView
                    plan={selectedPlanForResults || plans[0] || null}
                    onBack={() => {
                      if (selectedPlanForResults) {
                        setActiveTab('ai-results');
                      } else {
                        setActiveTab('dashboard');
                      }
                    }}
                    onNavigateTab={handleTabChange}
                    showNotification={showNotification}
                  />
                </motion.div>
              )}

              {activeTab === 'business-plan' && (
                <motion.div
                  key="business-plan"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <BusinessPlanView />
                </motion.div>
              )}

              {activeTab === 'vendor-onboarding' && (
                <motion.div
                  key="vendor-onboarding"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <VendorOnboardingView
                    onGoHome={() => setActiveTab('dashboard')}
                    showNotification={showNotification}
                  />
                </motion.div>
              )}

              {activeTab === 'vendor-dashboard' && (
                <motion.div
                  key="vendor-dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <VendorDashboardView
                    onGoHome={() => setActiveTab('dashboard')}
                    showNotification={showNotification}
                  />
                </motion.div>
              )}

              {activeTab === 'admin-dashboard' && (
                <motion.div
                  key="admin-dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <AdminDashboardView
                    user={user}
                    showNotification={showNotification}
                    onNavigateTab={handleTabChange}
                  />
                </motion.div>
              )}

              {activeTab === 'settings' && user && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <ProfileSettingsView
                    user={user}
                    onUpdateUser={(updatedUser) => {
                      setUser(updatedUser);
                      saveStoredUser(updatedUser);
                    }}
                    showNotification={showNotification}
                  />
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <NotificationCenterView
                    user={user}
                    showNotification={showNotification}
                    onNavigateTab={handleTabChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#1A1A1A] selection:bg-[#6C4CF1]/10 selection:text-[#6C4CF1] font-sans">
      
      {/* Floating Status Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-5 py-3 rounded-full bg-neutral-900 border border-[#6C4CF1]/20 text-white text-xs font-medium shadow-xl"
          >
            <CheckCircle2 className="w-4 h-4 text-[#F4B400] shrink-0 animate-bounce" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Navigation */}
      <Navbar
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onNewPlan={handleStartPlanning}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main Container Workspace */}
      <main className="flex-grow pb-16">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && user && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <DashboardView
                user={user}
                onNavigateTab={handleTabChange}
                onPlanBirthday={() => setActiveTab('plan-wizard')}
                onBrowseVendors={() => setActiveTab('vendors')}
                showNotification={showNotification}
              />
            </motion.div>
          )}

          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <HomeView
                onStartPlanning={handleStartPlanning}
                onExploreVendors={() => setActiveTab('vendors')}
                onSelectQuickTheme={(vibe) => {
                  if (user) {
                    setActiveTab('plan-wizard');
                  } else {
                    navigate('/signup');
                  }
                }}
              />
            </motion.div>
          )}

          {activeTab === 'plan-wizard' && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <PlanWizard
                user={user}
                onPlanGenerated={handlePlanGenerated}
                onCancel={() => setActiveTab('home')}
              />
            </motion.div>
          )}

          {activeTab === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <PlannerView
                plans={plans}
                onCreatePlan={handleCreatePlanTrigger}
                onUpdatePlan={handleUpdatePlan}
                onDeletePlan={handleDeletePlan}
              />
            </motion.div>
          )}

          {activeTab === 'vendors' && (
            <motion.div
              key="vendors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
                >
              <VendorsView
                user={user}
                plans={plans}
                onLinkVendorToPlan={handleLinkVendorToPlan}
                activePlanName={plans[0]?.celebrantName}
                showNotification={showNotification}
              />
            </motion.div>
          )}

          {activeTab === 'checkout' && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <CheckoutView
                plan={selectedPlanForResults || plans[0] || null}
                onBack={() => {
                  if (selectedPlanForResults) {
                    setActiveTab('ai-results');
                  } else {
                    setActiveTab('home');
                  }
                }}
                onNavigateTab={handleTabChange}
                showNotification={showNotification}
              />
            </motion.div>
          )}

          {activeTab === 'business-plan' && (
            <motion.div
              key="business-plan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <BusinessPlanView />
            </motion.div>
          )}

          {activeTab === 'vendor-onboarding' && (
            <motion.div
              key="vendor-onboarding"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <VendorOnboardingView
                onGoHome={() => setActiveTab('home')}
                showNotification={showNotification}
              />
            </motion.div>
          )}

          {activeTab === 'vendor-dashboard' && (
            <motion.div
              key="vendor-dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <VendorDashboardView
                onGoHome={() => setActiveTab('home')}
                showNotification={showNotification}
              />
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <NotificationCenterView
                user={user}
                showNotification={showNotification}
                onNavigateTab={handleTabChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Premium Footer */}
      <Footer />
    </div>
  );
}
