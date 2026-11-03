export interface NavItem {
  label: string;
  to: string;
  external?: boolean;
  /** Rendered as a highlighted button in the top nav. */
  highlight?: boolean;
}

export const publicNav: NavItem[] = [
  { label: "Product", to: "/#product" },
  { label: "Workspace", to: "/workspace" },
  { label: "ITL Bridge AI", to: "/bridge", highlight: true },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

export const footerNav = {
  Product: [
    { label: "Ask Bot", to: "/#ask" },
    { label: "Case Law Research", to: "/#research" },
    { label: "Notice Reply", to: "/#notice" },
    { label: "ITL Bridge AI", to: "/bridge" },
  ],
  Solutions: [
    { label: "For CAs", to: "/#product" },
    { label: "For Advocates", to: "/#product" },
    { label: "For In-house Teams", to: "/pricing" },
  ],
  Resources: [
    { label: "FAQ", to: "/faq" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Refund Policy", to: "/refund" },
    { label: "Cancellation Policy", to: "/cancellation" },
  ],
};
