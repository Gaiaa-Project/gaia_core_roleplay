import {
  lerp,
  lerpVec2,
  lerpVec3,
  lerpVec4,
  lerpObject,
  getValueAt,
  createInterpolator,
} from './lib/math/interpolation';
import { formatNumber, formatCurrency, formatWithSeparator } from './lib/math/format';
import {
  createSeed,
  randomInt,
  randomFloat,
  randomBool,
  randomChoice,
  randomChoices,
  randomWeighted,
  shuffleArray,
  randomPointInCircle,
  randomPointOnCircleEdge,
  randomUUIDv4,
  randomUUIDv5,
  randomUUIDv6,
  randomUUIDv7,
  randomAlphanumeric,
  randomAlphabetic,
  randomNumeric,
  randomHex,
  randomRGB,
  randomRGBA,
  randomPercentage,
  randomAngle,
  randomRadianAngle,
  randomSign,
  randomPattern,
} from './lib/math/random';
import { round } from './lib/math/round';
import { getRelativeCoords, getRelativeCoords3D } from './lib/math/coords';
import {
  vec2ToScalars,
  vec3ToScalars,
  vec4ToScalars,
  rgbToScalars,
  rgbaToScalars,
  vec3ToVec2Scalars,
  vec4ToVec3Scalars,
  vec4ToVec2Scalars,
} from './lib/math/toScalars';
import {
  toVec2,
  toVec3,
  toVec4,
  arrayToVec2,
  arrayToVec3,
  arrayToVec4,
  vec2ToVec3,
  vec2ToVec4,
  vec3ToVec2,
  vec3ToVec4,
  vec4ToVec3,
  vec4ToVec2,
} from './lib/math/toVector';
import { Print } from './lib/print/main';
import { wait, waitFor } from './lib/utils/wait';
import {
  tableContains,
  tableMatches,
  tableDeepClone,
  tableMerge,
  tableFreeze,
  tableIsFrozen,
  tableMap,
  tableFilter,
  tableFind,
  tableKeys,
  tableValues,
  tableSize,
} from './lib/table/main';
import { createTimer, getTimer, getAllTimers } from './lib/timer/main';
import { getClosestObject, getNearbyObjects } from './lib/object/main';
import { getClosestPed, getNearbyPeds } from './lib/ped/main';
import { getClosestVehicle, getNearbyVehicles } from './lib/vehicle/main';
import { checkDependency } from './lib/version/main';
import { createSpatialGrid } from './lib/spatial/grid';
import {
  containsZone,
  createSphereShape,
  createBoxShape,
  createPolyShape,
} from './lib/spatial/geometry';
import {
  addSphereZone,
  addBoxZone,
  addPolyZone,
  removeZone,
  getZoneById,
  getZonesAtCoords,
  getAllZones,
} from './lib/spatial/zones';

export const RESOURCE_NAME = GetCurrentResourceName();

exports('lerp', lerp);
exports('lerpVec2', lerpVec2);
exports('lerpVec3', lerpVec3);
exports('lerpVec4', lerpVec4);
exports('lerpObject', lerpObject);
exports('getValueAt', getValueAt);
exports('createInterpolator', createInterpolator);

exports('formatNumber', formatNumber);
exports('formatCurrency', formatCurrency);
exports('formatWithSeparator', formatWithSeparator);

exports('createSeed', createSeed);
exports('randomInt', randomInt);
exports('randomFloat', randomFloat);
exports('randomBool', randomBool);
exports('randomChoice', randomChoice);
exports('randomChoices', randomChoices);
exports('randomWeighted', randomWeighted);
exports('shuffleArray', shuffleArray);
exports('randomPointInCircle', randomPointInCircle);
exports('randomPointOnCircleEdge', randomPointOnCircleEdge);
exports('randomUUIDv4', randomUUIDv4);
exports('randomUUIDv5', randomUUIDv5);
exports('randomUUIDv6', randomUUIDv6);
exports('randomUUIDv7', randomUUIDv7);
exports('randomAlphanumeric', randomAlphanumeric);
exports('randomAlphabetic', randomAlphabetic);
exports('randomNumeric', randomNumeric);
exports('randomHex', randomHex);
exports('randomRGB', randomRGB);
exports('randomRGBA', randomRGBA);
exports('randomPercentage', randomPercentage);
exports('randomAngle', randomAngle);
exports('randomRadianAngle', randomRadianAngle);
exports('randomSign', randomSign);
exports('randomPattern', randomPattern);

exports('round', round);

exports('getRelativeCoords', getRelativeCoords);
exports('getRelativeCoords3D', getRelativeCoords3D);

exports('vec2ToScalars', vec2ToScalars);
exports('vec3ToScalars', vec3ToScalars);
exports('vec4ToScalars', vec4ToScalars);
exports('rgbToScalars', rgbToScalars);
exports('rgbaToScalars', rgbaToScalars);
exports('vec3ToVec2Scalars', vec3ToVec2Scalars);
exports('vec4ToVec3Scalars', vec4ToVec3Scalars);
exports('vec4ToVec2Scalars', vec4ToVec2Scalars);

exports('toVec2', toVec2);
exports('toVec3', toVec3);
exports('toVec4', toVec4);
exports('arrayToVec2', arrayToVec2);
exports('arrayToVec3', arrayToVec3);
exports('arrayToVec4', arrayToVec4);
exports('vec2ToVec3', vec2ToVec3);
exports('vec2ToVec4', vec2ToVec4);
exports('vec3ToVec2', vec3ToVec2);
exports('vec3ToVec4', vec3ToVec4);
exports('vec4ToVec3', vec4ToVec3);
exports('vec4ToVec2', vec4ToVec2);

exports('wait', wait);
exports('waitFor', waitFor);

exports('createTimer', createTimer);
exports('getTimer', getTimer);
exports('getAllTimers', getAllTimers);

exports('tableContains', tableContains);
exports('tableMatches', tableMatches);
exports('tableDeepClone', tableDeepClone);
exports('tableMerge', tableMerge);
exports('tableFreeze', tableFreeze);
exports('tableIsFrozen', tableIsFrozen);
exports('tableMap', tableMap);
exports('tableFilter', tableFilter);
exports('tableFind', tableFind);
exports('tableKeys', tableKeys);
exports('tableValues', tableValues);
exports('tableSize', tableSize);

exports('checkDependency', checkDependency);

exports('createSpatialGrid', createSpatialGrid);
exports('containsZone', containsZone);
exports('createSphereShape', createSphereShape);
exports('createBoxShape', createBoxShape);
exports('createPolyShape', createPolyShape);
exports('addSphereZone', addSphereZone);
exports('addBoxZone', addBoxZone);
exports('addPolyZone', addPolyZone);
exports('removeZone', removeZone);
exports('getZoneById', getZoneById);
exports('getZonesAtCoords', getZonesAtCoords);
exports('getAllZones', getAllZones);

exports('getClosestObject', getClosestObject);
exports('getNearbyObjects', getNearbyObjects);

exports('getClosestPed', getClosestPed);
exports('getNearbyPeds', getNearbyPeds);

exports('getClosestVehicle', getClosestVehicle);
exports('getNearbyVehicles', getNearbyVehicles);

exports('CreatePrint', Print.create);
exports('PrintSuccess', Print.success);
exports('PrintInfo', Print.info);
exports('PrintWarn', Print.warn);
exports('PrintError', Print.error);
exports('PrintDebug', Print.debug);
