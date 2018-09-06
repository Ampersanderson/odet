import "../../styles/theme.scss";
import "../../styles/theme.scss.liquid";
import "../../styles/fonts.scss.liquid";

($ => {
  const $body = $("body");
  const $siteNav = $(".site-nav");
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
  const $productDetails = $(".js-product-details");
  const $productWrapper = $(".js-product-wrapper");
  const $detailsTab = $(".js-details-tab");
  const $mobileHeader = $(".js-header.hide-md");
  const $desktopHeader = $(".js-header.show-md");
  const $footer = $(".js-footer");
  const $productTabs = $(".product-tabs");
  const $productTab = $(".product-tab");
  const $viewCart = $(".js-view-cart");
  const $shopCollection = $(".js-shop-collection");
  const $addToCartError = $(".add-to-cart-error");

  const breakpoint = () => {
    return window.getComputedStyle(document.querySelector("body"), ":before")
      .content;
  };

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
            <a class="h5 white no-underline remove-from-cart hover-opacity-5" href="#">
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
      $viewCart.show();
      $shopCollection.hide();
      $headerCount.show().text(count);
      $sidebarCount.text(
        `${count} ${count === 1 ? "Item in Cart" : "Items in Cart"}`
      );
    } else {
      $viewCart.hide();
      $shopCollection.show();
      $headerCount.hide();
      $cartSubtotal.hide();
      $sidebarCount.text("0 Items in Cart");
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

  const notYetSelected = (fieldName, $form) => {
    const $placeholder = $form.find(`.placeholder:contains('${fieldName}')`);
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
    const $form = $(e.currentTarget);

    if (notYetSelected("Size", $form) || notYetSelected("Qty", $form)) {
      return;
    }

    const qty = $("select[name='quantity']")
      .find(":selected")
      .text()
      .replace("Qty", "")
      .trim();

    const size = $("select[name='id']")
      .find(":selected")
      .text()
      .replace("Size", "")
      .trim();

    const variantsAvailable = $("select[name='id']")
      .find(":selected")
      .filter(":enabled")
      .data("variants-length");

    if (qty > variantsAvailable) {
      $addToCartError
        .show()
        .text(
          variantsAvailable === 1
            ? `There is only ${variantsAvailable} item left in ${size} size.`
            : `There are only ${variantsAvailable} items left in ${size} size.`
        );
      return;
    }

    $addToCartError.hide();
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

  $(".odet-page")
    .find("h5")
    .addClass("odet-heading");

  $(".odet-page")
    .find("img")
    .each(function() {
      const $image = $(this);
      const alt = $image.attr("alt");

      if ($image.parent().is("p")) {
        $image.unwrap();
        $image.wrap(
          '<div class="js-img-wrapper text-center"><div class="inline-block"></div></div>'
        );
        $image.after(`<span class="block text-left mx-auto h5">${alt}</span>`);
      }
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

  const positionDetailsFixed = () => {
    $productDetails.css({
      top: $desktopHeader.height(),
      bottom: "auto",
      position: "fixed"
    });
  };

  const positionDetailsAbsoluteTop = () => {
    $productDetails.css({
      top: 0,
      bottom: "auto",
      position: "absolute"
    });
  };

  const positionDetailsAbsoluteBottom = () => {
    $productDetails.css({
      bottom: 0,
      top: "auto",
      position: "absolute"
    });
  };

  const positionProductDetails = () => {
    const isOverflowing =
      $productDetails.outerHeight() + $desktopHeader.height() >
      $(window).height();

    if (isOverflowing) {
      reattachProductDetails();
      positionDetailsAbsoluteTop();
    } else {
      detachProductDetails();
      positionDetailsFixed();
    }
  };

  const stickProductDetails = () => {
    const offsetTop = $(window).scrollTop();
    const PONR = $productWrapper.height() - $productDetails.outerHeight();

    if (offsetTop > PONR) {
      reattachProductDetails();
      positionDetailsAbsoluteBottom();
    } else {
      detachProductDetails();
      positionDetailsFixed();
    }
  };

  const detachProductDetails = () => {
    const $details = $productDetails.detach();
    $body.append($details);
  };

  const reattachProductDetails = () => {
    const $details = $productDetails.detach();
    $productWrapper.append($details);
  };

  $(".js-close-announcement").on("click", e => {
    e.preventDefault();

    $(".js-announcement").addClass("hide");
    localStorage.setItem("showAnnouncement", "false");
  });

  if (localStorage.showAnnouncement === "false") {
    $(".js-announcement").addClass("hide");
  }

  $productTab.on("click", e => {
    const tab = $(e.currentTarget).data("tab");

    $(e.currentTarget)
      .siblings()
      .removeClass("active");
    $(e.currentTarget).addClass("active");
    $productTabs.find("pre").hide();
    $productTabs.find(`pre[data-tab=${tab}]`).show();
  });

  $productTabs.each(function() {
    $(this)
      .find(".product-tab")
      .first()
      .trigger("click");
  });

  $(window).scroll(() => {
    if (breakpoint() === "sm") {
      return;
    }

    positionProductDetails();
    stickProductDetails();
  });

  $(window).on("load", () => {
    updateCart();

    if (breakpoint() === "sm") {
      return;
    }

    positionProductDetails();
    stickProductDetails();
  });

  $(window).on("resize", () => {
    if (breakpoint() === "sm") {
      return;
    }

    positionProductDetails();
    stickProductDetails();
  });
})(jQuery);
