const express=require("express"),cron=require("node-cron"),fs=require("fs"),path=require("path");
const app=express(),PORT=process.env.PORT||3000,KEY=process.env.ADMIN_KEY||"change-me",D=path.join(__dirname,"data");
app.use(express.json());app.use(express.static(path.join(__dirname,"public")));
const rd=(f,d)=>{try{return JSON.parse(fs.readFileSync(path.join(D,f),"utf8"))}catch{return d}},wr=(f,x)=>fs.writeFileSync(path.join(D,f),JSON.stringify(x,null,2));
function auth(req,res,next){if((req.headers["x-admin-key"]||req.query.key)!==KEY)return res.status(401).json({error:"Unauthorized"});next()}
app.get("/api/monetization",(req,res)=>res.json(rd("monetization.json",{})));
app.get("/api/jobs",(req,res)=>{let j=rd("jobs.json",[]).filter(x=>x.verified||x.status==="published"),t=req.query.type,q=req.query.q;if(t)j=j.filter(x=>x.type===t);if(q)j=j.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));res.json(j)});
app.get("/api/jobs/:id",(req,res)=>{let j=rd("jobs.json",[]).find(x=>x.id===req.params.id);if(!j||(!j.verified&&j.status!=="published"))return res.status(404).json({error:"Not found"});res.json(j)});
app.get("/api/admin/jobs",auth,(req,res)=>res.json(rd("jobs.json",[])));
app.get("/api/admin/stats",auth,(req,res)=>{let j=rd("jobs.json",[]);res.json({total:j.length,pending:j.filter(x=>x.status==="pending_verification").length,published:j.filter(x=>x.verified||x.status==="published").length})});
app.post("/api/jobs/:id/verify",auth,(req,res)=>{let j=rd("jobs.json",[]),x=j.find(a=>a.id===req.params.id);if(!x)return res.status(404).json({error:"Not found"});x.verified=true;x.status="published";wr("jobs.json",j);res.json(x)});
app.listen(PORT,()=>console.log("Sarkari Job Portal V7: http://localhost:"+PORT));
