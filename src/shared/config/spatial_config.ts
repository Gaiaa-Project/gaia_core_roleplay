export const SpatialConfig = {
  // GTA V map boundaries (world coordinates)
  // These define the playable area used by the spatial grid
  mapMinX: -3700,
  mapMaxX: 4500,
  mapMinY: -4400,
  mapMaxY: 8000,

  // Size of each grid cell in world units (~meters)
  // Smaller = more precise but more cells to manage
  // Larger = fewer cells but more entries per cell to iterate
  // 100 is a good balance for GTA V (yields ~82x124 grid = ~10K cells)
  gridCellSize: 100,

  // How often (ms) the Points system checks player proximity
  // Lower = more responsive enter/exit detection, higher CPU
  // 500ms is a good default — a player running at max speed covers ~7m per check
  pointCheckInterval: 500,

  // How often (ms) the Zones system checks player proximity
  // Lower = more responsive, higher CPU
  // 300ms is slightly faster than points because zone containment is more critical
  zoneCheckInterval: 300,

  // Default radius (world units) for getNearby queries
  // Entries within this distance are considered "nearby"
  // Also controls the coarse check range for Points and Zones
  defaultNearbyRadius: 150,
} as const;
