const express = require('express');
const app = express();

const userController = require('../controllers/userController');

app.get('/', userController.getIndex);

module.exports = app;