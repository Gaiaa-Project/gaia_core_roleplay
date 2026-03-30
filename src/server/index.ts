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
import { GetIdentifiers } from './lib/player/identifiers';
import {
  getClosestPlayer as getClosestPlayerServer,
  getNearbyPlayers as getNearbyPlayersServer,
} from './lib/player/closest';
import { createCron, removeCron } from './lib/cron/main';
import { versionCheck } from './lib/version/main';
import { initVehicle } from './lib/vehicle/init';
import {
  InitPermissions,
  hasPermission,
  canModify,
  getCharacterRoles,
  getCharacterPermissions,
  getPrimaryRole,
  assignRole,
  revokeRole,
  createRole,
  deleteRole,
  addPermissionToRole,
  removePermissionFromRole,
  getAllRoles,
  getAllPermissions,
  getRolePermissions,
  getStaffOnline,
} from './modules/permissions/main';
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

exports('GetIdentifiers', GetIdentifiers);
exports('getClosestPlayer', getClosestPlayerServer);
exports('getNearbyPlayers', getNearbyPlayersServer);

exports('createCron', createCron);
exports('removeCron', removeCron);

exports('versionCheck', versionCheck);
exports('initVehicle', initVehicle);

exports('hasPermission', hasPermission);
exports('canModify', canModify);
exports('getCharacterRoles', getCharacterRoles);
exports('getCharacterPermissions', getCharacterPermissions);
exports('getPrimaryRole', getPrimaryRole);
exports('assignRole', assignRole);
exports('revokeRole', revokeRole);
exports('createRole', createRole);
exports('deleteRole', deleteRole);
exports('addPermissionToRole', addPermissionToRole);
exports('removePermissionFromRole', removePermissionFromRole);
exports('getAllRoles', getAllRoles);
exports('getAllPermissions', getAllPermissions);
exports('getRolePermissions', getRolePermissions);
exports('getStaffOnline', getStaffOnline);

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

  try {
    await InitPermissions();
  } catch {
    log.error('Permission system failed to initialize');
  }

  log.success('Server started');
});
