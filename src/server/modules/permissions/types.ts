export interface Role {
  id: number;
  name: string;
  label: string;
  is_primary: boolean;
  inherits_from: number | null;
  created_at: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string | null;
}

export interface CharacterRole {
  character_id: number;
  role_id: number;
  assigned_at: string;
  expires_at: string | null;
}

export interface SeedRole {
  name: string;
  label: string;
  isPrimary: boolean;
  inheritsFrom?: string;
  permissions: string[];
}

export interface PermissionSeedConfig {
  roles: SeedRole[];
}

export interface AssignRoleOptions {
  expiresIn?: number;
}
