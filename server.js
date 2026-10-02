const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.env.PORT) || 3000;
const allowed = new Set(['index.html','style.css','engine.js','app.js']);
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript'};
http.createServer((req,res)=>{
  let name;
  try {name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'') || 'index.html';}catch{res.writeHead(400);res.end();return;}
  if(!allowed.has(name)){res.writeHead(404);res.end('Not found');return;}
  fs.readFile(path.join(__dirname,name),(err,data)=>{
    if(err){res.writeHead(500);res.end('Could not read file');return;}
    res.writeHead(200,{'Content-Type':`${mime[path.extname(name)]}; charset=utf-8`,'Cache-Control':'no-store'});res.end(data);
  });
}).listen(port,'127.0.0.1',()=>console.log(`Space Attack is ready: http://localhost:${port}`));
