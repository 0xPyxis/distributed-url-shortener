const pool = require("../db/pool");
const { nanoid } = require("nanoid");

async function createShortUrl(originalUrl) {
  if (!originalUrl) {
    throw { status: 400, message: "URL is required" };
  }

  const shortCode = nanoid(6);

  try {
    const result = await pool.query(
      `INSERT INTO urls (short_code, original_url)
            VALUES ($1, $2)
            RETURNING short_code`,
      [shortCode, originalUrl],
    );

    return result.rows[0].short_code;
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation (collision)
      return createShortUel(originalUrl); // retry
    }

    throw err;
  }
}

async function getOriginalUrl(shortCode) {
  const result = await pool.query(
    "SELECT original_url FROM urls WHERE short_code = $1",
    [shortCode],
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: "Short URL not found" };
  }

  await pool.query("UPDATE urls SET clicks = clicks+1 WHERE short_code = $1", [
    shortCode,
  ]);

  return result.rows[0].original_url;
}

module.exports = {
  createShortUrl,
  getOriginalUrl,
};
