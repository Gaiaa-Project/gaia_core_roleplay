export interface DependencyResult {
  ok: boolean;
  resource: string;
  requiredVersion: string;
  currentVersion: string;
  message: string;
}
