const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "yir5vhk3a5ot",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "sQ5ibiXdu9QxgGMwiEPmxycb3R-8z9EA-6sykkJEaHM",
});

console.log(client);

const navBtn = document.querySelector(".nav-btn");
const links = document.querySelector(".links-container");
const cartBtn = document.querySelector(".cart-icon");
const cart = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const closeBTn = document.querySelector(".close-btn");
const totalAmount = document.querySelector(".total");
const totalItems = document.querySelector(".cart-items");
const cartContent = document.querySelector(".cart-content");
const clearBtn = document.querySelector(".clear-btn");
const productsContainer = document.querySelector(".products-container");

let cartItem = [];
let buttonsDom = [];
class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: "collecticHome",
      });

      let products = contentful.items;
      products = products.map((item) => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { id, title, image, price };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

class UI {
  displayProducts(products) {
    let result = "";
    products.forEach((product) => {
      result += `
       <article class="product">
          <div class="img-container">
            <img src=${product.image} alt=${product.title} />
            <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"></i>add to cart
            </button>
          </div>
          <h3>${product.title}</h3>
          <h4>$${product.price}</h4>
        </article>
      `;
    });
    productsContainer.innerHTML = result;
  }
  getBagButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDom = buttons;
    buttons.forEach((button) => {
      let id = button.dataset.id;
      let inCart = cartItem.find((item) => item.id === id);
      if (inCart) {
        button.innerText = "in cart";
        button.disabled = true;
      }

      button.addEventListener("click", (event) => {
        event.target.innerText = "in cart";
        event.target.disabled = true;
        let tempCartItem = { ...Storage.getProduct(id), amount: 1 };
        cartItem = [...cartItem, tempCartItem];
        Storage.saveCart(cartItem);
        this.setCartvalues(cartItem);
        this.addCartItems(tempCartItem);
        this.showCart();
      });
    });
  }
  setCartvalues(cartItem) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cartItem.map((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    totalItems.innerText = itemsTotal;
    totalAmount.innerText = parseFloat(tempTotal.toFixed(2));
  }

  addCartItems(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `<img src=${item.image} alt=${item.title} />
          <div class="item-info">
            <h4>${item.title}</h4>
            <h5>${item.price}</h5>
            <p class="remove" data-id=${item.id}>remove</p>
          </div>
          <div class="quantity">
            <button class="increase-btn">
              <i class="fas fa-chevron-up" data-id=${item.id}></i>
            </button>
            <p class="item-amount">${item.amount}</p>
            <button class="decrease-btn">
              <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </button>
          </div>`;
    cartContent.appendChild(div);
  }
  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cart.classList.add("show-cart");
    links.classList.remove("show-links");
    navBtn.classList.remove("navBtn-style");
  }

  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cart.classList.remove("show-cart");
  }

  setupAPP() {
    cartItem = Storage.getCart();
    this.setCartvalues(cartItem);
    this.PopulateCart(cartItem);
    cartBtn.addEventListener("click", this.showCart);
    closeBTn.addEventListener("click", this.hideCart);
  }

  PopulateCart(cartItem) {
    cartItem.forEach((item) => this.addCartItems(item));
  }
  cartLogic() {
    clearBtn.addEventListener("click", () => {
      this.clearCart();
    });

    cartContent.addEventListener("click", (event) => {
      if (event.target.classList.contains("remove")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id);
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cartItem.find((item) => item.id === id);
        tempItem.amount += 1;
        Storage.saveCart(cartItem);
        this.setCartvalues(cartItem);
        addAmount.parentElement.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cartItem.find((item) => item.id === id);
        tempItem.amount -= 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cartItem);
          this.setCartvalues(cartItem);
          lowerAmount.parentElement.previousElementSibling.innerText =
            tempItem.amount;
        } else {
          cartContent.removeChild(
            lowerAmount.parentElement.parentElement.parentElement
          );
          this.removeItem(id);
        }
      }
    });
  }

  clearCart() {
    let cartItemsId = cartItem.map((item) => item.id);
    cartItemsId.forEach((id) => this.removeItem(id));
    console.log(cartContent.children);
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }
  removeItem(id) {
    cartItem = cartItem.filter((item) => item.id !== id);
    this.setCartvalues(cartItem);
    Storage.saveCart(cartItem);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
  }

  getSingleButton(id) {
    return buttonsDom.find((button) => button.dataset.id === id);
  }
}

class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id);
  }

  static saveCart(cartItem) {
    localStorage.setItem("cartItem", JSON.stringify(cartItem));
  }

  static getCart() {
    return localStorage.getItem("cartItem")
      ? JSON.parse(localStorage.getItem("cartItem"))
      : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const products = new Products();
  const ui = new UI();
  ui.setupAPP();
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons(products);
      ui.cartLogic();
    });
});

navBtn.addEventListener("click", () => {
  links.classList.toggle("show-links");
  navBtn.classList.toggle("navBtn-style");
});

// cartBtn.addEventListener("click", () => {
//   cartOverlay.classList.add("transparentBcg");
//   cart.classList.add("show-cart");
//   links.classList.remove("show-links");
//   navBtn.classList.remove("navBtn-style");
// });

// const cartRemove = () => {
//   cartOverlay.classList.remove("transparentBcg");
//   cart.classList.remove("show-cart");
// };

// closeBTn.addEventListener("click", () => {
//   cartOverlay.classList.remove("transparentBcg");
//   cart.classList.remove("show-cart");
// });
