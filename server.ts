import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
// Behind one reverse proxy (Cloud Run / nginx) so req.ip is the real client IP
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.7-flash";

// Source files only (images stay in the browser), so a few MB is plenty
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

/**
 * Minimal in-memory rate limiter (per client IP) so a public deployment
 * cannot burn through the Gemini API quota.
 */
const AI_RATE_LIMIT = Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 20;
const aiRequests = new Map<string, number[]>();
function aiRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const recent = (aiRequests.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= AI_RATE_LIMIT) {
    const retryAfter = Math.ceil((recent[0] + 60 * 60 * 1000 - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({ error: `AI rate limit reached (${AI_RATE_LIMIT}/hour). Try again in ${Math.ceil(retryAfter / 60)} min.` });
    return;
  }
  recent.push(now);
  aiRequests.set(ip, recent);
  next();
}

interface AiSourceFile {
  name: string;
  type: string;
  isMain?: boolean;
  content: string;
}

/**
 * Packs the source files into the prompt within a character budget
 * (main HTML first, then the other pages, then stylesheets and scripts).
 */
function packSourceFiles(files: AiSourceFile[], budget = 120_000): string {
  const order = (f: AiSourceFile) => (f.isMain ? 0 : f.type === "html" ? 1 : f.type === "css" ? 2 : 3);
  const sorted = [...files].sort((a, b) => order(a) - order(b));
  const lang: Record<string, string> = { html: "html", css: "css", javascript: "js" };
  let remaining = budget;
  const blocks: string[] = [];
  for (const file of sorted) {
    if (remaining <= 0) {
      blocks.push(`(${file.name} omitted: prompt size limit reached)`);
      continue;
    }
    const content = file.content.slice(0, remaining);
    remaining -= content.length;
    const truncated = content.length < file.content.length ? "\n/* ...truncated... */" : "";
    blocks.push(`File: ${file.name}${file.isMain ? " (main page)" : ""}\n\`\`\`${lang[file.type] || ""}\n${content}${truncated}\n\`\`\``);
  }
  return blocks.join("\n\n");
}

// Server-side Gemini API client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI-Enhanced WordPress Theme Conversion
app.post("/api/convert-ai", aiRateLimit, async (req, res) => {
  try {
    const { html, css, themeMeta, options } = req.body;
    // Optional natural-language request from the AI command bar
    const instruction = typeof req.body.instruction === "string" ? req.body.instruction.trim().slice(0, 1000) : "";

    // New clients send every source file; older ones send a single html/css pair
    let files: AiSourceFile[] = Array.isArray(req.body.files)
      ? req.body.files.filter((f: any) => f && typeof f.name === "string" && typeof f.content === "string")
      : [];
    if (files.length === 0 && typeof html === "string") {
      files = [{ name: "index.html", type: "html", isMain: true, content: html }];
      if (typeof css === "string" && css) files.push({ name: "style.css", type: "css", content: css });
    }

    if (!files.some((f) => f.type === "html" && f.content.trim())) {
      res.status(400).json({ error: "HTML content is required" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ 
        error: "GEMINI_API_KEY is not configured. Using standard rule-based conversion.",
        fallback: true 
      });
      return;
    }

    const prompt = `You are a world-class expert WordPress Core Developer.
Analyze the following HTML and CSS code and convert it into a complete, professional, secure, and modern WordPress theme.

Theme Metadata:
- Theme Name: ${themeMeta?.name || 'My Converted Theme'}
- Author: ${themeMeta?.author || 'WordPress Developer'}
- Version: ${themeMeta?.version || '1.0.0'}
- Text Domain: ${themeMeta?.textdomain || 'my-converted-theme'}
- Description: ${themeMeta?.description || 'A custom converted WordPress theme'}

Options:
- Architecture: ${options?.themeType || 'classic'}
- Include Custom Post Types: ${options?.includeCustomPostTypes ? 'Yes' : 'No'}
- Custom Post Types List: ${JSON.stringify(options?.customPostTypes || [])}
- Widget Areas: ${JSON.stringify(options?.widgetAreas || [])}
- Menu Locations: ${JSON.stringify(options?.menuLocations || [])}

${instruction ? `The user asked for this change (apply it while keeping everything else working):
"""
${instruction}
"""

` : ""}Source files of the static site:

${packSourceFiles(files)}

Every additional HTML page (not the main page) should become a page template named page-{slug}.php.
The main page body (hero, sections) must become front-page.php.
Static assets live in the theme under assets/images, assets/css and assets/js: reference them with get_template_directory_uri().
Escape all dynamic output (esc_html, esc_url, esc_attr) and never use hyphens in PHP function names.

Generate the following essential WordPress theme files strictly following WordPress coding standards:
1. style.css (with full WordPress theme header comment block and converted CSS)
2. functions.php (with after_setup_theme hook, theme_support for title-tag, post-thumbnails, custom-logo, html5, responsive-embeds, register_nav_menus, widgets_init for sidebars, wp_enqueue_scripts properly enqueuing style.css and get_template_directory_uri())
3. header.php (with wp_head(), body_class(), wp_body_open(), dynamic logo/site title, and wp_nav_menu())
4. footer.php (with dynamic footer widgets or copyright, wp_footer())
5. index.php (with main WordPress loop: have_posts(), the_post(), the_title(), the_permalink(), the_post_thumbnail(), the_excerpt(), the_posts_pagination(), get_header(), get_footer(), get_sidebar())
6. single.php (single post template with the_content(), post tags, author bio, comments_template())
7. page.php (standard page template with the_content())
8. sidebar.php (with dynamic_sidebar)
9. archive.php (with the_archive_title(), the_archive_description(), and post loop)
10. template-parts/content.php (reusable post card component)
11. front-page.php (the main page body converted to a template, using get_header() and get_footer())

Return your response strictly as a JSON object with this structure:
{
  "files": [
    {
      "path": "style.css",
      "content": "/* Theme Name: ... */ ...",
      "purpose": "Main stylesheet and theme identification"
    },
    {
      "path": "functions.php",
      "content": "<?php ...",
      "purpose": "Theme setup, hooks, script/style enqueuing, and feature registration"
    },
    ... other files ...
  ],
  "summary": "Detailed summary of structural conversions made",
  "detectedFeatures": ["Custom Navigation", "Blog Loop", "Featured Cards", "Sidebar Widgets"]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    try {
      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse AI JSON response:", parseError);
      res.status(500).json({ error: "Failed to parse AI conversion response", raw: responseText });
    }
  } catch (error: any) {
    console.error("AI Conversion error:", error);
    res.status(500).json({ error: error.message || "Failed to process AI conversion" });
  }
});

// Vite middleware & Static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production" || process.argv.includes("--prod");
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WordPress Theme Converter Server running on port ${PORT}`);
  });
}

startServer();
