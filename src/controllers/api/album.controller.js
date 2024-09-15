var _ = require("lodash");
const { object, string } = require("yup");
const albumServices = require("../../services/album.services");
const artistServices = require("../../services/artist.services");

module.exports = {
     handleCreate: async (req, res) => {
          const response = {};
          const userId = req.user.id;
          try {
               let albumSchema = object({
                    title: string().required("không được để trống title"),
               });
               const body = await albumSchema.validate(
                    req.body,
                    { abortEarly: false }
               );
               const artist = await artistServices.findOneByArtist(
                    {
                         user_id: userId
                    }
               );
               const album = await albumServices.createAlbum({
                    artist_id: artist.id,
                    title: body.title,
                    release_date: body.releaseDate,
                    image_url: body.imageUrl,
               });
               Object.assign(response, {
                    status: 201,
                    message: "Success",
                    album: album.dataValues,
               });
          } catch (e) {
               console.log("1", e);
               let errors = {};
               if (e?.inner) {
                    errors = Object.fromEntries(
                         e.inner.map((item) => [item.path, item.message])
                    );
               }
               Object.assign(response, {
                    status: 400,
                    message: "Yêu cầu không hợp lệ",
                    errors: _.isEmpty(errors) ? e?.message : errors,
               });
          }
          return res.status(response.status).json(response);
     },
     handleGetAll: async (req, res) => {
          let { page, limit } = req.query;
          page = parseInt(page) || 1;
          limit = parseInt(limit) || 10;
          console.log("page, limit", page, limit);
          const offset = (page - 1) * limit;
          try {
               const { count, rows: genres } = await albumServices.findGenreAndCountAll({
                    limit: limit,
                    offset: offset,
               });

               const totalPages = Math.ceil(count / limit);

               res.json({
                    data: genres,
                    meta: {
                         totalItems: count,
                         currentPage: page,
                         totalPages: totalPages,
                         pageSize: limit
                    }
               });
          } catch (error) {
               res.status(500).json({ message: 'Error fetching genres', error });
          }
     }


};
