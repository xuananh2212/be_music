var _ = require("lodash");
const { object, string } = require("yup");
const artistServices = require("../../services/artist.services");

module.exports = {
     handleCreate: async (req, res) => {
          const response = {};
          const { id } = req.params;
          try {
               let albumSchema = object({
                    artistId: string()
                         .required("không được để trống artistId")
                         .test("unique", "artistId chưa tồn tại", async (artistId) => {
                              return await artistServices.findArtistById(artistId);

                         }),
                    title: string().required("không được để trống title"),
               });
               const body = await albumSchema.validate(
                    { ...req.body, userId: id },
                    { abortEarly: false }
               );
               const artist = await artistServices.createArtist({
                    artist_id: body.artistId,
                    title: body.title,
                    release_date: body.releaseDate,
                    image_url: body.imageUrl,
               });
               Object.assign(response, {
                    status: 201,
                    message: "Success",
                    artist: artist.dataValues,
               });
          } catch (e) {
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


};
