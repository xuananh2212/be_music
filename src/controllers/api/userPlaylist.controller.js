const { object, string } = require("yup");
var _ = require("lodash");
const userPlaylistServices = require("../../services/userPlaylist.services");
module.exports = {
  handleCreatePlaylist: async (req, res) => {
    const response = {};
    const userId = req.user.id;
    try {
      let userPlaylistSchema = object({
        name: string()
          .required("vui lòng nhập tên playlist")
          .test("unique", "tên playlist đã tồn tại", async (name) => {
            const duplicateCheck =
              await userPlaylistServices.findUserPlaylistByName(name);
            return !duplicateCheck;
          }),
      });

      const body = await userPlaylistSchema.validate(req.body, {
        abortEarly: false,
      });

      const playlist = await userPlaylistServices.createUserPlaylist({
        name: body.name,
        user_id: userId,
      });

      Object.assign(response, {
        status: 201,
        message: "Success",
        playlist: playlist.dataValues,
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
  handleDeleteUserPlaylist: async (req, res) => {
    const response = {};
    const { id } = req.params;
    try {
      const playlist = await userPlaylistServices.findUserPlaylistById(id);
      if (!playlist) {
        return res
          .status(404)
          .json({ status: 404, message: "playlist không tồn tại!" });
      }
      await playlist.destroy();
      Object.assign(response, {
        status: 200,
        message: "Xóa Thành công",
        playlistId: id,
      });
    } catch (e) {
      Object.assign(response, {
        status: 400,
        message: e?.message,
      });
    }
    return res.status(response.status).json(response);
  },
  handleDeleteManyUserPlaylist: async (req, res) => {
    const response = {};
    const { userPlaylists } = req.body;
    try {
      if (!Array.isArray(userPlaylists)) {
        throw new Error("Định dạng dữ liệu không hợp lệ!");
      }
      if (userPlaylists.length === 0) {
        throw new Error("danh sách id rỗng!");
      }

      await userPlaylistServices.deleteManyUserPlaylist(userPlaylists);
      Object.assign(response, {
        status: 200,
        message: "Xóa Thành công",
        playlistId: userPlaylists,
      });
    } catch (e) {
      Object.assign(response, {
        status: 400,
        message: e?.message,
      });
    }
    return res.status(response.status).json(response);
  },
  handleEditNameUserPlaylist: async (req, res) => {
    const response = {};
    const { id } = req.params;
    try {
      let userPlaylistSchema = object({
        name: string()
          .required("vui lòng nhập tên playlist")
          .test("unique", "tên playlist đã tồn tại", async (name) => {
            const duplicateCheck =
              await userPlaylistServices.findUserPlaylistByName(name);
            return !duplicateCheck;
          }),
      });

      const playlist = await userPlaylistServices.findUserPlaylistById(id);
      if (!playlist) {
        return res
          .status(404)
          .json({ status: 404, message: "playlist không tồn tại!" });
      }

      const body = await userPlaylistSchema.validate(req.body, {
        abortEarly: false,
      });

      playlist.name = body.name;

      playlist.save();

      Object.assign(response, {
        status: 200,
        message: "Sửa Thành công",
        playlistUpdated: id,
      });
    } catch (e) {
      Object.assign(response, {
        status: 400,
        message: e?.message,
      });
    }
    return res.status(response.status).json(response);
  },
  handleGetAllUserPlaylist: async (req, res) => {
    const userId = req.user.id;
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    console.log("page, limit", page, limit);
    const offset = (page - 1) * limit;

    try {
      const { count, rows: userPlaylists } =
        await userPlaylistServices.findAllUserPlaylist({
          user_id: userId,
          limit: limit,
          offset: offset,
        });
      console.log(count);

      const totalPages = Math.ceil(count / limit);

      res.json({
        data: userPlaylists,
        meta: {
          totalItems: count,
          currentPage: page,
          totalPages: totalPages,
          pageSize: limit,
        },
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({ message: "Error fetching playlist user", err });
    }
  },
};
