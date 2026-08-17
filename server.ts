import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Server-side Gemini API client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
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
app.post("/api/convert-ai", async (req, res) => {
  try {
    const { html, css, themeMeta, options } = req.body;

    if (!html || typeof html !== "string") {
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

HTML Code:
\`\`\`html
${html.slice(0, 30000)}
\`\`\`

CSS Code:
\`\`\`css
${(css || '').slice(0, 20000)}
\`\`\`

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
      model: "gemini-3.7-flash",
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
  if (process.env.NODE_ENV !== "production") {
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
