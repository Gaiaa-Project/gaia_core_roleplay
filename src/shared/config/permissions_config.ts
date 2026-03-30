import type { PermissionSeedConfig } from '@/server/modules/permissions/types';

export const permissionSeedConfig: PermissionSeedConfig = {
  roles: [
    {
      name: 'user',
      label: 'User',
      isPrimary: true,
      permissions: [],
    },
    {
      name: 'moderator',
      label: 'Moderator',
      isPrimary: true,
      inheritsFrom: 'user',
      permissions: [
        'mod.kick',
        'mod.warn',
        'mod.spectate',
        'mod.teleport',
        'mod.freeze',
        'mod.noclip',
      ],
    },
    {
      name: 'dev',
      label: 'Developer',
      isPrimary: true,
      inheritsFrom: 'moderator',
      permissions: ['dev.*'],
    },
    {
      name: 'admin',
      label: 'Administrator',
      isPrimary: true,
      inheritsFrom: 'dev',
      permissions: ['admin.*'],
    },
    {
      name: 'owner',
      label: 'Owner',
      isPrimary: true,
      inheritsFrom: 'admin',
      permissions: ['*'],
    },
    {
      name: 'event_manager',
      label: 'Event Manager',
      isPrimary: false,
      permissions: ['event.create', 'event.manage', 'event.delete', 'event.reward'],
    },
    {
      name: 'support',
      label: 'Support',
      isPrimary: false,
      permissions: ['support.ticket', 'support.reply', 'support.close'],
    },
    {
      name: 'recruiter',
      label: 'Recruiter',
      isPrimary: false,
      permissions: ['recruit.invite', 'recruit.review'],
    },
  ],
};
