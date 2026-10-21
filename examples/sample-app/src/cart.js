// Shopping cart helpers for the sample app.

/** Compute the cart total including tax. */
function total(items, taxRate) {
  let sum = 0;
  // add up each line item
  for (const item of items) {
    if (item.qty <= 0) continue;
    sum += item.price * item.qty;
  }
  return sum * (1 + taxRate);
}

class Cart {
  constructor(owner) {
    this.owner = owner;
    this.items = [];
  }
  add(item) {
    if (!item.sku) throw new Error('missing sku');
    this.items.push(item);
  }
}

const applyCoupon = (amount, coupon) => {
  if (coupon === 'HALF') return amount / 2;
  return amount;
};
module.exports = { total, Cart, applyCoupon };
