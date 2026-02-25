import { RESOURCE_NAME } from '@/shared/index';
import { Print } from '@/shared/lib/print/main';
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

exports('CreatePrint', Print.create);
exports('PrintSuccess', Print.success);
exports('PrintInfo', Print.info);
exports('PrintWarn', Print.warn);
exports('PrintError', Print.error);
exports('PrintDebug', Print.debug);

const log = Print.create('Core');

on('onClientResourceStart', (resourceName: string) => {
  if (resourceName !== RESOURCE_NAME) return;
  log.success('Client started');
});
