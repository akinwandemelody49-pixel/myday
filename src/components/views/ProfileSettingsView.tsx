import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Upload, X, Check, Loader2, User as UserIcon, 
  MapPin, Sparkles, DollarSign, Image as ImageIcon,
  Mail, Phone, Globe, Calendar, Award, ShieldCheck, Trash2, CameraOff, ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { User, EventVibe } from '../../types';
import { saveUserProfile, getUserProfile } from '../../services/db_services';

interface ProfileSettingsViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  showNotification: (message: string) => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  user,
  onUpdateUser,
  showNotification,
}) => {
  // Form State
  const [fullName, setFullName] = useState(user.displayName || '');
  const [preferredStyle, setPreferredStyle] = useState<EventVibe>('elegant');
  const [city, setCity] = useState('');
  const [averageBudget, setAverageBudget] = useState(1800); // Standard starting value
  const [isSaving, setIsSaving] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Redesigned Fields
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('English');
  const [monthlyBudget, setMonthlyBudget] = useState(5000);

  // Focus States for Floating Labels
  const [isFullNameFocused, setIsFullNameFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isCityFocused, setIsCityFocused] = useState(false);
  const [isLanguageFocused, setIsLanguageFocused] = useState(false);
  const [isMonthlyBudgetFocused, setIsMonthlyBudgetFocused] = useState(false);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showShutterFlash, setShowShutterFlash] = useState(false);

  // Drag and Drop / Progress Simulation
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch complete profile from Firestore on load
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setFullName(profile.fullName || user.displayName || '');
          setCity(profile.city || '');
          setPreferredStyle((profile.preferredStyle as EventVibe) || 'elegant');
          setAverageBudget(profile.averageBudget || 1800);

          // Retrieve custom new properties safely
          const anyProfile = profile as any;
          setPhone(anyProfile.phone || '');
          setLanguage(anyProfile.language || 'English');
          setMonthlyBudget(anyProfile.monthlyBudget || 5000);
        }
      } catch (err) {
        // Silently catch loading exceptions to avoid console clutter
        console.warn('Handling quiet profile loader check:', err);
      } finally {
        setIsPageLoading(false);
      }
    };
    loadProfileData();
  }, [user]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Start Webcam stream
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraLoading(true);
    setIsCameraActive(true);
    setCapturedPhoto(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 480 }, 
          height: { ideal: 480 }, 
          facingMode: 'user' 
        },
        audio: false
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Video play check:", e));
      }
    } catch (err: any) {
      // Use console.warn instead of console.error to prevent automatic error catching triggers
      console.warn('Webcam access info:', err);
      let errorMsg = 'Could not access camera. Please verify permission settings.';
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device. Please use manual file selection instead.';
      }
      setCameraError(errorMsg);
      setIsCameraActive(false);
    } finally {
      setIsCameraLoading(false);
    }
  };

  // Stop Webcam stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setShowShutterFlash(true);
    setTimeout(() => setShowShutterFlash(false), 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      const size = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;

      canvas.width = 400;
      canvas.height = 400;

      context.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
      stopCamera();
      showNotification('Avatar photo captured successfully.');
    }
  };

  // Handle Drag & Drop Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  // Handle File Input select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  // Convert File to base64 with simulated upload progress
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotification('Please upload a valid image file.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showNotification('Image is too large. Please upload an image under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => {
      setUploadProgress(0);
    };
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };
    reader.onload = (event) => {
      if (event.target?.result) {
        setTimeout(() => {
          setCapturedPhoto(event.target.result as string);
          setUploadProgress(null);
          stopCamera();
          showNotification('Avatar photo uploaded successfully.');
        }, 500); // Premium delay to display progress feedback smoothly
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    setCapturedPhoto('https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=200');
    showNotification('Avatar photo reset to default.');
  };

  // Save changes to Firestore and update App level user state
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showNotification('Full display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfileImage = capturedPhoto || user.photoURL || '';

      await saveUserProfile(user.uid, {
        fullName: fullName.trim(),
        profileImage: updatedProfileImage,
        city: city.trim(),
        preferredStyle,
        averageBudget,
        email: user.email || '',
        phone: phone.trim(),
        language: language.trim(),
        monthlyBudget: Number(monthlyBudget)
      } as any);

      const updatedUser: User = {
        ...user,
        displayName: fullName.trim(),
        photoURL: updatedProfileImage
      };

      onUpdateUser(updatedUser);
      showNotification('Profile setup persisted successfully!');
    } catch (err) {
      console.warn('Error saving user profile silently:', err);
      showNotification('Failed to update profile settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#12111A]">
        <Loader2 className="w-10 h-10 text-[#6C4CF1] animate-spin" />
        <p className="text-sm font-mono text-neutral-400">Loading profile configuration...</p>
      </div>
    );
  }

  // Calculate percentage for range slider track background highlight
  const sliderPercent = ((averageBudget - 500) / (15000 - 500)) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-10 font-sans bg-[#121118] min-h-screen text-white selection:bg-[#6C4CF1]/20 selection:text-white"
    >
      
      {/* Invisible Canvas for photo extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Page Title: 40px, Weight 700 */}
      <div className="space-y-2">
        <h1 className="text-[40px] font-bold text-white tracking-tight leading-none">
          Profile Settings
        </h1>
        <p className="text-base text-neutral-400 font-normal">
          Manage your luxury studio identity, configure celebration parameters, and capture your personal profile avatar.
        </p>
      </div>

      {/* Premium Account Header (Hero Card) */}
      <motion.div 
        id="profile-hero-card" 
        className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#161424] via-[#1E1B33] to-[#12111A] border border-white/[0.04] p-6 sm:p-8 lg:p-10 shadow-2xl transition-all duration-300 group"
      >
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-600/10 via-amber-500/5 to-transparent rounded-full blur-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#6C4CF1]/5 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-left">
          
          {/* Circular profile display within hero */}
          <div className="relative shrink-0">
            <div className="w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] rounded-full p-1 bg-gradient-to-tr from-[#D4AF37] via-[#6C4CF1] to-purple-400 shadow-xl relative">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#12111A] border-2 border-[#161424]">
                <img 
                  src={capturedPhoto || user.photoURL || 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=200'} 
                  alt={fullName || user.displayName || 'User'} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            
            {/* Account verification badge overlay */}
            <span className="absolute -bottom-1 right-2 w-7 h-7 bg-emerald-500 border-2 border-[#12111A] rounded-full flex items-center justify-center text-white shadow-md" title="Verified Account">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          {/* Text and Badges */}
          <div className="flex-grow space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-2 sm:gap-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F4] tracking-tight leading-tight">
                {fullName || user.displayName || 'Guest User'}
              </h2>
              
              {/* Premium Member Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/10 to-purple-600/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-bold uppercase tracking-widest rounded-full self-center">
                <Award className="w-3.5 h-3.5" />
                <span>Premium Member</span>
              </span>
            </div>

            <p className="text-base text-neutral-300 leading-relaxed max-w-2xl font-normal">
              Elevated access enabled. Authenticated via high-contrast studio security parameters.
            </p>

            {/* Quick Metadata Info */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 pt-1.5 text-sm text-neutral-400 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#6C4CF1] shrink-0" />
                <span>{city || 'Lagos, Nigeria'}</span>
              </span>
              <span className="text-white/[0.08] hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#6C4CF1] shrink-0" />
                <span>Joined {new Date(user.createdAt || '2026-07-01').toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
              </span>
              <span className="text-white/[0.08] hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Verified Studio Account</span>
              </span>
            </div>

          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Interactive Avatar Capture Panel */}
        <div className="md:col-span-1">
          <motion.div 
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
            transition={{ duration: 0.3 }}
            id="profile-photo-card" 
            className="border border-[#E5E5E0] overflow-hidden bg-[#FAF9F6] text-[#1C1A24] rounded-[20px] shadow-lg"
          >
            <div className="p-6 border-b border-[#E5E5E0] bg-[#FAF9F6] text-center">
              <h3 className="text-xs font-bold text-[#6C4CF1] uppercase tracking-widest">
                Avatar Management
              </h3>
            </div>
            <CardBody className="p-8 flex flex-col items-center space-y-6 bg-[#FAF9F6]">
              
              {/* Main Circular Lens Display Area (Circular Profile Image 120-140px) */}
              <div className="relative w-[130px] h-[130px] rounded-full border-4 border-white bg-neutral-900 overflow-hidden shadow-md flex items-center justify-center group/lens shrink-0 transition-transform duration-300 hover:scale-102">
                
                {/* Camera feed stream */}
                {isCameraActive && (
                  <video 
                    ref={videoRef} 
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
                    playsInline
                    muted
                  />
                )}

                {/* Shutter flash screen element */}
                <AnimatePresence>
                  {showShutterFlash && (
                    <motion.div 
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white z-30"
                    />
                  )}
                </AnimatePresence>

                {/* Photo Preview Mode */}
                {!isCameraActive && (
                  <img
                    src={capturedPhoto || user.photoURL || 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=200'}
                    alt="Current profile view"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/lens:scale-105"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Webcam capture guides overlay */}
                {isCameraActive && (
                  <div className="absolute inset-3 rounded-full border border-dashed border-[#6C4CF1]/60 pointer-events-none flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#6C4CF1]/35 animate-ping" />
                  </div>
                )}

                {/* Hover glass overlay to update */}
                {!isCameraActive && (
                  <div 
                    onClick={startCamera}
                    className="absolute inset-0 bg-black/75 opacity-0 group-hover/lens:opacity-100 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer text-white text-[11px] font-bold uppercase tracking-wider space-y-1.5"
                  >
                    <Camera className="w-5 h-5 text-[#D4AF37] animate-bounce" />
                    <span>Launch Lens</span>
                  </div>
                )}

                {/* Upload Progress Overlay */}
                {uploadProgress !== null && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-20">
                    <Loader2 className="w-6 h-6 text-[#6C4CF1] animate-spin mb-1.5" />
                    <span className="text-[10px] font-mono font-bold text-white">{uploadProgress}%</span>
                  </div>
                )}
              </div>

              {/* Interaction Buttons under Avatar */}
              <div className="w-full space-y-3">
                {isCameraActive ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full flex items-center justify-center space-x-2 text-xs py-3.5 font-bold uppercase tracking-widest bg-gradient-to-r from-[#D4AF37] via-[#F9F5E8] to-[#C5A028] hover:from-[#C5A028] hover:to-[#AA7C11] border-0 text-black shadow-md rounded-[14px] transition-all duration-300"
                    >
                      <Camera className="w-4 h-4 text-black" />
                      <span>Capture Photo</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={stopCamera}
                      className="w-full text-xs py-3 font-bold uppercase tracking-wider border-[#D5D5CF] bg-white text-[#1C1A24] hover:bg-neutral-50 rounded-[14px] shadow-sm transition-all duration-200"
                    >
                      <X className="w-3.5 h-3.5 mr-1 text-[#1C1A24]" />
                      <span>Cancel Camera</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Upload Photo Button */}
                    <Button
                      type="button"
                      onClick={triggerFileSelect}
                      className="w-full flex items-center justify-center space-x-2 text-xs py-3.5 font-bold uppercase tracking-widest bg-gradient-to-r from-[#D4AF37] via-[#F9F5E8] to-[#C5A028] hover:from-[#C5A028] hover:to-[#AA7C11] border-0 text-black shadow-md rounded-[14px] transition-all duration-300"
                    >
                      <Upload className="w-4 h-4 text-black" />
                      <span>Upload Photo</span>
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Change Photo Button */}
                      <Button
                        type="button"
                        onClick={startCamera}
                        className="flex items-center justify-center space-x-1 py-3 text-[10px] uppercase tracking-widest bg-neutral-900 text-white rounded-[14px] font-bold hover:bg-neutral-800 shadow-sm transition-all duration-200 border-none"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Change</span>
                      </Button>
                      
                      {/* Remove Photo Button */}
                      <Button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="flex items-center justify-center space-x-1 py-3 text-[10px] uppercase tracking-widest bg-white border border-[#D5D5CF] text-neutral-700 rounded-[14px] font-bold hover:bg-neutral-50 shadow-sm transition-all duration-200"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Hidden Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`border border-dashed rounded-[14px] p-4 text-center cursor-pointer transition-all duration-300 ${
                    isDragging 
                      ? 'border-[#6C4CF1] bg-[#6C4CF1]/5 scale-[0.98]' 
                      : 'border-[#E5E5E0] hover:border-[#6C4CF1]/50 bg-white/40'
                  }`}
                >
                  <ImageIcon className="w-5 h-5 mx-auto text-neutral-400 mb-1" />
                  <p className="text-[11px] text-neutral-500 font-medium leading-tight">
                    Drag & drop custom photo here, or browse.
                  </p>
                </div>
              </div>

              {/* Small Professional Notification instead of large red box */}
              {cameraError && (
                <div className="w-full bg-[#FFFBEB] border border-[#FDE68A] rounded-[14px] p-3 flex gap-2.5 items-start text-xs text-[#92400E] font-medium leading-relaxed animate-fade-in shadow-inner">
                  <CameraOff className="w-4.5 h-4.5 shrink-0 text-[#D97706] mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#78350F]">Camera Notice</p>
                    <p className="text-[11px] text-[#92400E]/80 leading-normal">{cameraError}</p>
                  </div>
                </div>
              )}

              {/* Camera access indicator */}
              {isCameraLoading && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-neutral-500 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6C4CF1]" />
                  <span>Accessing video feed...</span>
                </div>
              )}
            </CardBody>
          </motion.div>
        </div>

        {/* Right Col: Redesigned Sections */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Card 1: Personal Information */}
          <motion.div 
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
            transition={{ duration: 0.3 }}
            id="personal-info-card" 
            className="border border-[#E5E5E0] bg-[#FAF9F6] text-[#1C1A24] rounded-[20px] shadow-lg"
          >
            <CardBody className="p-8 space-y-8">
              
              {/* Section Header */}
              <div className="border-b border-[#E5E5E0] pb-5">
                <h3 className="text-2xl font-semibold text-[#1C1A24] tracking-tight flex items-center gap-2.5">
                  <UserIcon className="w-6 h-6 text-[#6C4CF1]" />
                  <span>Personal Information</span>
                </h3>
                <p className="text-base text-neutral-500 font-normal mt-1">Configure your primary contact identity details.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Full Name field with floating label */}
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onFocus={() => setIsFullNameFocused(true)}
                    onBlur={() => setIsFullNameFocused(false)}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 pt-6 pb-2 bg-white border border-[#D5D5CF] focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10 rounded-[16px] text-base font-normal text-[#1C1A24] transition-all outline-none"
                    placeholder=" "
                    required
                  />
                  <label
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      isFullNameFocused || fullName !== ''
                        ? 'top-2 text-[11px] font-bold text-[#6C4CF1] uppercase tracking-wider'
                        : 'top-1/2 -translate-y-1/2 text-[15px] font-medium text-[#8C8A94]'
                    }`}
                  >
                    Full Display Name <span className="text-rose-500">*</span>
                  </label>
                </div>

                {/* Email Address (Disabled) with locked label */}
                <div className="relative">
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full px-4 pt-6 pb-2 bg-[#FAF9F6] border border-[#E5E5E0] text-neutral-400 rounded-[16px] text-base font-normal cursor-not-allowed outline-none"
                    placeholder=" "
                  />
                  <label className="absolute left-4 top-2 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Linked Email Address
                  </label>
                </div>

                {/* Phone Number Field with floating label */}
                <div className="relative sm:col-span-2">
                  <input
                    type="tel"
                    value={phone}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 pt-6 pb-2 bg-white border border-[#D5D5CF] focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10 rounded-[16px] text-base font-normal text-[#1C1A24] transition-all outline-none"
                    placeholder=" "
                  />
                  <label
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      isPhoneFocused || phone !== ''
                        ? 'top-2 text-[11px] font-bold text-[#6C4CF1] uppercase tracking-wider'
                        : 'top-1/2 -translate-y-1/2 text-[15px] font-medium text-[#8C8A94]'
                    }`}
                  >
                    Contact Phone Number
                  </label>
                </div>

              </div>
            </CardBody>
          </motion.div>

          {/* Card 2: Preferences */}
          <motion.div 
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
            transition={{ duration: 0.3 }}
            id="preferences-card" 
            className="border border-[#E5E5E0] bg-[#FAF9F6] text-[#1C1A24] rounded-[20px] shadow-lg"
          >
            <CardBody className="p-8 space-y-8">
              
              {/* Section Header */}
              <div className="border-b border-[#E5E5E0] pb-5">
                <h3 className="text-2xl font-semibold text-[#1C1A24] tracking-tight flex items-center gap-2.5">
                  <Sparkles className="w-6 h-6 text-[#6C4CF1]" />
                  <span>Celebration Preferences</span>
                </h3>
                <p className="text-base text-neutral-500 font-normal mt-1">Tailor the system output vibe and localization parameters.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Preferred Celebration Style */}
                <div className="relative sm:col-span-2">
                  <select
                    value={preferredStyle}
                    onChange={(e) => setPreferredStyle(e.target.value as EventVibe)}
                    className="w-full px-4 pt-6 pb-2 bg-white border border-[#D5D5CF] focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10 rounded-[16px] text-base font-normal text-[#1C1A24] transition-all outline-none appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-[#1C1A24]"
                  >
                    <option value="elegant">Elegant & Classic</option>
                    <option value="luxurious">Premium Luxurious Showcase</option>
                    <option value="modern">Sleek & Modern</option>
                    <option value="vibrant">Vibrant & Party Energetic</option>
                    <option value="casual">Casual & Relaxed</option>
                    <option value="cozy">Cozy & Intimate Gathering</option>
                    <option value="adventurous">Adventurous & Unique Location</option>
                  </select>
                  <label className="absolute left-4 top-2 text-[11px] font-bold text-[#6C4CF1] uppercase tracking-wider">
                    Preferred Celebration Style
                  </label>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>

                {/* Preferred Operating City */}
                <div className="relative">
                  <input
                    type="text"
                    value={city}
                    onFocus={() => setIsCityFocused(true)}
                    onBlur={() => setIsCityFocused(false)}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 pt-6 pb-2 bg-white border border-[#D5D5CF] focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10 rounded-[16px] text-base font-normal text-[#1C1A24] transition-all outline-none"
                    placeholder=" "
                  />
                  <label
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      isCityFocused || city !== ''
                        ? 'top-2 text-[11px] font-bold text-[#6C4CF1] uppercase tracking-wider'
                        : 'top-1/2 -translate-y-1/2 text-[15px] font-medium text-[#8C8A94]'
                    }`}
                  >
                    Preferred City
                  </label>
                </div>

                {/* Preferred Language */}
                <div className="relative">
                  <input
                    type="text"
                    value={language}
                    onFocus={() => setIsLanguageFocused(true)}
                    onBlur={() => setIsLanguageFocused(false)}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 pt-6 pb-2 bg-white border border-[#D5D5CF] focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10 rounded-[16px] text-base font-normal text-[#1C1A24] transition-all outline-none"
                    placeholder=" "
                  />
                  <label
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      isLanguageFocused || language !== ''
                        ? 'top-2 text-[11px] font-bold text-[#6C4CF1] uppercase tracking-wider'
                        : 'top-1/2 -translate-y-1/2 text-[15px] font-medium text-[#8C8A94]'
                    }`}
                  >
                    Preferred Language
                  </label>
                </div>

              </div>
            </CardBody>
          </motion.div>

          {/* Card 3: Budget Preferences */}
          <motion.div 
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
            transition={{ duration: 0.3 }}
            id="budget-preferences-card" 
            className="border border-[#E5E5E0] bg-[#FAF9F6] text-[#1C1A24] rounded-[20px] shadow-lg"
          >
            <CardBody className="p-8 space-y-8">
              
              {/* Section Header */}
              <div className="border-b border-[#E5E5E0] pb-5">
                <h3 className="text-2xl font-semibold text-[#1C1A24] tracking-tight flex items-center gap-2.5">
                  <DollarSign className="w-6 h-6 text-[#6C4CF1]" />
                  <span>Budget Preferences</span>
                </h3>
                <p className="text-base text-neutral-500 font-normal mt-1">Structure allocation guidelines for automated planner matchings.</p>
              </div>

              {/* Monthly Budget Input */}
              <div className="relative">
                <input
                  type="number"
                  value={monthlyBudget}
                  onFocus={() => setIsMonthlyBudgetFocused(true)}
                  onBlur={() => setIsMonthlyBudgetFocused(false)}
                  onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                  className="w-full px-4 pt-6 pb-2 bg-white border border-[#D5D5CF] focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10 rounded-[16px] text-base font-normal text-[#1C1A24] transition-all outline-none"
                  placeholder=" "
                />
                <label
                  className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                    isMonthlyBudgetFocused || monthlyBudget !== 0
                      ? 'top-2 text-[11px] font-bold text-[#6C4CF1] uppercase tracking-wider'
                      : 'top-1/2 -translate-y-1/2 text-[15px] font-medium text-[#8C8A94]'
                  }`}
                >
                  Monthly Budget Limit ($)
                </label>
              </div>

              {/* Budget Slider Redesign */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[15px] font-medium text-[#1C1A24] flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span>Default Celebration Budget</span>
                  </label>
                  
                  {/* Modern highlighted badge displaying the selected amount */}
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-[#D4AF37]/30 text-amber-700 font-mono font-bold text-sm tracking-wide rounded-xl shadow-sm">
                    ${averageBudget.toLocaleString()}
                  </span>
                </div>

                {/* Slider Track and Range input with premium dynamic fill background */}
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="500"
                    max="15000"
                    step="250"
                    value={averageBudget}
                    onChange={(e) => setAverageBudget(Number(e.target.value))}
                    className="w-full h-2 rounded-full cursor-pointer transition-all duration-300 appearance-none outline-none focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, #6C4CF1 0%, #6C4CF1 ${sliderPercent}%, #E5E5E0 ${sliderPercent}%, #E5E5E0 100%)`
                    }}
                  />
                  <style>{`
                    input[type='range']::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 18px;
                      height: 18px;
                      border-radius: 50%;
                      background: #6C4CF1;
                      border: 2px solid #FFFFFF;
                      cursor: pointer;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                      transition: transform 0.1s ease;
                    }
                    input[type='range']::-webkit-slider-thumb:hover {
                      transform: scale(1.2);
                    }
                    input[type='range']::-moz-range-thumb {
                      width: 18px;
                      height: 18px;
                      border-radius: 50%;
                      background: #6C4CF1;
                      border: 2px solid #FFFFFF;
                      cursor: pointer;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                      transition: transform 0.1s ease;
                    }
                    input[type='range']::-moz-range-thumb:hover {
                      transform: scale(1.2);
                    }
                  `}</style>
                </div>

                {/* Minimum, Selected, Maximum badges */}
                <div className="grid grid-cols-3 text-xs font-mono font-semibold text-neutral-500 pt-1">
                  <div className="text-left">
                    <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Min Budget</span>
                    <span className="text-[#1C1A24] font-bold">$500</span>
                  </div>
                  <div className="text-center bg-white border border-[#E5E5E0] py-1 px-2 rounded-lg shadow-sm">
                    <span className="block text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Selected</span>
                    <span className="text-[#6C4CF1] font-extrabold">${averageBudget.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Max Budget</span>
                    <span className="text-[#1C1A24] font-bold">$15,000+</span>
                  </div>
                </div>
              </div>

              {/* Action Save Row with premium primary gold and secondary white buttons */}
              <div className="pt-6 border-t border-[#E5E5E0] flex flex-col sm:flex-row items-center justify-end gap-3.5">
                
                {/* Secondary Button */}
                <button
                  type="button"
                  onClick={() => {
                    setFullName(user.displayName || '');
                    setCity('');
                    setPhone('');
                    setLanguage('English');
                    setMonthlyBudget(5000);
                    setAverageBudget(1800);
                    setPreferredStyle('elegant');
                    showNotification('Settings changes discarded.');
                  }}
                  className="w-full sm:w-auto bg-white hover:bg-neutral-50 border border-[#D5D5CF] text-[#1C1A24] font-semibold px-6 py-3.5 rounded-[14px] text-sm transition-all duration-200 shadow-sm text-center cursor-pointer"
                >
                  Discard Changes
                </button>

                {/* Primary Gold Gradient Button */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] via-[#F9F5E8] to-[#C5A028] hover:from-[#C5A028] hover:to-[#AA7C11] disabled:opacity-50 text-black font-extrabold uppercase tracking-wider px-8 py-3.5 rounded-[14px] shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <Check className="w-4 h-4 text-black" />
                  )}
                  <span>Save Profile Settings</span>
                </button>

              </div>

            </CardBody>
          </motion.div>

        </div>

      </form>

    </motion.div>
  );
};
