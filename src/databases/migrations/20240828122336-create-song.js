'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Songs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      artist_id: {
        type: Sequelize.STRING
      },
      genre_id: {
        type: Sequelize.STRING,
      },
      album_id: {
        type: Sequelize.STRING,
      },
      title: {
        type: Sequelize.STRING
      },
      file_url: {
        type: Sequelize.STRING
      },
      video_url: {
        type: Sequelize.STRING
      },
      duration: {
        type: Sequelize.INTEGER
      },
      release_date: {
        type: Sequelize.STRING
      },
      views: {
        type: Sequelize.INTEGER
      },
      favorites: {
        type: Sequelize.INTEGER
      },
      lyrics: {
        type: Sequelize.TEXT
      },
      approved: {
        type: Sequelize.BOOLEAN
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }

    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Songs');
  }
};