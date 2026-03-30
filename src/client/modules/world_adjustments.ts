import { WorldConfig } from '@/shared/config/world_config';

const playerId = PlayerId();

function removeHudComponents(): void {
  for (let i = 0; i < WorldConfig.removeHudComponents.length; i++) {
    if (WorldConfig.removeHudComponents[i]) {
      SetHudComponentSize(i + 1, 0.0, 0.0);
      SetHudComponentPosition(i + 1, 900.0, 900.0);
    }
  }
}

function disableAimAssist(): void {
  if (WorldConfig.disableAimAssist) {
    SetPlayerTargetingMode(3);
  }
}

function disableNPCDrops(): void {
  if (WorldConfig.disableNPCDrops) {
    const pickups = [
      GetHashKey('PICKUP_WEAPON_CARBINERIFLE'),
      GetHashKey('PICKUP_WEAPON_PISTOL'),
      GetHashKey('PICKUP_WEAPON_PUMPSHOTGUN'),
    ];

    for (const pickup of pickups) {
      ToggleUsePickupsForPlayer(playerId, pickup, false);
    }
  }
}

function disableHealthRegeneration(): void {
  if (WorldConfig.disableHealthRegeneration) {
    SetPlayerHealthRechargeMultiplier(playerId, 0.0);
  }
}

function enablePvP(): void {
  if (WorldConfig.enablePvP) {
    SetCanAttackFriendly(PlayerPedId(), true, false);
    NetworkSetFriendlyFireOption(true);
  }
}

function disableWantedLevel(): void {
  if (WorldConfig.disableWantedLevel) {
    ClearPlayerWantedLevel(playerId);
    SetMaxWantedLevel(0);
  }
}

function disableDispatchServices(): void {
  if (WorldConfig.disableDispatchServices) {
    for (let i = 1; i <= 15; i++) {
      EnableDispatchService(i, false);
    }
    SetAudioFlag('PoliceScannerDisabled', true);
  }
}

function disableScenarios(): void {
  if (WorldConfig.disableScenarios) {
    for (const scenario of WorldConfig.scenarios) {
      SetScenarioTypeEnabled(scenario, false);
    }
  }
}

function setCustomAIPlates(): void {
  SetDefaultVehicleNumberPlateTextPattern(-1, WorldConfig.customAIPlates);
}

function startSeatShuffleHandler(): void {
  if (WorldConfig.disableSeatShuffle) {
    on('gameEventTriggered', (name: string, _args: number[]) => {
      if (name !== 'CEventNetworkPlayerEnteredVehicle') return;
      const ped = PlayerPedId();
      const vehicle = GetVehiclePedIsIn(ped, false);
      if (!vehicle) return;
      for (let seat = -1; seat < GetVehicleMaxNumberOfPassengers(vehicle); seat++) {
        if (GetPedInVehicleSeat(vehicle, seat) === ped && seat > -1) {
          SetPedIntoVehicle(ped, vehicle, seat);
          SetPedConfigFlag(ped, 184, true);
          break;
        }
      }
    });
  }
}

function startRadioDisableHandler(): void {
  if (WorldConfig.disableRadioOnEnter) {
    on('gameEventTriggered', (name: string, _args: number[]) => {
      if (name !== 'CEventNetworkPlayerEnteredVehicle') return;
      const vehicle = GetVehiclePedIsIn(PlayerPedId(), false);
      if (vehicle) {
        SetVehRadioStation(vehicle, 'OFF');
        SetUserRadioControlEnabled(false);
      }
    });
  }
}

function getPlaceholderValue(key: string): string {
  switch (key) {
    case 'server_name':
      return GetConvar('sv_projectName', 'Gaia Project');
    case 'server_players':
      return String(GlobalState.playerCount ?? 0);
    case 'server_maxplayers':
      return String(GetConvarInt('sv_maxClients', 48));
    case 'player_name':
      return GetPlayerName(playerId) ?? 'Unknown';
    case 'player_id':
      return String(GetPlayerServerId(playerId));
    case 'player_street': {
      const ped = PlayerPedId();
      if (!ped) return 'Unknown';
      const coords = GetEntityCoords(ped, true);
      const [streetHash] = GetStreetNameAtCoord(coords[0]!, coords[1]!, coords[2]!);
      return GetStreetNameFromHashKey(streetHash) || 'Unknown';
    }
    default:
      return key;
  }
}

function replacePlaceholders(text: string): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => getPlaceholderValue(key));
}

function startDiscordPresence(): void {
  if (!WorldConfig.discord.enabled || !WorldConfig.discord.appId) return;

  setInterval(() => {
    SetDiscordAppId(WorldConfig.discord.appId);
    SetRichPresence(replacePlaceholders(WorldConfig.discord.presence));
    SetDiscordRichPresenceAsset(WorldConfig.discord.assetName);
    SetDiscordRichPresenceAssetText(replacePlaceholders(WorldConfig.discord.assetText));

    for (let i = 0; i < WorldConfig.discord.buttons.length; i++) {
      const button = WorldConfig.discord.buttons[i]!;
      SetDiscordRichPresenceAction(i, button.label, replacePlaceholders(button.url));
    }
  }, WorldConfig.discord.refreshInterval);
}

function startFrameLoop(): void {
  const hasAmmo = WorldConfig.disableDisplayAmmo;
  const hasRewards = WorldConfig.disableVehicleRewards;
  const hasIdle = WorldConfig.disableIdleCamera;
  const hasDensity =
    WorldConfig.density.pedDensity !== 1.0 ||
    WorldConfig.density.vehicleDensity !== 1.0 ||
    WorldConfig.density.parkedVehicleDensity !== 1.0 ||
    WorldConfig.density.randomVehicleDensity !== 1.0 ||
    WorldConfig.density.ambientVehicleRange !== 1.0 ||
    WorldConfig.density.scenarioPedDensityInterior !== 1.0 ||
    WorldConfig.density.scenarioPedDensityExterior !== 1.0;

  if (!hasAmmo && !hasRewards && !hasIdle && !hasDensity) return;

  setTick(() => {
    if (hasAmmo) DisplayAmmoThisFrame(false);
    if (hasRewards) DisablePlayerVehicleRewards(playerId);
    if (hasIdle) InvalidateIdleCam();

    if (hasDensity) {
      SetPedDensityMultiplierThisFrame(WorldConfig.density.pedDensity);
      SetScenarioPedDensityMultiplierThisFrame(
        WorldConfig.density.scenarioPedDensityInterior,
        WorldConfig.density.scenarioPedDensityExterior,
      );
      SetAmbientVehicleRangeMultiplierThisFrame(WorldConfig.density.ambientVehicleRange);
      SetParkedVehicleDensityMultiplierThisFrame(WorldConfig.density.parkedVehicleDensity);
      SetRandomVehicleDensityMultiplierThisFrame(WorldConfig.density.randomVehicleDensity);
      SetVehicleDensityMultiplierThisFrame(WorldConfig.density.vehicleDensity);
    }
  });
}

removeHudComponents();
disableAimAssist();
disableNPCDrops();
disableHealthRegeneration();
enablePvP();
disableWantedLevel();
disableDispatchServices();
disableScenarios();
setCustomAIPlates();
startSeatShuffleHandler();
startRadioDisableHandler();
startDiscordPresence();
startFrameLoop();
