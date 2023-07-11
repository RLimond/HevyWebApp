const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const path = require('path')
require('dotenv').config()

const port = process.env.PORT || 5000;
const app = express();
const db_url = process.env.DATABASE_URI

const corsOptions = {
  origin: ['https://hevy-webapp.onrender.com'],
  credentials: true // Allow credentials (cookies, authorization headers)
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())
app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/auth', require('./routes/authRoutes'))
app.use('/user', require('./routes/userRoutes'))
app.use('/users', require('./routes/usersRoutes'))

app.listen(port, () => {
    try {
        mongoose.connect(db_url)
        .then(() => console.log('connected to mongo'))
        .catch((err) => {
        console.error('failed to connect with mongo');
        console.error(err);
      });
        console.log('Server is running on port ' + port);
    } catch (error) {
        console.log(error)
    }
  });