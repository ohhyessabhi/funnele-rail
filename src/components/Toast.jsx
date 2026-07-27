import useAppStore from "../store/appStore";

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className={`toast ${toast.isError ? "error" : ""}`}>{toast.message}</div>
  );
}
