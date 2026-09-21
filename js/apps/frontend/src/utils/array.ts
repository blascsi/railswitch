export type ArrayMoveDirection = "up" | "down";

export function moveArrayElement<T>(
  array: T[],
  toMoveIndex: number,
  dir: ArrayMoveDirection,
): T[] {
  const arrayClone = [...array];
  const elementToSwapWithIndex =
    dir === "up" ? toMoveIndex - 1 : toMoveIndex + 1;
  const elementToSwapWith = arrayClone[elementToSwapWithIndex];

  if (arrayClone[toMoveIndex] == null || elementToSwapWith == null) {
    throw new Error("Invalid array element swap direction");
  }

  arrayClone[elementToSwapWithIndex] = arrayClone[toMoveIndex];
  arrayClone[toMoveIndex] = elementToSwapWith;

  return arrayClone;
}

export function removeArrayElementAtIndex<T>(
  array: T[],
  toRemoveIndex: number,
): T[] {
  return array.filter((_elem, index) => index !== toRemoveIndex);
}

export function isOneOf<T extends U, U>(
  array: readonly T[],
  value: U,
): value is T {
  return (array as readonly U[]).includes(value);
}
