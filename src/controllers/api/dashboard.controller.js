const { object, string } = require("yup");
const genreServices = require("../../services/genre.services");
var _ = require("lodash");
const { UserHiddenSong, UserPlaylist, SongPart, User, PlaylistSong, UserFavorite, Song, Artist, Album, Genre, UserHistory } = require("../../models/index");
const { Op, Sequelize } = require("sequelize");
module.exports = {
     getTotalCounts: async (req, res) => {
          try {
               // Đếm tổng số lượng của từng đối tượng
               const [totalUsers, totalGenres, totalArtists, totalAlbums, totalSongs, totalPlaylists, totalHistories] = await Promise.all([
                    User.count(),           // Tổng số User
                    Genre.count(),          // Tổng số Genre (thể loại)
                    Artist.count(),         // Tổng số Artist (nghệ sĩ)
                    Album.count(),          // Tổng số Album
                    Song.count(),           // Tổng số Song (bài hát)
                    UserPlaylist.count(),   // Tổng số Playlist (danh sách phát)
                    UserHistory.count(),    // Tổng số lịch sử nghe nhạc
               ]);

               // Trả về dữ liệu tổng số lượng cho client
               res.status(200).json({
                    status: 200,
                    success: true,
                    message: "Lấy tổng số lượng thành công",
                    data: {
                         totalUsers,
                         totalGenres,
                         totalArtists,
                         totalAlbums,
                         totalSongs,
                         totalPlaylists,
                         totalHistories
                    }
               });
          } catch (error) {
               console.error("Lỗi khi lấy tổng số lượng:", error);
               return res.status(500).json({
                    status: 500,
                    success: false,
                    message: "Lỗi khi lấy tổng số lượng",
               });
          }
     },
};
