import type { Vector2, Vector3, RGBA } from '@/shared/lib/math/types';
import type { ActiveZone, ZoneOptions } from '@/shared/lib/spatial/types';
import type { ZoneProximityCallbacks } from './types';
import {
  addSphereZone as sharedAddSphere,
  addBoxZone as sharedAddBox,
  addPolyZone as sharedAddPoly,
  removeZone as sharedRemoveZone,
  getZoneGrid,
  getZoneInternal,
} from '@/shared/lib/spatial/zones';
import { containsZone } from '@/shared/lib/spatial/geometry';
import { SpatialConfig } from '@/shared/config/spatial_config';
import { registerTick, unregisterTick } from './tick';
import { enableDebug, disableDebug } from './debug';

interface ZoneProximityState {
  callbacks: ZoneProximityCallbacks;
  inside: boolean;
  distance: number;
}

const proximityStates = new Map<number, ZoneProximityState>();
const insideZones = new Set<number>();
let checkHandle: ReturnType<typeof setInterval> | null = null;
let hasInsideTick = false;

function toVec3(arr: number[]): Vector3 {
  return { x: arr[0] ?? 0, y: arr[1] ?? 0, z: arr[2] ?? 0 };
}

function wrapWithCallbacks<T>(
  zone: ActiveZone<T>,
  callbacks?: ZoneProximityCallbacks,
): ActiveZone<T> {
  if (callbacks) {
    proximityStates.set(zone.id, {
      callbacks,
      inside: false,
      distance: Infinity,
    });
  }

  const internal = getZoneInternal(zone.id);
  if (internal && internal.debug) {
    enableDebug(zone.id, internal.shape, internal.debugColor);
  }

  const originalRemove = zone.remove.bind(zone);
  const wrapped: ActiveZone<T> = {
    ...zone,
    remove() {
      proximityStates.delete(zone.id);
      insideZones.delete(zone.id);
      disableDebug(zone.id);
      originalRemove();
      checkLifecycle();
    },
    setDebug(enabled: boolean, color?: RGBA) {
      zone.setDebug(enabled, color);
      const int = getZoneInternal(zone.id);
      if (enabled && int) {
        enableDebug(zone.id, int.shape, int.debugColor);
      } else {
        disableDebug(zone.id);
      }
    },
  };

  if (proximityStates.size === 1 && callbacks) startCheckLoop();

  return wrapped;
}

function insideTick(): void {
  for (const id of insideZones) {
    const state = proximityStates.get(id);
    if (!state) continue;

    const internal = getZoneInternal(id);
    if (!internal || internal.removed) continue;

    if (state.callbacks.onInside) {
      const zone: ActiveZone = {
        id: internal.id,
        shape: internal.shape,
        data: internal.data,
        tags: internal.tags,
        contains: (c: Vector3) => containsZone(internal.shape, c),
        remove() {},
        setDebug() {},
      };
      state.callbacks.onInside(zone);
    }
  }
}

function coarseCheck(): void {
  const playerCoords = toVec3(GetEntityCoords(PlayerPedId(), false));
  const nearby = getZoneGrid().getNearby(playerCoords, {
    radius: SpatialConfig.defaultNearbyRadius,
  });

  const newInside = new Set<number>();

  for (const entry of nearby) {
    const zoneId = entry.data;
    const state = proximityStates.get(zoneId);
    if (!state) continue;

    const internal = getZoneInternal(zoneId);
    if (!internal || internal.removed) continue;

    state.distance = entry.distance;

    if (containsZone(internal.shape, playerCoords)) {
      newInside.add(zoneId);

      if (!state.inside) {
        state.inside = true;

        if (state.callbacks.onEnter) {
          const zone: ActiveZone = {
            id: internal.id,
            shape: internal.shape,
            data: internal.data,
            tags: internal.tags,
            contains: (c: Vector3) => containsZone(internal.shape, c),
            remove() {},
            setDebug() {},
          };
          state.callbacks.onEnter(zone);
        }
      }
    }
  }

  for (const id of insideZones) {
    if (!newInside.has(id)) {
      const state = proximityStates.get(id);
      if (state) {
        state.inside = false;

        if (state.callbacks.onExit) {
          const internal = getZoneInternal(id);
          if (internal && !internal.removed) {
            const zone: ActiveZone = {
              id: internal.id,
              shape: internal.shape,
              data: internal.data,
              tags: internal.tags,
              contains: (c: Vector3) => containsZone(internal.shape, c),
              remove() {},
              setDebug() {},
            };
            state.callbacks.onExit(zone);
          }
        }
      }
    }
  }

  insideZones.clear();
  for (const id of newInside) insideZones.add(id);

  const hasInside =
    insideZones.size > 0 &&
    [...insideZones].some((id) => proximityStates.get(id)?.callbacks.onInside);

  if (hasInside && !hasInsideTick) {
    registerTick('zones:inside', insideTick);
    hasInsideTick = true;
  } else if (!hasInside && hasInsideTick) {
    unregisterTick('zones:inside');
    hasInsideTick = false;
  }
}

function startCheckLoop(): void {
  if (checkHandle !== null) return;
  coarseCheck();
  checkHandle = setInterval(coarseCheck, SpatialConfig.zoneCheckInterval);
}

function stopCheckLoop(): void {
  if (checkHandle === null) return;
  clearInterval(checkHandle);
  checkHandle = null;
  if (hasInsideTick) {
    unregisterTick('zones:inside');
    hasInsideTick = false;
  }
}

function checkLifecycle(): void {
  if (proximityStates.size === 0) stopCheckLoop();
}

export function addClientSphereZone<T = unknown>(
  coords: Vector3,
  radius: number,
  callbacks?: ZoneProximityCallbacks,
  options?: ZoneOptions<T>,
): ActiveZone<T> {
  return wrapWithCallbacks(sharedAddSphere(coords, radius, options), callbacks);
}

export function addClientBoxZone<T = unknown>(
  coords: Vector3,
  size: Vector3,
  heading: number,
  callbacks?: ZoneProximityCallbacks,
  options?: ZoneOptions<T>,
): ActiveZone<T> {
  return wrapWithCallbacks(sharedAddBox(coords, size, heading, options), callbacks);
}

export function addClientPolyZone<T = unknown>(
  points: Vector2[],
  minZ: number,
  maxZ: number,
  callbacks?: ZoneProximityCallbacks,
  options?: ZoneOptions<T>,
): ActiveZone<T> {
  return wrapWithCallbacks(sharedAddPoly(points, minZ, maxZ, options), callbacks);
}

export function removeClientZone(id: number): boolean {
  proximityStates.delete(id);
  insideZones.delete(id);
  disableDebug(id);
  const result = sharedRemoveZone(id);
  checkLifecycle();
  return result;
}

export function isInsideZone(id: number): boolean {
  return insideZones.has(id);
}

export function getCurrentZones(): number[] {
  return [...insideZones];
}
