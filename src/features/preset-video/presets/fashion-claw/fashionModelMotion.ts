/** Animation reference from the 296-frame source video; viewport is 360×640. */
export type FashionModelMotion = {
  x: number;
  y: number;
  rotationDeg: number;
  breathScale: number;
};
export type FashionModelPose = {
  leftArmDeg: number;
  rightArmDeg: number;
  leftLegDeg: number;
  rightLegDeg: number;
  headDeg: number;
  skirtScale: number;
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const t=clamp01(x); return t*t*(3-2*t); };
const safeTime = (t: number) => Number.isFinite(t) ? Math.max(0,t) : 0;

/** Roll in from the sofa at LEFT; at frame 24 the model rests at the rug centre. */
export function getFashionModelMotion(seconds: number): FashionModelMotion {
  const t = safeTime(seconds);
  const progress = smooth(t / 0.8);
  const remainder = 1-progress;
  const settled = t >= 0.8;
  return {
    x: -118 * remainder,
    y: 11 * remainder + (settled ? Math.sin((t - .8) * 2.8) * 0.9 : 0),
    rotationDeg: -64 * remainder + (settled ? Math.sin((t-.8)*1.8)*1.35 : 0),
    breathScale: settled ? 1 + 0.006 * Math.sin((t-.8) * 2.3) : 1,
  };
}

const POSE_KEYS: readonly (readonly [number,number,number,number,number,number])[] = [
//  t, left arm, right arm, left leg, right leg, head
  [0,   -18,   12,  14, -13, -10],
  [.8,   24,  -17,   6, -10,   5],
  [1.8,  42,  -18,   7, -11,  -7],
  [2.7,  17,   22,   4, -9,    6],
  [3.7,  55,  -50,   7, -8,   -5],
  [4.6,  62,  -55,   0, -5,    0],
  [5.2,  94,  -96,   8, -7,    3],
  [6.0,  94,  -94,   8, -7,   -3],
  [6.5,  72,  -52,  15, -14, -8],
  [7.25, 65,  -40, -16,  16,   9],
  [8.10, 63,  -48, -10,  12,   5],
  [8.7,  38,  -36,   4, -9,    0],
  [9.8,  43,  -42,   6, -12,   2],
];

 /** Keyed animation for the built-in vector mannequin only; never distorts customer photos. */
export function getFashionModelPose(seconds: number): FashionModelPose {
  const t = safeTime(seconds);
  let left: readonly number[] = POSE_KEYS[POSE_KEYS.length-1];
  let right: readonly number[] = left;
  if (t <= POSE_KEYS[0][0]) left=right=POSE_KEYS[0];
  else for (let i=1; i<POSE_KEYS.length; i++) {
    if (t<=POSE_KEYS[i][0]) { left=POSE_KEYS[i-1];right=POSE_KEYS[i];break; }
  }
  const ratio=left===right?0:smooth((t-left[0])/(right[0]-left[0]));
  const v=(index:number)=>left[index]+(right[index]-left[index])*ratio;
  const idle = t>.8 ? Math.sin(t*2.5) : 0;
  return {
    leftArmDeg:v(1)+idle*2.4,
    rightArmDeg:v(2)-idle*2.0,
    leftLegDeg:v(3)+idle*1.5,
    rightLegDeg:v(4)-idle*1.5,
    headDeg:v(5)+idle*1.7,
    skirtScale: 1+Math.sin(t*2.5)*0.009,
  };
}
