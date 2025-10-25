// contentReinject.js
// Inject overlay, detect LinkedIn job page, fetch structured job JSON, 
// and store only the latest job in localStorage as "current_job".

(function () {
  const OVERLAY_ID = "jobgenie-float";
  const LOCAL_STORAGE_KEY = "current_job";
  const SCRAPE_SERVER = "http://localhost:5000/api/fetch-job";

  chrome.storage.local.get("jobgenieActive", (res) => {
    if (!res.jobgenieActive) return;

    // Inject overlay with small delay to avoid early loading issues
    setTimeout(injectOverlayIfNeeded, 800);

    // Handle SPA navigation and initial load
    let lastUrl = location.href;
    window.addEventListener("load", () => {
      injectOverlayIfNeeded();
      setTimeout(() => tryFetchCurrentJob(lastUrl), 600);
    });

    // Detect LinkedIn’s internal navigation changes
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        injectOverlayIfNeeded();
        tryFetchCurrentJob(lastUrl);
      }
    }, 1200);
  });

  function injectOverlayIfNeeded() {
    if (document.getElementById(OVERLAY_ID)) return;
    const iframe = document.createElement("iframe");
    iframe.id = OVERLAY_ID;
    iframe.src = chrome.runtime.getURL("overlay.html");
    iframe.style.position = "fixed";
    iframe.style.bottom = "20px";
    iframe.style.right = "20px";
    iframe.style.width = "350px";
    iframe.style.height = "450px";
    iframe.style.zIndex = "999999";
    iframe.style.border = "none";
    iframe.style.borderRadius = "12px";
    iframe.style.boxShadow = "0 6px 30px rgba(0,0,0,0.4)";
    iframe.style.background = "white";
    document.body.appendChild(iframe);
  }

  function tryFetchCurrentJob(url) {
    if (!url.includes("linkedin.com/jobs/view")) return;

    fetch(`${SCRAPE_SERVER}?jobUrl=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((jobData) => {
        if (!jobData || jobData.error) {
          console.warn("JobGenie scrape error:", jobData);
          showToast("❌ Failed to fetch job details");
          return;
        }

        // Always overwrite with the latest job
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jobData));
        
        //store it in localstorage
        chrome.storage.local.set({ current_job: jobData });

        console.log("✅ JobGenie: current job updated:", jobData.jobTitle);
        showToast("✅ Job info updated for cover letter");
      })
      .catch((err) => {
        console.error("JobGenie fetch error:", err);
        showToast("❌ Server connection failed");
      });
  }

  function showToast(msg) {
    const old = document.getElementById("jobgenie-toast");
    if (old) old.remove();

    const t = document.createElement("div");
    t.id = "jobgenie-toast";
    t.innerText = msg;
    t.style.cssText = `
      position:fixed;bottom:80px;right:25px;
      background:#222;color:white;padding:10px 16px;
      border-radius:8px;font-size:14px;font-family:sans-serif;
      z-index:1000000;box-shadow:0 3px 10px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }
})();
