'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Home, Globe, ChevronRight, CheckCircle2, ArrowRight, RotateCcw, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/image-upload';
import { DescriptionInput } from '@/components/description-input';
import { LoadingState } from '@/components/loading-state';
import { ResultViewer } from '@/components/result-viewer';
import { useAuth } from '@/context/auth-context';
import type { UploadedImage, GenerationResult } from '@/types';

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

    const descText = localStorage.getItem('design_description') || 'modern facade renovation';
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
    <div className="min-h-screen bg-[#fafbfc] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="curve-decoration -top-20 -left-20" />
      <div className="curve-decoration top-1/2 -right-40 w-[500px] h-[500px]" />
      <div className="curve-decoration bottom-20 left-1/3" />

      {/* Header */}
      <header className="relative z-10 border-b border-[#2d2a4a]/10 bg-white/80 backdrop-blur-md">
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
            <div className="flex items-center gap-4">
              <Link
                href="/blog"
                className="text-sm text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4" />
                <span>Facade Tips</span>
              </Link>
              
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#2d2a4a]/60" />
                <select
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

              {/* Auth Section */}
              {!loading && (
                <div className="flex items-center gap-2">
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Section (only show in IDLE state) */}
        {appState === 'IDLE' && (
          <div className="text-center mb-12 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00d4aa]/10 to-[#0077ff]/10 text-sm text-[#2d2a4a] mb-6">
              <Sparkles className="w-4 h-4 text-[#00d4aa]" />
              <span>AI-powered facade design in seconds</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1f36] mb-4">
              Upload your facade,
              <br />
              <span className="bg-gradient-to-r from-[#00d4aa] to-[#0077ff] bg-clip-text text-transparent">
                see the transformation
              </span>
            </h2>
            <p className="text-[#2d2a4a]/60 max-w-xl mx-auto">
              Tell us what you want, and our AI will generate stunning renovation
              renders with detailed material specifications.
            </p>
          </div>
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
        <div className="bg-white rounded-3xl shadow-xl shadow-[#1a1f36]/5 border border-[#2d2a4a]/10 overflow-hidden">
          <div className="p-6 sm:p-8">
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
                  <img
                    src={effectImageUrl}
                    alt="Effect preview"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
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
              description="Select from 50 professional templates or describe your own vision."
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
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#2d2a4a]/10 bg-white/50 backdrop-blur-sm mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-[#2d2a4a]/40">
            AI Zaha Home Design - Transform your space with AI
          </p>
        </div>
      </footer>
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
    <div className="p-6 rounded-2xl bg-white border border-[#2d2a4a]/10 hover:border-[#00d4aa]/30 hover:shadow-lg hover:shadow-[#00d4aa]/5 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00d4aa]/10 to-[#0077ff]/10 flex items-center justify-center text-[#00d4aa] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#1a1f36] mb-2">{title}</h3>
      <p className="text-sm text-[#2d2a4a]/60">{description}</p>
    </div>
  );
}
