/**
 * Shuffles an array in-place using the Fisher-Yates shuffling algorithm.
 * @param arr
 */
export function shuffle<T>(arr: T[]) {
  arr.forEach((_value: T, i: number) => {
    swap(i, i + randomUpTo(arr.length - i));
  });
  function swap(i: number, j: number) {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}
function randomUpTo(max: number) {
  return Math.random() * Math.floor(max);
}