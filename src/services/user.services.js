const { User } = require('../models/index');
const { v4: uuidv4 } = require('uuid');
const { Op } = require("sequelize");
module.exports = {
     findUserById: async (id) => {
          return await User.findByPk(id);
     },
     findUserByEmail: async (email) => {
          return await User.findOne(
               {
                    where: {
                         email
                    }
               }
          )
     },
     findByUserName: async (user_name) => {
          return await User.findOne(
               {
                    where: {
                         user_name
                    }
               }
          )
     },
     findOneUserByEmailAndDifferentId: async (id, email) => {
          return await User.findOne({
               where: {
                    [Op.and]: [
                         {
                              id: {
                                   [Op.ne]: id
                              }
                         },
                         {
                              email
                         }
                    ]
               }
          })
     },
     findUserAndCountAll: async (data) => {
          return await User.findAndCountAll(data);
     },
     createUser: async (data) => {
          return await User.create(
               {
                    id: uuidv4(),
                    ...data
               }
          )
     },
     updateUser: async function (id, data) {
          await User.update(
               {

                    ...data
               },
               {
                    where: {
                         id
                    }
               }
          );
          return await this.findUserById(id);

     },
     deleteManyUser: async (userIds) => {
          await User.destroy({
               where: {
                    id: userIds
               }
          });
     }

}