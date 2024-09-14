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
  { id: 4, name: 'Mushroom Grow Kit', price: 5.00 }
];

// Array to store orders
let orders = [];

// Route to get product list
app.get('/products', (req, res) => {
  res.json(products);
});

// Route to add a new order
app.post('/add-order', (req, res) => {
  const { customerID, productsOrdered, sgtTime } = req.body;
  let totalPrice = 0;

  // Process each product in the order
  const detailedProducts = productsOrdered.map(item => {
    const product = products.find(p => p.id == item.productId);
    const productTotal = product.price * item.quantity;
    totalPrice += productTotal;
    
    return {
      productName: product.name,
      price: product.price,
      quantity: item.quantity,
      total: productTotal
    };
  });

  // Create the order object with detailed product info
  const order = {
    customerID,
    productsOrdered: detailedProducts,
    totalPrice,
    sgtTime
  };

  // Add order to the list
  orders.push(order);
  res.json({ message: 'Order added successfully', order });
});

// Route to export orders as CSV
app.get('/export-csv', (req, res) => {
  const fields = ['customerID', 'productName', 'quantity', 'price', 'total', 'sgtTime'];
  
  // Flatten orders to individual products for CSV export
  const csvOrders = orders.flatMap(order => {
    return order.productsOrdered.map(product => ({
      customerID: order.customerID,
      productName: product.productName,
      quantity: product.quantity,
      price: product.price.toFixed(2),
      total: product.total.toFixed(2),
      sgtTime: order.sgtTime
    }));
  });

  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(csvOrders);

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