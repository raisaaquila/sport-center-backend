import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import PaymentPage from './PaymentPage';
import './App.css';

const HomePage = () => {
    const [packages, setPackages] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3000/api/packages')
            .then(response => response.json())
            .then(data => setPackages(data))
            .catch(error => console.error('Error fetching packages:', error));
    }, []);

    return (
        <div className="container">
            <h1>Sport Centre and Fitness Packages</h1>
            {packages.length === 0 ? (
                <p>Loading packages...</p>
            ) : (
                packages.map(pkg => (
                    <div key={pkg.id} className="package">
                        <h2>{pkg.name} - Rp{pkg.price}</h2>
                        <p>{pkg.description}</p>
                        <Link to={`/payment/${pkg.id}/${pkg.price}`}>
                            <button>Book Now</button>
                        </Link>
                    </div>
                ))
            )}
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/payment/:id/:price" element={<PaymentPage />} />
            </Routes>
        </Router>
    );
};

export default App;
