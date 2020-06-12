import { randomNaturalUpToInc } from '../random';

/**
 * Shuffles an array in-place using the Fisher-Yates shuffling algorithm.
 * @param arr
 */
export function shuffleInPlace<T>(arr: T[]): T[] {
  arr.forEach((_value: T, i: number) => {
    swap(i, i + randomNaturalUpToInc(arr.length - i));
  });
  return arr;

  function swap(i: number, j: number) {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}
