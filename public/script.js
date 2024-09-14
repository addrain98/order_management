// Fetch products from the server and populate the product dropdown
fetch('/products')
  .then(response => response.json())
  .then(products => {
    const productSelect = document.getElementById('product');
    products.forEach(product => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = `${product.name} - $${product.price.toFixed(2)}`;
      productSelect.appendChild(option);
    });
  });

// Handle form submission to add a new order
document.getElementById('orderForm').addEventListener('submit', function(event) {
  event.preventDefault();
  
  const productId = document.getElementById('product').value;
  const quantity = document.getElementById('quantity').value;
  
  // Generate a random Customer ID (6 digits)
  const customerID = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number

  // Get current date and time in SGT
  const currentDate = new Date();
  const sgtTime = currentDate.toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });

  // Post order to the server
  fetch('/add-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerID, productId, quantity, sgtTime })
  })
  .then(response => response.json())
  .then(data => {
    if (data.order) {
      // Add the order to the table after it's successfully added
      addOrderToTable(data.order);
      showSuccessMessage();  // Show success message
    } else {
      alert(data.error);
    }
  });
  
  // Clear form fields
  document.getElementById('orderForm').reset();
});

// Function to add an order to the table
function addOrderToTable(order) {
  const tableBody = document.getElementById('ordersTableBody'); // Select the table body by its ID
  const row = document.createElement('tr'); // Create a new row
  row.innerHTML = `
    <td>${order.customerID}</td>
    <td>${order.product}</td>
    <td>${order.quantity}</td>
    <td>${order.price.toFixed(2)}</td>
    <td>${order.total}</td>
    <td>${order.sgtTime}</td>
  `;
  tableBody.appendChild(row); // Append the new row to the table body
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