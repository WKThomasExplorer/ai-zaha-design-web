export interface ImageGenerationOptions {
  prompt: string;
  imageBase64?: string; // Optional image for Image-to-Image
  size?: "2K" | "1024x1024";
  watermark?: boolean;
}

export interface AIProviderResponse {
  success: boolean;
  imageUrl?: string;
  error?: {
    code: string;
    message: string;
    type: 'AUTH' | 'RATE' | 'SERVER' | 'TIMEOUT' | 'UNKNOWN';
  };
  latency?: number; // Request duration in ms
}

export interface ImageProvider {
  name: string;
  generateImage(options: ImageGenerationOptions): Promise<AIProviderResponse>;
}
