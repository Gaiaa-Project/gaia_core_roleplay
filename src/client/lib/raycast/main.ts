import type { Vector3 } from '@/shared/lib/math/types';
import type { RaycastResult, RaycastOptions } from './types';

function toVec3(arr: number[]): Vector3 {
  return { x: arr[0] ?? 0, y: arr[1] ?? 0, z: arr[2] ?? 0 };
}

function resolveShapeTest(handle: number): Promise<RaycastResult> {
  return new Promise((resolve) => {
    const check = () => {
      const [retval, hit, endCoords, surfaceNormal, materialHash, entityHit] =
        GetShapeTestResultIncludingMaterial(handle);

      if (retval !== 1) {
        resolve({
          hit: !!hit,
          entityHit,
          endCoords: toVec3(endCoords),
          surfaceNormal: toVec3(surfaceNormal),
          materialHash,
        });
        return;
      }

      setTimeout(check, 0);
    };
    check();
  });
}

export function raycastFromCoords(
  origin: Vector3,
  destination: Vector3,
  options?: RaycastOptions,
): Promise<RaycastResult> {
  const handle = StartShapeTestLosProbe(
    origin.x,
    origin.y,
    origin.z,
    destination.x,
    destination.y,
    destination.z,
    options?.flags ?? 511,
    options?.ignoreEntity ?? PlayerPedId(),
    options?.ignoreFlags ?? 4,
  );

  return resolveShapeTest(handle);
}

function getCameraForwardVector(): Vector3 {
  const rot = GetFinalRenderedCamRot(2);
  const radX = ((rot[0] ?? 0) * Math.PI) / 180;
  const radZ = ((rot[2] ?? 0) * Math.PI) / 180;

  return {
    x: -Math.sin(radZ) * Math.abs(Math.cos(radX)),
    y: Math.cos(radZ) * Math.abs(Math.cos(radX)),
    z: Math.sin(radX),
  };
}

export function raycastFromCamera(
  distance?: number,
  options?: RaycastOptions,
): Promise<RaycastResult> {
  const origin = toVec3(GetFinalRenderedCamCoord());
  const forward = getCameraForwardVector();
  const dist = distance ?? 10;

  const destination: Vector3 = {
    x: origin.x + forward.x * dist,
    y: origin.y + forward.y * dist,
    z: origin.z + forward.z * dist,
  };

  return raycastFromCoords(origin, destination, options);
}

export function raycastFromEntity(
  entity: number,
  distance?: number,
  options?: RaycastOptions,
): Promise<RaycastResult> {
  const origin = toVec3(GetEntityCoords(entity, true));
  const forward = GetEntityForwardVector(entity);
  const dist = distance ?? 10;

  const destination: Vector3 = {
    x: origin.x + (forward[0] ?? 0) * dist,
    y: origin.y + (forward[1] ?? 0) * dist,
    z: origin.z + (forward[2] ?? 0) * dist,
  };

  return raycastFromCoords(origin, destination, {
    ...options,
    ignoreEntity: options?.ignoreEntity ?? entity,
  });
}
