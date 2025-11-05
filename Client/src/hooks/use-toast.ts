"use client";

// Inspired by react-hot-toast library
import * as React from "react";

import type { ToastProps } from "@/components/ui/toast";
import { ToastAction } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 100000;
const DEFAULT_TOAST_DURATION = 1500; // - default auto-close duration

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: any;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, duration?: number) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const delay = duration ?? TOAST_REMOVE_DELAY;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, delay);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ duration = DEFAULT_TOAST_DURATION, ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Auto-dismiss after duration if provided
  if (duration !== undefined && duration > 0) {
    setTimeout(() => {
      dispatch({ type: "DISMISS_TOAST", toastId: id });
    }, duration);
  }

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

// Helper functions for compatibility with sonner API
type ToastOptions = {
  description?: string;
  duration?: number;
  className?: string;
  richColors?: boolean; // Ignored, kept for compatibility
  action?: {
    label: string;
    onClick: () => void;
  };
};

const toastHelpers = {
  success: (message: string, options?: ToastOptions) => {
    return toast({
      title: message,
      description: options?.description,
      variant: "success",
      duration: options?.duration ?? DEFAULT_TOAST_DURATION,
      className: options?.className,
      action: options?.action
        ? React.createElement(
            ToastAction,
            {
              onClick: options.action.onClick,
              altText: options.action.label,
            },
            options.action.label
          )
        : undefined,
    });
  },
  error: (message: string, options?: ToastOptions) => {
    return toast({
      title: message,
      description: options?.description,
      variant: "destructive",
      duration: options?.duration ?? DEFAULT_TOAST_DURATION,
      className: options?.className,
      action: options?.action
        ? React.createElement(
            ToastAction,
            {
              onClick: options.action.onClick,
              altText: options.action.label,
            },
            options.action.label
          )
        : undefined,
    });
  },
  info: (message: string, options?: ToastOptions) => {
    return toast({
      title: message,
      description: options?.description,
      variant: "default",
      duration: options?.duration ?? DEFAULT_TOAST_DURATION,
      className: options?.className,
      action: options?.action
        ? React.createElement(
            ToastAction,
            {
              onClick: options.action.onClick,
              altText: options.action.label,
            },
            options.action.label
          )
        : undefined,
    });
  },
};

// Export toast with helper methods
const toastWithHelpers = Object.assign(toast, toastHelpers);

export { useToast, toastWithHelpers as toast };
