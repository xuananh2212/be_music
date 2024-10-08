const { v4: uuidv4 } = require("uuid");
const { Album } = require("../models/index");

module.exports = {
     createAlbum: async (data) => {
          return await Album.create({
               id: uuidv4(),
               ...data,
          });
     },
     findAlbumAndCountAll: async (data) => {
          return await Album.findAndCountAll(data);
     },
     findAlbumById: async (id, props) => {
          return await Album.findByPk(id, props);
     },
     deleteAlbum: async (data) => {
          return await Album.destroy(data);
     }

};
