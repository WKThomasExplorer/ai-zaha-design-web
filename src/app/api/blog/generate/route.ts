import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Article generation prompt
const NEW_ARTICLE_PROMPT = `Write a blog article (400-500 words) about how the combination of effect renders and explosion diagrams creates the ultimate renovation planning tool.

Requirements:
- Tone: Exciting, informative, slightly dramatic
- Explain how effect renders show you the "what" (what your renovated home will look like)
- Explain how explosion diagrams show you the "how" (how the materials work together)
- Emphasize the synergy: renders for visual appeal, explosion diagrams for practical planning
- Include a compelling analogy or story
- End with encouragement to use both tools
- Language: English
- Format: Plain text paragraphs, no lists or headers within the content

Write the article now:`;

const NEW_ARTICLE = {
  title: 'The Perfect Renovation Combo: Effect Renders + Explosion Diagrams',
  summary: 'Discover how combining stunning visual renders with detailed explosion diagrams gives you the ultimate renovation planning power—see what your home will look like AND understand exactly how to build it.',
};

// Generate and save new article
export async function POST(request: NextRequest) {
  try {
    // Generate article content using LLM
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    const messages: Array<{ role: "user"; content: string }> = [{ role: "user", content: NEW_ARTICLE_PROMPT }];

    const response = await llmClient.invoke(messages, {
      model: "doubao-seed-1-6-251015",
      temperature: 0.8,
    });

    const content = response.content;

    // Save to database
    const dbClient = getSupabaseClient();

    const { data, error } = await dbClient
      .from('blog_posts')
      .insert({
        title: NEW_ARTICLE.title,
        summary: NEW_ARTICLE.summary,
        content: content,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      article: data,
      message: 'Article generated and saved successfully',
    });

  } catch (err) {
    console.error('Generation error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

// Get all generated articles (for admin viewing)
export async function GET() {
  try {
    const dbClient = getSupabaseClient();

    const { data, error } = await dbClient
      .from('blog_posts')
      .select('id, title, summary, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Fetch failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      articles: data,
    });

  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Fetch failed' },
      { status: 500 }
    );
  }
}
