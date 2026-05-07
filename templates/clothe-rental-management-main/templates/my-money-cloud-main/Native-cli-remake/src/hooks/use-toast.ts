import Toast from "react-native-root-toast";

type ToastVariant = "info" | "error";

function showToast(message: string, variant: ToastVariant = "info") {
  Toast.show(message, {
    duration: Toast.durations.SHORT,
    position: Toast.positions.BOTTOM,
    backgroundColor: variant === "error" ? "#b91c1c" : "#111827",
    textColor: "#fff",
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
  });
}

const toastImpl = Object.assign(
  (message: string, variant: ToastVariant = "info") => showToast(message, variant),
  {
    success: (message: string) => showToast(message, "info"),
    error: (message: string) => showToast(message, "error"),
  }
);

export function useToast() {
  return { toast: toastImpl };
}

export const toast = toastImpl;
