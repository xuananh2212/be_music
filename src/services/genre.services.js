const { v4: uuidv4 } = require("uuid");
const { Genre } = require("../models/index");

module.exports = {
     createGenre: async (data) => {
          return await Genre.create({
               id: uuidv4(),
               ...data,
          });
     },
     findGenreAndCountAll: async (data) => {
          return await Genre.findAndCountAll(data);
     },
     findGenrebyOne: async (data) => {
          return await Genre.findOne(data);
     },
     deleteGenre: async (data) => {
          return await Genre.destroy(data);
     },
     findByPk: async (data) => {
          return await Genre.findByPk(data);
     }

};
