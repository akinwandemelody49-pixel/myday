import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Building, MapPin, Clipboard, Image as ImageIcon, 
  ShieldCheck, CheckCircle2, ChevronRight, ChevronLeft, 
  Upload, Loader2, ArrowRight, ArrowLeft, Send, Globe, 
  Phone, Mail, FileText, Check, Calendar, Store, Plus, X, Trash2, Shield,
  Clock, Award, HelpCircle, Eye, AlertTriangle
} from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { VendorApplication } from '../../types';
import { saveVendorApplicationToFirestore, getVendorApplicationsFromFirestore } from '../../services/db';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import {
  OnboardingFormState,
  INITIAL_FORM_STATE,
  VENDOR_CATEGORIES,
  NIGERIAN_STATES,
  KWARA_CITIES,
  KWARA_LGAS,
  LANGUAGES_SPOKEN
} from './vendorOnboardingData';

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Search Application State (for status tracker)
  const [searchEmail, setSearchEmail] = useState('');
  const [searchedApplications, setSearchedApplications] = useState<VendorApplication[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Resume Incomplete Application State (Landing view)
  const [resumeEmail, setResumeEmail] = useState('');
  const [isResuming, setIsResuming] = useState(false);

  // Form Fields State
  const [form, setForm] = useState<OnboardingFormState>(INITIAL_FORM_STATE);

  // File Uploading States
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);

  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);

  const [govIdUploading, setGovIdUploading] = useState(false);
  const [govIdProgress, setGovIdProgress] = useState(0);

  const [businessRegUploading, setBusinessRegUploading] = useState(false);
  const [businessRegProgress, setBusinessRegProgress] = useState(0);

  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioProgress, setPortfolioProgress] = useState<Record<number, number>>({});

  const [certUploading, setCertUploading] = useState(false);
  const [certProgress, setCertProgress] = useState<Record<number, number>>({});

  const [priceListUploading, setPriceListUploading] = useState(false);
  const [priceListProgress, setPriceListProgress] = useState(0);

  // Drag and drop states
  const [isDragOverLogo, setIsDragOverLogo] = useState(false);
  const [isDragOverCover, setIsDragOverCover] = useState(false);
  const [isDragOverGovId, setIsDragOverGovId] = useState(false);
  const [isDragOverBusReg, setIsDragOverBusReg] = useState(false);
  const [isDragOverPortfolio, setIsDragOverPortfolio] = useState(false);
  const [isDragOverCert, setIsDragOverCert] = useState(false);
  const [isDragOverPriceList, setIsDragOverPriceList] = useState(false);

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const govIdInputRef = useRef<HTMLInputElement>(null);
  const busRegInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const priceListInputRef = useRef<HTMLInputElement>(null);

  // Real-time error state tracking
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStepErrors, setShowStepErrors] = useState(false);

  // Recalculate validation errors on form state changes to provide instant feedback
  useEffect(() => {
    if (viewState === 'registering' && showStepErrors) {
      const stepErrors = getStepValidationErrors(currentStep);
      setErrors(stepErrors);
    } else {
      setErrors({});
    }
  }, [form, currentStep, viewState, showStepErrors]);

  // Handle auto-saving on moving to the next steps
  const autoSaveToFirestore = async (stepNumber: number) => {
    if (!form.email || !form.businessName) return;
    
    setSaveStatus('saving');
    try {
      // Ensure applicationId is set
      let appId = form.applicationId;
      if (!appId) {
        appId = 'app_' + form.email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '_' + Math.random().toString(36).substring(2, 6);
        setForm(prev => ({ ...prev, applicationId: appId }));
      }

      const appData: VendorApplication = {
        applicationId: appId,
        businessName: form.businessName,
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone,
        whatsapp: form.whatsapp,
        category: form.category,
        state: form.state,
        city: form.city,
        lga: form.lga || undefined,
        address: form.address,
        yearsInBusiness: Number(form.yearsInBusiness),
        description: form.description,
        instagram: form.instagram,
        facebook: form.facebook,
        tiktok: form.tiktok,
        website: form.website || undefined,
        logo: form.logo,
        coverPhoto: form.coverPhoto || undefined,
        cacNumber: form.cacNumber || undefined,
        languagesSpoken: form.languagesSpoken,
        minPrice: form.minPrice ? Number(form.minPrice) : undefined,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
        avgPrice: form.avgPrice ? Number(form.avgPrice) : undefined,
        govIdUrl: form.govIdUrl || undefined,
        businessRegUrl: form.businessRegUrl || undefined,
        certificatesUrls: form.certificatesUrls,
        verificationBadgeRequested: form.verificationBadgeRequested,
        portfolioImages: form.portfolioImages,
        priceList: form.priceList || undefined,
        status: 'Pending',
        submittedAt: new Date().toISOString()
      };

      await saveVendorApplicationToFirestore(appData);
      setSaveStatus('saved');
      showNotification(`Step ${stepNumber} progress saved automatically!`);
    } catch (e) {
      console.error('Auto-save error:', e);
      setSaveStatus('error');
    }
  };

  // Robust File Upload Helper
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
            console.warn('Firebase Storage upload error, falling back to local simulation:', error);
            simulateLocalUpload(file, onProgress).then(resolve).catch(reject);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      } catch (e) {
        console.warn('Storage failed to load, falling back to local preview:', e);
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
      }, 80);
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

  const handleCoverChange = async (file: File | null) => {
    if (!file) return;
    setCoverUploading(true);
    setCoverProgress(0);
    try {
      const path = `vendor_applications/covers/${Date.now()}_${file.name}`;
      const downloadUrl = await uploadFile(file, path, setCoverProgress);
      setForm(prev => ({ ...prev, coverPhoto: downloadUrl }));
      showNotification('Cover photo uploaded successfully!');
    } catch (e) {
      console.error(e);
      showNotification('Failed to upload cover photo.');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleGovIdChange = async (file: File | null) => {
    if (!file) return;
    setGovIdUploading(true);
    setGovIdProgress(0);
    try {
      const path = `vendor_applications/gov_ids/${Date.now()}_${file.name}`;
      const downloadUrl = await uploadFile(file, path, setGovIdProgress);
      setForm(prev => ({ ...prev, govIdUrl: downloadUrl }));
      showNotification('Government ID uploaded successfully!');
    } catch (e) {
      console.error(e);
      showNotification('Failed to upload Government ID.');
    } finally {
      setGovIdUploading(false);
    }
  };

  const handleBusRegChange = async (file: File | null) => {
    if (!file) return;
    setBusinessRegUploading(true);
    setBusinessRegProgress(0);
    try {
      const path = `vendor_applications/business_regs/${Date.now()}_${file.name}`;
      const downloadUrl = await uploadFile(file, path, setBusinessRegProgress);
      setForm(prev => ({ ...prev, businessRegUrl: downloadUrl }));
      showNotification('Business registration document uploaded successfully!');
    } catch (e) {
      console.error(e);
      showNotification('Failed to upload registration document.');
    } finally {
      setBusinessRegUploading(false);
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
        
        const url = await uploadFile(file, path, (progress) => {
          setPortfolioProgress(prev => ({ ...prev, [i]: progress }));
        });
        uploadedUrls.push(url);
      }

      setForm(prev => ({
        ...prev,
        portfolioImages: [...prev.portfolioImages, ...uploadedUrls]
      }));
      showNotification(`Successfully uploaded ${filesToUpload.length} portfolio image(s)!`);
    } catch (e) {
      console.error(e);
      showNotification('Failed to upload portfolio images.');
    } finally {
      setPortfolioUploading(false);
      setPortfolioProgress({});
    }
  };

  const handleCertificatesChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setCertUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `vendor_applications/certs/${Date.now()}_${i}_${file.name}`;
        
        const url = await uploadFile(file, path, (progress) => {
          setCertProgress(prev => ({ ...prev, [i]: progress }));
        });
        uploadedUrls.push(url);
      }
      setForm(prev => ({
        ...prev,
        certificatesUrls: [...prev.certificatesUrls, ...uploadedUrls]
      }));
      showNotification(`Uploaded ${files.length} certificates!`);
    } catch (e) {
      console.error(e);
      showNotification('Failed to upload certificates.');
    } finally {
      setCertUploading(false);
      setCertProgress({});
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

  const removeCertificateImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      certificatesUrls: prev.certificatesUrls.filter((_, i) => i !== index)
    }));
    showNotification('Certificate removed.');
  };

  const toggleLanguage = (lang: string) => {
    setForm(prev => {
      const list = prev.languagesSpoken || [];
      const updated = list.includes(lang) ? list.filter(l => l !== lang) : [...list, lang];
      return { ...prev, languagesSpoken: updated };
    });
  };

  // Detailed validations per step
  const getStepValidationErrors = (step: number): Record<string, string> => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!form.businessName.trim()) errs.businessName = 'Business Name is required.';
      if (!form.ownerName.trim()) errs.ownerName = "Owner's Full Name is required.";
      if (!form.email.trim()) {
        errs.email = 'Business Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        errs.email = 'Please enter a valid email address.';
      }
      if (!form.phone.trim()) {
        errs.phone = 'Phone Number is required.';
      } else if (form.phone.replace(/\D/g, '').length < 8) {
        errs.phone = 'Please enter a valid phone number (at least 8 digits).';
      }
      if (!form.whatsapp.trim()) errs.whatsapp = 'WhatsApp Number is required.';
      if (!form.description.trim()) {
        errs.description = 'Business description is required.';
      } else if (form.description.length < 20) {
        errs.description = 'Description should be at least 20 characters.';
      }
      if (!form.languagesSpoken || form.languagesSpoken.length === 0) {
        errs.languagesSpoken = 'Please select at least one language spoken.';
      }
    }

    if (step === 2) {
      if (!form.state) errs.state = 'State is required.';
      if (!form.city) errs.city = 'City is required.';
      if (!form.lga) errs.lga = 'LGA is required.';
      if (!form.address.trim()) {
        errs.address = 'Business Address is required.';
      } else if (form.address.length < 10) {
        errs.address = 'Please provide a more detailed address (minimum 10 characters).';
      }
    }

    if (step === 3) {
      if (!form.minPrice) {
        errs.minPrice = 'Minimum package price is required.';
      } else if (Number(form.minPrice) <= 0) {
        errs.minPrice = 'Price must be greater than 0.';
      }
      if (!form.maxPrice) {
        errs.maxPrice = 'Maximum package price is required.';
      } else if (Number(form.maxPrice) <= 0) {
        errs.maxPrice = 'Price must be greater than 0.';
      } else if (Number(form.maxPrice) < Number(form.minPrice)) {
        errs.maxPrice = 'Maximum price cannot be less than minimum price.';
      }
      if (!form.avgPrice) {
        errs.avgPrice = 'Average booking price is required.';
      } else if (Number(form.avgPrice) <= 0) {
        errs.avgPrice = 'Price must be greater than 0.';
      } else if (
        Number(form.avgPrice) < Number(form.minPrice) || 
        Number(form.avgPrice) > Number(form.maxPrice)
      ) {
        errs.avgPrice = 'Average booking price must fall between minimum and maximum package prices.';
      }
    }

    if (step === 4) {
      if (!form.logo) errs.logo = 'Please upload your business logo.';
      if (!form.coverPhoto) errs.coverPhoto = 'Please upload a brand cover photo.';
      if (!form.govIdUrl) errs.govIdUrl = 'Government ID document upload is required.';
      if (!form.portfolioImages || form.portfolioImages.length === 0) {
        errs.portfolio = 'Please upload at least 1 portfolio image of your past work.';
      }
    }

    if (step === 5) {
      if (!form.confirmAccurate) errs.confirmAccurate = 'You must confirm that your details are accurate.';
      if (!form.agreeTerms) errs.agreeTerms = 'You must agree to the MyDay Vendor Onboarding Terms.';
    }

    return errs;
  };

  const isStepValid = Object.keys(errors).length === 0;

  const handleNextStep = async () => {
    const stepErrors = getStepValidationErrors(currentStep);
    if (Object.keys(stepErrors).length === 0) {
      await autoSaveToFirestore(currentStep);
      setShowStepErrors(false);
      setErrors({});
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowStepErrors(true);
      setErrors(stepErrors);
      showNotification('Please resolve step errors before continuing.');
    }
  };

  const handlePrevStep = () => {
    setShowStepErrors(false);
    setErrors({});
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit full application
  const handleSubmitApplication = async () => {
    const finalErrors = getStepValidationErrors(5);
    if (Object.keys(finalErrors).length > 0) {
      setShowStepErrors(true);
      setErrors(finalErrors);
      showNotification('Please resolve all validation requirements before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      let appId = form.applicationId || 'app_' + Math.random().toString(36).substr(2, 9);
      const appData: VendorApplication = {
        applicationId: appId,
        businessName: form.businessName,
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone,
        whatsapp: form.whatsapp,
        category: form.category,
        state: form.state,
        city: form.city,
        lga: form.lga || undefined,
        address: form.address,
        yearsInBusiness: Number(form.yearsInBusiness),
        description: form.description,
        instagram: form.instagram,
        facebook: form.facebook,
        tiktok: form.tiktok,
        website: form.website || undefined,
        logo: form.logo,
        coverPhoto: form.coverPhoto || undefined,
        cacNumber: form.cacNumber || undefined,
        languagesSpoken: form.languagesSpoken,
        minPrice: Number(form.minPrice),
        maxPrice: Number(form.maxPrice),
        avgPrice: Number(form.avgPrice),
        govIdUrl: form.govIdUrl || undefined,
        businessRegUrl: form.businessRegUrl || undefined,
        certificatesUrls: form.certificatesUrls,
        verificationBadgeRequested: form.verificationBadgeRequested,
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
      showNotification('Failed to submit onboarding application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resume registration workflow
  const handleResumeIncomplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeEmail.trim()) return;

    setIsResuming(true);
    try {
      const allApps = await getVendorApplicationsFromFirestore();
      const existing = allApps.find(app => app.email.toLowerCase().trim() === resumeEmail.toLowerCase().trim());
      
      if (existing) {
        setForm({
          applicationId: existing.applicationId,
          businessName: existing.businessName || '',
          ownerName: existing.ownerName || '',
          email: existing.email || '',
          phone: existing.phone || '',
          whatsapp: existing.whatsapp || '',
          category: existing.category || 'Cake Vendor',
          state: existing.state || 'Kwara State',
          city: existing.city || 'Ilorin',
          lga: existing.lga || '',
          address: existing.address || '',
          googleMapsUrl: '',
          yearsInBusiness: existing.yearsInBusiness || 1,
          description: existing.description || '',
          instagram: existing.instagram || '',
          facebook: existing.facebook || '',
          tiktok: existing.tiktok || '',
          website: existing.website || '',
          logo: existing.logo || '',
          coverPhoto: existing.coverPhoto || '',
          cacNumber: existing.cacNumber || '',
          languagesSpoken: existing.languagesSpoken || ['English'],
          minPrice: existing.minPrice ? String(existing.minPrice) : '',
          maxPrice: existing.maxPrice ? String(existing.maxPrice) : '',
          avgPrice: existing.avgPrice ? String(existing.avgPrice) : '',
          govIdUrl: existing.govIdUrl || '',
          businessRegUrl: existing.businessRegUrl || '',
          certificatesUrls: existing.certificatesUrls || [],
          verificationBadgeRequested: existing.verificationBadgeRequested || false,
          portfolioImages: existing.portfolioImages || [],
          priceList: existing.priceList || '',
          confirmAccurate: false,
          agreeTerms: false
        });

        // Determine step based on completeness
        let step = 1;
        if (existing.businessName && existing.ownerName && existing.email) step = 2;
        if (existing.address && existing.city && existing.lga) step = 3;
        if (existing.minPrice || existing.maxPrice) step = 4;
        if (existing.logo && existing.portfolioImages?.length > 0) step = 5;

        setCurrentStep(step);
        setShowStepErrors(false);
        setErrors({});
        setViewState('registering');
        showNotification(`Welcome back! Resumed your application at Step ${step}.`);
      } else {
        showNotification('No draft application found for this email. Starting a fresh session.');
        resetOnboarding();
        setForm(prev => ({ ...prev, email: resumeEmail }));
        setViewState('registering');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error retrieving draft database.');
    } finally {
      setIsResuming(false);
    }
  };

  // Search status tracker
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
      showNotification('Error searching registry.');
    } finally {
      setIsSearching(false);
    }
  };

  // Reset Onboarding Form
  const resetOnboarding = () => {
    setForm(INITIAL_FORM_STATE);
    setCurrentStep(1);
    setShowStepErrors(false);
    setErrors({});
  };

  // Estimated times and completion calculations
  const stepMeta = [
    { name: 'Business Information', time: '3 min', totalPrev: 0, estRemaining: '12 min' },
    { name: 'Business Address', time: '2 min', totalPrev: 3, estRemaining: '9 min' },
    { name: 'Services & Pricing', time: '2 min', totalPrev: 5, estRemaining: '7 min' },
    { name: 'Portfolio & Verification', time: '4 min', totalPrev: 7, estRemaining: '5 min' },
    { name: 'Review & Submit', time: '1 min', totalPrev: 11, estRemaining: '1 min' }
  ];

  const currentStepPercentage = Math.round((currentStep / 5) * 100);
  const currentStepMeta = stepMeta[currentStep - 1];

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#030303] font-sans text-neutral-800 dark:text-neutral-200 selection:bg-[#C5A059]/10 selection:text-[#C5A059] transition-colors duration-300">
      {/* Decorative Brand Accent Bar */}
      <div className="bg-gradient-to-r from-[#6C4CF1] via-[#C5A059] to-[#1A1A1A] h-1.5 w-full"></div>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b border-neutral-200/60 dark:border-neutral-800/60 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#1A1A1A] flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">
              M
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-tight text-[#1A1A1A] dark:text-[#F5F5F4] block">
                MyDay <span className="text-[#C5A059] font-sans font-light text-base tracking-wider ml-1 uppercase">Onboarding</span>
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] inline-block animate-pulse"></span>
                Premium Partner Suite
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {saveStatus === 'saving' && (
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono flex items-center gap-1 bg-white dark:bg-[#0E0D16] px-3 py-1.5 rounded-full border border-neutral-150 dark:border-neutral-800 animate-pulse">
                <Loader2 className="w-3 h-3 text-[#6C4CF1] animate-spin" />
                Saving to Cloud...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/25 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/40">
                <Check className="w-3 h-3 text-emerald-500" />
                Auto-saved
              </span>
            )}
            <button
              onClick={() => setViewState(viewState === 'tracker' ? 'landing' : 'tracker')}
              className="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-600 dark:text-neutral-300 hover:text-[#6C4CF1] dark:hover:text-[#B4A2FF] transition-all cursor-pointer py-2 px-4 border border-neutral-200 dark:border-neutral-800 rounded-full bg-white dark:bg-[#0E0D16] hover:border-[#6C4CF1]/30 hover:bg-[#FAF9F6] dark:hover:bg-[#13121E] shadow-xs flex items-center gap-1.5"
            >
              <Clipboard className="w-3.5 h-3.5" />
              {viewState === 'tracker' ? 'Onboarding Portal' : 'Tracker'}
            </button>
            <button 
              onClick={onGoHome}
              className="flex items-center space-x-1 text-[10px] text-neutral-400 dark:text-neutral-500 hover:text-rose-500 dark:hover:text-rose-400 font-mono uppercase tracking-wider transition-colors cursor-pointer py-1 px-2.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-850"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {/* LANDING PAGE */}
          {viewState === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12 max-w-3xl mx-auto"
            >
              <div className="text-center space-y-5">
                <div className="inline-flex items-center space-x-2 bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10 border border-[#6C4CF1]/15 dark:border-[#6C4CF1]/30 px-4.5 py-1.5 rounded-full text-[#6C4CF1] dark:text-[#B4A2FF] shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Premium Business Onboarding</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-neutral-900 dark:text-neutral-100 leading-[1.12] tracking-tight max-w-2xl mx-auto">
                  Expand your brand on <br />
                  <span className="font-sans font-light italic bg-gradient-to-r from-[#6C4CF1] via-[#C5A059] to-neutral-900 dark:to-neutral-100 bg-clip-text text-transparent animate-pulse">MyDay Planner</span>
                </h1>
                
                <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 font-sans font-light max-w-xl mx-auto leading-relaxed">
                  Join an elite network of birthday service professionals across Kwara State and beyond. Connect with hosts looking for vetted, premier cake bakers, decorators, musicians, and event suppliers.
                </p>
              </div>

              {/* Bento Trust Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left pt-2">
                <div className="p-6 bg-white dark:bg-[#0E0D16] border border-neutral-150/80 dark:border-neutral-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-3 hover:border-[#6C4CF1]/20 dark:hover:border-[#6C4CF1]/40 transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-[#6C4CF1] dark:text-[#B4A2FF] group-hover:bg-[#6C4CF1]/10 transition-colors">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">01 / Visibility</h3>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-1">SaaS Showcases</h4>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
                    Host a stunning, professional storefront displaying reviews, tiered packages, and calendar availability.
                  </p>
                </div>

                <div className="p-6 bg-white dark:bg-[#0E0D16] border border-neutral-150/80 dark:border-neutral-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-3 hover:border-[#6C4CF1]/20 dark:hover:border-[#6C4CF1]/40 transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059]/20 transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">02 / Automation</h3>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-1">Smart Bookings</h4>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
                    Receive vetted host inquiries matching your categories, prices, coverage states, and service rates.
                  </p>
                </div>

                <div className="p-6 bg-white dark:bg-[#0E0D16] border border-neutral-150/80 dark:border-neutral-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-3 hover:border-[#6C4CF1]/20 dark:hover:border-[#6C4CF1]/40 transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100/50 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">03 / Trust</h3>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-1">Certified Badges</h4>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
                    Unlock a verified blue check badge for your storefront to enjoy premium visibility across our systems.
                  </p>
                </div>
              </div>

              {/* Onboarding Trigger Controls */}
              <div className="bg-white dark:bg-[#0E0D16] border border-neutral-150/80 dark:border-neutral-800 p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-2">
                  <h3 className="text-md font-semibold text-neutral-900 dark:text-neutral-100">Ready to onboard?</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
                    Initiate a premium onboarding registration. The system automatically preserves progress at each completed step so you can resume at any point.
                  </p>
                  <Button
                    onClick={() => {
                      resetOnboarding();
                      setViewState('registering');
                    }}
                    className="w-full sm:w-auto mt-2 px-8 py-3.5 bg-[#1A1A1A] dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-[#C5A059] hover:text-white dark:text-[#C5A059] dark:hover:text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl flex items-center justify-center space-x-2.5 shadow-md transition-all duration-300 border border-[#C5A059]/20"
                  >
                    <span>Begin Registration</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                  </Button>
                </div>

                <div className="border-t md:border-t-0 md:border-l border-neutral-150 dark:border-neutral-800 pt-6 md:pt-0 md:pl-8 space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 uppercase tracking-wider font-mono text-[#6C4CF1] dark:text-[#B4A2FF]">Resume Incomplete Session</h4>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-normal font-light">Enter your registered business email to recover and continue progress.</p>
                  </div>
                  <form onSubmit={handleResumeIncomplete} className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="business@email.com"
                      value={resumeEmail}
                      onChange={(e) => setResumeEmail(e.target.value)}
                      className="flex-grow bg-[#FAF9F6] dark:bg-[#13121E] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#6C4CF1] transition-all font-light"
                    />
                    <button
                      type="submit"
                      disabled={isResuming}
                      className="px-4 bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white rounded-xl text-xs font-mono uppercase font-bold tracking-wider transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                    >
                      {isResuming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resume'}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* REGISTERING STEPPED INTERFACE */}
          {viewState === 'registering' && (
            <motion.div
              key="registering"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="space-y-8"
            >
              
              {/* Premium Progress & Meta Indicator */}
              <div className="bg-white dark:bg-[#0E0D16] border border-neutral-150/80 dark:border-neutral-800 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
                
                {/* Progress Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-[#6C4CF1] dark:text-[#B4A2FF] bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10 px-2.5 py-1 rounded-md border border-[#6C4CF1]/10 dark:border-[#6C4CF1]/20">
                        Step {currentStep} of 5
                      </span>
                      <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-900/40 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#C5A059]" />
                        {currentStepMeta.estRemaining} left
                      </span>
                    </div>
                    <h2 className="text-xl font-serif text-neutral-900 dark:text-neutral-100 pt-1">
                      {currentStepMeta.name}
                    </h2>
                  </div>
                  
                  <div className="text-left md:text-right space-y-1">
                    <span className="text-xs font-mono font-semibold text-[#6C4CF1] dark:text-[#B4A2FF] block">
                      {currentStepPercentage}% Complete
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light block">
                      Estimated step duration: {currentStepMeta.time}
                    </span>
                  </div>
                </div>

                {/* Elegant 5-Step Timeline Map */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {stepMeta.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isActive = stepNum === currentStep;
                    const isCompleted = stepNum < currentStep;
                    return (
                      <div key={idx} className="relative flex items-center md:flex-col items-start gap-3 md:text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all duration-300 ${
                          isActive 
                            ? 'bg-[#6C4CF1] dark:bg-[#6C4CF1] text-white ring-4 ring-[#6C4CF1]/10 dark:ring-[#6C4CF1]/20 shadow-md' 
                            : isCompleted 
                            ? 'bg-emerald-500 dark:bg-emerald-600 text-white' 
                            : 'bg-neutral-100 dark:bg-[#13121E] text-neutral-400 dark:text-neutral-600 border border-neutral-200 dark:border-neutral-850'
                        }`}>
                          {isCompleted ? <Check className="w-4 h-4 text-white" /> : `0${stepNum}`}
                        </div>
                        
                        <div className="md:mt-2 text-left md:text-center">
                          <p className={`text-xs font-semibold ${isActive ? 'text-[#6C4CF1] dark:text-[#B4A2FF]' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
                            {step.name}
                          </p>
                          <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-light hidden md:block">
                            {idx === currentStep - 1 ? 'Current Step' : isCompleted ? 'Saved' : `Est: ${step.time}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Premium White Form Card */}
              <Card className="bg-white dark:bg-[#0E0D16] border border-neutral-150/80 dark:border-neutral-800 p-6 md:p-10 rounded-2xl shadow-sm">
                <CardBody className="p-0">
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    
                    {/* STEP 1: BUSINESS INFORMATION */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono flex items-center gap-2">
                            <Building className="w-5 h-5 text-[#6C4CF1]" />
                            Corporate & Contact Information
                          </h3>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Specify your official brand, identity credentials, and primary administrative channels.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Business Name */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Business Name *</label>
                            <input
                              type="text"
                              value={form.businessName}
                              onChange={(e) => setForm(prev => ({ ...prev, businessName: e.target.value }))}
                              placeholder="e.g. Elegant Layers Bakery"
                              className={`w-full bg-[#FCFAF7] dark:bg-[#13121F] border ${errors.businessName ? 'border-rose-300 dark:border-rose-900/50' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] focus:ring-4 focus:ring-[#6C4CF1]/10 dark:focus:ring-[#8B73FF]/10 transition-all font-light`}
                            />
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">The public name customers will see.</p>
                            {errors.businessName && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.businessName}</span>}
                          </div>

                          {/* Owner's Name */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Owner's Full Name *</label>
                            <input
                              type="text"
                              value={form.ownerName}
                              onChange={(e) => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                              placeholder="e.g. Amina Yusuf"
                              className={`w-full bg-[#FCFAF7] dark:bg-[#13121F] border ${errors.ownerName ? 'border-rose-300 dark:border-rose-900/50' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] focus:ring-4 focus:ring-[#6C4CF1]/10 dark:focus:ring-[#8B73FF]/10 transition-all font-light`}
                            />
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Full legal name of the primary registry owner.</p>
                            {errors.ownerName && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.ownerName}</span>}
                          </div>

                          {/* Business Email */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Business Email *</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-550" />
                              <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="layers@bakery.com"
                                className={`w-full bg-[#FCFAF7] dark:bg-[#13121F] border ${errors.email ? 'border-rose-300 dark:border-rose-900/50' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl pl-11 pr-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] focus:ring-4 focus:ring-[#6C4CF1]/10 dark:focus:ring-[#8B73FF]/10 transition-all font-light`}
                              />
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Used for booking notifications.</p>
                            {errors.email && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.email}</span>}
                          </div>

                          {/* Phone Number */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Phone Number *</label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-550" />
                              <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="+234 803 123 4567"
                                className={`w-full bg-[#FCFAF7] dark:bg-[#13121F] border ${errors.phone ? 'border-rose-300 dark:border-rose-900/50' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl pl-11 pr-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] focus:ring-4 focus:ring-[#6C4CF1]/10 dark:focus:ring-[#8B73FF]/10 transition-all font-light`}
                              />
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Primary contact for customers.</p>
                            {errors.phone && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.phone}</span>}
                          </div>

                          {/* WhatsApp Number */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">WhatsApp Number *</label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-3.5 w-4 h-4 text-emerald-550" />
                              <input
                                type="text"
                                value={form.whatsapp}
                                onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                                placeholder="+234 803 123 4567"
                                className={`w-full bg-[#FCFAF7] dark:bg-[#13121F] border ${errors.whatsapp ? 'border-rose-300 dark:border-rose-900/50' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl pl-11 pr-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] focus:ring-4 focus:ring-[#6C4CF1]/10 dark:focus:ring-[#8B73FF]/10 transition-all font-light`}
                              />
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Customers can contact you directly.</p>
                            {errors.whatsapp && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.whatsapp}</span>}
                          </div>

                          {/* Business Category */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Business Category *</label>
                            <select
                              value={form.category}
                              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full bg-[#FCFAF7] dark:bg-[#13121F] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] focus:ring-4 focus:ring-[#6C4CF1]/10 dark:focus:ring-[#8B73FF]/10 transition-all"
                            >
                              {VENDOR_CATEGORIES.map((cat, idx) => (
                                <option key={idx} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Select the service you provide.</p>
                          </div>

                          {/* Years of Experience */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Years of Experience *</label>
                            <input
                              type="number"
                              min="1"
                              value={form.yearsInBusiness}
                              onChange={(e) => setForm(prev => ({ ...prev, yearsInBusiness: Number(e.target.value) }))}
                              className="w-full bg-[#FCFAF7] dark:bg-[#13121F] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-mono"
                            />
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Number of years practicing or in business.</p>
                            {errors.yearsInBusiness && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.yearsInBusiness}</span>}
                          </div>

                          {/* Website URL */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Website URL (Optional)</label>
                            <div className="relative">
                              <Globe className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-550" />
                              <input
                                type="url"
                                value={form.website}
                                onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="https://elegantlayers.com"
                                className="w-full bg-[#FCFAF7] dark:bg-[#13121F] border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-light"
                              />
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Link to your professional business portal or bio.</p>
                          </div>

                          {/* Instagram Handle */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Instagram Profile Handle</label>
                            <div className="flex items-center bg-[#FCFAF7] dark:bg-[#13121F] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden px-3.5 focus-within:border-[#6C4CF1] dark:focus-within:border-[#8B73FF] transition-all">
                              <span className="text-xs text-neutral-400 dark:text-neutral-500 mr-1 select-none">instagram.com/</span>
                              <input
                                type="text"
                                value={form.instagram}
                                onChange={(e) => setForm(prev => ({ ...prev, instagram: e.target.value }))}
                                placeholder="elegantlayers"
                                className="w-full py-3 text-xs text-neutral-800 dark:text-neutral-200 bg-transparent focus:outline-none font-light"
                              />
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Used to curate aesthetic storefront reviews.</p>
                          </div>

                          {/* Facebook Page Handle */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Facebook Page Link</label>
                            <div className="flex items-center bg-[#FCFAF7] dark:bg-[#13121F] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden px-3.5 focus-within:border-[#6C4CF1] dark:focus-within:border-[#8B73FF] transition-all">
                              <span className="text-xs text-neutral-400 dark:text-neutral-500 mr-1 select-none">facebook.com/</span>
                              <input
                                type="text"
                                value={form.facebook}
                                onChange={(e) => setForm(prev => ({ ...prev, facebook: e.target.value }))}
                                placeholder="elegantlayerscakes"
                                className="w-full py-3 text-xs text-neutral-800 dark:text-neutral-200 bg-transparent focus:outline-none font-light"
                              />
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Optional business profile details page reference.</p>
                          </div>

                        </div>

                        {/* Languages Spoken */}
                        <div className="space-y-2.5 pt-2">
                          <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Languages Spoken *</label>
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-normal font-light">Toggle languages spoken to ensure clients communicate easily.</p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {LANGUAGES_SPOKEN.map((lang, idx) => {
                              const isSelected = form.languagesSpoken.includes(lang);
                              return (
                                <button
                                  type="button"
                                  key={idx}
                                  onClick={() => toggleLanguage(lang)}
                                  className={`px-4.5 py-2 rounded-xl text-xs font-mono font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isSelected 
                                      ? 'bg-[#6C4CF1]/10 text-[#6C4CF1] dark:text-[#B4A2FF] border-[#6C4CF1] dark:border-[#8B73FF]' 
                                      : 'bg-white dark:bg-[#13121F] hover:bg-neutral-50 dark:hover:bg-[#1C1B2E] text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                  {lang}
                                </button>
                              );
                            })}
                          </div>
                          {errors.languagesSpoken && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.languagesSpoken}</span>}
                        </div>

                        {/* Business Description */}
                        <div className="space-y-1.5 pt-2">
                          <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Business Description *</label>
                          <textarea
                            rows={4}
                            value={form.description}
                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your specialized birthday packages, menu options, or setup configurations, as well as landmark milestone events you have serviced..."
                            className={`w-full bg-[#FCFAF7] dark:bg-[#13121F] border ${errors.description ? 'border-rose-300 dark:border-rose-900/50' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-light`}
                          />
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Briefly outline what makes your craft unique (minimum 20 characters).</p>
                          {errors.description && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.description}</span>}
                        </div>

                      </div>
                    )}

                    {/* STEP 2: BUSINESS ADDRESS */}
                    {currentStep === 2 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[#C5A059]" />
                            Service Coverage & Location Areas
                          </h3>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Define your core base location and physical administrative physical addresses.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* State Selection */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">State *</label>
                            <select
                              value={form.state}
                              onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value, city: e.target.value === 'Kwara State' ? 'Ilorin' : '', lga: '' }))}
                              className="w-full bg-[#FCFAF7] dark:bg-[#13121F] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all"
                            >
                              {NIGERIAN_STATES.map((st, idx) => (
                                <option key={idx} value={st}>{st}</option>
                              ))}
                            </select>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Primary state of operation.</p>
                          </div>

                          {/* City Selection / Input */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">City *</label>
                            {form.state === 'Kwara State' ? (
                              <select
                                value={form.city}
                                onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                                className="w-full bg-[#FCFAF7] dark:bg-[#13121F] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all"
                              >
                                <option value="">Select City</option>
                                {KWARA_CITIES.map((ct, idx) => (
                                  <option key={idx} value={ct}>{ct}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={form.city}
                                onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="Enter city name"
                                className="w-full bg-[#FCFAF7] dark:bg-[#13121F] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-light"
                              />
                            )}
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Town or district where storefront is hosted.</p>
                            {errors.city && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.city}</span>}
                          </div>

                          {/* Local Government Area (LGA) */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Local Government Area *</label>
                            {form.state === 'Kwara State' ? (
                              <select
                                value={form.lga}
                                onChange={(e) => setForm(prev => ({ ...prev, lga: e.target.value }))}
                                className="w-full bg-[#FCFAF7] dark:bg-[#13121F] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all"
                              >
                                <option value="">Select LGA</option>
                                {KWARA_LGAS.map((lga, idx) => (
                                  <option key={idx} value={lga}>{lga}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={form.lga}
                                onChange={(e) => setForm(prev => ({ ...prev, lga: e.target.value }))}
                                placeholder="Enter LGA"
                                className="w-full bg-[#FCFAF7] dark:bg-[#13121F] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-light"
                              />
                            )}
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">LGA is crucial for distance calculations.</p>
                            {errors.lga && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.lga}</span>}
                          </div>

                        </div>

                        {/* Physical Address */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Business Physical Address *</label>
                          <textarea
                            rows={3}
                            value={form.address}
                            onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="e.g. Suite 4, Unity Road, Ilorin, Kwara State"
                            className={`w-full bg-[#FCFAF7] dark:bg-[#13121F] border ${errors.address ? 'border-rose-300 dark:border-rose-900/50' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-light`}
                          />
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">The street details of your physical studio, shop, or home kitchen.</p>
                          {errors.address && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.address}</span>}
                        </div>

                        {/* Google Maps Link */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Google Maps Link (Optional)</label>
                          <input
                            type="url"
                            value={form.googleMapsUrl}
                            onChange={(e) => setForm(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                            placeholder="e.g. https://maps.app.goo.gl/..."
                            className="w-full bg-[#FCFAF7] dark:bg-[#13121F] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-light"
                          />
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Embed physical direction links to help users locate your facility quickly.</p>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: SERVICES & PRICING */}
                    {currentStep === 3 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono flex items-center gap-2">
                            <Clipboard className="w-5 h-5 text-[#6C4CF1]" />
                            Financial Packages & Price Lists
                          </h3>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Define package options so hosts can understand standard service rates.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* Minimum Price */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Minimum Package Price (₦) *</label>
                            <div className="relative">
                              <span className="absolute left-4 top-3 text-xs font-mono font-bold text-neutral-500">₦</span>
                              <input
                                type="number"
                                min="0"
                                value={form.minPrice}
                                onChange={(e) => setForm(prev => ({ ...prev, minPrice: e.target.value }))}
                                placeholder="50,000"
                                className={`w-full bg-[#FCFAF7] dark:bg-[#13121F] border ${errors.minPrice ? 'border-rose-300 dark:border-rose-900/50' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl pl-10 pr-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-mono`}
                              />
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Lowest package rates starting point.</p>
                            {errors.minPrice && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.minPrice}</span>}
                          </div>

                          {/* Maximum Price */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Maximum Package Price (₦) *</label>
                            <div className="relative">
                              <span className="absolute left-4 top-3 text-xs font-mono font-bold text-neutral-500">₦</span>
                              <input
                                type="number"
                                min="0"
                                value={form.maxPrice}
                                onChange={(e) => setForm(prev => ({ ...prev, maxPrice: e.target.value }))}
                                placeholder="500,000"
                                className={`w-full bg-[#FCFAF7] dark:bg-[#13121F] border ${errors.maxPrice ? 'border-rose-300 dark:border-rose-900/50' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl pl-10 pr-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-mono`}
                              />
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Highest or complete premium package rate.</p>
                            {errors.maxPrice && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.maxPrice}</span>}
                          </div>

                          {/* Average Booking Price */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Average Booking Price (₦) *</label>
                            <div className="relative">
                              <span className="absolute left-4 top-3 text-xs font-mono font-bold text-neutral-500">₦</span>
                              <input
                                type="number"
                                min="0"
                                value={form.avgPrice}
                                onChange={(e) => setForm(prev => ({ ...prev, avgPrice: e.target.value }))}
                                placeholder="150,000"
                                className={`w-full bg-[#FCFAF7] dark:bg-[#13121F] border ${errors.avgPrice ? 'border-rose-300 dark:border-rose-900/50' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl pl-10 pr-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-mono`}
                              />
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Typical budget hosts spend on your gigs.</p>
                            {errors.avgPrice && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.avgPrice}</span>}
                          </div>

                        </div>
                      </div>
                    )}

                    {/* STEP 4: PORTFOLIO & VERIFICATION */}
                    {currentStep === 4 && (
                      <div className="space-y-8 animate-fadeIn">
                        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-[#C5A059]" />
                            Curated Brand Portfolio & Trust Verification
                          </h3>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Upload high-resolution media and verify administrative trust credentials to get certified faster.</p>
                        </div>

                        {/* Top: Logo & Cover Photo Side-by-Side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Business Logo Upload */}
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Business Logo *</label>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light pb-1">Clean, high contrast square avatar representing your brand.</p>
                            <div 
                              onDragOver={(e) => { e.preventDefault(); setIsDragOverLogo(true); }}
                              onDragLeave={() => setIsDragOverLogo(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                  setIsDragOverLogo(false);
                                if (e.dataTransfer.files?.[0]) handleLogoChange(e.dataTransfer.files[0]);
                              }}
                              onClick={() => logoInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                                isDragOverLogo ? 'border-[#6C4CF1] bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-[#6C4CF1]/30 dark:hover:border-[#8B73FF]/30 bg-[#FCFAF7] dark:bg-[#13121F]'
                              }`}
                            >
                              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoChange(e.target.files?.[0] || null)} />
                              {logoUploading ? (
                                <div className="space-y-2 py-2">
                                  <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin mx-auto" />
                                  <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase font-bold tracking-wider">Uploading... {logoProgress}%</p>
                                </div>
                              ) : form.logo ? (
                                <div className="space-y-3 flex flex-col items-center py-2">
                                  <img src={form.logo} alt="Uploaded logo" className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-neutral-200 dark:border-neutral-800" referrerPolicy="no-referrer" />
                                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Logo Uploaded! Drag here to replace.</span>
                                </div>
                              ) : (
                                <div className="space-y-2 py-2">
                                  <Upload className="w-6 h-6 text-neutral-400 dark:text-neutral-550 mx-auto" />
                                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold">Click or Drag & Drop Business Logo</p>
                                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light">PNG, JPG format accepted (square 1:1)</p>
                                </div>
                              )}
                            </div>
                            {errors.logo && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.logo}</span>}
                          </div>

                          {/* Brand Cover Photo Upload */}
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Brand Cover Photo *</label>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light pb-1">Beautiful wide landscape banner used on top of your storefront.</p>
                            <div 
                              onDragOver={(e) => { e.preventDefault(); setIsDragOverCover(true); }}
                              onDragLeave={() => setIsDragOverCover(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOverCover(false);
                                if (e.dataTransfer.files?.[0]) handleCoverChange(e.dataTransfer.files[0]);
                              }}
                              onClick={() => coverInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                                isDragOverCover ? 'border-[#6C4CF1] bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-[#6C4CF1]/30 dark:hover:border-[#8B73FF]/30 bg-[#FCFAF7] dark:bg-[#13121F]'
                              }`}
                            >
                              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleCoverChange(e.target.files?.[0] || null)} />
                              {coverUploading ? (
                                <div className="space-y-2 py-2">
                                  <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin mx-auto" />
                                  <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase font-bold tracking-wider">Uploading... {coverProgress}%</p>
                                </div>
                              ) : form.coverPhoto ? (
                                <div className="space-y-3 flex flex-col items-center py-2">
                                  <img src={form.coverPhoto} alt="Uploaded cover" className="w-full h-20 rounded-xl object-cover shadow-sm border border-neutral-200 dark:border-neutral-800" referrerPolicy="no-referrer" />
                                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Cover Registered! Drag here to replace.</span>
                                </div>
                              ) : (
                                <div className="space-y-2 py-2">
                                  <Upload className="w-6 h-6 text-neutral-400 dark:text-neutral-550 mx-auto" />
                                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold">Click or Drag & Drop Cover Photo</p>
                                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light">High resolution landscape images preferred</p>
                                </div>
                              )}
                            </div>
                            {errors.coverPhoto && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.coverPhoto}</span>}
                          </div>

                        </div>

                        {/* Middle: CAC Registration Number & Government ID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* CAC Registration Number */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">CAC Registration Number (Optional)</label>
                            <input
                              type="text"
                              value={form.cacNumber}
                              onChange={(e) => setForm(prev => ({ ...prev, cacNumber: e.target.value }))}
                              placeholder="RC-123456"
                              className="w-full bg-[#FCFAF7] dark:bg-[#13121F] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] transition-all font-mono"
                            />
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-1">Your Corporate Affairs Commission (CAC) registration index.</p>
                          </div>

                          {/* Government ID Upload */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Government ID Document *</label>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light pb-1">NIN slip, Driver's License, or International Passport.</p>
                            <div 
                              onDragOver={(e) => { e.preventDefault(); setIsDragOverGovId(true); }}
                              onDragLeave={() => setIsDragOverGovId(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOverGovId(false);
                                if (e.dataTransfer.files?.[0]) handleGovIdChange(e.dataTransfer.files[0]);
                              }}
                              onClick={() => govIdInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-300 ${
                                isDragOverGovId ? 'border-[#6C4CF1] bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-[#6C4CF1]/30 dark:hover:border-[#8B73FF]/30 bg-[#FCFAF7] dark:bg-[#13121F]'
                              }`}
                            >
                              <input ref={govIdInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleGovIdChange(e.target.files?.[0] || null)} />
                              {govIdUploading ? (
                                <div className="space-y-2 py-1">
                                  <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin mx-auto" />
                                  <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">Uploading... {govIdProgress}%</p>
                                </div>
                              ) : form.govIdUrl ? (
                                <div className="space-y-2 flex flex-col items-center py-1">
                                  <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
                                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Document Linked. Drag here to replace.</span>
                                </div>
                              ) : (
                                <div className="space-y-1 py-1">
                                  <Upload className="w-5 h-5 text-neutral-400 dark:text-neutral-550 mx-auto" />
                                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold">Upload ID Document (PDF/JPG)</p>
                                </div>
                              )}
                            </div>
                            {errors.govIdUrl && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.govIdUrl}</span>}
                          </div>

                        </div>

                        {/* Portfolio Images Gallery multi-upload */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center pb-1">
                            <div>
                              <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Portfolio Gallery Work Images *</label>
                              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-light mt-0.5">Provide high quality images of past birthday setups or events (up to 10 photos).</p>
                            </div>
                            <span className="text-[10px] font-mono bg-[#6C4CF1]/10 text-[#6C4CF1] dark:bg-[#8B73FF]/20 dark:text-[#B4A2FF] px-3 py-1 rounded-full font-bold">
                              {form.portfolioImages.length} / 10 Added
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
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                              isDragOverPortfolio ? 'border-[#6C4CF1] bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-[#6C4CF1]/30 dark:hover:border-[#8B73FF]/30 bg-[#FCFAF7] dark:bg-[#13121F]'
                            }`}
                          >
                            <input ref={portfolioInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handlePortfolioChange(e.target.files)} />
                            {portfolioUploading ? (
                              <div className="space-y-2 py-2">
                                <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin mx-auto" />
                                <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">Processing portfolio uploads...</p>
                              </div>
                            ) : (
                              <div className="space-y-2 py-2">
                                <ImageIcon className="w-6 h-6 text-neutral-400 dark:text-neutral-550 mx-auto" />
                                <p className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold">Click or Drag & Drop Multiple Images</p>
                              </div>
                            )}
                          </div>
                          {errors.portfolio && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.portfolio}</span>}

                          {/* Render Portfolio Image Previews */}
                          {form.portfolioImages.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 bg-[#FCFAF7] dark:bg-[#13121F] p-5 rounded-2xl border border-neutral-150 dark:border-neutral-800 mt-2">
                              {form.portfolioImages.map((img, idx) => (
                                <div key={idx} className="relative group rounded-xl overflow-hidden shadow-xs border border-neutral-200 dark:border-neutral-800 h-20 bg-white dark:bg-[#1C1B2E]">
                                  <img src={img} alt={`Port ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); removePortfolioImage(idx); }}
                                      className="p-1.5 rounded-full bg-rose-600 text-white hover:scale-110 transition-all cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Optional: CAC/Business Registration upload & Certificates upload side-by-side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          
                          {/* Business Reg Certificate Document */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Business Registration Certificate Document (Optional)</label>
                            <div 
                              onDragOver={(e) => { e.preventDefault(); setIsDragOverBusReg(true); }}
                              onDragLeave={() => setIsDragOverBusReg(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOverBusReg(false);
                                if (e.dataTransfer.files?.[0]) handleBusRegChange(e.dataTransfer.files[0]);
                              }}
                              onClick={() => busRegInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-300 ${
                                isDragOverBusReg ? 'border-[#6C4CF1] bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-[#6C4CF1]/30 dark:hover:border-[#8B73FF]/30 bg-[#FCFAF7] dark:bg-[#13121F]'
                              }`}
                            >
                              <input ref={busRegInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleBusRegChange(e.target.files?.[0] || null)} />
                              {businessRegUploading ? (
                                <div className="space-y-1 py-1">
                                  <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin mx-auto" />
                                  <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">Uploading... {businessRegProgress}%</p>
                                </div>
                              ) : form.businessRegUrl ? (
                                <div className="space-y-2 flex flex-col items-center py-1">
                                  <Check className="w-6 h-6 text-emerald-500" />
                                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">CAC Certificate linked.</span>
                                </div>
                              ) : (
                                <div className="space-y-1 py-1">
                                  <Upload className="w-5 h-5 text-neutral-400 dark:text-neutral-550 mx-auto" />
                                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold">CAC Registration Doc (PDF/JPG)</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Certificates & Awards */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Professional Certificates / Awards (Optional)</label>
                            <div 
                              onDragOver={(e) => { e.preventDefault(); setIsDragOverCert(true); }}
                              onDragLeave={() => setIsDragOverCert(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOverCert(false);
                                if (e.dataTransfer.files) handleCertificatesChange(e.dataTransfer.files);
                              }}
                              onClick={() => certInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-300 ${
                                isDragOverCert ? 'border-[#6C4CF1] bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-[#6C4CF1]/30 dark:hover:border-[#8B73FF]/30 bg-[#FCFAF7] dark:bg-[#13121F]'
                              }`}
                            >
                              <input ref={certInputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => handleCertificatesChange(e.target.files)} />
                              {certUploading ? (
                                <div className="space-y-1 py-1">
                                  <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin mx-auto" />
                                  <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">Processing uploads...</p>
                                </div>
                              ) : (
                                <div className="space-y-1 py-1">
                                  <Upload className="w-5 h-5 text-neutral-400 dark:text-neutral-550 mx-auto" />
                                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold">Click or drag credentials (PDF/JPG)</p>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Certificates Preview Grid */}
                        {form.certificatesUrls && form.certificatesUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2.5 p-3.5 bg-[#FCFAF7] dark:bg-[#13121F] rounded-xl border border-neutral-150 dark:border-neutral-800">
                            {form.certificatesUrls.map((cert, idx) => (
                              <div key={idx} className="relative group rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 h-14 w-20 bg-white dark:bg-[#1C1B2E]">
                                <img src={cert} alt={`Cert ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <button
                                    type="button"
                                    onClick={() => removeCertificateImage(idx)}
                                    className="p-1 rounded-full bg-rose-600 text-white cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Custom Price List Upload */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">Package Brochure / Pricing Sheet (Optional)</label>
                          <div 
                            onDragOver={(e) => { e.preventDefault(); setIsDragOverPriceList(true); }}
                            onDragLeave={() => setIsDragOverPriceList(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragOverPriceList(false);
                              if (e.dataTransfer.files?.[0]) handlePriceListChange(e.dataTransfer.files[0]);
                            }}
                            onClick={() => priceListInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                              isDragOverPriceList ? 'border-[#6C4CF1] bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-[#6C4CF1]/30 dark:hover:border-[#8B73FF]/30 bg-[#FCFAF7] dark:bg-[#13121F]'
                            }`}
                          >
                            <input ref={priceListInputRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => handlePriceListChange(e.target.files?.[0] || null)} />
                            {priceListUploading ? (
                              <div className="space-y-2 py-1">
                                <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin mx-auto" />
                                <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">Uploading Brochure... {priceListProgress}%</p>
                              </div>
                            ) : form.priceList ? (
                              <div className="space-y-2 flex flex-col items-center py-1">
                                <FileText className="w-8 h-8 text-[#6C4CF1]" />
                                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">Brochure Document linked successfully.</span>
                              </div>
                            ) : (
                              <div className="space-y-2 py-1">
                                <FileText className="w-6 h-6 text-neutral-400 dark:text-neutral-550 mx-auto" />
                                <p className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold">Click or drag & drop tiered packages sheet brochure</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Verified Verification Badge Request Display */}
                        <div className="bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10 border border-[#6C4CF1]/15 dark:border-[#8B73FF]/20 p-5 rounded-2xl space-y-4">
                          <div className="flex items-start space-x-3.5">
                            <Award className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">Request Verified Blue Check Badge</h4>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
                                Verified vendors receive higher visibility in search results. Check below to opt in for verification during our administration audit.
                              </p>
                            </div>
                          </div>

                          <label className="flex items-center space-x-3 p-3.5 bg-white dark:bg-[#13121F] hover:bg-[#FCFAF7] dark:hover:bg-[#1C1B2E] rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 transition-all cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={form.verificationBadgeRequested}
                              onChange={(e) => setForm(prev => ({ ...prev, verificationBadgeRequested: e.target.checked }))}
                              className="w-4 h-4 text-[#6C4CF1] border-neutral-300 rounded focus:ring-[#6C4CF1]/20"
                            />
                            <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Opt in for Blue Check badge verification review</span>
                          </label>
                        </div>

                      </div>
                    )}

                    {/* STEP 5: REVIEW & SUBMIT */}
                    {currentStep === 5 && (
                      <div className="space-y-8 animate-fadeIn">
                        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#6C4CF1]" />
                            Review Application Proposal & Consent
                          </h3>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Carefully inspect your generated partner credentials voucher before final electronic signature.</p>
                        </div>

                        {/* Premium printed-like luxury voucher details card */}
                        <div className="bg-[#FCFAF7] dark:bg-[#13121F] border-2 border-dashed border-[#C5A059]/40 rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-xs">
                          
                          <div className="flex justify-between items-start border-b border-[#C5A059]/20 pb-5">
                            <div>
                              <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold block">Registry Proposal</span>
                              <h4 className="font-serif text-2xl text-neutral-900 dark:text-neutral-100 mt-1">{form.businessName || 'Your Brand'}</h4>
                              <span className="inline-block text-[9px] font-mono text-[#6C4CF1] dark:text-[#8B73FF] bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10 border border-[#6C4CF1]/10 px-2.5 py-0.5 rounded-md mt-2 uppercase font-bold tracking-wider">
                                {form.category}
                              </span>
                            </div>
                            <div className="text-right">
                              {form.logo && <img src={form.logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-neutral-200 dark:border-neutral-850 shadow-sm ml-auto" referrerPolicy="no-referrer" />}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs font-light text-neutral-600 dark:text-neutral-400">
                            <div className="space-y-1">
                              <span className="text-[8px] font-mono uppercase text-neutral-400 dark:text-neutral-500 tracking-wider block">Registrant Owner</span>
                              <span className="text-neutral-900 dark:text-neutral-200 font-medium">{form.ownerName || '—'}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] font-mono uppercase text-neutral-400 dark:text-neutral-500 tracking-wider block">Contact Information</span>
                              <span className="text-neutral-900 dark:text-neutral-200 font-medium">{form.email} / {form.phone}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] font-mono uppercase text-neutral-400 dark:text-neutral-500 tracking-wider block">Coverage Region</span>
                              <span className="text-neutral-900 dark:text-neutral-200 font-medium">{form.city}, {form.state} ({form.lga})</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] font-mono uppercase text-neutral-400 dark:text-neutral-500 tracking-wider block">Pricing Packages</span>
                              <span className="text-[#C5A059] font-semibold font-mono text-xs">
                                ₦{Number(form.minPrice).toLocaleString()} - ₦{Number(form.maxPrice).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-[#C5A059]/25 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[10px] font-mono text-neutral-400">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#6C4CF1]" />
                              Administrative handshakes active
                            </span>
                            <span className="text-[#C5A059] font-bold tracking-widest uppercase text-[9px]">★ MyDay Premium Partner Certified ★</span>
                          </div>
                        </div>

                        {/* Consent Checklist Checkboxes */}
                        <div className="space-y-4">
                          
                          {/* Accuracy check */}
                          <label className="flex items-start space-x-3.5 p-4.5 bg-[#FCFAF7] dark:bg-[#13121F] hover:bg-[#6C4CF1]/5 dark:hover:bg-[#6C4CF1]/10 rounded-2xl border border-neutral-150 dark:border-neutral-800 transition-all cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={form.confirmAccurate}
                              onChange={(e) => setForm(prev => ({ ...prev, confirmAccurate: e.target.checked }))}
                              className="mt-1 w-4 h-4 text-[#6C4CF1] border-neutral-300 rounded focus:ring-[#6C4CF1]/20 cursor-pointer"
                            />
                            <span className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light select-none">
                              I confirm that all information, social handle indexes, portfolio gallery works, and logo shared in this application are accurate representations of my active registered local enterprise.
                            </span>
                          </label>
                          {errors.confirmAccurate && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.confirmAccurate}</span>}

                          {/* Terms agreement */}
                          <label className="flex items-start space-x-3.5 p-4.5 bg-[#FCFAF7] dark:bg-[#13121F] hover:bg-[#6C4CF1]/5 dark:hover:bg-[#6C4CF1]/10 rounded-2xl border border-neutral-150 dark:border-neutral-800 transition-all cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={form.agreeTerms}
                              onChange={(e) => setForm(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                              className="mt-1 w-4 h-4 text-[#6C4CF1] border-neutral-300 rounded focus:ring-[#6C4CF1]/20 cursor-pointer"
                            />
                            <span className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light select-none">
                              I agree to the <span className="text-[#6C4CF1] hover:underline font-bold">MyDay Partner Terms & Services</span>. I agree to support booking schedules and processing parameters handled by the MyDay administrative panel.
                            </span>
                          </label>
                          {errors.agreeTerms && <span className="text-[10px] text-rose-500 font-light block mt-1">{errors.agreeTerms}</span>}

                        </div>

                      </div>
                    )}

                    {/* Visually Disabled Checklist Warning next to the submit/continue footer */}
                    {!isStepValid && (
                      <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-2xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Please complete the required fields in this step:</p>
                          <ul className="list-disc list-inside text-[11px] text-amber-700 dark:text-amber-400 font-light space-y-0.5 mt-1.5">
                            {Object.values(errors).map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Onboarding Stepper Footer Buttons */}
                    <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-8">
                      {currentStep > 1 ? (
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="px-6 py-3 rounded-xl text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#1C1B2E] transition-all flex items-center space-x-1.5 cursor-pointer bg-white dark:bg-[#13121F]"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Back</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      {currentStep < 5 ? (
                        <button
                          type="button"
                          disabled={!isStepValid}
                          onClick={handleNextStep}
                          className={`px-7 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl flex items-center space-x-2 transition-all cursor-pointer border ${
                            isStepValid 
                              ? 'bg-[#1A1A1A] hover:bg-neutral-800 text-[#C5A059] border-[#C5A059]/20 shadow-md dark:bg-neutral-900 dark:hover:bg-neutral-800' 
                              : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60 dark:bg-neutral-900/40 dark:text-neutral-600 dark:border-neutral-800'
                          }`}
                        >
                          <span>Continue</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isSubmitting || !isStepValid}
                          onClick={handleSubmitApplication}
                          className={`px-8 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl flex items-center space-x-2.5 transition-all cursor-pointer border ${
                            isStepValid 
                              ? 'bg-gradient-to-r from-[#6C4CF1] to-[#C5A059] text-white hover:opacity-95 shadow-lg border-transparent' 
                              : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60 dark:bg-neutral-900/40 dark:text-neutral-600 dark:border-neutral-800'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Submit Application</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                  </form>
                </CardBody>
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
              className="max-w-md mx-auto bg-white dark:bg-[#0E0D16] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center space-y-6 shadow-sm"
            >
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
                <Check className="w-8 h-8 text-emerald-500 animate-pulse" />
              </div>
              
              <div className="space-y-2.5">
                <h2 className="text-xl font-serif text-neutral-900 dark:text-neutral-100">Application Received 🎉</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans font-light leading-relaxed max-w-sm mx-auto">
                  Thank you for applying to become an elite MyDay Vendor Partner. Our administrative panel will verify your local state registration, social channels, and portfolios, contacting you within <strong>2–3 business days</strong>.
                </p>
              </div>

              <div className="bg-[#FCFAF7] dark:bg-[#13121F] rounded-xl p-5 border border-neutral-150 dark:border-neutral-800 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 text-left space-y-2">
                <div><strong>Registry Status:</strong> <span className="text-[#C5A059] font-bold uppercase">Pending Audit</span></div>
                <div><strong>Business Email:</strong> {form.email}</div>
                <div><strong>Business Name:</strong> {form.businessName}</div>
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  variant="primary" 
                  onClick={onGoHome} 
                  className="w-full bg-[#1A1A1A] hover:bg-neutral-800 text-[#C5A059] hover:text-white dark:bg-[#1C1B2E] dark:hover:bg-[#25233D] text-xs font-mono font-bold uppercase tracking-widest py-3.5 rounded-xl border border-[#C5A059]/20 cursor-pointer shadow-md transition-all"
                >
                  Return Home
                </Button>
                <button
                  onClick={() => {
                    setSearchEmail(form.email);
                    setViewState('tracker');
                    setHasSearched(false);
                  }}
                  className="text-[10px] font-mono uppercase font-bold text-neutral-400 hover:text-[#6C4CF1] hover:underline transition-colors cursor-pointer"
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
              className="max-w-xl mx-auto bg-white dark:bg-[#0E0D16] border border-neutral-150/80 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6"
            >
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4 text-center space-y-1.5">
                <h2 className="text-lg font-serif text-neutral-900 dark:text-neutral-100">Vendor Status Tracker</h2>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans font-light">Enter your registered business email to verify auditing credentials</p>
              </div>

              <form onSubmit={handleSearchApplication} className="space-y-3">
                <div className="flex items-center space-x-2 bg-[#FCFAF7] dark:bg-[#13121F] p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <Mail className="w-4 h-4 text-[#C5A059] ml-2" />
                  <input
                    type="email"
                    required
                    placeholder="Enter registered business email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-grow bg-transparent text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 px-2 focus:outline-none font-sans font-light py-2"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSearching}
                    className="bg-[#1A1A1A] hover:bg-neutral-800 text-[#C5A059] hover:text-white dark:bg-[#1C1B2E] dark:hover:bg-[#25233D] font-mono font-bold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-xl shrink-0 cursor-pointer border border-[#C5A059]/20 transition-all"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </form>

              {hasSearched && (
                <div className="space-y-4 pt-2 animate-fadeIn">
                  {searchedApplications.length === 0 ? (
                    <div className="text-center py-6 bg-[#FCFAF7] dark:bg-[#13121F] rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">No Applications Found</p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light max-w-xs mx-auto leading-relaxed">
                        No applications were found matching "<strong>{searchEmail}</strong>". Check the email spelling or start a new onboarding registration.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-bold">Records found ({searchedApplications.length})</p>
                      
                      {searchedApplications.map((app, idx) => (
                        <div key={idx} className="p-5 bg-[#FCFAF7] dark:bg-[#13121F] rounded-2xl border border-neutral-150 dark:border-neutral-800 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 font-serif">{app.businessName}</h4>
                              <p className="text-[10px] text-[#C5A059] font-mono mt-1 font-bold">{app.category}</p>
                            </div>
                            <span className={`text-[9px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                              app.status === 'Approved'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                                : app.status === 'Rejected'
                                ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
                                : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
                            }`}>
                              {app.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-1.5 text-[10px] text-neutral-500 dark:text-neutral-450 border-t border-neutral-150 dark:border-neutral-800 pt-3 font-light">
                            <div><strong>Submitted At:</strong> {new Date(app.submittedAt).toLocaleDateString()}</div>
                            <div><strong>Location:</strong> {app.city}, {app.state}</div>
                            {app.minPrice && (
                              <div className="col-span-2">
                                <strong>Registered Package Rates:</strong> ₦{app.minPrice.toLocaleString()} - ₦{app.maxPrice?.toLocaleString()} (Avg: ₦{app.avgPrice?.toLocaleString()})
                              </div>
                            )}
                          </div>

                          {/* Registry Audit Simulator (For local developer previews) */}
                          <div className="bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/10 p-3.5 rounded-xl border border-[#6C4CF1]/10 dark:border-[#8B73FF]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2">
                            <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] inline-block animate-pulse"></span>
                              Partner Audit Simulator:
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
                  onClick={() => setViewState('landing')}
                  className="text-xs font-mono font-bold uppercase text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline flex items-center justify-center space-x-1.5 mx-auto cursor-pointer transition-colors bg-transparent border-0"
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
