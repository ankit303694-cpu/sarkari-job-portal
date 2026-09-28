const search = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");
const boxes = {
  latest: document.getElementById("latest-list"),
  result: document.getElementById("result-list"),
  admit_card: document.getElementById("admit-list"),
  answer_key: document.getElementById("answer-list")
};
let allJobs = [];

function esc(v){return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function typeKey(job){
  const t=String(job.type||job.category||"").toLowerCase().replaceAll("-","_");
  if(t.includes("result")) return "result";
  if(t.includes("admit")) return "admit_card";
  if(t.includes("answer")) return "answer_key";
  return "latest";
}
function item(job){
  const date=job.lastDate && job.lastDate !== "See official notification" ? `अंतिम तिथि: ${esc(job.lastDate)}` : esc(job.department||job.sourceName||"");
  return `<div class="job-item"><a href="/job.html?id=${encodeURIComponent(job.id)}">${esc(job.title||"सरकारी अपडेट")}</a><div class="job-meta">${date}</div></div>`;
}
function render(){
  const q=(search?.value||"").trim().toLowerCase();
  const jobs=allJobs.filter(j=>!q || [j.title,j.department,j.category,j.sourceName,j.type].join(" ").toLowerCase().includes(q));
  Object.values(boxes).forEach(b=>{if(b)b.innerHTML="<div class=\"empty\">अभी कोई जानकारी उपलब्ध नहीं है।</div>"});
  const groups={latest:[],result:[],admit_card:[],answer_key:[]};
  jobs.forEach(j=>groups[typeKey(j)].push(j));
  Object.keys(groups).forEach(k=>{if(boxes[k]) boxes[k].innerHTML=groups[k].length?groups[k].slice(0,8).map(item).join(""):"<div class=\"empty\">अभी कोई जानकारी उपलब्ध नहीं है।</div>"});
  const first=jobs[0];
  document.getElementById("tickerText").textContent=first?`नई अपडेट: ${first.title}`:"नई सरकारी नौकरी और परीक्षा अपडेट यहां दिखाई जाएंगी।";
}
async function loadJobs(){
  try{
    const res=await fetch("/api/jobs");
    if(!res.ok) throw new Error("API error");
    const data=await res.json();
    allJobs=Array.isArray(data)?data:[];
    render();
  }catch(e){
    allJobs=[];
    render();
    document.getElementById("tickerText").textContent="जानकारी लोड नहीं हो सकी। थोड़ी देर बाद फिर प्रयास करें।";
  }
}
search?.addEventListener("input",render);
searchBtn?.addEventListener("click",render);
loadJobs();
