const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "change-me";
const DATA = path.join(__dirname, "Data");
const PUBLIC = path.join(__dirname, "Public");

app.use(express.json());
app.use(express.static(PUBLIC));

function read(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8")); }
  catch { return fallback; }
}
function write(name, value) {
  fs.writeFileSync(path.join(DATA, name), JSON.stringify(value, null, 2) + "\n");
}
function auth(req,res,next) {
  if ((req.headers["x-admin-key"] || req.query.key) !== ADMIN_KEY)
    return res.status(401).json({error:"Unauthorized"});
  next();
}

app.get("/health", (req,res)=>res.json({ok:true, version:"8.0.0", time:new Date().toISOString()}));
app.get("/api/monetization",(req,res)=>res.json(read("monetization.json",{})));

app.get("/api/jobs",(req,res)=>{
  let jobs = read("jobs.json",[]).filter(j=>j.verified || j.status==="published");
  const type=req.query.type, q=(req.query.q||"").toLowerCase(), category=req.query.category;
  if(type) jobs=jobs.filter(j=>j.type===type);
  if(category) jobs=jobs.filter(j=>(j.category||"").toLowerCase()===category.toLowerCase());
  if(q) jobs=jobs.filter(j=>JSON.stringify(j).toLowerCase().includes(q));
  jobs.sort((a,b)=>new Date(b.updatedAt||b.fetchedAt||0)-new Date(a.updatedAt||a.fetchedAt||0));
  res.json(jobs);
});
app.get("/api/jobs/:id",(req,res)=>{
  const j=read("jobs.json",[]).find(x=>x.id===req.params.id);
  if(!j || (!j.verified && j.status!=="published")) return res.status(404).json({error:"Not found"});
  res.json(j);
});

app.get("/api/admin/jobs",auth,(req,res)=>res.json(read("jobs.json",[])));
app.get("/api/admin/stats",auth,(req,res)=>{
  const j=read("jobs.json",[]);
  res.json({
    total:j.length,
    pending:j.filter(x=>x.status==="pending_verification").length,
    published:j.filter(x=>x.verified||x.status==="published").length,
    upcoming:j.filter(x=>x.status==="upcoming").length
  });
});
app.post("/api/jobs/:id/verify",auth,(req,res)=>{
  const jobs=read("jobs.json",[]);
  const j=jobs.find(x=>x.id===req.params.id);
  if(!j) return res.status(404).json({error:"Not found"});
  j.verified=true; j.status="published"; j.updatedAt=new Date().toISOString();
  write("jobs.json",jobs); res.json(j);
});
app.post("/api/jobs/:id/reject",auth,(req,res)=>{
  const jobs=read("jobs.json",[]);
  const j=jobs.find(x=>x.id===req.params.id);
  if(!j) return res.status(404).json({error:"Not found"});
  j.status="rejected"; j.verified=false; j.updatedAt=new Date().toISOString();
  write("jobs.json",jobs); res.json(j);
});

app.get("*",(req,res)=>{
  if(req.path.startsWith("/api/") || req.path==="/health") return res.status(404).end();
  res.sendFile(path.join(PUBLIC,"index.html"));
});
app.listen(PORT,()=>console.log(`Sarkari Job Portal V8 running on ${PORT}`));
