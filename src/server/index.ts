import { RESOURCE_NAME } from '@/shared/index';
import { InitializeDatabase, IsPoolReady } from './modules/db/pool';
import {
  Query,
  Execute,
  Single,
  Scalar,
  Exists,
  Insert,
  Update,
  Transaction,
  BatchInsert,
  RawQuery,
} from './modules/db/main';
import {
  TriggerClientCallback,
  RegisterServerCallback,
  UnregisterServerCallback,
  IsServerCallbackRegistered,
} from './lib/callback/main';

exports('Query', Query);
exports('Execute', Execute);
exports('Single', Single);
exports('Scalar', Scalar);
exports('Exists', Exists);
exports('Insert', Insert);
exports('Update', Update);
exports('Transaction', Transaction);
exports('BatchInsert', BatchInsert);
exports('RawQuery', RawQuery);
exports('IsPoolReady', IsPoolReady);

exports('TriggerClientCallback', TriggerClientCallback);
exports('RegisterServerCallback', RegisterServerCallback);
exports('UnregisterServerCallback', UnregisterServerCallback);
exports('IsServerCallbackRegistered', IsServerCallbackRegistered);

on('onServerResourceStart', async (resourceName: string) => {
  if (resourceName !== RESOURCE_NAME) return;

  try {
    await InitializeDatabase();
    console.log(`[${RESOURCE_NAME}] Database connected`);
  } catch (err) {
    console.error(`[${RESOURCE_NAME}] Database connection failed:`, err);
  }

  console.log(`[${RESOURCE_NAME}] Server started`);
});
