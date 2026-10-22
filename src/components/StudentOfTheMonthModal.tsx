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
    id: 'math',
    defaultTitle: 'BEST IN MATH',
    arabicTitle: 'المتميز في الرياضيات',
    iconName: 'math',
    badgeColor: '#1A56DB', // Royal Blue
  },
  {
    id: 'pen',
    defaultTitle: 'BEST IN HANDWRITING',
    arabicTitle: 'المتميز في الخط',
    iconName: 'pen',
    badgeColor: '#15803D', // Emerald Green
  },
  {
    id: 'quran',
    defaultTitle: 'BEST IN QURAN',
    arabicTitle: 'سفير القرآن',
    iconName: 'book',
    badgeColor: '#6B21A8', // Royal Purple
  },
  {
    id: 'hadith',
    defaultTitle: 'BEST IN HADITH',
    arabicTitle: 'المتميز في الحديث',
    iconName: 'hadith',
    badgeColor: '#881337', // Imperial Crimson / Maroon
  },
  {
    id: 'arabiyyah',
    defaultTitle: 'BEST IN ARABIYYAH',
    arabicTitle: 'المتميز في العربية',
    iconName: 'arabiyyah',
    badgeColor: '#0E7490', // Deep Teal
  },
  {
    id: 'model',
    defaultTitle: 'MODEL AMBASSADOR',
    arabicTitle: 'سفير مثالي',
    iconName: 'star',
    badgeColor: '#2563eb', // Sapphire Blue
  },
  {
    id: 'time',
    defaultTitle: 'TIME CHAMPION',
    arabicTitle: 'بطل الوقت',
    iconName: 'clock',
    badgeColor: '#d97706', // Amber Gold
  },
  {
    id: 'neat',
    defaultTitle: 'MR NEAT AND SMART',
    femaleTitle: 'MISS NEAT AND SMART',
    arabicTitle: 'المتميز بالأناقة',
    iconName: 'sparkles',
    badgeColor: '#7c3aed', // Violet
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
    badgeColor: '#db2777', // Rose Pink
  },
  {
    id: 'analytical',
    defaultTitle: 'ANALYTICAL THINKER',
    arabicTitle: 'مفكر تحليلي',
    iconName: 'brain',
    badgeColor: '#4f46e5', // Indigo
  },
];

interface StudentOfTheMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  logoSrc?: string;
  schoolName?: string;
  schoolSubtitle?: string;
}

export default function StudentOfTheMonthModal({
  isOpen,
  onClose,
  students,
  logoSrc = '/logo.jpg',
  schoolName = 'AI ACADEMY ARGUNGU',
  schoolSubtitle = 'JUNIOR SECONDARY SCHOOL',
}: StudentOfTheMonthModalProps) {
  // Mode: 5-card panoramic spotlight (matching reference image) or 9-card full hall of fame
  const [layoutMode, setLayoutMode] = useState<'5-card' | '9-card'>('5-card');
  
  // Customization fields
  const [monthYear, setMonthYear] = useState<string>('OCTOBER 2026');
  const [bannerSubtitle, setBannerSubtitle] = useState<string>('EXCELLENCE IN EVERY AREA');
  const [topQuote, setTopQuote] = useState<string>('Small efforts make big results.');
  const [bottomDua, setBottomDua] = useState<string>(
    'May Allah (SWT) increase you in knowledge, keep you sincere and make you among the righteous.'
  );

  // Selected 5 role IDs for 5-card mode (Default to the 5 spotlight categories from reference image)
  const [selected5RoleIds, setSelected5RoleIds] = useState<string[]>([
    'math', 'pen', 'quran', 'hadith', 'arabiyyah'
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
  const [activeEditingRoleId, setActiveEditingRoleId] = useState<string>('math');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cleanStudentName = (firstName: string, lastName: string) => {
    return `${firstName || ''} ${lastName || ''}`
      .replace(/([a-zA-Z]),([a-zA-Z])/g, "$1'$2")
      .trim();
  };

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
              studentName: cleanStudentName(s.firstName, s.lastName),
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
          studentName: cleanStudentName(student.firstName, student.lastName),
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
            studentName: cleanStudentName(s.firstName, s.lastName),
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

  // Canvas Drawing Function - Photorealistic Plaque Engine
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions based on mode
    const is5Card = layoutMode === '5-card';
    const W = 2400;
    const H = is5Card ? 1500 : 1720;

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
    // 1. 3D BEVELED BLACK WOODEN FRAME (Mitered Edges + Directional Lighting)
    // ==========================================
    const frameThickness = 52;
    const innerBevelThickness = 16;

    // Top Mitered Trapezoid (Highlight)
    const topGrad = ctx.createLinearGradient(0, 0, 0, frameThickness);
    topGrad.addColorStop(0, '#383a40');
    topGrad.addColorStop(0.3, '#2a2c30');
    topGrad.addColorStop(1, '#18191b');
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W - frameThickness, frameThickness);
    ctx.lineTo(frameThickness, frameThickness);
    ctx.closePath();
    ctx.fill();

    // Left Mitered Trapezoid (Subtle Highlight)
    const leftGrad = ctx.createLinearGradient(0, 0, frameThickness, 0);
    leftGrad.addColorStop(0, '#303236');
    leftGrad.addColorStop(0.4, '#242529');
    leftGrad.addColorStop(1, '#151618');
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(frameThickness, frameThickness);
    ctx.lineTo(frameThickness, H - frameThickness);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // Right Mitered Trapezoid (Shadow)
    const rightGrad = ctx.createLinearGradient(W - frameThickness, 0, W, 0);
    rightGrad.addColorStop(0, '#151618');
    rightGrad.addColorStop(0.6, '#0f1011');
    rightGrad.addColorStop(1, '#09090a');
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(W, H);
    ctx.lineTo(W - frameThickness, H - frameThickness);
    ctx.lineTo(W - frameThickness, frameThickness);
    ctx.closePath();
    ctx.fill();

    // Bottom Mitered Trapezoid (Deep Shadow)
    const bottomGrad = ctx.createLinearGradient(0, H - frameThickness, 0, H);
    bottomGrad.addColorStop(0, '#131415');
    bottomGrad.addColorStop(0.5, '#0b0b0c');
    bottomGrad.addColorStop(1, '#040405');
    ctx.fillStyle = bottomGrad;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(frameThickness, H - frameThickness);
    ctx.lineTo(W - frameThickness, H - frameThickness);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // Fine edge highlight line on top and left outer border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1, H - 1);
    ctx.lineTo(1, 1);
    ctx.lineTo(W - 1, 1);
    ctx.stroke();

    // ==========================================
    // 2. RECESSED METALLIC GOLD FILLET (Inner Frame Liner)
    // ==========================================
    const goldX = frameThickness;
    const goldY = frameThickness;
    const goldW = W - 2 * frameThickness;
    const goldH = H - 2 * frameThickness;

    // Outer gold bevel gradient (light source from top-left)
    const goldFilletGrad = ctx.createLinearGradient(goldX, goldY, goldX + goldW, goldY + goldH);
    goldFilletGrad.addColorStop(0, '#fff4c2');   // Bright champagne highlight
    goldFilletGrad.addColorStop(0.18, '#ecd17d');
    goldFilletGrad.addColorStop(0.38, '#c99632'); // Rich warm gold
    goldFilletGrad.addColorStop(0.65, '#f7db8e');
    goldFilletGrad.addColorStop(0.85, '#a3751e');
    goldFilletGrad.addColorStop(1, '#543907');    // Deep bronze shadow

    ctx.fillStyle = goldFilletGrad;
    ctx.fillRect(goldX, goldY, goldW, goldH);

    // Inner gold bevel highlight & shadow edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(goldX, goldY + goldH);
    ctx.lineTo(goldX, goldY);
    ctx.lineTo(goldX + goldW, goldY);
    ctx.stroke();

    // ==========================================
    // 3. INNER ROYAL MIDNIGHT NAVY CANVAS
    // ==========================================
    const innerX = goldX + innerBevelThickness;
    const innerY = goldY + innerBevelThickness;
    const innerW = goldW - 2 * innerBevelThickness;
    const innerH = goldH - 2 * innerBevelThickness;

    // Canvas background with radiant royal navy illumination
    const bgGrad = ctx.createRadialGradient(
      W / 2, H * 0.40, 100,
      W / 2, H * 0.50, W * 0.72
    );
    bgGrad.addColorStop(0, '#0f2c5d');   // Royal navy highlight
    bgGrad.addColorStop(0.35, '#071836'); // Deep midnight navy
    bgGrad.addColorStop(0.70, '#030d20'); // Dark midnight edge
    bgGrad.addColorStop(1, '#01050e');    // Near-black edge

    ctx.fillStyle = bgGrad;
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // Inner recessed drop shadow around the canvas edges
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 6;
    ctx.strokeRect(innerX - 3, innerY - 3, innerW + 6, innerH + 6);
    ctx.restore();

    // Subtle luxury background lattice watermark
    ctx.save();
    ctx.strokeStyle = 'rgba(218, 185, 95, 0.025)';
    ctx.lineWidth = 1.2;
    const latticeStep = 75;
    for (let x = innerX - innerH; x <= innerX + innerW + innerH; x += latticeStep) {
      ctx.beginPath();
      ctx.moveTo(x, innerY);
      ctx.lineTo(x + innerH, innerY + innerH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, innerY);
      ctx.lineTo(x - innerH, innerY + innerH);
      ctx.stroke();
    }
    ctx.restore();

    // ==========================================
    // 4. INTRICATE ISLAMIC ARABESQUE CORNER ARTWORK (Bottom-Left & Bottom-Right)
    // ==========================================
    const drawIslamicCornerMandala = (cx: number, cy: number, flipX: boolean, flipY: boolean) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

      const goldStroke = '#d4af37';

      // Concentric circular geometric rings
      const radii = [60, 120, 180, 250, 320, 400];
      radii.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI / 2);
        ctx.strokeStyle = idx % 2 === 0 ? 'rgba(229, 192, 101, 0.35)' : 'rgba(229, 192, 101, 0.18)';
        ctx.lineWidth = idx === 1 || idx === 3 ? 2.2 : 1.2;
        ctx.stroke();
      });

      // 8-Point Geometric Star Rosette at origin
      ctx.save();
      for (let rot = 0; rot < 8; rot++) {
        ctx.save();
        ctx.rotate((rot * Math.PI) / 8);
        ctx.strokeStyle = 'rgba(255, 225, 140, 0.5)';
        ctx.lineWidth = 1.8;
        // Diamond petal
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(75, 20);
        ctx.lineTo(135, 0);
        ctx.lineTo(75, -20);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // Outer Interlocking Geometric Arcs
      const outerArcs = [150, 210, 275, 345];
      outerArcs.forEach(r => {
        for (let angle = 5; angle <= 85; angle += 15) {
          const rad = (angle * Math.PI) / 180;
          const px = Math.cos(rad) * r;
          const py = Math.sin(rad) * r;

          ctx.strokeStyle = 'rgba(220, 180, 80, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, 32, 0, Math.PI * 2);
          ctx.stroke();

          // Small golden diamond star at intersections
          ctx.fillStyle = 'rgba(255, 240, 180, 0.6)';
          ctx.beginPath();
          ctx.moveTo(px, py - 5);
          ctx.lineTo(px + 4, py);
          ctx.lineTo(px, py + 5);
          ctx.lineTo(px - 4, py);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Border framing bracket lines
      ctx.strokeStyle = 'rgba(240, 205, 110, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(15, 260);
      ctx.lineTo(15, 15);
      ctx.lineTo(260, 15);
      ctx.stroke();

      ctx.restore();
    };

    // Render elaborate gold mandala art in bottom corners matching reference
    drawIslamicCornerMandala(innerX + 10, innerY + innerH - 10, false, true);
    drawIslamicCornerMandala(innerX + innerW - 10, innerY + innerH - 10, true, true);

    // ==========================================
    // 5. TOP HEADER: CREST, SCHOOL TITLE & QUOTE
    // ==========================================
    const headerY = innerY + 45;

    // A. School Crest on Left
    const crestCenterX = innerX + 130;
    const crestCenterY = headerY + 46;
    const crestRadius = 42;

    ctx.save();
    // Laurel Wreath Leaves (Left and Right branches)
    ctx.strokeStyle = '#d4af37';
    ctx.fillStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.arc(crestCenterX + side * 4, crestCenterY, crestRadius + 14, (side === 1 ? -0.3 : 1.3) * Math.PI, (side === 1 ? 0.3 : 0.7) * Math.PI);
      ctx.stroke();

      for (let i = 0; i < 6; i++) {
        const leafAngle = (side === 1 ? -0.25 : 1.25) * Math.PI + i * 0.18;
        const lx = crestCenterX + side * 4 + Math.cos(leafAngle) * (crestRadius + 14);
        const ly = crestCenterY + Math.sin(leafAngle) * (crestRadius + 14);
        ctx.beginPath();
        ctx.ellipse(lx, ly, 7, 3.5, leafAngle + 0.5 * side, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3 Golden Stars above Crest
    [-18, 0, 18].forEach((xOff, i) => {
      const sy = crestCenterY - crestRadius - (i === 1 ? 24 : 18);
      ctx.fillStyle = '#fff4be';
      ctx.beginPath();
      ctx.arc(crestCenterX + xOff, sy, i === 1 ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Inner Crest Medallion with Gold Rim
    ctx.beginPath();
    ctx.arc(crestCenterX, crestCenterY, crestRadius, 0, Math.PI * 2);
    ctx.fillStyle = goldFilletGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(crestCenterX, crestCenterY, crestRadius - 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#061633';
    ctx.fill();

    if (schoolLogoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(crestCenterX, crestCenterY, crestRadius - 4, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(schoolLogoImg, crestCenterX - crestRadius + 4, crestCenterY - crestRadius + 4, (crestRadius - 4) * 2, (crestRadius - 4) * 2);
      ctx.restore();
    } else {
      // Vector Mortarboard (Graduation Cap) & Open Book
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      // Cap diamond
      ctx.moveTo(crestCenterX, crestCenterY - 14);
      ctx.lineTo(crestCenterX + 22, crestCenterY - 4);
      ctx.lineTo(crestCenterX, crestCenterY + 6);
      ctx.lineTo(crestCenterX - 22, crestCenterY - 4);
      ctx.closePath();
      ctx.fill();
      // Cap base & tassel
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(crestCenterX - 11, crestCenterY - 2, 22, 6);
      ctx.beginPath();
      ctx.moveTo(crestCenterX, crestCenterY - 4);
      ctx.lineTo(crestCenterX + 20, crestCenterY + 12);
      ctx.strokeStyle = '#fce7a1';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Open book underneath
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(crestCenterX - 18, crestCenterY + 18);
      ctx.quadraticCurveTo(crestCenterX - 9, crestCenterY + 14, crestCenterX, crestCenterY + 18);
      ctx.quadraticCurveTo(crestCenterX + 9, crestCenterY + 14, crestCenterX + 18, crestCenterY + 18);
      ctx.stroke();
    }

    // Motto text under Crest
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8c973';
    ctx.font = '600 13px "Cinzel", "Georgia", serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('Learning Today • Leading Tomorrow', crestCenterX, crestCenterY + crestRadius + 18);
    ctx.restore();

    // B. Center School Title & Subtitle
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px "Montserrat", "Arial Black", sans-serif';
    ctx.letterSpacing = '3px';
    // Subtle text shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillText(schoolName.toUpperCase(), W / 2, headerY + 28);
    ctx.shadowColor = 'transparent';

    // Subtitle flanked by golden lines: — JUNIOR SECONDARY SCHOOL —
    const schoolSub = schoolSubtitle || 'JUNIOR SECONDARY SCHOOL';
    ctx.fillStyle = '#fce7a1';
    ctx.font = '700 19px "Cinzel", "Times New Roman", serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(schoolSub.toUpperCase(), W / 2, headerY + 60);

    // Flanking horizontal gold rules with diamond ends
    const subTextW = ctx.measureText(schoolSub.toUpperCase()).width;
    const ruleLeft = W / 2 - subTextW / 2 - 25;
    const ruleRight = W / 2 + subTextW / 2 + 25;
    const ruleLength = 160;

    const leftRuleGrad = ctx.createLinearGradient(ruleLeft - ruleLength, 0, ruleLeft, 0);
    leftRuleGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
    leftRuleGrad.addColorStop(1, '#d4af37');
    ctx.strokeStyle = leftRuleGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ruleLeft - ruleLength, headerY + 54);
    ctx.lineTo(ruleLeft, headerY + 54);
    ctx.stroke();

    const rightRuleGrad = ctx.createLinearGradient(ruleRight, 0, ruleRight + ruleLength, 0);
    rightRuleGrad.addColorStop(0, '#d4af37');
    rightRuleGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.strokeStyle = rightRuleGrad;
    ctx.beginPath();
    ctx.moveTo(ruleRight, headerY + 54);
    ctx.lineTo(ruleRight + ruleLength, headerY + 54);
    ctx.stroke();

    // Diamonds at rule ends
    ctx.fillStyle = '#fff4be';
    [ruleLeft, ruleRight].forEach(rx => {
      ctx.beginPath();
      ctx.moveTo(rx, headerY + 50);
      ctx.lineTo(rx + 4, headerY + 54);
      ctx.lineTo(rx, headerY + 58);
      ctx.lineTo(rx - 4, headerY + 54);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // C. Top Right Quote
    if (topQuote) {
      ctx.save();
      const quoteX = innerX + innerW - 80;
      ctx.textAlign = 'right';

      // Diamond ornament above quote
      ctx.fillStyle = '#e8c973';
      ctx.font = '14px sans-serif';
      ctx.fillText('—  ◆  —', quoteX, headerY + 16);

      // Italic gold quote
      ctx.fillStyle = '#fce7a1';
      ctx.font = 'italic 500 24px "Playfair Display", "Cinzel", "Georgia", serif';
      ctx.fillText(`“${topQuote}”`, quoteX, headerY + 50);

      // Fine golden underline
      const qGrad = ctx.createLinearGradient(quoteX - 280, 0, quoteX, 0);
      qGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
      qGrad.addColorStop(1, 'rgba(212, 175, 55, 0.7)');
      ctx.strokeStyle = qGrad;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(quoteX - 300, headerY + 64);
      ctx.lineTo(quoteX, headerY + 64);
      ctx.stroke();
      ctx.restore();
    }

    // ==========================================
    // 6. IMPERIAL 3D GOLDEN CROWN
    // ==========================================
    const crownCenterX = W / 2;
    const crownCenterY = headerY + 98;
    const crownW = 76;
    const crownH = 50;

    ctx.save();
    ctx.translate(crownCenterX, crownCenterY);

    // Crown metallic body gradient
    const crownGrad = ctx.createLinearGradient(-crownW / 2, 0, crownW / 2, 0);
    crownGrad.addColorStop(0, '#b8861e');
    crownGrad.addColorStop(0.25, '#ffe596');
    crownGrad.addColorStop(0.5, '#ffffff');
    crownGrad.addColorStop(0.75, '#ffe596');
    crownGrad.addColorStop(1, '#946614');

    // Crown Body Path (5 peaks with curved arches between)
    ctx.beginPath();
    ctx.moveTo(-crownW / 2, 0);
    ctx.lineTo(-crownW / 2 - 4, -crownH * 0.7); // Left peak
    ctx.quadraticCurveTo(-crownW * 0.35, -crownH * 0.35, -crownW * 0.22, -crownH * 0.82); // Mid-left peak
    ctx.quadraticCurveTo(-crownW * 0.1, -crownH * 0.45, 0, -crownH); // Center high peak
    ctx.quadraticCurveTo(crownW * 0.1, -crownH * 0.45, crownW * 0.22, -crownH * 0.82); // Mid-right peak
    ctx.quadraticCurveTo(crownW * 0.35, -crownH * 0.35, crownW / 2 + 4, -crownH * 0.7); // Right peak
    ctx.lineTo(crownW / 2, 0);
    ctx.closePath();

    ctx.fillStyle = crownGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#fff8d6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Golden pearls at each of the 5 peak tips
    const pearlPoints = [
      { x: -crownW / 2 - 4, y: -crownH * 0.7, r: 4.5 },
      { x: -crownW * 0.22, y: -crownH * 0.82, r: 5 },
      { x: 0, y: -crownH - 1, r: 6.5 },
      { x: crownW * 0.22, y: -crownH * 0.82, r: 5 },
      { x: crownW / 2 + 4, y: -crownH * 0.7, r: 4.5 },
    ];

    pearlPoints.forEach(p => {
      const pGrad = ctx.createRadialGradient(p.x - 1.5, p.y - 1.5, 0.5, p.x, p.y, p.r);
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(0.4, '#fff3b8');
      pGrad.addColorStop(1, '#c59428');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Crown Base Headband with Jewels
    ctx.fillStyle = crownGrad;
    ctx.beginPath();
    ctx.roundRect(-crownW / 2 - 2, 0, crownW + 4, 12, 3);
    ctx.fill();
    ctx.strokeStyle = '#7c530c';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Inset gemstones on headband (alternating ruby and sapphire)
    [-24, -12, 0, 12, 24].forEach((jx, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#dc2626' : '#2563eb';
      ctx.beginPath();
      ctx.arc(jx, 6, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.restore();

    // ==========================================
    // 7. 3D GOLDEN RIBBON BANNER
    // ==========================================
    const bannerCenterY = headerY + 118;
    const bannerH = 84;

    const mainBannerTitle = monthYear 
      ? `STUDENTS OF THE MONTH • ${monthYear.toUpperCase()}`
      : 'STUDENTS OF THE MONTH';

    ctx.font = '900 38px "Cinzel", "Times New Roman", serif';
    ctx.letterSpacing = '4px';
    const measuredBannerTextW = ctx.measureText(mainBannerTitle).width;
    const bannerW = Math.max(1360, measuredBannerTextW + 180);
    const bannerX = W / 2 - bannerW / 2;

    ctx.save();
    // A. Left Ribbon Tail
    ctx.fillStyle = '#6e4708'; // Dark back fold shadow
    ctx.beginPath();
    ctx.moveTo(bannerX, bannerCenterY + 16);
    ctx.lineTo(bannerX - 35, bannerCenterY + 28);
    ctx.lineTo(bannerX, bannerCenterY + bannerH - 8);
    ctx.closePath();
    ctx.fill();

    const leftTailGrad = ctx.createLinearGradient(bannerX - 90, 0, bannerX, 0);
    leftTailGrad.addColorStop(0, '#ab791c');
    leftTailGrad.addColorStop(0.6, '#ffd978');
    leftTailGrad.addColorStop(1, '#8f6112');
    ctx.fillStyle = leftTailGrad;
    ctx.beginPath();
    ctx.moveTo(bannerX - 15, bannerCenterY + 14);
    ctx.lineTo(bannerX - 85, bannerCenterY + 14);
    ctx.lineTo(bannerX - 55, bannerCenterY + bannerH / 2 + 14); // Swallowtail notch
    ctx.lineTo(bannerX - 85, bannerCenterY + bannerH + 14);
    ctx.lineTo(bannerX - 15, bannerCenterY + bannerH + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5a3d07';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // B. Right Ribbon Tail
    ctx.fillStyle = '#6e4708';
    ctx.beginPath();
    ctx.moveTo(bannerX + bannerW, bannerCenterY + 16);
    ctx.lineTo(bannerX + bannerW + 35, bannerCenterY + 28);
    ctx.lineTo(bannerX + bannerW, bannerCenterY + bannerH - 8);
    ctx.closePath();
    ctx.fill();

    const rightTailGrad = ctx.createLinearGradient(bannerX + bannerW, 0, bannerX + bannerW + 90, 0);
    rightTailGrad.addColorStop(0, '#8f6112');
    rightTailGrad.addColorStop(0.4, '#ffd978');
    rightTailGrad.addColorStop(1, '#ab791c');
    ctx.fillStyle = rightTailGrad;
    ctx.beginPath();
    ctx.moveTo(bannerX + bannerW + 15, bannerCenterY + 14);
    ctx.lineTo(bannerX + bannerW + 85, bannerCenterY + 14);
    ctx.lineTo(bannerX + bannerW + 55, bannerCenterY + bannerH / 2 + 14); // Swallowtail notch
    ctx.lineTo(bannerX + bannerW + 85, bannerCenterY + bannerH + 14);
    ctx.lineTo(bannerX + bannerW + 15, bannerCenterY + bannerH + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5a3d07';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // C. Main Ribbon Body (Reflective Gold Metallic Sheen)
    const ribbonGrad = ctx.createLinearGradient(bannerX, 0, bannerX + bannerW, 0);
    ribbonGrad.addColorStop(0, '#9e6e18');
    ribbonGrad.addColorStop(0.12, '#e0b553');
    ribbonGrad.addColorStop(0.32, '#fff4be');
    ribbonGrad.addColorStop(0.50, '#ffffff');
    ribbonGrad.addColorStop(0.68, '#fff4be');
    ribbonGrad.addColorStop(0.88, '#e0b553');
    ribbonGrad.addColorStop(1, '#9e6e18');

    // Deep drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;

    const ribRadius = 14;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerCenterY, bannerW, bannerH, ribRadius);
    ctx.fillStyle = ribbonGrad;
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Double Golden Rim on Ribbon
    ctx.strokeStyle = '#7c530c';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bannerX + 3.5, bannerCenterY + 3.5, bannerW - 7, bannerH - 7, ribRadius - 2);
    ctx.stroke();

    // D. Ribbon Embossed Title: "STUDENTS OF THE MONTH • [MONTH YEAR]"
    ctx.textAlign = 'center';
    ctx.font = '900 38px "Cinzel", "Times New Roman", serif';
    ctx.letterSpacing = '4px';

    // 3D Emboss highlight under text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText(mainBannerTitle, W / 2 + 1.5, bannerCenterY + 54.5);

    // Embossed deep midnight navy text
    ctx.fillStyle = '#061326';
    ctx.fillText(mainBannerTitle, W / 2, bannerCenterY + 53);

    // E. Banner Subtitle Underneath: "★  EXCELLENCE IN EVERY AREA  ★"
    if (bannerSubtitle) {
      ctx.fillStyle = '#fce7a1';
      ctx.font = 'bold 20px "Cinzel", "Georgia", serif';
      ctx.letterSpacing = '4px';
      ctx.fillText(`★   ${bannerSubtitle.toUpperCase()}   ★`, W / 2, bannerCenterY + bannerH + 30);
    }
    ctx.restore();

    // ==========================================
    // 8. HELPER: DRAW PHOTOREALISTIC PLAQUE CARD
    // ==========================================
    const renderPlaqueCard = (
      role: AwardRoleConfig,
      cardX: number,
      cardY: number,
      cardW: number,
      cardH: number,
      isSmallMode: boolean = false
    ) => {
      ctx.save();

      // Chamfer size for notched corner polygon
      const chamfer = isSmallMode ? 16 : 22;

      // Card Chamfered Path Helper
      const traceChamferedCard = (x: number, y: number, w: number, h: number, c: number) => {
        ctx.beginPath();
        ctx.moveTo(x + c, y);
        ctx.lineTo(x + w - c, y);
        ctx.lineTo(x + w, y + c);
        ctx.lineTo(x + w, y + h - c);
        ctx.lineTo(x + w - c, y + h);
        ctx.lineTo(x + c, y + h);
        ctx.lineTo(x, y + h - c);
        ctx.lineTo(x, y + c);
        ctx.closePath();
      };

      // 1. Realistic Outer Drop Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;

      // 2. Outer 3D Gold Bevel Border
      const cardGoldGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      cardGoldGrad.addColorStop(0, '#fff4c2');
      cardGoldGrad.addColorStop(0.25, '#d4af37');
      cardGoldGrad.addColorStop(0.7, '#885c13');
      cardGoldGrad.addColorStop(1, '#f7dc92');

      traceChamferedCard(cardX, cardY, cardW, cardH, chamfer);
      ctx.fillStyle = cardGoldGrad;
      ctx.fill();

      ctx.shadowColor = 'transparent';

      // 3. Dark Grooved Inset Line
      const grooveInset = isSmallMode ? 3.5 : 4.5;
      traceChamferedCard(
        cardX + grooveInset,
        cardY + grooveInset,
        cardW - 2 * grooveInset,
        cardH - 2 * grooveInset,
        chamfer - 2
      );
      ctx.strokeStyle = '#061224';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Soft Ivory / Cream Porcelain Inner Body
      const innerBorder = isSmallMode ? 6 : 8;
      const innerCardX = cardX + innerBorder;
      const innerCardY = cardY + innerBorder;
      const innerCardW = cardW - 2 * innerBorder;
      const innerCardH = cardH - 2 * innerBorder;

      traceChamferedCard(innerCardX, innerCardY, innerCardW, innerCardH, chamfer - 4);
      const porcelainGrad = ctx.createLinearGradient(innerCardX, innerCardY, innerCardX, innerCardY + innerCardH);
      porcelainGrad.addColorStop(0, '#ffffff');   // Pure bright porcelain top
      porcelainGrad.addColorStop(0.5, '#f9fafb'); // Soft ivory
      porcelainGrad.addColorStop(1, '#edf0f4');   // Gentle cool base
      ctx.fillStyle = porcelainGrad;
      ctx.fill();

      // Fine golden inner fillet stroke
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ==========================================
      // TOP CATEGORY BADGE (Header Bar Capsule)
      // ==========================================
      const badgeH = isSmallMode ? 46 : 56;
      const badgeMargin = isSmallMode ? 10 : 14;
      const badgeX = innerCardX + badgeMargin;
      const badgeY = innerCardY + badgeMargin;
      const badgeW = innerCardW - 2 * badgeMargin;
      const badgeR = 14;

      // Colored Capsule with Luxury Gradient
      const baseColor = role.badgeColor || '#1A56DB';
      const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
      badgeGrad.addColorStop(0, baseColor);
      badgeGrad.addColorStop(1, '#0b1626'); // Dark shaded base for depth

      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
      ctx.fillStyle = badgeGrad;
      ctx.fill();

      // Fine gold border around category capsule
      ctx.strokeStyle = '#e5c065';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Left Circular Icon Medallion
      const medDiam = isSmallMode ? 34 : 42;
      const medX = badgeX + (isSmallMode ? 8 : 10);
      const medY = badgeY + (badgeH - medDiam) / 2;
      const medCX = medX + medDiam / 2;
      const medCY = medY + medDiam / 2;

      // Medallion Gold Outer Ring
      ctx.beginPath();
      ctx.arc(medCX, medCY, medDiam / 2, 0, Math.PI * 2);
      ctx.fillStyle = cardGoldGrad;
      ctx.fill();

      // Medallion Porcelain White Base
      ctx.beginPath();
      ctx.arc(medCX, medCY, medDiam / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Vector Icon / Symbol
      ctx.fillStyle = baseColor;
      ctx.textAlign = 'center';
      ctx.font = isSmallMode ? 'bold 17px sans-serif' : 'bold 22px sans-serif';

      let iconText = '★';
      if (role.id === 'math') iconText = '∑';
      else if (role.id === 'pen') iconText = '✒';
      else if (role.id === 'quran') iconText = '📖';
      else if (role.id === 'hadith') iconText = '🕌';
      else if (role.id === 'arabiyyah') iconText = 'ض';
      else if (role.id === 'model') iconText = '⭐';
      else if (role.id === 'time') iconText = '⏱';
      else if (role.id === 'neat') iconText = '✨';
      else if (role.id === 'persuader') iconText = '📢';
      else if (role.id === 'language') iconText = '🌐';
      else if (role.id === 'analytical') iconText = '💡';

      ctx.fillText(iconText, medCX, medCY + (isSmallMode ? 6 : 7.5));

      // Right Header Category Text
      const textStartX = medX + medDiam + (isSmallMode ? 8 : 12);
      ctx.textAlign = 'left';

      // English Title
      ctx.fillStyle = '#ffffff';
      ctx.font = isSmallMode
        ? 'bold 14px "Montserrat", sans-serif'
        : 'bold 16px "Montserrat", sans-serif';
      ctx.letterSpacing = '0.5px';
      ctx.fillText(role.defaultTitle.toUpperCase(), textStartX, badgeY + (isSmallMode ? 19 : 24));

      // Arabic Subtitle
      ctx.fillStyle = '#fde68a'; // Soft cream gold
      ctx.font = isSmallMode
        ? 'bold 15px "Amiri", "Traditional Arabic", serif'
        : 'bold 17px "Amiri", "Traditional Arabic", serif';
      ctx.letterSpacing = '0px';
      ctx.fillText(role.arabicTitle, textStartX, badgeY + (isSmallMode ? 36 : 46));

      // ==========================================
      // STUDENT PORTRAIT PHOTO
      // ==========================================
      const photoMargin = isSmallMode ? 12 : 16;
      const photoX = innerCardX + photoMargin;
      const photoY = badgeY + badgeH + (isSmallMode ? 10 : 16);
      const photoW = innerCardW - 2 * photoMargin;
      const photoH = isSmallMode ? 250 : 420;
      const photoR = 14;

      // 3D Gold Frame Border for Photo
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, photoR);
      ctx.fillStyle = cardGoldGrad;
      ctx.fill();

      // Photo Inner Container
      const photoBorder = 3;
      const innerPhotoX = photoX + photoBorder;
      const innerPhotoY = photoY + photoBorder;
      const innerPhotoW = photoW - 2 * photoBorder;
      const innerPhotoH = photoH - 2 * photoBorder;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(innerPhotoX, innerPhotoY, innerPhotoW, innerPhotoH, photoR - 2);
      ctx.clip();

      const studentImg = photoImages[role.id];
      if (studentImg) {
        // High Quality Aspect-Ratio Cover Drawing
        const sRatio = studentImg.width / studentImg.height;
        const tRatio = innerPhotoW / innerPhotoH;
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
          innerPhotoX, innerPhotoY, innerPhotoW, innerPhotoH
        );
      } else {
        // Elegant Studio Silhouette Placeholder
        const phGrad = ctx.createLinearGradient(innerPhotoX, innerPhotoY, innerPhotoX, innerPhotoY + innerPhotoH);
        phGrad.addColorStop(0, '#e2e8f0');
        phGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = phGrad;
        ctx.fillRect(innerPhotoX, innerPhotoY, innerPhotoW, innerPhotoH);

        // Circular monogram
        const avatarCX = innerPhotoX + innerPhotoW / 2;
        const avatarCY = innerPhotoY + innerPhotoH / 2 - 10;
        ctx.beginPath();
        ctx.arc(avatarCX, avatarCY, 42, 0, Math.PI * 2);
        ctx.fillStyle = '#0f274e';
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#fff4be';
        ctx.textAlign = 'center';
        ctx.font = 'bold 32px "Montserrat", sans-serif';
        const initials = role.studentName
          ? role.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
          : '?';
        ctx.fillText(initials, avatarCX, avatarCY + 11);
      }
      ctx.restore();

      // ==========================================
      // STUDENT NAME PILL (Midnight Navy + Gold Rim)
      // ==========================================
      const pillMargin = isSmallMode ? 8 : 14;
      const pillW = innerCardW - 2 * pillMargin;
      const pillH = isSmallMode ? 40 : 48;
      const pillX = innerCardX + pillMargin;
      const pillY = photoY + photoH + (isSmallMode ? 9 : 16);
      const pillR = pillH / 2;

      ctx.save();
      // Drop shadow for pill
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
      pillGrad.addColorStop(0, '#0a2142');
      pillGrad.addColorStop(1, '#040e1c');

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
      ctx.fillStyle = pillGrad;
      ctx.fill();

      ctx.shadowColor = 'transparent';

      // Metallic Gold Border
      ctx.strokeStyle = cardGoldGrad;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Sanitize student name (fix comma typos like "Muh,d" -> "Muh'd")
      const rawName = role.studentName || 'STUDENT NAME';
      const sanitizedName = rawName
        .replace(/([a-zA-Z]),([a-zA-Z])/g, "$1'$2")
        .trim()
        .toUpperCase();

      // Dynamic font sizing for student name to prevent pill edge collision
      let nameFontSize = isSmallMode ? 15 : 18;
      ctx.font = `bold ${nameFontSize}px "Montserrat", "Arial", sans-serif`;
      const maxTextWidth = pillW - 16;
      const textW = ctx.measureText(sanitizedName).width;

      if (textW > maxTextWidth) {
        nameFontSize = Math.max(isSmallMode ? 11 : 13, Math.floor(nameFontSize * (maxTextWidth / textW)));
        ctx.font = `bold ${nameFontSize}px "Montserrat", "Arial", sans-serif`;
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '0.5px';
      ctx.fillText(sanitizedName, innerCardX + innerCardW / 2, pillY + (isSmallMode ? 25 : 30));
      ctx.restore();

      // ==========================================
      // CLASS LABEL (Resting on Ivory Plaque Base)
      // ==========================================
      const classY = pillY + pillH + (isSmallMode ? 24 : 28);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#7a510c'; // Warm bronze gold text on porcelain
      ctx.font = isSmallMode
        ? 'bold 15px "Cinzel", "Georgia", serif'
        : 'bold 17px "Cinzel", "Georgia", serif';
      ctx.letterSpacing = '2px';
      ctx.fillText((role.studentClass || 'CLASS ARM').toUpperCase(), innerCardX + innerCardW / 2, classY);

      ctx.restore();
    };

    // ==========================================
    // 9. LAYOUT & CARD POSITIONING
    // ==========================================
    if (is5Card) {
      // 5 Spotlight Cards Across
      const numCards = 5;
      const cardW = 404;
      const cardH = 780;
      const totalCardsW = numCards * cardW;
      const availableSpace = innerW - 140; // margins
      const gap = (availableSpace - totalCardsW) / (numCards - 1);
      const startX = innerX + 70;
      const cardsY = bannerCenterY + bannerH + 52;

      activeRoles.slice(0, 5).forEach((role, idx) => {
        const cx = startX + idx * (cardW + gap);
        renderPlaqueCard(role, cx, cardsY, cardW, cardH, false);
      });
    } else {
      // 9 Cards Layout (Row 1: 5 cards, Row 2: 4 cards centered)
      const cardW = 394;
      const cardH = 490;
      const gapX = 36;
      const gapY = 48; // Generous 48px vertical separation between rows

      // Row 1 (5 cards)
      const row1Count = 5;
      const row1W = row1Count * cardW + (row1Count - 1) * gapX;
      const row1StartX = (W - row1W) / 2;
      const row1Y = bannerCenterY + bannerH + 46;

      activeRoles.slice(0, 5).forEach((role, idx) => {
        const cx = row1StartX + idx * (cardW + gapX);
        renderPlaqueCard(role, cx, row1Y, cardW, cardH, true);
      });

      // Row 2 (4 cards centered)
      const row2Count = Math.min(4, activeRoles.length - 5);
      if (row2Count > 0) {
        const row2W = row2Count * cardW + (row2Count - 1) * gapX;
        const row2StartX = (W - row2W) / 2;
        const row2Y = row1Y + cardH + gapY;

        activeRoles.slice(5, 5 + row2Count).forEach((role, idx) => {
          const cx = row2StartX + idx * (cardW + gapX);
          renderPlaqueCard(role, cx, row2Y, cardW, cardH, true);
        });
      }
    }

    // ==========================================
    // 10. BOTTOM FOOTER BLESSING & DUA
    // ==========================================
    const footerY = innerY + innerH - 38;
    ctx.save();
    ctx.textAlign = 'center';

    // Ornate Golden Centerpiece Flourish
    ctx.fillStyle = '#e8c973';
    ctx.font = '16px sans-serif';
    ctx.fillText('—  ❖  —', W / 2, footerY - 26);

    // Dua Text
    ctx.fillStyle = '#fce7a1';
    ctx.font = 'italic 600 21px "Cinzel", "Amiri", "Traditional Arabic", serif';
    ctx.letterSpacing = '1.5px';
    ctx.fillText(bottomDua, W / 2, footerY);

    ctx.restore();

    setIsCanvasReady(true);
  }, [layoutMode, monthYear, bannerSubtitle, topQuote, bottomDua, selected5RoleIds, roleAssignments, logoSrc, schoolName, schoolSubtitle]);

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
                  Live Plaque Canvas Rendering ({layoutMode === '5-card' ? '2400 × 1500 px' : '2400 × 1720 px'})
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
