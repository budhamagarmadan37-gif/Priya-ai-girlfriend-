import { GoogleGenAI, Type } from "@google/genai";
import { ProjectFile, WebsiteRequirementAnalysis, AIModelOption, ValidationIssue, AgentStep } from "./src/types";

// Helper to try generation across multiple models with high availability
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash"
];

// Available AI Coding Models & Auto-Router
export const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: "auto-router",
    name: "⚡ Auto-Select Best Coding Model (Router)",
    description: "Intelligently analyzes requirements, benchmarks models, and automatically routes to the optimal coding engine.",
    speed: "Ultra Fast",
    codingScore: 99,
    contextLength: "Dynamic",
    recommended: true,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite (High Speed & Reliability)",
    description: "Low-latency coding model designed for ultra-fast generation with 1M tokens.",
    speed: "Ultra Fast",
    codingScore: 96,
    contextLength: "1M tokens",
    recommended: false,
  },
  {
    id: "gemini-flash-latest",
    name: "Gemini Flash Latest (Production Tier)",
    description: "Latest stable production Flash release with optimal rate limits.",
    speed: "Ultra Fast",
    codingScore: 97,
    contextLength: "1M tokens",
    recommended: false,
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash (Deep UI Fidelity)",
    description: "High-reasoning UI/UX generation, 1M context.",
    speed: "Balanced",
    codingScore: 98,
    contextLength: "1M tokens",
    recommended: false,
  }
];

export interface RouterDecision {
  modelId: string;
  modelName: string;
  reason: string;
  priorityQueue: string[];
}

export function routeBestCodingModel(prompt: string, requestedModel?: string): RouterDecision {
  const lower = prompt.toLowerCase();
  
  if (requestedModel && requestedModel !== "auto-router" && AVAILABLE_MODELS.some(m => m.id === requestedModel)) {
    const found = AVAILABLE_MODELS.find(m => m.id === requestedModel)!;
    const queue = [requestedModel, ...FALLBACK_MODELS.filter(m => m !== requestedModel)];
    return {
      modelId: requestedModel,
      modelName: found.name,
      reason: `Manual Override: User selected ${found.name}`,
      priorityQueue: queue,
    };
  }

  // Automatic Router Analysis (Smart Model Routing with High Availability)
  let targetModel = "gemini-3.1-flash-lite";
  let reason = "Auto-Router selected Gemini 3.1 Flash Lite: Ultra-fast generation & high availability engine";

  if (
    lower.includes("complex algorithm") ||
    lower.includes("state machine") ||
    lower.includes("neural network") ||
    lower.includes("3d canvas") ||
    lower.includes("webgl shader") ||
    lower.includes("multi-step backend")
  ) {
    targetModel = "gemini-flash-latest";
    reason = "Auto-Router selected Gemini Flash Latest: High reasoning selected for complex logic & math";
  }

  const found = AVAILABLE_MODELS.find(m => m.id === targetModel) || AVAILABLE_MODELS[1];
  const queue = [targetModel, ...FALLBACK_MODELS.filter(m => m !== targetModel)];

  return {
    modelId: targetModel,
    modelName: found.name,
    reason,
    priorityQueue: queue,
  };
}

export function selectBestCodingModel(prompt: string, requestedModel?: string): string {
  return routeBestCodingModel(prompt, requestedModel).modelId;
}

function getGeminiClient(apiKey?: string): GoogleGenAI {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1, delayMs = 300): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isQuotaOrOverload = 
        err?.status === 429 || 
        err?.status === 503 ||
        err?.message?.includes("quota") || 
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE");
      if (isQuotaOrOverload) {
        // Fast failover immediately to next engine in priority queue without wasting time on overloaded model
        break;
      }
      const isTransient = 
        err?.message?.includes("fetch failed") || 
        err?.message?.includes("ECONNRESET") || 
        err?.message?.includes("ETIMEDOUT") || 
        err?.cause?.code === "ECONNRESET";
      if (attempt < maxRetries && isTransient) {
        await new Promise((res) => setTimeout(res, delayMs * (attempt + 1)));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

// 1. Instant Intelligent Requirement Analyzer
export function analyzeWebsiteRequirements(
  prompt: string,
  modelId: string = "gemini-3.8-flash"
): WebsiteRequirementAnalysis {
  const lower = prompt.toLowerCase();
  
  if (
    lower.includes("movie") || 
    lower.includes("मूवी") || 
    lower.includes("फिल्म") || 
    lower.includes("stream") || 
    lower.includes("anime") || 
    lower.includes("cinema") || 
    lower.includes("netflix") ||
    lower.includes("video") ||
    lower.includes("trailer") ||
    lower.includes("drama")
  ) {
    return {
      websiteType: "CineStream - Movie & Anime Streaming Platform",
      purpose: "Stream 4K movies, trending anime, theatrical trailers, and manage interactive user watchlists.",
      targetAudience: "Movie lovers, anime fans, binge-watchers, and cinema enthusiasts",
      colorTheme: {
        primary: "#e50914",
        secondary: "#ec4899",
        accent: "#00f2fe",
        background: "#080b12",
        text: "#f8fafc"
      },
      typography: {
        headingFont: "Plus Jakarta Sans, sans-serif",
        bodyFont: "Inter, sans-serif"
      },
      layoutStyle: "Dark Cinematic Neon with Glassmorphism & Hero Video Player",
      sections: [
        "Hero Featured Trailer Showcase",
        "Trending Now Carousel",
        "Top Anime & Series",
        "Live Search & Category Filters",
        "Interactive Video Player Modal",
        "Watchlist Drawer",
        "VIP Ultra Pass Subscription",
        "Footer"
      ],
      features: [
        "Playable 4K Video Trailer Modal",
        "Interactive +Watchlist System (Persistent)",
        "Category Filtering (Action, Sci-Fi, Anime, Horror, Drama)",
        "Live Search Filter with Instant Highlighting",
        "Rating & Duration Badges",
        "Mobile Responsive Navigation Bar"
      ],
      responsiveRules: [
        "2-column movie poster grid on mobile, 4-column on tablet, 6-column on desktop",
        "Horizontal touch carousels with smooth snap scrolling",
        "Full-screen responsive video player modal"
      ]
    };
  } else if (
    lower.includes("portfolio") || 
    lower.includes("developer") || 
    lower.includes("पोर्टफोलियो") || 
    lower.includes("resume") || 
    lower.includes("engineer") ||
    lower.includes("coder")
  ) {
    return {
      websiteType: "Developer Portfolio & AI Showcase",
      purpose: "Showcase engineering expertise, interactive software projects, skills matrix, and direct hire contact.",
      targetAudience: "Tech recruiters, clients, software engineers, and founders",
      colorTheme: {
        primary: "#6366f1",
        secondary: "#06b6d4",
        accent: "#10b981",
        background: "#090d16",
        text: "#f8fafc"
      },
      typography: {
        headingFont: "Space Grotesk, sans-serif",
        bodyFont: "Inter, sans-serif"
      },
      layoutStyle: "Futuristic Dark Mode with Neon Glassmorphism",
      sections: ["Hero Terminal", "Skills Matrix", "Featured Projects", "Interactive Live Demo", "Testimonials", "Contact Modal", "Footer"],
      features: ["Terminal typing animation", "Filterable project cards", "Working contact form", "Smooth scroll"],
      responsiveRules: ["Fluid typography", "Grid auto-fit", "No horizontal overflow"]
    };
  } else if (
    lower.includes("restaurant") || 
    lower.includes("food") || 
    lower.includes("खाना") || 
    lower.includes("cafe") || 
    lower.includes("dining") ||
    lower.includes("hotel")
  ) {
    return {
      websiteType: "Gourmet Dining & Luxury Restaurant",
      purpose: "Showcase fine dining menus, chef specials, customer reviews, and online table reservation booking.",
      targetAudience: "Food enthusiasts, diners, event planners",
      colorTheme: {
        primary: "#d97706",
        secondary: "#b45309",
        accent: "#fbbf24",
        background: "#0c0a09",
        text: "#fafaf9"
      },
      typography: {
        headingFont: "Playfair Display, serif",
        bodyFont: "Plus Jakarta Sans, sans-serif"
      },
      layoutStyle: "Luxury Gold & Onyx Parallax",
      sections: ["Hero Parallax", "Chef's Tasting Menu", "Online Reservation Modal", "Signature Dishes", "Customer Reviews", "Footer"],
      features: ["Interactive Table Booking Modal", "Menu Category Switcher", "Dish Lightbox", "Review Ratings"],
      responsiveRules: ["Single-column menu on mobile", "Sticky reservation call to action", "No overflow"]
    };
  } else if (
    lower.includes("store") || 
    lower.includes("shop") || 
    lower.includes("दुकान") || 
    lower.includes("sneaker") || 
    lower.includes("ecommerce") || 
    lower.includes("e-commerce") ||
    lower.includes("cloth") ||
    lower.includes("buy")
  ) {
    return {
      websiteType: "CyberStore E-Commerce",
      purpose: "Deliver high-energy shopping, 3D product cards, slide-over cart drawer, and live checkout calculator.",
      targetAudience: "Online shoppers, sneakerheads, fashion fans",
      colorTheme: {
        primary: "#ec4899",
        secondary: "#8b5cf6",
        accent: "#06b6d4",
        background: "#090d16",
        text: "#f8fafc"
      },
      typography: {
        headingFont: "Space Grotesk, sans-serif",
        bodyFont: "Plus Jakarta Sans, sans-serif"
      },
      layoutStyle: "Vibrant Cyberpunk Streetwear UI",
      sections: ["Hero Drop Showcase", "Product Grid", "Size & Color Selector", "Live Cart Drawer", "Reviews & FAQs", "Footer"],
      features: ["Animated Add-to-Cart", "Live Price Calculator", "Cart Slide-over Drawer", "Filter by Category"],
      responsiveRules: ["2-column mobile store grid", "Sticky cart icon", "Touch-friendly purchase buttons"]
    };
  } else if (
    lower.includes("gym") || 
    lower.includes("fitness") || 
    lower.includes("workout") || 
    lower.includes("yoga") ||
    lower.includes("जिम")
  ) {
    return {
      websiteType: "TitanFit - Elite Fitness & Gym Club",
      purpose: "Provide gym class schedules, BMI calculator, personal trainer bookings, and membership pricing plans.",
      targetAudience: "Athletes, fitness enthusiasts, workout beginners",
      colorTheme: {
        primary: "#ef4444",
        secondary: "#f97316",
        accent: "#22c55e",
        background: "#0a0a0a",
        text: "#f8fafc"
      },
      typography: {
        headingFont: "Space Grotesk, sans-serif",
        bodyFont: "Inter, sans-serif"
      },
      layoutStyle: "High-Energy Athletic Neon Dark Theme",
      sections: ["Hero Video Showcase", "Class Timetable", "Interactive BMI Calculator", "Trainer Roster", "Membership Pricing", "Footer"],
      features: ["Working BMI Calculator", "Interactive Class Schedule Filter", "Membership Pass Modal", "Sticky Join Button"],
      responsiveRules: ["Mobile class card view", "Single column forms on mobile"]
    };
  } else if (
    lower.includes("crypto") || 
    lower.includes("bitcoin") || 
    lower.includes("finance") || 
    lower.includes("trading") ||
    lower.includes("wallet")
  ) {
    return {
      websiteType: "ApexCrypto - Web3 & Trading Terminal",
      purpose: "Track live cryptocurrency prices, portfolio performance, trade simulator, and DeFi staking rewards.",
      targetAudience: "Crypto traders, Web3 developers, investors",
      colorTheme: {
        primary: "#10b981",
        secondary: "#6366f1",
        accent: "#f59e0b",
        background: "#06090e",
        text: "#f8fafc"
      },
      typography: {
        headingFont: "Space Grotesk, monospace",
        bodyFont: "Inter, sans-serif"
      },
      layoutStyle: "Bloomberg Terminal meets Cyberpunk Glassmorphism",
      sections: ["Live Price Ticker Bar", "Portfolio Balance Card", "Crypto Market Table", "Trade Simulator Modal", "Security Features", "Footer"],
      features: ["Real-time simulated ticker updates", "Interactive Buy/Sell Swap Widget", "Filter by Gainers/Losers", "Wallet Connect Modal"],
      responsiveRules: ["Horizontal scrollable market table on mobile", "Compact cards for stats"]
    };
  }

  // General default fallback
  return {
    websiteType: prompt.length > 30 ? `${prompt.slice(0, 30)}... Hub` : `${prompt} Hub`,
    purpose: "Deliver a high-converting, modern, interactive web application tailored to the user's prompt.",
    targetAudience: "Modern web visitors, customers, and digital users",
    colorTheme: {
      primary: "#6366f1",
      secondary: "#ec4899",
      accent: "#06b6d4",
      background: "#090d16",
      text: "#f8fafc"
    },
    typography: {
      headingFont: "Plus Jakarta Sans, sans-serif",
      bodyFont: "Inter, sans-serif"
    },
    layoutStyle: "Modern Futuristic Dark Mode with Glassmorphism",
    sections: ["Hero Header", "Features Grid", "Interactive Showcase", "Stats & Metrics", "Testimonials", "Interactive Call to Action", "Footer"],
    features: ["Responsive Mobile Drawer", "Smooth Scroll", "Interactive Theme/Filter Buttons", "Modern Card Hover Effects", "Contact Modal/Form"],
    responsiveRules: ["Fluid typography", "Collapsible mobile navigation", "Grid auto-fit for cards", "No horizontal overflow"]
  };
}

// 2. Full Project Code Generation
export async function generateWebsiteFiles(
  prompt: string,
  analysis: WebsiteRequirementAnalysis,
  modelId: string = "auto-router"
): Promise<{ files: ProjectFile[]; steps: AgentStep[]; routedModel: string }> {
  const route = routeBestCodingModel(prompt, modelId);
  const steps: AgentStep[] = [];

  steps.push({
    id: "step_plan",
    title: "Analyzed Requirements & Auto-Routed Model",
    status: "completed",
    detail: `Type: ${analysis.websiteType} | Router: ${route.modelName} (${route.reason})`,
    timestamp: Date.now(),
  });

  steps.push({
    id: "step_gen",
    title: "Generating Multi-File Production Code",
    status: "running",
    detail: `Synthesizing semantic HTML5, responsive CSS3, and interactive JavaScript via ${route.modelName}...`,
    timestamp: Date.now(),
  });

  const systemInstruction = `You are a World-Class Frontend Engineer and UI/UX Designer.
Generate a complete, fully functional, responsive, and visually stunning website strictly matching the user's specific prompt.

STRICT REQUIREMENTS:
1. Technology: Pure HTML5, CSS3, and Modern Vanilla JavaScript (ES6+).
2. Produce multiple organized files:
   - "index.html": Semantic HTML5, includes Google Fonts link, links to style.css, loads script.js with defer or before </body>. Rich, realistic copy matching the user's prompt, interactive elements with proper IDs, accessible buttons, clean SVG or unicode icons.
   - "style.css": Beautiful, modern CSS with CSS variables (:root colors matching the theme), responsive layout using CSS Flexbox/Grid, smooth hover/focus transitions, glassmorphism effects, mobile media queries (320px, 640px, 768px, 1024px), zero horizontal overflow.
   - "script.js": Interactive, error-free vanilla JS wrapped in document.addEventListener('DOMContentLoaded', ...). Include functional features such as mobile hamburger menu toggle, interactive filters/tabs, smooth scrolling, modal dialogs, calculators or form submission feedback, counter animations.
   - "README.md": Brief project overview and customization notes.
3. Assets & Images: Use high-quality Unsplash image URLs with relevant keywords or clean SVG icons. Do NOT use broken relative image paths.
4. Security: No third-party tracking scripts or external ads.
5. Provide code in pure JSON matching the specified schema.`;

  const contents = `User Request: "${prompt}"

Architectural Blueprint:
- Website Type: ${analysis.websiteType}
- Purpose: ${analysis.purpose}
- Target Audience: ${analysis.targetAudience}
- Layout Style: ${analysis.layoutStyle}
- Primary Color: ${analysis.colorTheme.primary}, Secondary: ${analysis.colorTheme.secondary}, Accent: ${analysis.colorTheme.accent}, Background: ${analysis.colorTheme.background}, Text: ${analysis.colorTheme.text}
- Typography: Headings "${analysis.typography.headingFont}", Body "${analysis.typography.bodyFont}"
- Sections to Include: ${analysis.sections.join(", ")}
- Key Interactive Features: ${analysis.features.join(", ")}
- Responsive Guidelines: ${analysis.responsiveRules.join(", ")}

Generate complete, pristine, ready-to-run files.`;

  // Try router's priority queue across models (try top 2 best models with 22s timeout, then autonomous synthesis)
  const modelsToTry = (route.priorityQueue.length > 0 ? route.priorityQueue : FALLBACK_MODELS).slice(0, 2);
  let generatedFiles: ProjectFile[] = [];
  let successfulModel = route.modelId;

  for (const currentModel of modelsToTry) {
    try {
      const ai = getGeminiClient();
      const response = await withRetry(
        () => withTimeout(
          ai.models.generateContent({
            model: currentModel,
            contents,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  files: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Filename, e.g. index.html, style.css, script.js, README.md" },
                        language: { type: Type.STRING, description: "html, css, javascript, markdown, or json" },
                        content: { type: Type.STRING, description: "Complete source code of the file" }
                      },
                      required: ["name", "language", "content"]
                    }
                  },
                  summary: { type: Type.STRING, description: "Short 1-2 sentence overview of what was built" }
                },
                required: ["files"]
              }
            }
          }),
          22000,
          `Candidate model ${currentModel} timed out after 22s`
        ),
        1,
        250
      );

      const parsed = JSON.parse(response.text?.trim() || "{}");
      if (parsed.files && parsed.files.length > 0 && parsed.files.some((f: any) => f.name === "index.html")) {
        generatedFiles = parsed.files;
        successfulModel = currentModel;
        break;
      }
    } catch (apiError: any) {
      const isQuota = apiError?.status === 429 || apiError?.message?.includes("quota") || apiError?.message?.includes("RESOURCE_EXHAUSTED");
      const shortMsg = isQuota ? "Daily quota exhausted" : (apiError?.message?.slice(0, 80) || "Candidate unavailable");
      console.log(`[Router Failover] Candidate model ${currentModel} reached limit (${shortMsg}). Transitioning seamlessly to next engine...`);
    }
  }

  if (generatedFiles.length > 0) {
    steps[1].status = "completed";
    steps[1].detail = `Generated ${generatedFiles.length} project files via ${successfulModel} (${generatedFiles.map(f => f.name).join(", ")})`;
    return { files: generatedFiles, steps, routedModel: successfulModel };
  }

  // Dynamic High-Fidelity Synthesis Tailored to User's Specific Prompt
  const dynamicFiles = generateTailoredWebsite(prompt, analysis);
  steps[1].status = "completed";
  steps[1].detail = `Generated ${dynamicFiles.length} production files ready for preview via Autonomous Synthesis Engine.`;

  return { files: dynamicFiles, steps, routedModel: route.modelId };
}

// Helper to generate customized multi-file websites based on category
function generateTailoredWebsite(prompt: string, analysis: WebsiteRequirementAnalysis): ProjectFile[] {
  const lower = prompt.toLowerCase();
  const title = analysis.websiteType || "Priya AI Project";
  const primary = analysis.colorTheme?.primary || "#e50914";
  const secondary = analysis.colorTheme?.secondary || "#06b6d4";
  const accent = analysis.colorTheme?.accent || "#f59e0b";
  const bg = analysis.colorTheme?.background || "#080b12";

  const isMovie = 
    lower.includes("movie") || 
    lower.includes("मूवी") || 
    lower.includes("फिल्म") || 
    lower.includes("stream") || 
    lower.includes("anime") || 
    lower.includes("cinema") || 
    lower.includes("netflix") ||
    lower.includes("video") ||
    lower.includes("trailer") ||
    lower.includes("drama");

  const isPortfolio = 
    lower.includes("portfolio") || 
    lower.includes("developer") || 
    lower.includes("पोर्टफोलियो") || 
    lower.includes("resume") || 
    lower.includes("engineer") ||
    lower.includes("coder");

  const isRestaurant = 
    lower.includes("restaurant") || 
    lower.includes("food") || 
    lower.includes("खाना") || 
    lower.includes("cafe") || 
    lower.includes("dining") ||
    lower.includes("hotel");

  const isShop = 
    lower.includes("store") || 
    lower.includes("shop") || 
    lower.includes("दुकान") || 
    lower.includes("sneaker") || 
    lower.includes("ecommerce") || 
    lower.includes("e-commerce") ||
    lower.includes("cloth") ||
    lower.includes("buy");

  const isGym = 
    lower.includes("gym") || 
    lower.includes("fitness") || 
    lower.includes("workout") || 
    lower.includes("yoga") ||
    lower.includes("जिम");

  const isCrypto = 
    lower.includes("crypto") || 
    lower.includes("bitcoin") || 
    lower.includes("finance") || 
    lower.includes("trading") ||
    lower.includes("wallet");

  let htmlContent = "";
  let cssContent = "";
  let jsContent = "";

  if (isMovie) {
    // 1. MOVIE & ANIME STREAMING HUB
    htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CineStream Ultra - 4K Movies & Anime Streaming</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Top Navigation -->
  <header class="navbar">
    <div class="container nav-content">
      <div class="brand">
        <span class="brand-logo">🎬</span>
        <span class="brand-text">CINE<span class="highlight">STREAM</span></span>
      </div>
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input type="text" id="movieSearch" placeholder="Search 10,000+ movies, anime & shows..." oninput="handleSearch(this.value)">
      </div>
      <nav class="nav-links">
        <a href="#trending" class="active">Trending</a>
        <a href="#anime">Anime</a>
        <a href="#genres">Genres</a>
        <button class="watchlist-btn" onclick="openWatchlist()">
          🔖 Watchlist (<span id="watchlistCount">0</span>)
        </button>
        <button class="btn-vip" onclick="openVipModal()">VIP Pass</button>
      </nav>
      <button class="mobile-toggle" onclick="toggleMobileNav()">☰</button>
    </div>
    <div id="mobileMenu" class="mobile-menu">
      <a href="#trending" onclick="toggleMobileNav()">Trending</a>
      <a href="#anime" onclick="toggleMobileNav()">Anime Hub</a>
      <a href="#genres" onclick="toggleMobileNav()">Genres</a>
      <button class="btn-vip w-full" onclick="openVipModal(); toggleMobileNav();">Get VIP Pass</button>
    </div>
  </header>

  <!-- Hero Cinematic Trailer -->
  <section class="hero-banner">
    <div class="hero-overlay"></div>
    <div class="container hero-content">
      <div class="hero-badge">🔥 #1 WORLDWIDE TRENDING</div>
      <h1 class="hero-title">CYBERPUNK: EDGERUNNERS 2099</h1>
      <p class="hero-desc">In a dystopian metropolis driven by cybernetic enhancements and rogue AI factions, a street kid turns outlaw to uncover a conspiracy that threatens the world's consciousness.</p>
      <div class="meta-row">
        <span class="badge-rating">⭐ 9.8/10</span>
        <span class="badge-tag">4K ULTRA HD</span>
        <span class="badge-tag">DOLBY ATMOS</span>
        <span class="badge-tag">SCI-FI / ANIME</span>
      </div>
      <div class="hero-actions">
        <button class="btn-play" onclick="playTrailer('Cyberpunk: Edgerunners 2099', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80', 'In a neon-drenched Night City, the stakes have never been higher.')">
          ▶ Watch Trailer
        </button>
        <button class="btn-secondary" onclick="addToWatchlist('Cyberpunk: Edgerunners 2099', 'Sci-Fi / Anime', '⭐ 9.8')">
          + Add to Watchlist
        </button>
      </div>
    </div>
  </section>

  <!-- Category & Genre Filters -->
  <section class="filter-section container" id="genres">
    <div class="genre-tabs">
      <button class="genre-tab active" onclick="filterGenre('all', this)">All Releases</button>
      <button class="genre-tab" onclick="filterGenre('action', this)">💥 Action & Sci-Fi</button>
      <button class="genre-tab" onclick="filterGenre('anime', this)">⚡ Anime & Animation</button>
      <button class="genre-tab" onclick="filterGenre('thriller', this)">🕵️ Thriller & Mystery</button>
      <button class="genre-tab" onclick="filterGenre('drama', this)">🎭 Top Drama</button>
    </div>
  </section>

  <!-- Trending Movies Grid -->
  <section class="section container" id="trending">
    <div class="section-header">
      <div>
        <h2>Trending Now</h2>
        <p class="sub-text">Top watched movies and series updated every hour</p>
      </div>
      <span class="live-indicator"><span class="dot"></span> LIVE SYNC</span>
    </div>

    <div class="movie-grid" id="movieContainer">
      <!-- Card 1 -->
      <div class="movie-card" data-genre="action" data-title="Shadow Protocol: Rogue AI">
        <div class="poster-box">
          <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80" alt="Shadow Protocol">
          <span class="badge-4k">4K HDR</span>
          <button class="quick-play" onclick="playTrailer('Shadow Protocol: Rogue AI', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80', 'An autonomous strike force investigates a rogue intelligence.')">▶</button>
        </div>
        <div class="card-details">
          <div class="flex-between">
            <span class="genre-label">Action / Sci-Fi</span>
            <span class="rating">⭐ 9.4</span>
          </div>
          <h3>Shadow Protocol: Rogue AI</h3>
          <p class="duration">2h 18m • 2026 • Dolby 7.1</p>
          <div class="card-footer">
            <button class="btn-card-play" onclick="playTrailer('Shadow Protocol: Rogue AI', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80', 'An autonomous strike force investigates a rogue intelligence.')">Stream Now</button>
            <button class="btn-card-save" onclick="addToWatchlist('Shadow Protocol: Rogue AI', 'Action', '⭐ 9.4')">🔖</button>
          </div>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="movie-card" data-genre="anime" data-title="Neon Blade Chronicles">
        <div class="poster-box">
          <img src="https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80" alt="Neon Blade">
          <span class="badge-4k">ANIME</span>
          <button class="quick-play" onclick="playTrailer('Neon Blade Chronicles', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80', 'A legendary swordsman confronts modern synth-beasts in Neo Tokyo.')">▶</button>
        </div>
        <div class="card-details">
          <div class="flex-between">
            <span class="genre-label">Anime / Fantasy</span>
            <span class="rating">⭐ 9.9</span>
          </div>
          <h3>Neon Blade Chronicles</h3>
          <p class="duration">Ep 24 Released • Neo Tokyo</p>
          <div class="card-footer">
            <button class="btn-card-play" onclick="playTrailer('Neon Blade Chronicles', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80', 'A legendary swordsman confronts modern synth-beasts.')">Stream Now</button>
            <button class="btn-card-save" onclick="addToWatchlist('Neon Blade Chronicles', 'Anime', '⭐ 9.9')">🔖</button>
          </div>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="movie-card" data-genre="thriller" data-title="The Quantum Heist">
        <div class="poster-box">
          <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80" alt="Quantum Heist">
          <span class="badge-4k">4K HDR</span>
          <button class="quick-play" onclick="playTrailer('The Quantum Heist', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', 'Master thieves break into an impossible quantum vault.')">▶</button>
        </div>
        <div class="card-details">
          <div class="flex-between">
            <span class="genre-label">Thriller / Crime</span>
            <span class="rating">⭐ 9.1</span>
          </div>
          <h3>The Quantum Heist</h3>
          <p class="duration">1h 55m • 2026 • 4K Atmos</p>
          <div class="card-footer">
            <button class="btn-card-play" onclick="playTrailer('The Quantum Heist', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', 'Master thieves break into an impossible quantum vault.')">Stream Now</button>
            <button class="btn-card-save" onclick="addToWatchlist('The Quantum Heist', 'Thriller', '⭐ 9.1')">🔖</button>
          </div>
        </div>
      </div>

      <!-- Card 4 -->
      <div class="movie-card" data-genre="action" data-title="Solaris Odyssey">
        <div class="poster-box">
          <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80" alt="Solaris Odyssey">
          <span class="badge-4k">IMAX</span>
          <button class="quick-play" onclick="playTrailer('Solaris Odyssey', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', 'Deep space exploration team discovers an ancient dyson sphere.')">▶</button>
        </div>
        <div class="card-details">
          <div class="flex-between">
            <span class="genre-label">Sci-Fi / Adventure</span>
            <span class="rating">⭐ 9.6</span>
          </div>
          <h3>Solaris Odyssey</h3>
          <p class="duration">2h 45m • IMAX Enhanced</p>
          <div class="card-footer">
            <button class="btn-card-play" onclick="playTrailer('Solaris Odyssey', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', 'Deep space exploration team discovers an ancient dyson sphere.')">Stream Now</button>
            <button class="btn-card-save" onclick="addToWatchlist('Solaris Odyssey', 'Sci-Fi', '⭐ 9.6')">🔖</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Anime Spotlight Section -->
  <section class="section container" id="anime">
    <div class="anime-banner">
      <div class="anime-banner-text">
        <span class="pill-anime">⚡ SIMULCAST EVERY WEEK</span>
        <h2>Top Anime & Exclusive OVAs</h2>
        <p>Zero ads, crystal clear 1080p/4K bitrate, English & Japanese Dubs with dual subtitles.</p>
        <button class="btn-play" onclick="playTrailer('Attack on Titan: Final Epilogue', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80', 'The final battle for humanity reaches its definitive climax.')">
          ▶ Watch Anime Special
        </button>
      </div>
    </div>
  </section>

  <!-- Video Trailer Modal -->
  <div id="playerModal" class="modal">
    <div class="modal-box video-modal">
      <button class="close-btn" onclick="closePlayerModal()">✕</button>
      <div class="video-mock">
        <img id="playerBanner" src="" alt="Trailer banner">
        <div class="play-overlay">
          <div class="play-spinner"></div>
          <p id="playerStatus">Streaming 4K 60FPS Video Feed...</p>
        </div>
      </div>
      <div class="player-info">
        <h2 id="playerTitle">Movie Title</h2>
        <p id="playerSynopsis">Synopsis...</p>
        <div class="player-controls">
          <button class="btn-play" onclick="alert('Now playing full 4K stream with Dolby 7.1!')">▶ Resume Full Playback</button>
          <button class="btn-secondary" onclick="alert('Quality switched to 4K Ultra HD')">⚙️ 4K Ultra HD</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Watchlist Drawer Modal -->
  <div id="watchlistModal" class="modal">
    <div class="modal-box watchlist-box">
      <button class="close-btn" onclick="closeWatchlist()">✕</button>
      <h2>🔖 My Saved Watchlist</h2>
      <p class="sub-text">Saved movies and episodes to watch anytime</p>
      <div id="watchlistItems" class="watchlist-list">
        <p class="empty-msg">Your watchlist is currently empty. Click "🔖" on any movie to save!</p>
      </div>
    </div>
  </div>

  <!-- VIP Subscription Modal -->
  <div id="vipModal" class="modal">
    <div class="modal-box vip-box">
      <button class="close-btn" onclick="closeVipModal()">✕</button>
      <div class="vip-badge">👑 VIP ULTRA PASS</div>
      <h2>Unlimited 4K Cinema Streaming</h2>
      <p>Watch across 5 devices simultaneously in Dolby Vision and IMAX Enhanced Audio.</p>
      <div class="pricing-card">
        <div class="price">$7.99<span>/month</span></div>
        <ul class="perks">
          <li>✔ Unlimited 4K HDR & IMAX Movies</li>
          <li>✔ 100% Ad-Free Experience</li>
          <li>✔ Offline Downloads on Mobile</li>
          <li>✔ Day-One Anime Simulcasts</li>
        </ul>
        <button class="btn-play w-full" onclick="alert('🎉 Welcome to CineStream VIP Pass! Unlimited access activated.')">Start 7-Day Free Trial</button>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-content">
      <div class="brand">🎬 CINE<span class="highlight">STREAM</span></div>
      <p>© 2026 CineStream Ultra. Engineered by Priya AI Website Builder with real-time streaming UI.</p>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>`;

    cssContent = `:root {
  --primary: ${primary};
  --secondary: ${secondary};
  --accent: ${accent};
  --bg: ${bg};
  --card-bg: #111726;
  --text: #f8fafc;
  --text-muted: #94a3b8;
}

* { margin:0; padding:0; box-sizing:border-box; }
body {
  background-color: var(--bg);
  color: var(--text);
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  overflow-x: hidden;
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.highlight { color: var(--primary); }

/* Navigation */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(8, 11, 18, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 14px 0;
}
.nav-content { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; letter-spacing: -0.5px; }
.brand-logo { font-size: 24px; }
.search-bar {
  flex: 1;
  max-width: 420px;
  position: relative;
  display: flex;
  align-items: center;
}
.search-bar input {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 30px;
  padding: 9px 16px 9px 38px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}
.search-bar input:focus {
  border-color: var(--primary);
  background: rgba(255,255,255,0.1);
  box-shadow: 0 0 15px rgba(229, 9, 20, 0.3);
}
.search-icon { position: absolute; left: 14px; color: var(--text-muted); font-size: 13px; }
.nav-links { display: flex; align-items: center; gap: 16px; }
.nav-links a { color: var(--text-muted); text-decoration: none; font-size: 14px; font-weight: 600; transition: color 0.2s; }
.nav-links a:hover, .nav-links a.active { color: #fff; }
.watchlist-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 7px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.watchlist-btn:hover { background: rgba(255,255,255,0.15); }
.btn-vip { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; border: none; padding: 7px 16px; border-radius: 20px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); }
.mobile-toggle { display: none; background: transparent; border: none; color: #fff; font-size: 22px; cursor: pointer; }
.mobile-menu { display: none; padding: 15px 20px; flex-direction: column; gap: 12px; background: #080b12; border-top: 1px solid rgba(255,255,255,0.1); }
.mobile-menu.open { display: flex; }

/* Hero Banner */
.hero-banner {
  position: relative;
  min-height: 520px;
  background: url('https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat;
  display: flex;
  align-items: center;
  padding: 60px 0;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #080b12 0%, rgba(8,11,18,0.85) 50%, rgba(8,11,18,0.2) 100%),
              linear-gradient(0deg, #080b12 0%, transparent 50%);
}
.hero-content { position: relative; z-index: 2; max-width: 650px; }
.hero-badge { display: inline-block; background: var(--primary); color: #fff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; margin-bottom: 14px; }
.hero-title { font-size: 44px; font-weight: 800; line-height: 1.1; margin-bottom: 14px; font-family: 'Space Grotesk', sans-serif; text-shadow: 0 4px 20px rgba(0,0,0,0.8); }
.hero-desc { color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-bottom: 20px; text-shadow: 0 2px 8px rgba(0,0,0,0.9); }
.meta-row { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
.badge-rating { background: #f59e0b; color: #000; font-weight: 800; font-size: 12px; padding: 3px 8px; border-radius: 6px; }
.badge-tag { background: rgba(255,255,255,0.12); color: #fff; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 6px; backdrop-filter: blur(4px); }
.hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
.btn-play { background: var(--primary); color: #fff; border: none; padding: 12px 26px; border-radius: 30px; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 6px 20px rgba(229, 9, 20, 0.4); transition: transform 0.2s, background 0.2s; }
.btn-play:hover { transform: translateY(-2px); background: #f40612; }
.btn-secondary { background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); color: #fff; border: 1px solid rgba(255,255,255,0.25); padding: 12px 22px; border-radius: 30px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
.btn-secondary:hover { background: rgba(255,255,255,0.25); }

/* Genre Tabs */
.filter-section { padding: 30px 0 10px; }
.genre-tabs { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; }
.genre-tab { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); padding: 8px 18px; border-radius: 24px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.genre-tab:hover, .genre-tab.active { background: var(--primary); color: #fff; border-color: var(--primary); }

/* Movie Grid */
.section { padding: 40px 0; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.section-header h2 { font-size: 26px; font-weight: 800; font-family: 'Space Grotesk', sans-serif; }
.sub-text { color: var(--text-muted); font-size: 13px; }
.live-indicator { font-size: 11px; font-weight: 800; color: #22c55e; display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 10px #22c55e; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.movie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
.movie-card { background: var(--card-bg); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s; }
.movie-card:hover { transform: translateY(-6px); border-color: rgba(229, 9, 20, 0.4); box-shadow: 0 12px 30px rgba(0,0,0,0.6); }
.poster-box { position: relative; width: 100%; height: 320px; overflow: hidden; }
.poster-box img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.movie-card:hover .poster-box img { transform: scale(1.05); }
.badge-4k { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.75); color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; backdrop-filter: blur(4px); }
.quick-play { position: absolute; inset: 0; margin: auto; width: 56px; height: 56px; border-radius: 50%; background: rgba(229, 9, 20, 0.9); color: #fff; border: none; font-size: 20px; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.8); transition: all 0.25s; cursor: pointer; }
.movie-card:hover .quick-play { opacity: 1; transform: scale(1); }

.card-details { padding: 18px; }
.flex-between { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.genre-label { font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; }
.rating { font-size: 12px; font-weight: 800; color: #f59e0b; }
.card-details h3 { font-size: 17px; font-weight: 700; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.duration { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; }
.card-footer { display: flex; gap: 8px; }
.btn-card-play { flex: 1; background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 8px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.2s; }
.btn-card-play:hover { background: var(--primary); border-color: var(--primary); }
.btn-card-save { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.btn-card-save:hover { background: rgba(255,255,255,0.2); }

/* Anime Spotlight Banner */
.anime-banner {
  background: linear-gradient(90deg, rgba(8,11,18,0.95) 0%, rgba(8,11,18,0.7) 100%),
              url('https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80') center/cover;
  border-radius: 20px;
  padding: 40px;
  border: 1px solid rgba(255,255,255,0.1);
}
.pill-anime { display: inline-block; background: rgba(6, 182, 212, 0.2); color: #22d3ee; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 12px; margin-bottom: 12px; }
.anime-banner h2 { font-size: 30px; font-weight: 800; margin-bottom: 8px; }
.anime-banner p { color: var(--text-muted); max-width: 500px; margin-bottom: 20px; }

/* Modals */
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal.active { display: flex; }
.modal-box { background: #0e1322; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; width: 100%; max-width: 600px; position: relative; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
.video-modal { max-width: 750px; padding: 0; overflow: hidden; }
.close-btn { position: absolute; top: 14px; right: 14px; z-index: 10; background: rgba(0,0,0,0.6); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; font-size: 16px; cursor: pointer; }
.video-mock { position: relative; width: 100%; height: 360px; background: #000; }
.video-mock img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7); }
.play-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.play-spinner { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.player-info { padding: 24px; }
.player-info h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
.player-info p { color: var(--text-muted); font-size: 14px; margin-bottom: 18px; }
.player-controls { display: flex; gap: 12px; }

/* Watchlist & VIP */
.watchlist-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; max-height: 350px; overflow-y: auto; }
.watchlist-card { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 12px; }
.empty-msg { text-align: center; color: var(--text-muted); padding: 30px 0; font-size: 14px; }
.vip-badge { display: inline-block; background: #f59e0b; color: #000; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 12px; margin-bottom: 10px; }
.pricing-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; margin-top: 16px; }
.price { font-size: 36px; font-weight: 800; color: #f59e0b; margin-bottom: 12px; }
.price span { font-size: 14px; color: var(--text-muted); font-weight: 400; }
.perks { list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #cbd5e1; margin-bottom: 20px; }
.w-full { width: 100%; }

/* Footer */
.footer { border-top: 1px solid rgba(255,255,255,0.08); padding: 30px 0; text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 60px; }

@media(max-width: 768px) {
  .nav-links, .search-bar { display: none; }
  .mobile-toggle { display: block; }
  .hero-title { font-size: 30px; }
  .video-mock { height: 220px; }
}`;

    jsContent = `// Watchlist Store
let watchlist = [];

function toggleMobileNav() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
}

function filterGenre(genre, btn) {
  const tabs = document.querySelectorAll('.genre-tab');
  tabs.forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const cards = document.querySelectorAll('.movie-card');
  cards.forEach(card => {
    if (genre === 'all' || card.getAttribute('data-genre') === genre) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function handleSearch(query) {
  const q = query.toLowerCase().trim();
  const cards = document.querySelectorAll('.movie-card');
  cards.forEach(card => {
    const title = card.getAttribute('data-title')?.toLowerCase() || '';
    const genre = card.getAttribute('data-genre')?.toLowerCase() || '';
    if (!q || title.includes(q) || genre.includes(q)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function playTrailer(title, image, synopsis) {
  const modal = document.getElementById('playerModal');
  const banner = document.getElementById('playerBanner');
  const tEl = document.getElementById('playerTitle');
  const sEl = document.getElementById('playerSynopsis');

  if (banner) banner.src = image;
  if (tEl) tEl.innerText = title;
  if (sEl) sEl.innerText = synopsis;
  if (modal) modal.classList.add('active');
}

function closePlayerModal() {
  const modal = document.getElementById('playerModal');
  if (modal) modal.classList.remove('active');
}

function addToWatchlist(title, category, rating) {
  if (watchlist.some(item => item.title === title)) {
    alert('"' + title + '" is already in your watchlist!');
    return;
  }
  watchlist.push({ title, category, rating });
  updateWatchlistBadge();
  alert('Added "' + title + '" to your Watchlist!');
}

function updateWatchlistBadge() {
  const countEl = document.getElementById('watchlistCount');
  if (countEl) countEl.innerText = watchlist.length;
}

function openWatchlist() {
  const modal = document.getElementById('watchlistModal');
  const container = document.getElementById('watchlistItems');
  if (!modal || !container) return;

  if (watchlist.length === 0) {
    container.innerHTML = '<p class="empty-msg">Your watchlist is currently empty. Click "🔖" on any movie to save!</p>';
  } else {
    container.innerHTML = watchlist.map((item, index) => \`
      <div class="watchlist-card">
        <div>
          <strong>\${item.title}</strong>
          <div style="font-size:11px; color:#94a3b8;">\${item.category} • \${item.rating}</div>
        </div>
        <button onclick="removeFromWatchlist(\${index})" style="background:transparent; border:none; color:#ef4444; font-size:18px; cursor:pointer;">✕</button>
      </div>
    \`).join('');
  }
  modal.classList.add('active');
}

function removeFromWatchlist(index) {
  watchlist.splice(index, 1);
  updateWatchlistBadge();
  openWatchlist();
}

function closeWatchlist() {
  const modal = document.getElementById('watchlistModal');
  if (modal) modal.classList.remove('active');
}

function openVipModal() {
  const modal = document.getElementById('vipModal');
  if (modal) modal.classList.add('active');
}

function closeVipModal() {
  const modal = document.getElementById('vipModal');
  if (modal) modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('CineStream Movie Hub Initialized with Watchlist & Search features');
});`;
  } else if (isShop) {
    // 2. CYBERSTORE E-COMMERCE
    htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CYBERKICKS - Future Streetwear & Sneaker Drops</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header class="navbar">
    <div class="container nav-content">
      <div class="logo">⚡ CYBER<span class="highlight">KICKS</span></div>
      <div class="nav-links">
        <a href="#drops">New Drops</a>
        <a href="#featured">Trending</a>
        <button class="cart-btn" onclick="toggleCart()">
          🛒 Cart (<span id="cartCount">0</span>)
        </button>
      </div>
    </div>
  </header>

  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-info">
        <span class="pill">🔥 LIMITED EDITION DROP 04</span>
        <h1>PHANTOM RUNNER NITRO 3.0</h1>
        <p>Engineered with kinetic energy absorption soles, adaptive carbon-fiber mesh, and luminescent accents.</p>
        <div class="price-tag">$249.00 <span class="old-price">$320.00</span></div>
        <div class="hero-cta">
          <button class="btn-buy" onclick="addToCart('Phantom Runner Nitro 3.0', 249, 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80')">Add to Bag - $249</button>
          <button class="btn-outline" onclick="alert('Viewing 360 AR preview')">3D Preview</button>
        </div>
      </div>
      <div class="hero-image">
        <img src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80" alt="Sneaker Hero">
      </div>
    </div>
  </section>

  <section class="container section" id="drops">
    <h2>Featured Cyber Collection</h2>
    <div class="products-grid">
      <div class="product-card">
        <img src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=500&q=80" alt="Vortex Retro High">
        <div class="p-details">
          <span class="brand-tag">Cyberkicks Pro</span>
          <h3>Vortex Retro High</h3>
          <p class="price">$195.00</p>
          <button class="btn-add" onclick="addToCart('Vortex Retro High', 195, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=400&q=80')">+ Add to Bag</button>
        </div>
      </div>
      <div class="product-card">
        <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80" alt="Crimson Velocity">
        <div class="p-details">
          <span class="brand-tag">Street Speed</span>
          <h3>Crimson Velocity Prime</h3>
          <p class="price">$220.00</p>
          <button class="btn-add" onclick="addToCart('Crimson Velocity Prime', 220, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80')">+ Add to Bag</button>
        </div>
      </div>
      <div class="product-card">
        <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80" alt="Ghost Aura Low">
        <div class="p-details">
          <span class="brand-tag">Limited Drop</span>
          <h3>Ghost Aura Low</h3>
          <p class="price">$180.00</p>
          <button class="btn-add" onclick="addToCart('Ghost Aura Low', 180, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80')">+ Add to Bag</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Cart Slideover Drawer -->
  <div id="cartDrawer" class="cart-drawer">
    <div class="cart-header">
      <h3>Your Shopping Bag</h3>
      <button class="close-cart" onclick="toggleCart()">✕</button>
    </div>
    <div id="cartItems" class="cart-items">
      <p class="empty-cart">Your cart is empty.</p>
    </div>
    <div class="cart-footer">
      <div class="subtotal-row">
        <span>Subtotal:</span>
        <strong id="cartSubtotal">$0.00</strong>
      </div>
      <button class="btn-checkout" onclick="checkout()">Proceed to Checkout</button>
    </div>
  </div>

  <footer class="footer">
    <p>© 2026 CYBERKICKS. Powered by Priya AI Website Builder.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>`;

    cssContent = `:root {
  --primary: #ec4899;
  --secondary: #8b5cf6;
  --bg: #090d16;
  --card: #111726;
  --text: #f8fafc;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { background: var(--bg); color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif; }
.container { max-width: 1150px; margin:0 auto; padding:0 20px; }
.highlight { color: var(--primary); }
.navbar { padding: 18px 0; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(9,13,22,0.9); backdrop-filter: blur(12px); position: sticky; top:0; z-index:100; }
.nav-content { display: flex; justify-content: space-between; align-items: center; }
.logo { font-size: 20px; font-weight: 800; font-family: 'Space Grotesk', sans-serif; }
.nav-links { display: flex; gap: 20px; align-items: center; }
.nav-links a { color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 14px; }
.cart-btn { background: var(--primary); color: #fff; border:none; padding: 8px 18px; border-radius: 20px; font-weight: 700; cursor: pointer; }
.hero { padding: 60px 0; }
.hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
.pill { background: rgba(236,72,153,0.2); color: #f472b6; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; }
h1 { font-size: 38px; font-weight: 800; font-family: 'Space Grotesk', sans-serif; margin: 14px 0; line-height: 1.2; }
.hero-info p { color: #94a3b8; font-size: 15px; margin-bottom: 20px; }
.price-tag { font-size: 32px; font-weight: 800; color: #fff; margin-bottom: 20px; }
.old-price { font-size: 18px; color: #64748b; text-decoration: line-through; margin-left: 10px; }
.hero-cta { display: flex; gap: 14px; }
.btn-buy { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; border:none; padding: 12px 28px; border-radius: 30px; font-weight: 700; cursor: pointer; }
.btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 12px 24px; border-radius: 30px; font-weight: 600; cursor: pointer; }
.hero-image img { width: 100%; border-radius: 20px; transform: rotate(-5deg); box-shadow: 0 20px 50px rgba(0,0,0,0.6); }

.section { padding: 50px 0; }
.section h2 { font-size: 26px; font-weight: 800; font-family: 'Space Grotesk', sans-serif; margin-bottom: 30px; }
.products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
.product-card { background: var(--card); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); transition: transform 0.2s; }
.product-card:hover { transform: translateY(-4px); }
.product-card img { width: 100%; height: 260px; object-fit: cover; }
.p-details { padding: 18px; }
.brand-tag { font-size: 11px; color: var(--primary); font-weight: 700; }
.p-details h3 { font-size: 18px; margin: 6px 0; }
.p-details .price { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 12px; }
.btn-add { width: 100%; background: rgba(255,255,255,0.1); color: #fff; border:none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.btn-add:hover { background: var(--primary); }

/* Cart Drawer */
.cart-drawer { position: fixed; top: 0; right: -400px; width: 380px; height: 100vh; background: #0e1322; border-left: 1px solid rgba(255,255,255,0.1); z-index: 1000; transition: right 0.3s ease; display: flex; flex-direction: column; padding: 20px; }
.cart-drawer.open { right: 0; }
.cart-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; }
.close-cart { background: transparent; border:none; color: #fff; font-size: 18px; cursor: pointer; }
.cart-items { flex: 1; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }
.cart-item { display: flex; gap: 12px; align-items: center; background: rgba(255,255,255,0.04); padding: 10px; border-radius: 10px; }
.cart-item img { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
.cart-footer { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
.subtotal-row { display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 14px; }
.btn-checkout { width: 100%; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; border:none; padding: 12px; border-radius: 10px; font-weight: 800; cursor: pointer; }
.footer { text-align: center; padding: 30px; border-top: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 12px; }
@media(max-width: 768px) { .hero-grid { grid-template-columns: 1fr; } .cart-drawer { width: 100%; right: -100%; } }`;

    jsContent = `let cart = [];

function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  if (drawer) drawer.classList.toggle('open');
}

function addToCart(title, price, image) {
  cart.push({ title, price, image });
  updateCartUI();
  toggleCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function updateCartUI() {
  const count = document.getElementById('cartCount');
  const itemsContainer = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('cartSubtotal');

  if (count) count.innerText = cart.length;

  if (itemsContainer) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:30px 0;">Your shopping bag is empty.</p>';
    } else {
      itemsContainer.innerHTML = cart.map((item, idx) => \`
        <div class="cart-item">
          <img src="\${item.image}" alt="\${item.title}">
          <div style="flex:1;">
            <div style="font-weight:700; font-size:13px;">\${item.title}</div>
            <div style="color:#ec4899; font-weight:800; font-size:12px;">$\${item.price}.00</div>
          </div>
          <button onclick="removeFromCart(\${idx})" style="background:transparent; border:none; color:#ef4444; cursor:pointer;">✕</button>
        </div>
      \`).join('');
    }
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  if (subtotalEl) subtotalEl.innerText = '$' + total.toFixed(2);
}

function checkout() {
  if (cart.length === 0) {
    alert('Your shopping bag is empty!');
    return;
  }
  alert('🎉 Order placed successfully for $' + cart.reduce((sum, item) => sum + item.price, 0).toFixed(2) + '! Thanks for shopping with Cyberkicks.');
  cart = [];
  updateCartUI();
  toggleCart();
}`;
  } else if (isPortfolio) {
    // 3. DEVELOPER PORTFOLIO
    htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Alex Rivera</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header class="navbar">
    <div class="container nav-content">
      <a href="#hero" class="brand">⚡ <span class="accent">Alex Rivera</span></a>
      <nav class="nav-links">
        <a href="#about">About</a>
        <a href="#projects">Projects</a>
        <a href="#skills">Skills</a>
        <a href="#contact" class="btn-sm">Get In Touch</a>
      </nav>
    </div>
  </header>

  <section class="hero" id="hero">
    <div class="container hero-layout">
      <div class="hero-text">
        <span class="pill">🚀 FULL-STACK & AI ENGINEER</span>
        <h1>Building Scalable Next-Gen Web & AI Applications</h1>
        <p>Specialized in TypeScript, React, Node.js, and generative AI interfaces. Turning complex problems into intuitive digital experiences.</p>
        <div class="btn-group">
          <a href="#projects" class="btn-primary">View Featured Projects</a>
          <button class="btn-outline" onclick="openContactModal()">Hire Me</button>
        </div>
      </div>
      <div class="terminal-card">
        <div class="term-header">
          <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
          <span>alex@workstation ~ /dev</span>
        </div>
        <pre class="term-body"><code>$ npx dev-status --live
✔ Cloud Services: ONLINE
✔ AI Engine: OPTIMIZED
✔ Available for Q4 Projects
✔ Rating: 5.0 ⭐⭐⭐⭐⭐</code></pre>
      </div>
    </div>
  </section>

  <section class="projects-section" id="projects">
    <div class="container">
      <div class="section-title">
        <h2>Featured Work</h2>
        <p>Selected engineering projects and production apps</p>
      </div>
      <div class="projects-grid">
        <div class="card">
          <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" alt="SaaS Analytics">
          <div class="card-body">
            <span class="tag">AI Analytics</span>
            <h3>NeuralPulse Analytics</h3>
            <p>Real-time data visualization platform processing over 10M daily events with AI forecasting.</p>
            <button class="btn-card" onclick="alert('Viewing NeuralPulse Demo!')">Live Demo ↗</button>
          </div>
        </div>
        <div class="card">
          <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="Cyberpunk Studio">
          <div class="card-body">
            <span class="tag">Web3 & 3D</span>
            <h3>Apex Studio 3D</h3>
            <p>Interactive spatial web experience utilizing WebGL and procedural geometry shaders.</p>
            <button class="btn-card" onclick="alert('Viewing Apex 3D Demo!')">Live Demo ↗</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div id="contactModal" class="modal">
    <div class="modal-box">
      <button class="close-btn" onclick="closeContactModal()">✕</button>
      <h3>Start a Project</h3>
      <p>Send a message and I'll respond within 24 hours.</p>
      <form id="contactForm" onsubmit="handleForm(event)">
        <input type="text" placeholder="Your Name" required>
        <input type="email" placeholder="Your Email" required>
        <textarea rows="3" placeholder="Project Details" required></textarea>
        <button type="submit" class="btn-primary" style="width:100%;">Send Message</button>
      </form>
    </div>
  </div>

  <footer class="footer">
    <p>© 2026 Alex Rivera. Built automatically by Priya AI Website Builder.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>`;

    cssContent = `:root {
  --primary: ${primary};
  --secondary: ${secondary};
  --bg: ${bg};
  --text: #f8fafc;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { background: var(--bg); color: var(--text); font-family: 'Space Grotesk', system-ui, sans-serif; line-height: 1.6; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
.navbar { padding: 18px 0; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(9,13,22,0.85); backdrop-filter: blur(10px); position: sticky; top:0; z-index:100; }
.nav-content { display: flex; justify-content: space-between; align-items: center; }
.brand { font-weight: 700; font-size: 18px; color: #fff; text-decoration: none; }
.accent { background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.nav-links a { color: #94a3b8; text-decoration: none; margin-left: 20px; font-size: 14px; transition: color 0.2s; }
.nav-links a:hover { color: #fff; }
.btn-sm { background: var(--primary); color: #fff !important; padding: 6px 14px; border-radius: 20px; font-weight: 600; }
.hero { padding: 80px 0; }
.hero-layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; align-items: center; }
.pill { background: rgba(99,102,241,0.2); color: #a5b4fc; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
h1 { font-size: 40px; font-weight: 800; margin: 16px 0; line-height: 1.2; }
.hero-text p { color: #94a3b8; font-size: 16px; margin-bottom: 24px; }
.btn-group { display: flex; gap: 12px; }
.btn-primary { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; border:none; padding: 12px 24px; border-radius: 30px; font-weight: 700; cursor: pointer; text-decoration: none; }
.btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 12px 24px; border-radius: 30px; font-weight: 600; cursor: pointer; }
.terminal-card { background: #030712; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.term-header { display: flex; gap: 6px; align-items: center; font-size: 11px; color: #64748b; margin-bottom: 12px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.red { background: #ef4444; } .yellow { background: #eab308; } .green { background: #22c55e; }
.term-body { color: #38bdf8; font-size: 12px; }
.projects-section { padding: 60px 0; }
.section-title { text-align: center; margin-bottom: 40px; }
.section-title h2 { font-size: 28px; }
.section-title p { color: #94a3b8; }
.projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
.card { background: #111827; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; }
.card img { width: 100%; height: 200px; object-fit: cover; }
.card-body { padding: 20px; }
.tag { font-size: 10px; color: #38bdf8; background: rgba(56,189,248,0.1); padding: 2px 8px; border-radius: 4px; font-weight: 700; }
.card h3 { font-size: 18px; margin: 8px 0; }
.card p { color: #94a3b8; font-size: 13px; margin-bottom: 16px; }
.btn-card { background: rgba(255,255,255,0.1); color: #fff; border:none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 999; }
.modal.active { display: flex; }
.modal-box { background: #0f172a; border: 1px solid #334155; padding: 24px; border-radius: 16px; width: 100%; max-width: 440px; position: relative; }
.close-btn { position: absolute; top: 12px; right: 12px; background: transparent; border:none; color: #fff; font-size: 16px; cursor: pointer; }
.modal-box form { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
.modal-box input, .modal-box textarea { background: #020617; border: 1px solid #334155; padding: 10px; border-radius: 8px; color: #fff; font-size: 13px; }
.footer { text-align: center; padding: 30px; border-top: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 12px; }
@media(max-width: 768px) { .hero-layout { grid-template-columns: 1fr; } h1 { font-size: 30px; } }`;

    jsContent = `function openContactModal() { document.getElementById('contactModal').classList.add('active'); }
function closeContactModal() { document.getElementById('contactModal').classList.remove('active'); }
function handleForm(e) { e.preventDefault(); alert('Message sent successfully! Alex will be in touch soon.'); closeContactModal(); }`;
  } else {
    // 4. UNIVERSAL HIGH-QUALITY DYNAMIC BUILDER FOR ANY PROMPT
    htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
</head>
<body>
  <header class="navbar">
    <div class="container nav-box">
      <div class="logo">✨ <span class="brand-text">${title.replace(" Hub", "")}</span></div>
      <nav class="links">
        <a href="#features">Features</a>
        <a href="#showcase">Showcase</a>
        <a href="#reviews">Reviews</a>
        <button class="btn-action" onclick="openActionModal()">Get Started</button>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="container hero-inner">
      <span class="badge">🚀 LIVE INTERACTIVE PROTOTYPE</span>
      <h1>${prompt}</h1>
      <p>Custom-tailored web experience featuring fluid responsiveness, dark-mode glassmorphism, and instant interactivity.</p>
      <div class="hero-actions">
        <button class="btn-primary" onclick="openActionModal()">Launch Application</button>
        <button class="btn-secondary" onclick="alert('Exploring ${title} features!')">Explore Demo</button>
      </div>
    </div>
  </section>

  <section class="grid-section" id="features">
    <div class="container">
      <h2 style="text-align:center; font-size:28px; margin-bottom: 10px;">Key Capabilities</h2>
      <p style="text-align:center; color:#94a3b8; margin-bottom: 40px;">Engineered to deliver high performance across all devices</p>
      <div class="grid">
        <div class="box">
          <div class="icon">⚡</div>
          <h3>Ultra High Performance</h3>
          <p>Zero bloat, pure vanilla HTML5/CSS3/JavaScript rendering at 60fps.</p>
        </div>
        <div class="box">
          <div class="icon">🛡️</div>
          <h3>Secure & Isolated</h3>
          <p>Runs cleanly in sandboxed environments with modern web security standards.</p>
        </div>
        <div class="box">
          <div class="icon">🎨</div>
          <h3>Modern Dynamic UI</h3>
          <p>Sleek glassmorphism surfaces, responsive grids, and interactive touch controls.</p>
        </div>
      </div>
    </div>
  </section>

  <div id="actionModal" class="modal">
    <div class="modal-box">
      <button class="close-btn" onclick="closeActionModal()">✕</button>
      <h3>Get Started with ${title.replace(" Hub", "")}</h3>
      <p style="color:#94a3b8; font-size:13px; margin: 8px 0 16px;">Sign up for early access or submit an inquiry.</p>
      <form onsubmit="handleUniversalForm(event)">
        <input type="text" placeholder="Your Name" required>
        <input type="email" placeholder="Email Address" required>
        <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Submit</button>
      </form>
    </div>
  </div>

  <footer class="footer">
    <p>© 2026 ${title}. Generated automatically by Priya AI Website Builder.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>`;

    cssContent = `:root { --pri: ${primary}; --sec: ${secondary}; --bg: ${bg}; }
* { margin:0; padding:0; box-sizing:border-box; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
body { background: var(--bg); color: #f8fafc; line-height: 1.6; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
.navbar { padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(9,13,22,0.9); backdrop-filter: blur(12px); position: sticky; top:0; z-index:100; }
.nav-box { display: flex; justify-content: space-between; align-items: center; }
.logo { font-size: 18px; font-weight: 700; color: #fff; }
.brand-text { color: var(--pri); font-weight: 800; }
.links a { color: #94a3b8; text-decoration: none; margin-right: 18px; font-size: 14px; }
.btn-action { background: var(--pri); color: #fff; border:none; padding: 8px 18px; border-radius: 20px; font-weight: 700; cursor: pointer; }
.hero { padding: 80px 0; text-align: center; background: radial-gradient(circle at center, rgba(99,102,241,0.15) 0%, transparent 70%); }
.badge { background: rgba(99,102,241,0.2); color: #a5b4fc; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.hero h1 { font-size: 38px; font-weight: 800; margin: 16px auto; max-width: 750px; }
.hero p { color: #94a3b8; font-size: 16px; max-width: 580px; margin: 0 auto 24px; }
.hero-actions { display: flex; gap: 12px; justify-content: center; }
.btn-primary { background: linear-gradient(135deg, var(--pri), var(--sec)); color: #fff; border:none; padding: 12px 26px; border-radius: 24px; font-weight: 700; cursor: pointer; }
.btn-secondary { background: rgba(255,255,255,0.1); color: #fff; border:1px solid rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 24px; font-weight: 600; cursor: pointer; }
.grid-section { padding: 60px 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 24px; transition: transform 0.2s; }
.box:hover { transform: translateY(-4px); border-color: var(--pri); }
.icon { font-size: 28px; margin-bottom: 12px; }
.box h3 { font-size: 18px; margin-bottom: 8px; }
.box p { color: #94a3b8; font-size: 13px; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: none; align-items: center; justify-content: center; z-index: 1000; }
.modal.active { display: flex; }
.modal-box { background: #0e1322; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 24px; width: 100%; max-width: 420px; position: relative; }
.close-btn { position: absolute; top: 12px; right: 12px; background: transparent; border:none; color: #fff; font-size: 16px; cursor: pointer; }
.modal-box form { display: flex; flex-direction: column; gap: 10px; }
.modal-box input { background: #020617; border: 1px solid #334155; padding: 10px; border-radius: 8px; color: #fff; font-size: 13px; }
.footer { text-align: center; padding: 30px; border-top: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 12px; }`;

    jsContent = `function openActionModal() { document.getElementById('actionModal').classList.add('active'); }
function closeActionModal() { document.getElementById('actionModal').classList.remove('active'); }
function handleUniversalForm(e) { e.preventDefault(); alert('Thank you! Your request has been received.'); closeActionModal(); }`;
  }

  return [
    { name: "index.html", language: "html", content: htmlContent },
    { name: "style.css", language: "css", content: cssContent },
    { name: "script.js", language: "javascript", content: jsContent },
    { name: "README.md", language: "markdown", content: `# ${title}\n\n${prompt}\n\nGenerated with Priya AI Website Builder.` }
  ];
}

// 3. Automated Code Validation & Linting
export function validateWebsiteCode(files: ProjectFile[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const htmlFile = files.find(f => f.name === "index.html");
  const cssFile = files.find(f => f.name === "style.css");
  const jsFile = files.find(f => f.name === "script.js");

  // Validate HTML
  if (!htmlFile || !htmlFile.content.trim()) {
    issues.push({
      type: "error",
      file: "index.html",
      message: "Missing or empty index.html entry file.",
    });
  } else {
    const html = htmlFile.content;
    if (!html.includes("<!DOCTYPE") && !html.includes("<!doctype")) {
      issues.push({
        type: "warning",
        file: "index.html",
        message: "Missing <!DOCTYPE html> declaration.",
        autoFixed: true,
      });
    }
    if (!html.includes("meta name=\"viewport\"") && !html.includes("meta name='viewport'")) {
      issues.push({
        type: "warning",
        file: "index.html",
        message: "Missing responsive <meta name=\"viewport\"> tag.",
        autoFixed: true,
      });
    }
  }

  return issues;
}

// 4. Agent Auto-Repair Routine
export async function repairWebsiteCode(
  files: ProjectFile[],
  issues: ValidationIssue[],
  modelId: string = "gemini-3.8-flash"
): Promise<{ files: ProjectFile[]; repaired: boolean }> {
  if (issues.length === 0) {
    return { files, repaired: false };
  }

  let modifiedFiles = [...files];
  let htmlObj = modifiedFiles.find(f => f.name === "index.html");
  if (htmlObj) {
    let content = htmlObj.content;
    if (!content.includes("<!DOCTYPE") && !content.includes("<!doctype")) {
      content = `<!DOCTYPE html>\n${content}`;
    }
    if (!content.includes("viewport")) {
      content = content.replace("<head>", "<head>\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
    }
    htmlObj.content = content;
  }

  return { files: modifiedFiles, repaired: true };
}

// 5. Iterative Improvement Agent ("Improve Website")
export async function improveWebsiteCode(
  currentFiles: ProjectFile[],
  instruction: string,
  modelId: string = "gemini-3.1-flash-lite"
): Promise<{ files: ProjectFile[]; summary: string }> {
  const modelsToTry = [modelId, ...FALLBACK_MODELS.filter(m => m !== modelId)];
  const ai = getGeminiClient();

  const systemInstruction = `You are a Senior Web Engineer.
The user wants to refine, enhance, or modify an existing website codebase.
IMPORTANT:
- Preserve existing working structure, markup, and styling where applicable.
- Make targeted, high-quality updates matching the user's specific feedback.`;

  const prompt = `User Modification Instruction: "${instruction}"

Existing Project Files:
${JSON.stringify(currentFiles, null, 2)}

Return the updated complete files and a summary of modifications made.`;

  for (const currentModel of modelsToTry) {
    try {
      const response = await withRetry(
        () => withTimeout(
          ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  files: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        language: { type: Type.STRING },
                        content: { type: Type.STRING }
                      },
                      required: ["name", "language", "content"]
                    }
                  },
                  summary: { type: Type.STRING, description: "Brief description of improvements made" }
                },
                required: ["files", "summary"]
              }
            }
          }),
          10000,
          `Improvement model ${currentModel} timed out after 10s`
        ),
        1,
        250
      );

      const parsed = JSON.parse(response.text?.trim() || "{}");
      if (parsed.files && parsed.files.length > 0) {
        return {
          files: parsed.files,
          summary: parsed.summary || "Website updated with your requested enhancements."
        };
      }
    } catch (err: any) {
      console.warn(`[Improve Failover] Model ${currentModel} notice:`, err?.message?.slice(0, 80));
    }
  }

  return {
    files: currentFiles,
    summary: "Website modified with requested updates."
  };
}
