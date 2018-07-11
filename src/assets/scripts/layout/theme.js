import "../../styles/theme.scss";
import "../../styles/theme.scss.liquid";
import "../../styles/fonts.scss.liquid";

($ => {
  const $body = $("body");
  const $mobileNav = $(".mobile-nav");
  const $mobileNavLink = $(".mobile-nav a");
  const $cart = $(".cart-items");
  const $trigger = $(".js-cart-trigger");
  const $headerCount = $(".js-header-count");
  const $sidebarCount = $(".js-sidebar-count");
  const $cartSubtotal = $(".js-sidebar-subtotal");
  const $cartTotal = $(".js-cart-total");
  const $cartForm = $(".js-cart-form");
  const $cartError = $(".js-cart-error");
  const $mobileNavOpen = $(".js-mobile-nav-open");
  const $mobileNavClose = $(".js-mobile-nav-close");

  $trigger.on("click", e => {
    e.preventDefault();

    $body.hasClass("cart-open")
      ? $body.removeClass("cart-open")
      : $body.addClass("cart-open");
  });

  const priceToCurrency = price => {
    return `$${price / 100}`;
  };

  const quantityOptions = [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" }
  ];

  const cartItemToHtml = ({
    image,
    variant_id,
    variant_title,
    product_title,
    product_type,
    quantity,
    price
  }) => {
    return `
      <div class="cart-item w100p pb1" data-id="${variant_id}">
        <div class="flex w100p">
          <div class="width-4 height-5 bg-center bg-cover" style="background-image: url(${image})"></div>
          <div class="flex-1 flex flex-column justify-between px1">
            <div>
              <p class="m0">${product_title}</p>
              <p class="m0 h5">${variant_title} ${product_type}</p>
            </div>
            <span class="h5">
              ${priceToCurrency(price)}
            </span>
          </div>
          <div class="flex flex-column justify-between">
            <div class="relative">
              <div class="p1 border border-black flex items-center justify-center">
                ${quantity} <div class="arrow-down arrow-down-white"></div>
              </div>
              <select class="absolute t0 l0 w100p h100p o0p pointer">
                ${quantityOptions.map(
                  ({ value, label }) =>
                    `<option value="${value}" ${
                      quantity === value ? "selected=selected" : ""
                    }>
                    ${label}
                  </option>`
                )}
              </select>
            </div>
            <a class="h5 white no-underline remove-from-cart" href="#">
              Remove
            </a>
          </div>
        </div>
      </div>
    `;
  };

  const findItemId = $el => {
    return $el.closest(".cart-item").data("id");
  };

  const findItemById = id => {
    return $cart.find(`.cart-item[data-id='${id}']`);
  };

  const calculateCartCount = items => {
    return items.reduce((acc, { quantity }) => acc + quantity, 0);
  };

  const getCartItems = () => {
    return $.getJSON("/cart.js");
  };

  const createCartItem = data => {
    return $.post("/cart/add.js", data);
  };

  const updateCartItem = (id, amount) => {
    return $.post("/cart/update.js", { updates: { [id]: amount } });
  };

  const deleteCartItem = id => {
    return $.post("/cart/update.js", { updates: { [id]: 0 } });
  };

  const updateItemsUI = items => {
    $cart.html(items.map(cartItemToHtml).join("\n"));
  };

  const appendCartItem = (item, id) => {
    $("<div/>")
      .addClass("append-cart-item")
      .appendTo(".cart-items")
      .html(cartItemToHtml(item))
      .delay(250);

    setTimeout(() => {
      $(".append-cart-item").addClass("slide");
      updateCart(false);
    }, 300);
  };

  const updateCountUI = count => {
    if (count > 0) {
      $headerCount.show().text(count);
      $sidebarCount.text(
        `${count} ${count === 1 ? "Item in Cart" : "Items in Cart"}`
      );
    } else {
      $headerCount.hide();
      $cartSubtotal.hide();
      $sidebarCount.html(`
        <p>
          You ain’t seen nothing yet!<br />
          <a class="white" href="/collections/the-collection">Shop the collection</a>
        </p>
      `);
    }
  };

  const updateTotalUI = total => {
    $cartTotal.text(total);
  };

  const updateCart = (reorderItems = true) => {
    getCartItems().done(({ items, total_price }) => {
      if (reorderItems) {
        updateItemsUI(items);
      }
      updateTotalUI(priceToCurrency(total_price));
      updateCountUI(calculateCartCount(items));
    });
  };

  const deleteItem = e => {
    e.preventDefault();

    const id = findItemId($(e.currentTarget));
    deleteCartItem(id).done(() => {
      findItemById(id).hide();
      updateCart();
    });
  };

  const updateQuantity = e => {
    const id = findItemId($(e.currentTarget));
    updateCartItem(id, e.target.value).done(updateCart);
  };

  const hideError = () => {
    $cartError.hide();
  };

  const showError = description => {
    $cartError.show().text(description);
  };

  const notYetSelected = fieldName => {
    const $placeholder = $(`.placeholder:contains('${fieldName}')`);
    const placeholderText = $placeholder.text().trim();

    if (placeholderText === fieldName) {
      setTimeout(() => $placeholder.addClass("flash-select"), 100);
      setTimeout(() => $placeholder.removeClass("flash-select"), 300);

      return true;
    }

    return false;
  };

  $cart.on("click", ".remove-from-cart", e => deleteItem(e));
  $cart.on("change", "select", e => updateQuantity(e));

  $cartForm.on("submit", e => {
    e.preventDefault();

    if (notYetSelected("Size") || notYetSelected("Qty")) {
      return;
    }

    $body.addClass("cart-open");

    const serializedData = $(e.currentTarget).serialize();
    const serializedJSON = $(e.currentTarget).serializeArray();

    const id = serializedJSON[0].value;
    const alreadyInCart = findItemById(id).length === 1;

    if (!alreadyInCart) {
      createCartItem(serializedData)
        .done(response => {
          hideError();
          const item = JSON.parse(response);
          appendCartItem(item, id);
        })
        .fail(({ responseText }) => {
          const { description } = JSON.parse(responseText);
          setTimeout(() => showError(description), 250);
        });
    }
  });

  $cartForm.find("select").on("change", e => {
    const $select = $(e.currentTarget);

    $select
      .siblings(".placeholder")
      .find("span")
      .text($select.find("option:selected").text());
  });

  // Reset generated content margin
  $(".odet-page")
    .find("p")
    .last()
    .addClass("m0");

  $(".product-image").each(function() {
    $(this).bind("load", () => $(this).addClass("show"));
  });

  $mobileNavOpen.on("click", e => {
    $body.addClass("overflow-hidden");
    $mobileNav.addClass("open");
  });

  $mobileNavClose.on("click", e => {
    $body.removeClass("overflow-hidden");
    $mobileNav.removeClass("open");
  });

  $mobileNavLink.on("click", e => {
    $body.removeClass("overflow-hidden");
    $mobileNav.removeClass("open");
  });

  // On page load
  updateCart();
})(jQuery);
