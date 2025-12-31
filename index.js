async function loadMenu() {
  const files = [
    "sandwich",
    "mashawy",
    "wagabat-fardy",
    "wagabat-zawgy",
    "sawaany",
    "edafat",
    "offers",
    "offers-of-year"
  ];

  const results = await Promise.all(
    files.map(file =>
      fetch(`./json/${file}.json`).then(res => res.json())
    )
  );

  return {
    sandwich: results[0].sandwich,
    mashawy: results[1].mashawy,
    wagabatFardy: results[2].wagabatFardy,
    wagabatZawgy: results[3].wagabatZawgy,
    sawaany: results[4].sawaany,
    edafat: results[5].edafat,
    offers: results[6].offers,
    offersOfYear: results[7].offersOfYear
  };
}

let idx=1;
function addIds(items) {
  return items.map(item => ({
    ...item,
    id: idx++
  }));
}

// Global variables
let menuItems = {};
let cart = [];
let currentCategory = 'all';
let selectedSizes = {};
let orderType = 'delivery'; // 'delivery' or 'dinein'
const SERVICE_FEE = 10; // Service fee for dine-in orders in EGP

// Load menu and initialize
loadMenu().then(menu => {
  menuItems = {
      offersOfYear: addIds(menu.offersOfYear),
    offers: addIds(menu.offers),
    wagabatFardy: addIds(menu.wagabatFardy),
    wagabatZawgy: addIds(menu.wagabatZawgy),
    sawaany: addIds(menu.sawaany),
    mashawy: addIds(menu.mashawy),
    sandwich: addIds(menu.sandwich),
    edafat: addIds(menu.edafat),
  };
  
  // Initialize display after menu is loaded
  displayMenu();
}).catch(err => {
  document.getElementById('menuContainer').innerHTML = '<div class="alert alert-danger">فشل تحميل القائمة. يرجى تحديث الصفحة.</div>';
});

// Show custom alert popup
function showAlert(message, type = 'error') {
    // Remove existing alert if any
    const existingAlert = document.getElementById('customAlert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.id = 'customAlert';
    alertDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 300px;
        max-width: 90%;
        text-align: center;
        animation: slideIn 0.3s ease;
    `;
    
    const iconHTML = type === 'success' 
        ? '<i class="fas fa-check-circle" style="font-size: 3rem; color: #27ae60; margin-bottom: 15px;"></i>'
        : '<i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 15px;"></i>';
    
    alertDiv.innerHTML = `
        ${iconHTML}
        <p style="font-size: 1.1rem; margin: 15px 0; color: #333; line-height: 1.6;">${message}</p>
        <button onclick="closeAlert()" style="
            background: linear-gradient(to right, #e67e22, #f39c12);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 10px;
            transition: all 0.3s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">حسناً</button>
    `;
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'alertBackdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    backdrop.onclick = closeAlert;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(alertDiv);
    
    // Add animations if not already added
    if (!document.getElementById('alertAnimations')) {
        const style = document.createElement('style');
        style.id = 'alertAnimations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translate(-50%, -60%);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, -50%);
                    opacity: 1;
                }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

function closeAlert() {
    const alert = document.getElementById('customAlert');
    const backdrop = document.getElementById('alertBackdrop');
    if (alert) alert.remove();
    if (backdrop) backdrop.remove();
}

// Select Order Type
function selectOrderType(type) {
    orderType = type;
    
    // Update button states
    document.getElementById('deliveryBtn').classList.toggle('active', type === 'delivery');
    document.getElementById('dineinBtn').classList.toggle('active', type === 'dinein');
    
    // Show/hide relevant fields
    document.getElementById('deliveryFields').classList.toggle('active', type === 'delivery');
    document.getElementById('dineinFields').classList.toggle('active', type === 'dinein');
    
    // Update cart display to reflect service fee
    updateCart();
}

function selectSize(itemId, sizeId) {
    selectedSizes[itemId] = sizeId;
    displayMenu(currentCategory);
}

// Get item unique key for cart
function getItemKey(itemId, sizeId = null) {
    return sizeId ? `${itemId}_${sizeId}` : `${itemId}`;
}

function getAllItems(menu) {
  return Object.values(menu).flat();
}

function getCategoryItems(menu, category) {
  return category === 'all'? getAllItems(menu) :  menu[category];
}

// Get category title
function getCategoryTitle(category) {
    const titles = {
        'mashawy': 'جميع المشويات تقدم مع رز و عيش و سلطات'
    };
    return titles[category] || null;
}

// Helper function to get price display HTML
function getPriceHTML(item, currentSize = null) {
    const price = currentSize ? currentSize.price : item.price;
    const originalPrice = currentSize ? currentSize.originalPrice : item.originalPrice;
    const newPrice = currentSize ? currentSize.newPrice : item.newPrice;
    
    // If there's a newPrice, show both original (strikethrough) and new price
    if (newPrice !== undefined && newPrice !== null) {
        return `
            <div class="menu-item-price">
                <span class="original-price">${originalPrice || price} جنيه</span>
                <span class="new-price">${newPrice} جنيه</span>
            </div>
        `;
    }
    
    // Otherwise, show normal price
    return `<div class="menu-item-price">${price} جنيه</div>`;
}

// Display Menu Items
function displayMenu(category = 'all') {
    const container = document.getElementById('menuContainer');
    const filtered =  getCategoryItems(menuItems, category);

    if(filtered.length === 0){
        container.innerHTML = '<div class="alert alert-info">لا توجد عناصر في هذا القسم حالياً.</div>';
        return;
    }
    // Add category title if exists
    let categoryTitleHTML = '';
    const categoryTitle = getCategoryTitle(category);
    if (categoryTitle) {
        categoryTitleHTML = `
            <div class="col-12">
                <div class="category-title">
                    <i class="fas fa-info-circle"></i> ${categoryTitle}
                </div>
            </div>
        `;
    }
    container.innerHTML = categoryTitleHTML + filtered.map(item => {
        // Handle items with sizes
        if (item.hasSizes) {
            const selectedSize = selectedSizes[item.id] || item.sizes[0].id;
            const currentSize = item.sizes.find(s => s.id === selectedSize);
            const itemKey = getItemKey(item.id, selectedSize);
            const cartItem = cart.find(i => i.cartKey === itemKey);
            const isInCart = !!cartItem;

            return `
            <div class="col-md-4">
                <div class="menu-item">
                    <img src="${item.image}" alt="${item.name}" class="menu-item-img">
                    <div class="menu-item-body">
                        <div class="menu-item-title">${item.name}</div>
                        <div class="menu-item-desc">${item.description?item.description:''}</div>
                        
                        <div class="size-options">
                            ${item.sizes.map(size => `
                                <button class="size-btn ${selectedSize === size.id ? 'active' : ''}" 
                                        onclick="selectSize(${item.id}, '${size.id}')">
                                    ${size.name}
                                </button>
                            `).join('')}
                        </div>
                        
                        ${getPriceHTML(item, currentSize)}
                        
                        ${isInCart ? `
                            <div class="item-quantity-control">
                                <button class="item-qty-btn" onclick="decreaseQuantityFromMenu(${item.id}, '${selectedSize}')">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <div class="item-qty-display">${cartItem.quantity}</div>
                                <button class="item-qty-btn" onclick="increaseQuantityFromMenu(${item.id}, '${selectedSize}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="item-delete-btn" onclick="removeFromCartMenu(${item.id}, '${selectedSize}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : `
                            <button class="add-to-cart-btn" onclick="addToCart(${item.id}, '${selectedSize}')">
                                <i class="fas fa-cart-plus"></i> أضف للسلة
                            </button>
                        `}
                    </div>
                </div>
            </div>
            `;
        } else {
            // Regular items without sizes
            const cartItem = cart.find(i => i.cartKey === getItemKey(item.id));
            const isInCart = !!cartItem;
            
            return `
            <div class="col-md-4">
                <div class="menu-item">
                    <img src="${item.image}" alt="${item.name}" class="menu-item-img">
                    <div class="menu-item-body">
                        <div class="menu-item-title">${item.name}</div>
                        <div class="menu-item-desc">${item.description? item.description : ''}</div>
                        
                        ${getPriceHTML(item)}
                        
                        ${isInCart ? `
                            <div class="item-quantity-control">
                                <button class="item-qty-btn" onclick="decreaseQuantityFromMenu(${item.id})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <div class="item-qty-display">${cartItem.quantity}</div>
                                <button class="item-qty-btn" onclick="increaseQuantityFromMenu(${item.id})">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="item-delete-btn" onclick="removeFromCartMenu(${item.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : `
                            <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                                <i class="fas fa-cart-plus"></i> أضف للسلة
                            </button>
                        `}
                    </div>
                </div>
            </div>
            `;
        }
    }).join('');
}

// Filter Category
function filterCategory(category) {
    currentCategory = category;
    displayMenu(category);
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Add to Cart
function addToCart(itemId, sizeId = null) {
    const item = getCategoryItems(menuItems,'all').find(i => i.id === itemId);
    const itemKey = getItemKey(itemId, sizeId);
    const existingItem = cart.find(i => i.cartKey === itemKey);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        let cartItem = { ...item, quantity: 1, cartKey: itemKey };
        
        // Add size information if applicable
        if (item.hasSizes && sizeId) {
            const size = item.sizes.find(s => s.id === sizeId);
            cartItem.selectedSize = size;
            // Use newPrice if available, otherwise use regular price
            cartItem.price = size.newPrice !== undefined && size.newPrice !== null ? size.newPrice : size.price;
            cartItem.displayName = `${item.name} - ${size.name}`;
        } else {
            cartItem.displayName = item.name;
            // Use newPrice if available, otherwise use regular price
            cartItem.price = item.newPrice !== undefined && item.newPrice !== null ? item.newPrice : item.price;
        }
        
        cart.push(cartItem);
    }
    
    updateCart();
    displayMenu(currentCategory);
}

// Update Cart
function updateCart() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 20px;"></i><p>السلة فارغة</p></div>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.displayName}</strong>
                    <div>${item.price} جنيه</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="decreaseQuantity('${item.cartKey}')">-</button>
                    <span style="font-weight: bold; min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button class="qty-btn" onclick="increaseQuantity('${item.cartKey}')">+</button>
                    <button class="remove-btn" onclick="removeFromCart('${item.cartKey}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }
    
    // Calculate total based on order type
    let totalPrice = subtotal;
    let totalText = '';
    
    if (orderType === 'delivery') {
        totalText = `الإجمالي : ${totalPrice} جنيه غير شامل التوصيل`;
    } else {
        totalPrice += SERVICE_FEE;
        totalText = `المجموع الفرعي: ${subtotal} جنيه<br> الخدمة: ${SERVICE_FEE} جنيه<br><strong>الإجمالي: ${totalPrice} جنيه</strong>`;
    }
    
    cartTotal.innerHTML = totalText;
}

// Increase Quantity
function increaseQuantity(cartKey) {
    const item = cart.find(i => i.cartKey === cartKey);
    if (item) {
        item.quantity++;
        updateCart();
        displayMenu(currentCategory);
    }
}

// Decrease Quantity
function decreaseQuantity(cartKey) {
    const item = cart.find(i => i.cartKey === cartKey);
    if (item && item.quantity > 1) {
        item.quantity--;
        updateCart();
        displayMenu(currentCategory);
    }
}

// Remove from Cart
function removeFromCart(cartKey) {
    cart = cart.filter(i => i.cartKey !== cartKey);
    updateCart();
    displayMenu(currentCategory);
}

// Increase from Menu
function increaseQuantityFromMenu(itemId, sizeId = null) {
    const cartKey = getItemKey(itemId, sizeId);
    increaseQuantity(cartKey);
}

// Decrease from Menu
function decreaseQuantityFromMenu(itemId, sizeId = null) {
    const cartKey = getItemKey(itemId, sizeId);
    const item = cart.find(i => i.cartKey === cartKey);
    if (item && item.quantity > 1) {
        decreaseQuantity(cartKey);
    } else {
        removeFromCart(cartKey);
    }
}

// Remove from Menu
function removeFromCartMenu(itemId, sizeId = null) {
    const cartKey = getItemKey(itemId, sizeId);
    removeFromCart(cartKey);
}

// Toggle Cart Modal
function toggleCart() {
    const modal = document.getElementById('cartModal');
    modal.classList.toggle('active');
}

// Send to WhatsApp
function sendToWhatsApp() {
    if (cart.length === 0) {
        showAlert('السلة فارغة!', 'error');
        return;
    }
    
    const phoneNumber = '201500909753';
    let message = '🍽️ *طلب جديد من مطعم راشيدي*\n\n';
    
    // Validate based on order type
    if (orderType === 'delivery') {
        const address = document.getElementById('deliveryAddress').value.trim();
        const customerName = document.getElementById('customerName').value.trim();
        const phoneNumberInput = document.getElementById('PhoneNumber').value.trim();
        const additionalPhone = document.getElementById('additionalPhone').value.trim();
        
        // Validate required fields
        if (!address) {
            showAlert('من فضلك أدخل عنوان التوصيل!', 'error');
            document.getElementById('deliveryAddress').focus();
            return;
        }
        if(!customerName){
            showAlert('من فضلك أدخل الاسم!', 'error');
            document.getElementById('customerName').focus();
            return;
        }
        if(!phoneNumberInput){
            showAlert('من فضلك أدخل رقم الهاتف!', 'error');
            document.getElementById('PhoneNumber').focus();
            return;
        }

        const phoneRegex = /^(01)[0-2,5]{1}[0-9]{8}$/;
        if (!phoneRegex.test(phoneNumberInput)) {
            showAlert('رقم الهاتف غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015', 'error');
            document.getElementById('PhoneNumber').focus();
            return;
        }

        if (!/^\d+$/.test(phoneNumberInput)) {
            showAlert('رقم الهاتف يجب أن يحتوي على أرقام فقط!', 'error');
            document.getElementById('PhoneNumber').focus();
            return;
        }

        if (additionalPhone != '' && !phoneRegex.test(additionalPhone)) {
            showAlert('رقم الهاتف الإضافي غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015', 'error');
            document.getElementById('additionalPhone').focus();
            return;
        }

        if (additionalPhone != '' &&  !/^\d+$/.test(additionalPhone)) {
            showAlert('رقم الهاتف يجب أن يحتوي على أرقام فقط!', 'error');
            document.getElementById('additionalPhone').focus();
            return;
        }

        message += '📦 *نوع الطلب: توصيل*\n\n';
        message += '📋 *الطلبات:*\n';
        
        cart.forEach(item => {
            message += `\n• ${item.displayName} (${item.quantity}x) - ${item.price * item.quantity} جنيه\n`;
            message += `---------------------------------\n`;
        });
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        message += `\n💰 *الإجمالي: ${total} جنيه غير شامل التوصيل*\n\n`;
        
        message += `📍 *عنوان التوصيل:*\n${address}\n`;
        message += `---------------------------------\n`;
        message += `👤 *اسم العميل:*\n${customerName}\n`;
        message += `---------------------------------\n`;
        message += `📞 *رقم الهاتف:*\n${phoneNumberInput}\n`;
        if (additionalPhone) {
            message += `\n📱 *رقم هاتف إضافي:*\n${additionalPhone}\n`;
        }
        message += `---------------------------------\n`;

        const hint = document.getElementById('hint').value.trim();
        if (hint) {
            message += `📝 *ملاحظات إضافية:*\n${hint}\n`;
        }

    } else if (orderType === 'dinein') {
        const tableNumber = document.getElementById('tableNumber').value.trim();
        // const customerName = document.getElementById('customerName').value.trim();
        
        // Validate required fields
        if (!tableNumber) {
            showAlert('من فضلك أدخل رقم الطاولة!', 'error');
            document.getElementById('tableNumber').focus();
            return;
        }

        message += '🪑 *نوع الطلب: طاولة بالمطعم*\n\n';
        message += '📋 *الطلبات:*\n';
        
        cart.forEach(item => {
            message += `\n• ${item.displayName} (${item.quantity}x) - ${item.price * item.quantity} جنيه\n`;
            message += `---------------------------------\n`;
        });
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + SERVICE_FEE;
        message += `\n💵 *المجموع الفرعي: ${subtotal} جنيه*\n`;
        message += `🔧 *رسوم الخدمة: ${SERVICE_FEE} جنيه*\n`;
        message += `💰 *الإجمالي: ${total} جنيه*\n\n`;
        
        message += `🪑 *رقم الطاولة:*\n${tableNumber}\n`;
        message += `---------------------------------\n`;
        
        if (customerName) {
            message += `👤 *اسم العميل:*\n${customerName}\n`;
            message += `---------------------------------\n`;
        }

        const hint = document.getElementById('hint').value.trim();
        if (hint) {
            message += `📝 *ملاحظات إضافية:*\n${hint}\n`;
        }
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Clear cart and form after sending
    cart = [];
    if (orderType === 'delivery') {
        document.getElementById('deliveryAddress').value = '';
        document.getElementById('PhoneNumber').value = '';
        document.getElementById('additionalPhone').value = '';
    } else {
        document.getElementById('tableNumber').value = '';
        document.getElementById('customerName').value = '';
    }
    document.getElementById('hint').value = '';
    
    updateCart();
    displayMenu(currentCategory);
    toggleCart();
    
    // Show success message
    showAlert('تم إرسال طلبك بنجاح!.', 'success');
}

// Initialize
displayMenu();