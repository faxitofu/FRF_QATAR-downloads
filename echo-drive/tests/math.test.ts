import {describe,it,expect} from 'vitest';
import {fixedSteps,longitudinalForce,smoothAlpha,steeringRate,STEP} from '../src/game/math';
describe('vehicle controls and fixed simulation',()=>{
 it('accelerates forwards and backwards; brakes oppose motion',()=>{
  expect(longitudinalForce(1,0,false)).toBeGreaterThan(0);
  expect(longitudinalForce(-1,0,false)).toBeLessThan(0);
  expect(longitudinalForce(0,20,true)).toBeLessThan(longitudinalForce(0,20,false));
  expect(longitudinalForce(0,-10,true)).toBeGreaterThan(0);
 });
 it('reverses steering and does not rotate at rest',()=>{expect(steeringRate(1,0)).toBe(0);expect(steeringRate(1,-10)).toBeLessThan(0);expect(steeringRate(1,10)).toBeGreaterThan(0);});
 it('dissipates speed without throttle',()=>{expect(longitudinalForce(0,10,false)).toBeLessThan(0);});
 it('bounds catch-up after stalls',()=>{expect(fixedSteps(0,4).steps).toBeLessThanOrEqual(6);});
 it('simulates equal time at 30 and 120 render FPS',()=>{
  function run(fps:number){let accumulator=0,ticks=0;for(let i=0;i<fps;i++){const r=fixedSteps(accumulator,1/fps);ticks+=r.steps;accumulator=r.remainder;}return ticks;}
  expect(run(30)).toBe(60);expect(run(120)).toBe(60);expect(fixedSteps(0,STEP).steps).toBe(1);
 });
 it('camera exponential smoothing is frame-rate independent',()=>{expect((1-smoothAlpha(6,1/60))**60).toBeCloseTo((1-smoothAlpha(6,1/30))**30,8);});
});
