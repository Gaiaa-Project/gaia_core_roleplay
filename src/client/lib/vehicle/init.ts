import { waitFor } from '@/shared/lib/utils/wait';
import { Print } from '@/shared/lib/print/main';
import { setVehicleProperties } from './properties';
import type { PartialVehicleProperties } from './types';

const log = Print.create('Vehicle');

interface InitVehicleOptions {
  placeOnGround?: boolean;
  freezePosition?: boolean;
  props?: PartialVehicleProperties;
}

const STATE_KEY = 'gaia:initVehicle';

AddStateBagChangeHandler(STATE_KEY, '', async (bagName: string, _key: string, value: unknown) => {
  if (!value) return;

  const options = value as InitVehicleOptions;

  while (NetworkIsInTutorialSession()) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  let entity: number;

  try {
    entity = await waitFor(() => {
      const ent = GetEntityFromStateBagName(bagName);
      if (ent && ent > 0) return ent;
      return undefined;
    }, 10000);
  } catch {
    log.error(`failed to resolve entity from state bag '${bagName}'`);
    return;
  }

  try {
    await waitFor(() => {
      if (!IsEntityWaitingForWorldCollision(entity)) return true;
      return undefined;
    }, 5000);
  } catch {
    log.warn(`entity ${entity} still waiting for world collision, proceeding anyway`);
  }

  if (NetworkGetEntityIsNetworked(entity) && NetworkGetEntityOwner(entity) !== PlayerId()) return;

  if (options.placeOnGround !== false) {
    SetVehicleOnGroundProperly(entity);
  }

  if (options.freezePosition) {
    FreezeEntityPosition(entity, true);
  }

  if (options.props) {
    setVehicleProperties(entity, options.props);
  }

  setTimeout(() => {
    Entity(entity).state.set(STATE_KEY, null, true);
  }, 200);
});
