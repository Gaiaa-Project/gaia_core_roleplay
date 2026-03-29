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

exports('addKeybind', addKeybind);
exports('removeKeybind', removeKeybind);
exports('enableKeybind', enableKeybind);
exports('isKeybindPressed', isKeybindPressed);

const log = Print.create('Core');

on('onClientResourceStart', (resourceName: string) => {
  if (resourceName !== RESOURCE_NAME) return;
  log.success('Client started');
});
