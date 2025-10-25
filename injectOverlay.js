const id = "jobgenie-float";
const existing = document.getElementById(id);

if (existing) {
  existing.remove();
  chrome.storage.local.set({ jobgenieActive: false });
} else {
  const iframe = document.createElement("iframe");
  iframe.id = id;
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
  chrome.storage.local.set({ jobgenieActive: true });
}
