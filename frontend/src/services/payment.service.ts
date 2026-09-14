// src/services/payment.service.ts
import axios from 'axios';

const API = process.env.REACT_APP_BOOKING_API_URL || 'http://localhost:8084/api';

const api = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  let userId = localStorage.getItem('userId');
  if (!userId) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userId = user.id || user._id || null;
    } catch {
      userId = null;
    }
  }
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }

  return config;
});

export type RazorpayOrder = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  bookingId: string;
};

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyResult = {
  success: boolean;
  paymentId?: string;
  booking?: unknown;
  error?: string;
};

/** Check if booking-service has Razorpay keys loaded */
export async function getPaymentStatus(): Promise<{ razorpayConfigured: boolean }> {
  const { data } = await api.get('/payments/status');
  return data;
}

/** Create Razorpay order for a PENDING booking */
export async function createRazorpayOrder(bookingId: string): Promise<RazorpayOrder> {
  const { data } = await api.post('/payments/create-order', { bookingId });
  if (data?.error) throw new Error(data.error);
  if (!data?.orderId || !data?.keyId) {
    throw new Error('Invalid create-order response from server');
  }
  return {
    orderId: data.orderId,
    amount: data.amount,
    currency: data.currency || 'INR',
    keyId: data.keyId,
    bookingId: data.bookingId || bookingId,
  };
}

/** Verify signature on backend → confirms booking */
export async function verifyRazorpayPayment(payload: {
  bookingId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<VerifyResult> {
  const { data } = await api.post('/payments/verify', payload);
  if (data?.error) throw new Error(data.error);
  return data as VerifyResult;
}

/** Cancel a PENDING booking — releases held seats */
export async function cancelPendingBooking(bookingId: string): Promise<void> {
  try {
    await api.post(`/bookings/${bookingId}/cancel`, { reason: 'user_cancelled' });
  } catch (e) {
    // best-effort — server scheduler will eventually clean up
    // eslint-disable-next-line no-console
    console.warn('cancelPendingBooking failed:', e);
  }
}

/** Open Razorpay Checkout modal */
export function openRazorpayCheckout(order: RazorpayOrder): Promise<RazorpaySuccess> {
  return new Promise((resolve, reject) => {
    const Razorpay = (window as any).Razorpay;
    if (!Razorpay) {
      reject(
        new Error(
          'Razorpay script not loaded. Add <script src="https://checkout.razorpay.com/v1/checkout.js"></script> to public/index.html'
        )
      );
      return;
    }

    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'CinemaSync',
      description: `Booking ${order.bookingId}`,
      order_id: order.orderId,
      handler(response: RazorpaySuccess) {
        resolve({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      theme: { color: '#e50914' },
      modal: {
        ondismiss() {
          reject(new Error('Payment cancelled'));
        },
      },
    });

    rzp.on('payment.failed', (resp: any) => {
      const msg =
        resp?.error?.description ||
        resp?.error?.reason ||
        'Payment failed';
      reject(new Error(msg));
    });

    rzp.open();
  });
}

/**
 * ✅ FIXED FLOW
 * create-order → Checkout → verify
 * On cancel/failure, we cancel the PENDING booking so seats are released.
 */
export async function payWithRazorpay(bookingId: string): Promise<VerifyResult> {
  let order: RazorpayOrder;

  // Step 1 — create order. If THIS fails, also release the PENDING booking.
  try {
    order = await createRazorpayOrder(bookingId);
  } catch (e) {
    await cancelPendingBooking(bookingId);
    throw e;
  }

  // Step 2 — open Razorpay. On cancel, release the PENDING booking.
  let rzp: RazorpaySuccess;
  try {
    rzp = await openRazorpayCheckout(order);
  } catch (e) {
    await cancelPendingBooking(bookingId);
    throw e;
  }

  // Step 3 — verify signature. If verification fails, release the booking.
  try {
    return await verifyRazorpayPayment({
      bookingId,
      razorpay_order_id: rzp.razorpay_order_id,
      razorpay_payment_id: rzp.razorpay_payment_id,
      razorpay_signature: rzp.razorpay_signature,
    });
  } catch (e) {
    await cancelPendingBooking(bookingId);
    throw e;
  }
}

export default {
  getPaymentStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  cancelPendingBooking,
  openRazorpayCheckout,
  payWithRazorpay,
};