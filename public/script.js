let productsListData = []; // Store products fetched from the server
let editingOrder = null; // To keep track of the order being edited

// Fetch products from the server and populate the product dropdown
fetch('/products')
  .then(response => response.json())
  .then(products => {
    productsListData = products; // Store the products in a global variable
    populateProductOptions(document.querySelectorAll('.product')); // Populate the initial product dropdown
  });

// Function to populate the product dropdown options
function populateProductOptions(productSelects) {
  productSelects.forEach(select => {
    select.innerHTML = ''; // Clear any existing options
    productsListData.forEach(product => {
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

  // Re-populate the product options for the newly added dropdown
  const newProductSelect = newProductItem.querySelector('.product');
  populateProductOptions([newProductSelect]); // Pass in an array of the new select element
});

// Handle form submission to add or update an order
document.getElementById('orderForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const productItems = document.querySelectorAll('.product-item');
  const productsOrdered = [];

  productItems.forEach(item => {
    const productId = item.querySelector('.product').value;
    const quantity = item.querySelector('.quantity').value;
    productsOrdered.push({ productId, quantity });
  });

  // Get current date and time in SGT
  const currentDate = new Date();
  const sgtTime = currentDate.toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });

  if (editingOrder) {
    // If we are editing an existing order, send an update request
    fetch(`/update-order/${editingOrder.customerID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productsOrdered, sgtTime })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Order updated successfully') {
        updateOrderInTable(data.order);
        showSuccessMessage('Order updated successfully!');
        editingOrder = null; // Reset after editing
        resetForm();
      } else {
        alert('Error updating order');
      }
    });
  } else {
    // Generate a random Customer ID (6 digits) for a new order
    const customerID = Math.floor(100000 + Math.random() * 900000);

    // Post the order with multiple products to the server
    fetch('/add-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerID, productsOrdered, sgtTime })
    })
    .then(response => response.json())
    .then(data => {
      if (data.order) {
        addOrderToTable(data.order);
        showSuccessMessage('Order added successfully!');
        resetForm();
      } else {
        alert(data.error);
      }
    });
  }
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
    <td>
      <button class="btn btn-warning btn-sm editOrder" data-customer-id="${order.customerID}">Edit</button>
      <button class="btn btn-danger btn-sm deleteOrder" data-customer-id="${order.customerID}">Delete</button>
    </td>
  `;
  tableBody.appendChild(row);

  // Add event listeners for edit and delete buttons
  row.querySelector('.editOrder').addEventListener('click', function() {
    const customerId = this.getAttribute('data-customer-id');
    editOrder(customerId);
  });

  row.querySelector('.deleteOrder').addEventListener('click', function() {
    const customerId = this.getAttribute('data-customer-id');
    deleteOrder(customerId, row);
  });
}

// Function to handle editing an order
function editOrder(customerId) {
  fetch(`/get-order/${customerId}`)
    .then(response => response.json())
    .then(order => {
      editingOrder = order; // Keep track of the order being edited

      // Populate the form with the existing order details
      const productsList = document.getElementById('productsList');
      productsList.innerHTML = ''; // Clear the current form

      order.productsOrdered.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('mb-3', 'product-item');
        productItem.innerHTML = `
          <label for="product" class="form-label">Product:</label>
          <select class="form-select product" required></select>
          <label for="quantity" class="form-label">Quantity:</label>
          <input type="number" class="form-control quantity" value="${product.quantity}" required>
        `;
        productsList.appendChild(productItem);
        populateProductOptions([productItem.querySelector('.product')]);
        productItem.querySelector('.product').value = productsListData.find(p => p.name === product.productName).id;
      });

      document.querySelector('button[type="submit"]').textContent = 'Save Changes'; // Change button text
    });
}

// Function to update the order in the table after editing
function updateOrderInTable(updatedOrder) {
  const rows = document.querySelectorAll('#ordersTableBody tr');
  rows.forEach(row => {
    if (row.querySelector('.editOrder').getAttribute('data-customer-id') === updatedOrder.customerID.toString()) {
      const productDetails = updatedOrder.productsOrdered.map(item => {
        return `${item.productName} (x${item.quantity})`;
      }).join(', ');

      row.innerHTML = `
        <td>${updatedOrder.customerID}</td>
        <td>${productDetails}</td>
        <td>${updatedOrder.totalPrice.toFixed(2)}</td>
        <td>${updatedOrder.sgtTime}</td>
        <td>
          <button class="btn btn-warning btn-sm editOrder" data-customer-id="${updatedOrder.customerID}">Edit</button>
          <button class="btn btn-danger btn-sm deleteOrder" data-customer-id="${updatedOrder.customerID}">Delete</button>
        </td>
      `;

      // Reattach event listeners for edit and delete buttons
      row.querySelector('.editOrder').addEventListener('click', function() {
        editOrder(updatedOrder.customerID);
      });
      row.querySelector('.deleteOrder').addEventListener('click', function() {
        deleteOrder(updatedOrder.customerID, row);
      });
    }
  });
}

// Function to delete an order
function deleteOrder(customerId, row) {
  // Send a delete request to the server
  fetch(`/delete-order/${customerId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Order deleted successfully') {
      // Remove the row from the table
      row.remove();
    } else {
      alert('Error deleting order');
    }
  })
  .catch(err => console.error('Error deleting order:', err));
}

// Function to reset the form after adding/updating an order
function resetForm() {
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
  populateProductOptions(document.querySelectorAll('.product')); // Re-populate options for the new product list

  document.querySelector('button[type="submit"]').textContent = 'Add Order'; // Reset button text
}

// Function to show the success message
function showSuccessMessage(message) {
  const successMessage = document.getElementById('successMessage');
  successMessage.textContent = message;
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