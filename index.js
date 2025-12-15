async function loadMenu() {
  const files = [
    "sandwich",
    "mashawy",
    "wagabat-fardy",
    "wagabat-zawgy",
    "sawaany",
    "edafat",
    "offers"
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
    offers: results[6].offers
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
let selectedSizes = {}; // Track selected size for each item

// Load menu and initialize
loadMenu().then(menu => {
  menuItems = {
    sandwich: addIds(menu.sandwich),
    mashawy: addIds(menu.mashawy),
    wagabatFardy: addIds(menu.wagabatFardy),
    wagabatZawgy: addIds(menu.wagabatZawgy),
    sawaany: addIds(menu.sawaany),
    edafat: addIds(menu.edafat),
    offers: addIds(menu.offers)
  };
  
  // Initialize display after menu is loaded
  displayMenu();
}).catch(err => {
  document.getElementById('menuContainer').innerHTML = '<div class="alert alert-danger">فشل تحميل القائمة. يرجى تحديث الصفحة.</div>';
});
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


// Display Menu Items
function displayMenu(category = 'all') {
    const container = document.getElementById('menuContainer');
    const filtered =  getCategoryItems(menuItems, category);

    if(filtered.length === 0){
        container.innerHTML = '<div class="alert alert-info">لا توجد عناصر في هذا القسم حالياً.</div>';
        return;
    }
    container.innerHTML = filtered.map(item => {
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
                        
                        <div class="menu-item-price">${currentSize.price} جنيه</div>
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
                        <div class="menu-item-price">${item.price} جنيه</div>
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
    debugger;
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
            cartItem.price = size.price;
            cartItem.displayName = `${item.name} - ${size.name}`;
        } else {
            cartItem.displayName = item.name;
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
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
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
    
    cartTotal.textContent = `الإجمالي : ${totalPrice} جنيه غير شامل التوصيل`;
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
        alert('السلة فارغة!');
        return;
    }
    
    // Get delivery details
    const address = document.getElementById('deliveryAddress').value.trim();
    const phoneNumberInput = document.getElementById('PhoneNumber').value.trim();
    const additionalPhone = document.getElementById('additionalPhone').value.trim();
    const hint = document.getElementById('hint').value.trim();
    
    // Validate required fields
    if (!address) {
        alert('من فضلك أدخل عنوان التوصيل!');
        document.getElementById('deliveryAddress').focus();
        return;
    }
    if(!phoneNumberInput){
        alert('من فضلك أدخل رقم الهاتف!');
        document.getElementById('PhoneNumber').focus();
        return;
    }

    const phoneRegex = /^(01)[0-2,5]{1}[0-9]{8}$/; // Egyptian phone format: 01X XXXX XXXX
    if (!phoneRegex.test(phoneNumberInput)) {
        alert('رقم الهاتف غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015');
        document.getElementById('PhoneNumber').focus();
        return;
    }

    // ✅ Validate phone contains only numbers
    if (!/^\d+$/.test(phoneNumberInput)) {
        alert('رقم الهاتف يجب أن يحتوي على أرقام فقط!');
        document.getElementById('PhoneNumber').focus();
        return;
    }

    if (additionalPhone != '' && !phoneRegex.test(additionalPhone)) {
        alert('رقم الهاتف غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015');
        document.getElementById('PhoneNumber').focus();
        return;
    }

    // ✅ Validate phone contains only numbers
    if (additionalPhone != '' &&  !/^\d+$/.test(additionalPhone)) {
        alert('رقم الهاتف يجب أن يحتوي على أرقام فقط!');
        document.getElementById('PhoneNumber').focus();
        return;
    }


    
    // Replace with your WhatsApp number (include country code without + or 00)
    const phoneNumber = '201500909753'; // Example: 201234567890
    
    let message = '🍽️ *طلب جديد من مطعم راشيدي*\n\n';
    message += '📋 *الطلبات:*\n';
    
    cart.forEach(item => {
        message += `\n• ${item.displayName} (${item.quantity}x) - ${item.price * item.quantity} جنيه\n`;
        message += `---------------------------------\n`;
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\n💰 *الإجمالي: ${total} جنيه غير شامل التوصيل*\n\n`;
    
    message += `📍 *عنوان التوصيل:*\n${address}\n`;
    
    message += `📞 *رقم الهاتف:*\n${phoneNumberInput}\n`;
    
    if (additionalPhone) {
        message += `\n📱 *رقم هاتف إضافي:*\n${additionalPhone}`;
    }

    if (hint) {
        message += `\n📝 *ملاحظات إضافية:*\n${hint}\n`;
    }
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Clear cart after sending
    cart = [];
    document.getElementById('deliveryAddress').value = '';
    document.getElementById('PhoneNumber').value = '';
    document.getElementById('additionalPhone').value = '';
    document.getElementById('hint').value = '';
    updateCart();
    displayMenu(currentCategory);
    toggleCart();
    
    // Show success message
    alert('تم إرسال طلبك بنجاح! سيتم التواصل معك قريباً.');
}

// Initialize
displayMenu();