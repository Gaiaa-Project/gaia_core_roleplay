import { waitFor } from '@/shared/lib/utils/wait';

async function streamingRequest<T extends string | number>(
  request: () => void,
  hasLoaded: () => boolean,
  assetType: string,
  asset: T,
  timeout?: number,
): Promise<T> {
  if (hasLoaded()) return asset;

  request();

  try {
    return await waitFor(() => (hasLoaded() ? asset : undefined), timeout ?? 10000);
  } catch {
    throw new Error(`failed to load ${assetType} '${asset}'`);
  }
}

export function requestModel(model: string | number, timeout?: number): Promise<number> {
  const hash = typeof model === 'string' ? GetHashKey(model) : model;

  if (!IsModelValid(hash) && !IsModelInCdimage(hash)) {
    throw new Error(`invalid model '${model}'`);
  }

  return streamingRequest(
    () => RequestModel(hash),
    () => HasModelLoaded(hash),
    'model',
    hash,
    timeout,
  );
}

export function requestAnimDict(dict: string, timeout?: number): Promise<string> {
  return streamingRequest(
    () => RequestAnimDict(dict),
    () => HasAnimDictLoaded(dict),
    'animDict',
    dict,
    timeout,
  );
}

export function requestAnimSet(animSet: string, timeout?: number): Promise<string> {
  return streamingRequest(
    () => RequestAnimSet(animSet),
    () => HasAnimSetLoaded(animSet),
    'animSet',
    animSet,
    timeout,
  );
}

export function requestPtfxAsset(fxName: string, timeout?: number): Promise<string> {
  return streamingRequest(
    () => RequestNamedPtfxAsset(fxName),
    () => HasNamedPtfxAssetLoaded(fxName),
    'ptfxAsset',
    fxName,
    timeout,
  );
}

export function requestTextureDict(dict: string, timeout?: number): Promise<string> {
  return streamingRequest(
    () => RequestStreamedTextureDict(dict, false),
    () => HasStreamedTextureDictLoaded(dict),
    'textureDict',
    dict,
    timeout,
  );
}

export function requestWeaponAsset(weapon: string | number, timeout?: number): Promise<number> {
  const hash = typeof weapon === 'string' ? GetHashKey(weapon) : weapon;

  return streamingRequest(
    () => RequestWeaponAsset(hash, 31, 0),
    () => HasWeaponAssetLoaded(hash),
    'weaponAsset',
    hash,
    timeout,
  );
}

export async function requestScaleformMovie(name: string, timeout?: number): Promise<number> {
  const handle = RequestScaleformMovie(name);

  if (HasScaleformMovieLoaded(handle)) return handle;

  return waitFor(
    () => (HasScaleformMovieLoaded(handle) ? handle : undefined),
    timeout ?? 10000,
  ).catch(() => {
    throw new Error(`failed to load scaleformMovie '${name}'`);
  });
}
