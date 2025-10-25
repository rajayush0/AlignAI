// content.js — LinkedIn job data extractor


console.log('JobGenie content script active on', location.hostname);


function extractLinkedInJob() {
const jobTitle = document.querySelector('.topcard__title')?.innerText?.trim() ||
document.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText?.trim();
const company = document.querySelector('.topcard__org-name-link')?.innerText?.trim() ||
document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText?.trim();
const jobDesc = document.querySelector('.description__text')?.innerText?.trim() ||
document.querySelector('.jobs-description__content')?.innerText?.trim();


if (!jobTitle || !jobDesc) return null;
return { jobTitle, company, jobDesc };
}


// Listen for popup requests
chrome.runtime.onMessage.addListener((req, sender, sendResp) => {
if (req.action === 'extract_job_data') {
const data = extractLinkedInJob();
sendResp({ success: !!data, data });
}
});