const {_electron}=require('playwright');
(async()=>{
 let app;
 let passed=false;
 const watchdog=setTimeout(()=>{console.error('Electron smoke test did not complete');process.exit(1);},110000);
 process.on('beforeExit',()=>{if(!passed)process.exitCode=1;});
 try {
  app=await _electron.launch({args:['.',...(process.platform==='linux'?['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[])],timeout:30000});
  const page=await app.firstWindow();
  page.on('console',m=>{if(m.type()==='error')console.error(m.text());});
  page.on('pageerror',e=>console.error(e));
  await page.waitForFunction(()=>window.echoDiagnostics?.().ready,{}, {timeout:90000});
  const security=await app.evaluate(({BrowserWindow})=>{const prefs=BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();return {nodeIntegration:prefs.nodeIntegration,contextIsolation:prefs.contextIsolation,sandbox:prefs.sandbox};});
  if(security.nodeIntegration || !security.contextIsolation || !security.sandbox)throw new Error('Unsafe Electron preferences');
  passed=true;
  console.log('Desktop local-file startup passed',security,await page.evaluate(()=>window.echoDiagnostics()));
 }finally{clearTimeout(watchdog);await app?.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
