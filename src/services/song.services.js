const { v4: uuidv4 } = require("uuid");
const { Song } = require("../models/index");

module.exports = {
     createSong: async (data) => {
          return await Song.create({
               id: uuidv4(),
               ...data,
          });
     },
     findSongAndCountAll: async (data) => {
          return await Song.findAndCountAll(data);
     }

};
