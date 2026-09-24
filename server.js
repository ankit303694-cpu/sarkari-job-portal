const express=require("express"),fs=require("fs"),path=require("path");

const app=express();
const PORT=process.env.PORT||3000;
const KEY=process.env.ADMIN_KEY||"change-me";
const D=path.join(__dirname,"Data");

app.use(express.json());
app.use(express.static(path.join(__dirname,"Public")));

const rd=(f,d)=>{
  try{
    return JSON.parse(fs.readFileSync(path.join(D,f),"utf8"));
  }catch{
    return d;
  }
};

function publicJobs(){
  return rd("jobs.json",[]).filter(x=>x.verified||x.status==="published");
}

app.get("/api/monetization",(req,res)=>{
  res.json(rd("monetization.json",{}));
});

app.get("/api/jobs",(req,res)=>{
  let j=publicJobs(),t=req.query.type,q=req.query.q;
  if(t) j=j.filter(x=>x.type===t);
  if(q) j=j.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
  res.json(j);
});

app.get("/api/jobs/:id",(req,res)=>{
  let x=publicJobs().find(x=>x.id===req.params.id);
  if(!x) return res.status(404).json({error:"Not found"});
  res.json(x);
});

function auth(req,res,next){
  if((req.headers["x-admin-key"]||req.query.key)!==KEY)
    return res.status(401).json({error:"Unauthorized"});
  next();
}

app.get("/api/admin/jobs",auth,(req,res)=>{
  res.json(rd("jobs.json",[]));
});

app.get("/api/admin/stats",auth,(req,res)=>{
  let j=rd("jobs.json",[]);
  res.json({
    total:j.length,
    pending:j.filter(x=>x.status==="pending_verification").length,
    published:j.filter(x=>x.verified||x.status==="published").length
  });
});

app.post("/api/jobs/:id/verify",auth,(req,res)=>{
  let j=rd("jobs.json",[]);
  let x=j.find(a=>a.id===req.params.id);
  if(!x) return res.status(404).json({error:"Not found"});
  x.verified=true;
  x.status="published";
  fs.writeFileSync(path.join(D,"jobs.json"),JSON.stringify(j,null,2));
  res.json(x);
});

app.get("/sitemap.xml",(req,res)=>{
  const base=`${req.protocol}://${req.get("host")}`;
  const jobs=publicJobs();

  let urls=[
    {
      loc:base+"/",
      lastmod:new Date().toISOString().slice(0,10)
    },
    {
      loc:base+"/job.html",
      lastmod:new Date().toISOString().slice(0,10)
    }
  ];

  jobs.forEach(j=>{
    urls.push({
      loc:base+"/job.html?id="+encodeURIComponent(j.id),
      lastmod:(j.updatedAt||j.date||new Date().toISOString()).slice(0,10)
    });
  });

  let xml='<?xml version="1.0" encoding="UTF-8"?>\n';
  xml+='<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  xml+=urls.map(u=>`<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("");
  xml+="</urlset>";

  res.type("application/xml").send(xml);
});

app.get("/robots.txt",(req,res)=>{
  res.type("text/plain").send(
`User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /api/
Sitemap: ${req.protocol}://${req.get("host")}/sitemap.xml
`
  );
});

app.get("/health",(req,res)=>{
  res.json({ok:true});
});

app.listen(PORT,()=>{
  console.log("Sarkari Job Portal SEO ready on "+PORT);
});
