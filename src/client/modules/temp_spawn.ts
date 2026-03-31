import { requestModel } from '@/client/lib/streaming/request';
import { waitForPlayer } from '@/client/lib/utils/wait';

const MODEL = GetHashKey('mp_m_freemode_01');

const setDefaultClothes = (ped: number) => {
  for (let i = 0; i <= 11; i++) {
    SetPedComponentVariation(ped, i, 0, 0, 4);
  }
  for (let i = 0; i <= 7; i++) {
    ClearPedProp(ped, i);
  }
};

(async () => {
  await waitForPlayer();

  DoScreenFadeOut(500);
  await new Promise((resolve) => setTimeout(resolve, 600));

  await requestModel(MODEL);

  SetPlayerModel(PlayerId(), MODEL);

  const ped = PlayerPedId();
  setDefaultClothes(ped);
  SetEntityCoords(ped, 0, 0, 70, false, false, false, false);
  SetEntityHeading(ped, 0);
  SetModelAsNoLongerNeeded(MODEL);

  FreezeEntityPosition(ped, false);
  SetPlayerControl(PlayerId(), true, 0);
  SetPlayerInvincible(PlayerId(), false);
  ClearPlayerWantedLevel(PlayerId());

  DoScreenFadeIn(500);
})();
