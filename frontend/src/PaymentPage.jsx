import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51PVCQg01R18Q2twMF0xXvMyRQY1jU5LWKEgGLcpLwvdlbyn0xgjFp1GpziydRF3pNLoAJNx0Pm3qQMK8E38QDNaN00k4QxTCDi');

const CheckoutForm = ({ price, packageId }) => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const card = elements.getElement(CardElement);
        const result = await stripe.createToken(card);

        if (result.error) {
            console.log(result.error.message);
        } else {
            fetch('http://localhost:3000/api/charge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: price, source: result.token.id, packageId })
            }).then(response => response.json())
              .then(data => {
                  alert('Payment successful!');
                  console.log(data);
              }).catch(error => {
                  console.error('Payment error:', error);
              });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="payment-form">
            <CardElement className="StripeElement" />
            <button type="submit" disabled={!stripe}>Pay</button>
        </form>
    );
};

const PaymentPage = () => {
    const { id, price } = useParams();
    const [packageDetails, setPackageDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:3000/api/packages`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => setPackageDetails(data))
            .catch(error => {
                console.error('Error fetching package details:', error);
                setError(error.message);
            });
    }, [id]);

    return (
        <div className="container">
            {error ? (
                <p>Error loading package details: {error}</p>
            ) : packageDetails ? (
                <>
                    <h1>Payment for Package: {packageDetails.name}</h1>
                    <p>{packageDetails.description}</p>
                    <Elements stripe={stripePromise}>
                        <CheckoutForm price={parseInt(price)} packageId={id} />
                    </Elements>
                </>
            ) : (
                <p>Loading package details...</p>
            )}
        </div>
    );
};

export default PaymentPage;
