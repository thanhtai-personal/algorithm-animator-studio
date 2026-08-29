import { useEffect, useMemo, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  drawSubscribeButtonFace2D,
  subscribeReminderFrameAt,
  subscribeReminderLayout,
} from "../lib/subscribeReminder";
import { RHYTHMIC_CAMERA_FOV } from "./rhythmicSceneMath3D";

const TEXTURE_WIDTH = 1_024;
const TEXTURE_HEIGHT = 320;
const FACE_WIDTH = 880;
const FACE_HEIGHT = FACE_WIDTH / 4.7;
const SPRITE_DEPTH = 8;

interface RhythmicSubscribeReminder3DProps {
  timeRef: MutableRefObject<number>;
  frameWidth: number;
  frameHeight: number;
}

function makeSubscribeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext("2d")!;
  context.translate(canvas.width / 2, canvas.height / 2);
  drawSubscribeButtonFace2D(context, FACE_WIDTH, FACE_HEIGHT);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function RhythmicSubscribeReminder3D({
  timeRef,
  frameWidth,
  frameHeight,
}: RhythmicSubscribeReminder3DProps) {
  const { camera } = useThree();
  const texture = useMemo(makeSubscribeTexture, []);
  const material = useMemo(() => new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  }), [texture]);
  const sprite = useMemo(() => {
    const value = new THREE.Sprite(material);
    value.visible = false;
    value.frustumCulled = false;
    value.renderOrder = 1_200;
    return value;
  }, [material]);
  const geometry = useMemo(() => {
    const layout = subscribeReminderLayout(frameWidth, frameHeight);
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(RHYTHMIC_CAMERA_FOV / 2)) * SPRITE_DEPTH;
    const viewWidth = viewHeight * (frameWidth / frameHeight);
    const faceWorldWidth = viewWidth * (layout.width / frameWidth);
    const spriteWidth = faceWorldWidth * (TEXTURE_WIDTH / FACE_WIDTH);
    return {
      baseY: (0.5 - layout.centerY / frameHeight) * viewHeight,
      spriteWidth,
      spriteHeight: spriteWidth * (TEXTURE_HEIGHT / TEXTURE_WIDTH),
      viewHeight,
    };
  }, [frameHeight, frameWidth]);

  useEffect(() => {
    camera.add(sprite);
    return () => camera.remove(sprite);
  }, [camera, sprite]);

  useEffect(() => () => {
    material.dispose();
    texture.dispose();
  }, [material, texture]);

  useFrame(() => {
    const frame = subscribeReminderFrameAt(timeRef.current);
    sprite.visible = frame.visible && frame.opacity > 0;
    if (!sprite.visible) return;

    material.opacity = frame.opacity;
    const translateWorldY = (frame.translateY / frameHeight) * geometry.viewHeight;
    sprite.position.set(0, geometry.baseY - translateWorldY, -SPRITE_DEPTH);
    sprite.scale.set(
      geometry.spriteWidth * frame.scale,
      geometry.spriteHeight * frame.scale,
      1,
    );
  });

  return null;
}
