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
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#1A1A1A] selection:bg-[#C5A059]/10 selection:text-[#C5A059]">
      
      {/* Premium Elegant Gold & Purple Accent Bar */}
      <div className="bg-gradient-to-r from-[#6C4CF1] via-[#C5A059] to-[#1A1A1A] h-1.5 w-full"></div>

      {/* Hero Section or Form Interface */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        
        {/* Elegant Editorial Sub-Header Branding Tab */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 pb-6 border-b border-neutral-200/60 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] border border-neutral-800 flex items-center justify-center text-[#C5A059] font-serif font-bold text-lg shadow-sm">
              M
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-tight text-[#1A1A1A] block">
                MyDay <span className="text-[#C5A059] font-sans font-light text-base tracking-wider ml-1 uppercase">Network</span>
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] inline-block animate-pulse"></span>
                Kwara State Edition
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
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
              className="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-600 hover:text-[#C5A059] transition-all cursor-pointer py-2 px-4 border border-neutral-200 rounded-full bg-white hover:border-[#C5A059]/30 hover:bg-[#FAF9F6] shadow-xs flex items-center gap-1.5"
            >
              <Clipboard className="w-3.5 h-3.5" />
              {viewState === 'tracker' ? 'Registration Portal' : 'Check Application Status'}
            </button>
            <button 
              onClick={onGoHome}
              className="flex items-center space-x-1.5 text-[10px] text-neutral-400 hover:text-[#1A1A1A] font-mono uppercase tracking-wider transition-colors cursor-pointer py-1 px-2.5 rounded-md hover:bg-neutral-100"
            >
              <X className="w-3.5 h-3.5" />
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
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-16 py-4 text-center max-w-3xl mx-auto"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-[#C5A059]/5 border border-[#C5A059]/15 px-4.5 py-1.5 rounded-full text-[#C5A059] shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Empowering Premium Local Industry</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#1A1A1A] leading-[1.12] tracking-tight max-w-2xl mx-auto">
                  Join the MyDay <br />
                  <span className="font-sans font-light italic bg-gradient-to-r from-[#C5A059] via-[#8C7343] to-[#1A1A1A] bg-clip-text text-transparent">Vendor Registry</span>
                </h1>
                
                <p className="text-sm md:text-base text-neutral-500 font-sans font-light max-w-xl mx-auto leading-relaxed">
                  Expand your creative business by connecting with discerning hosts looking for vetted, premier birthday services across Kwara State. Apply today to showcase your storefront.
                </p>
              </div>

              {/* Bento Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left pt-2">
                <div className="p-6 bg-white border border-neutral-200/70 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-3.5 hover:border-[#C5A059]/25 transition-all duration-300 group hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF9F6] border border-neutral-100 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059]/10 transition-colors">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">01 / Reach</h3>
                    <h4 className="text-sm font-semibold text-[#1A1A1A] mt-1 font-display">Expanded Audience</h4>
                  </div>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed">
                    Unparalleled exposure to thousands of local party hosts planning high-end milestone celebrations.
                  </p>
                </div>

                <div className="p-6 bg-white border border-neutral-200/70 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-3.5 hover:border-[#C5A059]/25 transition-all duration-300 group hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF9F6] border border-neutral-100 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059]/10 transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">02 / Bookings</h3>
                    <h4 className="text-sm font-semibold text-[#1A1A1A] mt-1 font-display">Bespoke Inquiries</h4>
                  </div>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed">
                    Receive structured, pre-qualified client invitations matching your exact expertise and availability.
                  </p>
                </div>

                <div className="p-6 bg-white border border-neutral-200/70 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-3.5 hover:border-[#C5A059]/25 transition-all duration-300 group hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF9F6] border border-neutral-100 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059]/10 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">03 / Status</h3>
                    <h4 className="text-sm font-semibold text-[#1A1A1A] mt-1 font-display">Curated Badge</h4>
                  </div>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed">
                    Earn the prestigious 'MyDay Certified' badge, signifying excellence to our premium clientele base.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-6">
                <Button
                  onClick={() => {
                    resetForm();
                    setViewState('registering');
                  }}
                  className="px-10 py-4 bg-[#1A1A1A] hover:bg-neutral-800 text-[#C5A059] hover:text-white text-xs font-mono font-bold uppercase tracking-widest rounded-2xl flex items-center space-x-3.5 shadow-xl transition-all duration-300 w-full sm:w-auto cursor-pointer border border-[#C5A059]/30 hover:border-[#C5A059]"
                >
                  <span>Begin Registration</span>
                  <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
                </Button>
                <button
                  onClick={() => setViewState('tracker')}
                  className="text-xs font-mono uppercase font-bold tracking-widest text-neutral-500 hover:text-[#1A1A1A] hover:underline cursor-pointer transition-colors"
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
              <div className="bg-white border border-neutral-200/60 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-[#C5A059] bg-[#C5A059]/5 px-2.5 py-1 rounded-md border border-[#C5A059]/10">Step {currentStep} of 5</span>
                    <h2 className="text-base font-serif text-[#1A1A1A] mt-2">
                      {currentStep === 1 && 'Business Information'}
                      {currentStep === 2 && 'Business Location & Reach'}
                      {currentStep === 3 && 'Professional Profile & Handles'}
                      {currentStep === 4 && 'Curated Portfolio Gallery'}
                      {currentStep === 5 && 'Verify Details & Signature'}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-200/60">
                      {Math.round((currentStep / 5) * 100)}% Registered
                    </span>
                  </div>
                </div>

                {/* Elegant Minimal Timeline Steps */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((stepNum) => (
                    <div key={stepNum} className="space-y-1">
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${
                        stepNum <= currentStep 
                          ? 'bg-gradient-to-r from-[#C5A059] to-[#1A1A1A]' 
                          : 'bg-neutral-100'
                      }`} />
                      <span className={`text-[8px] font-mono block text-center transition-colors ${
                        stepNum === currentStep 
                          ? 'text-[#C5A059] font-bold' 
                          : 'text-neutral-300'
                      }`}>
                        0{stepNum}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Forms */}
              <Card className="bg-white border border-neutral-200/60 p-6 md:p-10 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
                
                {/* STEP 1: BUSINESS INFO */}
                {currentStep === 1 && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="border-b border-neutral-200/60 pb-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C5A059] flex items-center gap-2">
                        <Building className="w-4 h-4 text-[#C5A059]" />
                        01 / Business Identity
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1">Provide your primary brand details and contact communication channels.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Business Name *</label>
                        <input
                          type="text"
                          value={form.businessName}
                          onChange={(e) => setForm(prev => ({ ...prev, businessName: e.target.value }))}
                          placeholder="e.g. Elegant Layers Bakery"
                          className={`w-full bg-[#FCFAF7] border ${errors.businessName ? 'border-rose-300' : 'border-neutral-200'} rounded-2xl px-4 py-3.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#C5A059]/50 transition-all font-light`}
                        />
                        {errors.businessName && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.businessName}</span>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Owner's Full Name *</label>
                        <input
                          type="text"
                          value={form.ownerName}
                          onChange={(e) => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                          placeholder="e.g. Amina Yusuf"
                          className={`w-full bg-[#FCFAF7] border ${errors.ownerName ? 'border-rose-300' : 'border-neutral-200'} rounded-2xl px-4 py-3.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#C5A059]/50 transition-all font-light`}
                        />
                        {errors.ownerName && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.ownerName}</span>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Business Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400" />
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="e.g. layers@bakery.com"
                            className={`w-full bg-[#FCFAF7] border ${errors.email ? 'border-rose-300' : 'border-neutral-200'} rounded-2xl pl-11 pr-4 py-3.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#C5A059]/50 transition-all font-light`}
                          />
                        </div>
                        {errors.email && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.email}</span>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400" />
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="e.g. +234 803 123 4567"
                            className={`w-full bg-[#FCFAF7] border ${errors.phone ? 'border-rose-300' : 'border-neutral-200'} rounded-2xl pl-11 pr-4 py-3.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#C5A059]/50 transition-all font-light`}
                          />
                        </div>
                        {errors.phone && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.phone}</span>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">WhatsApp Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-3.5 w-4 h-4 text-emerald-500" />
                          <input
                            type="text"
                            value={form.whatsapp}
                            onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                            placeholder="e.g. +234 803 123 4567"
                            className={`w-full bg-[#FCFAF7] border ${errors.whatsapp ? 'border-rose-300' : 'border-neutral-200'} rounded-2xl pl-11 pr-4 py-3.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#C5A059]/50 transition-all font-light`}
                          />
                        </div>
                        {errors.whatsapp && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.whatsapp}</span>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Business Category *</label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-[#FCFAF7] border border-neutral-200 rounded-2xl px-4 py-3.5 text-xs text-neutral-800 focus:outline-none focus:border-[#C5A059]/50 transition-all"
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
                  <div className="space-y-8 animate-fadeIn">
                    <div className="border-b border-neutral-200/60 pb-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C5A059] flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#C5A059]" />
                        02 / Location & Coverage Area
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1">Specify your base physical operations and serving regions across Kwara State.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">State</label>
                        <input
                          type="text"
                          disabled
                          value="Kwara State"
                          className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-2xl px-4 py-3.5 text-xs text-neutral-400 font-mono focus:outline-none"
                        />
                        <span className="text-[9px] text-neutral-400 font-light block mt-1">MyDay currently serves clients exclusively in Kwara State.</span>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">City / Territory *</label>
                        <select
                          value={form.city}
                          onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full bg-[#FCFAF7] border border-neutral-200 rounded-2xl px-4 py-3.5 text-xs text-neutral-800 focus:outline-none focus:border-[#C5A059]/50 transition-all"
                        >
                          {cities.map((city, idx) => (
                            <option key={idx} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Business Physical Address *</label>
                        <textarea
                          rows={3}
                          value={form.address}
                          onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="e.g. Suite 4, Unity Road, Ilorin, Kwara State"
                          className={`w-full bg-[#FCFAF7] border ${errors.address ? 'border-rose-300' : 'border-neutral-200'} rounded-2xl px-4 py-3.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#C5A059]/50 transition-all font-light`}
                        />
                        {errors.address && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.address}</span>}
                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Google Maps Location Link (Optional)</label>
                        <input
                          type="url"
                          value={form.googleMapsUrl}
                          onChange={(e) => setForm(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                          placeholder="e.g. https://maps.app.goo.gl/..."
                          className="w-full bg-[#FCFAF7] border border-neutral-200 rounded-2xl px-4 py-3.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#C5A059]/50 transition-all font-light"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: BUSINESS PROFILE */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="border-b border-neutral-200/60 pb-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C5A059] flex items-center gap-2">
                        <Clipboard className="w-4 h-4 text-[#C5A059]" />
                        03 / Professional Profile & Social Handles
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1">Tell our planners about your legacy, and share channels for visual verification.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2 max-w-xs">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Years in Business *</label>
                        <input
                          type="number"
                          min="0"
                          value={form.yearsInBusiness}
                          onChange={(e) => setForm(prev => ({ ...prev, yearsInBusiness: Number(e.target.value) }))}
                          className="w-full bg-[#FCFAF7] border border-neutral-200 rounded-2xl px-4 py-3.5 text-xs text-neutral-800 focus:outline-none focus:border-[#C5A059]/50 transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Business Description *</label>
                        <textarea
                          rows={4}
                          value={form.description}
                          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the specialized birthday services you provide, your unique selling points, and types of milestone events you have serviced..."
                          className={`w-full bg-[#FCFAF7] border ${errors.description ? 'border-rose-300' : 'border-neutral-200'} rounded-2xl px-4 py-3.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#C5A059]/50 transition-all font-light`}
                        />
                        {errors.description && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.description}</span>}
                      </div>

                      <div className="space-y-4 bg-[#FCFAF7] p-6 rounded-3xl border border-neutral-200/60">
                        <div>
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C5A059]">Social Handles & Web Presence</h4>
                          <p className="text-[10px] text-neutral-400 leading-normal font-light mt-0.5">Please supply at least one active channel handle so we can verify work aesthetics.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono uppercase text-neutral-400">Instagram Handle</label>
                            <div className="flex items-center bg-white rounded-xl border border-neutral-200 overflow-hidden px-3.5 focus-within:border-[#C5A059]/50 transition-colors">
                              <span className="text-xs text-neutral-400 mr-1.5">@</span>
                              <input
                                type="text"
                                value={form.instagram}
                                onChange={(e) => setForm(prev => ({ ...prev, instagram: e.target.value }))}
                                placeholder="elegantlayers"
                                className="w-full py-3 text-xs text-[#1A1A1A] bg-transparent focus:outline-none font-light"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono uppercase text-neutral-400">Facebook Page Handle</label>
                            <div className="flex items-center bg-white rounded-xl border border-neutral-200 overflow-hidden px-3.5 focus-within:border-[#C5A059]/50 transition-colors">
                              <span className="text-xs text-neutral-400 mr-1.5">@</span>
                              <input
                                type="text"
                                value={form.facebook}
                                onChange={(e) => setForm(prev => ({ ...prev, facebook: e.target.value }))}
                                placeholder="elegantlayerscakes"
                                className="w-full py-3 text-xs text-[#1A1A1A] bg-transparent focus:outline-none font-light"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono uppercase text-neutral-400">TikTok Handle</label>
                            <div className="flex items-center bg-white rounded-xl border border-neutral-200 overflow-hidden px-3.5 focus-within:border-[#C5A059]/50 transition-colors">
                              <span className="text-xs text-neutral-400 mr-1.5">@</span>
                              <input
                                type="text"
                                value={form.tiktok}
                                onChange={(e) => setForm(prev => ({ ...prev, tiktok: e.target.value }))}
                                placeholder="elegantlayers_ng"
                                className="w-full py-3 text-xs text-[#1A1A1A] bg-transparent focus:outline-none font-light"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono uppercase text-neutral-400">Website URL (Optional)</label>
                            <div className="flex items-center bg-white rounded-xl border border-neutral-200 overflow-hidden px-3.5 focus-within:border-[#C5A059]/50 transition-colors">
                              <Globe className="w-3.5 h-3.5 text-neutral-300 mr-2 shrink-0" />
                              <input
                                type="url"
                                value={form.website}
                                onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="https://elegantlayers.com"
                                className="w-full py-3 text-xs text-[#1A1A1A] bg-transparent focus:outline-none font-light"
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
                  <div className="space-y-8 animate-fadeIn">
                    <div className="border-b border-neutral-200/60 pb-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C5A059] flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                        04 / Curated Portfolio & Pricelist Upload
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1">Upload brand assets and high-resolution visuals showcasing your professional craft.</p>
                    </div>

                    <div className="space-y-6">
                      
                      {/* Logo Upload Dropzone */}
                      <div className="space-y-2.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Business Logo *</label>
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsDragOverLogo(true); }}
                          onDragLeave={() => setIsDragOverLogo(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOverLogo(false);
                            if (e.dataTransfer.files?.[0]) handleLogoChange(e.dataTransfer.files[0]);
                          }}
                          onClick={() => logoInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 ${
                            isDragOverLogo ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-neutral-200 hover:border-[#C5A059]/40 bg-[#FCFAF7]'
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
                            <div className="space-y-3 py-2">
                              <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin mx-auto" />
                              <div className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">Uploading Logo... {logoProgress}%</div>
                              <div className="w-32 h-1 bg-neutral-100 rounded-full mx-auto overflow-hidden border border-neutral-200">
                                <div className="bg-[#C5A059] h-full transition-all duration-200" style={{ width: `${logoProgress}%` }} />
                              </div>
                            </div>
                          ) : form.logo ? (
                            <div className="space-y-3 flex flex-col items-center py-2">
                              <img src={form.logo} alt="Uploaded logo" className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-neutral-200/80" referrerPolicy="no-referrer" />
                              <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Logo Registered! Replace by dragging here.</span>
                            </div>
                          ) : (
                            <div className="space-y-2 py-2">
                              <Upload className="w-6 h-6 text-neutral-400 mx-auto" />
                              <p className="text-xs text-neutral-600 font-semibold">Click or Drag & Drop Business Logo</p>
                              <p className="text-[10px] text-neutral-400">PNG, JPG formats accepted (preferably square 1:1)</p>
                            </div>
                          )}
                        </div>
                        {errors.logo && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.logo}</span>}
                      </div>

                      {/* Portfolio Multi-images Upload Dropzone */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Portfolio Images * (Max 10)</label>
                          <span className="text-[9px] font-mono bg-[#C5A059]/10 text-[#C5A059] px-3 py-1 rounded-full font-bold">
                            {form.portfolioImages.length} / 10 Selected
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
                          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
                            isDragOverPortfolio ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-neutral-200 hover:border-[#C5A059]/40 bg-[#FCFAF7]'
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
                            <div className="space-y-2 py-2">
                              <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin mx-auto" />
                              <div className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">Uploading Portfolio Elements...</div>
                            </div>
                          ) : (
                            <div className="space-y-2 py-2">
                              <ImageIcon className="w-6 h-6 text-neutral-400 mx-auto" />
                              <p className="text-xs text-neutral-600 font-semibold">Click or Drag to Upload Portfolio Images</p>
                              <p className="text-[10px] text-neutral-400">Provide photos of your best creations, birthday setups, or products</p>
                            </div>
                          )}
                        </div>
                        {errors.portfolio && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.portfolio}</span>}

                        {/* Portfolio Images Grid */}
                        {form.portfolioImages.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 bg-[#FCFAF7] p-5 rounded-3xl border border-neutral-200/60 mt-2">
                            {form.portfolioImages.map((img, idx) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden shadow-xs border border-neutral-200 h-24 bg-white">
                                <img src={img} alt={`Work ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removePortfolioImage(idx); }}
                                    className="p-1.5 rounded-full bg-rose-600 text-white hover:scale-110 transition-all shadow-md cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Optional Price List Upload */}
                      <div className="space-y-2.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">Upload Price List / Package Brochure (Optional)</label>
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsDragOverPriceList(true); }}
                          onDragLeave={() => setIsDragOverPriceList(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOverPriceList(false);
                            if (e.dataTransfer.files?.[0]) handlePriceListChange(e.dataTransfer.files[0]);
                          }}
                          onClick={() => priceListInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 ${
                            isDragOverPriceList ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-neutral-200 hover:border-[#C5A059]/40 bg-[#FCFAF7]'
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
                            <div className="space-y-2 py-2">
                              <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin mx-auto" />
                              <div className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">Uploading Brochure Document... {priceListProgress}%</div>
                            </div>
                          ) : form.priceList ? (
                            <div className="space-y-3 flex flex-col items-center py-2">
                              <FileText className="w-10 h-10 text-[#C5A059] animate-bounce" />
                              <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Brochure Registered! Replace by dragging here.</span>
                            </div>
                          ) : (
                            <div className="space-y-2 py-2">
                              <FileText className="w-6 h-6 text-neutral-400 mx-auto" />
                              <p className="text-xs text-neutral-600 font-semibold">Click or Drag & Drop PDF / Word Brochure</p>
                              <p className="text-[10px] text-neutral-400">Share your tiered packages to gain quicker client approvals</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* STEP 5: CONSENT & VERIFICATION */}
                {currentStep === 5 && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="border-b border-neutral-200/60 pb-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C5A059] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                        05 / Verify Details & Signature
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1">Review your generated application voucher, accept standard terms, and sign off.</p>
                    </div>

                    <div className="space-y-8">
                      <div className="p-5 bg-amber-50/20 border border-amber-200/50 rounded-2xl flex items-start space-x-3">
                        <Shield className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">Review Policy Guarantee</h4>
                          <p className="text-xs text-amber-700 leading-relaxed font-light mt-1">
                            Our administration panel verifies every registry request within 24-48 hours. Valid social handles and cohesive portfolio visuals guarantee rapid onboarding and custom badge distribution.
                          </p>
                        </div>
                      </div>

                      {/* Brief Summary of Onboarding details - Styled like an elegant printed luxury voucher */}
                      <div className="bg-[#FCFAF7] border-2 border-dashed border-[#C5A059]/30 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-xs">
                        
                        {/* Decorative Voucher Corner Dots */}
                        <div className="absolute top-0 left-0 w-3 h-3 bg-[#FAF9F6] rounded-br-full border-r border-b border-neutral-200/60"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 bg-[#FAF9F6] rounded-bl-full border-l border-b border-neutral-200/60"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-[#FAF9F6] rounded-tr-full border-r border-t border-neutral-200/60"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#FAF9F6] rounded-tl-full border-l border-t border-neutral-200/60"></div>

                        <div className="flex justify-between items-start border-b border-[#C5A059]/20 pb-4">
                          <div>
                            <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 font-bold block">Registry Proposal</span>
                            <h4 className="font-serif text-lg text-[#1A1A1A] mt-0.5">{form.businessName || 'Your Business'}</h4>
                            <span className="inline-block text-[9px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-md mt-1 uppercase font-bold tracking-wider">{form.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 font-bold block">Status</span>
                            <span className="text-[9px] font-mono uppercase text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md inline-block mt-1 font-bold tracking-wider">Pending Review</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs font-light text-neutral-600">
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono uppercase text-neutral-400 tracking-wider block">Registrant / Owner</span>
                            <span className="text-[#1A1A1A] font-medium">{form.ownerName || 'Not specified'}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono uppercase text-neutral-400 tracking-wider block">Contact Information</span>
                            <span className="text-[#1A1A1A] font-medium">{form.email || '—'} / {form.phone || '—'}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono uppercase text-neutral-400 tracking-wider block">Coverage Territory</span>
                            <span className="text-[#1A1A1A] font-medium">{form.city || 'Ilorin'}, Kwara State</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono uppercase text-neutral-400 tracking-wider block">Verification Channels</span>
                            <span className="text-[#1A1A1A] font-medium font-mono text-[11px] text-[#C5A059]">
                              {form.instagram ? `@${form.instagram}` : ''} {form.facebook ? ` | @${form.facebook}` : ''} {!form.instagram && !form.facebook ? 'None provided' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-[#C5A059]/20 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[10px] font-mono text-neutral-400">
                          <span>Secure Handshake Protocol</span>
                          <span className="text-[#C5A059] font-bold tracking-wider uppercase text-[9px]">★ MyDay Elite Certified Entry ★</span>
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="space-y-3.5">
                        <label className="flex items-start space-x-3.5 p-4 bg-white hover:bg-[#FCFAF7] rounded-2xl border border-neutral-200/80 transition-all cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={form.confirmAccurate}
                            onChange={(e) => setForm(prev => ({ ...prev, confirmAccurate: e.target.checked }))}
                            className="mt-1 w-4 h-4 text-[#C5A059] border-neutral-300 rounded focus:ring-[#C5A059]/20 focus:outline-none"
                          />
                          <span className="text-xs text-neutral-600 leading-relaxed font-light select-none">
                            I confirm that all information, socials, portfolio work, and logo shared in this application form are accurate representations of my active, registered local business.
                          </span>
                        </label>
                        {errors.confirmAccurate && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.confirmAccurate}</span>}

                        <label className="flex items-start space-x-3.5 p-4 bg-white hover:bg-[#FCFAF7] rounded-2xl border border-neutral-200/80 transition-all cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={form.agreeTerms}
                            onChange={(e) => setForm(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                            className="mt-1 w-4 h-4 text-[#C5A059] border-neutral-300 rounded focus:ring-[#C5A059]/20 focus:outline-none"
                          />
                          <span className="text-xs text-neutral-600 leading-relaxed font-light select-none">
                            I agree to the <span className="text-[#C5A059] hover:underline font-bold">MyDay Vendor Terms & Services</span>. I agree to pay standard platform processing fees if clients book me directly through the MyDay planner interface.
                          </span>
                        </label>
                        {errors.agreeTerms && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.agreeTerms}</span>}
                      </div>

                    </div>
                  </div>
                )}

                {/* Stepper Buttons Footer */}
                <div className="flex justify-between items-center border-t border-neutral-200/60 pt-6 mt-8">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-6 py-3 rounded-xl text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-500 border border-neutral-200 hover:bg-neutral-50 transition-all flex items-center space-x-1.5 cursor-pointer bg-white"
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
                      className="px-7 py-3.5 bg-[#1A1A1A] hover:bg-neutral-800 text-[#C5A059] hover:text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl flex items-center space-x-2 transition-all cursor-pointer border border-[#C5A059]/20"
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
                      className="px-8 py-3.5 bg-[#1A1A1A] hover:bg-neutral-800 text-[#C5A059] hover:text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl flex items-center space-x-2.5 transition-all cursor-pointer border border-[#C5A059]/30"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-[#C5A059]" />
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
              className="max-w-md mx-auto bg-white border border-neutral-200/60 rounded-3xl p-8 text-center space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)]"
            >
              <div className="w-16 h-16 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto text-[#C5A059] border border-[#C5A059]/20 shadow-xs">
                <Check className="w-8 h-8 text-[#C5A059] animate-pulse" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-xl font-serif text-[#1A1A1A]">Application Received 🎉</h2>
                <p className="text-xs text-neutral-500 font-sans font-light leading-relaxed max-w-sm mx-auto">
                  Thank you for applying to become a MyDay Vendor. Our administrative team will review your local Kwara State business, social links, and portfolio details, and will contact you within <strong>3–5 business days</strong>.
                </p>
              </div>

              <div className="bg-[#FCFAF7] rounded-2xl p-5 border border-neutral-200/60 text-[11px] font-mono text-neutral-500 text-left space-y-2">
                <div><strong>Registration Status:</strong> <span className="text-[#C5A059] font-bold uppercase">Pending Review</span></div>
                <div><strong>Business Email:</strong> {form.email}</div>
                <div><strong>Business Name:</strong> {form.businessName}</div>
              </div>

              <div className="space-y-4 pt-2">
                <Button 
                  variant="primary" 
                  onClick={onGoHome} 
                  className="w-full bg-[#1A1A1A] hover:bg-neutral-800 text-[#C5A059] hover:text-white text-xs font-mono font-bold uppercase tracking-widest py-3.5 rounded-xl border border-[#C5A059]/20 cursor-pointer shadow-md transition-all"
                >
                  Return Home
                </Button>
                <button
                  onClick={() => {
                    setSearchEmail(form.email);
                    setViewState('tracker');
                    setHasSearched(false);
                  }}
                  className="text-[10px] font-mono uppercase font-bold text-neutral-400 hover:text-[#C5A059] hover:underline transition-colors"
                >
                  Open Status Tracker
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
              className="max-w-lg mx-auto bg-white border border-neutral-200/60 rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-6"
            >
              <div className="border-b border-neutral-200/60 pb-4 text-center space-y-1.5">
                <h2 className="text-md font-serif text-[#1A1A1A]">Vendor Status Tracker</h2>
                <p className="text-[11px] text-neutral-400 font-sans font-light">Enter your onboarding email to verify your validation state</p>
              </div>

              <form onSubmit={handleSearchApplication} className="space-y-3">
                <div className="flex items-center space-x-2 bg-[#FCFAF7] p-2 rounded-2xl border border-neutral-200">
                  <Mail className="w-4 h-4 text-[#C5A059] ml-2" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered business email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-grow bg-transparent text-xs text-[#1A1A1A] placeholder-neutral-400 px-2 focus:outline-none font-sans font-light py-2"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSearching}
                    className="bg-[#1A1A1A] hover:bg-neutral-800 text-[#C5A059] hover:text-white font-mono font-bold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-xl shrink-0 cursor-pointer border border-[#C5A059]/20 transition-all"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </form>

              {hasSearched && (
                <div className="space-y-4 pt-2">
                  {searchedApplications.length === 0 ? (
                    <div className="text-center py-6 bg-[#FCFAF7] rounded-3xl border border-neutral-200 space-y-2">
                      <p className="text-xs text-neutral-600 font-medium">No Onboarding Applications Found</p>
                      <p className="text-[10px] text-neutral-400 font-light max-w-xs mx-auto leading-relaxed">
                        No applications were found matching "<strong>{searchEmail}</strong>". Make sure the email spelling is correct or apply as a new vendor.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">Applications Found ({searchedApplications.length})</p>
                      
                      {searchedApplications.map((app, idx) => (
                        <div key={idx} className="p-5 bg-[#FCFAF7] rounded-3xl border border-neutral-200 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-semibold text-[#1A1A1A] font-serif">{app.businessName}</h4>
                              <p className="text-[10px] text-[#C5A059] font-mono mt-1 font-bold">{app.category}</p>
                            </div>
                            <span className={`text-[9px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                              app.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : app.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-500 border-rose-100'
                                : 'bg-amber-50 text-amber-500 border-amber-100'
                            }`}>
                              {app.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-1 text-[10px] text-neutral-500 border-t border-neutral-200/60 pt-3 font-light">
                            <div><strong>Submitted On:</strong> {new Date(app.submittedAt).toLocaleDateString()}</div>
                            <div><strong>Location:</strong> {app.city}, Kwara</div>
                          </div>

                          {/* Quick Admin Action Simulator inside tracker to demonstrate approval/rejection workflows in development */}
                          <div className="bg-[#C5A059]/5 p-3 rounded-2xl border border-[#C5A059]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                            <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] inline-block animate-pulse"></span>
                              Review Simulator:
                            </span>
                            <div className="flex space-x-1.5">
                              <button
                                onClick={async () => {
                                  const updated = { ...app, status: 'Approved' as const };
                                  await saveVendorApplicationToFirestore(updated);
                                  setSearchedApplications(prev => prev.map(a => a.applicationId === app.applicationId ? updated : a));
                                  showNotification('Application set to APPROVED (Simulator)!');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-mono font-bold uppercase px-2.5 py-1.5 rounded-md cursor-pointer transition-colors"
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
                                className="bg-rose-500 hover:bg-rose-600 text-white text-[8px] font-mono font-bold uppercase px-2.5 py-1.5 rounded-md cursor-pointer transition-colors"
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
                                className="bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-mono font-bold uppercase px-2.5 py-1.5 rounded-md cursor-pointer transition-colors"
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
                  className="text-xs font-mono font-bold uppercase text-neutral-400 hover:text-neutral-700 hover:underline flex items-center justify-center space-x-1.5 mx-auto cursor-pointer transition-colors"
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
