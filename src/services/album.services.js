const { v4: uuidv4 } = require("uuid");
const { Album } = require("../models/index");

module.exports = {
     createAlbum: async (data) => {
          return await Album.create({
               id: uuidv4(),
               ...data,
          });
     },

};
