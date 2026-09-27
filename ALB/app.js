let db = JSON.parse(localStorage.getItem('store_db')) || {
    settings: { name: "متجري الإلكتروني", primaryColor: "#4f46e5", logo: "", cashEnabled: true, elecEnabled: true },
    categories: [{ id: 1, name: "إلكترونيات" }, { id: 2, name: "ملابس وأزياء" }],
    products: [
        { id: 101, catId: 1, name: "هاتف ذكي متطور", price: 1200, discount: 10, desc: "هاتف بشاشة عالية الدقة", isDigital: false, colors: ["أسود", "فضي"], sizes: ["128GB"], image: "" }
    ]
};

let cart = [];
let orders = JSON.parse(localStorage.getItem('my_store_orders')) || [];

window.onload = function() {
    applySettings();
    renderStoreCategories();
    renderStoreProducts(db.products);
    updateCartCount();
    setupPaymentOptions();
};

function applySettings() {
    document.title = db.settings.name;
    document.querySelectorAll('.store-title-text').forEach(el => el.innerText = db.settings.name);
    if(db.settings.logo) {
        document.getElementById('store-logo-container').innerHTML = `<img src="${db.settings.logo}" style="height: 40px; object-fit: contain;">`;
    }
}

function setupPaymentOptions() {
    let select = document.getElementById('payment-method');
    select.innerHTML = '';
    if(db.settings.cashEnabled) {
        select.innerHTML += `<option value="cash">نقداً عند الاستلام</option>`;
    }
    if(db.settings.elecEnabled) {
        select.innerHTML += `<option value="electronic">دفع إلكتروني (بوابة الدفع)</option>`;
    }
    if(!db.settings.cashEnabled && !db.settings.elecEnabled) {
        select.innerHTML += `<option value="">عذراً، طرق الدفع معطلة مؤقتاً</option>`;
    }
}

function switchTab(tab) {
    document.getElementById('store-section').style.display = tab === 'store' ? 'block' : 'none';
    document.getElementById('cart-section').style.display = tab === 'cart' ? 'block' : 'none';
    document.getElementById('orders-section').style.display = tab === 'orders' ? 'block' : 'none';
    
    document.querySelectorAll('.nav-links button').forEach(btn => btn.classList.remove('active'));
    if(tab === 'store') document.querySelectorAll('.nav-links button')[0].classList.add('active');
    if(tab === 'cart') document.querySelectorAll('.nav-links button')[1].classList.add('active');
    if(tab === 'orders') {
        document.querySelectorAll('.nav-links button')[2].classList.add('active');
        renderCustomerOrders();
    }
}

function renderStoreCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = `<div class="card" onclick="filterStoreCategory(null)"><h4>جميع الأقسام</h4></div>` + 
        db.categories.map(cat => `<div class="card" onclick="filterStoreCategory(${cat.id})"><h4>${cat.name}</h4></div>`).join('');
}

function renderStoreProducts(productsToRender) {
    const container = document.getElementById('products-container');
    if(productsToRender.length === 0) {
        container.innerHTML = `<p>لا توجد منتجات مطابقة.</p>`;
        return;
    }
    container.innerHTML = productsToRender.map(prod => {
        let finalPrice = prod.discount > 0 ? (prod.price - (prod.price * prod.discount / 100)) : prod.price;
        let priceHtml = prod.discount > 0 ? 
            `<span style="text-decoration: line-through; color: #9ca3af; font-size: 0.9rem;">${prod.price} د.ل</span> <span style="font-weight: bold; color: #ef4444;">${finalPrice} د.ل</span>` :
            `<span style="font-weight: bold; color: var(--primary-color);">${prod.price} د.ل</span>`;

        let colorsHtml = prod.colors && prod.colors.length > 0 ? `<select id="color-${prod.id}" class="search-bar" style="padding:0.25rem; margin:0.25rem 0;">${prod.colors.map(c=>`<option value="${c}">لون: ${c}</option>`).join('')}</select>` : '';
        let sizesHtml = prod.sizes && prod.sizes.length > 0 ? `<select id="size-${prod.id}" class="search-bar" style="padding:0.25rem; margin:0.25rem 0;">${prod.sizes.map(s=>`<option value="${s}">مقاس: ${s}</option>`).join('')}</select>` : '';

        return `
            <div class="card">
                <img src="${prod.image || 'https://via.placeholder.com/200'}" style="width:100%; height:140px; object-fit:cover; border-radius:4px; margin-bottom:0.5rem;">
                <h4>${prod.name}</h4>
                <p style="color: #6b7280; font-size: 0.85rem; margin: 0.25rem 0;">${prod.desc}</p>
                <div style="margin: 0.5rem 0;">${priceHtml}</div>
                ${colorsHtml}
                ${sizesHtml}
                <button class="btn" onclick="addToStoreCart(${prod.id})">إضافة للسلة</button>
            </div>
        `;
    }).join('');
}

function filterStoreCategory(catId) {
    if(catId === null) {
        renderStoreProducts(db.products);
    } else {
        renderStoreProducts(db.products.filter(p => p.catId === catId));
    }
}

function handleSearch() {
    let query = document.getElementById('search-input').value.toLowerCase();
    renderStoreProducts(db.products.filter(p => p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query)));
}

function addToStoreCart(prodId) {
    let prod = db.products.find(p => p.id === prodId);
    let selectedColor = document.getElementById(`color-${prodId}`) ? document.getElementById(`color-${prodId}`).value : '';
    let selectedSize = document.getElementById(`size-${prodId}`) ? document.getElementById(`size-${prodId}`).value : '';
    let finalPrice = prod.discount > 0 ? (prod.price - (prod.price * prod.discount / 100)) : prod.price;

    cart.push({
        ...prod,
        price: finalPrice,
        chosenColor: selectedColor,
        chosenSize: selectedSize,
        qty: 1
    });
    updateCartCount();
    alert('تمت إضافة المنتج للسلة بنجاح!');
}

function updateCartCount() {
    document.getElementById('cart-count').innerText = cart.length;
    renderCartList();
}

function renderCartList() {
    let container = document.getElementById('cart-items');
    if(cart.length === 0) {
        container.innerHTML = `<p>سلة الشراء فارغة.</p>`;
        return;
    }
    let total = 0;
    container.innerHTML = cart.map((item, idx) => {
        total += item.price * item.qty;
        return `
            <div style="background: white; padding: 1rem; margin-bottom: 0.5rem; border-radius: 0.375rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4>${item.name}</h4>
                    <p>السعر: ${item.price} د.ل ${item.chosenColor ? '| اللون: ' + item.chosenColor : ''} ${item.chosenSize ? '| المقاس: ' + item.chosenSize : ''}</p>
                    ${item.isDigital ? '<small style="color:blue;">منتج رقمي (سيظهر رابطه بعد الدفع)</small>' : ''}
                </div>
                <button style="background: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer;" onclick="removeFromStoreCart(${idx})">حذف</button>
            </div>
        `;
    }).join('') + `<h3>الإجمالي: ${total} د.ل</h3>`;
}

function removeFromStoreCart(index) {
    cart.splice(index, 1);
    updateCartCount();
}

function togglePaymentGateway() {
    let method = document.getElementById('payment-method').value;
    document.getElementById('gateway-simulation').style.display = method === 'electronic' ? 'block' : 'none';
}

function completeCheckout() {
    let name = document.getElementById('cust-name').value;
    let phone = document.getElementById('cust-phone').value;
    let city = document.getElementById('cust-city').value;
    let region = document.getElementById('cust-region').value;
    let method = document.getElementById('payment-method').value;

    if(!name || !phone || !city || !region) {
        alert('الرجاء إدخال بيانات الاستلام بالكامل.');
        return;
    }
    if(cart.length === 0) {
        alert('السلة فارغة.');
        return;
    }

    let newOrder = {
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleString(),
        customer: { name, phone, city, region },
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
        paymentMethod: method === 'cash' ? 'نقداً عند الاستلام' : 'دفع إلكتروني (API)'
    };

    orders.push(newOrder);
    localStorage.setItem('my_store_orders', JSON.stringify(orders));
    cart = [];
    updateCartCount();
    alert('تم إتمام الطلب بنجاح وتوليد الفاتورة وتفعيل روابط المنتجات الرقمية!');
    switchTab('orders');
}

function renderCustomerOrders() {
    let container = document.getElementById('orders-list');
    if(orders.length === 0) {
        container.innerHTML = `<p>لا توجد طلبات مسجلة.</p>`;
        return;
    }
    container.innerHTML = orders.map(ord => `
        <div class="invoice-box" style="margin-bottom: 1.5rem;">
            <h3>رقم الطلب: ${ord.id}</h3>
            <p><strong>التاريخ:</strong> ${ord.date}</p>
            <p><strong>المستلم:</strong> ${ord.customer.name} (${ord.customer.phone})</p>
            <p><strong>العنوان:</strong> ${ord.customer.city} - ${ord.customer.region}</p>
            <p><strong>طريقة الدفع:</strong> ${ord.paymentMethod}</p>
            <hr style="margin: 1rem 0;">
            <ul>
                ${ord.items.map(i => `
                    <li>
                        <strong>${i.name}</strong> -${i.price} د.ل
                        ${i.chosenColor ? '<br>اللون: ' + i.chosenColor : ''}
                        ${i.chosenSize ? '<br>المقاس: ' + i.chosenSize : ''}
                        ${i.isDigital && i.digitalLink ? '<br><a href="' + i.digitalLink + '" target="_blank" style="color:var(--primary-color); font-weight:bold;">📥 رابط تحميل المنتج الرقمي</a>' : ''}
                    </li>
                `).join('')}
            </ul>
            <h4 style="margin-top: 1rem;">الإجمالي: ${ord.total} د.ل</h4>
            <button class="btn" style="width: auto; margin-top: 1rem;" onclick="downloadInvoice('${ord.id}')">تنزيل وطباعة الفاتورة</button>
        </div>
    `).join('');
}

function downloadInvoice(orderId) {
    let order = orders.find(o => o.id === orderId);
    if(!order) return;
    let win = window.open('', '_blank');
    win.document.write(`
        <html dir="rtl"><head><title>فاتورة ${order.id}</title></head>
        <body style="font-family:Arial; padding:2rem;">
            <h2>${db.settings.name} - فاتورة الطلب</h2>
            <hr>
            <p><strong>رقم الطلب:</strong> ${order.id}</p>
            <p><strong>التاريخ:</strong> ${order.date}</p>
            <p><strong>العميل:</strong> ${order.customer.name} | ${order.customer.phone}</p>
            <p><strong>العنوان:</strong> ${order.customer.city} - ${order.customer.region}</p>
            <table border="1" style="width:100%; border-collapse:collapse; margin-top:1rem;" cellpadding="8">
                <tr><th>المنتج والمواصفات</th><th>السعر</th><th>الإجمالي</th></tr>
                ${order.items.map(i => `<tr><td>${i.name}${i.chosenColor ? '(' + i.chosenColor + ')' : ''} ${i.chosenSize ? '(' + i.chosenSize + ')' : ''} ${i.isDigital ? '<br><b>رابط التحميل:</b> ' + i.digitalLink : ''}</td><td>${i.price} د.ل</td><td>${i.price * i.qty} د.ل</td></tr>`).join('')}
            </table>
            <h3>الإجمالي الكلي: ${order.total} د.ل</h3>
            <script>window.print();</script>
        </body></html>
    `);
}