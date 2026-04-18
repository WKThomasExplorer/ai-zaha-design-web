'use client';

import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, Edit3, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AIConfirmProps {
  description: string;
  onConfirm: (summarized: string) => void;
  onEdit: () => void;
  className?: string;
}

export function AIConfirm({ description, onConfirm, onEdit, className }: AIConfirmProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  // Simulate AI understanding and generating summary
  useEffect(() => {
    const generateSummary = async () => {
      if (!description) return;

      setIsGenerating(true);

      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate a structured summary from the description
      const words = description.toLowerCase().split(/\s+/);
      const summaryParts: string[] = [];

      // Extract style hints
      if (words.some((w) => ['modern', 'contemporary', 'minimalist'].includes(w))) {
        summaryParts.push('Style: Modern/Contemporary');
      }
      if (words.some((w) => ['classic', 'traditional', 'european'].includes(w))) {
        summaryParts.push('Style: Classic/Traditional');
      }
      if (words.some((w) => ['rustic', 'farmhouse', 'country'].includes(w))) {
        summaryParts.push('Style: Rustic/Farmhouse');
      }
      if (words.some((w) => ['mediterranean'].includes(w))) {
        summaryParts.push('Style: Mediterranean');
      }
      if (words.some((w) => ['industrial'].includes(w))) {
        summaryParts.push('Style: Industrial');
      }
      if (words.some((w) => ['tropical', 'coastal', 'beach'].includes(w))) {
        summaryParts.push('Style: Tropical/Coastal');
      }

      // Extract color hints
      const colorMap: Record<string, string> = {
        white: 'White',
        black: 'Black',
        gray: 'Gray',
        grey: 'Gray',
        blue: 'Blue',
        brown: 'Brown',
        beige: 'Beige',
        cream: 'Cream',
        red: 'Red',
        green: 'Green',
        yellow: 'Yellow',
        orange: 'Orange',
        dark: 'Dark',
        light: 'Light',
      };

      const colors = words.filter((w) => colorMap[w]);
      if (colors.length > 0) {
        summaryParts.push(
          `Colors: ${colors.map((c) => colorMap[c]).join(', ')}`
        );
      }

      // Extract material hints
      const materialMap: Record<string, string> = {
        brick: 'Brick',
        wood: 'Wood',
        stone: 'Stone',
        metal: 'Metal',
        stucco: 'Stucco',
        vinyl: 'Vinyl',
        glass: 'Glass',
        tile: 'Tile',
        concrete: 'Concrete',
        timber: 'Timber',
        cedar: 'Cedar',
        aluminium: 'Aluminum',
        aluminum: 'Aluminum',
      };

      const materials = words.filter((w) => materialMap[w]);
      if (materials.length > 0) {
        summaryParts.push(
          `Materials: ${materials.map((m) => materialMap[m]).join(', ')}`
        );
      }

      // Extract element hints
      if (words.some((w) => ['roof', 'roofing'].includes(w))) {
        summaryParts.push('Roof updates included');
      }
      if (words.some((w) => ['door', 'entrance'].includes(w))) {
        summaryParts.push('Front door/entrance included');
      }
      if (words.some((w) => ['window', 'windows'].includes(w))) {
        summaryParts.push('Windows included');
      }
      if (words.some((w) => ['garage'].includes(w))) {
        summaryParts.push('Garage included');
      }
      if (words.some((w) => ['porch', 'veranda', 'terrace'].includes(w))) {
        summaryParts.push('Porch/terrace included');
      }

      // If no specific elements found, use general description
      if (summaryParts.length === 0) {
        summaryParts.push(`Description: ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}`);
      }

      setSummary(summaryParts.join('\n'));
      setIsGenerating(false);
    };

    generateSummary();
  }, [description]);

  const handleConfirm = useCallback(() => {
    if (summary) {
      onConfirm(summary);
    }
  }, [summary, onConfirm]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* AI Thinking Animation */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#00d4aa]/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00d4aa] animate-spin" />
          </div>
          <p className="text-[#2d2a4a]/60 text-sm animate-pulse">
            AI is understanding your vision...
          </p>
        </div>
      )}

      {/* Summary Card */}
      {summary && !isGenerating && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#1a1f36] to-[#2d2a4a] p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-[#00d4aa]" />
              <span className="font-medium">I understand you want:</span>
            </div>
            <div className="space-y-2 text-sm text-white/80 whitespace-pre-line">
              {summary.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>

          <p className="text-sm text-[#2d2a4a]/60 text-center">
            Is this correct?
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {summary && !isGenerating && (
        <div className="flex gap-3">
          <Button
            onClick={onEdit}
            variant="outline"
            className={cn(
              'flex-1 h-12 rounded-xl font-medium',
              'border-[#2d2a4a]/20',
              'hover:bg-[#2d2a4a]/5'
            )}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Description
          </Button>
          <Button
            onClick={handleConfirm}
            className={cn(
              'flex-1 h-12 rounded-xl font-medium transition-all duration-300',
              'bg-gradient-to-r from-[#00d4aa] to-[#0077ff]',
              'hover:shadow-lg hover:shadow-[#00d4aa]/30',
              'text-white'
            )}
          >
            Yes, Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
