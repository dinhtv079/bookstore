const FREE_SHIP_FROM = 300000;
const SHIP_FEE = 30000;

const $ = (s) => document.querySelector(s);
const money = (n) => n.toLocaleString("vi-VN") + "đ";
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let activeCategory = "Tất cả";
let cart = loadCart();

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || {};
  } catch {
    return {};
  }
}
function saveCart() {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch {}
}

/* ---------- Danh mục ---------- */
function renderCategories() {
  const cats = ["Tất cả", ...new Set(BOOKS.map((b) => b.category))];
  $("#categories").innerHTML = cats
    .map((c) => `<button class="chip ${c === activeCategory ? "active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
    .join("");
}
$("#categories").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  activeCategory = btn.dataset.cat;
  renderCategories();
  renderBooks();
});

/* ---------- Danh sách sách ---------- */
function filteredBooks() {
  const q = $("#search").value.trim().toLowerCase();
  let list = BOOKS.filter(
    (b) =>
      (activeCategory === "Tất cả" || b.category === activeCategory) &&
      (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
  );
  const sort = $("#sort").value;
  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
  if (sort === "name") list.sort((a, b) => a.title.localeCompare(b.title, "vi"));
  return list;
}

function renderBooks() {
  const list = filteredBooks();
  $("#empty").classList.toggle("hidden", list.length > 0);
  $("#books").innerHTML = list
    .map(
      (b) => `
      <article class="card">
        <div class="cover" style="background:${b.color}">
          <span>${escapeHtml(b.title)}</span>
        </div>
        <div class="card-body">
          <span class="tag">${escapeHtml(b.category)}</span>
          <h3>${escapeHtml(b.title)}</h3>
          <p class="author">${escapeHtml(b.author)}</p>
          <div class="card-foot">
            <strong class="price">${money(b.price)}</strong>
            <button class="btn primary small" data-add="${b.id}">Thêm vào giỏ</button>
          </div>
        </div>
      </article>`
    )
    .join("");
}
$("#books").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  const id = btn.dataset.add;
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  const book = BOOKS.find((b) => b.id == id);
  toast(`Đã thêm "${book.title}" vào giỏ`);
});
$("#search").addEventListener("input", renderBooks);
$("#sort").addEventListener("change", renderBooks);

/* ---------- Giỏ hàng ---------- */
function cartLines() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ book: BOOKS.find((b) => b.id == id), qty }))
    .filter((l) => l.book && l.qty > 0);
}

function renderCart() {
  const lines = cartLines();
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.book.price, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIP_FROM ? 0 : SHIP_FEE;

  $("#cartCount").textContent = count;
  $("#subtotal").textContent = money(subtotal);
  $("#shipping").textContent = shipping ? money(shipping) : "Miễn phí";
  $("#total").textContent = money(subtotal + shipping);
  $("#checkoutBtn").disabled = count === 0;

  $("#cartItems").innerHTML = lines.length
    ? lines
        .map(
          ({ book, qty }) => `
        <div class="cart-item">
          <div class="mini-cover" style="background:${book.color}"></div>
          <div class="ci-info">
            <div class="ci-title">${escapeHtml(book.title)}</div>
            <div class="ci-price">${money(book.price)}</div>
            <div class="qty">
              <button data-dec="${book.id}">−</button>
              <span>${qty}</span>
              <button data-inc="${book.id}">+</button>
            </div>
          </div>
          <button class="icon-btn" data-del="${book.id}" aria-label="Xóa">🗑</button>
        </div>`
        )
        .join("")
    : `<p class="empty">Giỏ hàng đang trống.</p>`;
}

$("#cartItems").addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.inc) cart[t.dataset.inc]++;
  if (t.dataset.dec) cart[t.dataset.dec] = Math.max(0, cart[t.dataset.dec] - 1);
  if (t.dataset.del) cart[t.dataset.del] = 0;
  for (const k in cart) if (!cart[k]) delete cart[k];
  saveCart();
  renderCart();
});

function openCart() {
  $("#cart").classList.add("open");
  $("#overlay").classList.remove("hidden");
}
function closeCart() {
  $("#cart").classList.remove("open");
  $("#overlay").classList.add("hidden");
}
$("#cartBtn").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);

/* ---------- Đặt hàng ---------- */
$("#checkoutBtn").addEventListener("click", () => {
  closeCart();
  $("#modal").classList.remove("hidden");
});
$("#cancelOrder").addEventListener("click", () => $("#modal").classList.add("hidden"));

$("#orderForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const order = {
    customer: data,
    items: cartLines().map((l) => ({ title: l.book.title, qty: l.qty, price: l.book.price })),
    total: $("#total").textContent,
    createdAt: new Date().toISOString(),
  };
  try {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));
  } catch {}
  cart = {};
  saveCart();
  renderCart();
  e.target.reset();
  $("#modal").classList.add("hidden");
  toast(`Cảm ơn ${data.name}! Đơn hàng đã được ghi nhận.`);
});

/* ---------- Thông báo ---------- */
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2500);
}

renderCategories();
renderBooks();
renderCart();
