import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Building, MapPin, Clipboard, Image as ImageIcon, 
  ShieldCheck, CheckCircle2, ChevronRight, ChevronLeft, 
  Upload, Loader2, ArrowRight, ArrowLeft, Send, Globe, 
  Phone, Mail, FileText, Check, Calendar, Store, Plus, X, Trash2, Shield
} from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { VendorApplication } from '../../types';
import { saveVendorApplicationToFirestore, getVendorApplicationsFromFirestore } from '../../services/db';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';

interface VendorOnboardingViewProps {
  onGoHome: () => void;
  showNotification: (msg: string) => void;
}

export const VendorOnboardingView: React.FC<VendorOnboardingViewProps> = ({ 
  onGoHome, 
  showNotification 
}) => {
  // Navigation State: 'landing' | 'registering' | 'success' | 'tracker'
  const [viewState, setViewState] = useState<'landing' | 'registering' | 'success' | 'tracker'>('landing');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search Application State (for status tracker)
  const [searchEmail, setSearchEmail] = useState('');
  const [searchedApplications, setSearchedApplications] = useState<VendorApplication[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Form Fields State
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    whatsapp: '',
    category: 'Cake Baker',
    state: 'Kwara State',
    city: 'Ilorin',
    address: '',
    googleMapsUrl: '',
    yearsInBusiness: 1,
    description: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    website: '',
    logo: '',
    portfolioImages: [] as string[],
    priceList: '',
    confirmAccurate: false,
    agreeTerms: false
  });

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // File Uploading States (Progress metrics)
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioProgress, setPortfolioProgress] = useState<Record<number, number>>({});
  const [priceListUploading, setPriceListUploading] = useState(false);
  const [priceListProgress, setPriceListProgress] = useState(0);

  // Drag and drop states
  const [isDragOverLogo, setIsDragOverLogo] = useState(false);
  const [isDragOverPortfolio, setIsDragOverPortfolio] = useState(false);
  const [isDragOverPriceList, setIsDragOverPriceList] = useState(false);

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const priceListInputRef = useRef<HTMLInputElement>(null);

  // Pre-configured category list
  const categories = [
    'Cake Baker', 'Photographer', 'Decorator', 'Restaurant', 
    'Event Venue', 'Gift Shop', 'MC', 'DJ', 'Live Band', 
    'Makeup Artist', 'Fashion Designer', 'Caterer', 
    'Event Planner', 'Florist', 'Other'
  ];

  // Pre-configured cities in Kwara State
  const cities = [
    'Ilorin', 'Offa', 'Omu-Aran', 'Jebba', 'Kaiama', 
    'Lafiagi', 'Share', 'Patigi', 'Other'
  ];

  // Robust File Upload helper with storage fallback
  const uploadFile = (
    file: File,
    path: string,
    onProgress: (percent: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.round(progress));
          },
          (error) => {
            console.warn('Firebase Storage upload blocked or error, activating fallback to local stream:', error);
            simulateLocalUpload(file, onProgress).then(resolve).catch(reject);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      } catch (e) {
        console.warn('Storage uninitialized or failed, falling back to local preview upload:', e);
        simulateLocalUpload(file, onProgress).then(resolve).catch(reject);
      }
    });
  };

  const simulateLocalUpload = (
    file: File,
    onProgress: (percent: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        onProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error('Failed to read file asset locally'));
          };
          reader.readAsDataURL(file);
        }
      }, 100);
    });
  };

  // Upload Handlers
  const handleLogoChange = async (file: File | null) => {
    if (!file) return;
    setLogoUploading(true);
    setLogoProgress(0);
    try {
      const path = `vendor_applications/logos/${Date.now()}_${file.name}`;
      const downloadUrl = await uploadFile(file, path, setLogoProgress);
      setForm(prev => ({ ...prev, logo: downloadUrl }));
      showNotification('Business logo uploaded successfully!');
    } catch (e) {
      console.error(e);
      showNotification('Failed to upload logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handlePortfolioChange = async (files: FileList | null) => {
    if (!files) return;
    const remainingSlots = 10 - form.portfolioImages.length;
    if (remainingSlots <= 0) {
      showNotification('You can only upload up to 10 portfolio images.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setPortfolioUploading(true);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const path = `vendor_applications/portfolio/${Date.now()}_${i}_${file.name}`;
        
        // Update specific image's progress in dictionary
        const url = await uploadFile(file, path, (progress) => {
          setPortfolioProgress(prev => ({ ...prev, [i]: progress }));
        });
        uploadedUrls.push(url);
      }

      setForm(prev => ({
        ...prev,
        portfolioImages: [...prev.portfolioImages, ...uploadedUrls]
      }));
      showNotification(`Successfully uploaded ${filesToUpload.length} portfolio images!`);
    } catch (e) {
      console.error(e);
      showNotification('Failed to upload portfolio images.');
    } finally {
      setPortfolioUploading(false);
      setPortfolioProgress({});
    }
  };

  const handlePriceListChange = async (file: File | null) => {
    if (!file) return;
    setPriceListUploading(true);
    setPriceListProgress(0);
    try {
      const path = `vendor_applications/pricelists/${Date.now()}_${file.name}`;
      const downloadUrl = await uploadFile(file, path, setPriceListProgress);
      setForm(prev => ({ ...prev, priceList: downloadUrl }));
      showNotification('Price list document uploaded!');
    } catch (e) {
      console.error(e);
      showNotification('Failed to upload price list.');
    } finally {
      setPriceListUploading(false);
    }
  };

  const removePortfolioImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter((_, i) => i !== index)
    }));
    showNotification('Portfolio image removed.');
  };

  // Form Validation per step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.businessName.trim()) newErrors.businessName = 'Business Name is required.';
      if (!form.ownerName.trim()) newErrors.ownerName = "Owner's Full Name is required.";
      if (!form.email.trim()) {
        newErrors.email = 'Business Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        newErrors.email = 'Please enter a valid email address.';
      }
      if (!form.phone.trim()) {
        newErrors.phone = 'Phone Number is required.';
      } else if (form.phone.replace(/\D/g, '').length < 8) {
        newErrors.phone = 'Please enter a valid phone number.';
      }
      if (!form.whatsapp.trim()) {
        newErrors.whatsapp = 'WhatsApp Number is required.';
      }
    }

    if (step === 2) {
      if (!form.address.trim()) newErrors.address = 'Business Address is required.';
    }

    if (step === 3) {
      if (form.yearsInBusiness < 0) newErrors.yearsInBusiness = 'Years in business must be a positive number.';
      if (!form.description.trim()) {
        newErrors.description = 'Please write a brief description of your services.';
      } else if (form.description.length < 20) {
        newErrors.description = 'Description should be at least 20 characters.';
      }
      if (!form.instagram.trim() && !form.facebook.trim() && !form.tiktok.trim()) {
        newErrors.socials = 'Please provide at least one active social media handle (Instagram, Facebook or TikTok).';
      }
    }

    if (step === 4) {
      if (!form.logo) newErrors.logo = 'Please upload your business logo.';
      if (form.portfolioImages.length === 0) {
        newErrors.portfolio = 'Please upload at least 1 portfolio image of your past work.';
      }
    }

    if (step === 5) {
      if (!form.confirmAccurate) newErrors.confirmAccurate = 'You must confirm that your details are accurate.';
      if (!form.agreeTerms) newErrors.agreeTerms = 'You must agree to the Vendor Terms to onboard.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showNotification('Please resolve the validation errors before moving forward.');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit vendor application
  const handleSubmitApplication = async () => {
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    try {
      const applicationId = 'app_' + Math.random().toString(36).substr(2, 9);
      const appData: VendorApplication = {
        applicationId,
        businessName: form.businessName,
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone,
        whatsapp: form.whatsapp,
        category: form.category,
        state: form.state,
        city: form.city,
        address: form.address,
        yearsInBusiness: Number(form.yearsInBusiness),
        description: form.description,
        instagram: form.instagram,
        facebook: form.facebook,
        tiktok: form.tiktok,
        website: form.website || undefined,
        logo: form.logo,
        portfolioImages: form.portfolioImages,
        priceList: form.priceList || undefined,
        status: 'Pending',
        submittedAt: new Date().toISOString()
      };

      await saveVendorApplicationToFirestore(appData);
      setViewState('success');
      showNotification('Vendor onboarding application submitted successfully!');
    } catch (e) {
      console.error(e);
      showNotification('Failed to submit onboarding application. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search Application Status
  const handleSearchApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const allApps = await getVendorApplicationsFromFirestore();
      const filtered = allApps.filter(app => app.email.toLowerCase().trim() === searchEmail.toLowerCase().trim());
      setSearchedApplications(filtered);
    } catch (e) {
      console.error(e);
      showNotification('Error checking application status.');
    } finally {
      setIsSearching(false);
    }
  };

  // Reset Onboarding Form
  const resetForm = () => {
    setForm({
      businessName: '',
      ownerName: '',
      email: '',
      phone: '',
      whatsapp: '',
      category: 'Cake Baker',
      state: 'Kwara State',
      city: 'Ilorin',
      address: '',
      googleMapsUrl: '',
      yearsInBusiness: 1,
      description: '',
      instagram: '',
      facebook: '',
      tiktok: '',
      website: '',
      logo: '',
      portfolioImages: [],
      priceList: '',
      confirmAccurate: false,
      agreeTerms: false
    });
    setCurrentStep(1);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-neutral-800">
      
      {/* Premium Top Navigation Accent Bar */}
      <div className="bg-gradient-to-r from-[#6C4CF1] to-[#F4B400] h-1.5 w-full"></div>

      {/* Hero Section or Form Interface */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Sub-Header Branding Tab */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-neutral-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#6C4CF1] flex items-center justify-center text-white font-display font-black text-xs shadow-md">
              M
            </div>
            <div>
              <span className="font-display font-black text-sm tracking-tight text-neutral-800 block">
                MyDay <span className="text-[#6C4CF1]">Network</span>
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#F4B400] font-bold">Kwara State Edition</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (viewState === 'tracker') {
                  setViewState('landing');
                } else {
                  setViewState('tracker');
                  setSearchEmail('');
                  setHasSearched(false);
                  setSearchedApplications([]);
                }
              }}
              className="text-xs font-mono uppercase font-bold tracking-wider text-neutral-500 hover:text-[#6C4CF1] transition-colors cursor-pointer py-1 px-3 border border-neutral-100 rounded-full bg-white hover:border-[#6C4CF1]/20 shadow-2xs"
            >
              {viewState === 'tracker' ? 'Application Form' : 'Check Application Status'}
            </button>
            <button 
              onClick={onGoHome}
              className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-neutral-700 font-mono uppercase tracking-wider transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {/* LANDING SECTION */}
          {viewState === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-12 py-6 text-center max-w-2xl mx-auto"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-[#6C4CF1]/5 border border-[#6C4CF1]/10 px-3 py-1 rounded-full text-[#6C4CF1]">
                  <Sparkles className="w-3.5 h-3.5 text-[#F4B400] animate-pulse" />
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Empowering local industry</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-neutral-900 leading-tight">
                  Join the MyDay <br />
                  <span className="bg-gradient-to-r from-[#6C4CF1] to-[#F4B400] bg-clip-text text-transparent">Vendor Network</span>
                </h1>
                <p className="text-sm text-neutral-500 font-light max-w-lg mx-auto leading-relaxed">
                  Grow your business by connecting with customers looking for trusted birthday services across Kwara State. Register today and let us drive client bookings straight to your storefront.
                </p>
              </div>

              {/* Bento Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
                <div className="p-5 bg-white border border-neutral-100 rounded-2xl shadow-2xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#6C4CF1]">
                    <Store className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xs font-bold text-neutral-800 uppercase">Expanded Reach</h3>
                  <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Exposure to thousands of Kwara State party hosts planning active celebrations.</p>
                </div>

                <div className="p-5 bg-white border border-neutral-100 rounded-2xl shadow-2xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#F4B400]">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xs font-bold text-neutral-800 uppercase">Seamless Bookings</h3>
                  <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Receive structured invitations matching your exact categories and open schedules.</p>
                </div>

                <div className="p-5 bg-white border border-neutral-100 rounded-2xl shadow-2xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xs font-bold text-neutral-800 uppercase">Premium Badge</h3>
                  <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Earn the trusted 'MyDay Elite' certified badge, raising your local brand reputation.</p>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button
                  onClick={() => {
                    resetForm();
                    setViewState('registering');
                  }}
                  className="px-8 py-4 bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white text-xs font-bold uppercase tracking-widest rounded-xl flex items-center space-x-2.5 shadow-md shadow-[#6C4CF1]/20 w-full sm:w-auto cursor-pointer"
                >
                  <span>Become a Vendor</span>
                  <ArrowRight className="w-4 h-4 text-[#F4B400]" />
                </Button>
                <button
                  onClick={() => setViewState('tracker')}
                  className="text-xs font-mono uppercase font-bold tracking-widest text-neutral-500 hover:text-neutral-800 hover:underline cursor-pointer"
                >
                  Track Existing Application
                </button>
              </div>
            </motion.div>
          )}

          {/* APPLICATION FORM INTERFACE */}
          {viewState === 'registering' && (
            <motion.div
              key="registering"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              
              {/* Stepper Progress Header */}
              <div className="bg-white border border-neutral-100 p-5 rounded-3xl shadow-3xs space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-[#6C4CF1]">Step {currentStep} of 5</span>
                    <h2 className="text-sm font-display font-black text-neutral-800 uppercase mt-0.5">
                      {currentStep === 1 && 'Business Information'}
                      {currentStep === 2 && 'Business Location'}
                      {currentStep === 3 && 'Business Profile & Handles'}
                      {currentStep === 4 && 'Curate Portfolio Gallery'}
                      {currentStep === 5 && 'Consent & Verification'}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-100">
                      {Math.round((currentStep / 5) * 100)}% Complete
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentStep / 5) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-[#6C4CF1] to-[#F4B400]"
                  />
                </div>
              </div>

              {/* Step Forms */}
              <Card className="bg-white border border-neutral-100 p-6 md:p-8 rounded-3xl shadow-2xs">
                
                {/* STEP 1: BUSINESS INFO */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-neutral-50 pb-3">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-[#6C4CF1]" />
                        1. Business Identity
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Business Name *</label>
                        <input
                          type="text"
                          value={form.businessName}
                          onChange={(e) => setForm(prev => ({ ...prev, businessName: e.target.value }))}
                          placeholder="e.g. Elegant Layers Bakery"
                          className={`w-full bg-[#FAFAFA] border ${errors.businessName ? 'border-rose-300' : 'border-neutral-100'} rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#6C4CF1]/30 transition-all font-light`}
                        />
                        {errors.businessName && <span className="text-[10px] text-rose-500 font-light">{errors.businessName}</span>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Owner's Full Name *</label>
                        <input
                          type="text"
                          value={form.ownerName}
                          onChange={(e) => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                          placeholder="e.g. Amina Yusuf"
                          className={`w-full bg-[#FAFAFA] border ${errors.ownerName ? 'border-rose-300' : 'border-neutral-100'} rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#6C4CF1]/30 transition-all font-light`}
                        />
                        {errors.ownerName && <span className="text-[10px] text-rose-500 font-light">{errors.ownerName}</span>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Business Email *</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="e.g. layers@bakery.com"
                          className={`w-full bg-[#FAFAFA] border ${errors.email ? 'border-rose-300' : 'border-neutral-100'} rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#6C4CF1]/30 transition-all font-light`}
                        />
                        {errors.email && <span className="text-[10px] text-rose-500 font-light">{errors.email}</span>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Phone Number *</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="e.g. +234 803 123 4567"
                          className={`w-full bg-[#FAFAFA] border ${errors.phone ? 'border-rose-300' : 'border-neutral-100'} rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#6C4CF1]/30 transition-all font-light`}
                        />
                        {errors.phone && <span className="text-[10px] text-rose-500 font-light">{errors.phone}</span>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">WhatsApp Number *</label>
                        <input
                          type="text"
                          value={form.whatsapp}
                          onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                          placeholder="e.g. +234 803 123 4567"
                          className={`w-full bg-[#FAFAFA] border ${errors.whatsapp ? 'border-rose-300' : 'border-neutral-100'} rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#6C4CF1]/30 transition-all font-light`}
                        />
                        {errors.whatsapp && <span className="text-[10px] text-rose-500 font-light">{errors.whatsapp}</span>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Business Category *</label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-[#FAFAFA] border border-neutral-100 rounded-xl px-4 py-3 text-xs text-neutral-800 focus:outline-none focus:border-[#6C4CF1]/30 transition-all"
                        >
                          {categories.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: BUSINESS LOCATION */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-neutral-50 pb-3">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#F4B400]" />
                        2. Location & Coverage Area
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-[#F4B400] uppercase font-bold">State</label>
                        <input
                          type="text"
                          disabled
                          value="Kwara State"
                          className="w-full bg-[#FAFAFA] border border-neutral-100 rounded-xl px-4 py-3 text-xs text-neutral-400 font-mono"
                        />
                        <span className="text-[9px] text-neutral-400 font-light">MyDay currently serves clients exclusively in Kwara State.</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-[#F4B400] uppercase font-bold">City / Territory *</label>
                        <select
                          value={form.city}
                          onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full bg-[#FAFAFA] border border-neutral-100 rounded-xl px-4 py-3 text-xs text-neutral-800 focus:outline-none focus:border-[#6C4CF1]/30 transition-all"
                        >
                          {cities.map((city, idx) => (
                            <option key={idx} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Business Physical Address *</label>
                        <textarea
                          rows={3}
                          value={form.address}
                          onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="e.g. Suite 4, Unity Road, Ilorin, Kwara State"
                          className={`w-full bg-[#FAFAFA] border ${errors.address ? 'border-rose-300' : 'border-neutral-100'} rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#6C4CF1]/30 transition-all font-light`}
                        />
                        {errors.address && <span className="text-[10px] text-rose-500 font-light">{errors.address}</span>}
                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Google Maps Location Link (Optional)</label>
                        <input
                          type="url"
                          value={form.googleMapsUrl}
                          onChange={(e) => setForm(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                          placeholder="e.g. https://maps.app.goo.gl/..."
                          className="w-full bg-[#FAFAFA] border border-neutral-100 rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#6C4CF1]/30 transition-all font-light"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: BUSINESS PROFILE */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-neutral-50 pb-3">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                        <Clipboard className="w-4 h-4 text-indigo-500" />
                        3. Professional Profile & Social Handles
                      </h3>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Years in Business *</label>
                        <input
                          type="number"
                          min="0"
                          value={form.yearsInBusiness}
                          onChange={(e) => setForm(prev => ({ ...prev, yearsInBusiness: Number(e.target.value) }))}
                          className="w-full bg-[#FAFAFA] border border-neutral-100 rounded-xl px-4 py-3 text-xs text-neutral-800 focus:outline-none focus:border-[#6C4CF1]/30 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Business Description *</label>
                        <textarea
                          rows={4}
                          value={form.description}
                          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the specialized birthday services you provide, your unique selling points, and types of milestone events you have serviced..."
                          className={`w-full bg-[#FAFAFA] border ${errors.description ? 'border-rose-300' : 'border-neutral-100'} rounded-xl px-4 py-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#6C4CF1]/30 transition-all font-light`}
                        />
                        {errors.description && <span className="text-[10px] text-rose-500 font-light">{errors.description}</span>}
                      </div>

                      <div className="space-y-3.5 bg-neutral-50/50 p-5 rounded-2xl border border-neutral-100/50">
                        <h4 className="text-[10px] font-mono font-bold uppercase text-neutral-400">Social Handles & Web Presence</h4>
                        <p className="text-[9px] text-neutral-400 leading-normal font-light">Please supply at least one active channel handles so we can verify work aesthetic.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-neutral-400">Instagram Handle</label>
                            <div className="flex items-center bg-white rounded-xl border border-neutral-100 overflow-hidden px-3">
                              <span className="text-xs text-neutral-400 mr-1">@</span>
                              <input
                                type="text"
                                value={form.instagram}
                                onChange={(e) => setForm(prev => ({ ...prev, instagram: e.target.value }))}
                                placeholder="elegantlayers"
                                className="w-full py-2.5 text-xs text-neutral-700 bg-transparent focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-neutral-400">Facebook Page Handle</label>
                            <div className="flex items-center bg-white rounded-xl border border-neutral-100 overflow-hidden px-3">
                              <span className="text-xs text-neutral-400 mr-1">@</span>
                              <input
                                type="text"
                                value={form.facebook}
                                onChange={(e) => setForm(prev => ({ ...prev, facebook: e.target.value }))}
                                placeholder="elegantlayerscakes"
                                className="w-full py-2.5 text-xs text-neutral-700 bg-transparent focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-neutral-400">TikTok Handle</label>
                            <div className="flex items-center bg-white rounded-xl border border-neutral-100 overflow-hidden px-3">
                              <span className="text-xs text-neutral-400 mr-1">@</span>
                              <input
                                type="text"
                                value={form.tiktok}
                                onChange={(e) => setForm(prev => ({ ...prev, tiktok: e.target.value }))}
                                placeholder="elegantlayers_ng"
                                className="w-full py-2.5 text-xs text-neutral-700 bg-transparent focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-neutral-400">Website URL (Optional)</label>
                            <div className="flex items-center bg-white rounded-xl border border-neutral-100 overflow-hidden px-3">
                              <Globe className="w-3.5 h-3.5 text-neutral-300 mr-1.5 shrink-0" />
                              <input
                                type="url"
                                value={form.website}
                                onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="https://elegantlayers.com"
                                className="w-full py-2.5 text-xs text-neutral-700 bg-transparent focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                        {errors.socials && <span className="text-[10px] text-rose-500 font-medium mt-1.5 block">{errors.socials}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: PORTFOLIO UPLOAD */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-neutral-50 pb-3">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-500" />
                        4. Curated Portfolio & Pricelist Upload
                      </h3>
                    </div>

                    <div className="space-y-6">
                      
                      {/* Logo Upload Dropzone */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Business Logo *</label>
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsDragOverLogo(true); }}
                          onDragLeave={() => setIsDragOverLogo(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOverLogo(false);
                            if (e.dataTransfer.files?.[0]) handleLogoChange(e.dataTransfer.files[0]);
                          }}
                          onClick={() => logoInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                            isDragOverLogo ? 'border-[#6C4CF1] bg-[#6C4CF1]/5' : 'border-neutral-200 hover:border-[#6C4CF1]/40 bg-neutral-50/50'
                          }`}
                        >
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
                          />
                          {logoUploading ? (
                            <div className="space-y-2">
                              <Loader2 className="w-6 h-6 text-[#6C4CF1] animate-spin mx-auto" />
                              <div className="text-xs text-neutral-500">Uploading Logo... {logoProgress}%</div>
                              <div className="w-24 h-1.5 bg-neutral-200 rounded-full mx-auto overflow-hidden">
                                <div className="bg-[#6C4CF1] h-full" style={{ width: `${logoProgress}%` }} />
                              </div>
                            </div>
                          ) : form.logo ? (
                            <div className="space-y-2 flex flex-col items-center">
                              <img src={form.logo} alt="Uploaded logo" className="w-16 h-16 rounded-xl object-cover shadow-2xs border border-neutral-100" referrerPolicy="no-referrer" />
                              <span className="text-[10px] text-neutral-400 font-mono">Logo Registered! Click or Drag to replace.</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Upload className="w-5 h-5 text-neutral-400 mx-auto" />
                              <p className="text-xs text-neutral-600 font-medium">Click or Drag & Drop Business Logo</p>
                              <p className="text-[10px] text-neutral-400">PNG, JPG formats accepted</p>
                            </div>
                          )}
                        </div>
                        {errors.logo && <span className="text-[10px] text-rose-500 font-light">{errors.logo}</span>}
                      </div>

                      {/* Portfolio Multi-images Upload Dropzone */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Portfolio Images * (Max 10)</label>
                          <span className="text-[10px] font-mono bg-[#6C4CF1]/5 text-[#6C4CF1] px-2 py-0.5 rounded-full font-bold">
                            {form.portfolioImages.length} / 10 Uploaded
                          </span>
                        </div>

                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsDragOverPortfolio(true); }}
                          onDragLeave={() => setIsDragOverPortfolio(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOverPortfolio(false);
                            if (e.dataTransfer.files) handlePortfolioChange(e.dataTransfer.files);
                          }}
                          onClick={() => portfolioInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                            isDragOverPortfolio ? 'border-[#6C4CF1] bg-[#6C4CF1]/5' : 'border-neutral-200 hover:border-[#6C4CF1]/40 bg-neutral-50/50'
                          }`}
                        >
                          <input
                            ref={portfolioInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePortfolioChange(e.target.files)}
                          />
                          {portfolioUploading ? (
                            <div className="space-y-2">
                              <Loader2 className="w-6 h-6 text-[#6C4CF1] animate-spin mx-auto" />
                              <div className="text-xs text-neutral-500">Uploading Work Gallery...</div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <ImageIcon className="w-5 h-5 text-neutral-400 mx-auto" />
                              <p className="text-xs text-neutral-600 font-medium">Click or Drag to Upload Portfolio Images</p>
                              <p className="text-[10px] text-neutral-400">Highlight your best birthday designs, decoration styles or venues</p>
                            </div>
                          )}
                        </div>
                        {errors.portfolio && <span className="text-[10px] text-rose-500 font-light">{errors.portfolio}</span>}

                        {/* Portfolio Images Grid */}
                        {form.portfolioImages.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                            {form.portfolioImages.map((img, idx) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden shadow-2xs border border-neutral-100 h-20 bg-white">
                                <img src={img} alt={`Work ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removePortfolioImage(idx); }}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 hover:scale-105 transition-all shadow-sm cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Optional Price List Upload */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Upload Price List / Package Brochure (Optional)</label>
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsDragOverPriceList(true); }}
                          onDragLeave={() => setIsDragOverPriceList(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOverPriceList(false);
                            if (e.dataTransfer.files?.[0]) handlePriceListChange(e.dataTransfer.files[0]);
                          }}
                          onClick={() => priceListInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                            isDragOverPriceList ? 'border-[#6C4CF1] bg-[#6C4CF1]/5' : 'border-neutral-200 hover:border-[#6C4CF1]/40 bg-neutral-50/50'
                          }`}
                        >
                          <input
                            ref={priceListInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,image/*"
                            className="hidden"
                            onChange={(e) => handlePriceListChange(e.target.files?.[0] || null)}
                          />
                          {priceListUploading ? (
                            <div className="space-y-2">
                              <Loader2 className="w-6 h-6 text-[#6C4CF1] animate-spin mx-auto" />
                              <div className="text-xs text-neutral-500">Uploading Brochure... {priceListProgress}%</div>
                            </div>
                          ) : form.priceList ? (
                            <div className="space-y-2 flex flex-col items-center">
                              <FileText className="w-10 h-10 text-[#6C4CF1] animate-bounce" />
                              <span className="text-xs font-bold text-neutral-700">Brochure Registered! Click/Drag to replace.</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <FileText className="w-5 h-5 text-neutral-400 mx-auto" />
                              <p className="text-xs text-neutral-600 font-medium">Click or Drag & Drop PDF / Doc Brochure</p>
                              <p className="text-[10px] text-neutral-400 font-light">Share your tiered packages to gain quicker client approval</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* STEP 5: CONSENT & VERIFICATION */}
                {currentStep === 5 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-neutral-50 pb-3">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#6C4CF1]" />
                        5. Final Consent, Terms & Validation Check
                      </h3>
                    </div>

                    <div className="space-y-6">
                      <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start space-x-2.5">
                        <Shield className="w-4 h-4 text-[#F4B400] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[11px] font-bold text-amber-800 uppercase">Verification Guarantee</h4>
                          <p className="text-[10px] text-amber-700 leading-relaxed font-light mt-0.5">
                            Our review concierge manually verifies every vendor profile before approval to keep the platform curated for luxury milestone planners. Providing authentic documentation accelerates approval.
                          </p>
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="space-y-4">
                        <label className="flex items-start space-x-3 p-3 bg-neutral-50 hover:bg-neutral-100/50 rounded-xl border border-neutral-100/50 transition-all cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.confirmAccurate}
                            onChange={(e) => setForm(prev => ({ ...prev, confirmAccurate: e.target.checked }))}
                            className="mt-0.5 w-4 h-4 text-[#6C4CF1] border-neutral-300 rounded focus:ring-[#6C4CF1]/20 focus:outline-none focus:border-[#6C4CF1]"
                          />
                          <span className="text-xs text-neutral-600 leading-normal font-light">
                            I confirm that all information, socials, portfolio work, and logo shared in this application form are accurate representations of my active, registered local business.
                          </span>
                        </label>
                        {errors.confirmAccurate && <span className="text-[10px] text-rose-500 font-light block">{errors.confirmAccurate}</span>}

                        <label className="flex items-start space-x-3 p-3 bg-neutral-50 hover:bg-neutral-100/50 rounded-xl border border-neutral-100/50 transition-all cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.agreeTerms}
                            onChange={(e) => setForm(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                            className="mt-0.5 w-4 h-4 text-[#6C4CF1] border-neutral-300 rounded focus:ring-[#6C4CF1]/20 focus:outline-none focus:border-[#6C4CF1]"
                          />
                          <span className="text-xs text-neutral-600 leading-normal font-light">
                            I agree to the <span className="text-[#6C4CF1] hover:underline font-bold">MyDay Vendor Terms & Services</span>. I agree to pay standard platform processing fees if clients book me directly through the MyDay planner interface.
                          </span>
                        </label>
                        {errors.agreeTerms && <span className="text-[10px] text-rose-500 font-light block">{errors.agreeTerms}</span>}
                      </div>

                      {/* Brief Summary of Onboarding details */}
                      <div className="p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl space-y-2">
                        <h4 className="text-[10px] font-mono font-bold uppercase text-[#6C4CF1]">Review Application Summary</h4>
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[11px] font-light text-neutral-600 pt-1">
                          <div><strong>Business:</strong> {form.businessName}</div>
                          <div><strong>Category:</strong> {form.category}</div>
                          <div><strong>Coverage:</strong> {form.city}, {form.state}</div>
                          <div><strong>Socials:</strong> {form.instagram ? `@${form.instagram}` : 'Not provided'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stepper Buttons Footer */}
                <div className="flex justify-between items-center border-t border-neutral-50 pt-5 mt-6">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase font-bold tracking-wider text-neutral-500 border border-neutral-200 hover:bg-neutral-50 transition-all flex items-center space-x-1 cursor-pointer bg-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 5 ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleNextStep}
                      className="px-6 py-3 bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center space-x-1.5"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={isSubmitting}
                      onClick={handleSubmitApplication}
                      className="px-8 py-3.5 bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white text-xs font-bold uppercase tracking-widest rounded-xl flex items-center space-x-2 shadow-md shadow-[#6C4CF1]/20"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-[#F4B400]" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

              </Card>

            </motion.div>
          )}

          {/* APPLICATION RECEIVED SUCCESS PAGE */}
          {viewState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto bg-white border border-neutral-100 rounded-3xl p-8 text-center space-y-6 shadow-sm"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100 shadow-2xs">
                <Check className="w-8 h-8 text-emerald-600 animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-display font-black text-neutral-800 uppercase tracking-tight">Application Received 🎉</h2>
                <p className="text-xs text-neutral-400 font-light leading-relaxed max-w-sm mx-auto">
                  Thank you for applying to become a MyDay Vendor. Our administrative team will review your local Kwara State business, social links, and portfolio details, and will contact you within <strong>3–5 business days</strong>.
                </p>
              </div>

              <div className="bg-[#FAFAFA] rounded-2xl p-4 border border-neutral-100 text-[11px] font-mono text-neutral-400 text-left space-y-1">
                <div><strong>Registration Status:</strong> <span className="text-amber-500 font-bold uppercase">Pending Review</span></div>
                <div><strong>Business Email:</strong> {form.email}</div>
                <div><strong>Business Name:</strong> {form.businessName}</div>
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  variant="primary" 
                  onClick={onGoHome} 
                  className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl shadow-xs"
                >
                  Return Home
                </Button>
                <button
                  onClick={() => {
                    setSearchEmail(form.email);
                    setViewState('tracker');
                    setHasSearched(false);
                  }}
                  className="text-[10px] font-mono uppercase font-bold text-neutral-400 hover:text-[#6C4CF1] hover:underline"
                >
                  Track Status Tracker
                </button>
              </div>
            </motion.div>
          )}

          {/* APPLICATION STATUS TRACKER */}
          {viewState === 'tracker' && (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-lg mx-auto bg-white border border-neutral-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6"
            >
              <div className="border-b border-neutral-50 pb-3 text-center space-y-1">
                <h2 className="text-md font-display font-black text-neutral-800 uppercase">Vendor Status Tracker</h2>
                <p className="text-[11px] text-neutral-400 font-light">Enter your onboarding email to verify your validation state</p>
              </div>

              <form onSubmit={handleSearchApplication} className="space-y-3">
                <div className="flex items-center space-x-2 bg-[#FAFAFA] p-1.5 rounded-xl border border-neutral-100">
                  <Mail className="w-4 h-4 text-neutral-400 ml-2" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered business email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-grow bg-transparent text-xs text-neutral-800 placeholder-neutral-400 px-2 focus:outline-none font-sans font-light py-2"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSearching}
                    className="bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-lg shrink-0 cursor-pointer"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </form>

              {hasSearched && (
                <div className="space-y-4 pt-2">
                  {searchedApplications.length === 0 ? (
                    <div className="text-center py-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5">
                      <p className="text-xs text-neutral-600 font-medium">No Onboarding Applications Found</p>
                      <p className="text-[10px] text-neutral-400 font-light max-w-xs mx-auto">
                        No applications were found matching "<strong>{searchEmail}</strong>". Make sure the email spelling is correct or apply as a new vendor.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">Applications Found ({searchedApplications.length})</p>
                      
                      {searchedApplications.map((app, idx) => (
                        <div key={idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-bold text-neutral-800">{app.businessName}</h4>
                              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{app.category}</p>
                            </div>
                            <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${
                              app.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : app.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-500 border-rose-100'
                                : 'bg-amber-50 text-amber-500 border-amber-100'
                            }`}>
                              {app.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-1 text-[10px] text-neutral-500 border-t border-neutral-200/50 pt-2 font-light">
                            <div><strong>Submitted On:</strong> {new Date(app.submittedAt).toLocaleDateString()}</div>
                            <div><strong>Location:</strong> {app.city}, Kwara</div>
                          </div>

                          {/* Quick Admin Action Simulator inside tracker to demonstrate approval/rejection workflows in development */}
                          <div className="bg-[#6C4CF1]/5 p-2.5 rounded-xl border border-[#6C4CF1]/10 flex items-center justify-between mt-2">
                            <span className="text-[9px] font-mono text-neutral-500 font-bold">🛠️ Review Simulator:</span>
                            <div className="flex space-x-1.5">
                              <button
                                onClick={async () => {
                                  const updated = { ...app, status: 'Approved' as const };
                                  await saveVendorApplicationToFirestore(updated);
                                  setSearchedApplications(prev => prev.map(a => a.applicationId === app.applicationId ? updated : a));
                                  showNotification('Application set to APPROVED (Simulator)!');
                                }}
                                className="bg-emerald-600 text-white text-[8px] font-mono font-bold uppercase px-2 py-1 rounded-md hover:bg-emerald-700 cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={async () => {
                                  const updated = { ...app, status: 'Rejected' as const };
                                  await saveVendorApplicationToFirestore(updated);
                                  setSearchedApplications(prev => prev.map(a => a.applicationId === app.applicationId ? updated : a));
                                  showNotification('Application set to REJECTED (Simulator)!');
                                }}
                                className="bg-rose-500 text-white text-[8px] font-mono font-bold uppercase px-2 py-1 rounded-md hover:bg-rose-600 cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={async () => {
                                  const updated = { ...app, status: 'Pending' as const };
                                  await saveVendorApplicationToFirestore(updated);
                                  setSearchedApplications(prev => prev.map(a => a.applicationId === app.applicationId ? updated : a));
                                  showNotification('Application set back to PENDING (Simulator).');
                                }}
                                className="bg-amber-500 text-white text-[8px] font-mono font-bold uppercase px-2 py-1 rounded-md hover:bg-amber-600 cursor-pointer"
                              >
                                Pend
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  onClick={() => {
                    setViewState('landing');
                  }}
                  className="text-xs font-mono font-bold uppercase text-neutral-400 hover:text-neutral-700 hover:underline flex items-center justify-center space-x-1.5 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Go Back</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>

    </div>
  );
};
