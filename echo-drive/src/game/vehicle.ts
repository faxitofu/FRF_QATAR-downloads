import {Color3, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion, Ray, Scene, StandardMaterial, Vector3} from '@babylonjs/core';
import {clamp, longitudinalForce, steeringRate} from './math';
import {spawn} from './track';

export class Vehicle {
  readonly chassis: Mesh;
  readonly physics: PhysicsAggregate;
  readonly visual: Mesh;
  grounded = 0;
  speed = 0;
  private previous = spawn.clone();
  private current = spawn.clone();
  private previousRotation = Quaternion.Identity();
  private currentRotation = Quaternion.Identity();
  private wheels: Mesh[] = [];
  private wheelAngle = 0;
  constructor(private scene: Scene) {
    this.chassis = MeshBuilder.CreateBox('physical chassis',{width:1.85,height:.65,depth:4.1},scene);
    this.chassis.position.copyFrom(spawn); this.chassis.rotationQuaternion=Quaternion.Identity(); this.chassis.isVisible=false;
    this.physics = new PhysicsAggregate(this.chassis,PhysicsShapeType.BOX,{mass:1150,friction:.2,restitution:.05},scene);
    this.physics.body.setLinearDamping(.1); this.physics.body.setAngularDamping(4);
    this.visual = new Mesh('vehicle display',scene);
    const paint = new StandardMaterial('electric blue paint',scene); paint.diffuseColor=Color3.FromHexString('#178fbc'); paint.specularColor = Color3.White();
    const dark = new StandardMaterial('glass and tires',scene); dark.diffuseColor=Color3.FromHexString('#07101b');
    const head = new StandardMaterial('headlight LEDs',scene); head.diffuseColor=new Color3(.1,.15,.2); head.emissiveColor=new Color3(.75,.95,1);
    const tail = new StandardMaterial('taillight LEDs',scene); tail.diffuseColor=new Color3(.2,0,0);tail.emissiveColor=new Color3(.9,.005,.015);
    const part = (name:string,w:number,h:number,d:number,pos:Vector3,mat:StandardMaterial) => {
      const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene); m.parent=this.visual; m.position.copyFrom(pos);m.material=mat;return m;
    };
    part('body',1.9,.55,4.2,new Vector3(0,0,0),paint);
    part('cabin',1.55,.55,1.9,new Vector3(0,.5,-.1),dark);
    part('hood',1.8,.12,1.2,new Vector3(0,.28,1.3),paint);
    part('rear wing',2,.09,.45,new Vector3(0,.55,-1.8),dark);
    for(const side of [-1,1]) {
      part('headlight',.6,.12,.04,new Vector3(side*.55,.13,2.12),head);
      part('taillight',.65,.12,.04,new Vector3(side*.55,.15,-2.12),tail);
      for(const z of [-1.3,1.3]) {
        const wheel=MeshBuilder.CreateCylinder('wheel',{diameter:.72,height:.3,tessellation:16},scene);
        wheel.parent=this.visual; wheel.rotation.z=Math.PI/2;wheel.position.set(side*.99,-.32,z);wheel.material=dark;this.wheels.push(wheel);
      }
    }
    this.reset();
  }
  reset() {
    this.physics.body.disablePreStep=false;
    this.chassis.position.copyFrom(spawn);this.chassis.rotationQuaternion=Quaternion.Identity();
    this.physics.body.setLinearVelocity(Vector3.Zero());this.physics.body.setAngularVelocity(Vector3.Zero());
    this.previous.copyFrom(spawn);this.current.copyFrom(spawn);this.previousRotation.copyFrom(Quaternion.Identity());this.currentRotation.copyFrom(Quaternion.Identity());
    this.visual.position.copyFrom(spawn);this.visual.rotationQuaternion=Quaternion.Identity();
  }
  beforeStep(input:{throttle:number;steer:number;brake:boolean;handbrake:boolean}) {
    const body=this.physics.body, q=this.chassis.rotationQuaternion!;
    const forward=new Vector3(0,0,1).applyRotationQuaternion(q); forward.y=0;forward.normalize();
    const right=new Vector3(forward.z,0,-forward.x), velocity=body.getLinearVelocity();
    const longitudinal=Vector3.Dot(velocity,forward), lateral=Vector3.Dot(velocity,right);
    this.speed=longitudinal;this.grounded=0;
    for(const x of [-.8,.8]) for(const z of [-1.3,1.3]) {
      const point=new Vector3(x,0,z).applyRotationQuaternion(q).add(this.chassis.position);
      const hit=this.scene.pickWithRay(new Ray(point,Vector3.Down(),1.25),m=>m.metadata?.driveSurface===true);
      if(hit?.hit && hit.pickedPoint) {
        const distance=point.y-hit.pickedPoint.y;
        const angular=body.getAngularVelocity();
        const offset=point.subtract(this.chassis.position);
        const pointVelocity=velocity.add(Vector3.Cross(angular,offset));
        const spring=clamp((.95-distance)*38000-pointVelocity.y*4200,0,18000);
        body.applyForce(new Vector3(0,spring,0),point);this.grounded++;
      }
    }
    if(this.grounded>0) {
      const force=longitudinalForce(input.throttle,longitudinal,input.brake);
      const grip=input.handbrake?1.3:7;
      const traction=forward.scale(force).add(right.scale(clamp(-lateral*1150*grip,-20000,20000)));
      body.applyForce(traction,this.chassis.position);
      const angular=body.getAngularVelocity();
      body.setAngularVelocity(new Vector3(angular.x,steeringRate(input.steer,longitudinal),angular.z));
    }
    if(velocity.length()>55) body.setLinearVelocity(velocity.normalize().scale(55));
    if(this.chassis.position.y < -5 || Math.abs(this.chassis.position.x)>300 || Math.abs(this.chassis.position.z)>240) this.reset();
  }
  afterStep() {
    this.previous.copyFrom(this.current);this.previousRotation.copyFrom(this.currentRotation);
    this.current.copyFrom(this.chassis.position);this.currentRotation.copyFrom(this.chassis.rotationQuaternion!);
  }
  render(alpha:number,dt:number) {
    this.visual.position.copyFrom(Vector3.Lerp(this.previous,this.current,alpha));
    this.visual.rotationQuaternion=Quaternion.Slerp(this.previousRotation,this.currentRotation,alpha);
    this.wheelAngle+=this.speed*dt/.36;
    for(const wheel of this.wheels) wheel.rotation.x=this.wheelAngle;
  }
}
