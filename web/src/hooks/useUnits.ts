// Unit conversion hook — reads the user's preferred unit system from localStorage
// and provides helpers to display values in the right unit.

const getUnits = () => (localStorage.getItem('units') as 'metric' | 'imperial') || 'metric';

export const useUnits = () => {
  const system = getUnits();
  const isImperial = system === 'imperial';

  const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
  const lbsToKg = (lbs: number) => Math.round(lbs / 2.20462 * 10) / 10;
  const cmToIn  = (cm: number) => Math.round(cm / 2.54 * 10) / 10;
  const inToCm  = (inches: number) => Math.round(inches * 2.54 * 10) / 10;

  /** Display weight: stored in kg, shown in preferred unit */
  const displayWeight = (kg: number): string => {
    if (!isImperial) return `${kg} kg`;
    return `${kgToLbs(kg)} lbs`;
  };

  /** Display distance cm: stored in cm, shown in preferred unit */
  const displayCm = (cm: number): string => {
    if (!isImperial) return `${cm} cm`;
    return `${cmToIn(cm)} in`;
  };

  /** Unit label for weight */
  const weightUnit = isImperial ? 'lbs' : 'kg';

  /** Unit label for distance */
  const cmUnit = isImperial ? 'in' : 'cm';

  /** Convert input value (in display unit) back to kg for storage */
  const toStorageWeight = (displayVal: number): number =>
    isImperial ? lbsToKg(displayVal) : displayVal;

  /** Convert input value (in display unit) back to cm for storage */
  const toStorageCm = (displayVal: number): number =>
    isImperial ? inToCm(displayVal) : displayVal;

  /** Convert kg → display unit value (number only, no label) */
  const fromStorageWeight = (kg: number): number =>
    isImperial ? kgToLbs(kg) : kg;

  /** Convert cm → display unit value */
  const fromStorageCm = (cm: number): number =>
    isImperial ? cmToIn(cm) : cm;

  return {
    system,
    isImperial,
    weightUnit,
    cmUnit,
    displayWeight,
    displayCm,
    toStorageWeight,
    toStorageCm,
    fromStorageWeight,
    fromStorageCm,
  };
};
