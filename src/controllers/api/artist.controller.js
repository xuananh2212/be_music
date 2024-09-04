var _ = require("lodash");
const { object, string } = require("yup");
var { regexPhone, regexUrl } = require("../../helpers/validate");
const artistServices = require("../../services/artist.services");
const userServices = require("../../services/user.services");
module.exports = {
  handleCreateArtist: async (req, res) => {
    const response = {};
    const userId = req.user.id;
    try {
      let artistSchema = object({
        stageName: string().required("vui lòng nhập nghệ danh"),
      });
      const body = await artistSchema.validate(req.body, { abortEarly: false });
      const { bio, stageName } = body;
      const artist = await artistServices.createArtist({
        bio,
        stage_name: stageName,
        user_id: userId,
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

  handleDeleteArtist: async (req, res) => {
    const response = {};
    const { id } = req.params;
    try {
      const artist = await artistServices.findArtistById(id);
      if (!artist) {
        return res
          .status(404)
          .json({ status: 404, message: "artist không tồn tại!" });
      }
      await artist.destroy();
      Object.assign(response, {
        status: 200,
        message: "Xóa Thành công",
        artistId: id,
      });
    } catch (e) {
      Object.assign(response, {
        status: 400,
        message: e?.message,
      });
    }
    return res.status(response.status).json(response);
  },

  handleDeleteManyArtist: async (req, res) => {
    const response = {};
    const { artistIds } = req.body;
    try {
      if (!Array.isArray(artistIds)) {
        throw new Error("Định dạng dữ liệu không hợp lệ!");
      }
      if (artistIds.length === 0) {
        throw new Error("danh sách id rỗng!");
      }
      await artistServices.deleteManyArtist(artistIds);

      Object.assign(response, {
        status: 200,
        message: "xóa Thành công",
        artistIds,
      });
    } catch (e) {
      console.log(e);
      Object.assign(response, {
        status: 400,
        message: e.message,
      });
    }
    return res.status(response.status).json(response);
  },

  handleEditArtist: async (req, res) => {
    const response = {};
    try {
      const userId = req.user.id;
      const { id } = req.body;

      let artistFind = await artistServices.findArtistById(id);
      if (!artistFind) {
        Object.assign(response, {
          status: 404,
          message: "id không tồn tại",
        });
        return res.status(response.status).json(response);
      }

      let artistSchema = object({
        name: string().required("vui lòng nhập tên"),
        urlImage: string()
          .matches(regexUrl, "không đúng định dạng url")
          .notRequired(),
        phone: string()
          .matches(regexPhone, "không đúng dịnh dạng điện thoại")
          .notRequired(),
        stageName: string()
          .required("vui lòng nhập nghệ danh")
          .test("unique", "nghệ danh đã tồn tại", async (stageName) => {
            const duplicateCheck = await artistServices.findByStageArtist(
              id,
              stageName
            );

            return !duplicateCheck;
          }),
      });

      const body = await artistSchema.validate(req.body, {
        abortEarly: false,
      });

      const user = await userServices.findUserById(userId);
      user.url_image = body.urlImage;
      user.name = body.name;
      user.phone = body.phone;
      user.save();

      artistFind = await artistServices.updateArtist(id, {
        stage_name: body.stageName,
        bio: body.bio,
      });

      Object.assign(response, {
        status: 200,
        message: "cập nhật thành công",
        artist: artistFind,
      });
    } catch (e) {
      if (response?.status !== 404) {
        const errors = Object.fromEntries(
          e?.inner?.map((item) => [item.path, item.message])
        );
        Object.assign(response, {
          status: 400,
          message: "Yêu cầu không hợp lệ",
          errors,
        });
      } else {
        Object.assign(response, {
          message: e?.message,
        });
      }
    }
    return res.status(response.status).json(response);
  },

  handleGetAllArtist: async (req, res) => {
    const response = {};

    try {
      const artists = await artistServices.findAllArtist();

      artists.forEach((item) => delete item.dataValues.password);
      const artistDataValues = artists.map((item) => item.dataValues);
      Object.assign(response, {
        status: 200,
        message: "Thành công",
        artists: artistDataValues,
      });
    } catch (err) {
      Object.assign(response, {
        status: 400,
        message: "Yêu cầu không hợp lệ",
      });
    }
    return res.status(response.status).json(response);
  },

  handleProfileArtist: async (req, res) => {
    const response = {};

    try {
      const userId = req.user.id;

      const artist = await artistServices.findProfileArtist(userId);

      delete artist.dataValues.user.dataValues.password;

      Object.assign(response, {
        status: 200,
        message: "Thành công",
        artist: artist,
      });
    } catch (err) {
      Object.assign(response, {
        status: 400,
        message: "Yêu cầu không hợp lệ",
      });
    }
    return res.status(response.status).json(response);
  },
};
