/**
 * Layout for /payment/* routes.
 *
 * These pages are outside the (dashboard) group so they render
 * without the sidebar/navbar — giving users a clean, focused
 * payment flow experience (matching Stripe's design best practices).
 */
export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
