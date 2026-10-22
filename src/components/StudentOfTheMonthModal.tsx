'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Student } from '@/types';
import { 
  X, Download, Printer, Sparkles, Star, Trophy, Award, 
  RefreshCw, Check, Search, Image as ImageIcon,
  RotateCcw, Eye, ShieldCheck, ChevronRight, Layers,
  BookOpen, Clock, UserCheck, MessageSquare, Globe, Brain, Calculator, Edit3
} from 'lucide-react';
import { getStudentClassArm } from '@/lib/classUtils';

export interface AwardRoleConfig {
  id: string;
  defaultTitle: string;
  femaleTitle?: string;
  arabicTitle: string;
  iconName: string;
  badgeColor: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  photoUrl: string;
}

export const OFFICIAL_ROLES: Omit<AwardRoleConfig, 'studentId' | 'studentName' | 'studentClass' | 'photoUrl'>[] = [
  {
    id: 'quran',
    defaultTitle: "QUR'AN AMBASSADOR",
    arabicTitle: 'سفير القرآن',
    iconName: 'book',
    badgeColor: '#059669', // Emerald
  },
  {
    id: 'model',
    defaultTitle: 'MODEL AMBASSADOR',
    arabicTitle: 'سفير مثالي',
    iconName: 'star',
    badgeColor: '#2563eb', // Royal Blue
  },
  {
    id: 'time',
    defaultTitle: 'TIME CHAMPION',
    arabicTitle: 'بطل الوقت',
    iconName: 'clock',
    badgeColor: '#d97706', // Amber
  },
  {
    id: 'neat',
    defaultTitle: 'MR NEAT AND SMART',
    femaleTitle: 'MISS NEAT AND SMART',
    arabicTitle: 'المتميز بالأناقة',
    iconName: 'sparkles',
    badgeColor: '#7c3aed', // Purple
  },
  {
    id: 'pen',
    defaultTitle: 'PEN WIZARD',
    arabicTitle: 'صاحب القلم الساحر',
    iconName: 'pen',
    badgeColor: '#0891b2', // Cyan
  },
  {
    id: 'persuader',
    defaultTitle: 'INFLUENTIAL PERSUADER',
    arabicTitle: 'المقنع المؤثر',
    iconName: 'speaker',
    badgeColor: '#ea580c', // Orange
  },
  {
    id: 'language',
    defaultTitle: 'LANGUAGE MAESTRO',
    arabicTitle: 'فنان في اللغة',
    iconName: 'globe',
    badgeColor: '#db2777', // Pink / Rose
  },
  {
    id: 'analytical',
    defaultTitle: 'ANALYTICAL THINKER',
    arabicTitle: 'مفكر تحليلي',
    iconName: 'brain',
    badgeColor: '#4f46e5', // Indigo
  },
  {
    id: 'math',
    defaultTitle: 'Math Genius',
    arabicTitle: 'عَبْقَرِيُّ الرِّيَاضِيَّاتِ',
    iconName: 'calculator',
    badgeColor: '#0d9488', // Teal
  },
];

interface StudentOfTheMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  logoSrc?: string;
  schoolName?: string;
}

export default function StudentOfTheMonthModal({
  isOpen,
  onClose,
  students,
  logoSrc = '/logo.jpg',
  schoolName = 'AI INTEGRATED ACADEMY',
}: StudentOfTheMonthModalProps) {
  // Mode: 5-card panoramic spotlight (matching reference image) or 9-card full hall of fame
  const [layoutMode, setLayoutMode] = useState<'5-card' | '9-card'>('5-card');
  
  // Customization fields
  const [monthYear, setMonthYear] = useState<string>('OCTOBER 2026');
  const [bannerSubtitle, setBannerSubtitle] = useState<string>('EXCELLENCE IN EVERY AREA');
  const [topQuote, setTopQuote] = useState<string>('Small efforts make big results.');
  const [bottomDua, setBottomDua] = useState<string>(
    'May Allah (SWT) increase you in knowledge and steadfastness. رَبِّ زِدْنِي عِلْمًا'
  );

  // Selected 5 role IDs for 5-card mode
  const [selected5RoleIds, setSelected5RoleIds] = useState<string[]>([
    'quran', 'model', 'time', 'neat', 'pen'
  ]);

  // Roles state with winner assignments
  const [roleAssignments, setRoleAssignments] = useState<Record<string, AwardRoleConfig>>(() => {
    const initial: Record<string, AwardRoleConfig> = {};
    OFFICIAL_ROLES.forEach(r => {
      initial[r.id] = {
        ...r,
        studentId: '',
        studentName: '',
        studentClass: '',
        photoUrl: '',
      };
    });
    return initial;
  });

  // UI state
  const [activeEditingRoleId, setActiveEditingRoleId] = useState<string>('quran');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize winners with first 5-9 students on first open if empty
  useEffect(() => {
    if (students && students.length > 0) {
      setRoleAssignments(prev => {
        // If already has assignments, keep them
        const hasAny = Object.values(prev).some(r => r.studentName);
        if (hasAny) return prev;

        const updated = { ...prev };
        OFFICIAL_ROLES.forEach((r, idx) => {
          const s = students[idx % students.length];
          if (s) {
            const cls = getStudentClassArm(s.intendedClass, s.id, students);
            const isFemale = s.gender === 'Female';
            const title = (isFemale && r.femaleTitle) ? r.femaleTitle : r.defaultTitle;
            const arabicTitle = (isFemale && r.id === 'neat') ? 'المتميزة بالأناقة' : r.arabicTitle;
            updated[r.id] = {
              ...updated[r.id],
              defaultTitle: title,
              arabicTitle: arabicTitle,
              studentId: s.id,
              studentName: `${s.firstName} ${s.lastName}`.trim(),
              studentClass: cls,
              photoUrl: s.photo || '',
            };
          }
        });
        return updated;
      });
    }
  }, [students]);

  // Filter students for the picker list
  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = !studentSearchQuery || 
      fullName.includes(studentSearchQuery.toLowerCase()) ||
      (s.formNumber || '').toLowerCase().includes(studentSearchQuery.toLowerCase());
    const arm = getStudentClassArm(s.intendedClass, s.id, students);
    const matchesClass = classFilter === 'all' || arm.startsWith(classFilter) || arm === classFilter;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.intendedClass))).filter(Boolean);

  // Handle assigning a student to the active award role
  const handleSelectStudentForRole = (roleId: string, student: Student) => {
    const cls = getStudentClassArm(student.intendedClass, student.id, students);
    const isFemale = student.gender === 'Female';
    const roleBase = OFFICIAL_ROLES.find(r => r.id === roleId);

    setRoleAssignments(prev => {
      const current = prev[roleId];
      const newTitle = (isFemale && roleBase?.femaleTitle) ? roleBase.femaleTitle : (roleBase?.defaultTitle || current.defaultTitle);
      const newArabic = (isFemale && roleId === 'neat') ? 'المتميزة بالأناقة' : (roleBase?.arabicTitle || current.arabicTitle);

      return {
        ...prev,
        [roleId]: {
          ...current,
          defaultTitle: newTitle,
          arabicTitle: newArabic,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          studentClass: cls,
          photoUrl: student.photo || '',
        }
      };
    });
  };

  // Quick randomizer demo
  const handleRandomizeWinners = () => {
    if (!students.length) return;
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    setRoleAssignments(prev => {
      const updated = { ...prev };
      OFFICIAL_ROLES.forEach((r, idx) => {
        const s = shuffled[idx % shuffled.length];
        if (s) {
          const cls = getStudentClassArm(s.intendedClass, s.id, students);
          const isFemale = s.gender === 'Female';
          const title = (isFemale && r.femaleTitle) ? r.femaleTitle : r.defaultTitle;
          const arabicTitle = (isFemale && r.id === 'neat') ? 'المتميزة بالأناقة' : r.arabicTitle;
          updated[r.id] = {
            ...updated[r.id],
            defaultTitle: title,
            arabicTitle: arabicTitle,
            studentId: s.id,
            studentName: `${s.firstName} ${s.lastName}`.trim(),
            studentClass: cls,
            photoUrl: s.photo || '',
          };
        }
      });
      return updated;
    });
  };

  // Helper to load image async for Canvas drawing
  const loadImage = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise(resolve => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  // Canvas Drawing Function
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions based on mode
    const is5Card = layoutMode === '5-card';
    const W = 2400;
    const H = is5Card ? 1500 : 1680;

    canvas.width = W;
    canvas.height = H;

    // Preload logo
    const schoolLogoImg = await loadImage(logoSrc);

    // Active roles to draw
    const activeRoles: AwardRoleConfig[] = is5Card 
      ? selected5RoleIds.map(id => roleAssignments[id]).filter(Boolean)
      : OFFICIAL_ROLES.map(r => roleAssignments[r.id]).filter(Boolean);

    // Preload student photos
    const photoImages: Record<string, HTMLImageElement | null> = {};
    for (const r of activeRoles) {
      if (r.photoUrl) {
        photoImages[r.id] = await loadImage(r.photoUrl);
      } else {
        photoImages[r.id] = null;
      }
    }

    // ==========================================
    // 1. OUTER WOODEN FRAME (Rich Mahogany / Walnut)
    // ==========================================
    const frameThickness = 48;
    const innerBevelThickness = 14;

    // Wood gradient border
    const woodGrad = ctx.createLinearGradient(0, 0, W, H);
    woodGrad.addColorStop(0, '#1c100a');
    woodGrad.addColorStop(0.25, '#2e1910');
    woodGrad.addColorStop(0.5, '#1e110b');
    woodGrad.addColorStop(0.75, '#2d180f');
    woodGrad.addColorStop(1, '#170c07');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, 0, W, H);

    // Wood bevel highlight (top/left bright line)
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 215, 140, 0.25)';
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // Gold Bevel Inlay
    const goldX = frameThickness;
    const goldY = frameThickness;
    const goldW = W - 2 * frameThickness;
    const goldH = H - 2 * frameThickness;

    const goldGrad = ctx.createLinearGradient(goldX, goldY, goldX + goldW, goldY + goldH);
    goldGrad.addColorStop(0, '#e5b95c');
    goldGrad.addColorStop(0.2, '#fff1be');
    goldGrad.addColorStop(0.4, '#c99632');
    goldGrad.addColorStop(0.7, '#f4d27e');
    goldGrad.addColorStop(1, '#9b711a');

    ctx.fillStyle = goldGrad;
    ctx.fillRect(goldX, goldY, goldW, goldH);

    // Thin inner dark line separating gold from inner content
    const innerX = goldX + innerBevelThickness;
    const innerY = goldY + innerBevelThickness;
    const innerW = goldW - 2 * innerBevelThickness;
    const innerH = goldH - 2 * innerBevelThickness;

    // ==========================================
    // 2. INNER ROYAL NAVY BACKGROUND
    // ==========================================
    const bgGrad = ctx.createRadialGradient(
      W / 2, H * 0.42, 100,
      W / 2, H / 2, W * 0.75
    );
    bgGrad.addColorStop(0, '#0d254c');   // Lighter navy center glow
    bgGrad.addColorStop(0.45, '#071630'); // Rich deep navy
    bgGrad.addColorStop(0.85, '#040d1e'); // Darker navy
    bgGrad.addColorStop(1, '#020610');    // Near midnight blue edge

    ctx.fillStyle = bgGrad;
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // Subtle geometric Islamic background watermark / lattice grid
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.035)';
    ctx.lineWidth = 1.5;
    const step = 80;
    for (let x = innerX; x <= innerX + innerW; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, innerY);
      ctx.lineTo(x + 200, innerY + innerH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, innerY);
      ctx.lineTo(x - 200, innerY + innerH);
      ctx.stroke();
    }
    ctx.restore();

    // ==========================================
    // 3. CORNER ISLAMIC ARABESQUE ORNAMENTS
    // ==========================================
    const drawCornerOrnament = (cx: number, cy: number, rot: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      // Corner right-angle border
      ctx.beginPath();
      ctx.moveTo(10, 80);
      ctx.lineTo(10, 10);
      ctx.lineTo(80, 10);
      ctx.stroke();

      // Outer accent arch
      ctx.beginPath();
      ctx.arc(45, 45, 30, Math.PI, 1.5 * Math.PI);
      ctx.stroke();

      // Small diamond star in corner
      ctx.fillStyle = '#fff1be';
      ctx.beginPath();
      ctx.moveTo(25, 20);
      ctx.lineTo(28, 25);
      ctx.lineTo(25, 30);
      ctx.lineTo(22, 25);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    drawCornerOrnament(innerX + 16, innerY + 16, 0);
    drawCornerOrnament(innerX + innerW - 16, innerY + 16, Math.PI / 2);
    drawCornerOrnament(innerX + innerW - 16, innerY + innerH - 16, Math.PI);
    drawCornerOrnament(innerX + 16, innerY + innerH - 16, -Math.PI / 2);

    // ==========================================
    // 4. TOP HEADER: LOGO, SCHOOL NAME & QUOTE
    // ==========================================
    const headerY = innerY + 45;

    // Draw School Logo at top left
    const logoSize = 100;
    const logoX = innerX + 70;
    const logoY = headerY;

    if (schoolLogoImg) {
      ctx.save();
      // Circular clip with golden border
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
      ctx.fillStyle = goldGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(schoolLogoImg, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    }

    // School Name & Subtitle beside Logo
    ctx.save();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Montserrat", "Arial Black", sans-serif';
    ctx.fillText(schoolName, logoX + logoSize + 24, logoY + 42);

    ctx.fillStyle = '#d4af37';
    ctx.font = '600 20px "Cinzel", "Times New Roman", serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('KNOWLEDGE • DISCIPLINE • EXCELLENCE', logoX + logoSize + 26, logoY + 76);
    ctx.restore();

    // Top Right Quote (from user reference image: "Small efforts make big results.")
    if (topQuote) {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fce7a1';
      ctx.font = 'italic 500 24px "Georgia", "Cinzel", serif';
      const quoteX = innerX + innerW - 70;
      ctx.fillText(`“${topQuote}”`, quoteX, logoY + 52);

      // Decorative golden line under quote
      const quoteGrad = ctx.createLinearGradient(quoteX - 280, 0, quoteX, 0);
      quoteGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
      quoteGrad.addColorStop(1, 'rgba(212, 175, 55, 0.8)');
      ctx.strokeStyle = quoteGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(quoteX - 300, logoY + 68);
      ctx.lineTo(quoteX, logoY + 68);
      ctx.stroke();
      ctx.restore();
    }

    // ==========================================
    // 5. 3D GOLDEN RIBBON BANNER & CROWN
    // ==========================================
    const bannerCenterY = headerY + 105;
    const bannerW = 1260;
    const bannerH = 82;
    const bannerX = W / 2 - bannerW / 2;

    ctx.save();
    // Crown 👑 above the banner
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.font = '46px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.fillText('👑', W / 2, bannerCenterY - 38);

    // Left Ribbon Tail
    ctx.fillStyle = '#8c6518';
    ctx.beginPath();
    ctx.moveTo(bannerX - 55, bannerCenterY + 10);
    ctx.lineTo(bannerX + 20, bannerCenterY + 10);
    ctx.lineTo(bannerX + 20, bannerCenterY + bannerH + 10);
    ctx.lineTo(bannerX - 55, bannerCenterY + bannerH + 10);
    ctx.lineTo(bannerX - 28, bannerCenterY + bannerH / 2 + 10);
    ctx.closePath();
    ctx.fill();

    // Right Ribbon Tail
    ctx.beginPath();
    ctx.moveTo(bannerX + bannerW + 55, bannerCenterY + 10);
    ctx.lineTo(bannerX + bannerW - 20, bannerCenterY + 10);
    ctx.lineTo(bannerX + bannerW - 20, bannerCenterY + bannerH + 10);
    ctx.lineTo(bannerX + bannerW + 55, bannerCenterY + bannerH + 10);
    ctx.lineTo(bannerX + bannerW + 28, bannerCenterY + bannerH / 2 + 10);
    ctx.closePath();
    ctx.fill();

    // Main Ribbon Body Gradient
    const ribbonGrad = ctx.createLinearGradient(bannerX, 0, bannerX + bannerW, 0);
    ribbonGrad.addColorStop(0, '#c69229');
    ribbonGrad.addColorStop(0.2, '#fced9c');
    ribbonGrad.addColorStop(0.5, '#ffffff');
    ribbonGrad.addColorStop(0.8, '#fced9c');
    ribbonGrad.addColorStop(1, '#c69229');

    // Ribbon drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    // Draw main ribbon rounded rectangle
    const rRadius = 14;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerCenterY, bannerW, bannerH, rRadius);
    ctx.fillStyle = ribbonGrad;
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Golden inner border on ribbon
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#946614';
    ctx.stroke();

    // Ribbon Text: "STUDENTS OF THE MONTH • [MONTH YEAR]"
    ctx.textAlign = 'center';
    ctx.fillStyle = '#061328';
    ctx.font = '900 38px "Cinzel", "Trajan Pro", "Times New Roman", serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(
      monthYear ? `STUDENTS OF THE MONTH • ${monthYear}` : 'STUDENTS OF THE MONTH',
      W / 2,
      bannerCenterY + 54
    );

    // Banner Subtitle underneath: "★   EXCELLENCE IN EVERY AREA   ★"
    if (bannerSubtitle) {
      ctx.fillStyle = '#fce7a1';
      ctx.font = 'bold 20px "Cinzel", "Georgia", serif';
      ctx.letterSpacing = '4px';
      ctx.fillText(`★   ${bannerSubtitle}   ★`, W / 2, bannerCenterY + bannerH + 28);
    }
    ctx.restore();

    // ==========================================
    // 6. STUDENT AWARD CARDS
    // ==========================================
    const renderCard = (
      role: AwardRoleConfig,
      cardX: number,
      cardY: number,
      cardW: number,
      cardH: number,
      isSmallMode: boolean = false
    ) => {
      ctx.save();

      // Card outer shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;

      // Card Gold Outer Border
      const cardRadius = isSmallMode ? 20 : 24;
      const cardGoldGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      cardGoldGrad.addColorStop(0, '#f9e497');
      cardGoldGrad.addColorStop(0.3, '#d4af37');
      cardGoldGrad.addColorStop(0.7, '#8f681a');
      cardGoldGrad.addColorStop(1, '#f3d37a');

      ctx.fillStyle = cardGoldGrad;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Inner card body (Deep Navy with subtle gradient)
      const borderThickness = isSmallMode ? 5 : 6;
      const innerCardX = cardX + borderThickness;
      const innerCardY = cardY + borderThickness;
      const innerCardW = cardW - 2 * borderThickness;
      const innerCardH = cardH - 2 * borderThickness;

      const cardBodyGrad = ctx.createLinearGradient(innerCardX, innerCardY, innerCardX, innerCardY + innerCardH);
      cardBodyGrad.addColorStop(0, '#0a1d3f');
      cardBodyGrad.addColorStop(0.5, '#07152f');
      cardBodyGrad.addColorStop(1, '#040d1f');

      ctx.fillStyle = cardBodyGrad;
      ctx.beginPath();
      ctx.roundRect(innerCardX, innerCardY, innerCardW, innerCardH, cardRadius - 4);
      ctx.fill();

      // Top Icon Medallion Badge
      const badgeY = isSmallMode ? innerCardY + 34 : innerCardY + 44;
      const badgeR = isSmallMode ? 26 : 36;
      const badgeCenterX = innerCardX + innerCardW / 2;

      // Medallion outer gold ring
      ctx.beginPath();
      ctx.arc(badgeCenterX, badgeY, badgeR + 3, 0, Math.PI * 2);
      ctx.fillStyle = cardGoldGrad;
      ctx.fill();

      // Medallion inner colored circle
      ctx.beginPath();
      ctx.arc(badgeCenterX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = role.badgeColor || '#059669';
      ctx.fill();

      // Medallion icon / symbol
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = isSmallMode 
        ? '24px "Segoe UI Symbol", "Apple Color Emoji", sans-serif'
        : '32px "Segoe UI Symbol", "Apple Color Emoji", sans-serif';
      let symbol = '★';
      if (role.id === 'quran') symbol = '📖';
      else if (role.id === 'model') symbol = '⭐';
      else if (role.id === 'time') symbol = '⏱️';
      else if (role.id === 'neat') symbol = '✨';
      else if (role.id === 'pen') symbol = '✒️';
      else if (role.id === 'persuader') symbol = '📢';
      else if (role.id === 'language') symbol = '🌐';
      else if (role.id === 'analytical') symbol = '💡';
      else if (role.id === 'math') symbol = '📐';
      ctx.fillText(symbol, badgeCenterX, isSmallMode ? badgeY + 8 : badgeY + 11);

      // Award English Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fce7a1';
      ctx.font = isSmallMode
        ? 'bold 16px "Cinzel", "Arial Black", sans-serif'
        : 'bold 20px "Cinzel", "Arial Black", sans-serif';
      ctx.letterSpacing = isSmallMode ? '0.8px' : '1px';
      ctx.fillText(
        role.defaultTitle.toUpperCase(), 
        badgeCenterX, 
        isSmallMode ? badgeY + badgeR + 22 : badgeY + badgeR + 30
      );

      // Award Arabic Title (e.g. سفير القرآن)
      ctx.fillStyle = '#ffffff';
      ctx.font = isSmallMode
        ? 'bold 20px "Amiri", "Traditional Arabic", "Scheherazade New", serif'
        : 'bold 24px "Amiri", "Traditional Arabic", "Scheherazade New", serif';
      ctx.fillText(
        role.arabicTitle, 
        badgeCenterX, 
        isSmallMode ? badgeY + badgeR + 46 : badgeY + badgeR + 62
      );

      // Student Photo Container
      const photoW = isSmallMode ? 260 : cardW * 0.74;
      const photoH = isSmallMode ? 240 : photoW * 1.15;
      const photoX = innerCardX + (innerCardW - photoW) / 2;
      const photoY = isSmallMode ? badgeY + badgeR + 58 : badgeY + badgeR + 80;

      // Photo Gold Frame
      const photoBorder = 4;
      ctx.fillStyle = cardGoldGrad;
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, 16);
      ctx.fill();

      // Clip and Draw Photo with aspect-ratio cover
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(
        photoX + photoBorder, 
        photoY + photoBorder, 
        photoW - 2 * photoBorder, 
        photoH - 2 * photoBorder, 
        12
      );
      ctx.clip();

      const studentImg = photoImages[role.id];
      const targetW = photoW - 2 * photoBorder;
      const targetH = photoH - 2 * photoBorder;

      if (studentImg) {
        const sRatio = studentImg.width / studentImg.height;
        const tRatio = targetW / targetH;
        let sx = 0, sy = 0, sw = studentImg.width, sh = studentImg.height;
        if (sRatio > tRatio) {
          sw = studentImg.height * tRatio;
          sx = (studentImg.width - sw) / 2;
        } else {
          sh = studentImg.width / tRatio;
          sy = (studentImg.height - sh) / 2;
        }
        ctx.drawImage(
          studentImg, 
          sx, sy, sw, sh,
          photoX + photoBorder, 
          photoY + photoBorder, 
          targetW, 
          targetH
        );
      } else {
        // Silhouette placeholder
        ctx.fillStyle = '#0f274e';
        ctx.fillRect(photoX + photoBorder, photoY + photoBorder, targetW, targetH);
        ctx.fillStyle = '#fce7a1';
        ctx.font = 'bold 58px sans-serif';
        const initials = role.studentName
          ? role.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
          : '?';
        ctx.fillText(initials, badgeCenterX, photoY + photoH / 2 + 18);
      }
      ctx.restore();

      // Student Name Pill (Navy & Gold Pill at bottom of photo)
      const pillW = cardW * 0.88;
      const pillH = isSmallMode ? 42 : 46;
      const pillX = innerCardX + (innerCardW - pillW) / 2;
      const pillY = isSmallMode ? photoY + photoH + 12 : photoY + photoH + 18;

      ctx.save();
      ctx.fillStyle = '#061a38';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fill();

      ctx.strokeStyle = cardGoldGrad;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = isSmallMode
        ? 'bold 17px "Montserrat", "Arial", sans-serif'
        : 'bold 19px "Montserrat", "Arial", sans-serif';
      const studentDisplayName = role.studentName || 'Student Name';
      ctx.fillText(studentDisplayName, badgeCenterX, isSmallMode ? pillY + 27 : pillY + 29);
      ctx.restore();

      // Student Class Subtitle (e.g. Basic 1 Gold)
      const classY = isSmallMode ? pillY + pillH + 22 : pillY + pillH + 26;
      ctx.fillStyle = '#d4af37';
      ctx.font = isSmallMode
        ? 'bold 15px "Cinzel", "Georgia", serif'
        : 'bold 17px "Cinzel", "Georgia", serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(role.studentClass || 'Class Name', badgeCenterX, classY);

      ctx.restore();
    };

    // ==========================================
    // 7. LAYOUT & CARD POSITIONING
    // ==========================================
    if (is5Card) {
      // 5 Panoramic Cards across the screen
      const numCards = 5;
      const cardW = 400;
      const cardH = 780;
      const totalCardsW = numCards * cardW;
      const availableSpace = innerW - 140; // margins
      const gap = (availableSpace - totalCardsW) / (numCards - 1);
      const startX = innerX + 70;
      const cardsY = bannerCenterY + bannerH + 55;

      activeRoles.slice(0, 5).forEach((role, idx) => {
        const cx = startX + idx * (cardW + gap);
        renderCard(role, cx, cardsY, cardW, cardH, false);
      });
    } else {
      // 9 Cards Layout: Row 1 has 5 cards, Row 2 has 4 cards centered
      const cardW = 390;
      const cardH = 515;
      const gapX = 36;
      const gapY = 36;

      // Row 1 (5 cards)
      const row1Count = 5;
      const row1W = row1Count * cardW + (row1Count - 1) * gapX;
      const row1StartX = (W - row1W) / 2;
      const row1Y = bannerCenterY + bannerH + 46;

      activeRoles.slice(0, 5).forEach((role, idx) => {
        const cx = row1StartX + idx * (cardW + gapX);
        renderCard(role, cx, row1Y, cardW, cardH, true);
      });

      // Row 2 (4 cards centered)
      const row2Count = Math.min(4, activeRoles.length - 5);
      if (row2Count > 0) {
        const row2W = row2Count * cardW + (row2Count - 1) * gapX;
        const row2StartX = (W - row2W) / 2;
        const row2Y = row1Y + cardH + gapY;

        activeRoles.slice(5, 5 + row2Count).forEach((role, idx) => {
          const cx = row2StartX + idx * (cardW + gapX);
          renderCard(role, cx, row2Y, cardW, cardH, true);
        });
      }
    }

    // ==========================================
    // 8. BOTTOM FOOTER BLESSING & DUA
    // ==========================================
    const footerY = innerY + innerH - 42;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fce7a1';
    ctx.font = '600 20px "Cinzel", "Amiri", "Traditional Arabic", serif';
    ctx.letterSpacing = '1.5px';
    ctx.fillText(bottomDua, W / 2, footerY);

    // Decorative stars on either side of Dua
    ctx.fillStyle = '#d4af37';
    ctx.font = '16px sans-serif';
    ctx.fillText('✦   ✦   ✦', W / 2, footerY - 26);
    ctx.restore();

    setIsCanvasReady(true);
  }, [layoutMode, monthYear, bannerSubtitle, topQuote, bottomDua, selected5RoleIds, roleAssignments, logoSrc, schoolName]);

  // Re-render canvas whenever relevant state changes
  useEffect(() => {
    if (isOpen) {
      renderCanvas();
    }
  }, [isOpen, renderCanvas]);

  if (!isOpen) return null;

  // ==========================================
  // EXPORT HANDLERS
  // ==========================================
  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    const safeDate = monthYear.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `AI_Academy_Students_of_the_Month_${safeDate}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPdf = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsGeneratingPdf(true);
      const dataUrl = canvas.toDataURL('image/png');
      const safeTitle = `Students_of_the_Month_${monthYear.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      const res = await fetch('/api/poster-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          title: safeTitle,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate PDF (Status ${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert(`Could not generate PDF: ${err.message || 'Please check server connection'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Pop-up blocked. Please allow popups to print poster.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Academy - Students of the Month Poster</title>
          <style>
            @page {
              size: landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #000;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            img {
              max-width: 100vw;
              max-height: 100vh;
              object-fit: contain;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 md:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>Students of the Month Poster Generator</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Star Awards
                </span>
              </h2>
              <p className="text-xs text-amber-200/70">
                Official luxury awards plaque matching school reference with 9 bilingual titles
              </p>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRandomizeWinners}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold transition-all border border-amber-500/20"
              title="Populate random winners from students"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Shuffle Students</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (Split View: Left Controls / Right Canvas Preview) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT SIDEBAR CONTROLS (Customization & Student Assignment) */}
          <div className="w-full lg:w-[420px] bg-slate-950/70 border-r border-slate-800 p-5 overflow-y-auto no-scrollbar space-y-6 shrink-0">
            
            {/* 1. Layout Mode Switcher */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
                Poster Layout Mode
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLayoutMode('5-card')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    layoutMode === '5-card'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>5 Spotlight Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('9-card')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    layoutMode === '9-card'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All 9 Awards (2 Rows)</span>
                </button>
              </div>
            </div>

            {/* 2. Text Customization (Month, Subtitle, Quote, Dua) */}
            <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Plaque Typography
              </span>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Month & Year Title</label>
                <input
                  type="text"
                  value={monthYear}
                  onChange={e => setMonthYear(e.target.value)}
                  placeholder="e.g. OCTOBER 2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Banner Subtitle</label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={e => setBannerSubtitle(e.target.value)}
                  placeholder="e.g. EXCELLENCE IN EVERY AREA"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Top Right Quote</label>
                <input
                  type="text"
                  value={topQuote}
                  onChange={e => setTopQuote(e.target.value)}
                  placeholder="e.g. Small efforts make big results."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Bottom Blessing / Dua</label>
                <input
                  type="text"
                  value={bottomDua}
                  onChange={e => setBottomDua(e.target.value)}
                  placeholder="May Allah increase you in knowledge..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 3. Award Role Selector & Student Picker */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Select Award Role to Configure
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {layoutMode === '5-card' ? '5 of 9' : 'All 9'}
                </span>
              </div>

              {/* Roles Chips */}
              <div className="grid grid-cols-1 gap-2">
                {OFFICIAL_ROLES.map(role => {
                  const assignment = roleAssignments[role.id];
                  const isSelected = activeEditingRoleId === role.id;
                  const isIncludedIn5 = selected5RoleIds.includes(role.id);

                  return (
                    <div
                      key={role.id}
                      onClick={() => setActiveEditingRoleId(role.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400/80 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0"
                          style={{ backgroundColor: role.badgeColor }}
                        >
                          ★
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {assignment.defaultTitle}
                            </span>
                            <span className="text-[10px] text-amber-300 font-medium font-arabic">
                              {assignment.arabicTitle}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {assignment.studentName
                              ? `${assignment.studentName} (${assignment.studentClass || 'No class'})`
                              : 'No student chosen yet'}
                          </span>
                        </div>
                      </div>

                      {layoutMode === '5-card' && (
                        <input
                          type="checkbox"
                          checked={isIncludedIn5}
                          onClick={e => e.stopPropagation()}
                          onChange={e => {
                            if (e.target.checked) {
                              if (selected5RoleIds.length < 5) {
                                setSelected5RoleIds(prev => [...prev, role.id]);
                              } else {
                                alert('Maximum 5 roles for 5-Spotlight mode. Deselect one first or switch to 9-Award mode.');
                              }
                            } else {
                              if (selected5RoleIds.length > 1) {
                                setSelected5RoleIds(prev => prev.filter(id => id !== role.id));
                              }
                            }
                          }}
                          className="w-4 h-4 accent-amber-400 rounded shrink-0 cursor-pointer"
                          title="Include in 5-card poster"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ACTIVE ROLE STUDENT CHOOSER */}
              {activeEditingRoleId && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      Assign Student for {roleAssignments[activeEditingRoleId]?.defaultTitle}
                    </span>
                  </div>

                  {/* Search and Class filter */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={studentSearchQuery}
                        onChange={e => setStudentSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-400 focus:outline-hidden"
                      />
                    </div>
                    <select
                      value={classFilter}
                      onChange={e => setClassFilter(e.target.value)}
                      className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:border-amber-400 focus:outline-hidden"
                    >
                      <option value="all">All Classes</option>
                      {uniqueClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Student Select List */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 no-scrollbar pr-1">
                    {filteredStudents.slice(0, 30).map(s => {
                      const isAssigned = roleAssignments[activeEditingRoleId]?.studentId === s.id;
                      const arm = getStudentClassArm(s.intendedClass, s.id, students);

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectStudentForRole(activeEditingRoleId, s)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-all ${
                            isAssigned
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {s.photo ? (
                              <img
                                src={s.photo}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center text-[10px] shrink-0">
                                {s.firstName[0]}
                              </div>
                            )}
                            <span className="truncate">{s.firstName} {s.lastName}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${isAssigned ? 'bg-slate-950 text-white' : 'text-slate-400'}`}>
                            {arm}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Override inputs */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Custom Name / Photo Override
                    </span>
                    <input
                      type="text"
                      placeholder="Custom Student Name"
                      value={roleAssignments[activeEditingRoleId]?.studentName || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setRoleAssignments(prev => ({
                          ...prev,
                          [activeEditingRoleId]: {
                            ...prev[activeEditingRoleId],
                            studentName: val,
                          }
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Custom Class Name"
                      value={roleAssignments[activeEditingRoleId]?.studentClass || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setRoleAssignments(prev => ({
                          ...prev,
                          [activeEditingRoleId]: {
                            ...prev[activeEditingRoleId],
                            studentClass: val,
                          }
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PREVIEW & EXPORT ACTIONS */}
          <div className="flex-1 bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto items-center">
            
            {/* Top Preview Status */}
            <div className="w-full flex items-center justify-between mb-4 max-w-5xl">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-300">
                  Live Plaque Canvas Rendering ({layoutMode === '5-card' ? '2400 × 1500 px' : '2400 × 1680 px'})
                </span>
              </div>
              <span className="text-xs text-amber-400/80 font-mono">
                Ultra-HD Print Ready
              </span>
            </div>

            {/* Canvas Display Container */}
            <div className="w-full flex-1 flex items-center justify-center p-2">
              <div className="relative max-w-full shadow-2xl rounded-2xl overflow-hidden border border-amber-500/20 bg-black">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[68vh] object-contain block mx-auto cursor-pointer"
                  onClick={renderCanvas}
                  title="Click to refresh preview"
                />
              </div>
            </div>

            {/* Bottom Export Action Toolbar */}
            <div className="w-full max-w-4xl mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                <span className="text-amber-400 font-bold">Tip:</span> Ready for A4 / A3 framing or WhatsApp / Social Media sharing.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={renderCanvas}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPoster}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-500/30"
                >
                  <Printer className="w-4 h-4" />
                  <span>Direct Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Download Image (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Award className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Poster'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
