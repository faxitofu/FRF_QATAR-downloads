export const STEP = 1 / 60;
export const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
export function smoothAlpha(rate: number, dt: number) { return 1 - Math.exp(-rate * dt); }
export function longitudinalForce(throttle: number, speed: number, brake: boolean) {
  const drive = throttle >= 0 ? throttle * 8800 : throttle * 4600;
  const braking = brake ? -Math.sign(speed) * Math.min(16000, Math.abs(speed) * 5000) : 0;
  return drive + braking - speed * Math.abs(speed) * 2.4 - speed * 35;
}
export function steeringRate(steer: number, speed: number) {
  return steer * clamp(speed / 9, -1.1, 1.1) * (1.1 / (1 + Math.abs(speed) / 45));
}
export function fixedSteps(accumulator: number, frameDelta: number) {
  const total = accumulator + clamp(frameDelta, 0, .1);
  const steps = Math.min(6, Math.floor((total + 1e-10) / STEP));
  return {steps, remainder: Math.max(0, total - steps * STEP)};
}
