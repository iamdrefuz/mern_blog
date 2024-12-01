const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const User = require('./models/User');
const Post = require('./models/Post');
const Project = require('./models/Project')

const app = express();
const uploadMiddleware = multer({ dest: 'uploads/' });
const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktj';

app.use(cors({ 
  origin: ['http://localhost:3000', 'http://192.168.1.11:3000'], 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

// MongoDB ulanish
mongoose.connect('mongodb+srv://iamdrefuz:qwertyi7@blog.0klys.mongodb.net/?retryWrites=true&w=majority&appName=blog');

// Middleware: JWT ni tekshirish
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Token is missing.' });
  }
  jwt.verify(token, secret, (err, info) => {
    if (err) {
      return res.status(403).json({ error: 'Unauthorized. Invalid token.' });
    }
    req.user = info;
    next();
  });
};

// Foydalanuvchini ro'yxatdan o'tkazish
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.status(201).json(userDoc);
  } catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
});

// Kirish
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.findOne({ username });
    if (!userDoc) {
      return res.status(400).json({ error: 'User not found' });
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (!passOk) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ username, id: userDoc._id }, secret, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true }).json({
      id: userDoc._id,
      username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Yangi foydalanuvchi yaratish
    const hashedPassword = bcrypt.hashSync(password, salt); // Parolni shifrlash
    const userDoc = await User.create({
      username,
      password: hashedPassword,
    });

    // Javob qaytarish
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userDoc._id,
        username: userDoc.username,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(400).json({ error: 'Registration failed' });
  }
});


app.post("/post/:id/increment-views", (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.views += 1; // Views sonini oshiramiz
    res.status(200).send({ message: "Views incremented", views: post.views });
  } else {
    res.status(404).send({ message: "Post not found" });
  }
});



// Profilni olish
app.get('/profile', verifyToken, (req, res) => {
  res.json(req.user);
});

// Blog yaratish
app.post('/post', uploadMiddleware.single('file'), verifyToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { originalname, path } = req.file;
    const ext = originalname.split('.').pop();
    const newPath = `${path}.${ext}`;
    fs.renameSync(path, newPath);

    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: req.user.id,
    });

    res.status(201).json(postDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Blogni tahrirlash
app.put('/post', uploadMiddleware.single('file'), verifyToken, async (req, res) => {
  try {
    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);
    if (!postDoc) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postDoc.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not the author.' });
    }

    let newPath = postDoc.cover;
    if (req.file) {
      const { originalname, path } = req.file;
      const ext = originalname.split('.').pop();
      newPath = `${path}.${ext}`;
      fs.renameSync(path, newPath);
    }

    postDoc.title = title;
    postDoc.summary = summary;
    postDoc.content = content;
    postDoc.cover = newPath;

    await postDoc.save();
    res.json(postDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Bloglarni olish
app.get('/post', async (req, res) => {
  const posts = await Post.find().populate('author', ['username']).sort({ createdAt: -1 }).limit(20);
  res.json(posts);
});

// Bitta blogni olish
app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  if (!postDoc) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(postDoc);
});






//Projects


app.post('/project', uploadMiddleware.single('file'), verifyToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { originalname, path } = req.file;
    const ext = originalname.split('.').pop();
    const newPath = `${path}.${ext}`;
    fs.renameSync(path, newPath);

    const { title, category, content } = req.body;
    const postDoc = await Project.create({
      title,
      category,
      content,
      cover: newPath,
      author: req.user.id,
    });

    res.status(201).json(postDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Blogni tahrirlash
app.put('/project', uploadMiddleware.single('file'), verifyToken, async (req, res) => {
  try {
    const { id, title, category, content } = req.body;
    const postDoc = await Project.findById(id);
    if (!postDoc) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postDoc.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not the author.' });
    }

    let newPath = postDoc.cover;
    if (req.file) {
      const { originalname, path } = req.file;
      const ext = originalname.split('.').pop();
      newPath = `${path}.${ext}`;
      fs.renameSync(path, newPath);
    }

    postDoc.title = title;
    postDoc.category = category;
    postDoc.content = content;
    postDoc.cover = newPath;

    await postDoc.save();
    res.json(postDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Bloglarni olish
app.get('/project', async (req, res) => {
  const posts = await Project.find().populate('author', ['username']).sort({ createdAt: -1 }).limit(20);
  res.json(posts);
});

// Bitta blogni olish
app.get('/project/:id', async (req, res) => {
  const { id } = req.params;
  const postDoc = await Project.findById(id).populate('author', ['username']);
  if (!postDoc) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(postDoc);
});







// Chiqish
app.post('/logout', (req, res) => {
  res.cookie('token', '').json({ message: 'Logged out.' });
});




////





const router = express.Router();

const isAdmin = require('./milleware/isAdmin'); // Adminni tekshirish

// Home sahifasini o'zgartirish
router.put('/home', verifyToken, isAdmin, (req, res) => {
  const { content } = req.body;
  // Logika: Home sahifasini yangilash
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







////
app.delete('/post/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not the author.' });
    }
    await Post.findByIdAndDelete(id);
    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});



app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});        