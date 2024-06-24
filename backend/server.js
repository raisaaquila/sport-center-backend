const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const stripe = require('stripe')('sk_test_51PVCQg01R18Q2twMsF4x8UfUJcy0nyqp9VQdzTCitWQJCzNxeLlVZcRte8bkfbazwg3tWeIxO8SgPu0DVSSdnCqP00iVG01XEi');

const app = express();
const port = 3000;
const db = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sportcenter',
    password: 'razk',
    port: 5432,
});

app.use(cors());
app.use(bodyParser.json());

// Retrieve packages from the database
app.get('/api/packages', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM packages');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ error: 'Failed to fetch packages' });
    }
});

// Retrieve package details by ID
app.get('/api/packages/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM packages WHERE id = $1', [id]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Package not found' });
        } else {
            res.json(rows[0]);
        }
    } catch (error) {
        console.error('Error fetching package details:', error);
        res.status(500).json({ error: 'Failed to fetch package details' });
    }
});

// Endpoint to process payments and record transactions
app.post('/api/charge', async (req, res) => {
    const { amount, source, packageId } = req.body;
    console.log(`Processing payment for amount: ${amount}, package ID: ${packageId}`);

    try {
        // Create a charge using the Stripe API
        const charge = await stripe.charges.create({
            amount: amount,
            currency: 'idr',
            source: source,
            description: `Payment for package ID ${packageId}`
        });

        console.log('Stripe charge response:', charge);

        // If charge is successful, record the transaction in the database
        if (charge.status === 'succeeded') {
            const sql = `
                INSERT INTO transactions (package_id, amount, stripe_charge_id, created_at)
                VALUES ($1, $2, $3, NOW()) RETURNING *`;
            const values = [packageId, amount, charge.id];
            const { rows } = await db.query(sql, values);

            console.log('Transaction recorded in database:', rows[0]);

            res.status(201).json({ message: 'Payment and transaction recorded successfully', transaction: rows[0] });
        } else {
            res.status(400).json({ message: 'Payment failed', charge });
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
