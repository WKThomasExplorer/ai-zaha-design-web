// Design workflow state
export type DesignState =
  | 'IDLE'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'DESCRIBING'
  | 'AI_CONFIRMING'
  | 'GENERATING'
  | 'COMPLETED'
  | 'ERROR';

// Image file with metadata
export interface UploadedImage {
  file: File;
  preview: string;
  width: number;
  height: number;
}

// Design description from user
export interface DesignDescription {
  raw: string;
  confirmed: boolean;
  summarized?: string;
}

// Style reference
export interface StyleReference {
  id: string;
  name: string;
  category: string;
  prompt: string;
}

// Generated results
export interface GenerationResult {
  effectImageUrl: string;
  explosionImageUrl: string;
  materials?: MaterialItem[];
}

// Material item in explosion diagram
export interface MaterialItem {
  layer: string;
  material: string;
  description?: string;
}

// API request/response types
export interface GenerateEffectRequest {
  imageBase64: string;
  description: string;
  style?: string;
}

export interface GenerateEffectResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface GenerateExplosionRequest {
  effectImageUrl: string;
  description: string;
}

export interface GenerateExplosionResponse {
  success: boolean;
  imageUrl?: string;
  materials?: MaterialItem[];
  error?: string;
}

// Style gallery presets - 50 templates organized by category
export const STYLE_CATEGORIES = [
  'Modern Houses',
  'Commercial Streets',
  'Industrial Renovation',
  'Rural & Homestay',
  'Avant-garde Design',
];

export const STYLE_PRESETS: StyleReference[] = [
  // 🏡 一、 现代住宅与别墅改造 (1-10)
  {
    id: '1',
    name: '1. Minimalist White Box',
    category: 'Modern Houses',
    prompt: 'Maintain original building silhouette and camera angle. Renovate into a minimalist white box modern villa. Pure white stucco walls, large floor-to-ceiling frameless glass. Minimalist zen courtyard, sparse green plants. Bright daylight, ArchDaily style, master composition, photorealistic.',
  },
  {
    id: '2',
    name: '2. Wood & Stone',
    category: 'Modern Houses',
    prompt: 'Maintain the building massing. Renovate into a warm modern style. Natural timber cladding combined with rough slate stone veneer. Cozy and inviting atmosphere, warm interior lighting spilling out. Golden hour, cinematic lighting, architectural photography.',
  },
  {
    id: '3',
    name: '3. Brutalist Concrete',
    category: 'Modern Houses',
    prompt: 'Keep architectural details and camera angle unchanged. Brutalist modern renovation. Exposed board-formed concrete facade, geometric purity. Dramatic shadows, minimalist dry landscape. Overcast soft light, top-tier architectural visualization, 8k resolution.',
  },
  {
    id: '4',
    name: '4. Wabi-Sabi',
    category: 'Modern Houses',
    prompt: 'Maintain original outlines. Renovate into a Wabi-Sabi retreat. Textured micro-cement walls in beige tones, rustic wooden elements. Soft diffused lighting, serene atmosphere, dry branches landscaping. Photorealistic, soft focus, highly detailed.',
  },
  {
    id: '5',
    name: '5. High-Tech Glass House',
    category: 'Modern Houses',
    prompt: 'Maintain building volume. Transform into a high-tech modern glass house. Ultra-clear frameless glass, sleek steel structure, smart shading louvers. Twilight blue hour, glowing interior, luxury vibe, Unreal Engine 5 render style.',
  },
  {
    id: '6',
    name: '6. Tropical Modernism',
    category: 'Modern Houses',
    prompt: 'Keep the silhouette unchanged. Tropical modernism renovation. Vertical wooden louvers, deep overhanging eaves. Surrounded by lush tropical plants and palm trees. Sunny bright day, vivid colors, resort vibe, competition-grade visualization.',
  },
  {
    id: '7',
    name: '7. Mediterranean Revival',
    category: 'Modern Houses',
    prompt: 'Maintain original structure. Renovate into a modern Mediterranean style. White textured plaster walls, terracotta roof accents, arched window frames. Olive trees in the yard. Golden hour lighting, warm and romantic atmosphere, cinematic.',
  },
  {
    id: '8',
    name: '8. Mid-Century Modern',
    category: 'Modern Houses',
    prompt: 'Keep building massing. Mid-Century Modern renovation. Flat roof, breeze block decorative walls, warm walnut wood panels. Vintage modern aesthetic, manicured lawn. Bright sunlight, sharp shadows, magazine cover quality.',
  },
  {
    id: '9',
    name: '9. Neo-Classical Luxury',
    category: 'Modern Houses',
    prompt: 'Maintain outlines. Neo-classical modern facade. Sleek white marble cladding, subtle bronze metal trims, symmetrical elegance. Upscale urban residential vibe. Soft daylight, highly detailed textures, luxurious atmosphere.',
  },
  {
    id: '10',
    name: '10. Dark Minimalist',
    category: 'Modern Houses',
    prompt: 'Maintain camera angle and silhouette. Dark minimalist modern architecture. Matte black metal panels, dark tinted glass. Moody atmosphere, rainy day with wet reflective ground. Cinematic lighting, mysterious and high-end.',
  },

  // 🏬 二、 商业街区与都市立面改造 (11-20)
  {
    id: '11',
    name: '11. Cyberpunk Neon',
    category: 'Commercial Streets',
    prompt: 'Maintain building outlines. Cyberpunk style street facade renovation. Dark metallic cladding, vibrant neon LED strips, holographic glass screens. Rainy night, wet street reflections, futuristic urban vibe, cinematic movie still.',
  },
  {
    id: '12',
    name: '12. Vertical Green Eco',
    category: 'Commercial Streets',
    prompt: 'Keep the silhouette unchanged. Eco-friendly sustainable architecture. Facade covered with lush vertical gardens and timber fins. Urban oasis concept, bright daylight, fresh and vibrant atmosphere, Dezeen style photography.',
  },
  {
    id: '13',
    name: '13. Luxury Retail',
    category: 'Commercial Streets',
    prompt: 'Maintain original massing. Luxury retail flagship store facade. Brushed bronze panels, ultra-clear curved glass, minimalist high-end design. Evening warm lighting, clean street environment, sophisticated urban aesthetic, 8k.',
  },
  {
    id: '14',
    name: '14. Pop Art Color Block',
    category: 'Commercial Streets',
    prompt: 'Keep architectural volume. Pop-art vibrant street facade. Color-blocking geometric metal panels in primary colors (red, blue, yellow). Lively street atmosphere, sunny day, bold and creative design, high contrast.',
  },
  {
    id: '15',
    name: '15. Brick & Glass Fusion',
    category: 'Commercial Streets',
    prompt: 'Maintain building silhouette. Historic preservation meets modern design. Preserved original red brick base, sleek modern glass box extension on top. Harmonious contrast, urban street context. Overcast soft light, realistic textures.',
  },
  {
    id: '16',
    name: '16. Kinetic Metal Skin',
    category: 'Commercial Streets',
    prompt: 'Keep camera angle. High-tech kinetic facade renovation. Moving triangular aluminum louvers, dynamic shadow patterns. Futuristic urban street, sleek and clean. Bright cinematic lighting, master architectural photography.',
  },
  {
    id: '17',
    name: '17. Glowing U-Glass',
    category: 'Commercial Streets',
    prompt: 'Maintain outlines. Translucent U-profile glass facade renovation. Blurred interior silhouettes, glowing box effect. Night scene, soft ethereal glow, minimalist urban aesthetic. Photorealistic, highly detailed.',
  },
  {
    id: '18',
    name: '18. Terracotta Baguettes',
    category: 'Commercial Streets',
    prompt: 'Keep the silhouette. Elegant street facade. Warm terracotta vertical baguettes/louvers, dappled sunlight filtering through. Sophisticated urban vibe, clean pavement. Golden hour, architectural visualization.',
  },
  {
    id: '19',
    name: '19. Minimalist Cafe',
    category: 'Commercial Streets',
    prompt: 'Maintain building massing. Minimalist cafe facade renovation. Micro-cement finish, large folding wooden windows fully opened. Street seating, warm inviting atmosphere. Sunny morning, lifestyle photography, cozy vibe.',
  },
  {
    id: '20',
    name: '20. Titanium Zinc Sharp',
    category: 'Commercial Streets',
    prompt: 'Maintain original outlines. Futuristic metallic facade. Titanium zinc panels with sharp, angular geometric cuts. Sci-fi urban aesthetic. Blue hour, dramatic artificial lighting highlighting the edges, 8k resolution.',
  },

  // 🏭 三、 工业遗存与厂房改造 (21-30)
  {
    id: '21',
    name: '21. Corten & Red Brick',
    category: 'Industrial Renovation',
    prompt: 'Maintain building silhouette. Old factory renovation. Weathered Corten steel panels contrasting with original rough red brick. Industrial chic, dramatic stormy sky. Cinematic lighting, raw and powerful aesthetic.',
  },
  {
    id: '22',
    name: '22. White Art Factory',
    category: 'Industrial Renovation',
    prompt: 'Keep camera angle. Industrial loft turned art gallery. Whitewashed brick walls, black steel window frames, bright and airy. Minimalist landscaping. Overcast soft light, clean and sophisticated, MIR style.',
  },
  {
    id: '23',
    name: '23. Glass Top Addition',
    category: 'Industrial Renovation',
    prompt: 'Maintain original massing. Adaptive reuse of industrial building. Heavy masonry base with a glowing modern glass volume added on top. Twilight, warm interior lights, striking architectural contrast, high realism.',
  },
  {
    id: '24',
    name: '24. Aluminum Mesh Tech',
    category: 'Industrial Renovation',
    prompt: 'Keep the silhouette. Factory converted into a tech hub. Facade wrapped in expanded aluminum mesh, sleek and modern industrial look. Soft diffused daylight, professional architectural visualization.',
  },
  {
    id: '25',
    name: '25. Brewery/Restaurant',
    category: 'Industrial Renovation',
    prompt: 'Maintain building outlines. Industrial brewery renovation. Exposed steel structure, copper pipe details, large glass garage doors. Night scene, warm Edison bulb lighting, lively atmosphere, photorealistic.',
  },
  {
    id: '26',
    name: '26. Creative Office Loft',
    category: 'Industrial Renovation',
    prompt: 'Keep original volume. Creative office loft. Corrugated metal cladding painted in dark grey, vivid yellow window frames for pop. Playful industrial vibe. Bright sunny day, sharp shadows.',
  },
  {
    id: '27',
    name: '27. Greenhouse Factory',
    category: 'Industrial Renovation',
    prompt: 'Maintain massing. Factory turned greenhouse. Extensive roof skylights, rusted steel frame, interior jungle visible from outside. Sunny day, natural and industrial fusion, highly detailed textures.',
  },
  {
    id: '28',
    name: '28. Brutalist Megastructure',
    category: 'Industrial Renovation',
    prompt: 'Keep camera angle. Brutalist warehouse renovation. Massive raw concrete surfaces, monumental scale, minimal glass insertions. Moody cinematic lighting, dramatic and imposing atmosphere.',
  },
  {
    id: '29',
    name: '29. Wood in Concrete Shell',
    category: 'Industrial Renovation',
    prompt: 'Maintain silhouette. Adaptive reuse. Warm timber structures inserted within the old concrete factory shell. Beautiful contrast between warm wood and cold concrete. Golden hour, soft and inviting.',
  },
  {
    id: '30',
    name: '30. Polycarbonate Light',
    category: 'Industrial Renovation',
    prompt: 'Maintain original massing. Polycarbonate facade renovation. Translucent corrugated plastic panels replacing old walls. Soft glowing effect at twilight, lightweight industrial aesthetic, highly photorealistic.',
  },

  // 🏕️ 四、 乡村旧房与文旅民宿改造 (31-40)
  {
    id: '31',
    name: '31. Nordic Charred Wood',
    category: 'Rural & Homestay',
    prompt: 'Maintain building silhouette. Nordic cabin renovation. Shou Sugi Ban (charred black wood) facade, minimalist design. Snowy landscape context, warm orange interior glow. Cozy winter vibe, cinematic.',
  },
  {
    id: '32',
    name: '32. Rammed Earth',
    category: 'Rural & Homestay',
    prompt: 'Keep camera angle. Rural homestay renovation. Rammed earth wall textures, blending seamlessly with the natural environment. Golden hour, warm and rustic, highly detailed earthy textures.',
  },
  {
    id: '33',
    name: '33. Bamboo Pavilion',
    category: 'Rural & Homestay',
    prompt: 'Maintain original massing. Bamboo pavilion style renovation. Woven bamboo facade, organic and flowing lines. Misty mountain backdrop, serene and zen atmosphere. Soft natural lighting.',
  },
  {
    id: '34',
    name: '34. Mirror Glass Cabin',
    category: 'Rural & Homestay',
    prompt: 'Keep the silhouette. Mirror glass cabin renovation. Facade entirely clad in reflective mirrored glass, reflecting the surrounding forest. Invisible architecture concept. Morning mist, ethereal and magical.',
  },
  {
    id: '35',
    name: '35. Stone & Black Steel',
    category: 'Rural & Homestay',
    prompt: 'Maintain building outlines. Rustic luxury stone cottage. Local rough stone walls combined with modern black steel roof and window frames. High-end resort vibe. Bright daylight, crisp details.',
  },
  {
    id: '36',
    name: '36. Waterfront Lakehouse',
    category: 'Rural & Homestay',
    prompt: 'Keep original volume. Lakehouse renovation. Natural timber decking and facade, expansive water views, extending over the lake. Serene blue hour, reflections on water, peaceful atmosphere.',
  },
  {
    id: '37',
    name: '37. Desert Retreat',
    category: 'Rural & Homestay',
    prompt: 'Maintain silhouette. Desert retreat renovation. Sand-colored stucco walls, flat roof. Cactus and dry landscaping. Harsh midday sun, sharp dramatic shadows, minimalist and raw.',
  },
  {
    id: '38',
    name: '38. Modern A-Frame',
    category: 'Rural & Homestay',
    prompt: 'Keep camera angle. Modern A-frame cabin renovation. Sleek black metal roof extending to the ground, full glass front facade. Deep forest setting, warm interior lighting, photorealistic.',
  },
  {
    id: '39',
    name: '39. New Chinese Courtyard',
    category: 'Rural & Homestay',
    prompt: 'Maintain original massing. Modern Chinese style courtyard renovation. Grey brick walls, dark wooden lattice windows. Central zen garden with a pine tree. Soft overcast light, poetic and elegant.',
  },
  {
    id: '40',
    name: '40. Treehouse Stilts',
    category: 'Rural & Homestay',
    prompt: 'Keep the silhouette. Treehouse style renovation. Elevated structure, vertical wooden slat facade, integrated with existing large trees. Dappled sunlight through leaves, nature-immersed vibe.',
  },

  // 🔮 五、 前卫设计与特殊材质/光影 (41-50)
  {
    id: '41',
    name: '41. Oxidized Copper',
    category: 'Avant-garde Design',
    prompt: 'Maintain building silhouette. Avant-garde renovation. Oxidized green copper panel facade. Historic yet highly modern aesthetic. Rainy day, moody atmosphere, rich metallic textures.',
  },
  {
    id: '42',
    name: '42. Parametric Fluid',
    category: 'Avant-garde Design',
    prompt: 'Keep camera angle. Parametric fluid architecture. Curved white aluminum panels forming seamless organic shapes. Futuristic and dynamic. Bright daylight, smooth surfaces, Unreal Engine 5 style.',
  },
  {
    id: '43',
    name: '43. Water Reflection Pool',
    category: 'Avant-garde Design',
    prompt: 'Maintain original massing. Facade interacting with water. Minimalist building with a large reflection pool in front. Perfect symmetrical reflection. Serene twilight, architectural masterpiece.',
  },
  {
    id: '44',
    name: '44. Foggy Mountain Mist',
    category: 'Avant-garde Design',
    prompt: 'Keep the silhouette. Architecture emerging from fog. Dark slate facade, minimalist details. Heavy mist and fog, moody cinematic movie still, mysterious and dramatic lighting.',
  },
  {
    id: '45',
    name: '45. Autumn Foliage',
    category: 'Avant-garde Design',
    prompt: 'Maintain building outlines. Autumn landscape context. Warm cedar wood facade perfectly complementing vibrant red and yellow autumn foliage. Golden hour sunlight, warm and inviting.',
  },
  {
    id: '46',
    name: '46. Cherry Blossom Spring',
    category: 'Avant-garde Design',
    prompt: 'Keep original volume. Springtime context. Light grey fair-faced concrete facade surrounded by blooming pink cherry blossoms. Bright, airy, and romantic atmosphere, soft pastel tones.',
  },
  {
    id: '47',
    name: '47. Night Lighting',
    category: 'Avant-garde Design',
    prompt: 'Maintain silhouette. Focus on architectural lighting. Dark night scene, strategic wall-washing lights highlighting the texture of the stone facade. High contrast, dramatic and luxurious.',
  },
  {
    id: '48',
    name: '48. Sunset Silhouette',
    category: 'Avant-garde Design',
    prompt: 'Keep camera angle. Sunset silhouette. Backlit architecture, strong dark silhouette against a fiery sunset sky. Glowing edges, highly artistic and cinematic composition.',
  },
  {
    id: '49',
    name: '49. Holographic Facade',
    category: 'Avant-garde Design',
    prompt: 'Maintain original massing. Future urban renovation. Glass facade acting as a canvas for subtle holographic projections. Night scene, cyberpunk light touches but clean and high-end.',
  },
  {
    id: '50',
    name: '50. Iridescent Polycarbonate',
    category: 'Avant-garde Design',
    prompt: 'Keep the silhouette. Iridescent facade. Polycarbonate panels that shift colors (subtle pinks, blues, purples) depending on the angle. Soft twilight, dreamy and ethereal visualization.',
  },
];

// Get styles by category
export function getStylesByCategory(category: string): StyleReference[] {
  return STYLE_PRESETS.filter((style) => style.category === category);
}

// Get style by id
export function getStyleById(id: string): StyleReference | undefined {
  return STYLE_PRESETS.find((style) => style.id === id);
}

// ============================================
// Blog Article Types
// ============================================

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
}

// Static blog data - content generated by LLM
export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: '1',
    slug: 'how-effect-renders-help-you-visualize',
    title: 'How Effect Renders Help You Visualize Your Dream Home',
    excerpt: 'Discover how AI-powered effect renders can save you from costly renovation mistakes and help you see your dream home before committing a single dollar.',
    content: `Let's be real: Renovating your home is like trying to bake a cake without a recipe—you have a vague idea of what you want (chocolate! sprinkles!), but you're terrified it'll turn out lopsided or taste like cardboard. Remember that time you painted your living room "coastal blue" only to realize it looked more like a swimming pool someone forgot to fill? Or when you splurged on those "rustic" wooden shelves, only to find they clashed so hard with your modern couch it felt like a design cage match? Yeah, we've all been there.

But what if you could test-drive your dream home before picking up a paintbrush or swinging a hammer? Enter AI-powered effect renders—your new renovation BFF.

Here's how it works: You snap a photo of your current space, type in what you're craving (think "mid-century modern kitchen with gold hardware" or "boho bedroom with a hanging macramé chair"), and boom—AI turns that vague daydream into a hyper-realistic picture. It's like having a magic design genie that doesn't judge your obsession with marble countertops.

Let's say you're debating between a bold terracotta accent wall or a soft sage one. Instead of staring at paint swatches until your eyes cross, you can see both versions side by side in your actual living room. No more guessing if that velvet sofa will fit with your vintage rug—AI plops it right into the render, so you can check the vibe before hitting "add to cart."

Another win? It's like test-driving a car, but for your home. You wouldn't buy a Tesla without taking it for a spin, right? So why commit to a $5,000 backsplash without seeing how it looks with your existing cabinets? My friend Sarah once thought she wanted a minimalist white kitchen—until the AI render showed her that the white counters made her small space feel even tinier. She swapped to warm wood, and now her kitchen feels like a cozy café (minus the overpriced lattes).

The best part? You don't need to be a design pro. You don't even need to know what "scandinavian hygge" means (though the AI definitely does). Just type in your wildest ideas—even "a bathroom that feels like a tropical spa with a waterfall shower"—and let the tech do the heavy lifting. No more arguments with your partner about whether the accent wall is "too much" or the new lighting is "too dim"—the render settles it.

So if you're tired of renovation regrets (looking at you, that neon sign you thought was "edgy"), give AI effect renders a spin. Snap a photo of your space, type in your dream, and watch it come to life—no paint fumes or hammer blisters required. Your future self (and your bank account) will thank you.

Go on—your dream home is just a render away!`,
    author: 'AI Zaha Team',
    publishedAt: '2024-01-15',
    readTime: '4 min read',
    tags: ['Design Tips', 'AI Technology', 'Home Renovation'],
  },
  {
    id: '2',
    slug: 'why-explosion-diagrams-matter',
    title: 'Why Explosion Diagrams Are Your Secret Weapon for Perfect Renovations',
    excerpt: 'Think of explosion diagrams as X-rays for your house. They reveal every layer, every material, and every hidden detail that makes your renovation tick.',
    content: `Imagine you're about to tackle a kitchen reno—you're giddy over marble countertops and a farmhouse sink, but then... crack. You drill into a wall and hit a water pipe. Cue the panic, the flooded under-sink cabinet, and a call to a plumber that eats into your budget. What if you could've seen that pipe before you picked up the drill? Enter explosion diagrams: the unsung heroes of home renovations, and yes—they're basically X-rays for your house.

Let's break it down (pun absolutely intended): An explosion diagram isn't just a boring blueprint. It's a 3D, layer-by-layer peek into your home's hidden anatomy. Think of it like peeling an onion, but instead of tears, you get answers. It shows where your electrical wires snake behind drywall, how your HVAC ducts loop through the ceiling, and even the type of insulation stuffed in your walls (spoiler: that "mystery fluff" might be outdated fiberglass or, worse, asbestos).

No more guessing if that wall is load-bearing (spoiler 2: you don't want to guess that). These diagrams lay bare every nook, cranny, and critical component you'd never see with the naked eye.

So, what should you hunt for when you're squinting at one? First, load-bearing beams—they're the spine of your home, and messing with them is like skipping leg day for your house (bad idea). Next, utility lines: water pipes, gas lines, and electrical circuits. Mark their paths with colorful tape on your walls before you start demo—your future self (and your wallet) will thank you.

Don't forget insulation type, too—if it's vermiculite (a red flag for asbestos), you'll need a pro to remove it instead of stirring up dangerous fibers. And hey, if you spot old, rusty pipes? That's a heads-up to replace them now, before they burst mid-renovation.

Here's the best part: Explosion diagrams turn chaos into control. You'll know exactly where to drill, where to demo, and where to hit pause. No more surprise costs, no more emergency calls, just smooth sailing toward that dream kitchen (or bathroom, or basement).

So next time you're planning a reno, skip the "wing it" approach. Grab an explosion diagram, channel your inner home detective, and see what's really going on behind those walls. Your house has secrets—let's uncover them (safely).

Happy renovating!`,
    author: 'AI Zaha Team',
    publishedAt: '2024-01-20',
    readTime: '5 min read',
    tags: ['Explosion Diagram', 'Materials', 'Renovation Guide'],
  },
  {
    id: '3',
    slug: 'material-lists-save-thousands',
    title: 'How Material Lists Can Save You Thousands of Dollars',
    excerpt: 'Imagine walking into a hardware store with a complete, detailed shopping list. No confusion, no impulse buys, no "Oops, I forgot the waterproofing membrane" moments.',
    content: `Imagine heading to the grocery store without a list. You grab a carton of eggs, then remember you need milk—only to realize you forgot bread on the way out. By the time you circle back, you've overspent on impulse buys (hello, that fancy artisanal cheese) and wasted 20 minutes. Renovating without a material list is the home improvement version of this chaos—except the stakes are way higher than a $5 cheese.

A detailed material list is your renovation shopping list, but supercharged. It doesn't just say "tiles" or "paint"; it specifies 120 square feet of 12x12 porcelain subway tiles (in shade "Cloud White"), 2 gallons of low-VOC satin paint (for the bathroom), and even the 150 feet of waterproof caulk needed to seal the shower edges.

This precision cuts waste: no buying 150 square feet of tiles when you only need 120 (saving $80 on unused material) or rushing to the hardware store for a last-minute caulk tube that costs 30% more than bulk options.

It also nips overcharges in the bud. When contractors see a clear list, they can't pad invoices with "miscellaneous supplies" or charge for extra paint you didn't need. For example, a friend of mine once skipped a list for her kitchen backsplash; her contractor billed her for 5 extra tiles and a premium grout she never agreed to—costing her $120 extra. With a list, you can cross-reference every line item against the invoice, keeping everyone honest.

The stress reduction? Priceless. No 9 PM runs to the hardware store because you forgot a specific screw size. No arguments with your partner about whether you should splurge on a pricier faucet (the list already locks in your budget pick). It turns a chaotic project into a step-by-step plan, so you can focus on the fun part—imagining your new space—instead of panicking about forgotten supplies.

Ready to build your list? Start small: walk the renovation area with a tape measure and note every detail (e.g., "4 baseboards, 8 feet each, oak finish"). Check manufacturer specs (some tiles require extra for cuts) and add a 5-10% buffer for unexpected waste. Share the list with your contractor to align on costs, and update it as you go.

A material list isn't just a piece of paper—it's your renovation budget's best friend. Skip the guesswork, avoid the overspends, and turn your dream space into reality without the financial hangover.`,
    author: 'AI Zaha Team',
    publishedAt: '2024-01-25',
    readTime: '6 min read',
    tags: ['Cost Saving', 'Material Lists', 'Budget Planning'],
  },
];

// Helper to get article by slug
export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((article) => article.slug === slug);
}
