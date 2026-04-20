import { ImageProvider, ImageGenerationOptions, AIProviderResponse } from './provider';

type ArkImageGenerationRequest = {
  model: string;
  prompt: string;
  image?: string;
  sequential_image_generation: 'disabled' | 'enabled';
  response_format: 'url';
  size: string;
  stream: boolean;
  watermark: boolean;
};

export class ArkImageProvider implements ImageProvider {
  name = 'Ark-Seedream';

  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ARK_API_KEY || '';
    this.model = process.env.ARK_IMAGE_MODEL || 'doubao-seedream-4-0-250828';
    this.baseUrl = process.env.ARK_API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
  }

  async generateImage(options: ImageGenerationOptions): Promise<AIProviderResponse> {
    const startTime = Date.now();
    
    console.log(`[AI-LOG] [${this.name}] Starting generation... Prompt: ${options.prompt.substring(0, 50)}...`);

    try {
      if (!this.apiKey) {
        throw new Error('ARK_API_KEY is not configured');
      }

      const payload: ArkImageGenerationRequest = {
        model: this.model,
        prompt: options.prompt,
        sequential_image_generation: "disabled",
        response_format: "url",
        size: options.size || "2K",
        stream: false,
        watermark: options.watermark !== undefined ? options.watermark : false
      };

      // Add image for image-to-image if provided
      if (options.imageBase64) {
        // Ensure imageBase64 is in a format the API expects (often just the base64 string or a data URL)
        payload.image = options.imageBase64;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const latency = Date.now() - startTime;
      const status = response.status;

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
        const errorMessage = errorBody?.error?.message || response.statusText;
        const errorCode = errorBody?.error?.code || `HTTP_${status}`;
        
        console.error(`[AI-LOG] [${this.name}] Request failed. Status: ${status}, Error: ${errorMessage}, Latency: ${latency}ms`);

        let errorType: 'AUTH' | 'RATE' | 'SERVER' | 'TIMEOUT' | 'UNKNOWN' = 'SERVER';
        if (status === 401 || status === 403) errorType = 'AUTH';
        else if (status === 429) errorType = 'RATE';
        else if (status === 504) errorType = 'TIMEOUT';

        return {
          success: false,
          error: {
            code: errorCode,
            message: `Ark API Error: ${errorMessage}`,
            type: errorType
          },
          latency
        };
      }

      const data = (await response.json()) as { data?: Array<{ url?: string }> };
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        console.error(`[AI-LOG] [${this.name}] No image URL in response. Latency: ${latency}ms`);
        return {
          success: false,
          error: {
            code: 'NO_IMAGE_URL',
            message: 'Ark API returned success but no image URL was found',
            type: 'SERVER'
          },
          latency
        };
      }

      console.log(`[AI-LOG] [${this.name}] Generation success. Latency: ${latency}ms`);
      return {
        success: true,
        imageUrl,
        latency
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error during Ark generation';
      
      console.error(`[AI-LOG] [${this.name}] Unexpected error: ${message}. Latency: ${latency}ms`);
      
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message,
          type: message.includes('timeout') ? 'TIMEOUT' : 'UNKNOWN'
        },
        latency
      };
    }
  }
}
