// Stripe integration — disabled for beta
// TODO: Re-enable when ready to add billing

export const stripe = null;

export async function createCheckoutSession(_userId: string, _email: string) {
  throw new Error("Billing is not enabled in beta");
}

export async function createPortalSession(_stripeCustomerId: string) {
  throw new Error("Billing is not enabled in beta");
}
