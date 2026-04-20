import { ArkImageProvider } from './ark-provider';
import { ImageProvider, ImageGenerationOptions, AIProviderResponse } from './provider';

export class ImageService {
  private provider: ImageProvider;

  constructor() {
    // Default to Ark, can be extended for multi-provider support/fallback
    this.provider = new ArkImageProvider();
  }

  async generateFacadeEffect(description: string, imageBase64?: string): Promise<AIProviderResponse> {
    const prompt = `Architectural facade renovation rendering, ${description}. High quality architectural visualization, photorealistic, exterior view, professional photography, natural lighting. Keep the building structure consistent but with updated exterior materials and design.`;
    
    return this.provider.generateImage({
      prompt,
      imageBase64,
      size: '2K',
      watermark: false
    });
  }

  async generateExplosionDiagram(description: string, effectImageUrl: string): Promise<AIProviderResponse> {
    const prompt = `Architectural explosion diagram showing building facade materials and layers. ${description}. Technical illustration style with clear labels, numbered layers showing: roof materials, waterproofing, insulation, wall finish, doors and windows. Clean white background, professional technical drawing style with arrows pointing to each layer.`;
    
    // Ark API might require image as Base64 or URL, depending on model. 
    // Here we pass the URL of the generated effect image.
    return this.provider.generateImage({
      prompt,
      imageBase64: effectImageUrl, // The API expects 'image' which can be a URL or Base64
      size: '2K',
      watermark: false
    });
  }
}

export const imageService = new ImageService();
