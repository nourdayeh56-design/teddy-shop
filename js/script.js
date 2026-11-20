// Teddy Bear Shop — storefront interactions
"use strict";

// IMPORTANT: keep your deployed Google Apps Script URL here.
const SHEET_URL = "https://script.google.com/macros/s/AKfycbzsbN1JwUffjUaLVU-qGYkWe38K0bIcoj3LPyt3pNOB5mPLUoySO5EyCuSRmw2Q0R0/exec";

// Demo delivery fees in TND. Replace these amounts with your real courier prices.
const DELIVERY_FEES = {
  "Tunis": 7, "Ariana": 7, "Ben Arous": 7, "Manouba": 7,
  "Sousse": 10, "Monastir": 10, "Nabeul": 10, "Bizerte": 10, "Sfax": 12, "Other": 15
};
const FREE_DELIVERY_FROM = 100;
const PROMO_CODES = { TEDDY10: { type: "percent", value: 10 }, WELCOME5: { type: "fixed", value: 5 } };

let cart = JSON.parse(localStorage.getItem("teddyCart") || "[]");
let appliedPromo = "";
let activeCategory = "all";
let activeProduct = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const money = (value) => Number(value || 0).toFixed(2);
const productCards = $$(".product-card");

const overlay = $("#cart-overlay");
const cartItems = $("#cart-items");
const cartEmpty = $("#cart-empty");
const cartCount = $("#cart-count");
const cartSubtotal = $("#cart-subtotal");
const cartDiscount = $("#cart-discount");
const cartDelivery = $("#cart-delivery");
const cartTotal = $("#cart-total");
const orderForm = $("#order-form");
const cartContent = $("#cart-content");
const orderSuccess = $("#order-success");

function getProductFromCard(card) {
  return {
    id: card.dataset.id,
    name: card.dataset.name,
    price: Number(card.dataset.price),
    stock: Number(card.dataset.stock),
    image: card.querySelector("img").getAttribute("src"),
    description: card.dataset.description || ""
  };
}
function saveCart() {
  localStorage.setItem("teddyCart", JSON.stringify(cart));
}
function subtotalValue() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}
function discountValue() {
  const promo = PROMO_CODES[appliedPromo];
  if (!promo) return 0;
  const subtotal = subtotalValue();
  return Math.min(subtotal, promo.type === "percent" ? subtotal * promo.value / 100 : promo.value);
}
function deliveryValue() {
  const city = $("#order-city")?.value;
  if (subtotalValue() - discountValue() >= FREE_DELIVERY_FROM) return 0;
  return city && DELIVERY_FEES[city] !== undefined ? DELIVERY_FEES[city] : 0;
}
function totalValue() {
  return Math.max(0, subtotalValue() - discountValue()) + deliveryValue();
}
function updateTotals() {
  cartSubtotal.textContent = money(subtotalValue());
  cartDiscount.textContent = money(discountValue());
  cartDelivery.textContent = money(deliveryValue());
  cartTotal.textContent = money(totalValue());
  $("#checkout-total").textContent = money(totalValue());
}
function renderCart() {
  cartItems.innerHTML = "";
  cart = cart.filter(item => item && item.id && item.qty > 0);
  cart.forEach(item => {
    const li = document.createElement("li");
    li.className = "cart-item";
    const left = document.createElement("div");
    const title = document.createElement("div");
    title.className = "cart-item-title";
    title.textContent = item.name;
    const price = document.createElement("div");
    price.className = "cart-item-price";
    price.textContent = `${money(item.price * item.qty)} TND`;
    left.append(title, price);
    const actions = document.createElement("div");
    actions.className = "cart-item-actions";
    const minus = document.createElement("button");
    minus.className = "qty-btn"; minus.type = "button"; minus.textContent = "−";
    minus.dataset.action = "minus"; minus.dataset.id = item.id; minus.setAttribute("aria-label", "Decrease quantity");
    const quantity = document.createElement("span"); quantity.textContent = item.qty;
    const plus = document.createElement("button");
    plus.className = "qty-btn"; plus.type = "button"; plus.textContent = "+";
    plus.dataset.action = "plus"; plus.dataset.id = item.id; plus.setAttribute("aria-label", "Increase quantity");
    const remove = document.createElement("button");
    remove.className = "remove-btn"; remove.type = "button"; remove.textContent = "🗑";
    remove.dataset.action = "remove"; remove.dataset.id = item.id; remove.setAttribute("aria-label", "Remove product");
    actions.append(minus, quantity, plus, remove);
    li.append(left, actions);
    cartItems.appendChild(li);
  });
  cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  cartEmpty.hidden = cart.length > 0;
  saveCart();
  updateTotals();
}
function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  const currentQty = existing ? existing.qty : 0;
  if (currentQty >= product.stock) {
    alert("Sorry, the available demo stock for this bear has been reached.");
    return;
  }
  if (existing) existing.qty++;
  else cart.push({ id: product.id, name: product.name, price: product.price, qty: 1, stock: product.stock });
  renderCart();
}
productCards.forEach(card => {
  card.querySelector(".add-cart").addEventListener("click", () => addToCart(getProductFromCard(card)));
  card.querySelector(".quick-view").addEventListener("click", () => openProductDialog(getProductFromCard(card)));
});
cartItems.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = cart.find(product => product.id === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === "plus") {
    if (item.qty < item.stock) item.qty++;
    else alert("No more demo stock available for this bear.");
  } else if (button.dataset.action === "minus") {
    item.qty--;
    if (item.qty <= 0) cart = cart.filter(product => product.id !== item.id);
  } else if (button.dataset.action === "remove") {
    cart = cart.filter(product => product.id !== item.id);
  }
  renderCart();
});
$("#clear-cart").addEventListener("click", () => {
  if (!cart.length) return;
  if (confirm("Clear all products from your cart?")) {
    cart = []; appliedPromo = ""; $("#promo-input").value = "";
    $("#promo-result").textContent = ""; renderCart();
  }
});

function openCart() {
  overlay.classList.add("open");
  cartContent.hidden = false; orderForm.hidden = true; orderSuccess.hidden = true;
  document.body.style.overflow = "hidden";
}
function closeCart() {
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}
$("#cart-btn").addEventListener("click", openCart);
$("#cart-close").addEventListener("click", closeCart);
overlay.addEventListener("click", event => { if (event.target === overlay) closeCart(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") { closeCart(); $("#product-dialog").close?.(); } });

$("#apply-promo").addEventListener("click", () => {
  const code = $("#promo-input").value.trim().toUpperCase();
  if (!code) { appliedPromo = ""; $("#promo-result").textContent = "Enter a promo code."; }
  else if (PROMO_CODES[code]) {
    appliedPromo = code;
    $("#promo-input").value = code;
    $("#promo-result").textContent = code === "TEDDY10" ? "10% discount applied!" : "5 TND discount applied!";
  } else {
    appliedPromo = "";
    $("#promo-result").textContent = "This promo code is not valid.";
  }
  updateTotals();
});
$("#order-city").addEventListener("change", () => {
  const city = $("#order-city").value;
  $("#delivery-hint").textContent = city
    ? (subtotalValue() - discountValue() >= FREE_DELIVERY_FROM ? "Your order qualifies for free delivery!" : `Estimated delivery: ${DELIVERY_FEES[city]} TND.`)
    : "Choose a governorate to calculate delivery.";
  updateTotals();
});
$("#checkout-btn").addEventListener("click", () => {
  if (!cart.length) { alert("Your cart is empty!"); return; }
  cartContent.hidden = true; orderForm.hidden = false;
  updateTotals();
});
$("#back-cart").addEventListener("click", () => { orderForm.hidden = true; cartContent.hidden = false; });

function makeOrderId() {
  return "TB-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14) + "-" + Math.floor(1000 + Math.random() * 9000);
}
function setSubmitting(button, state) {
  button.disabled = state;
  button.textContent = state ? "Sending..." : "Place order →";
}
orderForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!cart.length) { alert("Your cart is empty."); return; }
  const name = $("#order-name").value.trim();
  const phone = $("#order-phone").value.trim();
  const city = $("#order-city").value;
  const address = $("#order-address").value.trim();
  if (!name || !/^[0-9]{8}$/.test(phone) || !city || !address) {
    alert("Please complete all delivery details and enter an 8-digit phone number.");
    return;
  }
  const button = $("#order-submit");
  const order = {
    type: "order", orderID: makeOrderId(), date: new Date().toISOString(),
    name, phone, city, address,
    items: cart.map(item => `${item.name} x${item.qty}`).join(", "),
    products: cart.map(item => ({ id: item.id, name: item.name, qty: item.qty, price: item.price })),
    subtotal: Number(subtotalValue().toFixed(2)),
    discount: Number(discountValue().toFixed(2)),
    promoCode: appliedPromo,
    delivery: Number(deliveryValue().toFixed(2)),
    total: Number(totalValue().toFixed(2)),
    payment: "Cash on delivery",
    status: "Pending"
  };
  setSubmitting(button, true);
  try {
    // Apps Script ContentService does not expose a readable CORS response to this page.
    // no-cors can send the request, but cannot prove that the script saved it.
    await fetch(SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(order) });
    $("#success-order-id").textContent = order.orderID;
    orderForm.hidden = true;
    orderSuccess.hidden = false;
    cart = []; appliedPromo = ""; $("#promo-input").value = "";
    renderCart();
    orderForm.reset();
    $("#delivery-hint").textContent = "Choose a governorate to calculate delivery.";
  } catch (error) {
    console.error("Order request error:", error);
    alert("We could not send your request. Please check your connection and try again. If you are unsure whether it was sent, check with the shop before submitting again.");
  } finally {
    setSubmitting(button, false);
  }
});
$("#success-close").addEventListener("click", () => { closeCart(); cartContent.hidden = false; orderSuccess.hidden = true; });

// Product quick view
function openProductDialog(product) {
  activeProduct = product;
  $("#dialog-image").src = product.image;
  $("#dialog-image").alt = product.name;
  $("#dialog-name").textContent = product.name;
  $("#dialog-price").textContent = `${money(product.price)} TND`;
  $("#dialog-description").textContent = product.description;
  $("#dialog-stock").textContent = product.stock > 0 ? `${product.stock} available (demo stock)` : "Out of stock";
  $("#product-dialog").showModal();
}
$("#product-dialog-close").addEventListener("click", () => $("#product-dialog").close());
$("#dialog-add").addEventListener("click", () => { if (activeProduct) addToCart(activeProduct); $("#product-dialog").close(); });

// Search, category filters, sorting
function filterProducts() {
  const query = $("#search-input").value.trim().toLowerCase();
  const sort = $("#sort-select").value;
  let cards = [...productCards];
  if (sort === "low") cards.sort((a,b) => Number(a.dataset.price) - Number(b.dataset.price));
  if (sort === "high") cards.sort((a,b) => Number(b.dataset.price) - Number(a.dataset.price));
  if (sort === "name") cards.sort((a,b) => a.dataset.name.localeCompare(b.dataset.name));
  const grid = $("#products");
  cards.forEach(card => grid.appendChild(card));
  let visible = 0;
  cards.forEach(card => {
    const categoryMatch = activeCategory === "all" ||
      (activeCategory === "sale" ? Boolean(card.dataset.oldPrice) : card.dataset.category === activeCategory);
    const textMatch = (card.dataset.name + " " + card.dataset.category).toLowerCase().includes(query);
    card.hidden = !(categoryMatch && textMatch);
    if (!card.hidden) visible++;
  });
  $("#no-results").hidden = visible !== 0;
}
$$(".filter-btn").forEach(button => button.addEventListener("click", () => {
  activeCategory = button.dataset.filter;
  $$(".filter-btn").forEach(btn => btn.classList.toggle("active", btn === button));
  filterProducts();
}));
$("#search-input").addEventListener("input", filterProducts);
$("#sort-select").addEventListener("change", filterProducts);

// Reviews are intentionally local-only in this static version.
function renderReviews() {
  const reviews = JSON.parse(localStorage.getItem("teddyReviews") || "[]");
  const list = $("#review-list");
  list.innerHTML = "";
  reviews.slice().reverse().forEach(review => {
    const article = document.createElement("article"); article.className = "review-card";
    const stars = document.createElement("div"); stars.className = "review-stars"; stars.textContent = "★".repeat(review.rating) + "☆".repeat(5-review.rating);
    const message = document.createElement("p"); message.textContent = review.text;
    const author = document.createElement("b"); author.textContent = review.name;
    article.append(stars, message, author); list.appendChild(article);
  });
}
$("#review-form").addEventListener("submit", event => {
  event.preventDefault();
  const reviews = JSON.parse(localStorage.getItem("teddyReviews") || "[]");
  reviews.push({ name: $("#review-name").value.trim(), rating: Number($("#review-rating").value), text: $("#review-text").value.trim() });
  localStorage.setItem("teddyReviews", JSON.stringify(reviews.slice(-12)));
  event.target.reset(); renderReviews();
});

// Contact form uses the same Apps Script endpoint.
$("#contact-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("#contact-submit");
  const payload = {
    type: "contact", name: $("#contact-name").value.trim(),
    email: $("#contact-email").value.trim(), message: $("#contact-message").value.trim(),
    date: new Date().toISOString()
  };
  button.disabled = true; button.textContent = "Sending...";
  try {
    await fetch(SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    $("#form-result").textContent = "Your message request has been sent. Thank you!";
    event.target.reset();
  } catch (error) {
    console.error(error);
    $("#form-result").textContent = "Could not send your message. Please try again.";
  } finally {
    button.disabled = false; button.textContent = "Send message →";
  }
});

// Mobile menu and footer year
$("#menu-toggle").addEventListener("click", () => {
  const isOpen = $("#nav-links").classList.toggle("open");
  $("#menu-toggle").setAttribute("aria-expanded", String(isOpen));
});
$$(".nav-links a").forEach(link => link.addEventListener("click", () => $("#nav-links").classList.remove("open")));
$("#year").textContent = new Date().getFullYear();

renderCart();
renderReviews();
filterProducts();
