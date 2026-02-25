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
import { RunMigration } from './modules/migration/main';
import { Print } from '@/shared/lib/print/main';

const log = Print.create('Core');

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

exports('CreatePrint', Print.create);
exports('PrintSuccess', Print.success);
exports('PrintInfo', Print.info);
exports('PrintWarn', Print.warn);
exports('PrintError', Print.error);
exports('PrintDebug', Print.debug);

on('onServerResourceStart', async (resourceName: string) => {
  if (resourceName !== RESOURCE_NAME) return;

  try {
    await InitializeDatabase();
  } catch {
    return;
  }

  try {
    await RunMigration();
  } catch {
    log.error('Migration failed');
  }

  log.success('Server started');
});
