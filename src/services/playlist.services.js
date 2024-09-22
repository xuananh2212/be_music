const { v4: uuidv4 } = require("uuid");
const { UserPlaylist } = require("../models/index");

module.exports = {
     findPlayListAll: async (data) => {
          return await UserPlaylist.findAll(data)
     },
     createPlayList: async (data) => {
          return await UserPlaylist.create({
               id: uuidv4(),
               ...data,
          });
     },
     findPlayListByUserAndName: async (userId, name) => {
          return await UserPlaylist.findOne({
               where: {
                    user_id: userId,
                    name: name,
               },
          });
     },
     findByPk: async (pk) => {
          return await UserPlaylist.findByPk(pk);
     }

};
