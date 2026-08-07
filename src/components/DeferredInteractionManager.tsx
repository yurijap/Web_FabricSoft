import { lazy, Suspense, useEffect, useState } from "react";
import type { InteractionRequest } from "./InteractionManager";

const InteractionManager = lazy(() => import("./InteractionManager"));

function readInteractionRequest(target: HTMLElement): InteractionRequest | null {
  const type = target.getAttribute("data-interaction") as InteractionRequest["type"] | null;
  if (!type) return null;

  const paperIndexValue = target.getAttribute("data-paper-index");
  const paperIndex =
    paperIndexValue === null ? null : Number.parseInt(paperIndexValue, 10);

  return {
    type,
    date: target.getAttribute("data-date"),
    paperIndex: Number.isNaN(paperIndex) ? null : paperIndex,
    nonce: Date.now(),
  };
}

export default function DeferredInteractionManager() {
  const [initialRequest, setInitialRequest] = useState<InteractionRequest | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (enabled) return;

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest(
        "[data-interaction]",
      ) as HTMLElement | null;
      if (!target) return;

      const request = readInteractionRequest(target);
      if (!request) return;

      event.preventDefault();
      setInitialRequest(request);
      setEnabled(true);
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [enabled]);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <InteractionManager initialRequest={initialRequest} />
    </Suspense>
  );
}
