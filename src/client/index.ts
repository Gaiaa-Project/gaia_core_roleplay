import { RESOURCE_NAME } from '@/shared/index';
import {
  TriggerServerCallback,
  RegisterClientCallback,
  UnregisterClientCallback,
  IsClientCallbackRegistered,
} from './lib/callback/main';

exports('TriggerServerCallback', TriggerServerCallback);
exports('RegisterClientCallback', RegisterClientCallback);
exports('UnregisterClientCallback', UnregisterClientCallback);
exports('IsClientCallbackRegistered', IsClientCallbackRegistered);

on('onClientResourceStart', (resourceName: string) => {
  if (resourceName !== RESOURCE_NAME) return;
  console.log(`[${RESOURCE_NAME}] Client started`);
});
