// --- Configure pdf.js worker path (must be first)
if (typeof pdfjsLib !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("pdfjs/pdf.worker.min.js");
}

document.addEventListener("DOMContentLoaded", () => {
  const resumeFile = document.getElementById("resumeFile");
  const scanBtn = document.getElementById("scanBtn");
  const output = document.getElementById("output");

  // --- Load saved resume text on open
  chrome.storage.sync.get(["resumeText"], (res) => {
    if (res.resumeText) output.value = res.resumeText;
  });

  scanBtn.addEventListener("click", async () => {
    const file = resumeFile.files[0];
    if (!file) {
      alert("Please select a PDF file first.");
      return;
    }

    try {
      // --- Extract text from PDF ---
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let extracted = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((it) => it.str).join(" ");
        extracted += text + "\n";
      }

      const cleanedText = extracted.trim().replace(/\s+/g, " ");
      console.log("📄 Extracted text:", cleanedText);

      // --- Parse and structure basic data ---
      const phoneMatch = cleanedText.match(/(\+?\d[\d\s\-]{8,}\d)/);
      const emailMatch = cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);

      // Guess name: words before phone/email
      let name = "Unknown";
      if (phoneMatch || emailMatch) {
        const cutoffIndex = phoneMatch
          ? cleanedText.indexOf(phoneMatch[0])
          : cleanedText.indexOf(emailMatch[0]);

        const beforeContact = cleanedText.slice(0, cutoffIndex).trim();
        const nameCandidate = beforeContact
          .split(/\s+/)
          .filter((w) => /^[A-Za-z.]+$/.test(w))
          .slice(0, 4)
          .join(" ");

        if (nameCandidate.length > 2) name = nameCandidate;
      }

      // Extract skills section (if any)
      const skillsMatch = cleanedText.match(
        /(SKILLS|Technical Skills|TECHNICAL SKILLS)[:\-]?\s*(.*?)(?=(Projects|Experience|Certifications|$))/i
      );

      const skills = skillsMatch
        ? skillsMatch[2]
            .split(/[•,|]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // --- Build structured JSON ---
      const structuredData = {
        name,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        skills,
        rawText: cleanedText,
      };

      console.log("🧱 Structured JSON:", structuredData);

      // --- Save to Chrome storage ---
      chrome.storage.sync.set(
        { resumeText: cleanedText, resumeData: structuredData },
        () => {
          console.log("✅ Resume structured data saved.");
          alert("Resume scanned and structured ✅");
        }
      );

      // --- Display JSON in UI (if textarea exists) ---
      // output.value = JSON.stringify(structuredData, null, 2);

    } catch (err) {
      console.error("❌ Error reading PDF:", err);
      alert("Could not read this PDF. Try another one.");
    }
  });
});

//acccees job 
chrome.storage.local.get("current_job", (res) => {
  const job = res.current_job;
  if (job) {
    console.log("Current Job:", job);
    // now you can send it to your AI letter generator
  } else {
    console.log("No job saved yet");
  }
});

//combine all data in one 
const aiContext = {
  candidate: structuredData, // your resume info
  jobDetails: job,           // current LinkedIn job info
  timestamp: new Date().toISOString()
};

