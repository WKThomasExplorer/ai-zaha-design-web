'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Sparkles, Home, Globe, ChevronRight, CheckCircle2, ArrowRight, RotateCcw, User, LogOut, Upload, Palette, Wand2, Menu, Check, Star, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/image-upload';
import { DescriptionInput } from '@/components/description-input';
import { LoadingState } from '@/components/loading-state';
import { ResultViewer } from '@/components/result-viewer';
import { useAuth } from '@/context/auth-context';
import type { UploadedImage, GenerationResult } from '@/types';
import Image from 'next/image';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GLSLHills } from '@/components/ui/glsl-hills';
import { usePostHog } from 'posthog-js/react';

type AppState = 
  | 'IDLE' 
  | 'UPLOADED' 
  | 'GENERATING_EFFECT' 
  | 'EFFECT_READY' 
  | 'GENERATING_EXPLOSION' 
  | 'COMPLETED' 
  | 'ERROR';

// Prompt for explosion diagram generation
const EXPLOSION_PROMPT = `You are a professional building facade renovation expert. Please analyze this image and generate an explosion diagram showing the main components and materials used in the building facade. Mark the materials on the diagram. Please use English for all text on the diagram.`;

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

export default function HomeDesignPage() {
  const { user, loading, logout } = useAuth();
  const posthog = usePostHog();
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [effectImageUrl, setEffectImageUrl] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const isZh = language === 'zh';
  const t = useCallback((en: string, zh: string) => (isZh ? zh : en), [isZh]);
  const [heroCarouselApi, setHeroCarouselApi] = useState<CarouselApi | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileHint, setTurnstileHint] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadMessage, setLeadMessage] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const isGeneratingEffectRef = useRef(false);
  const isGeneratingExplosionRef = useRef(false);
  const effectRequestIdRef = useRef(0);
  const explosionRequestIdRef = useRef(0);

  const heroSlides = [
    {
      label: 'Modern Farmhouse',
      beforePrompt:
        'front view photo of a typical american suburban two story house, neutral exterior, daylight, real estate photography, high detail',
      afterPrompt:
        'modern farmhouse home facade renovation, white board and batten siding, black metal window frames, natural wood porch, standing seam metal roof accents, warm welcoming, golden hour, photorealistic, high detail',
    },
    {
      label: 'Japanese Zen',
      beforePrompt:
        'front view photo of a typical american suburban house exterior, daylight, neutral facade, real estate photography, high detail',
      afterPrompt:
        'japanese zen modern home facade renovation, dark horizontal wood slats, exposed concrete accents, minimal landscaping, low horizontal lines, calm atmosphere, soft daylight, photorealistic, high detail',
    },
    {
      label: 'Coastal Hamptons',
      beforePrompt:
        'front view photo of a typical american coastal house exterior, daylight, neutral facade, real estate photography, high detail',
      afterPrompt:
        'coastal hamptons style home facade renovation, white cedar shingle siding, white shutters, navy blue front door, wide porch with white columns, hydrangea landscaping, bright afternoon light, photorealistic, high detail',
    },
  ] as const;

  const styleShowcaseCards = [
    {
      id: 'modern-farmhouse',
      name: 'Modern Farmhouse',
      description: 'Bright, warm curb appeal that feels instantly premium for suburban homes.',
      prompt:
        'modern farmhouse home facade renovation, white board and batten siding, black metal window frames, natural wood porch, standing seam metal roof accents, warm welcoming, golden hour, photorealistic, high detail',
      imagePrompt:
        'modern farmhouse home facade renovation, white board and batten siding, black metal window frames, natural wood porch, standing seam metal roof accents, warm welcoming, golden hour, photorealistic, high detail',
    },
    {
      id: 'japanese-zen',
      name: 'Japanese Zen',
      description: 'Clean lines, calm materials, and a minimalist entry that feels expensive.',
      prompt:
        'japanese zen modern home facade renovation, dark horizontal wood slats, exposed concrete accents, minimal landscaping, low horizontal lines, calm atmosphere, soft daylight, photorealistic, high detail',
      imagePrompt:
        'japanese zen modern home facade renovation, dark horizontal wood slats, exposed concrete accents, minimal landscaping, low horizontal lines, calm atmosphere, soft daylight, photorealistic, high detail',
    },
    {
      id: 'coastal-hamptons',
      name: 'Coastal Hamptons',
      description: 'Light, airy, and timeless—perfect for coastal or bright-sun neighborhoods.',
      prompt:
        'coastal hamptons style home facade renovation, white cedar shingle siding, white shutters, navy blue front door, wide porch with white columns, hydrangea landscaping, bright afternoon light, photorealistic, high detail',
      imagePrompt:
        'coastal hamptons style home facade renovation, white cedar shingle siding, white shutters, navy blue front door, wide porch with white columns, hydrangea landscaping, bright afternoon light, photorealistic, high detail',
    },
    {
      id: 'scandinavian-minimal',
      name: 'Scandinavian Minimal',
      description: 'Soft neutrals + warm wood details for a modern, sellable exterior upgrade.',
      prompt:
        'scandinavian minimalist home facade renovation, light grey and white exterior, large floor to ceiling glass, flat or low slope roof, warm natural wood entry detail, clean landscaping, soft overcast daylight, photorealistic, high detail',
      imagePrompt:
        'scandinavian minimalist home facade renovation, light grey and white exterior, large floor to ceiling glass, flat or low slope roof, warm natural wood entry detail, clean landscaping, soft overcast daylight, photorealistic, high detail',
    },
    {
      id: 'mediterranean-revival',
      name: 'Mediterranean Revival',
      description: 'Arches, stucco, and terracotta tones that make older homes feel refreshed.',
      prompt:
        'mediterranean revival home facade renovation, terracotta barrel tile roof, warm creamy stucco walls, arched entry, wrought iron details, stone accents, lush landscaping, golden hour, photorealistic, high detail',
      imagePrompt:
        'mediterranean revival home facade renovation, terracotta barrel tile roof, warm creamy stucco walls, arched entry, wrought iron details, stone accents, lush landscaping, golden hour, photorealistic, high detail',
    },
    {
      id: 'industrial-loft',
      name: 'Industrial Loft',
      description: 'Bold contrast and modern materials for urban-looking, statement facades.',
      prompt:
        'industrial loft style home facade renovation, dark grey concrete texture, exposed brick accents, black steel canopy, asymmetrical facade composition, large black framed windows, moody overcast light, photorealistic, high detail',
      imagePrompt:
        'industrial loft style home facade renovation, dark grey concrete texture, exposed brick accents, black steel canopy, asymmetrical facade composition, large black framed windows, moody overcast light, photorealistic, high detail',
    },
  ] as const;

  const buildHeroImage = useCallback((prompt: string) => {
    const encoded = encodeURIComponent(prompt);
    return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encoded}&image_size=landscape_16_9`;
  }, []);

  const buildSocialProofImage = useCallback((prompt: string) => {
    const encoded = encodeURIComponent(prompt);
    return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encoded}&image_size=landscape_4_3`;
  }, []);

  const scrollToGenerator = useCallback(() => {
    document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToSocialProof = useCallback(() => {
    document.getElementById('social-proof')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToStyles = useCallback(() => {
    document.getElementById('styles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToHowItWorks = useCallback(() => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToPricing = useCallback(() => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToFaq = useCallback(() => {
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleStyleShowcasePick = useCallback(
    (prompt: string) => {
      localStorage.setItem('design_description', prompt);
      window.dispatchEvent(new CustomEvent('prefillDescription', { detail: { value: prompt } }));
      scrollToGenerator();
    },
    [scrollToGenerator]
  );

  useEffect(() => {
    if (!heroCarouselApi) return;
    const intervalId = window.setInterval(() => {
      heroCarouselApi.scrollNext();
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, [heroCarouselApi]);

  // Handle image upload
  const handleImageUploaded = useCallback((image: UploadedImage) => {
    setUploadedImage(image);
    setLeadEmail('');
    setLeadMessage(null);
    setAppState('UPLOADED');

    posthog?.capture('upload_completed', {
      is_logged_in: Boolean(user),
      width: image.width,
      height: image.height,
    });
  }, [posthog, user]);

  // Generate effect image only
  const generateEffectImage = useCallback(async () => {
    if (!uploadedImage || isGeneratingEffectRef.current) return;

    const isAnonymous = !user;
    if (isAnonymous) {
      if (!TURNSTILE_SITE_KEY) {
        setError(t('Verification is not configured. Please try again later.', '人机验证未配置，请稍后重试。'));
        setAppState('ERROR');
        return;
      }
      if (!turnstileToken) {
        setTurnstileHint(t('Please complete human verification before generating.', '请先完成人机验证再生成。'));
        return;
      }
    }

    isGeneratingEffectRef.current = true;
    const requestId = ++effectRequestIdRef.current;

    const descText = localStorage.getItem('design_description') || 'modern facade renovation';
    setTurnstileHint(null);
    setAppState('GENERATING_EFFECT');
    setProgress(0);

    try {
      posthog?.capture('effect_generate_started', {
        is_anonymous: isAnonymous,
      });
      setProgress(20);
      const imageBase64 = uploadedImage.preview;
      setProgress(40);

      const token = localStorage.getItem('auth_token');
      const effectResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          imageBase64,
          description: descText,
          type: 'effect',
          turnstileToken: isAnonymous ? turnstileToken : undefined,
        }),
      });

      const effectData = await effectResponse.json();

      if (!effectData.success) {
        if (effectResponse.status === 403 || effectResponse.status === 429) {
          setTurnstileToken('');
          turnstileRef.current?.reset();
        }
        throw new Error(effectData.error || t('Failed to generate effect image', '效果图生成失败'));
      }

      if (effectRequestIdRef.current === requestId) {
        setProgress(100);
        setEffectImageUrl(effectData.imageUrl);
        setAppState('EFFECT_READY');
        posthog?.capture('effect_generate_succeeded', {
          is_anonymous: isAnonymous,
        });
      }
    } catch (err) {
      console.error('Generation error:', err);
      posthog?.capture('effect_generate_failed', {
        is_anonymous: isAnonymous,
        error: err instanceof Error ? err.message : 'unknown_error',
      });
      if (effectRequestIdRef.current === requestId) {
        setError(err instanceof Error ? err.message : t('Generation failed', '生成失败'));
        setAppState('ERROR');
      }
    } finally {
      if (effectRequestIdRef.current === requestId) {
        isGeneratingEffectRef.current = false;
      }
    }
  }, [posthog, uploadedImage, turnstileToken, t, user]);
  // Generate explosion diagram (after user confirms effect image)
  const generateExplosionDiagram = useCallback(async () => {
    if (!effectImageUrl || isGeneratingExplosionRef.current) return;
    isGeneratingExplosionRef.current = true;
    const requestId = ++explosionRequestIdRef.current;

    setAppState('GENERATING_EXPLOSION');
    setProgress(0);

    try {
      setProgress(20);

      const token = localStorage.getItem('auth_token');
      const explosionResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          effectImageUrl: effectImageUrl,
          description: EXPLOSION_PROMPT,
          type: 'explosion',
        }),
      });

      const explosionData = await explosionResponse.json();

      if (!explosionData.success) {
        throw new Error(explosionData.error || t('Failed to generate explosion diagram', '爆炸图生成失败'));
      }

      setProgress(60);

      // Analyze explosion diagram to extract materials
      let materials = [
        { layer: 'Roof', material: 'Metal tiles' },
        { layer: 'Waterproof', material: 'Modified bitumen' },
        { layer: 'Insulation', material: 'XPS board 50mm' },
        { layer: 'Wall', material: 'Textured paint' },
        { layer: 'Windows', material: 'Aluminum alloy' },
      ];

      try {
        const token = localStorage.getItem('auth_token');
        const analyzeResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            imageUrl: explosionData.imageUrl,
          }),
        });

        const analyzeData = await analyzeResponse.json();

        if (analyzeData.success && analyzeData.materials && analyzeData.materials.length > 0) {
          materials = analyzeData.materials.map((m: { layer: string; material: string }) => ({
            layer: m.layer,
            material: m.material,
          }));
        }
      } catch (analyzeError) {
        console.error('Material analysis failed, using defaults:', analyzeError);
      }

      if (explosionRequestIdRef.current === requestId) {
        setProgress(100);

        posthog?.capture('explosion_generate_succeeded', {
          is_logged_in: Boolean(user),
        });

        // Complete with both images
        setGenerationResult({
          effectImageUrl: effectImageUrl,
          explosionImageUrl: explosionData.imageUrl,
          materials: materials,
        });

        setAppState('COMPLETED');
      }
    } catch (err) {
      console.error('Generation error:', err);
      posthog?.capture('explosion_generate_failed', {
        is_logged_in: Boolean(user),
        error: err instanceof Error ? err.message : 'unknown_error',
      });
      if (explosionRequestIdRef.current === requestId) {
        setError(err instanceof Error ? err.message : t('Generation failed', '生成失败'));
        setAppState('ERROR');
      }
    } finally {
      if (explosionRequestIdRef.current === requestId) {
        isGeneratingExplosionRef.current = false;
      }
    }
  }, [effectImageUrl, posthog, t, user]);
  // Listen for description saved event
  useEffect(() => {
    const handleDescriptionSaved = () => {
      generateEffectImage();
    };

    window.addEventListener('descriptionSaved', handleDescriptionSaved);
    return () => window.removeEventListener('descriptionSaved', handleDescriptionSaved);
  }, [generateEffectImage]);

  // Handle regenerate effect image
  const handleRegenerateEffect = useCallback(() => {
    generateEffectImage();
  }, [generateEffectImage]);

  const submitLeadAndGenerateExplosion = useCallback(async () => {
    const email = leadEmail.trim().toLowerCase();
    if (!email) {
      setLeadMessage(t('Please enter your email to unlock explosion diagram.', '请输入邮箱以解锁爆炸图。'));
      return;
    }

    setLeadSubmitting(true);
    setLeadMessage(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'explosion_unlock',
          prompt: localStorage.getItem('design_description') || null,
          effectImageUrl,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || t('Failed to save your email', '邮箱提交失败'));
      }

      setLeadMessage(t('Thanks! Explosion diagram is unlocking...', '已收到邮箱，正在为你解锁爆炸图...'));
      posthog?.capture('lead_unlock_submitted', {
        source: 'explosion_unlock',
      });
      generateExplosionDiagram();
    } catch (err) {
      posthog?.capture('lead_unlock_failed', {
        source: 'explosion_unlock',
        error: err instanceof Error ? err.message : 'unknown_error',
      });
      setLeadMessage(err instanceof Error ? err.message : t('Failed to save your email', '邮箱提交失败'));
    } finally {
      setLeadSubmitting(false);
    }
  }, [effectImageUrl, generateExplosionDiagram, leadEmail, posthog, t]);
  // Handle confirm and generate explosion
  const handleConfirmEffect = useCallback(() => {
    if (user) {
      posthog?.capture('explosion_generate_requested', {
        is_logged_in: true,
      });
      generateExplosionDiagram();
      return;
    }

    posthog?.capture('unlock_clicked', {
      source: 'effect_ready',
    });
    void submitLeadAndGenerateExplosion();
  }, [generateExplosionDiagram, posthog, submitLeadAndGenerateExplosion, user]);
  // Handle start over
  const handleStartOver = useCallback(() => {
    effectRequestIdRef.current += 1;
    explosionRequestIdRef.current += 1;
    isGeneratingEffectRef.current = false;
    isGeneratingExplosionRef.current = false;
    setAppState('IDLE');
    setUploadedImage(null);
    setEffectImageUrl(null);
    setGenerationResult(null);
    setProgress(0);
    setError(null);
    setTurnstileHint(null);
    setTurnstileToken('');
    setLeadEmail('');
    setLeadSubmitting(false);
    setLeadMessage(null);
    turnstileRef.current?.reset();
    localStorage.removeItem('design_description');
  }, []);

  return (
    <div className="min-h-screen zaha-liquid-bg relative overflow-hidden">
      <div className="curve-decoration -top-24 -left-24 bg-gradient-to-br from-[#00d4aa]/20 to-transparent" />
      <div className="curve-decoration top-1/4 -right-40 w-[640px] h-[640px] bg-gradient-to-bl from-[#0077ff]/12 to-transparent opacity-60" />
      <div className="curve-decoration bottom-16 left-1/3 w-[420px] h-[420px] bg-gradient-to-tr from-[#8b5cf6]/10 to-transparent opacity-40" />
      <div className="curve-decoration top-1/2 left-0 w-[520px] h-[520px] bg-gradient-to-r from-[#00d4aa]/8 to-transparent blur-[90px]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 zaha-glass border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1f36] to-[#2d2a4a] flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-[#1a1f36]">
                    AI Zaha Home Design
                  </h1>
                  <p className="text-xs text-[#2d2a4a]/60">
                    {t('Transform your facade', '重塑你的建筑外立面')}
                  </p>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-3">
              <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
                <NavLink onClick={scrollToGenerator} label={t('Try Free', '免费试用')} />
                {appState === 'IDLE' && (
                  <>
                    <NavLink onClick={scrollToSocialProof} label={t('Transformations', '案例对比')} />
                    <NavLink onClick={scrollToStyles} label={t('Styles', '风格模板')} />
                    <NavLink onClick={scrollToHowItWorks} label={t('How it works', '使用流程')} />
                    <NavLink onClick={scrollToPricing} label={t('Pricing', '价格')} />
                    <NavLink onClick={scrollToFaq} label="FAQ" />
                  </>
                )}
                <Link
                  href="/blog"
                  className="px-3 py-2 rounded-xl text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] hover:bg-[#2d2a4a]/5 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('Facade Tips', '外立面技巧')}</span>
                </Link>
              </nav>

              <div className="hidden sm:flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#2d2a4a]/60" />
                <select
                  aria-label={t('Language', '语言')}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-sm bg-transparent border-none focus:outline-none text-[#2d2a4a]/60 cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              {!loading && (
                <div className="hidden sm:flex items-center gap-2">
                  {user ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00d4aa]/10">
                        <User className="w-4 h-4 text-[#00d4aa]" />
                        <span className="text-sm text-[#00d4aa] font-medium">{user.username}</span>
                      </div>
                      <button
                        onClick={logout}
                        className="p-2 rounded-lg hover:bg-[#2d2a4a]/5 transition-colors text-[#2d2a4a]/60 hover:text-red-500"
                        title={t('Logout', '退出登录')}
                        aria-label={t('Logout', '退出登录')}
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="ghost" size="sm" className="text-[#2d2a4a]/60 hover:text-[#00d4aa]">
                          {t('Login', '登录')}
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button size="sm" className="bg-gradient-to-r from-[#00d4aa] to-[#0077ff] text-white hover:opacity-90">
                          {t('Sign Up', '注册')}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}

              <div className="lg:hidden">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <button
                      className="h-10 w-10 rounded-xl border border-[#2d2a4a]/10 bg-white hover:bg-[#2d2a4a]/5 transition-colors flex items-center justify-center"
                      aria-label={t('Open menu', '打开菜单')}
                    >
                      <Menu className="w-5 h-5 text-[#2d2a4a]/70" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[320px] sm:w-[360px]">
                    <SheetTitle className="text-[#1a1f36]">AI Zaha Home Design</SheetTitle>
                    <div className="mt-6 space-y-2">
                      <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToGenerator(); }} label={t('Try Free', '免费试用')} />
                      {appState === 'IDLE' && (
                        <>
                          <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToSocialProof(); }} label={t('Real Transformations', '真实改造案例')} />
                          <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToStyles(); }} label={t('Styles', '风格模板')} />
                          <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToHowItWorks(); }} label={t('How it works', '使用流程')} />
                          <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToPricing(); }} label={t('Pricing', '价格')} />
                          <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToFaq(); }} label="FAQ" />
                        </>
                      )}
                      <Link href="/blog" onClick={() => setMobileNavOpen(false)} className="block">
                        <div className="px-4 py-3 rounded-xl border border-[#2d2a4a]/10 hover:bg-[#2d2a4a]/5 transition-colors text-sm text-[#1a1f36] flex items-center justify-between">
                          <span>{t('Facade Tips', '外立面技巧')}</span>
                          <ChevronRight className="w-4 h-4 text-[#2d2a4a]/50" />
                        </div>
                      </Link>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-[#2d2a4a]/60">
                        <Globe className="w-4 h-4" />
                        <span>{t('Language', '语言')}</span>
                      </div>
                      <select
                        aria-label={t('Language', '语言')}
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full h-11 rounded-xl border border-[#2d2a4a]/15 bg-white px-3 text-sm text-[#1a1f36] focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/30"
                      >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    {!loading && (
                      <div className="mt-6">
                        {user ? (
                          <div className="flex items-center justify-between rounded-xl border border-[#2d2a4a]/10 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-[#00d4aa]" />
                              <span className="text-sm font-medium text-[#1a1f36]">{user.username}</span>
                            </div>
                            <button
                              onClick={() => { setMobileNavOpen(false); logout(); }}
                              className="p-2 rounded-lg hover:bg-[#2d2a4a]/5 transition-colors text-[#2d2a4a]/60 hover:text-red-500"
                              aria-label={t('Logout', '退出登录')}
                            >
                              <LogOut className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                              <Button variant="outline" className="w-full h-11 rounded-xl border-[#2d2a4a]/20">
                                {t('Login', '登录')}
                              </Button>
                            </Link>
                            <Link href="/register" onClick={() => setMobileNavOpen(false)}>
                              <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#0077ff] text-white hover:opacity-90">
                                {t('Sign Up', '注册')}
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pb-12">
        {/* Intro Section (only show in IDLE state) */}
        {appState === 'IDLE' && (
          <div className="relative mb-16 sm:mb-20 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Dynamic Waves Background for Hero */}
            <div className="absolute -inset-x-20 -inset-y-32 -z-10 pointer-events-none opacity-40">
              <GLSLHills />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full zaha-glass text-sm text-[#2d2a4a]">
                  <Sparkles className="w-4 h-4 text-[#00d4aa]" />
                  <span className="font-medium">{t('No sign up · 30-second preview · Pay only if you love it', '无需注册 · 30 秒预览 · 喜欢再付费')}</span>
                </div>

                <h2 className="text-5xl sm:text-6xl font-bold text-[#1a1f36] leading-[0.98] tracking-tight">
                  {t('Make Your Home', '让你的房子')}
                  <br />
                  <span className="zaha-text-gradient">{t('the Only One on the Block', '成为街区里最出众的一栋')}</span>
                </h2>

                <p className="text-base sm:text-lg text-[#2d2a4a]/70 max-w-xl leading-relaxed">
                  {t('Upload a photo, choose a style, and get a professional facade redesign preview in under 30 seconds.', '上传照片、选择风格，30 秒内获得专业级外立面改造预览。')}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={scrollToGenerator}
                    className="h-12 sm:h-14 px-7 sm:px-8 rounded-full font-semibold transition-all duration-500 bg-gradient-to-r from-[#1a1f36] to-[#2d2a4a] hover:shadow-[0_0_30px_rgba(0,212,170,0.25)] text-white"
                  >
                    {t('Try Free — No Sign Up', '免费试用 — 无需注册')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    onClick={scrollToSocialProof}
                    variant="outline"
                    className="h-12 sm:h-14 px-7 sm:px-8 rounded-full font-semibold border-[#1a1f36]/15 text-[#1a1f36] bg-white/50 hover:bg-white/70"
                  >
                    {t('See Real Transformations', '查看真实改造案例')}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 rounded-full zaha-glass text-xs text-[#2d2a4a]/70">
                    {t('Works best with a straight-on front photo', '正面拍摄的外立面照片效果最佳')}
                  </div>
                  <div className="px-3 py-1.5 rounded-full zaha-glass text-xs text-[#2d2a4a]/70">
                    {t('No subscription', '无需订阅')}
                  </div>
                  <div className="px-3 py-1.5 rounded-full zaha-glass text-xs text-[#2d2a4a]/70">
                    {t('Instant download after unlock', '解锁后即时下载')}
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-[#00d4aa]/25 to-[#0077ff]/25 blur-[80px] opacity-70" />
                <div className="relative rounded-[40px] zaha-glass border border-white/50 shadow-2xl overflow-hidden">
                  <Carousel
                    setApi={setHeroCarouselApi}
                    opts={{ loop: true, align: 'start' }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {heroSlides.map((slide, idx) => (
                        <CarouselItem key={slide.label}>
                          <div className="p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-sm font-semibold text-[#1a1f36] tracking-tight">{slide.label}</div>
                              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#2d2a4a]/60">
                                {t('Before / After', '改造前 / 改造后')}
                              </div>
                            </div>
                            <BeforeAfterCard
                              beforeSrc={buildHeroImage(slide.beforePrompt)}
                              afterSrc={buildHeroImage(slide.afterPrompt)}
                              priority={idx === 0}
                              beforeLabel={t('Before', '改造前')}
                              afterLabel={t('After', '改造后')}
                              compareAria={t('Compare before and after', '对比改造前后')}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-3" />
                    <CarouselNext className="right-3" />
                  </Carousel>
                </div>
              </div>
            </div>
          </div>
        )}

        {appState === 'IDLE' && (
          <section id="social-proof" className="mb-16 sm:mb-20">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-[#1a1f36] tracking-tight">{t('Real Transformations', '真实改造案例')}</h3>
                <div className="h-1 w-20 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#0077ff]" />
                <p className="text-sm sm:text-base text-[#2d2a4a]/60">
                  {t('A few examples of what you can get in under 30 seconds.', '以下是你在 30 秒内可获得的效果示例。')}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-[#2d2a4a]/50">{t('Before / After examples', '改造前后示例')}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <SocialProofCard
                title="Modern Farmhouse"
                subtitle="Austin, TX"
                beforeSrc={buildSocialProofImage('front view photo of a typical american suburban two story house, neutral exterior, daylight, real estate photography, high detail')}
                afterSrc={buildSocialProofImage('modern farmhouse home facade renovation, white board and batten siding, black metal window frames, natural wood porch, standing seam metal roof accents, warm welcoming, golden hour, photorealistic, high detail')}
                beforeAfterLabel={t('Before / After', '改造前 / 改造后')}
                beforeLabel={t('Before', '改造前')}
                afterLabel={t('After', '改造后')}
              />
              <SocialProofCard
                title="Scandinavian Minimal"
                subtitle="Vancouver, BC"
                beforeSrc={buildSocialProofImage('front view photo of a modern suburban house exterior, neutral facade, daylight, real estate photography, high detail')}
                afterSrc={buildSocialProofImage('scandinavian minimalist home facade renovation, light grey and white exterior, large floor to ceiling glass, flat or low slope roof, warm natural wood entry detail, clean landscaping, soft overcast daylight, photorealistic, high detail')}
                beforeAfterLabel={t('Before / After', '改造前 / 改造后')}
                beforeLabel={t('Before', '改造前')}
                afterLabel={t('After', '改造后')}
              />
              <SocialProofCard
                title="Mediterranean Revival"
                subtitle="San Diego, CA"
                beforeSrc={buildSocialProofImage('front view photo of a typical stucco suburban house exterior, neutral colors, daylight, real estate photography, high detail')}
                afterSrc={buildSocialProofImage('mediterranean revival home facade renovation, terracotta barrel tile roof, warm creamy stucco walls, arched entry, wrought iron details, stone accents, lush landscaping, golden hour, photorealistic, high detail')}
                beforeAfterLabel={t('Before / After', '改造前 / 改造后')}
                beforeLabel={t('Before', '改造前')}
                afterLabel={t('After', '改造后')}
              />
              <SocialProofCard
                title="Industrial Loft"
                subtitle="Denver, CO"
                beforeSrc={buildSocialProofImage('front view photo of a plain suburban house exterior, neutral facade, daylight, real estate photography, high detail')}
                afterSrc={buildSocialProofImage('industrial loft style home facade renovation, dark grey concrete texture, exposed brick accents, black steel canopy, asymmetrical facade composition, large black framed windows, moody overcast light, photorealistic, high detail')}
                beforeAfterLabel={t('Before / After', '改造前 / 改造后')}
                beforeLabel={t('Before', '改造前')}
                afterLabel={t('After', '改造后')}
              />
            </div>
          </section>
        )}

        {appState === 'IDLE' && (
          <section id="styles" className="mb-16 sm:mb-20">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-[#1a1f36] tracking-tight">{t('Parametric Presets', '参数化风格预设')}</h3>
                <div className="h-1 w-20 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#0077ff]" />
                <p className="text-sm sm:text-base text-[#2d2a4a]/60">
                  {t('Pick a style DNA to prefill your prompt, then upload your photo.', '选择风格 DNA 自动填充提示词，然后上传你的照片。')}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-[#2d2a4a]/50">{t('6 curated styles', '6 种精选风格')}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {styleShowcaseCards.map((style) => (
                <StyleShowcaseCard
                  key={style.id}
                  title={style.name}
                  description={style.description}
                  imageSrc={buildSocialProofImage(style.imagePrompt)}
                  onPick={() => handleStyleShowcasePick(style.prompt)}
                />
              ))}
            </div>
          </section>
        )}

        {appState === 'IDLE' && (
          <section id="how-it-works" className="mb-16 sm:mb-20">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-[#1a1f36] tracking-tight">{t('How it works', '使用流程')}</h3>
                <div className="h-1 w-20 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#0077ff]" />
                <p className="text-sm sm:text-base text-[#2d2a4a]/60">
                  {t('Upload → Choose style → Get your redesign.', '上传照片 → 选择风格 → 获取改造结果。')}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-[#2d2a4a]/50">{t('3 simple steps', '3 个简单步骤')}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <HowItWorksStep
                step={1}
                icon={<Upload className="w-6 h-6" />}
                title={t('Upload your photo', '上传你的照片')}
                description={t('Use a straight-on front view for the best result. JPG/PNG supported.', '建议使用正面视角，效果最佳。支持 JPG/PNG。')}
              />
              <HowItWorksStep
                step={2}
                icon={<Palette className="w-6 h-6" />}
                title={t('Choose a style', '选择风格')}
                description={t('Pick a curated look or write your own prompt to guide the redesign.', '可选择精选风格，也可自定义提示词引导改造。')}
              />
              <HowItWorksStep
                step={3}
                icon={<Wand2 className="w-6 h-6" />}
                title={t('Get your design', '获取改造结果')}
                description={t('See a professional preview in ~30 seconds, then decide if you want to unlock.', '约 30 秒获得专业预览，再决定是否解锁高清图。')}
              />
            </div>
          </section>
        )}

        {/* Workflow Steps Indicator */}
        {appState === 'UPLOADED' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <StepIndicator label={t('Upload', '上传')} active={true} done={false} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label={t('Effect', '效果图')} active={false} done={false} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label={t('Explosion', '爆炸图')} active={false} done={false} />
          </div>
        )}

        {(appState === 'GENERATING_EFFECT') && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <StepIndicator label={t('Upload', '上传')} active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label={t('Effect', '效果图')} active={true} done={false} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label={t('Explosion', '爆炸图')} active={false} done={false} />
          </div>
        )}

        {appState === 'EFFECT_READY' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <StepIndicator label={t('Upload', '上传')} active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label={t('Effect', '效果图')} active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label={t('Explosion', '爆炸图')} active={false} done={false} />
          </div>
        )}

        {(appState === 'GENERATING_EXPLOSION') && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <StepIndicator label={t('Upload', '上传')} active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label={t('Effect', '效果图')} active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label={t('Explosion', '爆炸图')} active={true} done={false} />
          </div>
        )}

        {appState === 'COMPLETED' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <StepIndicator label={t('Upload', '上传')} active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label={t('Effect', '效果图')} active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label={t('Explosion', '爆炸图')} active={false} done={true} />
          </div>
        )}

        {/* Main Card */}
        <div id="generator" className="relative">
          <div className="absolute -inset-1 rounded-[44px] bg-gradient-to-r from-[#00d4aa]/20 to-[#0077ff]/20 blur-xl opacity-60" />
          <div className="relative zaha-glass rounded-[44px] zaha-fluid-shadow border border-white/50 overflow-hidden">
            <div className="p-7 sm:p-10">
            {/* IDLE & UPLOADED - Show image uploader + description */}
            {(appState === 'IDLE' || appState === 'UPLOADED') && (
              <div className="space-y-6">
                <ImageUploader onImageUploaded={handleImageUploaded} language={isZh ? 'zh' : 'en'} />
                {uploadedImage && (
                  <div className="space-y-4">
                    <DescriptionInput onSubmit={() => {}} language={isZh ? 'zh' : 'en'} />
                    {!user && (
                      <div className="rounded-xl border border-[#2d2a4a]/10 bg-white/60 p-4 space-y-3">
                        <p className="text-sm text-[#2d2a4a]/70">
                          {t('Please complete human verification before generating your free preview.', '免费预览前请先完成人机验证。')}
                        </p>
                        {TURNSTILE_SITE_KEY ? (
                          <div className="flex justify-center">
                            <Turnstile
                              ref={turnstileRef}
                              siteKey={TURNSTILE_SITE_KEY}
                              onSuccess={(token) => {
                                setTurnstileToken(token);
                                setTurnstileHint(null);
                              }}
                              onExpire={() => {
                                setTurnstileToken('');
                              }}
                              onError={() => {
                                setTurnstileToken('');
                                setTurnstileHint(t('Verification failed, please retry.', '验证失败，请重试。'));
                              }}
                              options={{ theme: 'light' }}
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-amber-600 text-center">
                            {t('Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY', '缺少 NEXT_PUBLIC_TURNSTILE_SITE_KEY 配置')}
                          </p>
                        )}
                        {turnstileHint && (
                          <p className="text-sm text-red-500 text-center">{turnstileHint}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* GENERATING_EFFECT - Show loading */}
            {appState === 'GENERATING_EFFECT' && (
              <LoadingState progress={progress} message={t('Generating effect image...', '正在生成效果图...')} language={isZh ? 'zh' : 'en'} />
            )}

            {/* EFFECT_READY - Show effect image for confirmation */}
            {appState === 'EFFECT_READY' && effectImageUrl && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-[#1a1f36] mb-2">
                    {t('Effect Image Generated!', '效果图已生成！')}
                  </h3>
                  <p className="text-sm text-[#2d2a4a]/60">
                    {t('Review your facade design and confirm to generate the explosion diagram', '请先查看效果图，确认后继续生成爆炸图')}
                  </p>
                </div>
                
                {/* Effect Image Preview */}
                <div className="relative rounded-2xl overflow-hidden border border-[#2d2a4a]/10">
                  <Image
                    src={effectImageUrl}
                    alt={t('Effect preview', '效果图预览')}
                    width={1600}
                    height={900}
                    sizes="(max-width: 1024px) 100vw, 720px"
                    className="w-full h-auto"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRegenerateEffect}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl font-medium border-[#2d2a4a]/20 text-[#2d2a4a] hover:bg-[#f0f0f5]"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {t('Regenerate', '重新生成')}
                    </Button>
                    <Button
                      onClick={handleConfirmEffect}
                      disabled={!user && leadSubmitting}
                      className="flex-1 h-12 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-[#00d4aa] to-[#0077ff] hover:shadow-lg hover:shadow-[#00d4aa]/30 text-white"
                    >
                      {!user ? t('Unlock Explosion & Materials', '解锁爆炸图与材料清单') : t('Generate Explosion', '生成爆炸图')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {!user && (
                    <div className="rounded-xl border border-[#2d2a4a]/10 bg-white/60 p-4 space-y-3">
                      <p className="text-sm text-[#2d2a4a]/70">
                        {t('Enter your email to unlock explosion diagram and materials list for free.', '填写邮箱即可免费解锁爆炸图与材料清单。')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="email"
                          value={leadEmail}
                          data-hj-suppress
                          data-clarity-mask="true"
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder={t('you@example.com', '你的邮箱地址')}
                          className="flex-1 h-11 rounded-xl border border-[#2d2a4a]/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/30"
                        />
                        <Button
                          onClick={handleConfirmEffect}
                          disabled={leadSubmitting}
                          className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#0077ff] text-white"
                        >
                          {leadSubmitting ? t('Saving...', '提交中...') : t('Unlock Now', '立即解锁')}
                        </Button>
                      </div>
                      {leadMessage && (
                        <p className={cn('text-sm', leadMessage.includes('unlocking') || leadMessage.includes('已收到') ? 'text-emerald-600' : 'text-red-500')}>
                          {leadMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GENERATING_EXPLOSION - Show loading */}
            {appState === 'GENERATING_EXPLOSION' && (
              <LoadingState progress={progress} message={t('Generating explosion diagram...', '正在生成爆炸图...')} language={isZh ? 'zh' : 'en'} />
            )}

            {/* COMPLETED - Show results */}
            {appState === 'COMPLETED' && generationResult && (
              <ResultViewer
                result={generationResult}
                onRegenerate={handleRegenerateEffect}
                language={isZh ? 'zh' : 'en'}
              />
            )}

            {/* ERROR - Show error */}
            {appState === 'ERROR' && (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={handleStartOver}
                  className="px-6 py-2 bg-gradient-to-r from-[#00d4aa] to-[#0077ff] text-white rounded-xl"
                >
                  {t('Try Again', '重试')}
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Start Over Button */}
        {appState !== 'IDLE' && (
          <div className="mt-6 text-center">
            <button
              onClick={handleStartOver}
              className="text-sm text-[#2d2a4a]/60 hover:text-[#1a1f36] transition-colors"
            >
              {t('Start Over', '重新开始')}
            </button>
          </div>
        )}

        {/* Feature Highlights */}
        {appState === 'IDLE' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14 sm:mt-16">
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              title={t('Upload Photo', '上传照片')}
              description={t('Simply upload your facade photo. No professional photography needed.', '直接上传外立面照片，无需专业摄影。')}
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title={t('Choose Style', '选择风格')}
              description={t('Select from 6 curated templates or describe your own vision.', '从 6 个精选模板中选择，或输入你的自定义想法。')}
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title={t('Get Results', '获得结果')}
              description={t('Receive photorealistic renders with detailed material specifications.', '获取高拟真效果图及详细材料说明。')}
            />
          </div>
        )}

        {appState === 'IDLE' && (
          <section id="pricing" className="mt-14 sm:mt-16 mb-12">
            <div className="flex items-end justify-between gap-6 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#1a1f36]">{t('Pricing', '价格')}</h3>
                <p className="text-sm text-[#2d2a4a]/60 mt-1">
                  {t('Start free. Unlock only if you love it. No subscription.', '先免费体验，满意再解锁，无需订阅。')}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-[#2d2a4a]/50">{t('One-time payment', '一次性付费')}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PricingCard
                title="$0 Preview"
                subtitle={t('Try it before you pay', '先试用后付费')}
                emphasized={false}
                items={[
                  t('Upload 1 facade photo', '上传 1 张外立面照片'),
                  t('Pick a style or write your own prompt', '选择风格或自定义提示词'),
                  t('See a fast preview in ~30 seconds', '约 30 秒获得预览'),
                  t('No sign up needed', '无需注册'),
                ]}
                ctaLabel={t('Try Free — No Sign Up', '免费试用 — 无需注册')}
                onCta={scrollToGenerator}
              />
              <PricingCard
                title="$19 Unlock"
                subtitle={t('Pay only if you love it', '满意再付费')}
                emphasized={true}
                badge={t('Recommended', '推荐')}
                items={[
                  t('High-resolution download', '高清下载'),
                  t('Instant access after payment', '支付后立即解锁'),
                  t('One-time payment (no subscription)', '一次性付费（无订阅）'),
                  t('Commercial-ready presentation', '可用于商业展示'),
                ]}
                ctaLabel={t('Unlock HD — $19', '解锁高清 — $19')}
                onCta={scrollToGenerator}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TrustPill icon={<Shield className="w-4 h-4" />} label={t('Your photo stays private', '你的图片隐私安全')} />
              <TrustPill icon={<Clock className="w-4 h-4" />} label={t('~30-second preview', '约 30 秒预览')} />
              <TrustPill icon={<Star className="w-4 h-4" />} label={t('Pay only if you love it', '满意再付费')} />
            </div>
          </section>
        )}

        {appState === 'IDLE' && (
          <section id="faq" className="mb-12">
            <div className="flex items-end justify-between gap-6 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#1a1f36]">FAQ</h3>
                <p className="text-sm text-[#2d2a4a]/60 mt-1">
                  {t('Quick answers to the most common questions.', '常见问题快速解答。')}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-[#2d2a4a]/50">{t('Always optional', '始终可选')}</div>
            </div>

            <div className="rounded-[28px] zaha-glass border border-white/40 overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="q1" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    {t('What if I don’t like the result?', '如果我不喜欢结果怎么办？')}
                  </AccordionTrigger>
                  <AccordionContent>
                    {t('You can regenerate and try a different style. Only unlock when you’re happy with what you see.', '你可以重新生成并尝试其他风格。满意后再解锁。')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    {t('Is my photo data safe?', '我的图片数据安全吗？')}
                  </AccordionTrigger>
                  <AccordionContent>
                    {t('Your upload is used only to generate your preview. We don’t sell your data.', '上传的图片仅用于生成预览，我们不会出售你的数据。')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    {t('How long does generation take?', '生成大概要多久？')}
                  </AccordionTrigger>
                  <AccordionContent>
                    {t('Most previews finish in about 30 seconds, depending on image size and traffic.', '大多数预览约 30 秒完成，具体取决于图片大小和当前负载。')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q4" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    {t('Can I use this for a new build?', '可以用于新建项目吗？')}
                  </AccordionTrigger>
                  <AccordionContent>
                    {t('Yes. It works best with a front-facing exterior image or a clean elevation render.', '可以。建议使用正立面照片或干净的立面图，效果最佳。')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q5" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    {t('Do I need design experience?', '需要设计经验吗？')}
                  </AccordionTrigger>
                  <AccordionContent>
                    {t('No. Pick a style and you’ll get a guided, professional-looking result automatically.', '不需要。选择风格后会自动生成专业效果。')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q6" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    {t('Why is the preview blurred?', '为什么预览是模糊的？')}
                  </AccordionTrigger>
                  <AccordionContent>
                    {t('The preview is designed to help you validate direction first. Unlocking provides the high-resolution version for download.', '预览用于先确认设计方向；解锁后可下载高清版本。')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#2d2a4a]/10 bg-white/60 backdrop-blur-sm mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1f36] to-[#2d2a4a] flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-base font-semibold text-[#1a1f36]">AI Zaha Home Design</div>
                  <div className="text-xs text-[#2d2a4a]/60">{t('Transform your facade', '重塑你的建筑外立面')}</div>
                </div>
              </div>
              <div className="text-sm text-[#2d2a4a]/60">
                {t('Upload a photo and get a fast facade redesign preview. Pay only if you love it.', '上传照片，快速获得外立面改造预览。满意再付费。')}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#1a1f36]">{t('Product', '产品')}</div>
              <div className="space-y-2">
                <FooterButton onClick={scrollToGenerator} label={t('Try Free', '免费试用')} />
                <FooterButton onClick={scrollToSocialProof} label={t('Transformations', '改造案例')} />
                <FooterButton onClick={scrollToStyles} label={t('Styles', '风格模板')} />
                <FooterButton onClick={scrollToHowItWorks} label={t('How it works', '使用流程')} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#1a1f36]">{t('Pricing', '价格')}</div>
              <div className="space-y-2">
                <FooterButton onClick={scrollToPricing} label={t('$0 Preview', '$0 预览')} />
                <FooterButton onClick={scrollToPricing} label={t('$19 Unlock', '$19 解锁')} />
                <FooterButton onClick={scrollToFaq} label="FAQ" />
                <Link href="/blog" className="block text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors">
                  {t('Facade Tips', '外立面技巧')}
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#1a1f36]">{t('Legal', '法律条款')}</div>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors">
                  {t('Privacy Policy', '隐私政策')}
                </Link>
                <Link href="/terms" className="block text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors">
                  {t('Terms of Service', '服务条款')}
                </Link>
                <Link href="/refund" className="block text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors">
                  {t('Refund Policy', '退款政策')}
                </Link>
                <div className="text-xs text-[#2d2a4a]/40">
                  {t('AI-generated results. Please review before use.', 'AI 生成结果，请在使用前自行审核。')}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#2d2a4a]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#2d2a4a]/40">
              © {new Date().getFullYear()} AI Zaha Home Design
            </div>
            <div className="text-xs text-[#2d2a4a]/40">
              {t('No subscription · Pay only if you love it', '无需订阅 · 满意再付费')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BeforeAfterCard({
  beforeSrc,
  afterSrc,
  priority,
  beforeLabel,
  afterLabel,
  compareAria,
}: {
  beforeSrc: string;
  afterSrc: string;
  priority?: boolean;
  beforeLabel: string;
  afterLabel: string;
  compareAria: string;
}) {
  const [value, setValue] = useState(58);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#2d2a4a]/10 bg-[#fafbfc]">
        <Image
          src={beforeSrc}
          alt={beforeLabel}
          fill
          sizes="(max-width: 1024px) 100vw, 520px"
          className="object-cover"
          priority={priority}
        />

        <div className="absolute inset-0 overflow-hidden" style={{ width: `${value}%` }}>
          <div className="relative h-full w-[100%]">
            <Image
              src={afterSrc}
              alt={afterLabel}
              fill
              sizes="(max-width: 1024px) 100vw, 520px"
              className="object-cover"
              priority={priority}
            />
          </div>
        </div>

        <div
          className="absolute inset-y-0"
          style={{ left: `${value}%`, transform: 'translateX(-1px)' }}
        >
          <div className="h-full w-[2px] bg-white/80 shadow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-[#2d2a4a]/10 shadow flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#0077ff]" />
          </div>
        </div>

        <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
          {beforeLabel}
        </div>
        <div className="absolute right-3 top-3 inline-flex items-center rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
          {afterLabel}
        </div>
      </div>

      <input
        type="range"
        min={15}
        max={85}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-[#00d4aa]"
        aria-label={compareAria}
      />
    </div>
  );
}

function NavLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-xl text-sm text-[#2d2a4a]/60 hover:text-[#1a1f36] hover:bg-[#2d2a4a]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa]/40"
    >
      {label}
    </button>
  );
}

function MobileNavButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-3 rounded-xl border border-[#2d2a4a]/10 hover:bg-[#2d2a4a]/5 transition-colors text-sm text-[#1a1f36] flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa]/40"
    >
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 text-[#2d2a4a]/50" />
    </button>
  );
}

function FooterButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block text-left text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa]/40 rounded"
    >
      {label}
    </button>
  );
}

function TrustPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="h-12 rounded-2xl zaha-glass border border-white/40 px-4 flex items-center gap-2 text-sm text-[#2d2a4a]/70">
      <span className="text-[#00d4aa]">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function PricingCard({
  title,
  subtitle,
  badge,
  emphasized,
  items,
  ctaLabel,
  onCta,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  emphasized: boolean;
  items: string[];
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-[28px] zaha-glass border overflow-hidden zaha-card-hover',
        emphasized
          ? 'border-[#00d4aa]/40 shadow-lg shadow-[#00d4aa]/10'
          : 'border-white/40'
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-[#1a1f36]">{title}</div>
            <div className="text-sm text-[#2d2a4a]/60 mt-1">{subtitle}</div>
          </div>
          {badge && (
            <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#00d4aa]/15 to-[#0077ff]/15 border border-[#00d4aa]/25 px-3 py-1 text-xs font-medium text-[#1a1f36]">
              <Star className="w-3.5 h-3.5 text-[#00d4aa]" />
              {badge}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-[#2d2a4a]/70">
              <span className="mt-0.5 text-[#00d4aa]">
                <Check className="w-4 h-4" />
              </span>
              <span className="leading-relaxed">{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button
            onClick={onCta}
            className={cn(
              'w-full h-12 rounded-xl font-medium transition-all duration-300',
              emphasized
                ? 'bg-gradient-to-r from-[#00d4aa] to-[#0077ff] hover:shadow-lg hover:shadow-[#00d4aa]/30 text-white'
                : 'bg-[#1a1f36] text-white hover:opacity-90'
            )}
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          {emphasized && (
            <div className="mt-3 text-xs text-[#2d2a4a]/50">
              One-time payment. No subscription. Unlock after preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialProofCard({
  title,
  subtitle,
  beforeSrc,
  afterSrc,
  beforeAfterLabel,
  beforeLabel,
  afterLabel,
}: {
  title: string;
  subtitle: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAfterLabel: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  return (
    <div className="rounded-[28px] zaha-glass border border-white/40 overflow-hidden zaha-card-hover">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-sm font-semibold text-[#1a1f36]">{title}</div>
            <div className="text-xs text-[#2d2a4a]/60 mt-0.5">{subtitle}</div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#00d4aa]/10 to-[#0077ff]/10 text-[11px] text-[#2d2a4a]">
              {beforeAfterLabel}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#2d2a4a]/10 bg-[#fafbfc]">
            <Image
              src={beforeSrc}
              alt={`${title} ${beforeLabel}`}
              fill
              sizes="(max-width: 640px) 100vw, 260px"
              className="object-cover"
            />
            <div className="absolute left-2 top-2 inline-flex items-center rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
              {beforeLabel}
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#2d2a4a]/10 bg-[#fafbfc]">
            <Image
              src={afterSrc}
              alt={`${title} ${afterLabel}`}
              fill
              sizes="(max-width: 640px) 100vw, 260px"
              className="object-cover"
            />
            <div className="absolute left-2 top-2 inline-flex items-center rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
              {afterLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StyleShowcaseCard({
  title,
  description,
  imageSrc,
  onPick,
}: {
  title: string;
  description: string;
  imageSrc: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'group relative rounded-[32px] bg-white border border-[#2d2a4a]/10 overflow-hidden text-left zaha-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa]/50'
      )}
      aria-label={`Pick ${title} style`}
    >
      <div className="relative aspect-[4/5] bg-[#fafbfc]">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f36]/90 via-[#1a1f36]/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
        <div className="absolute left-6 bottom-6 right-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xl font-bold text-white tracking-tight">{title}</div>
              <div className="text-xs text-white/70 mt-2 line-clamp-2 leading-relaxed">{description}</div>
            </div>
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-3 group-hover:translate-x-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function HowItWorksStep({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-[28px] zaha-glass border border-white/40 p-6 zaha-card-hover">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00d4aa]/18 to-[#0077ff]/18 flex items-center justify-center text-[#00d4aa]">
            {icon}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-[#2d2a4a]/60">Step {step}</div>
            <div className="h-1.5 w-1.5 rounded-full bg-[#2d2a4a]/20" />
            <div className="text-xs text-[#2d2a4a]/50">~30 seconds total</div>
          </div>
          <h4 className="mt-2 text-lg font-semibold text-[#1a1f36] leading-snug">{title}</h4>
          <p className="mt-2 text-sm text-[#2d2a4a]/60 leading-relaxed">{description}</p>
        </div>
      </div>

      {step < 3 && (
        <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2">
          <div className="w-6 h-6 rounded-full bg-white border border-[#2d2a4a]/10 shadow-sm flex items-center justify-center text-[#2d2a4a]/60">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
          done
            ? 'bg-[#00d4aa]'
            : active
            ? 'bg-[#0077ff]'
            : 'bg-[#2d2a4a]/10'
        )}
      >
        {done ? (
          <CheckCircle2 className="w-4 h-4 text-white" />
        ) : (
          <span
            className={cn(
              'text-xs font-medium',
              active ? 'text-white' : 'text-[#2d2a4a]/40'
            )}
          >
            {label[0]}
          </span>
        )}
      </div>
      <span
        className={cn(
          'text-sm transition-colors',
          done
            ? 'text-[#00d4aa]'
            : active
            ? 'text-[#0077ff]'
            : 'text-[#2d2a4a]/40'
        )}
      >
        {label}
      </span>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-[28px] zaha-glass border border-white/40 zaha-card-hover">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00d4aa]/16 to-[#0077ff]/16 flex items-center justify-center text-[#00d4aa] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#1a1f36] mb-2">{title}</h3>
      <p className="text-sm text-[#2d2a4a]/60">{description}</p>
    </div>
  );
}
