// server.js
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

function buildJobJson($, url) {
  // adjust selectors if LinkedIn layout changes
  const jobTitle = $("h1").first().text().trim();
  const company = $("a.topcard__org-name-link, span.topcard__flavor").first().text().trim();
  const location = $("span.topcard__flavor--bullet").first().text().trim();
  const employmentType = $("span.job-criteria__text--criteria").first().text().trim(); // fallback
  const postedDate = $("span.posted-time-ago__text, span.posted-time-ago__text--new").first().text().trim();
  const description = $("div.show-more-less-html__markup").text().trim() || $("section.description").text().trim();

  return {
    jobTitle: jobTitle || null,
    company: company || null,
    location: location || null,
    employmentType: employmentType || null,
    postedDate: postedDate || null,
    description: description || null,
    scrapedFrom: url,
    scrapedAt: new Date().toISOString()
  };
}

function validateJob(job) {
  // basic validation — require title and company at least
  const missing = [];
  if (!job.jobTitle) missing.push("jobTitle");
  if (!job.company) missing.push("company");
  return { ok: missing.length === 0, missing };
}

app.get("/api/fetch-job", async (req, res) => {
  const { jobUrl } = req.query;
  if (!jobUrl) return res.status(400).json({ error: "Missing jobUrl query param" });

  try {
    const resp = await axios.get("https://api.scrape.do", {
      params: { token: process.env.SCRAPEDO_API_KEY, url: jobUrl }
    });

    const html = resp.data;
    const $ = cheerio.load(html);
    const job = buildJobJson($, jobUrl);
    const validation = validateJob(job);

    if (!validation.ok) {
      return res.status(422).json({ error: "Validation failed", missing: validation.missing, job });
    }

    return res.json(job);
  } catch (err) {
    console.error("fetch-job error:", err.message);
    return res.status(500).json({ error: "Scrape failed", details: err.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));
