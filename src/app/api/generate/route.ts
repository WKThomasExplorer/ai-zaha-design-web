import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, description, type } = body;

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    // Extract forward headers for authentication
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // Initialize client
    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    // Build prompt based on type
    let prompt = description;
    if (type === 'effect') {
      prompt = `Architectural facade renovation rendering, ${description}. High quality architectural visualization, photorealistic, exterior view, professional photography, natural lighting. Keep the building structure consistent but with updated exterior materials and design.`;
    } else if (type === 'explosion') {
      prompt = `Architectural explosion diagram showing building facade materials and layers. ${description}. Technical illustration style with clear labels, numbered layers showing: roof materials, waterproofing, insulation, wall finish, doors and windows. Clean white background, professional technical drawing style with arrows pointing to each layer.`;
    }

    // Generate image
    const response = await client.generate({
      prompt,
      size: '2K',
      watermark: false,
    });

    const helper = client.getResponseHelper(response);

    if (helper.success) {
      return NextResponse.json({
        success: true,
        imageUrl: helper.imageUrls[0],
      });
    } else {
      return NextResponse.json(
        { success: false, error: helper.errorMessages.join(', ') },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
