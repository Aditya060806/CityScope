/**
 * ChatAIService — Real AI brain for the CityScope chatbot
 * Primary: Google Gemini (gemini-2.5-flash)
 * Fallback: Groq (llama-3.3-70b-versatile)
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_AI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.0-flash',
];

export interface ChatContext {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userLocation?: {
    city?: string;
    state?: string;
    area?: string;
    address?: string;
  };
  currentPage?: string;
  issueStats?: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    categories: Record<string, number>;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  content: string;
  suggestions?: string[];
  navigateTo?: string;
  provider: 'gemini' | 'groq' | 'fallback';
}

export interface ReportExtraction {
  category: string;
  title: string;
  description: string;
}

// Navigation intent mapping
const NAV_PATTERNS: Array<{ patterns: RegExp[]; path: string; label: string }> = [
  { patterns: [/\bmap\b/i, /show.*map/i, /view.*map/i, /navigate.*map/i, /take.*map/i, /go.*map/i, /open.*map/i], path: '/map', label: 'Map' },
  { patterns: [/\breport\b.*\bissue\b/i, /report.*problem/i, /file.*report/i, /submit.*issue/i, /create.*report/i, /new.*report/i], path: '/report', label: 'Report Issue' },
  { patterns: [/\bdashboard\b/i, /\bhome\b/i, /go.*home/i, /main.*page/i], path: '/', label: 'Dashboard' },
  { patterns: [/\brewards?\b/i, /show.*rewards/i, /my.*rewards/i, /earn.*points/i], path: '/rewards', label: 'Rewards' },
  { patterns: [/\banalytics\b/i, /\bstats\b/i, /statistics/i, /show.*analytics/i], path: '/analytics', label: 'Analytics' },
  { patterns: [/\bleaderboard\b/i, /rankings/i, /top.*users/i], path: '/leaderboard', label: 'Leaderboard' },
  { patterns: [/\bheroes\b/i, /local.*heroes/i, /community.*heroes/i], path: '/heroes', label: 'Heroes' },
  { patterns: [/\bmessages?\b/i, /\binbox\b/i, /my.*messages/i], path: '/messages', label: 'Messages' },
  { patterns: [/\bprofile\b/i, /my.*profile/i, /account/i], path: '/profile', label: 'Profile' },
  { patterns: [/\bsettings?\b/i, /preferences/i, /my.*settings/i], path: '/settings', label: 'Settings' },
  { patterns: [/\badmin\b/i, /admin.*panel/i, /admin.*dashboard/i], path: '/admin', label: 'Admin Panel' },
];

function buildSystemPrompt(context: ChatContext): string {
  const now = new Date();
  const pages = [
    '/ — Dashboard (home page with issues overview)',
    '/map — Interactive map with pins, clusters, heatmaps of all civic issues',
    '/report — Report a new civic issue with photos, location, category',
    '/rewards — Earn rewards for civic engagement, redeem points',
    '/analytics — Civic impact analytics and trends',
    '/ai-analytics — AI-powered analytics insights',
    '/leaderboard — Community leaderboard and rankings',
    '/heroes — Local heroes and top contributors',
    '/messages — Messages and conversations',
    '/profile — Your profile and activity history',
    '/settings — App settings and preferences',
    '/admin — Admin panel (admin users only)',
  ];

  let prompt = `You are CityScope AI, a smart and friendly civic assistant for the CityScope platform — an Indian civic engagement app that helps citizens report and track community issues like potholes, broken streetlights, water supply problems, sanitation issues, and more.

## Your Personality
- Helpful, concise, and action-oriented
- Friendly but professional — no fluff
- Knowledgeable about Indian civic systems and governance
- You use short paragraphs and bullet points for clarity
- You NEVER make up data — if you don't have info, say so honestly

## Current Context
- Date & Time: ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

  if (context.userName) {
    prompt += `\n- User: ${context.userName}${context.userEmail ? ` (${context.userEmail})` : ''}`;
  }
  if (context.userRole) {
    prompt += `\n- Role: ${context.userRole}`;
  }
  if (context.userLocation) {
    const loc = context.userLocation;
    const parts = [loc.area, loc.city, loc.state].filter(Boolean);
    if (parts.length > 0) {
      prompt += `\n- User Location: ${parts.join(', ')}`;
    }
  }
  if (context.currentPage) {
    prompt += `\n- Currently viewing: ${context.currentPage}`;
  }

  if (context.issueStats) {
    const s = context.issueStats;
    prompt += `\n\n## Live Issue Statistics
- Total Issues: ${s.total}
- Pending: ${s.pending}
- In Progress: ${s.inProgress}
- Resolved: ${s.resolved}`;

    const cats = Object.entries(s.categories).filter(([, v]) => v > 0);
    if (cats.length > 0) {
      prompt += `\n- By Category: ${cats.map(([k, v]) => `${k}: ${v}`).join(', ')}`;
    }
  }

  prompt += `

## Available Pages (you can suggest navigation)
${pages.map(p => `- ${p}`).join('\n')}

## What You Can Do
1. Answer questions about CityScope, civic issues, and the platform
2. Help users understand how to report issues, track progress, earn rewards
3. Provide real statistics when asked (use the live data above)
4. Suggest navigating to relevant pages when appropriate
5. Explain Indian civic processes (ward offices, municipal corporations, etc.)
6. Help users understand issue categories: roads, lighting, sanitation, water, traffic, parks

## Navigation Instructions
When you suggest a user visit a page, naturally mention it in your response. For example: "You can head to the Map page to see all reported issues near you" or "Let me take you to the Report page to file that."

## Response Format
- Keep responses concise (2-4 short paragraphs max)
- Use bullet points for lists
- Use **bold** for emphasis
- Always end with 1-3 short follow-up suggestions the user can click
- Format suggestions as a simple list on the last line, like: "You could try: **Report an issue**, **View the map**, **Check analytics**"`;

  return prompt;
}

function detectNavigation(userMessage: string, aiResponse: string): string | undefined {
  // Check user message for clear navigation intent
  for (const nav of NAV_PATTERNS) {
    for (const pattern of nav.patterns) {
      if (pattern.test(userMessage)) {
        return nav.path;
      }
    }
  }

  // Check AI response for navigation mentions
  const responseNav = aiResponse.toLowerCase();
  if (responseNav.includes('take you to') || responseNav.includes('navigate to') || responseNav.includes('head to') || responseNav.includes('let me open')) {
    for (const nav of NAV_PATTERNS) {
      if (responseNav.includes(nav.label.toLowerCase()) || responseNav.includes(nav.path)) {
        return nav.path;
      }
    }
  }

  return undefined;
}

function extractSuggestions(content: string): { cleanContent: string; suggestions: string[] } {
  const suggestions: string[] = [];
  let cleanContent = content;

  // Pattern: "You could try: **Report**, **View map**, **Check stats**"
  const sugMatch = content.match(/(?:you (?:could|can|might) (?:try|ask|do)|suggestions?|try asking|quick actions?)[:\s]*\*\*(.+?)$/im);
  if (sugMatch) {
    const sugLine = sugMatch[0];
    const boldItems = sugLine.match(/\*\*([^*]+)\*\*/g);
    if (boldItems) {
      boldItems.forEach(item => {
        suggestions.push(item.replace(/\*\*/g, '').trim());
      });
      cleanContent = content.replace(sugLine, '').trim();
    }
  }

  // Fallback: extract any trailing line with multiple bold items
  if (suggestions.length === 0) {
    const lines = content.split('\n');
    const lastLine = lines[lines.length - 1];
    const boldItems = lastLine?.match(/\*\*([^*]+)\*\*/g);
    if (boldItems && boldItems.length >= 2) {
      boldItems.forEach(item => {
        suggestions.push(item.replace(/\*\*/g, '').trim());
      });
      cleanContent = lines.slice(0, -1).join('\n').trim();
    }
  }

  return { cleanContent: cleanContent || content, suggestions };
}

class ChatAIService {
  private conversationHistory: ChatMessage[] = [];
  private maxHistory = 20;

  clearHistory(): void {
    this.conversationHistory = [];
  }

  async sendMessage(userMessage: string, context: ChatContext): Promise<ChatResponse> {
    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: userMessage });

    // Trim history to max
    if (this.conversationHistory.length > this.maxHistory) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistory);
    }

    // Try Gemini first
    if (GEMINI_API_KEY) {
      try {
        const response = await this.callGemini(context);
        return response;
      } catch (err) {
        console.warn('Gemini failed, trying Groq fallback:', err);
      }
    }

    // Try Groq fallback
    if (GROQ_API_KEY) {
      try {
        const response = await this.callGroq(context);
        return response;
      } catch (err) {
        console.warn('Groq also failed:', err);
      }
    }

    // Final fallback — smart local response
    return this.localFallback(userMessage);
  }

  private async callGemini(context: ChatContext): Promise<ChatResponse> {
    const systemPrompt = buildSystemPrompt(context);

    // Build Gemini contents format (system instruction + conversation)
    const contents = this.conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1024,
      }
    };

    // Try models in order
    for (const model of GEMINI_MODELS) {
      try {
        const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) continue;

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;

        const { cleanContent, suggestions } = extractSuggestions(text);
        const navigateTo = detectNavigation(
          this.conversationHistory[this.conversationHistory.length - 1]?.content || '',
          text
        );

        // Add assistant response to history
        this.conversationHistory.push({ role: 'assistant', content: text });

        return {
          content: cleanContent,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
          navigateTo,
          provider: 'gemini',
        };
      } catch {
        continue;
      }
    }

    throw new Error('All Gemini models failed');
  }

  private async callGroq(context: ChatContext): Promise<ChatResponse> {
    const systemPrompt = buildSystemPrompt(context);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...this.conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    const res = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`Groq API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty Groq response');

    const { cleanContent, suggestions } = extractSuggestions(text);
    const navigateTo = detectNavigation(
      this.conversationHistory[this.conversationHistory.length - 1]?.content || '',
      text
    );

    this.conversationHistory.push({ role: 'assistant', content: text });

    return {
      content: cleanContent,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      navigateTo,
      provider: 'groq',
    };
  }

  private localFallback(userMessage: string): ChatResponse {
    const msg = userMessage.toLowerCase();
    let content: string;
    let suggestions: string[];
    let navigateTo: string | undefined;

    if (msg.includes('report') || msg.includes('issue') || msg.includes('problem')) {
      content = "I can help you report a civic issue! Head to the **Report page** where you can describe the problem, add photos, and pin the exact location on the map.";
      suggestions = ['Take me to Report', 'How does reporting work?', 'What categories exist?'];
      navigateTo = '/report';
    } else if (msg.includes('map')) {
      content = "The **Map page** shows all reported civic issues near you with interactive pins, clusters, and heatmaps. You can filter by category and status.";
      suggestions = ['Open the map', 'How do clusters work?', 'Show my location'];
      navigateTo = '/map';
    } else if (msg.includes('reward') || msg.includes('point')) {
      content = "CityScope rewards active citizens! You earn points for reporting issues, getting them verified, and community engagement. Visit **Rewards** to see what you've earned.";
      suggestions = ['Show my rewards', 'How to earn points?', 'View leaderboard'];
      navigateTo = '/rewards';
    } else if (msg.includes('status') || msg.includes('analytics') || msg.includes('stats')) {
      content = "Check out the **Analytics page** for real-time civic impact data — issue trends, resolution rates, category breakdowns, and more.";
      suggestions = ['Open analytics', 'Show issue stats', 'Resolution rate?'];
      navigateTo = '/analytics';
    } else if (msg.includes('help') || msg.includes('what can you do')) {
      content = "I'm your CityScope AI assistant! I can:\n\n• Answer questions about the platform and civic issues\n• Show you live statistics on reported issues\n• Navigate you to any page in the app\n• Help you understand how reporting and rewards work\n\nWhat would you like to know?";
      suggestions = ['Report an issue', 'View the map', 'Show statistics'];
    } else {
      content = `I understand you're asking about "${userMessage}". While I'm having trouble connecting to my AI brain right now, I can still help you navigate CityScope!\n\nTry asking me to:\n• **Report an issue** — file a civic complaint\n• **Show the map** — see issues near you\n• **View analytics** — check community stats`;
      suggestions = ['Report an issue', 'Open the map', 'Show analytics'];
    }

    // Don't push to history for fallback to avoid polluting context
    return { content, suggestions, navigateTo, provider: 'fallback' };
  }

  // ── Report Auto-Submit: Intent Detection ──────────────────────
  isReportSubmitIntent(message: string): boolean {
    const msg = message.toLowerCase();
    const hasAction = /\b(submit|file|lodge|raise|create|report)\b/.test(msg);
    const hasSubject = /\b(sanitation|garbage|waste|pothole|road|water|leak|drainage|light|streetlight|dark|traffic|park|broken|damaged|sewage|flooding|noise|pollution|electricity|power|signal|cleaning|dirt|trash)\b/.test(msg);
    return hasAction && hasSubject;
  }

  // ── Report Auto-Submit: Extract structured data via LLM ──────
  async extractReportData(userMessage: string): Promise<ReportExtraction | null> {
    if (GEMINI_API_KEY) {
      try { return await this.callGeminiExtraction(userMessage); }
      catch (e) { console.warn('Gemini extraction failed:', e); }
    }
    if (GROQ_API_KEY) {
      try { return await this.callGroqExtraction(userMessage); }
      catch (e) { console.warn('Groq extraction failed:', e); }
    }
    return this.keywordExtraction(userMessage);
  }

  private buildExtractionPrompt(userMessage: string): string {
    return `Extract civic issue report details from this user message. Return ONLY valid JSON — no markdown fences, no explanation.
{"category":"<one of: roads, lighting, sanitation, water, traffic, parks, other>","title":"<concise 5-15 word issue title>","description":"<detailed 2-4 sentence description expanding on what the user said>"}

Category guide:
- roads: potholes, road damage, broken roads, signage
- lighting: streetlights, dark areas, electrical issues
- sanitation: garbage, waste, cleanliness, hygiene, sewage
- water: leaks, drainage, water supply, flooding
- traffic: signals, road safety, parking
- parks: parks, playgrounds, gardens
- other: everything else

User message: "${userMessage.replace(/"/g, '\\"')}"`.trim();
  }

  private parseExtractionJSON(text: string): ReportExtraction {
    const jsonStr = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    const validCats = ['roads', 'lighting', 'sanitation', 'water', 'traffic', 'parks', 'other'];
    if (!validCats.includes(parsed.category)) parsed.category = 'other';
    if (!parsed.title || !parsed.description) throw new Error('Missing required fields');
    return { category: parsed.category, title: String(parsed.title).slice(0, 120), description: String(parsed.description).slice(0, 500) };
  }

  private async callGeminiExtraction(userMessage: string): Promise<ReportExtraction> {
    const prompt = this.buildExtractionPrompt(userMessage);
    for (const model of GEMINI_MODELS) {
      try {
        const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
          }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;
        return this.parseExtractionJSON(text);
      } catch { continue; }
    }
    throw new Error('All Gemini models failed for extraction');
  }

  private async callGroqExtraction(userMessage: string): Promise<ReportExtraction> {
    const prompt = this.buildExtractionPrompt(userMessage);
    const res = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty Groq extraction response');
    return this.parseExtractionJSON(text);
  }

  private keywordExtraction(userMessage: string): ReportExtraction {
    const msg = userMessage.toLowerCase();
    let category = 'other';
    if (/sanitation|garbage|waste|trash|dirt|hygiene|clean/i.test(msg)) category = 'sanitation';
    else if (/road|pothole|pavement|highway/i.test(msg)) category = 'roads';
    else if (/light|streetlight|dark|lamp|electrical/i.test(msg)) category = 'lighting';
    else if (/water|leak|drain|pipe|supply|flooding|sewage/i.test(msg)) category = 'water';
    else if (/traffic|signal|parking|safety|accident/i.test(msg)) category = 'traffic';
    else if (/park|playground|garden|recreation/i.test(msg)) category = 'parks';

    const title = userMessage
      .replace(/^(submit|file|create|lodge|raise|report)\s+(a\s+)?(report|complaint|issue)\s*(about|regarding|for|on)?\s*/i, '')
      .trim()
      .slice(0, 100) || `${category.charAt(0).toUpperCase() + category.slice(1)} issue report`;

    return { category, title, description: userMessage };
  }
}

export const chatAIService = new ChatAIService();
export default chatAIService;
