/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Paytm JS Checkout — the current recommended integration
 * (paytmpayments.com/docs/jscheckout-invoke-payment). Loads Paytm's SDK script and
 * renders an iframe on the page; NOT a redirect to a Paytm-hosted page. When a
 * callbackUrl was sent, Paytm navigates the browser to it on completion and the
 * backend redirects on to /billing/return. Otherwise (in-page mode) Paytm reports
 * back to the page, and we poll our server (which asks Paytm) until the order is
 * confirmed. What the browser is told is never trusted — the server always
 * confirms with Paytm's Transaction Status API.
 */

export type RecheckFn = (orderId: string) => Promise<{ status: string }>;

function watchOrder(orderId: string, recheckFn: RecheckFn, onPaid: () => void): () => void {
  let stopped = false;
  const startedAt = Date.now();
  let timer = 0;

  const tick = async () => {
    if (stopped || Date.now() - startedAt > 12 * 60 * 1000) return;
    try {
      const payment = await recheckFn(orderId);
      if (payment.status === "success") {
        stopped = true;
        onPaid();
        return;
      }
    } catch {
      // Paytm's status check can be briefly unavailable — just try again.
    }
    if (!stopped) timer = window.setTimeout(tick, 6000);
  };

  timer = window.setTimeout(tick, 6000);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}

function loadPaytmCheckoutScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const marker = "data-paytm-checkout";
    const existing = document.querySelector(`script[${marker}]`);
    if (existing?.getAttribute("src") === src && (window as any).Paytm?.CheckoutJS) {
      resolve();
      return;
    }
    existing?.remove();

    const script = document.createElement("script");
    script.type = "application/javascript";
    script.src = src;
    script.crossOrigin = "anonymous";
    script.setAttribute(marker, "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Paytm's checkout script."));
    document.head.appendChild(script);
  });
}

export async function launchPaytmCheckout(
  recheckFn: RecheckFn,
  params: {
  scriptUrl: string;
  orderId: string;
  txnToken: string;
  amount: string;
  /** false = in-page mode (no callbackUrl): Paytm reports the result to the page instead of redirecting. */
  useCallback: boolean;
  },
): Promise<void> {
  await loadPaytmCheckoutScript(params.scriptUrl);

  const Paytm = (window as any).Paytm;
  if (!Paytm?.CheckoutJS) {
    throw new Error("Paytm checkout didn't load correctly — please try again.");
  }

  const goToReturnPage = (status: string) =>
    window.location.assign(`/billing/return?order_id=${encodeURIComponent(params.orderId)}&status=${status}`);

  return new Promise((resolve, reject) => {
    let stopWatching = () => {};

    Paytm.CheckoutJS.onLoad(() => {
      Paytm.CheckoutJS.init({
        root: "",
        flow: "DEFAULT",
        data: {
          orderId: params.orderId,
          token: params.txnToken,
          tokenType: "TXN_TOKEN",
          amount: params.amount,
        },
        // In-page mode (the way the previous ITL site worked): no browser
        // redirect — Paytm calls transactionStatus below when the payment ends.
        ...(params.useCallback ? {} : { merchant: { redirect: false } }),
        handler: {
          notifyMerchant: (eventName: string) => {
            // With a callbackUrl the browser navigates away on a completed
            // payment — this only fires for in-page events beforehand,
            // most usefully when the person closes the checkout modal.
            if (eventName === "APP_CLOSED") {
              stopWatching();
              if (params.useCallback) {
                reject(new Error("Checkout closed."));
                return;
              }
              // In-page mode: the window may have been closed right AFTER paying.
              // Ask the server (Paytm) once before treating it as cancelled.
              recheckFn(params.orderId)
                .then((payment) => {
                  if (payment.status === "success") goToReturnPage("success");
                  else reject(new Error("Checkout closed."));
                })
                .catch(() => reject(new Error("Checkout closed.")));
            }
          },
          ...(params.useCallback
            ? {}
            : {
                transactionStatus: () => {
                  stopWatching();
                  try {
                    Paytm.CheckoutJS.close();
                  } catch {
                    /* already closed */
                  }
                  // The return page confirms the result with Paytm's Transaction Status
                  // API (server-to-server) — what the page is told here is never trusted.
                  goToReturnPage("pending");
                },
              }),
        },
      })
        .then(() => {
          Paytm.CheckoutJS.invoke();
          if (!params.useCallback) {
            stopWatching = watchOrder(params.orderId, recheckFn, () => {
              try {
                Paytm.CheckoutJS.close();
              } catch {
                /* already closed */
              }
              goToReturnPage("success");
            });
          }
          resolve();
        })
        .catch(reject);
    });
  });
}

