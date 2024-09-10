import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutEmbedProps {
  clientSecret: string;
}

const StripeCheckoutEmbed: React.FC<StripeCheckoutEmbedProps> = ({ clientSecret }) => {
  const options = { clientSecret };
  if (!clientSecret) {
    return <div>Loading...</div>;
  }
  return (
    <>
      {clientSecret}
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={options}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </>
  );
};

export default StripeCheckoutEmbed;