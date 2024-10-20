require('dotenv').config();
const { Blacklist } = require("../models/index");
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { ACCESS_TOKEN, REFRESH_TOKEN } = process.env;
module.exports = {
     verifyToken: (token) => {
          return jwt.verify(token, ACCESS_TOKEN);
     },
     generateAccessToken: (id) => {
          return jwt.sign({ id }, ACCESS_TOKEN, { expiresIn: '18h' });
     },
     generateRefreshToken: (id) => {
          return jwt.sign({ id }, REFRESH_TOKEN, { expiresIn: '20h' });
     },
     findBlacklist: async (token) => {
          return await Blacklist?.findOne({
               where: {
                    token
               }
          });
     },
}