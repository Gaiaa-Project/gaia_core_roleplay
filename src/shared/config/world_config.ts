export const WorldConfig = {
  disableWantedLevel: true,
  disableHealthRegeneration: true,
  disableAimAssist: true,
  disableDispatchServices: true,
  disableNPCDrops: true,
  disableSeatShuffle: true,
  disableVehicleRewards: true,
  disableDisplayAmmo: true,
  disableIdleCamera: true,
  disableRadioOnEnter: true,

  enablePvP: true,

  removeHudComponents: [
    false, // 1 - WANTED_STARS
    false, // 2 - WEAPON_ICON
    false, // 3 - CASH
    false, // 4 - MP_CASH
    false, // 5 - MP_MESSAGE
    false, // 6 - VEHICLE_NAME
    false, // 7 - AREA_NAME
    false, // 8 - UNUSED
    false, // 9 - STREET_NAME
    false, // 10 - HELP_TEXT
    false, // 11 - FLOATING_HELP_TEXT_1
    false, // 12 - FLOATING_HELP_TEXT_2
    false, // 13 - CASH_CHANGE
    false, // 14 - RETICLE
    false, // 15 - SUBTITLE_TEXT
    false, // 16 - RADIO_STATIONS
    false, // 17 - SAVING_GAME
    false, // 18 - GAME_STREAM
    false, // 19 - WEAPON_WHEEL
    false, // 20 - WEAPON_WHEEL_STATS
    false, // 21 - HUD_COMPONENTS
    false, // 22 - HUD_WEAPONS
  ] as boolean[],

  disableScenarios: true,
  scenarios: [
    'WORLD_VEHICLE_ATTRACTOR',
    'WORLD_VEHICLE_AMBULANCE',
    'WORLD_VEHICLE_BICYCLE_BMX',
    'WORLD_VEHICLE_BICYCLE_BMX_BALLAS',
    'WORLD_VEHICLE_BICYCLE_BMX_FAMILY',
    'WORLD_VEHICLE_BICYCLE_BMX_HARMONY',
    'WORLD_VEHICLE_BICYCLE_BMX_VAGOS',
    'WORLD_VEHICLE_BICYCLE_MOUNTAIN',
    'WORLD_VEHICLE_BICYCLE_ROAD',
    'WORLD_VEHICLE_BIKE_OFF_ROAD_RACE',
    'WORLD_VEHICLE_BIKER',
    'WORLD_VEHICLE_BOAT_IDLE',
    'WORLD_VEHICLE_BOAT_IDLE_ALAMO',
    'WORLD_VEHICLE_BOAT_IDLE_MARQUIS',
    'WORLD_VEHICLE_BROKEN_DOWN',
    'WORLD_VEHICLE_BUSINESSMEN',
    'WORLD_VEHICLE_HELI_LIFEGUARD',
    'WORLD_VEHICLE_CLUCKIN_BELL_TRAILER',
    'WORLD_VEHICLE_CONSTRUCTION_SOLO',
    'WORLD_VEHICLE_CONSTRUCTION_PASSENGERS',
    'WORLD_VEHICLE_DRIVE_PASSENGERS',
    'WORLD_VEHICLE_DRIVE_PASSENGERS_LIMITED',
    'WORLD_VEHICLE_DRIVE_SOLO',
    'WORLD_VEHICLE_FIRE_TRUCK',
    'WORLD_VEHICLE_EMPTY',
    'WORLD_VEHICLE_MARIACHI',
    'WORLD_VEHICLE_MECHANIC',
    'WORLD_VEHICLE_MILITARY_PLANES_BIG',
    'WORLD_VEHICLE_MILITARY_PLANES_SMALL',
    'WORLD_VEHICLE_PARK_PARALLEL',
    'WORLD_VEHICLE_PARK_PERPENDICULAR_NOSE_IN',
    'WORLD_VEHICLE_PASSENGER_EXIT',
    'WORLD_VEHICLE_POLICE_BIKE',
    'WORLD_VEHICLE_POLICE_CAR',
    'WORLD_VEHICLE_POLICE',
    'WORLD_VEHICLE_POLICE_NEXT_TO_CAR',
    'WORLD_VEHICLE_QUARRY',
    'WORLD_VEHICLE_SALTON',
    'WORLD_VEHICLE_SALTON_DIRT_BIKE',
    'WORLD_VEHICLE_SECURITY_CAR',
    'WORLD_VEHICLE_STREETRACE',
    'WORLD_VEHICLE_TOURBUS',
    'WORLD_VEHICLE_TOURIST',
    'WORLD_VEHICLE_TANDL',
    'WORLD_VEHICLE_TRACTOR',
    'WORLD_VEHICLE_TRACTOR_BEACH',
    'WORLD_VEHICLE_TRUCK_LOGS',
    'WORLD_VEHICLE_TRUCKS_TRAILERS',
    'WORLD_VEHICLE_DISTANT_EMPTY_GROUND',
    'WORLD_HUMAN_PAPARAZZI',
  ] as string[],

  density: {
    pedDensity: 0.8,
    scenarioPedDensityInterior: 0.5,
    scenarioPedDensityExterior: 0.5,
    ambientVehicleRange: 0.8,
    parkedVehicleDensity: 0.8,
    randomVehicleDensity: 0.8,
    vehicleDensity: 0.8,
  },

  customAIPlates: '........',

  discord: {
    enabled: false,
    appId: '',
    presence: 'Playing on {server_name}',
    assetName: '',
    assetText: '{server_name}',
    buttons: [] as { label: string; url: string }[],
    refreshInterval: 60000,
  },
};
