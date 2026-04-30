import { createContext, useCallback, useContext, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, XCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { variant = "info", duration = 2500 } = {}) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const api = {
    show,
    success: (msg, opts) => show(msg, { ...opts, variant: "success" }),
    error: (msg, opts) => show(msg, { ...opts, variant: "error" }),
    info: (msg, opts) => show(msg, { ...opts, variant: "info" }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* 우상단 고정 영역 */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const Icon =
    toast.variant === "success"
      ? CheckCircle2
      : toast.variant === "error"
        ? XCircle
        : Info;

  return (
    <div
      role="status"
      onClick={onDismiss}
      className={clsx(
        "pointer-events-auto cursor-pointer min-w-[260px] max-w-sm rounded-lg border px-4 py-3 shadow-lg backdrop-blur transition",
        "flex items-start gap-2 text-sm",
        toast.variant === "success" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
        toast.variant === "error" &&
          "border-rose-500/40 bg-rose-500/10 text-rose-100",
        toast.variant === "info" &&
          "border-sky-500/40 bg-sky-500/10 text-sky-100",
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="leading-relaxed whitespace-pre-line">
        {toast.message}
      </span>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
