import {FreeCamera, Quaternion, Ray, Scene, Vector3} from '@babylonjs/core';
import {smoothAlpha} from './math';
export class ChaseCamera {
  readonly camera: FreeCamera;
  constructor(private scene:Scene) {
    this.camera=new FreeCamera('chase camera',new Vector3(110,5,-12),scene);
    this.camera.minZ=.15;this.camera.maxZ=650;this.camera.fov=.85;
  }
  update(position:Vector3,rotation:Quaternion,dt:number,snap=false) {
    const forward=new Vector3(0,0,1).applyRotationQuaternion(rotation);
    forward.y=0;forward.normalize();
    const focus=position.add(new Vector3(0,1,0));
    const desired=position.subtract(forward.scale(10)).add(new Vector3(0,4.2,0));
    const rayDirection=desired.subtract(focus), distance=rayDirection.length();rayDirection.normalize();
    const hit=this.scene.pickWithRay(new Ray(focus,rayDirection,distance),mesh=>mesh.name==='impact barrier'||mesh.name==='tower');
    const target=hit?.hit&&hit.pickedPoint ? hit.pickedPoint.subtract(rayDirection.scale(.5)) : desired;
    this.camera.position.copyFrom(snap?target:Vector3.Lerp(this.camera.position,target,smoothAlpha(6,dt)));
    this.camera.setTarget(focus.add(forward.scale(4)));
  }
}
