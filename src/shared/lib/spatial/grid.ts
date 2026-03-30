import { SpatialConfig } from '@/shared/config/spatial_config';
import type { GridEntry, GridOptions, GridQueryResult, SpatialGrid } from './types';
import type { Vector3 } from '@/shared/lib/math/types';

export function createSpatialGrid<T = unknown>(options?: GridOptions): SpatialGrid<T> {
  const cellSize = options?.cellSize ?? SpatialConfig.gridCellSize;
  const minX = options?.minX ?? SpatialConfig.mapMinX;
  const maxX = options?.maxX ?? SpatialConfig.mapMaxX;
  const minY = options?.minY ?? SpatialConfig.mapMinY;
  const maxY = options?.maxY ?? SpatialConfig.mapMaxY;

  const cells = new Map<number, Set<number>>();
  const entries = new Map<number, GridEntry<T>>();
  let nextId = 1;
  let generation = 0;

  let cacheGen = -1;
  let cacheKey = -1;
  let cacheRadius = -1;
  let cacheResults: GridQueryResult<T>[] = [];

  function coordToCell(x: number, y: number): [number, number] {
    const cx = Math.floor((Math.max(minX, Math.min(maxX, x)) - minX) / cellSize);
    const cy = Math.floor((Math.max(minY, Math.min(maxY, y)) - minY) / cellSize);
    return [cx, cy];
  }

  function packKey(cx: number, cy: number): number {
    return (cx << 16) | (cy & 0xffff);
  }

  function getCellRange(coords: Vector3, radius: number): [number, number, number, number] {
    const [x1, y1] = coordToCell(coords.x - radius, coords.y - radius);
    const [x2, y2] = coordToCell(coords.x + radius, coords.y + radius);
    return [x1, x2, y1, y2];
  }

  function insertIntoCells(entry: GridEntry<T>): void {
    const [x1, x2, y1, y2] = getCellRange(entry.coords, entry.radius);
    const cellKeys: number[] = [];

    for (let cy = y1; cy <= y2; cy++) {
      for (let cx = x1; cx <= x2; cx++) {
        const key = packKey(cx, cy);
        let cell = cells.get(key);
        if (!cell) {
          cell = new Set();
          cells.set(key, cell);
        }
        cell.add(entry.id);
        cellKeys.push(key);
      }
    }

    entry.cells = cellKeys;
  }

  function removeFromCells(entry: GridEntry<T>): void {
    for (const key of entry.cells) {
      const cell = cells.get(key);
      if (cell) {
        cell.delete(entry.id);
        if (cell.size === 0) cells.delete(key);
      }
    }
    entry.cells = [];
  }

  function matchesTags(entry: GridEntry<T>, tags?: string[], matchAll?: boolean): boolean {
    if (!tags || tags.length === 0) return true;

    if (matchAll) {
      for (const tag of tags) {
        if (!entry.tags.has(tag)) return false;
      }
      return true;
    }

    for (const tag of tags) {
      if (entry.tags.has(tag)) return true;
    }
    return false;
  }

  function distanceSq(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
  }

  return {
    add(coords, radius, data, tags) {
      const id = nextId++;
      const entry: GridEntry<T> = {
        id,
        coords,
        radius: Math.max(radius, 0),
        tags: new Set(tags),
        data,
        cells: [],
        removed: false,
      };

      entries.set(id, entry);
      insertIntoCells(entry);
      generation++;
      return id;
    },

    remove(id) {
      const entry = entries.get(id);
      if (!entry) return false;
      entry.removed = true;
      removeFromCells(entry);
      entries.delete(id);
      generation++;
      return true;
    },

    update(id, coords) {
      const entry = entries.get(id);
      if (!entry) return;
      removeFromCells(entry);
      entry.coords = coords;
      insertIntoCells(entry);
      generation++;
    },

    getNearby(coords, options) {
      const radius = options?.radius ?? SpatialConfig.defaultNearbyRadius;
      const currentKey = packKey(...coordToCell(coords.x, coords.y));

      if (cacheGen === generation && cacheKey === currentKey && cacheRadius === radius) {
        return cacheResults;
      }

      const [x1, x2, y1, y2] = getCellRange(coords, radius);
      const seen = new Set<number>();
      const results: GridQueryResult<T>[] = [];

      for (let cy = y1; cy <= y2; cy++) {
        for (let cx = x1; cx <= x2; cx++) {
          const cell = cells.get(packKey(cx, cy));
          if (!cell) continue;

          for (const entryId of cell) {
            if (seen.has(entryId)) continue;
            seen.add(entryId);

            const entry = entries.get(entryId);
            if (!entry || entry.removed) continue;

            if (!matchesTags(entry, options?.tags, options?.matchAllTags)) continue;

            if (options?.minZ !== undefined && entry.coords.z < options.minZ) continue;
            if (options?.maxZ !== undefined && entry.coords.z > options.maxZ) continue;

            const dSq = distanceSq(coords, entry.coords);
            const totalRadius = radius + entry.radius;
            if (dSq > totalRadius * totalRadius) continue;

            results.push({
              id: entry.id,
              coords: entry.coords,
              distance: Math.sqrt(dSq),
              data: entry.data,
              tags: entry.tags,
            });
          }
        }
      }

      results.sort((a, b) => a.distance - b.distance);

      if (options?.maxResults && results.length > options.maxResults) {
        results.length = options.maxResults;
      }

      cacheGen = generation;
      cacheKey = currentKey;
      cacheRadius = radius;
      cacheResults = results;

      return results;
    },

    getClosest(coords, options) {
      const results = this.getNearby(coords, { ...options, maxResults: 1 });
      return results[0] ?? null;
    },

    getCell(coords) {
      const [cx, cy] = coordToCell(coords.x, coords.y);
      const cell = cells.get(packKey(cx, cy));
      if (!cell) return [];
      const result: GridEntry<T>[] = [];
      for (const id of cell) {
        const entry = entries.get(id);
        if (entry && !entry.removed) result.push(entry);
      }
      return result;
    },

    getCellKey(coords) {
      const [cx, cy] = coordToCell(coords.x, coords.y);
      return packKey(cx, cy);
    },

    has(id) {
      return entries.has(id);
    },

    count() {
      return entries.size;
    },

    clear() {
      cells.clear();
      entries.clear();
      generation++;
    },
  };
}
