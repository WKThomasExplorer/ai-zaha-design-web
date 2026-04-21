'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
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

export default function HomeDesignPage() {
  const { user, loading, logout } = useAuth();
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [effectImageUrl, setEffectImageUrl] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [heroCarouselApi, setHeroCarouselApi] = useState<CarouselApi | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    setAppState('UPLOADED');
  }, []);

  // Generate effect image only
  const generateEffectImage = useCallback(async () => {
    if (!uploadedImage) return;

    const descText = localStorage.getItem('design_description') || 'modern facade renovation';
    setAppState('GENERATING_EFFECT');
    setProgress(0);

    try {
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
        }),
      });

      const effectData = await effectResponse.json();

      if (!effectData.success) {
        throw new Error(effectData.error || 'Failed to generate effect image');
      }

      setProgress(100);
      setEffectImageUrl(effectData.imageUrl);
      setAppState('EFFECT_READY');
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
      setAppState('ERROR');
    }
  }, [uploadedImage]);

  // Generate explosion diagram (after user confirms effect image)
  const generateExplosionDiagram = useCallback(async () => {
    if (!effectImageUrl) return;

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
        throw new Error(explosionData.error || 'Failed to generate explosion diagram');
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

      setProgress(100);

      // Complete with both images
      setGenerationResult({
        effectImageUrl: effectImageUrl,
        explosionImageUrl: explosionData.imageUrl,
        materials: materials,
      });

      setAppState('COMPLETED');
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
      setAppState('ERROR');
    }
  }, [effectImageUrl]);

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

  // Handle confirm and generate explosion
  const handleConfirmEffect = useCallback(() => {
    generateExplosionDiagram();
  }, [generateExplosionDiagram]);

  // Handle start over
  const handleStartOver = useCallback(() => {
    setAppState('IDLE');
    setUploadedImage(null);
    setEffectImageUrl(null);
    setGenerationResult(null);
    setProgress(0);
    setError(null);
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
                    Transform your facade
                  </p>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-3">
              <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
                <NavLink onClick={scrollToGenerator} label="Try Free" />
                {appState === 'IDLE' && (
                  <>
                    <NavLink onClick={scrollToSocialProof} label="Transformations" />
                    <NavLink onClick={scrollToStyles} label="Styles" />
                    <NavLink onClick={scrollToHowItWorks} label="How it works" />
                    <NavLink onClick={scrollToPricing} label="Pricing" />
                    <NavLink onClick={scrollToFaq} label="FAQ" />
                  </>
                )}
                <Link
                  href="/blog"
                  className="px-3 py-2 rounded-xl text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] hover:bg-[#2d2a4a]/5 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Facade Tips</span>
                </Link>
              </nav>

              <div className="hidden sm:flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#2d2a4a]/60" />
                <select
                  aria-label="Language"
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
                        title="Logout"
                        aria-label="Logout"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="ghost" size="sm" className="text-[#2d2a4a]/60 hover:text-[#00d4aa]">
                          Login
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button size="sm" className="bg-gradient-to-r from-[#00d4aa] to-[#0077ff] text-white hover:opacity-90">
                          Sign Up
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
                      aria-label="Open menu"
                    >
                      <Menu className="w-5 h-5 text-[#2d2a4a]/70" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[320px] sm:w-[360px]">
                    <SheetTitle className="text-[#1a1f36]">AI Zaha Home Design</SheetTitle>
                    <div className="mt-6 space-y-2">
                      <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToGenerator(); }} label="Try Free" />
                      {appState === 'IDLE' && (
                        <>
                          <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToSocialProof(); }} label="Real Transformations" />
                          <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToStyles(); }} label="Styles" />
                          <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToHowItWorks(); }} label="How it works" />
                          <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToPricing(); }} label="Pricing" />
                          <MobileNavButton onClick={() => { setMobileNavOpen(false); scrollToFaq(); }} label="FAQ" />
                        </>
                      )}
                      <Link href="/blog" onClick={() => setMobileNavOpen(false)} className="block">
                        <div className="px-4 py-3 rounded-xl border border-[#2d2a4a]/10 hover:bg-[#2d2a4a]/5 transition-colors text-sm text-[#1a1f36] flex items-center justify-between">
                          <span>Facade Tips</span>
                          <ChevronRight className="w-4 h-4 text-[#2d2a4a]/50" />
                        </div>
                      </Link>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-[#2d2a4a]/60">
                        <Globe className="w-4 h-4" />
                        <span>Language</span>
                      </div>
                      <select
                        aria-label="Language"
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
                              aria-label="Logout"
                            >
                              <LogOut className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                              <Button variant="outline" className="w-full h-11 rounded-xl border-[#2d2a4a]/20">
                                Login
                              </Button>
                            </Link>
                            <Link href="/register" onClick={() => setMobileNavOpen(false)}>
                              <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-[#00d4aa] to-[#0077ff] text-white hover:opacity-90">
                                Sign Up
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
          <div className="mb-16 sm:mb-20 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full zaha-glass text-sm text-[#2d2a4a]">
                  <Sparkles className="w-4 h-4 text-[#00d4aa]" />
                  <span className="font-medium">No sign up · 30-second preview · Pay only if you love it</span>
                </div>

                <h2 className="text-5xl sm:text-6xl font-bold text-[#1a1f36] leading-[0.98] tracking-tight">
                  Make Your Home
                  <br />
                  <span className="zaha-text-gradient">the Only One on the Block</span>
                </h2>

                <p className="text-base sm:text-lg text-[#2d2a4a]/70 max-w-xl leading-relaxed">
                  Upload a photo, choose a style, and get a professional facade redesign preview in under 30 seconds.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={scrollToGenerator}
                    className="h-12 sm:h-14 px-7 sm:px-8 rounded-full font-semibold transition-all duration-500 bg-gradient-to-r from-[#1a1f36] to-[#2d2a4a] hover:shadow-[0_0_30px_rgba(0,212,170,0.25)] text-white"
                  >
                    Try Free — No Sign Up
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    onClick={scrollToSocialProof}
                    variant="outline"
                    className="h-12 sm:h-14 px-7 sm:px-8 rounded-full font-semibold border-[#1a1f36]/15 text-[#1a1f36] bg-white/50 hover:bg-white/70"
                  >
                    See Real Transformations
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 rounded-full zaha-glass text-xs text-[#2d2a4a]/70">
                    Works best with a straight-on front photo
                  </div>
                  <div className="px-3 py-1.5 rounded-full zaha-glass text-xs text-[#2d2a4a]/70">
                    No subscription
                  </div>
                  <div className="px-3 py-1.5 rounded-full zaha-glass text-xs text-[#2d2a4a]/70">
                    Instant download after unlock
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
                                Before / After
                              </div>
                            </div>
                            <BeforeAfterCard
                              beforeSrc={buildHeroImage(slide.beforePrompt)}
                              afterSrc={buildHeroImage(slide.afterPrompt)}
                              priority={idx === 0}
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
                <h3 className="text-3xl font-bold text-[#1a1f36] tracking-tight">Real Transformations</h3>
                <div className="h-1 w-20 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#0077ff]" />
                <p className="text-sm sm:text-base text-[#2d2a4a]/60">
                  A few examples of what you can get in under 30 seconds.
                </p>
              </div>
              <div className="hidden sm:block text-xs text-[#2d2a4a]/50">Before / After examples</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <SocialProofCard
                title="Modern Farmhouse"
                subtitle="Austin, TX"
                beforeSrc={buildSocialProofImage('front view photo of a typical american suburban two story house, neutral exterior, daylight, real estate photography, high detail')}
                afterSrc={buildSocialProofImage('modern farmhouse home facade renovation, white board and batten siding, black metal window frames, natural wood porch, standing seam metal roof accents, warm welcoming, golden hour, photorealistic, high detail')}
              />
              <SocialProofCard
                title="Scandinavian Minimal"
                subtitle="Vancouver, BC"
                beforeSrc={buildSocialProofImage('front view photo of a modern suburban house exterior, neutral facade, daylight, real estate photography, high detail')}
                afterSrc={buildSocialProofImage('scandinavian minimalist home facade renovation, light grey and white exterior, large floor to ceiling glass, flat or low slope roof, warm natural wood entry detail, clean landscaping, soft overcast daylight, photorealistic, high detail')}
              />
              <SocialProofCard
                title="Mediterranean Revival"
                subtitle="San Diego, CA"
                beforeSrc={buildSocialProofImage('front view photo of a typical stucco suburban house exterior, neutral colors, daylight, real estate photography, high detail')}
                afterSrc={buildSocialProofImage('mediterranean revival home facade renovation, terracotta barrel tile roof, warm creamy stucco walls, arched entry, wrought iron details, stone accents, lush landscaping, golden hour, photorealistic, high detail')}
              />
              <SocialProofCard
                title="Industrial Loft"
                subtitle="Denver, CO"
                beforeSrc={buildSocialProofImage('front view photo of a plain suburban house exterior, neutral facade, daylight, real estate photography, high detail')}
                afterSrc={buildSocialProofImage('industrial loft style home facade renovation, dark grey concrete texture, exposed brick accents, black steel canopy, asymmetrical facade composition, large black framed windows, moody overcast light, photorealistic, high detail')}
              />
            </div>
          </section>
        )}

        {appState === 'IDLE' && (
          <section id="styles" className="mb-16 sm:mb-20">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-[#1a1f36] tracking-tight">Parametric Presets</h3>
                <div className="h-1 w-20 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#0077ff]" />
                <p className="text-sm sm:text-base text-[#2d2a4a]/60">
                  Pick a style DNA to prefill your prompt, then upload your photo.
                </p>
              </div>
              <div className="hidden sm:block text-xs text-[#2d2a4a]/50">6 curated styles</div>
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
                <h3 className="text-3xl font-bold text-[#1a1f36] tracking-tight">How it works</h3>
                <div className="h-1 w-20 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#0077ff]" />
                <p className="text-sm sm:text-base text-[#2d2a4a]/60">
                  Upload → Choose style → Get your redesign.
                </p>
              </div>
              <div className="hidden sm:block text-xs text-[#2d2a4a]/50">3 simple steps</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <HowItWorksStep
                step={1}
                icon={<Upload className="w-6 h-6" />}
                title="Upload your photo"
                description="Use a straight-on front view for the best result. JPG/PNG supported."
              />
              <HowItWorksStep
                step={2}
                icon={<Palette className="w-6 h-6" />}
                title="Choose a style"
                description="Pick a curated look or write your own prompt to guide the redesign."
              />
              <HowItWorksStep
                step={3}
                icon={<Wand2 className="w-6 h-6" />}
                title="Get your design"
                description="See a professional preview in ~30 seconds, then decide if you want to unlock."
              />
            </div>
          </section>
        )}

        {/* Workflow Steps Indicator */}
        {appState === 'UPLOADED' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <StepIndicator label="Upload" active={true} done={false} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label="Effect" active={false} done={false} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label="Explosion" active={false} done={false} />
          </div>
        )}

        {(appState === 'GENERATING_EFFECT') && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <StepIndicator label="Upload" active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label="Effect" active={true} done={false} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label="Explosion" active={false} done={false} />
          </div>
        )}

        {appState === 'EFFECT_READY' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <StepIndicator label="Upload" active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label="Effect" active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label="Explosion" active={false} done={false} />
          </div>
        )}

        {(appState === 'GENERATING_EXPLOSION') && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <StepIndicator label="Upload" active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label="Effect" active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label="Explosion" active={true} done={false} />
          </div>
        )}

        {appState === 'COMPLETED' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <StepIndicator label="Upload" active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label="Effect" active={false} done={true} />
            <ChevronRight className="w-4 h-4 text-[#2d2a4a]/30" />
            <StepIndicator label="Explosion" active={false} done={true} />
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
                <ImageUploader onImageUploaded={handleImageUploaded} />
                {uploadedImage && (
                  <DescriptionInput onSubmit={() => {}} />
                )}
              </div>
            )}

            {/* GENERATING_EFFECT - Show loading */}
            {appState === 'GENERATING_EFFECT' && (
              <LoadingState progress={progress} message="Generating effect image..." />
            )}

            {/* EFFECT_READY - Show effect image for confirmation */}
            {appState === 'EFFECT_READY' && effectImageUrl && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-[#1a1f36] mb-2">
                    Effect Image Generated!
                  </h3>
                  <p className="text-sm text-[#2d2a4a]/60">
                    Review your facade design and confirm to generate the explosion diagram
                  </p>
                </div>
                
                {/* Effect Image Preview */}
                <div className="relative rounded-2xl overflow-hidden border border-[#2d2a4a]/10">
                  <Image
                    src={effectImageUrl}
                    alt="Effect preview"
                    width={1600}
                    height={900}
                    sizes="(max-width: 1024px) 100vw, 720px"
                    className="w-full h-auto"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleRegenerateEffect}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-medium border-[#2d2a4a]/20 text-[#2d2a4a] hover:bg-[#f0f0f5]"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleConfirmEffect}
                    className="flex-1 h-12 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-[#00d4aa] to-[#0077ff] hover:shadow-lg hover:shadow-[#00d4aa]/30 text-white"
                  >
                    Generate Explosion
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* GENERATING_EXPLOSION - Show loading */}
            {appState === 'GENERATING_EXPLOSION' && (
              <LoadingState progress={progress} message="Generating explosion diagram..." />
            )}

            {/* COMPLETED - Show results */}
            {appState === 'COMPLETED' && generationResult && (
              <ResultViewer
                result={generationResult}
                onRegenerate={handleRegenerateEffect}
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
                  Try Again
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
              Start Over
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
              title="Upload Photo"
              description="Simply upload your facade photo. No professional photography needed."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title="Choose Style"
              description="Select from 6 curated templates or describe your own vision."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Get Results"
              description="Receive photorealistic renders with detailed material specifications."
            />
          </div>
        )}

        {appState === 'IDLE' && (
          <section id="pricing" className="mt-14 sm:mt-16 mb-12">
            <div className="flex items-end justify-between gap-6 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#1a1f36]">Pricing</h3>
                <p className="text-sm text-[#2d2a4a]/60 mt-1">
                  Start free. Unlock only if you love it. No subscription.
                </p>
              </div>
              <div className="hidden sm:block text-xs text-[#2d2a4a]/50">One-time payment</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PricingCard
                title="$0 Preview"
                subtitle="Try it before you pay"
                emphasized={false}
                items={[
                  'Upload 1 facade photo',
                  'Pick a style or write your own prompt',
                  'See a fast preview in ~30 seconds',
                  'No sign up needed',
                ]}
                ctaLabel="Try Free — No Sign Up"
                onCta={scrollToGenerator}
              />
              <PricingCard
                title="$19 Unlock"
                subtitle="Pay only if you love it"
                emphasized={true}
                badge="Recommended"
                items={[
                  'High-resolution download',
                  'Instant access after payment',
                  'One-time payment (no subscription)',
                  'Commercial-ready presentation',
                ]}
                ctaLabel="Unlock HD — $19"
                onCta={scrollToGenerator}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TrustPill icon={<Shield className="w-4 h-4" />} label="Your photo stays private" />
              <TrustPill icon={<Clock className="w-4 h-4" />} label="~30-second preview" />
              <TrustPill icon={<Star className="w-4 h-4" />} label="Pay only if you love it" />
            </div>
          </section>
        )}

        {appState === 'IDLE' && (
          <section id="faq" className="mb-12">
            <div className="flex items-end justify-between gap-6 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#1a1f36]">FAQ</h3>
                <p className="text-sm text-[#2d2a4a]/60 mt-1">
                  Quick answers to the most common questions.
                </p>
              </div>
              <div className="hidden sm:block text-xs text-[#2d2a4a]/50">Always optional</div>
            </div>

            <div className="rounded-[28px] zaha-glass border border-white/40 overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="q1" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    What if I don’t like the result?
                  </AccordionTrigger>
                  <AccordionContent>
                    You can regenerate and try a different style. Only unlock when you’re happy with what you see.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    Is my photo data safe?
                  </AccordionTrigger>
                  <AccordionContent>
                    Your upload is used only to generate your preview. We don’t sell your data.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    How long does generation take?
                  </AccordionTrigger>
                  <AccordionContent>
                    Most previews finish in about 30 seconds, depending on image size and traffic.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q4" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    Can I use this for a new build?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes. It works best with a front-facing exterior image or a clean elevation render.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q5" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    Do I need design experience?
                  </AccordionTrigger>
                  <AccordionContent>
                    No. Pick a style and you’ll get a guided, professional-looking result automatically.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q6" className="px-4 sm:px-6">
                  <AccordionTrigger className="text-left">
                    Why is the preview blurred?
                  </AccordionTrigger>
                  <AccordionContent>
                    The preview is designed to help you validate direction first. Unlocking provides the high-resolution version for download.
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
                  <div className="text-xs text-[#2d2a4a]/60">Transform your facade</div>
                </div>
              </div>
              <div className="text-sm text-[#2d2a4a]/60">
                Upload a photo and get a fast facade redesign preview. Pay only if you love it.
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#1a1f36]">Product</div>
              <div className="space-y-2">
                <FooterButton onClick={scrollToGenerator} label="Try Free" />
                <FooterButton onClick={scrollToSocialProof} label="Transformations" />
                <FooterButton onClick={scrollToStyles} label="Styles" />
                <FooterButton onClick={scrollToHowItWorks} label="How it works" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#1a1f36]">Pricing</div>
              <div className="space-y-2">
                <FooterButton onClick={scrollToPricing} label="$0 Preview" />
                <FooterButton onClick={scrollToPricing} label="$19 Unlock" />
                <FooterButton onClick={scrollToFaq} label="FAQ" />
                <Link href="/blog" className="block text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors">
                  Facade Tips
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#1a1f36]">Legal</div>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors">
                  Terms of Service
                </Link>
                <Link href="/refund" className="block text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors">
                  Refund Policy
                </Link>
                <div className="text-xs text-[#2d2a4a]/40">
                  AI-generated results. Please review before use.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#2d2a4a]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#2d2a4a]/40">
              © {new Date().getFullYear()} AI Zaha Home Design
            </div>
            <div className="text-xs text-[#2d2a4a]/40">
              No subscription · Pay only if you love it
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
}: {
  beforeSrc: string;
  afterSrc: string;
  priority?: boolean;
}) {
  const [value, setValue] = useState(58);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#2d2a4a]/10 bg-[#fafbfc]">
        <Image
          src={beforeSrc}
          alt="Before"
          fill
          sizes="(max-width: 1024px) 100vw, 520px"
          className="object-cover"
          priority={priority}
        />

        <div className="absolute inset-0 overflow-hidden" style={{ width: `${value}%` }}>
          <div className="relative h-full w-[100%]">
            <Image
              src={afterSrc}
              alt="After"
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
          Before
        </div>
        <div className="absolute right-3 top-3 inline-flex items-center rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
          After
        </div>
      </div>

      <input
        type="range"
        min={15}
        max={85}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-[#00d4aa]"
        aria-label="Compare before and after"
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
}: {
  title: string;
  subtitle: string;
  beforeSrc: string;
  afterSrc: string;
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
              Before / After
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#2d2a4a]/10 bg-[#fafbfc]">
            <Image
              src={beforeSrc}
              alt={`${title} before`}
              fill
              sizes="(max-width: 640px) 100vw, 260px"
              className="object-cover"
            />
            <div className="absolute left-2 top-2 inline-flex items-center rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
              Before
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#2d2a4a]/10 bg-[#fafbfc]">
            <Image
              src={afterSrc}
              alt={`${title} after`}
              fill
              sizes="(max-width: 640px) 100vw, 260px"
              className="object-cover"
            />
            <div className="absolute left-2 top-2 inline-flex items-center rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
              After
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
