// Function to add items to cart and save to storage
function addToCart(name, price) {
    let cart = JSON.parse(localStorage.getItem('crochetCart')) || [];
    cart.push({ id: Date.now(), name: name, price: parseInt(price) });
    localStorage.setItem('crochetCart', JSON.stringify(cart));
    updateCartCount();
    alert(name + " added to cart!");
}

// Function to update the (0) in the navbar
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('crochetCart')) || [];
    const countElement = document.getElementById('cartCount');
    if (countElement) countElement.innerText = cart.length;
}

// Run this on every page load
document.addEventListener('DOMContentLoaded', updateCartCount);