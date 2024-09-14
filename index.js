const express = require('express');
const bodyParser = require('body-parser');
const { Parser } = require('json2csv');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

// List of predefined products
const products = [
  { id: 1, name: 'Ice Plant 50g', price: 4.40 },
  { id: 2, name: 'Salted Yuzu 3oz', price: 4.40 },
  { id: 3, name: 'Salted Yuzu 16oz', price: 14.80 },
  { id: 4, name: 'Mushroom Grow Kit', price: 5 }
];

// Array to store orders
let orders = [];

// Route to get product list
app.get('/products', (req, res) => {
  res.json(products);
});

// Route to add a new order
app.post('/add-order', (req, res) => {
  const { customerID, productId, quantity, sgtTime } = req.body;
  const product = products.find(p => p.id == productId);
  if (product) {
    const order = {
      customerID, // Customer ID is used now
      product: product.name,
      quantity: parseInt(quantity),
      price: product.price,
      total: (product.price * quantity).toFixed(2),
      sgtTime // Add date and time to the order
    };
    orders.push(order); // Add the order to the array of orders
    res.json({ message: 'Order added successfully', order }); // Return the order
  } else {
    res.status(400).json({ error: 'Invalid product ID' });
  }
});

// Route to export orders as CSV
app.get('/export-csv', (req, res) => {
  const json2csvParser = new Parser({ fields: ['customerName', 'product', 'quantity', 'price', 'total'] });
  const csv = json2csvParser.parse(orders);

  const filePath = './orders.csv';
  fs.writeFileSync(filePath, csv);

  res.download(filePath, 'orders.csv', err => {
    if (err) {
      res.status(500).send('Error downloading the file');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});