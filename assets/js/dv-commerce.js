


$(document).ready(function() {
var imported = document.createElement('script');
imported["className"] = 'devless-connection';
imported.attributes['devless-con-token'] = {"value":"0cc39661d0556719cedbda4bfa463ac1"}
imported.src = 'http://localhost:8080/js/devless-sdk.js';
console.log(imported);
document.body.appendChild(imported);
    dvInterceptQueryResponse = function(response) {

        if (Object.keys(response)[0] === 'products') {

            response.products.forEach((item, index) => {
                if (item.discount === 0) {
                    response.products[index].purchased_price_value = response.products[index].price;
                    response.products[index].purchased_price = `GH&cent; <span>${response.products[index].price}</span>`;
                    response.products[index].price = ''
                } else {
                    if (item.is_percentage === 1) {
                        response.products[index].purchased_price_value = getPercentageDiscount(item);
                        response.products[index].purchased_price = `GH&cent; ${getPercentageDiscount(item)}`;
                    } else if (item.is_percentage === 0) {
                        response.products[index].purchased_price_value = getDiscountValue(item);
                        response.products[index].purchased_price = `GH&cent; ${getDiscountValue(item)}`;
                    }
                    response.products[index].price = `<span class='actual-price'>GH&cent; ${response.products[index].price}</span>`;
                }
            });
        }

        return response;
    };

    function getPercentageDiscount(item) {
        return (item.discount / 100) * item.price;
    }

    function getDiscountValue(item) {
        return item.price - item.discount;
    }
    if (!localStorage.getItem('dv-cart')) {
        let cartId = randomStr(8);
        localStorage.setItem('dv-cart', JSON.stringify({
            code: cartId,
            items: []
        }));
    } else {
        updateCartSize();
    }
    $('#searchForm').on('submit', function(event) {
        event.preventDefault();
        var newloction = $(this).attr('action') + $('#query').val();
        console.log(newloction);
        window.location = newloction;
    });
    $('body').on('click', '.add-to-cart', function(event) {
        let itemPrice = $(this).children('.meta-data').children('.price').html();
        let itemName = $(this).children('.meta-data').children('.name').html();
        let itemId = $(this).children('.meta-data').children('.product-id').html();
        addItem(itemId, itemName, itemPrice);
        updateCartSize();
    });

    function randomStr(m) {
        var m = m || 9;
        s = '';
        r = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < m; i++) {
            s += r.charAt(Math.floor(Math.random() * r.length));
        }
        return s;
    };

    function addItem(id, name, price) {
        let cart = getCart();
        itemsIndex = cart.items.findIndex((item, index) => {
            return name === item.name;
        });
        if (itemsIndex === -1) {
            cart.items.push({ id, name, price, units: 1 });
        } else {
            itemToUpdate = cart.items[itemsIndex];
            cart.items[itemsIndex] = {
                id: itemToUpdate.id,
                name: itemToUpdate.name,
                price: itemToUpdate.price,
                units: itemToUpdate.units + 1
            };
        };

        saveCartToLocalStorage(cart);
    }

    function updateCartSize() {
        $('.counter').html(getCart().items.length);
    }

    function removeItem(index) {

    }

    function clearCart() {
        let cart = getCart();
        cart.items = [];
        saveCartToLocalStorage(cart);
    }

    function resetCart() {
        let cartId = randomStr(8);
        localStorage.setItem('dv-cart', JSON.stringify({
            code: cartId,
            items: []
        }));
    }

    function getCart() {
        return JSON.parse(localStorage.getItem('dv-cart'));
    }

    function saveCartToLocalStorage(cart) {
        localStorage.setItem('dv-cart', JSON.stringify(cart));
    }


    var app = new Vue({
        el: '#check-out',
        mounted: function() {
            let cart = getCart();
            this.cartCode = cart.code;
            this.cartItems = cart.items;
        },
        data: {
            cartCode: '',
            cartItems: [],
            showCart: true,
            userInfo: {},
            submitted: false
        },
        methods: {
            formatMoney: function(amount) {
                return accounting.formatMoney(amount, { symbol: "GHS", format: "%s %v" });
            },
            removeItem: function(itemToindex) {
                this.cartItems = this.cartItems.filter((item, index) => index !== itemToindex);
                this.saveToCart();
            },
            saveToCart: function() {
                saveCartToLocalStorage({ code: this.cartCode, items: this.cartItems });
            },
            toggleCart: function() {
                this.showCart = !this.showCart;
            },
            submitPurchase: function() {
                let data = {
                    cart: getCart(),
                    userInfo: this.userInfo
                };
                console.log(JSON.stringify(data));
                this.submitted = true;
                SDK.call('shopit', 'checkout', [JSON.stringify(data)],
                    (response) => {
                        this.submitted = false;
                        swal(
                            'Order submitted',
                            'Continue Shopping',
                            'success'
                        ).then(() => {
                            window.location = '/';
                        });
                    }
                );
            }
        },
        computed: {
            hasItems: function() {
                if (!this.cartItems) {
                    return false
                }
                return this.cartItems.length === 0;
            },
            totalItemPrice: function() {
                totalAmount = this.cartItems.reduce((sum, item) => parseFloat(item.price) + sum, 0);
                return this.formatMoney(totalAmount);
            }
        }

    })


});