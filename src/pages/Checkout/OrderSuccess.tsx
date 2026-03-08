import React from 'react';
import { Link } from 'react-router-dom';
import bg2 from '../../assets/images/background/bg2.jpg';

const OrderSuccess: React.FC = () => {
    return (
        <div className="page-content">
            <div className="dz-bnr-inr" style={{ backgroundImage: `url(${bg2})` }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Order Success</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item active" aria-current="page">Order Success</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <section className="content-inner">
                <div className="container text-center">
                    <i className="fas fa-check-circle text-success" style={{ fontSize: '80px', marginBottom: '20px' }}></i>
                    <h2 className="mb-4">Thank you for your Order!</h2>
                    <p className="mb-4" style={{ fontSize: '18px' }}>
                        Your order has been placed successfully. We are processing it and will deliver it to your selected address soon.
                    </p>
                    <Link to="/shop" className="btn btn-secondary btn-lg rounded-0 px-5">CONTINUE SHOPPING</Link>
                </div>
            </section>
        </div>
    );
};

export default OrderSuccess;
