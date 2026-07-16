import { useEffect } from 'react';
import api from '../api/axios';

interface RazorpayCheckoutProps {
  amount: number;
  receipt: string;
  onSuccess: (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function RazorpayCheckout({ amount, receipt, onSuccess, onClose }: RazorpayCheckoutProps) {
  useEffect(() => {
    const loadScript = async () => {
      const existing = document.getElementById('razorpay-script');
      if (existing) {
        existing.remove();
      }

      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = openHandler;
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
      };
      document.body.appendChild(script);
    };

    const openHandler = async () => {
      try {
        const publicKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
        if (!publicKey) {
          alert('Razorpay public key is not configured. Please contact support.');
          return;
        }

        const response = await api.post('/payments/create-order', {
          amount: Math.round(amount * 100),
          receipt,
          notes: { receipt },
        });

        const options = {
          key: publicKey,
          amount: response.data.order.amount,
          currency: response.data.order.currency,
          name: 'Flight Booking & Reservation',
          description: 'Flight booking payment',
          order_id: response.data.order.id,
          handler: (response: any) => {
            onSuccess(response);
          },
          prefill: {
            name: '',
            email: '',
            contact: '',
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: () => {
              onClose?.();
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error('Failed to start Razorpay checkout:', error);
      }
    };

    void loadScript();
  }, [amount, receipt, onSuccess, onClose]);

  return null;
}

export default RazorpayCheckout;
