var express = require("express");
var ejs = require("ejs");
var mysql = require("mysql");
const fs = require("fs");
var session = require("express-session");
var bodyParser = require("body-parser");
const { request } = require("http");
const { query } = require("express");

mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "node_project",
});

var app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({ secret: "secret" }));

app.listen(8080);
app.use(bodyParser.urlencoded({ extended: true }));

function isProductInCart(cart, id) {
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      return true;
    }
  }
  return false;
}
function calculateTotal(cart, req) {
  total = 0;
  for (let i = 0; i < cart.length; i++) {
    //if we're offering a discount price
    if (cart[i].sale_price) {
      total = total + cart[i].sale_price * cart[i].quantity;
    } else {
      total = total + cart[i].price * cart[i].quantity;
    }
  }
  req.session.total = total;
  return total;
}

//localhost:8080
app.get("/", function (req, res) {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });

  con.query("SELECT * FROM products", (err, result) => {
    // fs.readFile(`./public/images/`, (err, data) => {
    //   if (err) console.log(err);
    //   else result[0].image = data;
    // });
    res.render("pages/index", { result: result });
  });
});

app.post("/add_to_cart", function (req, res) {
  var id = req.body.id;
  var name = req.body.name;
  var price = req.body.price;
  var sale_price = req.body.sale_price;
  var quantity = req.body.quantity;
  var image = req.body.image;
  var product = {
    id: id,
    name: name,
    price: price,
    sale_price: sale_price,
    quantity: quantity,
    image: image,
  };
  if (req.session.cart) {
    var cart = req.session.cart;
    if (!isProductInCart(cart, id)) {
      cart.push(product);
    }
  } else {
    req.session.cart = [product];
    var cart = req.session.cart;
  }
  //calculate total
  calculateTotal(cart, req);

  //return to cart page
  res.redirect("/cart");
});

app.get("/cart", function (req, res) {
  var cart = req.session.cart;
  var total = req.session.total;
  res.render("pages/cart", { cart: cart, total: total });
});

app.post("/remove_product", function (req, res) {
  var id = req.body.id;
  var cart = req.session.cart;
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      cart.splice(cart.indexOf(i), i);
    }
  }
  //recalculate total
  calculateTotal(cart, req);
  res.redirect("/cart");
});

app.post("/edit_product_quantity", function (req, res) {
  //get values from inputs
  const id = req.body.id;
  var quantity = req.body.quantity;
  var increase_btn = req.body.increase_product_quantity;
  var decrease_btn = req.body.decrease_product_quantity;

  var cart = req.session.cart;
  if (increase_btn) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        if (cart[i].quantity > 0) {
          cart[i].quantity = parseInt(cart[i].quantity) + 1;
        }
      }
    }
  }

  if (decrease_btn) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        if (cart[i].quantity > 1) {
          cart[i].quantity = parseInt(cart[i].quantity) - 1;
        }
      }
    }
  }
  calculateTotal(cart, req);
  res.redirect("/cart");
});

app.get("/checkout", function (req, res) {
  var total = req.session.total;
  res.render("pages/checkout", { total: total });
});
app.post("/place_order", function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var phone = req.body.phone;
  var city = req.body.city;
  var address = req.body.address;
  var cost = req.session.total;
  var status = "not paid";
  var date = new Date();
  var products_ids = " ";

  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });

  var cart = req.session.cart;
  var product_ids = "";

  if (Array.isArray(cart)) {
    for (let i = 0; i < cart.length; i++) {
      product_ids = product_ids + "," + cart[i].id;
    }
  }

  con.connect((err) => {
    if (err) {
      console.log(err);
    } else {
      var query =
        "INSERT INTO order(cost,name,email,status,city,address,phone,date,product_ids) VALUES ?";
      var product_ids = [1, 2, 3];
      var values = [
        [cost, name, email, status, city, address, phone, date, product_ids],
      ];
      con.query(query, [values], (err, result) => {
        res.redirect("/payment");
      });
    }
  });
});
app.get("/payment", function (req, res) {
  var total = req.session.total;
  res.render("pages/payment", { total: total });
});
