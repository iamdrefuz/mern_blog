const express = require('express');
const verifyToken = require('../milleware/verifyToken');
const isAdmin = require('../milleware/isAdmin');

const router = express.Router();

// Home sahifasini o'zgartirish
router.put('/home', verifyToken, isAdmin, (req, res) => {
  const { content } = req.body;
  res.json({ message: 'Home page updated successfully', content });
});

// Contact sahifasini o'zgartirish
router.put('/contact', verifyToken, isAdmin, (req, res) => {
  const { content } = req.body;
  res.json({ message: 'Contact page updated successfully', content });
});

// About sahifasini o'zgartirish
router.put('/about', verifyToken, isAdmin, (req, res) => {
  const { content } = req.body;
  res.json({ message: 'About page updated successfully', content });
});

module.exports = router;
