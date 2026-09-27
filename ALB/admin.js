// استرجاع البيانات أو التهيئة الأولية المشتركة مع المتجر
let db = JSON.parse(localStorage.getItem('store_db')) || {
    settings: { name: "متجري الإلكتروني", primaryColor: "#4f46e5", logo: "", cashEnabled: true, elecEnabled: true },
    categories: [
        { id: 1, name: "إلكترونيات" },
        { id: 2, name: "ملابس وأزياء" }
    ],
    products: [
        { id: 101, catId: 1, name: "هاتف ذكي متطور", price: 1200, discount: 10, desc: "هاتف بشاشة عالية الدقة", isDigital: false, digitalLink: "", colors: ["أسود", "فضي"], sizes: ["128GB", "256GB"], image: "" },
        { id: 102, catId: 2, name: "قميص كاجوال رجالي", price: 90, discount: 0, desc: "قطن 100% مريح جداً", isDigital: false, digitalLink: "", colors: ["أزرق", "أبيض"], sizes: ["M", "L", "XL"], image: "" }
    ]
};

let orders = JSON.parse(localStorage.getItem('my_store_orders')) || [];
let tempColors = [];
let tempSizes = [];

window.onload = function() {
    loadReports();
    renderAdminProducts();
    renderAdminCategories();
    renderCategoryDropdown();
    renderAdminOrders();
    loadSettingsToUI();
};

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.admin-nav button').forEach(el => el.classList.remove('active'));

    document.getElementById('tab-' + tabName).style.display = 'block';
    event.target.classList.add('active');

    if(tabName === 'reports') loadReports();
    if(tabName === 'orders') renderAdminOrders();
}

// التقارير العامة
function loadReports() {
    document.getElementById('rep-total-orders').innerText = orders.length;
    let cashTotal = orders.filter(o => o.paymentMethod.includes('نقداً')).reduce((sum, o) => sum + o.total, 0);
    let elecTotal = orders.filter(o => o.paymentMethod.includes('إلكتروني')).reduce((sum, o) => sum + o.total, 0);
    
    document.getElementById('rep-cash-sales').innerText = cashTotal + ' د.ل';
    document.getElementById('rep-elec-sales').innerText = elecTotal + ' د.ل';
}

// رفع الصور وتحويلها لـ Base64 (صورة وليست رابط)
function encodeImageFileAsURL(element) {
    let file = element.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onloadend = function() {
            document.getElementById('p-image-base64').value = reader.result;
            document.getElementById('image-preview-container').innerHTML = `<img src="${reader.result}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.375rem;">`;
        }
        reader.readAsDataURL(file);
    }
}

function encodeLogoAsURL(element) {
    let file = element.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onloadend = function() {
            document.getElementById('set-logo-base64').value = reader.result;
            document.getElementById('logo-preview').innerHTML = `<img src="${reader.result}" style="width: 100px; height: 50px; object-fit: contain;">`;
        }
        reader.readAsDataURL(file);
    }
}

function toggleDigitalProductFields() {
    let isDigital = document.getElementById('p-is-digital').checked;
    document.getElementById('digital-link-box').style.display = isDigital ? 'block' : 'none';
    document.getElementById('physical-product-box').style.display = isDigital ? 'none' : 'block';
}

function addColor() {
    let val = document.getElementById('new-color-input').value.trim();
    if(val && !tempColors.includes(val)) {
        tempColors.push(val);
        document.getElementById('new-color-input').value = '';
        renderColorsTags();
    }
}
function removeColor(c) {
    tempColors = tempColors.filter(x => x !== c);
    renderColorsTags();
}
function renderColorsTags() {
    document.getElementById('colors-list-display').innerHTML = tempColors.map(c => `
        <span style="background: #e0e7ff; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.9rem;">
            ${c} <button type="button" onclick="removeColor('${c}')" style="border:none; background:none; color:red; cursor:pointer;">×</button>
        </span>
    `).join('');
}

function addSize() {
    let val = document.getElementById('new-size-input').value.trim();
    if(val && !tempSizes.includes(val)) {
        tempSizes.push(val);
        document.getElementById('new-size-input').value = '';
        renderSizesTags();
    }
}
function removeSize(s) {
    tempSizes = tempSizes.filter(x => x !== s);
    renderSizesTags();
}
function renderSizesTags() {
    document.getElementById('sizes-list-display').innerHTML = tempSizes.map(s => `
        <span style="background: #fee2e2; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.9rem;">
            ${s} <button type="button" onclick="removeSize('${s}')" style="border:none; background:none; color:red; cursor:pointer;">×</button>
        </span>
    `).join('');
}

function renderCategoryDropdown() {
    let select = document.getElementById('p-category');
    select.innerHTML = db.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('') + `<option value="new">+ إنشاء قسم جديد...</option>`;
}

function checkNewCategoryInput() {
    let val = document.getElementById('p-category').value;
    document.getElementById('new-cat-box').style.display = val === 'new' ? 'block' : 'none';
}

function saveProduct() {
    let id = document.getElementById('edit-prod-id').value;
    let name = document.getElementById('p-name').value;
    let desc = document.getElementById('p-desc').value;
    let price = parseFloat(document.getElementById('p-price').value) || 0;
    let discount = parseFloat(document.getElementById('p-discount').value) || 0;
    let image = document.getElementById('p-image-base64').value;
    let isDigital = document.getElementById('p-is-digital').checked;
    let digitalLink = document.getElementById('p-digital-link').value;
    let catSelect = document.getElementById('p-category').value;

    if(!name || price <= 0) {
        alert('الرجاء إدخال اسم المنتج والسعر على الأقل.');
        return;
    }

    let catId;
    if(catSelect === 'new') {
        let newCatName = document.getElementById('p-new-category-name').value.trim();
        if(!newCatName) {
            alert('الرجاء إدخال اسم القسم الجديد.');
            return;
        }
        catId = Date.now();
        db.categories.push({ id: catId, name: newCatName });
    } else {
        catId = parseInt(catSelect);
    }

    if(id) {
        // تعديل منتج قائم
        let prod = db.products.find(p => p.id == id);
        if(prod) {
            prod.name = name;
            prod.desc = desc;
            prod.price = price;
            prod.discount = discount;
            prod.catId = catId;
            prod.isDigital = isDigital;
            prod.digitalLink = digitalLink;
            if(image) prod.image = image;
            if(!isDigital) {
                prod.colors = [...tempColors];
                prod.sizes = [...tempSizes];
            }
        }
    } else {
        // إضافة منتج جديد
        let newProd = {
            id: Date.now(),
            catId,
            name,
            desc,
            price,
            discount,
            image: image || '',
            isDigital,
            digitalLink,
            colors: isDigital ? [] : [...tempColors],
            sizes: isDigital ? [] : [...tempSizes]
        };
        db.products.push(newProd);
    }

    syncAndReload();
    resetProductForm();
    alert('تم حفظ ونشر المنتج بنجاح!');
}

function resetProductForm() {
    document.getElementById('edit-prod-id').value = '';
    document.getElementById('p-name').value = '';
    document.getElementById('p-desc').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('p-discount').value = '0';
    document.getElementById('p-image-base64').value = '';
    document.getElementById('image-preview-container').innerHTML = '';
    document.getElementById('p-is-digital').checked = false;
    document.getElementById('p-digital-link').value = '';
    document.getElementById('digital-link-box').style.display = 'none';
    document.getElementById('physical-product-box').style.display = 'block';
    tempColors = [];
    tempSizes = [];
    renderColorsTags();
    renderSizesTags();
    renderCategoryDropdown();
}

function renderAdminProducts() {
    let tbody = document.getElementById('admin-products-table');
    tbody.innerHTML = db.products.map(p => {
        let cat = db.categories.find(c => c.id === p.catId);
        let finalPrice = p.discount > 0 ? (p.price - (p.price * p.discount / 100)) : p.price;
        return `
            <tr>
                <td><img src="${p.image || 'https://via.placeholder.com/50'}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
                <td><strong>${p.name}</strong></td>
                <td>${cat ? cat.name : 'غير محدد'}</td>
                <td><span style="text-decoration: line-through; color:gray;">${p.price} د.ل</span><br><b>${finalPrice} د.ل</b></td>
                <td>${p.isDigital ? '<span class="badge badge-elec">رقمي</span>' : '<span class="badge badge-cash">عادي</span>'}</td>
                <td>
                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; width:auto;" onclick="editProduct(${p.id})">تعديل</button>
                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; width:auto; background:#ef4444;" onclick="deleteProduct(${p.id})">حذف</button>
                    <select onchange="moveProduct(${p.id}, this.value)" style="padding: 0.25rem; margin-top: 0.25rem;">
                        <option value="">نقل إلى...</option>
                        ${db.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

function editProduct(id) {
    let p = db.products.find(item => item.id == id);
    if(!p) return;
    document.getElementById('edit-prod-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-desc').value = p.desc;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-discount').value = p.discount || 0;
    document.getElementById('p-category').value = p.catId;
    document.getElementById('p-is-digital').checked = p.isDigital;
    document.getElementById('p-digital-link').value = p.digitalLink || '';
    
    toggleDigitalProductFields();
    tempColors = p.colors ? [...p.colors] : [];
    tempSizes = p.sizes ? [...p.sizes] : [];
    renderColorsTags();
    renderSizesTags();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteProduct(id) {
    if(confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        db.products = db.products.filter(p => p.id != id);
        syncAndReload();
    }
}

function moveProduct(prodId, newCatId) {
    if(!newCatId) return;
    let p = db.products.find(item => item.id == prodId);
    if(p) {
        p.catId = parseInt(newCatId);
        syncAndReload();
        alert('تم نقل المنتج بنجاح.');
    }
}

// إدارة الأقسام
function addNewCategoryFromTab() {
    let name = document.getElementById('new-cat-main-input').value.trim();
    if(name) {
        db.categories.push({ id: Date.now(), name });
        document.getElementById('new-cat-main-input').value = '';
        syncAndReload();
        renderAdminCategories();
        renderCategoryDropdown();
        alert('تمت إضافة القسم بنجاح.');
    }
}

function renderAdminCategories() {
    let container = document.getElementById('admin-categories-list');
    container.innerHTML = db.categories.map(cat => `
        <div style="background: white; padding: 1rem; margin-bottom: 0.5rem; border-radius: 0.375rem; display: flex; justify-content: space-between; align-items: center;">
            <h4>${cat.name}</h4>
            <button class="btn" style="background: #ef4444; width: auto; padding: 0.25rem 0.75rem;" onclick="deleteCategory(${cat.id})">حذف القسم</button>
        </div>
    `).join('');
}

function deleteCategory(id) {
    if(confirm('حذف القسم سيؤثر على المنتجات التابعة له. هل أنت متأكد؟')) {
        db.categories = db.categories.filter(c => c.id != id);
        syncAndReload();
        renderAdminCategories();
        renderCategoryDropdown();
    }
}

// قسم طلبات الزبائن والفواتير
function renderAdminOrders() {
    let container = document.getElementById('admin-orders-container');
    if(orders.length === 0) {
        container.innerHTML = `<p>لا توجد طلبات واردة حتى الآن.</p>`;
        return;
    }
    container.innerHTML = orders.map(ord => `
        <div class="invoice-box" style="margin-bottom: 1.5rem;">
            <h3>رقم الطلب: ${ord.id}</h3>
            <p><strong>تاريخ الطلب:</strong> ${ord.date}</p>
            <p><strong>اسم الزبون:</strong> ${ord.customer.name}</p>
            <p><strong>رقم الهاتف:</strong> ${ord.customer.phone}</p>
            <p><strong>المدينة والمنطقة:</strong> ${ord.customer.city} - ${ord.customer.region}</p>
            <p><strong>طريقة الدفع:</strong> <span class="badge ${ord.paymentMethod.includes('نقداً') ? 'badge-cash' : 'badge-elec'}">${ord.paymentMethod}</span></p>
            <hr style="margin: 1rem 0;">
            <ul>
                ${ord.items.map(i => `<li>${i.name} (الكمية: ${i.qty}) - السعر: ${i.price * i.qty} د.ل ${i.isDigital ? '<br><small style="color:blue;">رابط رقمي: ' + i.digitalLink + '</small>' : ''}</li>`).join('')}
            </ul>
            <h4 style="margin-top: 1rem;">الإجمالي المدفوع: ${ord.total} د.ل</h4>
        </div>
    `).join('');
}

// إعدادات المتجر العامة
function loadSettingsToUI() {
    document.getElementById('set-store-name').value = db.settings.name;
    document.getElementById('set-primary-color').value = db.settings.primaryColor || '#4f46e5';
    document.getElementById('pay-cash-toggle').checked = db.settings.cashEnabled;
    document.getElementById('pay-elec-toggle').checked = db.settings.elecEnabled;
    if(db.settings.logo) {
        document.getElementById('logo-preview').innerHTML = `<img src="${db.settings.logo}" style="width: 100px; height: 50px; object-fit: contain;">`;
    }
}

function saveSettings() {
    db.settings.name = document.getElementById('set-store-name').value;
    db.settings.primaryColor = document.getElementById('set-primary-color').value;
    db.settings.cashEnabled = document.getElementById('pay-cash-toggle').checked;
    db.settings.elecEnabled = document.getElementById('pay-elec-toggle').checked;
    let logoBase64 = document.getElementById('set-logo-base64').value;
    if(logoBase64) db.settings.logo = logoBase64;

    syncAndReload();
    alert('تم حفظ إعدادات المتجر بنجاح!');
}

function syncAndReload() {
    localStorage.setItem('store_db', JSON.stringify(db));
    renderAdminProducts();
}