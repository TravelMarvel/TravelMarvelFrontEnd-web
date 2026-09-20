export type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type AlertState = {
  title: string;
  message?: string;
  buttons: AlertButton[];
} | null;

type Listener = (state: AlertState) => void;

let current: AlertState = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener(current);
  }
}

export function subscribeAlert(listener: Listener) {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

export function showAlert(
  title: string,
  message?: string,
  buttons: AlertButton[] = [{ text: "확인" }],
) {
  current = { title, message, buttons };
  emit();
}

export function dismissAlert() {
  current = null;
  emit();
}
