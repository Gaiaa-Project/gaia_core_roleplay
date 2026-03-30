import type { PartialVehicleProperties } from '@/client/lib/vehicle/types';

export interface InitVehicleOptions {
  placeOnGround?: boolean;
  freezePosition?: boolean;
  props?: PartialVehicleProperties;
}

const STATE_KEY = 'gaia:initVehicle';

export function initVehicle(networkId: number, options?: InitVehicleOptions): void {
  const entity = NetworkGetEntityFromNetworkId(networkId);
  if (!entity || !DoesEntityExist(entity)) return;

  Entity(entity).state.set(STATE_KEY, options ?? {}, true);
}
