const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

app.use("/customer/auth/*", function auth(req, res, next) {
    const accessToken = req.session.accessToken;
  
    if (!accessToken) {
      return res.status(401).json({ message: "Access Denied: No token provided." });
    }
  
    jwt.verify(accessToken, 'your_secret_key', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Access Denied: Invalid token." });
      }
      req.user = decoded; // Attach decoded token (user info) to req.user
      next(); 
    });
});  
 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
