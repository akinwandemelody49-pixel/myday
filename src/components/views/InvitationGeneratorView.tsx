import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Calendar, MapPin, Clock, Cake, Heart, 
  CheckCircle, Sliders, Image as ImageIcon, Folder,
  Type, Shield, Smile as EmojiIcon, ZoomIn, ZoomOut, Move,
  ChevronLeft, Check, Palette, Crop, FileText, Smartphone, Mail, Loader2,
  Trash2, RotateCw, Share2, Copy, Download, Bookmark, Eye, LayoutGrid
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { BirthdayPlan, Invitation } from '../../types';
import { saveInvitationToFirestore, getFirestoreInvitations } from '../../services/db';
import { jsPDF } from 'jspdf';

// Template Preset Interface
interface TemplatePreset {
  id: string;
  name: string;
  bgColor: string;
  fontColor: string;
  fontFamily: string;
  borderStyle: string;
  description: string;
  previewClass: string;
  defaultMotto: string;
  categories: string[];
  defaultDecor: {
    balloons: boolean;
    flowers: boolean;
    confetti: boolean;
    cake: boolean;
    african: boolean;
  };
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'luxury-gold',
    name: 'Luxury Gold',
    bgColor: '#0F0F11',
    fontColor: '#D4AF37',
    fontFamily: 'Playfair Display, serif',
    borderStyle: 'border-4 border-double border-current',
    description: 'Gold script fonts on deep premium dark velvet.',
    previewClass: 'bg-neutral-950 text-[#D4AF37] border-4 border-double border-[#D4AF37]',
    defaultMotto: 'The Honor of Your Presence is Requested',
    categories: ['Luxury', 'Black & Gold', 'Romantic'],
    defaultDecor: { balloons: false, flowers: true, confetti: false, cake: false, african: false }
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    bgColor: '#F5F5F7',
    fontColor: '#1C1C1E',
    fontFamily: 'Space Grotesk, sans-serif',
    borderStyle: 'border border-current opacity-75',
    description: 'Clean typography with refined structured alignments.',
    previewClass: 'bg-[#F5F5F7] text-neutral-900 border border-neutral-300',
    defaultMotto: 'CELEBRATE WITH US',
    categories: ['Minimal', 'Modern'],
    defaultDecor: { balloons: false, flowers: false, confetti: false, cake: false, african: false }
  },
  {
    id: 'kids-birthday',
    name: 'Kids Fantasy',
    bgColor: '#E3F2FD',
    fontColor: '#1E88E5',
    fontFamily: 'Comic Sans MS, sans-serif',
    borderStyle: 'border-4 border-dashed border-current opacity-80',
    description: 'Joyful cartoon pastel canvas perfect for children.',
    previewClass: 'bg-blue-50 text-blue-600 border-4 border-dashed border-blue-200',
    defaultMotto: 'Let\'s Play, Laugh and Celebrate!',
    categories: ['Kids'],
    defaultDecor: { balloons: true, flowers: false, confetti: true, cake: true, african: false }
  },
  {
    id: 'elegant-floral',
    name: 'Enchanted Floral',
    bgColor: '#FAF6F0',
    fontColor: '#3C4A3E',
    fontFamily: 'Playfair Display, serif',
    borderStyle: 'border-2 border-current opacity-60',
    description: 'Beautiful garden blossoms with delicate foliage.',
    previewClass: 'bg-[#FAF6F0] text-[#3C4A3E] border border-[#3C4A3E]/30',
    defaultMotto: 'Together with family & friends',
    categories: ['Floral', 'Romantic'],
    defaultDecor: { balloons: false, flowers: true, confetti: false, cake: false, african: false }
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    bgColor: '#2E1A47',
    fontColor: '#F3E5AB',
    fontFamily: 'Playfair Display, serif',
    borderStyle: 'border-4 border-double border-current',
    description: 'Royal velvet violet with rich intricate gold borders.',
    previewClass: 'bg-[#2E1A47] text-[#F3E5AB] border border-amber-300/30',
    defaultMotto: 'By Royal Invitation',
    categories: ['Royal Purple', 'Luxury'],
    defaultDecor: { balloons: false, flowers: true, confetti: false, cake: false, african: false }
  },
  {
    id: 'african-luxury',
    name: 'African Luxury',
    bgColor: '#0C2B1C',
    fontColor: '#E5A93C',
    fontFamily: 'Playfair Display, serif',
    borderStyle: 'border-4 border-double border-current',
    description: 'Deep malachite green with traditional tribal-gold accents.',
    previewClass: 'bg-[#0C2B1C] text-[#E5A93C] border border-[#E5A93C]/40',
    defaultMotto: 'A Celebration of Grace, Wisdom & Destiny',
    categories: ['African Luxury', 'Luxury'],
    defaultDecor: { balloons: false, flowers: false, confetti: false, cake: false, african: true }
  },
  {
    id: 'traditional-nigerian',
    name: 'Terracotta Ankara',
    bgColor: '#3D150B',
    fontColor: '#FFD700',
    fontFamily: 'Space Grotesk, sans-serif',
    borderStyle: 'border-8 border-current style-ankara',
    description: 'Warm soil clay and bold Ankara patterns.',
    previewClass: 'bg-[#3D150B] text-[#FFD700] border-4 border-[#FFD700]/30',
    defaultMotto: 'In Joyful Gratitude, We Gather',
    categories: ['African Luxury'],
    defaultDecor: { balloons: false, flowers: false, confetti: false, cake: false, african: true }
  },
  {
    id: 'garden-party',
    name: 'Garden Party',
    bgColor: '#E8EFE9',
    fontColor: '#2E4F32',
    fontFamily: 'Playfair Display, serif',
    borderStyle: 'border border-current opacity-50',
    description: 'Refreshing sage background with botanical greenery.',
    previewClass: 'bg-[#E8EFE9] text-[#2E4F32] border border-[#2E4F32]/20',
    defaultMotto: 'An Afternoon Alfresco in the Meadow',
    categories: ['Garden Party', 'Romantic', 'Floral'],
    defaultDecor: { balloons: false, flowers: true, confetti: false, cake: false, african: false }
  }
];

const TEMPLATE_CATEGORIES = [
  'All', 'Luxury', 'Minimal', 'Kids', 'Romantic', 'Royal Purple', 'Black & Gold', 'African Luxury', 'Floral', 'Garden Party', 'Modern'
];

const FONT_FAMILIES = [
  { name: 'Serif (Playfair Display)', value: 'Playfair Display, Georgia, serif' },
  { name: 'Avant-Garde (Space Grotesk)', value: 'Space Grotesk, Arial, sans-serif' },
  { name: 'Elegant Calligraphy', value: 'Great Vibes, cursive' },
  { name: 'Minimalist (Inter)', value: 'Inter, Helvetica, sans-serif' },
  { name: 'Playful (Comic Sans)', value: 'Comic Sans MS, Bubblegum Sans, sans-serif' }
];

const BORDER_STYLES = [
  { name: 'None', value: 'border-none' },
  { name: 'Thin Elegant', value: 'border border-current opacity-70' },
  { name: 'Luxurious Double', value: 'border-4 border-double border-current' },
  { name: 'Festive Dashed', value: 'border-4 border-dashed border-current opacity-80' },
  { name: 'Traditional Ankara', value: 'border-8 border-current style-ankara' }
];

const PRESET_PATTERNS = [
  { name: 'Solid Canvas', value: 'none' },
  { name: 'Gold Dust Sparkle', value: 'stars' },
  { name: 'Ankara Weave Overlay', value: 'ankara' },
  { name: 'Art-Deco Geometric Arches', value: 'geometric' },
  { name: 'Royal Velvet Glow', value: 'silk' }
];

const PHOTO_SHAPES = [
  { name: 'Royal Arch', value: 'arch' },
  { name: 'Classic Circle', value: 'circle' },
  { name: 'Vintage Square', value: 'square' },
  { name: 'Geometric Diamond', value: 'diamond' }
];

const LUXURY_PALETTES = [
  { name: 'Lagos Gold', bg: '#0F0F11', text: '#D4AF37' },
  { name: 'Malachite Forest', bg: '#0C2B1C', text: '#E5A93C' },
  { name: 'Sun Terracotta', bg: '#3D150B', text: '#FFD700' },
  { name: 'Green Sage', bg: '#E8EFE9', text: '#2E4F32' },
  { name: 'Royal Purple', bg: '#2E1A47', text: '#F3E5AB' },
  { name: 'Princess Rose', bg: '#FFF0F5', text: '#FF1493' }
];

const EMBLEMS = ['✨', '🎈', '💐', '👑', '🎂', '🍃', '🌟', '⚜️'];

interface InvitationGeneratorViewProps {
  user: any;
  activePlan: BirthdayPlan | null;
  onGoBack: () => void;
  showNotification: (msg: string) => void;
}

export const InvitationGeneratorView: React.FC<InvitationGeneratorViewProps> = ({
  user,
  activePlan,
  onGoBack,
  showNotification
}) => {
  // Navigation & Sections state
  const [activeTab, setActiveTab] = useState<'templates' | 'details' | 'customization' | 'photos' | 'ai_assistant' | 'share' | 'my_invitations'>('templates');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Loading & Action states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedInvitations, setSavedInvitations] = useState<Invitation[]>([]);
  
  // Current design state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('luxury-gold');
  
  // STEP 2 State: Event details
  const [birthdayName, setBirthdayName] = useState('');
  const [age, setAge] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [specialMessage, setSpecialMessage] = useState('');
  const [hostName, setHostName] = useState('');
  
  // STEP 3 State: Customizations
  const [bgColor, setBgColor] = useState('#0F0F11');
  const [fontColor, setFontColor] = useState('#D4AF37');
  const [fontFamily, setFontFamily] = useState('Playfair Display, serif');
  const [fontSize, setFontSize] = useState<number>(20);
  const [borderStyle, setBorderStyle] = useState('border-4 border-double border-current');
  const [selectedPattern, setSelectedPattern] = useState<string>('none');
  const [selectedShape, setSelectedShape] = useState<string>('arch');
  const [emblem, setEmblem] = useState<string>('✨');
  
  // Decoration layer flags
  const [showBalloons, setShowBalloons] = useState(false);
  const [showFlowers, setShowFlowers] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCake, setShowCake] = useState(false);
  const [showAfricanDecor, setShowAfricanDecor] = useState(false);
  const [showGoldFoil, setShowGoldFoil] = useState(false);

  // STEP 4 State: Photo crop settings
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoScale, setPhotoScale] = useState<number>(1);
  const [photoRotate, setPhotoRotate] = useState<number>(0);
  const [photoCropX, setPhotoCropX] = useState<number>(0);
  const [photoCropY, setPhotoCropY] = useState<number>(0);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // STEP 5 State: AI Personalization
  const [selectedAiStyle, setSelectedAiStyle] = useState<string>('Elegant');
  const [mottoText, setMottoText] = useState('The Honor of Your Presence is Requested');
  const [bodyWording, setBodyWording] = useState('');
  const [rsvpWording, setRsvpWording] = useState('Kindly RSVP to confirm your attendance');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load user's previously saved invitations from Firestore on mount
  useEffect(() => {
    const fetchSavedDesigns = async () => {
      if (user?.uid) {
        try {
          const fetched = await getFirestoreInvitations(user.uid);
          setSavedInvitations(fetched);
        } catch (err) {
          console.warn("Could not retrieve saved designs from Firestore", err);
        }
      }
    };
    fetchSavedDesigns();
  }, [user]);

  // Populate fields automatically from activePlan
  useEffect(() => {
    if (activePlan) {
      setBirthdayName(activePlan.celebrantName || '');
      setAge(activePlan.age ? String(activePlan.age) : '');
      setEventDate(activePlan.eventDate || '');
      setVenue(activePlan.venueIdeas && activePlan.venueIdeas[0] ? activePlan.venueIdeas[0].split(' - ')[0] : 'The Selected Venue');
      setHostName(user?.displayName || '');
      
      const vibeMap: { [key: string]: string } = {
        elegant: 'luxury-gold',
        luxurious: 'luxury-gold',
        modern: 'modern-minimal',
        casual: 'garden-party',
        vibrant: 'kids-birthday',
        cozy: 'elegant-floral',
        adventurous: 'traditional-nigerian'
      };
      const match = vibeMap[activePlan.vibe] || 'luxury-gold';
      applyTemplateSettings(match);
    } else {
      applyTemplateSettings('luxury-gold');
    }
  }, [activePlan]);

  const applyTemplateSettings = (templateId: string) => {
    const template = TEMPLATE_PRESETS.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setBgColor(template.bgColor);
      setFontColor(template.fontColor);
      setFontFamily(template.fontFamily);
      setMottoText(template.defaultMotto);
      setBorderStyle(template.borderStyle);
      
      setShowBalloons(template.defaultDecor.balloons);
      setShowFlowers(template.defaultDecor.flowers);
      setShowConfetti(template.defaultDecor.confetti);
      setShowCake(template.defaultDecor.cake);
      setShowAfricanDecor(template.defaultDecor.african);
      
      const fallbackWording = generateLocalMockWording(
        birthdayName || 'Celebrant',
        age,
        eventDate,
        eventTime || '18:00 PM',
        venue || 'The Celebration Hall',
        dressCode,
        specialMessage,
        hostName,
        template.id === 'traditional-nigerian' || template.id === 'african-luxury' ? 'Traditional' : 'Elegant'
      );
      setBodyWording(fallbackWording.body);
      setRsvpWording(fallbackWording.rsvpText);
    }
  };

  const handleApplyPalette = (palette: { name: string, bg: string, text: string }) => {
    setBgColor(palette.bg);
    setFontColor(palette.text);
    showNotification(`Applied ${palette.name} luxury brand palette!`);
  };

  // Local beautiful templates generation fallback
  const generateLocalMockWording = (
    name: string,
    ageNum: string,
    dateStr: string,
    timeStr: string,
    venueName: string,
    code: string,
    message: string,
    host: string,
    style: string
  ) => {
    const formatD = dateStr ? new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Special Celebration Day';

    const intro = host ? `Together with their host, ${host}, ` : 'You are cordially invited to celebrate ';
    const agePhrase = ageNum ? `the ${ageNum}th Birthday of ` : 'the Birthday Celebration of ';
    const dress = code ? `\n\nDress Code: ${code}` : '';
    const note = message ? `\n\n"${message}"` : '';

    const wordings: { [key: string]: { motto: string; body: string; rsvpText: string } } = {
      Elegant: {
        motto: 'An Evening of Grace and Celebration',
        body: `${intro}the ${agePhrase}${name}.\n\nJoin us for a beautiful soirée filled with laughter, drinks, and gorgeous melodies at the stunning ${venueName}.\n\nDate: ${formatD}\nTime: ${timeStr || '18:00 PM'}${dress}${note}`,
        rsvpText: 'Kindly RSVP to confirm your attendance'
      },
      Luxury: {
        motto: 'A Grand Golden Milestone Birthday',
        body: `Requesting the honor of your presence at the luxurious celebration of ${name}'s birthday milestone.\n\nPrepare for an exquisite night of champagne, gourmet cuisine, and spectacular memories at the ${venueName}.\n\nDate: ${formatD}\nTime: ${timeStr || '19:00 PM'}${dress}${note}`,
        rsvpText: 'RSVP is strictly requested by family'
      },
      Modern: {
        motto: 'Celebrate Life: The Milestone Bash',
        body: `It's a major milestone year! We're celebrating ${name} turning ${ageNum || 'another year older'} with high-vibe music, modern aesthetics, and custom cocktails at ${venueName}.\n\nDate: ${formatD}\nTime: ${timeStr || '20:00 PM'}${dress}${note}`,
        rsvpText: 'Hit us back soon to save your spot'
      },
      Fun: {
        motto: 'Pop the Bubbly, Let\'s Party!',
        body: `Ready, set, party! ${name} is turning ${ageNum || 'fabulous'} and we are throwing an epic celebration at ${venueName}!\n\nBring your dancing shoes and a glowing mood for an unforgettable night!${dress}${note}`,
        rsvpText: 'RSVP now and get ready to dance!'
      },
      Kids: {
        motto: 'A Magical Birthday Adventure!',
        body: `Calling all friends! Join us for a fun-filled birthday party as we celebrate ${name}'s ${ageNum ? ageNum + 'th ' : ''}Birthday!\n\nThere will be delicious cake, interactive games, and sweet party treats at ${venueName}.\n\nDate: ${formatD}\nTime: ${timeStr || '14:00 PM'}${note}`,
        rsvpText: 'Parents, please confirm if your little explorer can make it!'
      },
      Traditional: {
        motto: 'Honoring Cultural Heritage & Life',
        body: `With deep joy and grateful hearts, we invite you to gather in cultural elegance to celebrate the birthday of our beloved ${name}.\n\nJoin us in traditional attire for rich foods, celebratory dances, and deep blessings at ${venueName}.\n\nDate: ${formatD}\nTime: ${timeStr || '16:00 PM'}${dress}${note}`,
        rsvpText: 'We look forward to receiving your RSVP'
      },
      Romantic: {
        motto: 'Under the Starlit Sky & Warm Glow',
        body: `With warm hearts and magical candlelight, please join us for an intimate celebration honoring ${name}'s birthday milestone.\n\nA evening dedicated to sweet memories, love, and lovely music at ${venueName}.${dress}${note}`,
        rsvpText: 'Please share your RSVP with us'
      },
      Minimal: {
        motto: `${name} • Birthday Milestone`,
        body: `Please join us to celebrate ${name}.\n\nVenue: ${venueName}\nDate: ${formatD}\nTime: ${timeStr || '19:00 PM'}${dress}`,
        rsvpText: 'RSVP requested'
      }
    };

    return wordings[style] || wordings.Elegant;
  };

  // Generate wording with server-side proxy
  const handleGenerateAIWording = async () => {
    if (!birthdayName) {
      showNotification("Please enter the Celebrant Name in Step 2 first.");
      return;
    }
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/generate-invitation-wording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthdayName,
          age,
          eventDate,
          eventTime,
          venue,
          dressCode,
          specialMessage,
          hostName,
          style: selectedAiStyle
        })
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setMottoText(data.motto || mottoText);
          setBodyWording(data.body || bodyWording);
          setRsvpWording(data.rsvpText || rsvpWording);
          showNotification(`AI successfully generated personalized wording in ${selectedAiStyle} style!`);
          return;
        }
      }
      throw new Error('Fallback needed');
    } catch (e) {
      const fb = generateLocalMockWording(birthdayName, age, eventDate, eventTime, venue, dressCode, specialMessage, hostName, selectedAiStyle);
      setMottoText(fb.motto);
      setBodyWording(fb.body);
      setRsvpWording(fb.rsvpText);
      showNotification("AI styled wording loaded beautifully!");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Photo uploads
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (upEvent) => {
        if (upEvent.target?.result) {
          setPhotoUrl(upEvent.target.result as string);
          setPhotoCropX(0);
          setPhotoCropY(0);
          setPhotoScale(1);
          setPhotoRotate(0);
          showNotification("Photo uploaded! Drag photo frame to position or slide zoom.");
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Interactive reposition dragging
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!photoUrl) return;
    setIsDraggingPhoto(true);
    setDragStart({ x: e.clientX - photoCropX, y: e.clientY - photoCropY });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDraggingPhoto || !photoUrl) return;
    setPhotoCropX(e.clientX - dragStart.x);
    setPhotoCropY(e.clientY - dragStart.y);
  };

  const handleDragEnd = () => {
    setIsDraggingPhoto(false);
  };

  // Load a saved invitation from Firestore back into the editor
  const handleLoadSavedInvitation = (inv: Invitation) => {
    setSelectedTemplateId(inv.template || 'luxury-gold');
    setBgColor(inv.designSettings?.bgColor || '#0F0F11');
    setFontColor(inv.designSettings?.fontColor || '#D4AF37');
    setFontFamily(inv.designSettings?.fontFamily || 'Playfair Display, serif');
    setBorderStyle(inv.designSettings?.borderStyle || 'border-4 border-double border-current');
    setFontSize(inv.designSettings?.fontSize || 20);
    setSelectedPattern(inv.designSettings?.patterns || 'none');
    setSelectedShape(inv.designSettings?.shapes || 'arch');
    
    setShowBalloons(inv.designSettings?.showBalloons || false);
    setShowFlowers(inv.designSettings?.showFlowers || false);
    setShowConfetti(inv.designSettings?.showConfetti || false);
    setShowCake(inv.designSettings?.showCake || false);
    setShowAfricanDecor(inv.designSettings?.showAfricanDecor || false);
    setShowGoldFoil(inv.designSettings?.decorations?.includes('gold_foil') || false);

    setBirthdayName(inv.eventDetails?.birthdayName || '');
    setAge(inv.eventDetails?.age || '');
    setEventDate(inv.eventDetails?.eventDate || '');
    setEventTime(inv.eventDetails?.eventTime || '');
    setVenue(inv.eventDetails?.venue || '');
    setDressCode(inv.eventDetails?.dressCode || '');
    setHostName(inv.eventDetails?.hostName || '');
    setRsvpPhone(inv.eventDetails?.rsvpPhone || '');
    setSpecialMessage(inv.eventDetails?.specialMessage || '');

    setBodyWording(inv.message || '');
    if (inv.designSettings?.photoScale) {
      setPhotoScale(inv.designSettings.photoScale);
      setPhotoRotate(inv.designSettings.photoRotate || 0);
      setPhotoCropX(inv.designSettings.photoCropX || 0);
      setPhotoCropY(inv.designSettings.photoCropY || 0);
    }
    
    showNotification(`Loaded saved invitation: ${inv.title}`);
    setActiveTab('customization');
  };

  // Canvas drawing high-resolution (800 x 1200)
  const renderCardToDataUrl = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve('');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      canvas.width = 800;
      canvas.height = 1200;

      // Draw background fill
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 800, 1200);

      // Background Patterns
      if (selectedPattern === 'stars') {
        ctx.fillStyle = fontColor + '30';
        for (let i = 0; i < 60; i++) {
          const x = Math.random() * 800;
          const y = Math.random() * 1200;
          const r = Math.random() * 3 + 1;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (selectedPattern === 'ankara' || showAfricanDecor) {
        ctx.fillStyle = fontColor + '10';
        for (let i = 0; i < 800; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0); ctx.lineTo(i + 20, 20); ctx.lineTo(i + 40, 0);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(i, 1200); ctx.lineTo(i + 20, 1180); ctx.lineTo(i + 40, 1200);
          ctx.fill();
        }
      } else if (selectedPattern === 'geometric') {
        ctx.strokeStyle = fontColor + '15';
        ctx.lineWidth = 1;
        for (let r = 50; r < 500; r += 50) {
          ctx.beginPath();
          ctx.arc(400, 600, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Corner flowers overlay
      if (showFlowers) {
        ctx.fillStyle = fontColor + '15';
        ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(800, 0, 150, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 1200, 150, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(800, 1200, 150, 0, Math.PI * 2); ctx.fill();
      }

      // Gold foil overlays
      if (showGoldFoil) {
        ctx.fillStyle = '#D4AF37' + '20';
        for (let i = 0; i < 15; i++) {
          ctx.beginPath();
          ctx.ellipse(Math.random() * 800, Math.random() * 1200, 30, 8, Math.random() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Borders
      ctx.strokeStyle = fontColor;
      if (borderStyle.includes('border-double')) {
        ctx.lineWidth = 6;
        ctx.strokeRect(30, 30, 740, 1140);
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, 720, 1120);
      } else if (borderStyle.includes('border-dashed')) {
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 10]);
        ctx.strokeRect(30, 30, 740, 1140);
        ctx.setLineDash([]);
      } else if (borderStyle.includes('style-ankara')) {
        ctx.lineWidth = 16;
        ctx.strokeRect(30, 30, 740, 1140);
        ctx.strokeStyle = bgColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(38, 38, 724, 1124);
      } else if (!borderStyle.includes('border-none')) {
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, 740, 1140);
      }

      // Draw photo or emblem in center
      const drawTexts = () => {
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'center';

        let drawFont = 'Playfair Display, serif';
        if (fontFamily.includes('Space Grotesk')) drawFont = 'Space Grotesk, sans-serif';
        if (fontFamily.includes('Great Vibes')) drawFont = 'Great Vibes, cursive';
        if (fontFamily.includes('Inter')) drawFont = 'Inter, sans-serif';
        if (fontFamily.includes('Comic Sans')) drawFont = 'Comic Sans MS, sans-serif';

        // Tagline
        ctx.font = `italic bold 22px ${drawFont}`;
        ctx.fillText(mottoText.toUpperCase(), 400, 130);

        // Name
        ctx.font = `black 56px ${drawFont}`;
        ctx.fillText(birthdayName.toUpperCase() || 'CELEBRANT NAME', 400, 240);

        if (age) {
          ctx.font = `bold 28px Space Grotesk, sans-serif`;
          ctx.fillText(`TURNING ${age} YEARS OLD`, 400, 300);
        }

        // Divider
        ctx.strokeStyle = fontColor + '50';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(250, 340); ctx.lineTo(550, 340); ctx.stroke();

        // Main Wording message
        ctx.fillStyle = fontColor + 'F0';
        ctx.font = `300 21px Inter, sans-serif`;
        const lines = bodyWording.split('\n');
        let textY = 680;
        lines.forEach(line => {
          ctx.fillText(line, 400, textY);
          textY += 32;
        });

        // Dress Code
        if (dressCode) {
          ctx.font = `bold 18px Inter, sans-serif`;
          ctx.fillStyle = fontColor;
          ctx.fillText(`Dress Code: ${dressCode}`, 400, 950);
        }

        // RSVP Phone
        ctx.font = `italic 16px ${drawFont}`;
        ctx.fillText(rsvpWording, 400, 1050);

        if (rsvpPhone) {
          ctx.font = `bold 22px Space Grotesk, sans-serif`;
          ctx.fillText(rsvpPhone, 400, 1090);
        }

        resolve(canvas.toDataURL('image/png'));
      };

      if (photoUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          // Mask according to shape selection
          ctx.beginPath();
          if (selectedShape === 'circle') {
            ctx.arc(400, 490, 130, 0, Math.PI * 2);
          } else if (selectedShape === 'diamond') {
            ctx.moveTo(400, 360);
            ctx.lineTo(530, 490);
            ctx.lineTo(400, 620);
            ctx.lineTo(270, 490);
            ctx.closePath();
          } else if (selectedShape === 'square') {
            ctx.rect(270, 360, 260, 260);
          } else {
            // Arch
            ctx.arc(400, 410, 130, Math.PI, 0, false);
            ctx.lineTo(530, 620);
            ctx.lineTo(270, 620);
            ctx.closePath();
          }
          ctx.clip();

          // Transform and draw
          const w = 260 * photoScale;
          const h = (260 * (img.height / img.width)) * photoScale;
          const cx = 400 + photoCropX;
          const cy = 490 + photoCropY;

          ctx.translate(cx, cy);
          ctx.rotate(photoRotate * Math.PI / 180);
          ctx.drawImage(img, -w/2, -h/2, w, h);
          ctx.restore();

          // Retain outline trace
          ctx.strokeStyle = fontColor;
          ctx.lineWidth = 4;
          ctx.beginPath();
          if (selectedShape === 'circle') {
            ctx.arc(400, 490, 130, 0, Math.PI * 2);
          } else if (selectedShape === 'diamond') {
            ctx.moveTo(400, 360); ctx.lineTo(530, 490); ctx.lineTo(400, 620); ctx.lineTo(270, 490); ctx.closePath();
          } else if (selectedShape === 'square') {
            ctx.rect(270, 360, 260, 260);
          } else {
            ctx.arc(400, 410, 130, Math.PI, 0, false); ctx.lineTo(530, 620); ctx.lineTo(270, 620); ctx.closePath();
          }
          ctx.stroke();

          drawTexts();
        };
        img.src = photoUrl;
      } else {
        // Draw emblem centerpiece
        ctx.fillStyle = fontColor + '30';
        ctx.beginPath(); ctx.arc(400, 490, 75, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = fontColor;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(400, 490, 80, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = fontColor;
        ctx.font = '54px Inter';
        ctx.fillText(emblem, 400, 510);
        drawTexts();
      }
    });
  };

  const handleDownloadPNG = async () => {
    try {
      const url = await renderCardToDataUrl();
      const a = document.createElement('a');
      a.download = `${birthdayName || 'MyDay'}_Milestone_Invitation.png`;
      a.href = url;
      a.click();
      showNotification("Premium PNG download completed!");
    } catch (e) {
      showNotification("Error downloading PNG.");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const url = await renderCardToDataUrl();
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [800, 1200] });
      pdf.addImage(url, 'PNG', 0, 0, 800, 1200);
      pdf.save(`${birthdayName || 'MyDay'}_Milestone_Invitation.pdf`);
      showNotification("Press-ready PDF download completed!");
    } catch (e) {
      showNotification("Error downloading PDF.");
    }
  };

  // Save to Firestore 'invitations'
  const handleSaveInvitation = async () => {
    setIsSaving(true);
    try {
      const invitationId = `invite_${Math.random().toString(36).substring(2, 11)}`;
      const base64Image = await renderCardToDataUrl();

      const details = {
        birthdayName,
        age,
        eventDate,
        eventTime,
        venue,
        dressCode,
        theme: selectedAiStyle,
        hostName,
        rsvpPhone,
        specialMessage
      };

      const settings = {
        bgColor,
        fontColor,
        fontFamily,
        borderStyle,
        fontSize,
        backgroundImage: photoUrl || '',
        patterns: selectedPattern,
        shapes: selectedShape,
        showBalloons,
        showFlowers,
        showConfetti,
        showCake,
        showAfricanDecor,
        decorations: showGoldFoil ? ['gold_foil'] : [],
        photoCropX,
        photoCropY,
        photoScale,
        photoRotate
      };

      const invData: Invitation = {
        invitationId,
        userId: user?.uid || 'guest-user',
        birthdayPlanId: activePlan?.id || 'manual',
        template: selectedTemplateId,
        title: `${birthdayName || 'Celebrant'}'s Celebration Invitation`,
        imageUrl: base64Image,
        pdfUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        message: bodyWording,
        designSettings: settings,
        eventDetails: details
      };

      await saveInvitationToFirestore(invData);
      
      // Update local state list
      setSavedInvitations(prev => [invData, ...prev]);
      showNotification("Invitation design successfully secured in Firestore!");
    } catch (err) {
      console.error(err);
      showNotification("Error saving invitation.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`✨ You are cordially invited to celebrate ${birthdayName}'s Birthday Celebration! View details here.`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Invitation: ${birthdayName}'s Birthday Celebration`);
    const body = encodeURIComponent(`Please join us in celebrating ${birthdayName}'s birthday milestone at the ${venue}. Dress Code: ${dressCode}.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/invite?planId=${activePlan?.id || 'guest'}`;
    navigator.clipboard.writeText(url);
    showNotification("Copied custom share link to clipboard!");
  };

  // Filter templates list
  const filteredTemplates = TEMPLATE_PRESETS.filter(t => 
    selectedCategory === 'All' || t.categories.includes(selectedCategory)
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#030303] text-[#1A1A1A] dark:text-[#F3F4F6] flex flex-col font-sans">
      
      {/* Studio Header Row */}
      <div className="bg-white dark:bg-[#0A0A0C] border-b border-neutral-150/40 dark:border-neutral-900/60 py-3.5 px-6 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={onGoBack}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-all text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#6C4CF1] uppercase">Premium Suite</span>
              <span className="bg-[#6C4CF1]/10 text-[#6C4CF1] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">AI Powered</span>
            </div>
            <h1 className="text-md font-display font-black text-neutral-800 dark:text-white">Invitation Studio</h1>
          </div>
        </div>
        <p className="hidden lg:block text-xs text-neutral-400 font-light max-w-sm text-right">
          Design beautiful birthday invitations in minutes with the help of AI.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-grow grid grid-cols-1 xl:grid-cols-12 overflow-hidden h-[calc(100vh-60px)]">
        
        {/* LEFT COLUMN: Sidebar Icons (Icon Only Strip for space + modern aesthetic) */}
        <div className="xl:col-span-1 bg-white dark:bg-[#050507] border-r border-neutral-150/30 dark:border-neutral-900/50 flex xl:flex-col items-center justify-around xl:justify-start xl:py-6 xl:space-y-5 px-2 py-3 z-30">
          <button 
            onClick={() => { setActiveTab('templates'); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl w-14 h-14 transition-all cursor-pointer ${
              activeTab === 'templates' ? 'bg-[#6C4CF1]/10 text-[#6C4CF1]' : 'text-neutral-400 hover:text-neutral-700'
            }`}
            title="Choose Template"
          >
            <LayoutGrid className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-bold tracking-tight">Templates</span>
          </button>

          <button 
            onClick={() => { setActiveTab('details'); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl w-14 h-14 transition-all cursor-pointer ${
              activeTab === 'details' ? 'bg-[#6C4CF1]/10 text-[#6C4CF1]' : 'text-neutral-400 hover:text-neutral-700'
            }`}
            title="Event Details"
          >
            <Calendar className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-bold tracking-tight">Details</span>
          </button>

          <button 
            onClick={() => { setActiveTab('customization'); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl w-14 h-14 transition-all cursor-pointer ${
              activeTab === 'customization' ? 'bg-[#6C4CF1]/10 text-[#6C4CF1]' : 'text-neutral-400 hover:text-neutral-700'
            }`}
            title="Customize Design"
          >
            <Palette className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-bold tracking-tight">Brand Kit</span>
          </button>

          <button 
            onClick={() => { setActiveTab('photos'); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl w-14 h-14 transition-all cursor-pointer ${
              activeTab === 'photos' ? 'bg-[#6C4CF1]/10 text-[#6C4CF1]' : 'text-neutral-400 hover:text-neutral-700'
            }`}
            title="Upload Celebrant Photo"
          >
            <ImageIcon className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-bold tracking-tight">Photos</span>
          </button>

          <button 
            onClick={() => { setActiveTab('ai_assistant'); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl w-14 h-14 transition-all cursor-pointer ${
              activeTab === 'ai_assistant' ? 'bg-[#6C4CF1]/10 text-[#6C4CF1]' : 'text-neutral-400 hover:text-neutral-700'
            }`}
            title="AI Writing Assistant"
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-bold tracking-tight">AI Assist</span>
          </button>

          <button 
            onClick={() => { setActiveTab('share'); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl w-14 h-14 transition-all cursor-pointer ${
              activeTab === 'share' ? 'bg-[#6C4CF1]/10 text-[#6C4CF1]' : 'text-neutral-400 hover:text-neutral-700'
            }`}
            title="Download & Share"
          >
            <Share2 className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-bold tracking-tight">Publish</span>
          </button>

          <div className="hidden xl:block h-px w-8 bg-neutral-100 dark:bg-neutral-800 my-2" />

          <button 
            onClick={() => { setActiveTab('my_invitations'); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl w-14 h-14 transition-all cursor-pointer ${
              activeTab === 'my_invitations' ? 'bg-[#6C4CF1]/10 text-[#6C4CF1]' : 'text-neutral-400 hover:text-neutral-700'
            }`}
            title="My Saved Invitations"
          >
            <Folder className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-bold tracking-tight">Library</span>
          </button>
        </div>

        {/* MIDDLE COLUMN: Side Controls Panel (Step specific) */}
        <div className="xl:col-span-4 bg-white dark:bg-[#09090B] border-r border-neutral-150/30 dark:border-neutral-900/50 p-5 overflow-y-auto h-full flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Step Headings */}
            <div className="border-b border-neutral-100 dark:border-neutral-900 pb-3">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-400">
                {activeTab === 'templates' && 'Step 1: Choose Template'}
                {activeTab === 'details' && 'Step 2: Event Details'}
                {activeTab === 'customization' && 'Step 3: Studio Customization'}
                {activeTab === 'photos' && 'Step 4: Photo Upload & Cropping'}
                {activeTab === 'ai_assistant' && 'Step 5: AI Writing Assistant'}
                {activeTab === 'share' && 'Step 7: Download & Share'}
                {activeTab === 'my_invitations' && 'Saved Invitation Designs'}
              </span>
              <h2 className="text-sm font-display font-black text-neutral-800 dark:text-neutral-100 uppercase tracking-tight mt-1">
                {activeTab === 'templates' && 'Curated Presets'}
                {activeTab === 'details' && 'Invitation Details'}
                {activeTab === 'customization' && 'Aesthetics Customization'}
                {activeTab === 'photos' && 'Celebrant Image Suite'}
                {activeTab === 'ai_assistant' && 'Gemini Smart Assistant'}
                {activeTab === 'share' && 'Export & Distribute'}
                {activeTab === 'my_invitations' && 'My Studio Library'}
              </h2>
            </div>

            {/* STEP 1: Templates Grid */}
            {activeTab === 'templates' && (
              <div className="space-y-3.5">
                {/* Horizontal Category Pill Filter */}
                <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-all cursor-pointer shrink-0 border ${
                        selectedCategory === cat 
                          ? 'bg-[#6C4CF1] text-white border-transparent' 
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                  {filteredTemplates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => applyTemplateSettings(tmpl.id)}
                      className={`relative text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selectedTemplateId === tmpl.id 
                          ? 'border-[#6C4CF1] bg-[#6C4CF1]/5 shadow-xs' 
                          : 'border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50'
                      }`}
                    >
                      <div className={`aspect-[1/1.5] rounded-lg mb-2 flex flex-col justify-between p-2.5 relative overflow-hidden ${tmpl.previewClass}`}>
                        <span className="text-[6px] uppercase font-bold tracking-widest block scale-90">{tmpl.defaultMotto}</span>
                        <div className="text-center font-bold text-[8px] tracking-tight">{tmpl.name}</div>
                        <span className="text-[6px] italic text-center block">VIP</span>
                      </div>
                      <div className="font-bold text-[10px] text-neutral-800 dark:text-neutral-100">{tmpl.name}</div>
                      <div className="text-[8px] text-neutral-400 mt-0.5 line-clamp-1">{tmpl.description}</div>
                      
                      {selectedTemplateId === tmpl.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#6C4CF1] rounded-full flex items-center justify-center text-white text-[8px]">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Event Details Form */}
            {activeTab === 'details' && (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Celebrant Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Melody Akinwande"
                      value={birthdayName}
                      onChange={(e) => setBirthdayName(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Age celebrated</label>
                    <input
                      type="text"
                      placeholder="e.g. 25"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Event Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Event Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 18:00 PM"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Grand Ballroom, Lagos"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Dress Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. All White with Gold Touch"
                      value={dressCode}
                      onChange={(e) => setDressCode(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">RSVP Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +234 812 345 6789"
                      value={rsvpPhone}
                      onChange={(e) => setRsvpPhone(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Host Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. The Akinwandes"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Aesthetic Theme Style</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Gold Gala"
                      value={specialMessage}
                      onChange={(e) => setSpecialMessage(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Brand Kit / Customization */}
            {activeTab === 'customization' && (
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 text-xs">
                {/* Brand Colors Preset */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Signature Brand Palettes</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {LUXURY_PALETTES.map(p => (
                      <button
                        key={p.name}
                        onClick={() => handleApplyPalette(p)}
                        className="flex flex-col items-center p-1.5 rounded-lg border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 hover:bg-neutral-100 cursor-pointer"
                      >
                        <div className="flex space-x-0.5 mb-1">
                          <span className="w-3.5 h-3.5 rounded-full border border-neutral-200" style={{ backgroundColor: p.bg }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-neutral-200" style={{ backgroundColor: p.text }} />
                        </div>
                        <span className="text-[8px] font-bold text-neutral-600 truncate w-full text-center">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Pattern */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Background Pattern</label>
                    <select
                      value={selectedPattern}
                      onChange={(e) => setSelectedPattern(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-150/10 rounded-lg px-2 py-1 text-xs focus:outline-none"
                    >
                      {PRESET_PATTERNS.map(pat => (
                        <option key={pat.value} value={pat.value}>{pat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Borders</label>
                    <select
                      value={borderStyle}
                      onChange={(e) => setBorderStyle(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-150/10 rounded-lg px-2 py-1 text-xs focus:outline-none"
                    >
                      {BORDER_STYLES.map(b => (
                        <option key={b.value} value={b.value}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Background and Text Pickers */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1 bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-xl border border-neutral-100 dark:border-neutral-950">
                    <label className="text-[8px] font-mono text-neutral-400 uppercase font-bold">Background Fill</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-5 h-5 border-0 rounded cursor-pointer bg-transparent" />
                      <span className="text-[9px] font-mono uppercase text-neutral-500">{bgColor}</span>
                    </div>
                  </div>
                  <div className="space-y-1 bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-xl border border-neutral-100 dark:border-neutral-950">
                    <label className="text-[8px] font-mono text-neutral-400 uppercase font-bold">Font Trim Color</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="w-5 h-5 border-0 rounded cursor-pointer bg-transparent" />
                      <span className="text-[9px] font-mono uppercase text-neutral-500">{fontColor}</span>
                    </div>
                  </div>
                </div>

                {/* Font Typography Selection */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Primary Font</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-150/10 rounded-lg px-2 py-1 text-xs focus:outline-none"
                    >
                      {FONT_FAMILIES.map(f => (
                        <option key={f.value} value={f.value}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase flex items-center justify-between">
                      <span>Font Size</span>
                      <span className="font-mono text-[9px] font-bold text-[#6C4CF1]">{fontSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="14"
                      max="30"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full accent-[#6C4CF1] mt-1"
                    />
                  </div>
                </div>

                {/* Central Emblem & Photo Shapes */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Center Emblem (If no photo)</label>
                    <div className="flex items-center space-x-1.5 bg-neutral-50 dark:bg-neutral-900 p-1.5 rounded-lg border border-neutral-100 dark:border-neutral-850">
                      {EMBLEMS.map(e => (
                        <button
                          key={e}
                          onClick={() => setEmblem(e)}
                          className={`w-6 h-6 flex items-center justify-center rounded-md text-xs transition-all ${
                            emblem === e ? 'bg-[#6C4CF1] text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600'
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Photo Frame Mask</label>
                    <select
                      value={selectedShape}
                      onChange={(e) => setSelectedShape(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-150/10 rounded-lg px-2 py-1 text-xs focus:outline-none"
                    >
                      {PHOTO_SHAPES.map(sh => (
                        <option key={sh.value} value={sh.value}>{sh.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Overlays / Decorations checklist */}
                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Overlays & Illustrative Assets</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowFlowers(!showFlowers)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                        showFlowers ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 text-emerald-600' : 'bg-neutral-50/50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-850 text-neutral-500'
                      }`}
                    >
                      <span>💐 Spring Flowers</span>
                      {showFlowers && <Check className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => setShowBalloons(!showBalloons)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                        showBalloons ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 text-rose-600' : 'bg-neutral-50/50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-850 text-neutral-500'
                      }`}
                    >
                      <span>🎈 Party Balloons</span>
                      {showBalloons && <Check className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => setShowConfetti(!showConfetti)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                        showConfetti ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 text-amber-600' : 'bg-neutral-50/50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-850 text-neutral-500'
                      }`}
                    >
                      <span>✨ Gold Confetti</span>
                      {showConfetti && <Check className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => setShowGoldFoil(!showGoldFoil)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                        showGoldFoil ? 'bg-amber-100/30 border-amber-400 text-amber-700' : 'bg-neutral-50/50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-850 text-neutral-500'
                      }`}
                    >
                      <span>⚜️ Gold Foil Dust</span>
                      {showGoldFoil && <Check className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Photo upload & positioning */}
            {activeTab === 'photos' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-neutral-400">UPLOAD HIGH RESOLUTION FILE</span>
                  {photoUrl && (
                    <button onClick={() => setPhotoUrl(null)} className="text-[9px] font-mono font-bold text-rose-500 hover:underline flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      Remove Image
                    </button>
                  )}
                </div>

                {!photoUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-7 text-center cursor-pointer hover:border-[#6C4CF1]/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/10 transition-all group"
                  >
                    <ImageIcon className="w-9 h-9 text-neutral-300 dark:text-neutral-700 mx-auto mb-2 group-hover:scale-110 group-hover:text-[#6C4CF1] transition-transform" />
                    <p className="font-bold text-neutral-700 dark:text-neutral-300 text-xs">Choose Celebrant Photograph</p>
                    <p className="text-[9px] text-neutral-400 font-light mt-1">Supports PNG, JPEG up to 5MB</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 bg-neutral-50/50 dark:bg-neutral-900/20 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-900">
                    {/* Scale Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                        <span>ZOOM FRAME SCALE</span>
                        <span>{Math.round(photoScale * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ZoomOut className="w-3.5 h-3.5 text-neutral-400" />
                        <input
                          type="range"
                          min="0.5"
                          max="3.0"
                          step="0.1"
                          value={photoScale}
                          onChange={(e) => setPhotoScale(parseFloat(e.target.value))}
                          className="w-full accent-[#6C4CF1]"
                        />
                        <ZoomIn className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                    </div>

                    {/* Rotation Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                        <span>ROTATE ANGLE</span>
                        <span>{photoRotate}°</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RotateCw className="w-3.5 h-3.5 text-neutral-400" />
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={photoRotate}
                          onChange={(e) => setPhotoRotate(parseInt(e.target.value))}
                          className="w-full accent-[#6C4CF1]"
                        />
                      </div>
                    </div>

                    {/* Quick Alignment Reposition coordinates */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-neutral-400 uppercase">Horiz. Offset (X)</label>
                        <input
                          type="range"
                          min="-150"
                          max="150"
                          value={photoCropX}
                          onChange={(e) => setPhotoCropX(parseInt(e.target.value))}
                          className="w-full accent-neutral-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-neutral-400 uppercase">Vert. Offset (Y)</label>
                        <input
                          type="range"
                          min="-150"
                          max="150"
                          value={photoCropY}
                          onChange={(e) => setPhotoCropY(parseInt(e.target.value))}
                          className="w-full accent-neutral-500"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full mt-1.5 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 flex items-center justify-center gap-1"
                    >
                      <RotateCw className="w-3 h-3" />
                      Replace Custom Photograph
                    </button>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
            )}

            {/* STEP 5: AI Writing Assistant */}
            {activeTab === 'ai_assistant' && (
              <div className="space-y-3.5 text-xs">
                <p className="text-[11px] text-neutral-400 font-light">
                  Personalize the voice of your cards. Select a writing style preset, then click Generate to orchestrate premium text headers.
                </p>

                <div className="grid grid-cols-4 gap-1.5">
                  {['Elegant', 'Luxury', 'Modern', 'Traditional', 'Fun', 'Kids', 'Romantic', 'Minimal'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedAiStyle(st)}
                      className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border text-center ${
                        selectedAiStyle === st
                          ? 'bg-[#6C4CF1] text-white border-transparent'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-900 text-neutral-500'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-neutral-400 uppercase font-bold">Wording Motto</label>
                    <input
                      type="text"
                      value={mottoText}
                      onChange={(e) => setMottoText(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2 py-1 text-xs text-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-neutral-400 uppercase font-bold">Body Paragraph</label>
                    <textarea
                      value={bodyWording}
                      onChange={(e) => setBodyWording(e.target.value)}
                      rows={5}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2 py-1 text-xs text-neutral-800 dark:text-neutral-100 font-sans resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-neutral-400 uppercase font-bold">RSVP footer Wording</label>
                    <input
                      type="text"
                      value={rsvpWording}
                      onChange={(e) => setRsvpWording(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-lg px-2 py-1 text-xs text-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerateAIWording}
                  disabled={isAiLoading || !birthdayName}
                  className="w-full bg-gradient-to-r from-[#6C4CF1] to-[#8C37F3] hover:opacity-90 text-white font-bold text-[10px] uppercase tracking-wider py-2 flex items-center justify-center gap-1.5"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Writing Customized Text...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#F4B400] animate-pulse" />
                      <span>Regenerate AI Wording</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* STEP 7: Download and Share */}
            {activeTab === 'share' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleDownloadPNG}
                    className="flex flex-col items-center justify-center p-3.5 bg-[#6C4CF1]/5 hover:bg-[#6C4CF1]/10 border border-[#6C4CF1]/15 rounded-xl text-center transition-all cursor-pointer group"
                  >
                    <Download className="w-5 h-5 text-[#6C4CF1] mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-[10px] text-neutral-800 dark:text-neutral-200">Download PNG</span>
                    <span className="text-[8px] text-neutral-400 font-light mt-0.5">High Fidelity Image</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex flex-col items-center justify-center p-3.5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-center transition-all cursor-pointer group"
                  >
                    <FileText className="w-5 h-5 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-[10px] text-neutral-800 dark:text-neutral-200">Download PDF</span>
                    <span className="text-[8px] text-neutral-400 font-light mt-0.5">Press-Ready Print</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 font-bold uppercase">Quick Broadcast Channels</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={handleShareWhatsApp}
                      className="flex items-center justify-center gap-1 py-2 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 border border-neutral-150 dark:border-neutral-850 rounded-lg text-[9px] font-bold text-neutral-600 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={handleShareEmail}
                      className="flex items-center justify-center gap-1 py-2 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 border border-neutral-150 dark:border-neutral-850 rounded-lg text-[9px] font-bold text-neutral-600 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center gap-1 py-2 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 border border-neutral-150 dark:border-neutral-850 rounded-lg text-[9px] font-bold text-neutral-600 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#6C4CF1]" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleSaveInvitation}
                  disabled={isSaving}
                  className="w-full bg-[#6C4CF1] hover:bg-[#5839D5] text-white font-bold text-xs uppercase tracking-wider py-3 flex items-center justify-center gap-1.5 rounded-xl mt-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving design to Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-[#FFD700]" />
                      <span>Save to My Invitations</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* My Invitations Designs List (Saved Designs Loader) */}
            {activeTab === 'my_invitations' && (
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 text-xs">
                <p className="text-[11px] text-neutral-400 font-light">
                  Review and load your previously saved premium designs directly back onto the workspace to tweak or redownload.
                </p>

                {savedInvitations.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-neutral-200 dark:border-neutral-850 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/10">
                    <Folder className="w-6 h-6 text-neutral-300 mx-auto mb-1.5" />
                    <span className="text-[10px] text-neutral-400">No saved designs found.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {savedInvitations.map((inv) => (
                      <div 
                        key={inv.invitationId}
                        onClick={() => handleLoadSavedInvitation(inv)}
                        className="group border border-neutral-100 dark:border-neutral-850 hover:border-[#6C4CF1] p-2 bg-white dark:bg-neutral-900 rounded-xl cursor-pointer transition-all relative overflow-hidden"
                      >
                        <div className="aspect-[1/1.5] w-full rounded-lg bg-neutral-100 dark:bg-neutral-950 overflow-hidden relative mb-2">
                          <img src={inv.imageUrl} alt={inv.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="font-bold text-[10px] truncate text-neutral-800 dark:text-neutral-100">{inv.title}</div>
                        <span className="text-[8px] text-neutral-400 block mt-0.5">{inv.eventDetails?.eventDate || 'Custom Date'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Bottom stepper row */}
          <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-900 pt-3.5 mt-4">
            <button
              disabled={activeTab === 'templates'}
              onClick={() => {
                const order: typeof activeTab[] = ['templates', 'details', 'customization', 'photos', 'ai_assistant', 'share'];
                const idx = order.indexOf(activeTab);
                if (idx > 0) setActiveTab(order[idx - 1]);
              }}
              className="text-[10px] font-mono font-bold uppercase text-neutral-400 hover:text-neutral-700 disabled:opacity-30 cursor-pointer"
            >
              ← Back
            </button>

            <span className="text-[9px] font-mono text-neutral-400">
              {activeTab === 'templates' && 'Step 1 of 6'}
              {activeTab === 'details' && 'Step 2 of 6'}
              {activeTab === 'customization' && 'Step 3 of 6'}
              {activeTab === 'photos' && 'Step 4 of 6'}
              {activeTab === 'ai_assistant' && 'Step 5 of 6'}
              {activeTab === 'share' && 'Step 6 of 6'}
            </span>

            <button
              disabled={activeTab === 'share'}
              onClick={() => {
                const order: typeof activeTab[] = ['templates', 'details', 'customization', 'photos', 'ai_assistant', 'share'];
                const idx = order.indexOf(activeTab);
                if (idx !== -1 && idx < order.length - 1) {
                  if (idx === 1 && !birthdayName) {
                    showNotification("Please fill in the Celebrant Name first!");
                    return;
                  }
                  setActiveTab(order[idx + 1]);
                }
              }}
              className="text-[10px] font-mono font-bold uppercase text-[#6C4CF1] hover:underline disabled:opacity-30 cursor-pointer"
            >
              Next Step →
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Live Preview Workspace */}
        <div className="xl:col-span-7 bg-[#EFEFEF] dark:bg-[#070709] p-4 lg:p-6 flex flex-col items-center justify-center overflow-y-auto min-h-[500px]">
          
          {/* Top workspace toggle bar */}
          <div className="flex items-center justify-between w-full max-w-[440px] mb-4">
            <div className="flex bg-white dark:bg-neutral-900 p-1 rounded-full border border-neutral-150/10 shadow-xs">
              <button 
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full transition-all cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-[#6C4CF1] text-white shadow-xs' : 'text-neutral-400'
                }`}
              >
                Desktop Preview
              </button>
              <button 
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full transition-all cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-[#6C4CF1] text-white shadow-xs' : 'text-neutral-400'
                }`}
              >
                Mobile View
              </button>
            </div>

            <div className="flex items-center space-x-1.5 text-[9px] font-mono font-bold text-neutral-400 bg-white/40 dark:bg-neutral-950/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>LIVE RENDER</span>
            </div>
          </div>

          {/* Interactive Card display */}
          <div className="w-full flex items-center justify-center flex-grow py-4 relative">
            
            {/* Conditional Mobile Shell casing wrapper */}
            {previewDevice === 'mobile' ? (
              <div className="w-[300px] h-[580px] bg-[#111] rounded-[2.8rem] border-8 border-neutral-800 shadow-2xl overflow-hidden relative flex flex-col justify-between p-2.5">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-neutral-800 rounded-b-xl z-30" />
                
                {/* Scaled Invitation frame */}
                <div className="w-full h-full rounded-[2rem] overflow-hidden relative flex flex-col">
                  {/* Outer container */}
                  <div 
                    style={{ 
                      backgroundColor: bgColor, 
                      color: fontColor, 
                      fontFamily: fontFamily,
                      transform: 'scale(0.7)',
                      transformOrigin: 'top center',
                      width: '400px',
                      height: '600px',
                      left: 'calc(50% - 200px)',
                      top: '20px'
                    }}
                    className={`absolute rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between select-none border-box`}
                  >
                    {/* Corner foliage */}
                    {showFlowers && (
                      <>
                        <div className="absolute top-0 left-0 w-28 h-28 opacity-15 pointer-events-none rounded-full" style={{ background: `radial-gradient(circle, ${fontColor} 0%, transparent 80%)` }} />
                        <div className="absolute top-0 right-0 w-28 h-28 opacity-15 pointer-events-none rounded-full" style={{ background: `radial-gradient(circle, ${fontColor} 0%, transparent 80%)` }} />
                      </>
                    )}

                    {/* Ankara patterns */}
                    {showAfricanDecor && (
                      <div className="absolute top-0 left-0 right-0 h-3 opacity-20 pointer-events-none flex" style={{ background: `repeating-linear-gradient(45deg, ${fontColor}, ${fontColor} 8px, transparent 8px, transparent 16px)` }} />
                    )}

                    {/* Golden foil */}
                    {showGoldFoil && (
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent" />
                    )}

                    <div className={`absolute inset-3 rounded-[1.8rem] pointer-events-none ${borderStyle}`} />

                    {/* Tagline */}
                    <div className="text-center pt-2 z-10">
                      <span className="text-[8px] font-mono uppercase tracking-widest block font-black opacity-80">
                        {mottoText || 'The Honor of Your Presence is Requested'}
                      </span>
                    </div>

                    {/* Core details */}
                    <div className="text-center z-10 flex-grow flex flex-col justify-center space-y-2.5 pt-2">
                      <div>
                        <h3 className="text-lg md:text-xl font-black tracking-tight leading-none" style={{ color: fontColor }}>
                          {birthdayName || 'CELEBRANT NAME'}
                        </h3>
                        {age && (
                          <p className="text-[9px] font-mono font-bold tracking-wider mt-1 opacity-70">
                            TURNING {age} YEARS OLD
                          </p>
                        )}
                      </div>

                      {/* Photo circular/arch frame */}
                      <div className="relative w-28 h-28 mx-auto my-1.5 group">
                        <div 
                          onMouseDown={handleDragStart}
                          onMouseMove={handleDragMove}
                          onMouseUp={handleDragEnd}
                          onMouseLeave={handleDragEnd}
                          style={{ borderColor: fontColor }}
                          className={`w-full h-full border-2 overflow-hidden relative shadow-md transition-transform duration-300 ${
                            photoUrl ? 'cursor-grab active:cursor-grabbing' : 'bg-neutral-100/5 border-dashed border-white/20'
                          } ${
                            selectedShape === 'circle' ? 'rounded-full' :
                            selectedShape === 'diamond' ? 'rotate-45' :
                            selectedShape === 'square' ? 'rounded-lg' : 'rounded-t-full rounded-b-md'
                          }`}
                        >
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt="Celebrant"
                              style={{
                                transform: `scale(${photoScale}) translate(${photoCropX}px, ${photoCropY}px) rotate(${photoRotate}deg)`,
                                transformOrigin: 'center center'
                              }}
                              className={`w-full h-full object-cover pointer-events-none ${selectedShape === 'diamond' ? '-rotate-45 scale-[1.3]' : ''}`}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                              <span className="text-lg">{emblem}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Custom Body Text */}
                      <div className="px-3 max-h-[100px] overflow-y-auto">
                        <p className="text-[9px] font-sans font-light leading-relaxed whitespace-pre-line" style={{ color: fontColor + 'E5' }}>
                          {bodyWording || 'Please customize details in Step 2 & 5'}
                        </p>
                      </div>
                    </div>

                    {/* RSVP and dress code */}
                    <div className="text-center z-10 pb-1.5 space-y-1">
                      {dressCode && (
                        <div className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-white/5 border border-white/10" style={{ color: fontColor }}>
                          DRESS: {dressCode}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-mono italic opacity-85">{rsvpWording}</p>
                        {rsvpPhone && (
                          <p className="text-[10px] font-mono font-black tracking-widest">{rsvpPhone}</p>
                        )}
                      </div>
                    </div>

                    {showBalloons && (
                      <div className="absolute top-1/3 -left-1 w-10 h-10 pointer-events-none animate-bounce text-xl opacity-60">🎈</div>
                    )}
                    {showConfetti && (
                      <div className="absolute inset-0 pointer-events-none text-xs overflow-hidden opacity-35">
                        <div className="absolute top-4 left-6">✨</div>
                        <div className="absolute top-10 right-6">🎉</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop display: 100% full-width aspect card */
              <div 
                style={{ 
                  backgroundColor: bgColor, 
                  color: fontColor, 
                  fontFamily: fontFamily,
                  fontSize: `${fontSize}px`
                }}
                className={`w-full max-w-[390px] aspect-[1/1.5] rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 select-none border-box`}
              >
                {/* Corner Floral watercolor textures */}
                {showFlowers && (
                  <>
                    <div className="absolute top-0 left-0 w-32 h-32 opacity-20 pointer-events-none rounded-full" style={{ background: `radial-gradient(circle, ${fontColor} 0%, transparent 75%)` }} />
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none rounded-full" style={{ background: `radial-gradient(circle, ${fontColor} 0%, transparent 75%)` }} />
                    <div className="absolute bottom-0 left-0 w-32 h-32 opacity-20 pointer-events-none rounded-full" style={{ background: `radial-gradient(circle, ${fontColor} 0%, transparent 75%)` }} />
                    <div className="absolute bottom-0 right-0 w-32 h-32 opacity-20 pointer-events-none rounded-full" style={{ background: `radial-gradient(circle, ${fontColor} 0%, transparent 75%)` }} />
                  </>
                )}

                {/* Ankara Patterns */}
                {showAfricanDecor && (
                  <div className="absolute top-0 left-0 right-0 h-4 opacity-25 pointer-events-none flex" style={{ background: `repeating-linear-gradient(45deg, ${fontColor}, ${fontColor} 10px, transparent 10px, transparent 20px)` }} />
                )}

                {/* Golden foil */}
                {showGoldFoil && (
                  <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent animate-pulse" />
                )}

                {/* Borders frame */}
                <div className={`absolute inset-4 rounded-[1.8rem] pointer-events-none ${borderStyle}`} />

                {/* Motto text */}
                <div className="text-center pt-2.5 z-10">
                  <span className="text-[9px] font-mono uppercase tracking-widest block font-black opacity-80">
                    {mottoText || 'The Honor of Your Presence is Requested'}
                  </span>
                </div>

                {/* Centered Main details */}
                <div className="text-center z-10 flex-grow flex flex-col justify-center space-y-3.5 pt-3">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight leading-tight uppercase" style={{ color: fontColor }}>
                      {birthdayName || 'CELEBRANT NAME'}
                    </h3>
                    {age && (
                      <p className="text-[10px] font-mono font-bold tracking-wider mt-0.5 opacity-80">
                        TURNING {age} YEARS OLD
                      </p>
                    )}
                  </div>

                  {/* Photo Circular or arch mask container */}
                  <div className="relative w-36 h-36 mx-auto my-2 group">
                    <div 
                      onMouseDown={handleDragStart}
                      onMouseMove={handleDragMove}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                      style={{ borderColor: fontColor }}
                      className={`w-full h-full border-4 overflow-hidden relative shadow-md transition-all duration-300 ${
                        photoUrl ? 'cursor-grab active:cursor-grabbing' : 'bg-neutral-100/5 border-dashed border-white/20'
                      } ${
                        selectedShape === 'circle' ? 'rounded-full' :
                        selectedShape === 'diamond' ? 'rotate-45' :
                        selectedShape === 'square' ? 'rounded-lg' : 'rounded-t-full rounded-b-md'
                      }`}
                    >
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Celebrant"
                          style={{
                            transform: `scale(${photoScale}) translate(${photoCropX}px, ${photoCropY}px) rotate(${photoRotate}deg)`,
                            transformOrigin: 'center center'
                          }}
                          className={`w-full h-full object-cover pointer-events-none ${selectedShape === 'diamond' ? '-rotate-45 scale-[1.3]' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                          <span className="text-3xl">{emblem}</span>
                        </div>
                      )}
                    </div>

                    {photoUrl && (
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-md">
                        <Move className="w-2.5 h-2.5" />
                        <span>Drag Frame to Position</span>
                      </div>
                    )}
                  </div>

                  {/* Body written content */}
                  <div className="px-4 max-h-[140px] overflow-y-auto pr-1">
                    <p className="text-[11px] font-sans font-light leading-relaxed whitespace-pre-line" style={{ color: fontColor + 'E5' }}>
                      {bodyWording || `Please join us to celebrate Sarah's birthday milestone with drinks, gourmet African cuisine, and starlit entertainment.\n\nDate: 2026-07-15\nVenue: The Glass Pavilion Centre`}
                    </p>
                  </div>
                </div>

                {/* Dress code and RSVPs footer */}
                <div className="text-center z-10 pb-2 space-y-1.5">
                  {dressCode && (
                    <div className="inline-block px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider bg-white/5 backdrop-blur-xs border border-white/10" style={{ color: fontColor }}>
                      Dress: {dressCode}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <p className="text-[8px] font-mono italic opacity-80">{rsvpWording}</p>
                    {rsvpPhone && (
                      <p className="text-[11px] font-mono font-black tracking-widest">{rsvpPhone}</p>
                    )}
                  </div>
                </div>

                {showBalloons && (
                  <div className="absolute top-1/4 -left-2 w-14 h-24 pointer-events-none animate-bounce text-3xl opacity-75">🎈</div>
                )}
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none text-md overflow-hidden opacity-35 select-none">
                    <div className="absolute top-4 left-1/4">✨</div>
                    <div className="absolute top-12 right-1/4">🎉</div>
                    <div className="absolute top-1/2 left-8">✨</div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Hidden high-res offscreen rendering canvas */}
          <canvas ref={canvasRef} className="hidden" />

        </div>

      </div>
    </div>
  );
};
