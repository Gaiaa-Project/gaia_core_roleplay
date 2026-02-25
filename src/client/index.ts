import { RESOURCE_NAME } from '@/shared/index';
import {
  TriggerServerCallback,
  RegisterClientCallback,
  UnregisterClientCallback,
  IsClientCallbackRegistered,
} from './lib/callback/main';
import { wait, waitUntil, waitForPlayer, waitForModel, waitForAnimDict } from './lib/utils/wait';

exports('TriggerServerCallback', TriggerServerCallback);
exports('RegisterClientCallback', RegisterClientCallback);
exports('UnregisterClientCallback', UnregisterClientCallback);
exports('IsClientCallbackRegistered', IsClientCallbackRegistered);

exports('wait', wait);
exports('waitUntil', waitUntil);
exports('waitForPlayer', waitForPlayer);
exports('waitForModel', waitForModel);
exports('waitForAnimDict', waitForAnimDict);

on('onClientResourceStart', (resourceName: string) => {
  if (resourceName !== RESOURCE_NAME) return;
  console.log(`[${RESOURCE_NAME}] Client started`);
});
