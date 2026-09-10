import * as cheerio from "cheerio";

/**
 * Fetch and extract text content from a web URL
 */
export const extractUrlContent = async (url) => {
  if (!url || typeof url !== "string") {
    throw new Error("A valid URL is required");
  }

  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 NexAI/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} when fetching ${formattedUrl}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise elements
    $("script, style, noscript, nav, footer, header, svg, iframe, form").remove();

    // Extract title
    let title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      $("h1").first().text().trim();

    if (!title) {
      try {
        const parsed = new URL(formattedUrl);
        title = parsed.hostname + parsed.pathname;
      } catch {
        title = formattedUrl;
      }
    }

    // Extract description
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    // Extract clean body text
    let bodyText = $("body").text().replace(/\s+/g, " ").trim();

    // Bound content length for free-tier token economy (15,000 chars)
    if (bodyText.length > 15000) {
      bodyText = bodyText.slice(0, 15000);
    }

    return {
      title: title.slice(0, 160),
      description: description.slice(0, 500),
      content: bodyText || description || title,
      url: formattedUrl,
    };
  } catch (err) {
    console.warn(`[ExtractorService] Failed to fetch ${url}:`, err.message);
    // Fallback gracefully so saving never throws a 500
    let fallbackTitle = url;
    try {
      const u = new URL(formattedUrl);
      fallbackTitle = `${u.hostname}${u.pathname !== "/" ? u.pathname : ""}`;
    } catch {
      // Keep url
    }

    return {
      title: fallbackTitle,
      description: "",
      content: `URL: ${formattedUrl}`,
      url: formattedUrl,
    };
  }
};

