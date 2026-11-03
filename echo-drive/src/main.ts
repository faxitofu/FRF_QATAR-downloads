import {Color3, Color4, DefaultRenderingPipeline, DirectionalLight, Engine, HavokPlugin, HemisphericLight, PhysicsEngineV2, Scene, Vector3} from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import havokWasm from '@babylonjs/havok/lib/esm/HavokPhysics.wasm?url';
import {createTrack} from './game/track';
import {Vehicle} from './game/vehicle';
import {Controls} from './game/input';
import {ChaseCamera} from './game/camera';
import {fixedSteps, STEP} from './game/math';

const element = <T extends HTMLElement>(id:string) => document.getElementById(id) as T;
const canvas=element<HTMLCanvasElement>('game'), loading=element('loading'), drive=element<HTMLButtonElement>('drive');
drive.disabled=true;
let paused=true, ready=false;
const controls=new Controls();
async function start() {
  const engine=new Engine(canvas,true,{disableWebGL2Support:false,stencil:true,preserveDrawingBuffer:false});
  if(engine.webGLVersion<2) throw new Error('WebGL2 is required. Update graphics drivers or enable GPU acceleration.');
  engine.setHardwareScalingLevel(1);
  const scene=new Scene(engine);scene.clearColor=new Color4(.025,.045,.08,1);
  scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.003;scene.fogColor=new Color3(.035,.07,.11);
  const ambient=new HemisphericLight('night skylight',new Vector3(.3,1,.1),scene);ambient.intensity=.85;ambient.diffuse=new Color3(.55,.7,.9);ambient.groundColor=new Color3(.1,.15,.2);
  const moon=new DirectionalLight('moon',new Vector3(-.3,-1,.5),scene);moon.intensity=1.8;moon.diffuse=new Color3(.65,.8,1);
  const havok=await HavokPhysics({locateFile:()=>havokWasm});
  scene.enablePhysics(new Vector3(0,-9.81,0),new HavokPlugin(false,havok));
  const physics=scene.getPhysicsEngine() as PhysicsEngineV2;
  physics.setTimeStep(STEP);scene.physicsEnabled=false;
  createTrack(scene);
  const vehicle=new Vehicle(scene), chase=new ChaseCamera(scene);
  scene.activeCamera=chase.camera;
  const pipeline=new DefaultRenderingPipeline('night finish',true,scene,[chase.camera]);
  pipeline.fxaaEnabled=true;pipeline.bloomEnabled=true;pipeline.bloomThreshold=.6;pipeline.bloomWeight=.23;pipeline.bloomKernel=40;
  scene.imageProcessingConfiguration.exposure=1.4;
  let accumulator=0, resetRequested=false, frameCount=0;
  const setPause=(value:boolean) => {
    paused=value;controls.clear();accumulator=0;
    element('menu').hidden=!value;element('hud').hidden=value;
    element('menu-title').textContent=value&&ready?'Circuit standing by':'Free drive';
    drive.innerHTML='CONTINUE DRIVING <span>↗</span>';
    if(!value) canvas.focus();else drive.focus();
  };
  drive.addEventListener('click',()=>setPause(false));
  element('pause-button').addEventListener('click',()=>setPause(!paused));
  element('recover').addEventListener('click',()=>{resetRequested=true;});
  window.addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Escape')setPause(!paused);if(e.code==='KeyR')resetRequested=true;});
  window.addEventListener('blur',()=>setPause(true));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setPause(true);});
  element<HTMLSelectElement>('quality').addEventListener('change',e=>{engine.setHardwareScalingLevel(Number((e.target as HTMLSelectElement).value));});
  element<HTMLInputElement>('bloom').addEventListener('change',e=>{pipeline.bloomEnabled=(e.target as HTMLInputElement).checked;});
  chase.update(vehicle.visual.position,vehicle.visual.rotationQuaternion!,STEP,true);
  await scene.whenReadyAsync();
  ready=true;drive.disabled=false;loading.textContent='Ready • WebGL2 • Local Havok WASM • Keyboard controls';
  // Explicit read-only diagnostic snapshot for automated driving acceptance checks.
  Object.defineProperty(window,'echoDiagnostics',{value:()=>({ready,paused,speed:vehicle.speed,position:vehicle.chassis.position.asArray(),grounded:vehicle.grounded,meshes:scene.meshes.length,frames:frameCount,webgl:engine.webGLVersion}),writable:false});
  engine.runRenderLoop(()=>{
    const dt=Math.min(engine.getDeltaTime()/1000,.1);
    if(resetRequested){vehicle.reset();accumulator=0;resetRequested=false;chase.update(vehicle.visual.position,vehicle.visual.rotationQuaternion!,STEP,true);}
    if(!paused){
      const timing=fixedSteps(accumulator,dt);accumulator=timing.remainder;
      for(let i=0;i<timing.steps;i++) {vehicle.beforeStep(controls.read());physics.getPhysicsPlugin()!.executeStep(STEP,physics.getBodies());vehicle.afterStep();}
      vehicle.render(accumulator/STEP,dt);
    }
    chase.update(vehicle.visual.position,vehicle.visual.rotationQuaternion!,dt);
    scene.render();frameCount++;
    {
      const kmh=Math.round(Math.abs(vehicle.speed)*3.6);
      element('speed').textContent=String(kmh).padStart(3,'0');element('gear').textContent=vehicle.speed<-.5?'R':vehicle.speed>.5?'D':'N';
      element('speed-bar').style.width=Math.min(100,kmh/198*100)+'%';
      element('telemetry').textContent=`${engine.getFps().toFixed(0)} FPS / ${vehicle.grounded}/4 CONTACTS / WEBGL2`;
    }
  });
  window.addEventListener('resize',()=>engine.resize());
  engine.onContextLostObservable.add(()=>{setPause(true);loading.textContent='Graphics context lost. Restart the application to recover.';drive.disabled=true;});
}
start().catch(error=>{console.error(error);loading.textContent=`Startup failed: ${error instanceof Error?error.message:String(error)}. Check WebGL2 support and application files.`;drive.disabled=true;});
