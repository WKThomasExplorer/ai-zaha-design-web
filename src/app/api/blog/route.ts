import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Seed data for existing articles
const SEED_ARTICLES = [
  {
    title: 'How Effect Renders Help You Visualize Your Dream Home',
    summary: 'Discover how AI-powered effect renders can save you from costly renovation mistakes and help you see your dream home before committing a single dollar.',
    content: `Let's be real: Renovating your home is like trying to bake a cake without a recipe—you have a vague idea of what you want (chocolate! sprinkles!), but you're terrified it'll turn out lopsided or taste like cardboard. Remember that time you painted your living room "coastal blue" only to realize it looked more like a swimming pool someone forgot to fill? Or when you splurged on those "rustic" wooden shelves, only to find they clashed so hard with your modern couch it felt like a design cage match? Yeah, we've all been there.

But what if you could test-drive your dream home before picking up a paintbrush or swinging a hammer? Enter AI-powered effect renders—your new renovation BFF.

Here's how it works: You snap a photo of your current space, type in what you're craving (think "mid-century modern kitchen with gold hardware" or "boho bedroom with a hanging macramé chair"), and boom—AI turns that vague daydream into a hyper-realistic picture. It's like having a magic design genie that doesn't judge your obsession with marble countertops.

Let's say you're debating between a bold terracotta accent wall or a soft sage one. Instead of staring at paint swatches until your eyes cross, you can see both versions side by side in your actual living room. No more guessing if that velvet sofa will fit with your vintage rug—AI plops it right into the render, so you can check the vibe before hitting "add to cart."

Another win? It's like test-driving a car, but for your home. You wouldn't buy a Tesla without taking it for a spin, right? So why commit to a $5,000 backsplash without seeing how it looks with your existing cabinets? My friend Sarah once thought she wanted a minimalist white kitchen—until the AI render showed her that the white counters made her small space feel even tinier. She swapped to warm wood, and now her kitchen feels like a cozy café (minus the overpriced lattes).

The best part? You don't need to be a design pro. You don't even need to know what "scandinavian hygge" means (though the AI definitely does). Just type in your wildest ideas—even "a bathroom that feels like a tropical spa with a waterfall shower"—and let the tech do the heavy lifting. No more arguments with your partner about whether the accent wall is "too much" or the new lighting is "too dim"—the render settles it.

So if you're tired of renovation regrets (looking at you, that neon sign you thought was "edgy"), give AI effect renders a spin. Snap a photo of your space, type in your dream, and watch it come to life—no paint fumes or hammer blisters required. Your future self (and your bank account) will thank you.

Go on—your dream home is just a render away!`,
  },
  {
    title: 'Why Explosion Diagrams Are Your Secret Weapon for Perfect Renovations',
    summary: 'Think of explosion diagrams as X-rays for your house. They reveal every layer, every material, and every hidden detail that makes your renovation tick.',
    content: `Imagine you're about to tackle a kitchen reno—you're giddy over marble countertops and a farmhouse sink, but then... crack. You drill into a wall and hit a water pipe. Cue the panic, the flooded under-sink cabinet, and a call to a plumber that eats into your budget. What if you could've seen that pipe before you picked up the drill? Enter explosion diagrams: the unsung heroes of home renovations, and yes—they're basically X-rays for your house.

Let's break it down (pun absolutely intended): An explosion diagram isn't just a boring blueprint. It's a 3D, layer-by-layer peek into your home's hidden anatomy. Think of it like peeling an onion, but instead of tears, you get answers. It shows where your electrical wires snake behind drywall, how your HVAC ducts loop through the ceiling, and even the type of insulation stuffed in your walls (spoiler: that "mystery fluff" might be outdated fiberglass or, worse, asbestos).

No more guessing if that wall is load-bearing (spoiler 2: you don't want to guess that). These diagrams lay bare every nook, cranny, and critical component you'd never see with the naked eye.

So, what should you hunt for when you're squinting at one? First, load-bearing beams—they're the spine of your home, and messing with them is like skipping leg day for your house (bad idea). Next, utility lines: water pipes, gas lines, and electrical circuits. Mark their paths with colorful tape on your walls before you start demo—your future self (and your wallet) will thank you.

Don't forget insulation type, too—if it's vermiculite (a red flag for asbestos), you'll need a pro to remove it instead of stirring up dangerous fibers. And hey, if you spot old, rusty pipes? That's a heads-up to replace them now, before they burst mid-renovation.

Here's the best part: Explosion diagrams turn chaos into control. You'll know exactly where to drill, where to demo, and where to hit pause. No more surprise costs, no more emergency calls, just smooth sailing toward that dream kitchen (or bathroom, or basement).

So next time you're planning a reno, skip the "wing it" approach. Grab an explosion diagram, channel your inner home detective, and see what's really going on behind those walls. Your house has secrets—let's uncover them (safely).

Happy renovating!`,
  },
  {
    title: 'How Material Lists Can Save You Thousands of Dollars',
    summary: 'Imagine walking into a hardware store with a complete, detailed shopping list. No confusion, no impulse buys, no "Oops, I forgot the waterproofing membrane" moments.',
    content: `Imagine heading to the grocery store without a list. You grab a carton of eggs, then remember you need milk—only to realize you forgot bread on the way out. By the time you circle back, you've overspent on impulse buys (hello, that fancy artisanal cheese) and wasted 20 minutes. Renovating without a material list is the home improvement version of this chaos—except the stakes are way higher than a $5 cheese.

A detailed material list is your renovation shopping list, but supercharged. It doesn't just say "tiles" or "paint"; it specifies 120 square feet of 12x12 porcelain subway tiles (in shade "Cloud White"), 2 gallons of low-VOC satin paint (for the bathroom), and even the 150 feet of waterproof caulk needed to seal the shower edges.

This precision cuts waste: no buying 150 square feet of tiles when you only need 120 (saving $80 on unused material) or rushing to the hardware store for a last-minute caulk tube that costs 30% more than bulk options.

It also nips overcharges in the bud. When contractors see a clear list, they can't pad invoices with "miscellaneous supplies" or charge for extra paint you didn't need. For example, a friend of mine once skipped a list for her kitchen backsplash; her contractor billed her for 5 extra tiles and a premium grout she never agreed to—costing her $120 extra. With a list, you can cross-reference every line item against the invoice, keeping everyone honest.

The stress reduction? Priceless. No 9 PM runs to the hardware store because you forgot a specific screw size. No arguments with your partner about whether you should splurge on a pricier faucet (the list already locks in your budget pick). It turns a chaotic project into a step-by-step plan, so you can focus on the fun part—imagining your new space—instead of panicking about forgotten supplies.

Ready to build your list? Start small: walk the renovation area with a tape measure and note every detail (e.g., "4 baseboards, 8 feet each, oak finish"). Check manufacturer specs (some tiles require extra for cuts) and add a 5-10% buffer for unexpected waste. Share the list with your contractor to align on costs, and update it as you go.

A material list isn't just a piece of paper—it's your renovation budget's best friend. Skip the guesswork, avoid the overspends, and turn your dream space into reality without the financial hangover.`,
  },
];

// GET - Fetch all articles or seed data
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();

  // Check if this is a seed request
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'seed') {
    // Seed the database with initial articles
    try {
      // Check if articles already exist
      const { data: existing } = await client.from('blog_posts').select('id').limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json({ success: true, message: 'Articles already seeded' });
      }

      // Insert seed articles
      const { error } = await client.from('blog_posts').insert(SEED_ARTICLES);
      if (error) {
        throw new Error(`Seed failed: ${error.message}`);
      }

      return NextResponse.json({ success: true, message: 'Articles seeded successfully', count: SEED_ARTICLES.length });
    } catch (err) {
      console.error('Seed error:', err);
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : 'Seed failed' },
        { status: 500 }
      );
    }
  }

  // Fetch all articles ordered by created_at desc
  try {
    const { data, error } = await client
      .from('blog_posts')
      .select('id, title, summary, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Fetch failed: ${error.message}`);
    }

    return NextResponse.json({ success: true, articles: data });
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Fetch failed' },
      { status: 500 }
    );
  }
}
