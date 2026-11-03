// Compiled asset acceptance. --file additionally checks file:// where policy permits.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const {createServer}=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const root=path.resolve('dist');
 const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.wasm':'application/wasm'};
 const server=createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const port=server.address().port;
 const browser=await chromium.launch({executablePath:process.env.ECHO_TEST_CHROMIUM||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:process.platform==='linux'?['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 try {
  const page=await browser.newPage({viewport:{width:960,height:600}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(`http://127.0.0.1:${port}/`))external.push(r.url());});
  await page.goto(process.argv.includes('--file')?pathToFileURL(path.resolve('dist/index.html')).href:`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(()=>window.echoDiagnostics?.().ready,{}, {timeout:90000});
  await page.click('#drive');await page.keyboard.down('w');
  await page.waitForFunction(()=>window.echoDiagnostics().speed>2,{}, {timeout:60000});await page.keyboard.up('w');
  if(errors.length||external.length)throw new Error(JSON.stringify({errors,external}));
  console.log('PASS: compiled assets and bundled Havok WASM load; vehicle drives; no external network requests.');
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
