import { toast } from 'react-toastify';
import userApiClient from '../services/userApiClient';

export interface RazorpayOptions {
    key_id: string;
    amount: number;
    razorpayOrderId: string;
    orderId: string;
    customer?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    onSuccess: (verifyData: any) => void;
    onError?: (error: any) => void;
    onDismiss?: () => void;
}

export const openRazorpayCheckout = (options: RazorpayOptions) => {
    if (typeof (window as any).Razorpay === 'undefined') {
        toast.error('Payment gateway is currently loading or unavailable. Please refresh the page.');
        return;
    }

    const rzpOptions = {
        key: options.key_id,
        amount: options.amount,
        currency: 'INR',
        name: 'Naturalayam',
        description: `Order Payment for ${options.orderId}`,
        image: '/src/assets/images/favicon.png',
        order_id: options.razorpayOrderId,
        config: {
            display: {
                blocks: {
                    upi: {
                        name: 'UPI / QR Code',
                        instruments: [{ method: 'upi' }]
                    },
                    other_methods: {
                        name: 'Other Payment Methods',
                        instruments: [
                            { method: 'card' },
                            { method: 'netbanking' },
                            { method: 'wallet' }
                        ]
                    }
                },
                sequence: ['block.upi', 'block.other_methods']
            }
        },
        retry: {
            enabled: true,
            max_count: 3
        },
        handler: async (response: any) => {
            console.log('[Razorpay] Payment success response:', response);
            toast.info('Verifying payment, please wait...');
            try {
                const verifyRes = await userApiClient.post('/user/order/verify-payment', {
                    orderId: options.orderId,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature
                });

                if (verifyRes.data.success) {
                    toast.success('Payment verified successfully!');
                    window.dispatchEvent(new Event('cart-updated'));
                    options.onSuccess(verifyRes.data);
                } else {
                    console.error('[Verify] Failed:', verifyRes.data);
                    toast.error(verifyRes.data.message || 'Payment verification failed.');
                    if (options.onError) options.onError(verifyRes.data);
                }
            } catch (err: any) {
                console.error('[Verify] API Error:', err);
                toast.error(err.response?.data?.message || 'Error communicating with server for verification');
                if (options.onError) options.onError(err);
            }
        },
        prefill: {
            name: options.customer?.name || '',
            email: options.customer?.email || '',
            contact: options.customer?.contact || ''
        },
        theme: {
            color: '#0d6efd'
        },
        modal: {
            ondismiss: function () {
                console.log('[Razorpay] Modal closed by user');
                if (options.onDismiss) {
                    options.onDismiss();
                } else {
                    toast.info('Payment process was closed.');
                }
            }
        }
    };

    const rzp = new (window as any).Razorpay(rzpOptions);
    rzp.on('payment.failed', function (response: any) {
        console.error('[Razorpay] Payment failed event:', response.error);
        toast.error(response.error?.description || 'Payment failed.');
        if (options.onError) options.onError(response.error);
    });

    rzp.open();
};
