export interface AnimationEvents {
  updated: () => void;
  completed: () => void;
  stopped: () => void;
}
