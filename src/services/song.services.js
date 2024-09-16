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
     },
     findSongById: async (songId, options = {}) => {
          try {
               const song = await Song.findOne({
                    where: { id: songId },
                    ...options, // Include any additional options (like associations)
               });
               return song;
          } catch (error) {
               throw new Error('Error fetching song details');
          }
     },
     updateSong: async (songId, data) => {
          try {
               const updatedSong = await Song.update(data, {
                    where: { id: songId },
               });
               return updatedSong;
          } catch (error) {
               throw new Error('Error updating song');
          }
     },
     deleteSong: async (songId) => {
          try {
               const deletedSong = await Song.destroy({
                    where: { id: songId },
               });
               return deletedSong;
          } catch (error) {
               throw new Error('Error deleting song');
          }
     }

};
