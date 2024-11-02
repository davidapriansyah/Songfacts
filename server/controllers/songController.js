const { response } = require("express");
const { Song, sequelize } = require("../models/index");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Op } = require("sequelize");

class songController {
  static async read(req, res, next) {
    try {
      // console.log(req.query, "===ini isinya");
      let { page, limit, q } = req.query;

      //Pagination
      if (!Number(page)) page = 1;
      if (!Number(limit)) limit = 12;

      //SEARCH
      let queryOption = {
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
      };

      if (q) {
        queryOption.where = {
          band: {
            [Op.iLike]: `%${q}%`,
          },
        };
      }

      console.log(queryOption);

      let { count, rows } = await Song.findAndCountAll(queryOption);

      let result = {
        total: count,
        size: limit,
        totalPage: Math.ceil(count / limit),
        currentPage: Number(page),
        data: rows,
      };

      res.status(200).json({
        result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async readFact(req, res, next) {
    try {
      const { id } = req.params;
      const song = await Song.findByPk(id);

      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }

      // Access your API key as an environment variable (see "Set up your API key" above)
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `tolong berikan funfact lengkap tentang band ${song.band} dan lagu ${song.title} dalam bentuk json tanpa tag json dan berikan data json funfacts dari lagu dan band nya secara lengkap dalam satu object serta berikan menggunakan bahasa indonesia bagian funfact nya`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = JSON.parse(response.text());
      console.log(text);

      res.status(200).json({
        song,
        text,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = songController;
