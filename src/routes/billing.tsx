/* eslint-disable prettier/prettier */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

/**
 * Billing has been merged into the pricing page — plans, coupons, salesman pricing and
 * payment all happen in its checkout dialog now, so old links and bookmarks to /billing
 * land there. /billing/return (a child route) stays: Paytm's callback sends customers back to it.
 */
export const Route = createFileRoute("/billing")({
  beforeLoad: ({ location }) => {
    if (location.pathname.replace(/\/+$/, "") === "/billing") {
      throw redirect({ to: "/pricing" });
    }
  },
  component: () => <Outlet />,
});
