const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const reviews = {};

const isValid = (username)=>{
  return users.some(user => user.username === username);
}

const authenticatedUser = (username,password)=>{
  const user = users.find(user => user.username === username);
  return user && user.password === password;
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!isValid(username)) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(403).json({ message: "Invalid password" });
  }

  const token = jwt.sign({ username }, 'your_secret_key', { expiresIn: '1h' });

  // Store the token in the session
  req.session.accessToken = token;

  return res.status(200).json({
    message: "Successfully logged in",
    token: token
  });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { username } = req.user; // Get username from the decoded token
  const { review } = req.body;

  if (!username) {
    return res.status(401).json({ message: "Unauthorized: Please log in first" });
  }

  const isbn = req.params.isbn;
  if (!review) {
    return res.status(400).json({ message: "Review text is required" });
  }

  if (!reviews[isbn]) {
    reviews[isbn] = [];
  }

  const existingReviewIndex = reviews[isbn].findIndex(r => r.username === username);
  
  if (existingReviewIndex >= 0) {
    reviews[isbn][existingReviewIndex].review = review;
    return res.status(200).json({ message: "Review updated", reviews: reviews[isbn] });
  } else {
    reviews[isbn].push({ username, review });
    return res.status(201).json({ message: "Review added", reviews: reviews[isbn] });
  }
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { username } = req.user; // Get username from the decoded token
  const isbn = req.params.isbn; // Get ISBN from the route parameter

  if (!username) {
    return res.status(401).json({ message: "Unauthorized: Please log in first" });
  }

  const bookReviews = reviews[isbn]; // Fetch reviews for the book
  if (!bookReviews) {
    return res.status(404).json({ message: "No reviews found for this book" });
  }

  const reviewIndex = bookReviews.findIndex(r => r.username === username);

  if (reviewIndex === -1) {
    return res.status(403).json({ message: "You can only delete your own review" });
  }

  // Remove the review
  bookReviews.splice(reviewIndex, 1);

  // If no reviews left, delete the reviews key
  if (bookReviews.length === 0) {
    delete reviews[isbn];
  }

  return res.status(200).json({ message: "Review deleted successfully", reviews: bookReviews });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
