import {
  useSignal,
  useVisibleTask$,
  type QRL,
  type Signal,
} from "@builder.io/qwik";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

let bodyScrollLockCount = 0;
const overlayStack: HTMLElement[] = [];

const getFocusableElements = (container: HTMLElement) => {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => {
    if (element.hidden) return false;
    if (element.getAttribute("aria-hidden") === "true") return false;

    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
};

const focusOverlayElement = (
  container: HTMLElement,
  initialFocusElement?: HTMLElement,
) => {
  const preferredTarget =
    initialFocusElement &&
    initialFocusElement.isConnected &&
    container.contains(initialFocusElement)
      ? initialFocusElement
      : null;

  const firstFocusable =
    preferredTarget || getFocusableElements(container)[0] || container;

  if (firstFocusable instanceof HTMLElement) {
    firstFocusable.focus({ preventScroll: true });
  }
};

const lockBodyScroll = () => {
  const body = document.body;
  const docEl = document.documentElement;
  const previousOverflow = body.style.overflow;
  const previousPaddingRight = body.style.paddingRight;
  const previousTouchAction = body.style.touchAction;

  if (bodyScrollLockCount === 0) {
    const scrollbarWidth = Math.max(0, window.innerWidth - docEl.clientWidth);
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  bodyScrollLockCount += 1;

  return () => {
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
    if (bodyScrollLockCount > 0) return;

    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
    body.style.touchAction = previousTouchAction;
  };
};

const registerOverlay = (container: HTMLElement) => {
  overlayStack.push(container);

  return () => {
    const index = overlayStack.lastIndexOf(container);
    if (index >= 0) {
      overlayStack.splice(index, 1);
    }
  };
};

const isTopOverlay = (container: HTMLElement) => {
  return overlayStack[overlayStack.length - 1] === container;
};

const trapTabKey = (event: KeyboardEvent, container: HTMLElement) => {
  const focusable = getFocusableElements(container);
  if (!focusable.length) {
    event.preventDefault();
    container.focus({ preventScroll: true });
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;

  if (event.shiftKey) {
    if (!active || active === first || !container.contains(active)) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    }
    return;
  }

  if (!active || active === last || !container.contains(active)) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
};

export const useOverlayBehavior = (props: UseOverlayBehaviorProps) => {
  const overlayRef = useSignal<HTMLElement>();
  const initialFocusRef = useSignal<HTMLElement>();
  const returnFocusRef = useSignal<HTMLElement>();

  useVisibleTask$(({ track, cleanup }) => {
    const open = track(() => props.open.value);
    track(() => overlayRef.value);
    track(() => initialFocusRef.value);

    if (!open || !(overlayRef.value instanceof HTMLElement)) {
      return;
    }

    const container = overlayRef.value;
    returnFocusRef.value =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined;

    const releaseScrollLock = lockBodyScroll();
    const unregisterOverlay = registerOverlay(container);
    const focusFrame = window.requestAnimationFrame(() => {
      focusOverlayElement(container, initialFocusRef.value);
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopOverlay(container)) return;

      if (event.key === "Escape") {
        event.preventDefault();
        void props.onClose$();
        return;
      }

      if (event.key === "Tab") {
        trapTabKey(event, container);
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!isTopOverlay(container)) return;
      if (container.contains(event.target as Node)) return;
      focusOverlayElement(container, initialFocusRef.value);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn, true);

    cleanup(() => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn, true);
      unregisterOverlay();
      releaseScrollLock();

      const returnFocus = returnFocusRef.value;
      if (returnFocus?.isConnected) {
        window.requestAnimationFrame(() => {
          returnFocus.focus({ preventScroll: true });
        });
      }
    });
  });

  return {
    overlayRef,
    initialFocusRef,
  };
};

type UseOverlayBehaviorProps = {
  open: Signal<boolean>;
  onClose$: QRL<() => void>;
};
