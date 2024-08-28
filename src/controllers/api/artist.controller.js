var _ = require("lodash");
const { object, string } = require("yup");
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
        bio, stage_name: stageName,
        user_id: userId,
      })
      Object.assign(response, {
        status: 201,
        message: "Success",
        artist: artist.dataValues

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
      const { id, urlImage, phone } = req.body;
      let artistFind = await artistServices.findArtistByUserId(id);
      if (!artistFind) {
        Object.assign(response, {
          status: 404,
          message: "id không tồn tại",
        });
        return res.status(response.status).json(response);
      }
      const user = userServices.findUserById(userId);
      user.url_image = urlImage;
      user.phone = phone;
      user.save();

      if (artistFind.dataValues.stage_name === req.body.stageName) {
        artistFind = await artistServices.updateArtist(id, {
          stage_name: req.body.stageName,
          bio: req.body.bio,
        });
      } else {
        let artistSchema = object({
          stageName: string()
            .required("vui lòng nhập nghệ danh")
            .test("unique", "nghệ danh đã tồn tại", async (stageName) => {
              const duplicateCheck = await artistServices.findByStageArtist(
                stageName
              );
              return !duplicateCheck;
            }),
        });
        const body = await artistSchema.validate(req.body, {
          abortEarly: false,
        });
        artistFind = await artistServices.updateArtist(id, {
          stage_name: body.stageName,
          bio: body.bio,
        });
      }

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
  handleAllArtist: async (req, res) => {
    const response = {};
    try {

    } catch (err) {
      Object.assign(response, {
        status: 400,
        message: 'Yêu cầu không hợp lệ',

      })
    }
    return res.status(response.status).json(response);
  },
};
