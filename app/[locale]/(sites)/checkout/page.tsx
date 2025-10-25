'use client';
import PayPalButtonsComp from '@/complements/components/PayPal/PayPalButtonsComp';

export default function CheckoutPage() {
  return (
    <main>
      <h1>Checkout de prueba</h1>
      <PayPalButtonsComp
        amount="12.34"
        currency="CAD"
        createOrderUrl="/api/paypal/create-order"
        captureOrderUrl="/api/paypal/capture-order"
        onApproved={(d) => console.log('Aprobado:', d)}
        onError={(e) => console.error('Error PayPal:', e)}
      />
    </main>
  );
}