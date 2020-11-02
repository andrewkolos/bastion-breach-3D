export type DeepPartialNoFunc<T> = NonFunctionProperties<{
  [P in keyof T]?: DeepPartialNoFunc<T[P]>;
}>;
type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
