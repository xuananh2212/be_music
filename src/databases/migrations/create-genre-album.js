// migrations/xxxx-create-album-genre.js
'use strict';

module.exports = {
     up: async (queryInterface, Sequelize) => {
          await queryInterface.createTable('AlbumGenre', {
               id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
               },
               album_id: {
                    type: Sequelize.STRING,
                    references: {
                         model: 'Albums',
                         key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
               },
               genre_id: {
                    type: Sequelize.STRING,
                    references: {
                         model: 'Genres',
                         key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
               },
               created_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
               },
               updated_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
               },
          });
     },

     down: async (queryInterface, Sequelize) => {
          await queryInterface.dropTable('AlbumGenre');
     },
};
