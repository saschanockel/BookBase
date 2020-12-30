function addToCart(id) {
  let cart = $.cookie('cart');

  if (cart) {
    cart = JSON.parse(cart);
    if (cart.books.indexOf(id) === -1) {
      cart.books.push(id);
      $.cookie('cart', JSON.stringify(cart), {path: '/'});
    }
  } else {
    cart = JSON.stringify({books: [id]});
    $.cookie('cart', cart, {path: '/'});
  }
}

function removeFromCart(id) {
  let cart = $.cookie('cart');

  if (cart) {
    cart = JSON.parse(cart);
    if (cart.books.length === 1) {
      $.removeCookie('cart', {path: '/'});
      $(`#cartItem${id}`).remove();
      $(`#cartItemSeparator${id}`).remove();
      location.reload(true);
    } else {
      cart.books = cart.books.splice(cart.books.indexOf(id) - 1, 1);
      $.cookie('cart', JSON.stringify(cart), {path: '/'});
      $(`#cartItem${id}`).remove();
      $(`#cartItemSeparator${id}`).remove();
      location.reload(true);
    }
  }
}
