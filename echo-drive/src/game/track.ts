import {Color3, Mesh, MeshBuilder, PBRMaterial, PhysicsAggregate, PhysicsShapeType, Scene, StandardMaterial, Vector3} from '@babylonjs/core';
export const spawn = new Vector3(110, 1.1, 0);
export function createTrack(scene: Scene) {
  const materials = {
    asphalt: pbr('wet graphite', '#151f2b', .24, .35),
    pavement: pbr('sidewalk', '#263442', .8, .1),
    building: pbr('architecture', '#182531', .65, .25),
    carpark: pbr('ground', '#0c141f', .8, .05),
  };
  const cyan = glow('cyan route', '#46e6df');
  const amber = glow('amber signage', '#ffb665');
  const windowMat = glow('lit windows', '#6a9dba', .55);
  function pbr(name: string, hex: string, roughness: number, metallic: number) {
    const m = new PBRMaterial(name, scene); m.albedoColor = Color3.FromHexString(hex); m.roughness = roughness; m.metallic = metallic; return m;
  }
  function glow(name: string, hex: string, level = 1) {
    const m = new StandardMaterial(name, scene); m.diffuseColor = Color3.FromHexString(hex); m.emissiveColor = m.diffuseColor.scale(level); return m;
  }
  function box(name: string, w: number, h: number, d: number, pos: Vector3, material: PBRMaterial | StandardMaterial, yaw = 0, collision = false) {
    const mesh = MeshBuilder.CreateBox(name, {width:w,height:h,depth:d}, scene); mesh.position.copyFrom(pos); mesh.rotation.y = yaw; mesh.material = material;
    if (collision) { const a = new PhysicsAggregate(mesh, PhysicsShapeType.BOX, {mass:0, friction:.4, restitution:.05},scene); a.body.disablePreStep = false; }
    mesh.freezeWorldMatrix(); return mesh;
  }
  const floor = box('city ground', 650, .5, 520, new Vector3(0,-.3,0), materials.carpark, 0, true);
  floor.metadata = {driveSurface:true};
  const inner: Vector3[] = [], outer: Vector3[] = [];
  for (let i=0;i<=120;i++) {
    const t=i/120*Math.PI*2, center=new Vector3(110*Math.cos(t),.06,65*Math.sin(t));
    const normal=new Vector3(65*Math.cos(t),0,110*Math.sin(t)).normalize();
    inner.push(center.subtract(normal.scale(9)));outer.push(center.add(normal.scale(9)));
  }
  const ribbon=MeshBuilder.CreateRibbon('continuous wet road',{pathArray:[inner,outer],sideOrientation:Mesh.DOUBLESIDE},scene);
  ribbon.material=materials.asphalt;ribbon.metadata={driveSurface:true};ribbon.freezeWorldMatrix();
  const roads: Mesh[] = [ribbon];
  for (let i=0; i<120; i++) {
    const t = i / 120 * Math.PI*2, t2 = (i+1) /120 * Math.PI*2;
    const p1 = new Vector3(110*Math.cos(t),0,65*Math.sin(t));
    const p2 = new Vector3(110*Math.cos(t2),0,65*Math.sin(t2));
    const center = p1.add(p2).scale(.5), tangent = p2.subtract(p1), yaw = Math.atan2(tangent.x,tangent.z);

    const normal = new Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    for (const side of [-1,1]) {
      const sidePos = center.add(normal.scale(side*10.5)); sidePos.y=.5;
      box('impact barrier',1.3,1.2,tangent.length()+.6,sidePos, materials.pavement,yaw,true);
      const strip = sidePos.clone(); strip.y=1.14;
      box('luminous edge',1.32,.06,tangent.length()+.6,strip,i%8<6?cyan:amber,yaw);
    }
    if (i%2===0) { const mark = center.clone(); mark.y=.075; box('lane marking',.18,.02,1.8,mark,amber,yaw); }
    if (i%6===0) {
      const base = center.add(normal.scale(13)); base.y=4;
      box('streetlight mast',.2,8,.2,base,materials.pavement);
      box('streetlight panel',2.5,.12,.5,base.add(new Vector3(0,4,0)),cyan,yaw);
    }
  }
  // Seeded procedural buildings; repeated window geometry is merged by material.
  let seed = 71;
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
  const windows: Mesh[] = [];
  for (let x=-190; x<=190; x+=24) for (let z=-140; z<=140; z+=24) {
    const ellipse = Math.sqrt((x/110)**2+(z/65)**2);
    if (ellipse>.68 && ellipse<1.4) continue;
    if (Math.abs(x)<25 && Math.abs(z)<25) continue;
    const h = 12+random()*65, w=10+random()*7, d=10+random()*7;
    box('tower',w,h,d,new Vector3(x,h/2,z),materials.building);
    for(let y=4;y<h-2;y+=5) {
      if(random()>.2) windows.push(box('facade band',w+.03,.4,d+.03,new Vector3(x,y,z),windowMat));
    }
  }
  Mesh.MergeMeshes(windows,true,true,undefined,false,true);
  // Start gantry; a visual marker only in this milestone.
  box('start left',.5,7,.5,new Vector3(100,3.5,-4),materials.pavement);
  box('start right',.5,7,.5,new Vector3(120,3.5,-4),materials.pavement);
  box('start header',21,.8,.5,new Vector3(110,7,-4),cyan);
  for(let i=0;i<9;i++) box('start line',1,.02,1,new Vector3(102+i*2,.08,-4),i%2?cyan:amber);
  // Merge visible static geometry per material; keep originals for physics/raycast queries.
  const statics = scene.meshes.filter(mesh => mesh instanceof Mesh && mesh.isVisible) as Mesh[];
  for (const material of new Set(statics.map(mesh => mesh.material))) {
    const group = statics.filter(mesh => mesh.material === material);
    const merged = Mesh.MergeMeshes(group, false, true, undefined, false, false);
    if (merged) { merged.name = 'batched city'; merged.freezeWorldMatrix(); for (const mesh of group) mesh.isVisible = false; }
  }
  return { roads };
}
