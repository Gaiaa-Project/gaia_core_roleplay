import { RESOURCE_NAME } from '@/shared/index';
import { Print } from '@/shared/lib/print/main';
import {
  TriggerServerCallback,
  RegisterClientCallback,
  UnregisterClientCallback,
  IsClientCallbackRegistered,
} from './lib/callback/main';
import { waitUntil, waitForPlayer } from './lib/utils/wait';
import {
  requestModel,
  requestAnimDict,
  requestAnimSet,
  requestPtfxAsset,
  requestTextureDict,
  requestWeaponAsset,
  requestScaleformMovie,
} from './lib/streaming/request';
import { raycastFromCoords, raycastFromCamera, raycastFromEntity } from './lib/raycast/main';
import { addKeybind, removeKeybind, enableKeybind, isKeybindPressed } from './lib/keybind/main';
import {
  getClosestPlayer as getClosestPlayerClient,
  getNearbyPlayers as getNearbyPlayersClient,
} from './lib/player/main';
import {
  addDisabledControl,
  removeDisabledControl,
  clearDisabledControl,
  clearAllDisabledControls,
  suppressDisabledControl,
  unsuppressDisabledControl,
  hasDisabledControl,
  isDisabledControlSuppressed,
  getDisabledControlCallers,
  getAllDisabledControls,
  tickDisabledControls,
} from './lib/controls/main';
import {
  addPoint,
  removePoint,
  getClosestPoint,
  getPointsInside,
  getPointsNearby,
} from './lib/spatial/points';
import {
  addClientSphereZone,
  addClientBoxZone,
  addClientPolyZone,
  removeClientZone,
  isInsideZone,
  getCurrentZones,
} from './lib/spatial/zones';
import { getVehicleProperties, setVehicleProperties } from './lib/vehicle/properties';
import './lib/vehicle/init';
import './modules/world_adjustments';
import './modules/temp_spawn';

exports('TriggerServerCallback', TriggerServerCallback);
exports('RegisterClientCallback', RegisterClientCallback);
exports('UnregisterClientCallback', UnregisterClientCallback);
exports('IsClientCallbackRegistered', IsClientCallbackRegistered);

exports('waitUntil', waitUntil);
exports('waitForPlayer', waitForPlayer);

exports('requestModel', requestModel);
exports('requestAnimDict', requestAnimDict);
exports('requestAnimSet', requestAnimSet);
exports('requestPtfxAsset', requestPtfxAsset);
exports('requestTextureDict', requestTextureDict);
exports('requestWeaponAsset', requestWeaponAsset);
exports('requestScaleformMovie', requestScaleformMovie);

exports('raycastFromCoords', raycastFromCoords);
exports('raycastFromCamera', raycastFromCamera);
exports('raycastFromEntity', raycastFromEntity);

exports('getClosestPlayer', getClosestPlayerClient);
exports('getNearbyPlayers', getNearbyPlayersClient);

exports('addKeybind', addKeybind);
exports('removeKeybind', removeKeybind);
exports('enableKeybind', enableKeybind);
exports('isKeybindPressed', isKeybindPressed);

exports('addDisabledControl', addDisabledControl);
exports('removeDisabledControl', removeDisabledControl);
exports('clearDisabledControl', clearDisabledControl);
exports('clearAllDisabledControls', clearAllDisabledControls);
exports('suppressDisabledControl', suppressDisabledControl);
exports('unsuppressDisabledControl', unsuppressDisabledControl);
exports('hasDisabledControl', hasDisabledControl);
exports('isDisabledControlSuppressed', isDisabledControlSuppressed);
exports('getDisabledControlCallers', getDisabledControlCallers);
exports('getAllDisabledControls', getAllDisabledControls);
exports('tickDisabledControls', tickDisabledControls);

exports('addPoint', addPoint);
exports('removePoint', removePoint);
exports('getClosestPoint', getClosestPoint);
exports('getPointsInside', getPointsInside);
exports('getPointsNearby', getPointsNearby);

exports('addClientSphereZone', addClientSphereZone);
exports('addClientBoxZone', addClientBoxZone);
exports('addClientPolyZone', addClientPolyZone);
exports('removeClientZone', removeClientZone);
exports('isInsideZone', isInsideZone);
exports('getCurrentZones', getCurrentZones);

exports('getVehicleProperties', getVehicleProperties);
exports('setVehicleProperties', setVehicleProperties);

const log = Print.create('Core');

on('onClientResourceStart', (resourceName: string) => {
  if (resourceName !== RESOURCE_NAME) return;
  log.success('Client started');
});
