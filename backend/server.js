const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); //Required for calling external APIs
const bcrypt = require('bcrypt');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const rootDir = path.join(__dirname, '..');

// Load the API key from environment variables
const CURRENCY_API_KEY = process.env.CURRENCY_API_KEY; 
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

//Create an uploads folder to save picture for the medicine
const uploadDir = path.join(rootDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// login.html as the main page
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.use(express.static(rootDir, { index: false }));

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pharmahub_db_fa',
    dateStrings: true
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL!');
});

// ==================== 1. User Login Side ====================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) 
    {
        return res.status(400).json({ success: false, message: 'Username and password required.' });
    }

    const sql = 'SELECT * FROM staffs WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        
        if (results.length === 0) 
        {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, results[0].user_password);
        if (!match) 
        {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        res.json({ success: true, username: results[0].username });
    });
});

// ==================== 2. Medicine ====================
// Get medicine list with real-time stock 
app.get('/api/medicines', (req, res) => {
    const sql = `SELECT m.*, IFNULL(SUM(b.quantity), 0) AS current_units 
        FROM medicines m 
        LEFT JOIN batches b ON m.medicine_id = b.medicine_id 
        GROUP BY m.medicine_id
    `;
    db.query(sql, (err, results) => {
        if (err) 
            return res.status(500).json({ success: false, message: err.message });
        res.json(results);
    });
});

//Add new medicine
app.post('/add-medicine', (req, res) => {
    const { medicine_id, medicine_name, category, medicine_type, dosage_form, cost_price, selling_price, minStock, imageBase64, imageExt } = req.body;
    
    if (!medicine_id || !/^MED-\d{4}$/.test(medicine_id)) 
    {
        return res.status(400).json({ success: false, message: 'Medicine ID must be in format MED-XXXX.' });
    }

    if (!medicine_name || medicine_name.length < 2 || medicine_name.length > 50) 
    {
        return res.status(400).json({ success: false, message: 'Medicine name must be 2-50 characters.' });
    }

    if (!['Group B', 'Group C', 'Group OTC'].includes(category)) 
    {
        return res.status(400).json({ success: false, message: 'Invalid category.' });
    }

    if (!dosage_form || !['Tablet', 'Capsule', 'Chewable Tablet'].includes(dosage_form)) 
    {
        return res.status(400).json({ success: false, message: 'Invalid dosage form.' });
    }

    if (isNaN(cost_price) || Number(cost_price) < 0) 
    {
        return res.status(400).json({ success: false, message: 'Cost price must be a non-negative number.' });
    }

    if (isNaN(selling_price) || Number(selling_price) <= 0) 
    {
        return res.status(400).json({ success: false, message: 'Selling price must be greater than 0.' });
    }

    if (isNaN(minStock) || Number(minStock) < 0)
    {
        return res.status(400).json({ success: false, message: 'Min stock must be a non-negative number.' });
    }

    let imageUrl = null;
    if (imageBase64 && imageExt) {
        try {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `med_${Date.now()}.${imageExt}`;
            const filePath = path.join(rootDir, 'uploads', fileName);
            fs.writeFileSync(filePath, buffer);
            imageUrl = `/uploads/${fileName}`;
        } catch (fsErr) {
            return res.status(500).json({ success: false, message: 'Failed to save image: ' + fsErr.message });
        }
    }

    const sql = 'INSERT INTO medicines (medicine_id, medicine_name, category, medicine_type, dosage_form, cost_price, selling_price, minStock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [medicine_id, medicine_name, category, medicine_type, dosage_form, cost_price, selling_price, minStock, imageUrl], (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error inserting medicine: ' + err.message });
        }
        res.json({ success: true });
    });
});

// ==================== Edit Medicine (Update) ====================
app.post('/update-medicine', (req, res) => {
    const { medicine_id, medicine_name, category, medicine_type, dosage_form, cost_price, selling_price, minStock, imageBase64, imageExt } = req.body;
    
    if (!medicine_id || !/^MED-\d{4}$/.test(medicine_id)) 
    {
        return res.status(400).json({ success: false, message: 'Invalid medicine ID.' });
    }
    
    if (!medicine_name || medicine_name.length < 2 || medicine_name.length > 50)
    {
        return res.status(400).json({ success: false, message: 'Medicine name must be 2-50 characters.' });
    }
    
    if (isNaN(cost_price) || Number(cost_price) < 0) 
    {
        return res.status(400).json({ success: false, message: 'Cost price must be a non-negative number.' });
    }
    
    if (isNaN(selling_price) || Number(selling_price) <= 0) 
    {
        return res.status(400).json({ success: false, message: 'Selling price must be greater than 0.' });
    }
    let imageSqlPart = '';
    let params = [medicine_name, category, medicine_type, dosage_form, cost_price, selling_price, minStock];

    // Check if a new image was provided in the request
    if (imageBase64 && imageExt) {
        try {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `med_${Date.now()}.${imageExt}`;
            const filePath = path.join(rootDir, 'uploads', fileName);
            fs.writeFileSync(filePath, buffer);
            imageSqlPart = ', image_url = ?';
            params.push(`/uploads/${fileName}`);
        } 
        catch (fsErr) {
            return res.status(500).json({ success: false, message: 'Failed to update image: ' + fsErr.message });
        }
    }

    params.push(medicine_id);
    const sql = `UPDATE medicines SET medicine_name = ?, category = ?, medicine_type = ?, dosage_form = ?, cost_price = ?, selling_price = ?, minStock = ? ${imageSqlPart} WHERE medicine_id = ?`;

    db.query(sql, params, (err) => {
        if (err) 
            return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});

// ==================== Delete Medicine (Delete) ====================
app.post('/api/delete-medicine', (req, res) => {
    const { medicine_id } = req.body;

    if (!medicine_id || !/^MED-\d{4}$/.test(medicine_id)) 
    {
        return res.status(400).json({ success: false, message: 'Invalid medicine ID.' });
    }

    // Check Medicine Stock
    const checkStockSql = 'SELECT SUM(quantity) AS total_stock FROM batches WHERE medicine_id = ? AND quantity > 0';
    db.query(checkStockSql, [medicine_id], (err, results) => {
        if (err) 
            return res.status(500).json({ success: false, message: err.message });

        const totalStock = results[0].total_stock || 0;
        if (totalStock > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete medicine. There are still ${totalStock} units in stock!` 
            });
        }

        // Delete when the medicine id out of stock
        const deleteSql = 'DELETE FROM medicines WHERE medicine_id = ?';
        db.query(deleteSql, [medicine_id], (err2) => {
            if (err2) 
                return res.status(500).json({ success: false, message: err2.message });
            res.json({ success: true });
        });
    });
});

// ==================== Batches ====================
app.get('/api/batches', (req, res) => {
    const sql = `
        SELECT b.*, m.medicine_name, m.category, m.cost_price 
        FROM batches b
        JOIN medicines m ON b.medicine_id = m.medicine_id
    `;
    db.query(sql, (err, results) => {
        if (err) 
            return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==================== (Stock In) ====================
app.post('/add-stock-in', async (req, res) => {
    // Receive supplier and currency information from the frontend request
    const { medicine_id, quantity, expiry_date, username, supplier_id, original_currency, original_price } = req.body;
    const qtyNum = parseInt(quantity, 10);
    const origPriceNum = parseFloat(original_price) || 0;
    const currency = original_currency || 'MYR';

    if (!medicine_id || !/^MED-\d{4}$/.test(medicine_id)) {
        return res.status(400).json({ success: false, message: 'Invalid medicine ID format.' });
    }
    if (!qtyNum || qtyNum <= 0 || qtyNum > 100000) {
        return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 100,000.' });
    }
    if (!expiry_date || !/^\d{4}-\d{2}-\d{2}$/.test(expiry_date)) {
        return res.status(400).json({ success: false, message: 'Invalid expiry date format.' });
    }

    // Expiry must be at least 30 days in the future
    const minExpiry = new Date();
    minExpiry.setDate(minExpiry.getDate() + 30);
    if (new Date(expiry_date) < minExpiry) {
        return res.status(400).json({ success: false, message: 'Expiry must be at least 30 days from today.' });
    }

    // Original price must be non-negative
    if (isNaN(origPriceNum) || origPriceNum < 0) {
        return res.status(400).json({ success: false, message: 'Original price must be a non-negative number.' });
    }

    // Currency code must be a valid 3-letter code
    const validCurrencies = ['MYR', 'USD', 'CNY', 'SGD', 'EUR', 'GBP'];
    if (!validCurrencies.includes(currency)) {
        return res.status(400).json({ success: false, message: 'Unsupported currency.' });
    }

    try {
        // Fetch staff details for audit logging
        const staff = await new Promise((resolve, reject) => {
            db.query('SELECT user_id, username FROM staffs WHERE username = ?', [username], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || { user_id: null, username: 'Unknown' });
            });
        });

        // Initialize exchange rate and final MYR cost price
        let exchangeRate = 1.0000;
        let finalCostPrice = origPriceNum;

        // If the supplier uses a foreign currency, fetch live exchange rate via CurrencyAPI
        if (currency !== 'MYR') {
            if (!CURRENCY_API_KEY) {
                throw new Error('Currency API Key is missing in environment variables.');
            }

            const apiResponse = await axios.get('https://api.currencyapi.com/v3/latest', {
                params: {
                    apikey: CURRENCY_API_KEY,
                    base_currency: currency,
                    currencies: 'MYR'
                }
            });

            // Safely extract the MYR exchange rate value from API response
            const rate = apiResponse.data?.data?.MYR?.value;
            if (!rate) {
                throw new Error('Failed to retrieve exchange rate for MYR.');
            }

            exchangeRate = Number(rate.toFixed(4));
            finalCostPrice = Number((origPriceNum * exchangeRate).toFixed(2));
        }

        // Generate batch identification details
        const { nextBatchId, nextBatchNumber } = await generateNextBatchDetails();
        const inbound_date = new Date().toISOString().slice(0, 10);

        // Insert new stock batch into database with foreign currency details
        await new Promise((resolve, reject) => {
            const batchSql = `
                INSERT INTO batches 
                (batch_id, medicine_id, batch_number, inbound_date, expiry_date, quantity, supplier_id, original_currency, original_price, exchange_rate) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(
                batchSql, 
                [nextBatchId, medicine_id, nextBatchNumber, inbound_date, expiry_date, qtyNum, supplier_id || null, currency, origPriceNum, exchangeRate], 
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });

        // Generate transaction log details
        const { nextTxnId, nextTxnCode } = await generateNextTxnDetails();

        const txnSql = `
            INSERT INTO stock_transaction 
            (txn_id, txn_code, batch_id, medicine_id, txn_type, qty_change, reason, user_id, user_name) 
            VALUES (?, ?, ?, ?, 'Stock In', ?, 'Add Stock', ?, ?)
        `;
        db.query(txnSql, [nextTxnId, nextTxnCode, nextBatchId, medicine_id, qtyNum, staff ? staff.user_id : null, staff ? staff.username : username], (err2) => {
            if (err2) return res.status(500).json({ success: false, message: err2.message });
            res.json({ 
                success: true, 
                converted_cost: finalCostPrice, 
                exchange_rate: exchangeRate 
            });
        });
    } 
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== Stock Out ====================
app.post('/add-stock-out', async (req, res) => {
    const { medicine_id, deduct_qty, reason, username } = req.body;
    let remainingToDeduct = parseInt(deduct_qty, 10);

    if (!medicine_id || !remainingToDeduct || remainingToDeduct <= 0) 
    {
        return res.status(400).json({ success: false, message: 'Please provide a valid medicine and quantity.' });
    }

    const findBatchesSql = `
        SELECT batch_id, quantity FROM batches 
        WHERE medicine_id = ? AND quantity > 0 AND (expiry_date > CURDATE() OR expiry_date IS NULL) 
        ORDER BY expiry_date ASC, batch_id ASC
    `;

    db.query(findBatchesSql, [medicine_id], async (err, batches) => {
        if (err)
            return res.status(500).json({ success: false, message: err.message });

        if (!batches || batches.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid sellable batches available.' });
        }

        const totalValidStock = batches.reduce((sum, b) => sum + Number(b.quantity), 0);
        if (remainingToDeduct > totalValidStock) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock! Total sellable units: ${totalValidStock}`
            });
        }

        try {
            // Fetch full staff record (user_id needed for FK)
            const staff = await new Promise((resolve, reject) => {
            db.query('SELECT user_id, username FROM staffs WHERE username = ?', [username], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || { user_id: null, username: 'Unknown' });
            });
        });

            let lastTxnId = null;
            let lastTxnCode = null;

            // FEFO loop — deduct from earliest-expiry batches first
            for (let i = 0; i < batches.length && remainingToDeduct > 0; i++) {
                const batch = batches[i];
                const currentBatchQty = Number(batch.quantity);

                let deductFromThisBatch = 0;
                if (currentBatchQty <= remainingToDeduct) {
                    deductFromThisBatch = currentBatchQty;
                    remainingToDeduct -= currentBatchQty;
                } else {
                    deductFromThisBatch = remainingToDeduct;
                    remainingToDeduct = 0;
                }

                const newBatchQty = currentBatchQty - deductFromThisBatch;

                await new Promise((resolve, reject) => {
                    db.query('UPDATE batches SET quantity = ? WHERE batch_id = ?',
                        [newBatchQty, batch.batch_id], (e) => {
                            if (e) return reject(e);
                            resolve();
                        });
                });

                const { nextTxnId, nextTxnCode } = await generateNextTxnDetails();

                // Save for the delivery insert below
                lastTxnId = nextTxnId;
                lastTxnCode = nextTxnCode;

                const txnSql = `
                    INSERT INTO stock_transaction 
                    (txn_id, txn_code, batch_id, medicine_id, txn_type, qty_change, reason, user_id, user_name) 
                    VALUES (?, ?, ?, ?, "Stock Out", ?, ?, ?, ?)
                `;
                await new Promise((resolve, reject) => {
                    db.query(txnSql,
                        [nextTxnId, nextTxnCode, batch.batch_id, medicine_id,
                         -deductFromThisBatch, reason, staff.user_id, staff.username],
                        (e) => {
                            if (e) return reject(e);
                            resolve();
                        });
                });
            }

            // ===== Delivery record (if requested) =====
            if (req.body.delivery_required && req.body.customerAddress) {

                const customerName    = (req.body.customerName || '').trim();
                const customerPhone   = (req.body.customerPhone || '').trim();
                const customerAddress = (req.body.customerAddress || '').trim();

                if (customerName.length < 2 || customerName.length > 100) {
                    return res.status(400).json({ success: false, message: 'Customer name must be 2-100 characters.' });
                }
                if (!/^[\d\-\+\s()]{7,20}$/.test(customerPhone)) {
                    return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
                }
                if (customerAddress.length < 5 || customerAddress.length > 500) {
                    return res.status(400).json({ success: false, message: 'Address must be 5-500 characters.' });
                }

                const deliveryId = await generateNextDeliveryId();

                await new Promise((resolve, reject) => {
                    const deliverySql = `
                        INSERT INTO deliveries 
                        (delivery_id, txn_id, customer_name, customer_phone, delivery_address) 
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    db.query(deliverySql,
                        [deliveryId, lastTxnId, customerName, customerPhone, customerAddress],
                        (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                });
            }

            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
});


// ==================== Geoapify Delivery Route API ====================
app.get('/api/delivery-route', async (req, res) => {
    try {
        const { destination } = req.query; 
        if (!destination) {
            return res.status(400).json({ success: false, message: 'Please provide a destination address.' });
        }

        if (!GEOAPIFY_API_KEY) {
            throw new Error('Geoapify API Key is missing in environment variables.');
        }

        const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(destination)}&apiKey=${GEOAPIFY_API_KEY}`;
        const geoRes = await axios.get(geocodeUrl);
        
        const features = geoRes.data?.features;
        if (!features || features.length === 0) {
            return res.status(400).json({ success: false, message: 'Address not found.' });
        }

        const [custLon, custLat] = features[0].geometry.coordinates;

        const pharmaLat = 4.5826373672262095;
        const pharmaLon = 101.094879435582;

        const routingUrl = `https://api.geoapify.com/v1/routing?waypoints=${pharmaLat},${pharmaLon}|${custLat},${custLon}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
        const routeRes = await axios.get(routingUrl);
        
        const routeResult = routeRes.data?.features?.[0];
        if (!routeResult) {
            return res.status(400).json({ success: false, message: 'Failed to calculate route.' });
        }

        const props = routeResult.properties;
        res.json({
            success: true,
            destination_lat: custLat,
            destination_lng: custLon,
            distance: (props.distance / 1000).toFixed(2), 
            duration: Math.round(props.time / 60)         
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== OpenWeatherMap — Destination Weather ====================
app.get('/api/delivery-weather', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ 
                success: false, 
                message: 'Latitude and longitude are required.' 
            });
        }

        if (!OPENWEATHER_API_KEY) {
            throw new Error('OpenWeather API Key is missing in environment variables.');
        }

        const url = `https://api.openweathermap.org/data/2.5/weather` +
            `?lat=${lat}&lon=${lon}` +
            `&appid=${OPENWEATHER_API_KEY}` +
            `&units=metric`;

        const apiRes = await axios.get(url);
        const data = apiRes.data;

        // Classify delivery risk based on weather condition
        const weatherMain = data.weather[0].main;
        let risk = 'Low';
        let riskColor = 'green';

        if (weatherMain === 'Rain' || weatherMain === 'Drizzle') {
            risk = 'Medium';
            riskColor = 'orange';
        } 
        else if (weatherMain === 'Thunderstorm' || weatherMain === 'Snow') {
            risk = 'High';
            riskColor = 'red';
        }

        res.json({
            success: true,
            city: data.name,
            condition: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            temp: Math.round(data.main.temp),
            humidity: data.main.humidity,
            wind: data.wind.speed,
            risk: risk,
            riskColor: riskColor
        });
    } catch (error) {
        console.error('Weather API error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== Geoapify Address Autocomplete ====================
app.get('/api/address-autocomplete', async (req, res) => {
    try {
        const { text } = req.query;
        if (!text || text.length < 3) {
            return res.json({ success: true, suggestions: [] });
        }

        const url = `https://api.geoapify.com/v1/geocode/autocomplete` +
            `?text=${encodeURIComponent(text)}` +
            `&bias=proximity:101.094879435582,4.5826373672262095` +
            `&limit=5` +
            `&apiKey=${GEOAPIFY_API_KEY}`;

        const apiRes = await axios.get(url);
        const features = apiRes.data?.features || [];

        const suggestions = features.map(f => ({
            formatted: f.properties.formatted,
            lat: f.properties.lat,
            lon: f.properties.lon
        }));

        res.json({ success: true, suggestions });
    } catch (error) {
        console.error('Autocomplete error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== Write Off Medicine (After expiry date) ====================
app.post('/api/write-off-batch', async (req, res) => {
    const { batch_id, medicine_id, quantity, username } = req.body;

    // Input validation
    if (!batch_id || !medicine_id) {
        return res.status(400).json({ success: false, message: 'Batch ID and Medicine ID are required.' });
    }

    try {
        // ⭐ Fetch staff record for audit logging
        const staff = await new Promise((resolve, reject) => {
            db.query('SELECT user_id, username FROM staffs WHERE username = ?', [username], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || { user_id: null, username: 'Unknown' });
            });
        });

        // Zero out the batch
        await new Promise((resolve, reject) => {
            db.query('UPDATE batches SET quantity = 0 WHERE batch_id = ?', [batch_id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // Generate transaction ID
        const { nextTxnId, nextTxnCode } = await generateNextTxnDetails();

        const txnSql = `
            INSERT INTO stock_transaction 
            (txn_id, txn_code, batch_id, medicine_id, txn_type, qty_change, reason, user_id, user_name) 
            VALUES (?, ?, ?, ?, "Stock Out", ?, "Expired Write-off (Loss)", ?, ?)
        `;

        db.query(txnSql, [
            nextTxnId, nextTxnCode, batch_id, medicine_id,
            -Number(quantity),
            staff.user_id,       
            staff.username       
        ], (err2) => {
            if (err2) 
                return res.status(500).json({ success: false, message: err2.message });
            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== 6. Report ====================
app.get('/api/reports', (req, res) => {
    const sql = `
        SELECT 
            t.*, 
            m.medicine_name,
            b.original_currency,
            b.original_price,
            b.exchange_rate,
            b.supplier_id,
            s.supplier_name
        FROM stock_transaction t
        LEFT JOIN medicines m ON t.medicine_id = m.medicine_id
        LEFT JOIN batches  b ON t.batch_id   = b.batch_id
        LEFT JOIN suppliers s ON b.supplier_id = s.supplier_id
        ORDER BY t.txn_time DESC
    `;
    db.query(sql, (err, results) => {
        if (err) 
            return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==================== 7. Deliveries ====================
// Get all delivery records (joined with transaction + medicine info)
app.get('/api/deliveries', (req, res) => {
    const sql = `
        SELECT 
            d.*,
            t.txn_code,
            t.txn_time,
            t.medicine_id,
            t.qty_change,
            m.medicine_name
        FROM deliveries d
        LEFT JOIN stock_transaction t ON d.txn_id = t.txn_id
        LEFT JOIN medicines m ON t.medicine_id = m.medicine_id
        ORDER BY d.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) 
            return res.status(500).json({ success: false, message: err.message });
        res.json(results);
    });
});

/*======Update delivery status (Pending / In Transit / Delivered / Cancelled)======*/
app.post('/api/deliveries/update-status', (req, res) => {
    const { delivery_id, delivery_status } = req.body;

    if (!delivery_id || !/^DLV-\d{4}$/.test(delivery_id)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid delivery ID format (must be DLV-XXXX).' 
        });
    }

    const allowed = ['Pending', 'In Transit', 'Delivered', 'Cancelled'];
    if (!allowed.includes(delivery_status)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid delivery status.' 
        });
    }

    db.query(
        'UPDATE deliveries SET delivery_status = ? WHERE delivery_id = ?',
        [delivery_status, delivery_id],
        (err, result) => {
            if (err) 
                return res.status(500).json({ success: false, message: err.message });
            if (result.affectedRows === 0) 
                return res.status(404).json({ success: false, message: 'Delivery not found.' });
            res.json({ success: true });
        }
    );
});

// =========== Create batch_id (BTH-100X) and batch_number (BN-YYYYMMDD-XX) =========
function generateNextBatchDetails() {
    return new Promise((resolve, reject) => {
        // Check the larger number of batch_id
        const maxSql = `SELECT MAX(CAST(SUBSTRING_INDEX(batch_id, '-', -1) AS UNSIGNED)) AS max_id_num FROM batches`;

        db.query(maxSql, (err, resMax) => {
            if (err) 
                return reject(err);

            //Increase value from the larger batch_id
            const nextNum = (resMax[0].max_id_num && resMax[0].max_id_num >= 1000) 
                ? resMax[0].max_id_num + 1 
                : 1001;
            const nextBatchId = `BTH-${nextNum}`;

            // Getting the Date with Format YYYYMMDD
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const bnPrefix = `BN-${y}${m}${d}-`;

            // Check how many batches have been generated for the same day
            const bnSql = `SELECT batch_number FROM batches WHERE batch_number LIKE ? ORDER BY batch_number DESC LIMIT 1`;
            db.query(bnSql, [`${bnPrefix}%`], (err2, resBn) => {
                if (err2) 
                    return reject(err2);

                let seq = 1;
                if (resBn.length > 0 && resBn[0].batch_number) {
                    const parts = resBn[0].batch_number.split('-');
                    seq = parseInt(parts[2], 10) + 1;
                }
                const nextBatchNumber = `${bnPrefix}${String(seq).padStart(2, '0')}`;

                resolve({ nextBatchId, nextBatchNumber });
            });
        });
    });
}

// =========== Create Fixed Format Of Transaction ID and Code =========
function generateNextTxnDetails() {
    return new Promise((resolve, reject) => {
        // 1. Check the MAX Value of txn_id 
        const maxSql = `
            SELECT MAX(CAST(SUBSTRING_INDEX(txn_id, '-', -1) AS UNSIGNED)) AS max_id_num
            FROM stock_transaction
        `;
        db.query(maxSql, (err, resMax) => {
            if (err) 
                return reject(err);

            //Increase the number id from max_id
            const nextNum = (resMax[0].max_id_num && resMax[0].max_id_num >= 1000) 
                ? resMax[0].max_id_num + 1 
                : 1001;
            const nextTxnId = `TSC-${nextNum}`;

            // 2. Getting the Date Format YYYYMMDD
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const datePrefix = `TXN-${y}${m}${d}-`;

            // Check how many transactions have been generated for the same day
            const codeSql = `SELECT txn_code FROM stock_transaction WHERE txn_code LIKE ? ORDER BY txn_code DESC LIMIT 1`;
            db.query(codeSql, [`${datePrefix}%`], (err2, resCode) => {
                if (err2) 
                    return reject(err2);

                let seq = 1;
                if (resCode.length > 0) {
                    const lastCode = resCode[0].txn_code;
                    const parts = lastCode.split('-');
                    seq = parseInt(parts[2], 10) + 1;
                }
                const nextTxnCode = `${datePrefix}${String(seq).padStart(3, '0')}`;

                resolve({ nextTxnId, nextTxnCode });
            });
        });
    });
}

// =========== Create delivery_id (DLV-1001) =========
function generateNextDeliveryId() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT MAX(CAST(SUBSTRING_INDEX(delivery_id, '-', -1) AS UNSIGNED)) AS max_id_num 
            FROM deliveries
        `;
        db.query(sql, (err, result) => {
            if (err) return reject(err);

            const nextNum = (result[0].max_id_num && result[0].max_id_num >= 1000)
                ? result[0].max_id_num + 1
                : 1001;

            resolve(`DLV-${nextNum}`);
        });
    });
}
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});