// Fetch products from the server and populate the product dropdown
fetch('/products')
  .then(response => response.json())
  .then(products => {
    populateProductOptions(products);
  });

// Function to populate the product dropdown options
function populateProductOptions(products) {
  const productSelects = document.querySelectorAll('.product');
  productSelects.forEach(select => {
    products.forEach(product => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = `${product.name} - $${product.price.toFixed(2)}`;
      select.appendChild(option);
    });
  });
}

// Function to add a new product group (product + quantity input)
document.getElementById('addProduct').addEventListener('click', function() {
  const productsList = document.getElementById('productsList');
  
  // Clone the product item div to allow adding more products
  const newProductItem = document.querySelector('.product-item').cloneNode(true);
  newProductItem.querySelector('.quantity').value = ''; // Clear the quantity input
  productsList.appendChild(newProductItem);

  populateProductOptions(products); // Re-populate the product options for the new select
});

// Handle form submission to add a new order
document.getElementById('orderForm').addEventListener('submit', function(event) {
  event.preventDefault();
  
  const productItems = document.querySelectorAll('.product-item');
  const productsOrdered = [];

  productItems.forEach(item => {
    const productId = item.querySelector('.product').value;
    const quantity = item.querySelector('.quantity').value;
    productsOrdered.push({ productId, quantity });
  });

  // Generate a random Customer ID (6 digits)
  const customerID = Math.floor(100000 + Math.random() * 900000);

  // Get current date and time in SGT
  const currentDate = new Date();
  const sgtTime = currentDate.toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });

  // Post the order with multiple products to the server
  fetch('/add-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerID, productsOrdered, sgtTime })
  })
  .then(response => response.json())
  .then(data => {
    if (data.order) {
      // Add the order to the table after it's successfully added
      addOrderToTable(data.order);
      showSuccessMessage();
    } else {
      alert(data.error);
    }
  });

  // Clear form fields
  document.getElementById('orderForm').reset();
  document.getElementById('productsList').innerHTML = ''; // Clear all products and add one blank set
  const initialProductItem = document.createElement('div');
  initialProductItem.classList.add('mb-3', 'product-item');
  initialProductItem.innerHTML = `
    <label for="product" class="form-label">Product:</label>
    <select class="form-select product" required></select>
    <label for="quantity" class="form-label">Quantity:</label>
    <input type="number" class="form-control quantity" required>
  `;
  document.getElementById('productsList').appendChild(initialProductItem);
  populateProductOptions(products); // Re-populate options for the new product list
});

// Function to add an order to the table
function addOrderToTable(order) {
  const tableBody = document.getElementById('ordersTableBody');
  const row = document.createElement('tr');
  
  // Prepare the list of ordered products
  const productDetails = order.productsOrdered.map(item => {
    return `${item.productName} (x${item.quantity})`;
  }).join(', ');

  row.innerHTML = `
    <td>${order.customerID}</td>
    <td>${productDetails}</td>
    <td>${order.totalPrice.toFixed(2)}</td>
    <td>${order.sgtTime}</td>
  `;
  tableBody.appendChild(row);
}

// Function to show the success message
function showSuccessMessage() {
  const successMessage = document.getElementById('successMessage');
  successMessage.style.display = 'block';
  
  // Hide the message after 3 seconds
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 3000);
}

// Export orders as CSV
document.getElementById('exportCSV').addEventListener('click', function() {
  window.location.href = '/export-csv';
});