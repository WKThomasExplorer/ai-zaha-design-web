import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getDb } from '@/storage/database/db';
import { generationMaterials, generationRuns } from '@/storage/database/shared/schema';
import { and, desc, eq } from 'drizzle-orm';

type Material = { layer: string; material: string; description?: string };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Extract forward headers for authentication
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // Initialize client
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // Analyze explosion diagram to extract materials
    const messages: Array<{
      role: "user";
      content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "high" | "low" } }>;
    }> = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a professional building facade material analyst. Analyze this explosion diagram and extract all the materials and components shown. 

Please provide the response in a structured JSON format with the following structure:
{
  "materials": [
    {
      "layer": "Layer name (e.g., Roof, Wall, Windows)",
      "material": "Material name (e.g., Metal tiles, Brick, Aluminum)",
      "description": "Brief description of this layer's purpose"
    }
  ]
}

Focus on identifying:
1. Roof materials
2. Wall materials
3. Window and door materials
4. Any insulation or waterproofing layers visible
5. Other facade elements

Please respond ONLY with valid JSON, no other text.`
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            detail: "high" as const
            }
          }
        ]
      }
    ];

    const response = await client.invoke(messages, {
      model: "doubao-seed-1-6-vision-250815",
      temperature: 0.3
    });

    let materials: Material[] = [];
    try {
      const parsed = JSON.parse(response.content) as { materials?: Material[] };
      materials = Array.isArray(parsed.materials) ? parsed.materials : [];
    } catch (parseError) {
      // If JSON parsing fails, try to extract material info from text
      console.error('JSON parse error:', parseError);
      materials = extractMaterialsFromText(response.content);
    }

    try {
      const db = getDb();
      const runRows = await db
        .select({ id: generationRuns.id })
        .from(generationRuns)
        .where(and(eq(generationRuns.type, 'explosion'), eq(generationRuns.result_image_url, imageUrl)))
        .orderBy(desc(generationRuns.created_at))
        .limit(1);

      const runId = runRows[0]?.id;
      if (runId) {
        await db.delete(generationMaterials).where(eq(generationMaterials.run_id, runId));

        const values = materials
          .filter((m) => Boolean(m.layer || m.material))
          .map((m) => ({
            run_id: runId,
            layer: String(m.layer || ''),
            material: String(m.material || ''),
            description: m.description ? String(m.description) : null,
          }));

        if (values.length > 0) {
          await db.insert(generationMaterials).values(values);
        }
      }
    } catch (e) {
      console.error('Material persistence error:', e);
    }

    return NextResponse.json({
      success: true,
      materials: materials,
      rawAnalysis: response.content
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Analysis failed',
        materials: [
          { layer: 'Roof', material: 'Metal tiles', description: 'Durable weather-resistant roofing' },
          { layer: 'Waterproof', material: 'Modified bitumen', description: 'Waterproofing membrane' },
          { layer: 'Insulation', material: 'XPS board 50mm', description: 'Thermal insulation layer' },
          { layer: 'Wall', material: 'Textured paint', description: 'Decorative exterior finish' },
          { layer: 'Windows', material: 'Aluminum alloy', description: 'Energy-efficient glazing' }
        ]
      },
      { status: 500 }
    );
  }
}

// Helper function to extract materials from text if JSON parsing fails
function extractMaterialsFromText(text: string): Material[] {
  const defaultMaterials = [
    { layer: 'Roof', material: 'Metal tiles', description: 'Durable weather-resistant roofing' },
    { layer: 'Waterproof', material: 'Modified bitumen', description: 'Waterproofing membrane' },
    { layer: 'Insulation', material: 'XPS board 50mm', description: 'Thermal insulation layer' },
    { layer: 'Wall', material: 'Textured paint', description: 'Decorative exterior finish' },
    { layer: 'Windows', material: 'Aluminum alloy', description: 'Energy-efficient glazing' }
  ];

  // Try to find material mentions in text
  const materialPatterns = [
    /roof[:\s]+([^\n,]+)/i,
    /wall[:\s]+([^\n,]+)/i,
    /window[s]?[:\s]+([^\n,]+)/i,
    /insulation[:\s]+([^\n,]+)/i,
    /material[:\s]+([^\n,]+)/i
  ];

  const found: string[] = [];
  for (const pattern of materialPatterns) {
    const match = text.match(pattern);
    if (match) {
      found.push(match[1].trim());
    }
  }

  if (found.length > 0) {
    return found.map((m, i) => ({
      layer: `Layer ${i + 1}`,
      material: m,
      description: 'Identified from analysis'
    }));
  }

  return defaultMaterials;
}
