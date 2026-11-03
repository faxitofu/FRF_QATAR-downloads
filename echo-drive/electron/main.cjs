const {app,BrowserWindow}=require('electron');
const path=require('node:path');
let window;
app.whenReady().then(()=>{
 window=new BrowserWindow({width:1440,height:900,minWidth:800,minHeight:600,backgroundColor:'#070d16',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',event=>event.preventDefault());
 window.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
 window.loadFile(path.join(__dirname,'../dist/index.html'));
});
app.on('window-all-closed',()=>app.quit());
