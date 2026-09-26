const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { resSuccess, resError } = require("../../services/responseHandler");

const CAPTURE_DIR = path.join(__dirname, "../../capture");

/**
 * GET /api/v1/face/latest-capture
 * Return foto terbaru dari folder /capture (untuk preview)
 */
router.get("/latest-capture", async (req, res) => {
  try {
    if (!fs.existsSync(CAPTURE_DIR)) {
      fs.mkdirSync(CAPTURE_DIR, { recursive: true });
      return resSuccess({ res, title: "No captures yet", data: null });
    }

    const files = fs.readdirSync(CAPTURE_DIR)
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
      .map(file => {
        const filePath = path.join(CAPTURE_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: `/capture/${file}`,
          timestamp: stats.mtimeMs
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    if (files.length === 0) {
      return resSuccess({ res, title: "No captures found", data: null });
    }

    return resSuccess({ res, title: "Latest capture retrieved", data: files[0] });
  } catch (error) {
    return resError({ res, title: "Failed to get latest capture", errors: error.message });
  }
});

module.exports = router;