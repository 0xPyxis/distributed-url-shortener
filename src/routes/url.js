const express = require("express");
const router = express.Router();
const urlService = require("../services/urlService");

router.post("/shorten", async (req, res, next) => {
  try {
    const { url } = req.body;

    const shortCode = await urlService.createShortUrl(url);

    res.json({
      shortUrl: `${req.protocol}://${req.get("host")}/${shortCode}`,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:shortCode", async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    const originalUrl = await urlService.getOriginalUrl(shortCode);

    res.redirect(originalUrl);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
