import type { VehicleProperties, PartialVehicleProperties } from './types';

const MOD_INDICES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
] as const;

const TOGGLE_MOD_INDICES = [18, 19, 20, 21, 22] as const;

export function getVehicleProperties(vehicle: number): VehicleProperties | null {
  if (!DoesEntityExist(vehicle)) return null;

  const [colorPrimary, colorSecondary] = GetVehicleColours(vehicle);
  const [pearlescentColor, wheelColor] = GetVehicleExtraColours(vehicle);

  let color1: number | [number, number, number] = colorPrimary;
  let color2: number | [number, number, number] = colorSecondary;

  if (GetIsVehiclePrimaryColourCustom(vehicle)) {
    const [r, g, b] = GetVehicleCustomPrimaryColour(vehicle);
    color1 = [r, g, b];
  }

  if (GetIsVehicleSecondaryColourCustom(vehicle)) {
    const [r, g, b] = GetVehicleCustomSecondaryColour(vehicle);
    color2 = [r, g, b];
  }

  const extras: Record<number, boolean> = {};
  for (let i = 1; i <= 15; i++) {
    if (DoesExtraExist(vehicle, i)) {
      extras[i] = IsVehicleExtraTurnedOn(vehicle, i);
    }
  }

  const neonEnabled: [boolean, boolean, boolean, boolean] = [
    IsVehicleNeonLightEnabled(vehicle, 0),
    IsVehicleNeonLightEnabled(vehicle, 1),
    IsVehicleNeonLightEnabled(vehicle, 2),
    IsVehicleNeonLightEnabled(vehicle, 3),
  ];

  const [neonR, neonG, neonB] = GetVehicleNeonLightsColour(vehicle);
  const [smokeR, smokeG, smokeB] = GetVehicleTyreSmokeColor(vehicle);

  const mods: Record<number, number> = {};
  for (const idx of MOD_INDICES) {
    const value = GetVehicleMod(vehicle, idx);
    if (value !== -1) mods[idx] = value;
  }

  const toggleMods: Record<number, boolean> = {};
  for (const idx of TOGGLE_MOD_INDICES) {
    toggleMods[idx] = IsToggleModOn(vehicle, idx);
  }

  const windows: number[] = [];
  for (let i = 0; i < 8; i++) {
    RollUpWindow(vehicle, i);
    if (!IsVehicleWindowIntact(vehicle, i)) windows.push(i);
  }

  const doors: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (IsVehicleDoorDamaged(vehicle, i)) doors.push(i);
  }

  const tyres: Record<number, 1 | 2> = {};
  for (let i = 0; i < 8; i++) {
    if (IsVehicleTyreBurst(vehicle, i, false)) {
      tyres[i] = IsVehicleTyreBurst(vehicle, i, true) ? 2 : 1;
    }
  }

  return {
    model: GetEntityModel(vehicle),
    plate: GetVehicleNumberPlateText(vehicle),
    plateIndex: GetVehicleNumberPlateTextIndex(vehicle),
    lockState: GetVehicleDoorLockStatus(vehicle),
    bodyHealth: Math.round(GetVehicleBodyHealth(vehicle)),
    engineHealth: Math.round(GetVehicleEngineHealth(vehicle)),
    tankHealth: Math.round(GetVehiclePetrolTankHealth(vehicle)),
    fuelLevel: Math.round(GetVehicleFuelLevel(vehicle)),
    oilLevel: Math.round(GetVehicleOilLevel(vehicle)),
    dirtLevel: Math.round(GetVehicleDirtLevel(vehicle)),
    paintType1: GetVehicleModColor_1(vehicle)[0],
    paintType2: GetVehicleModColor_2(vehicle)[0],
    color1,
    color2,
    pearlescentColor,
    interiorColor: GetVehicleInteriorColor(vehicle),
    dashboardColor: GetVehicleDashboardColour(vehicle),
    wheelColor,
    wheelWidth: GetVehicleWheelWidth(vehicle),
    wheelSize: GetVehicleWheelSize(vehicle),
    wheels: GetVehicleWheelType(vehicle),
    windowTint: GetVehicleWindowTint(vehicle),
    xenonColor: GetVehicleXenonLightsColor(vehicle),
    neonEnabled,
    neonColor: [neonR, neonG, neonB],
    extras,
    tyreSmokeColor: [smokeR, smokeG, smokeB],
    livery: GetVehicleLivery(vehicle),
    roofLivery: GetVehicleRoofLivery(vehicle),
    bulletProofTyres: GetVehicleTyresCanBurst(vehicle),
    driftTyres: GetGameBuildNumber() >= 2372 && GetDriftTyresEnabled(vehicle),
    mods,
    toggleMods,
    customTiresF: GetVehicleModVariation(vehicle, 23),
    customTiresR: GetVehicleModVariation(vehicle, 24),
    windows,
    doors,
    tyres,
  };
}

export function setVehicleProperties(vehicle: number, props: PartialVehicleProperties): boolean {
  if (!DoesEntityExist(vehicle)) return false;

  SetVehicleModKit(vehicle, 0);

  if (props.plate !== undefined) SetVehicleNumberPlateText(vehicle, props.plate);
  if (props.plateIndex !== undefined) SetVehicleNumberPlateTextIndex(vehicle, props.plateIndex);
  if (props.lockState !== undefined) SetVehicleDoorsLocked(vehicle, props.lockState);
  if (props.bodyHealth !== undefined) SetVehicleBodyHealth(vehicle, props.bodyHealth + 0.0);
  if (props.engineHealth !== undefined) SetVehicleEngineHealth(vehicle, props.engineHealth + 0.0);
  if (props.tankHealth !== undefined) SetVehiclePetrolTankHealth(vehicle, props.tankHealth + 0.0);
  if (props.fuelLevel !== undefined) SetVehicleFuelLevel(vehicle, props.fuelLevel + 0.0);
  if (props.oilLevel !== undefined) SetVehicleOilLevel(vehicle, props.oilLevel + 0.0);
  if (props.dirtLevel !== undefined) SetVehicleDirtLevel(vehicle, props.dirtLevel + 0.0);

  if (props.color1 !== undefined) {
    if (typeof props.color1 === 'number') {
      ClearVehicleCustomPrimaryColour(vehicle);
      const [, secondary] = GetVehicleColours(vehicle);
      SetVehicleColours(vehicle, props.color1, secondary);
    } else {
      if (props.paintType1 !== undefined) SetVehicleModColor_1(vehicle, props.paintType1, 0, 0);
      SetVehicleCustomPrimaryColour(vehicle, props.color1[0], props.color1[1], props.color1[2]);
    }
  }

  if (props.color2 !== undefined) {
    if (typeof props.color2 === 'number') {
      ClearVehicleCustomSecondaryColour(vehicle);
      const [primary] = GetVehicleColours(vehicle);
      SetVehicleColours(vehicle, primary, props.color2);
    } else {
      if (props.paintType2 !== undefined) SetVehicleModColor_2(vehicle, props.paintType2, 0);
      SetVehicleCustomSecondaryColour(vehicle, props.color2[0], props.color2[1], props.color2[2]);
    }
  }

  if (props.pearlescentColor !== undefined || props.wheelColor !== undefined) {
    const [currentPearl, currentWheel] = GetVehicleExtraColours(vehicle);
    SetVehicleExtraColours(
      vehicle,
      props.pearlescentColor ?? currentPearl,
      props.wheelColor ?? currentWheel,
    );
  }

  if (props.interiorColor !== undefined) SetVehicleInteriorColor(vehicle, props.interiorColor);
  if (props.dashboardColor !== undefined) SetVehicleDashboardColor(vehicle, props.dashboardColor);
  if (props.wheels !== undefined) SetVehicleWheelType(vehicle, props.wheels);
  if (props.wheelSize !== undefined) SetVehicleWheelSize(vehicle, props.wheelSize);
  if (props.wheelWidth !== undefined) SetVehicleWheelWidth(vehicle, props.wheelWidth);
  if (props.windowTint !== undefined) SetVehicleWindowTint(vehicle, props.windowTint);

  if (props.neonEnabled !== undefined) {
    for (let i = 0; i < 4; i++) {
      SetVehicleNeonLightEnabled(vehicle, i, props.neonEnabled[i]!);
    }
  }

  if (props.neonColor !== undefined) {
    SetVehicleNeonLightsColour(vehicle, props.neonColor[0], props.neonColor[1], props.neonColor[2]);
  }

  if (props.tyreSmokeColor !== undefined) {
    SetVehicleTyreSmokeColor(
      vehicle,
      props.tyreSmokeColor[0],
      props.tyreSmokeColor[1],
      props.tyreSmokeColor[2],
    );
  }

  if (props.xenonColor !== undefined) SetVehicleXenonLightsColor(vehicle, props.xenonColor);

  if (props.extras !== undefined) {
    for (const [id, enabled] of Object.entries(props.extras)) {
      SetVehicleExtra(vehicle, Number(id), !enabled);
    }
  }

  if (props.mods !== undefined) {
    for (const [idx, value] of Object.entries(props.mods)) {
      const modIdx = Number(idx);
      const customTires =
        modIdx === 23
          ? (props.customTiresF ?? false)
          : modIdx === 24
            ? (props.customTiresR ?? false)
            : false;
      SetVehicleMod(vehicle, modIdx, value, customTires);
    }
  }

  if (props.toggleMods !== undefined) {
    for (const [idx, enabled] of Object.entries(props.toggleMods)) {
      ToggleVehicleMod(vehicle, Number(idx), enabled);
    }
  }

  if (props.windows !== undefined) {
    for (const windowIdx of props.windows) {
      RemoveVehicleWindow(vehicle, windowIdx);
    }
  }

  if (props.doors !== undefined) {
    for (const doorIdx of props.doors) {
      SetVehicleDoorBroken(vehicle, doorIdx, true);
    }
  }

  if (props.tyres !== undefined) {
    for (const [idx, state] of Object.entries(props.tyres)) {
      SetVehicleTyreBurst(vehicle, Number(idx), state === 2, 1000.0);
    }
  }

  if (props.livery !== undefined) SetVehicleLivery(vehicle, props.livery);
  if (props.roofLivery !== undefined) SetVehicleRoofLivery(vehicle, props.roofLivery);
  if (props.bulletProofTyres !== undefined)
    SetVehicleTyresCanBurst(vehicle, props.bulletProofTyres);

  if (props.driftTyres && GetGameBuildNumber() >= 2372) {
    SetDriftTyresEnabled(vehicle, true);
  }

  return !NetworkGetEntityIsNetworked(vehicle) || NetworkGetEntityOwner(vehicle) === PlayerId();
}
