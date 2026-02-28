const pool = require("../db/pool");
const { nanoid } = require("nanoid");
const { redisClient } = require("../cache/redisClient");

async function createShortUrl(originalUrl) {
  if (!originalUrl) {
    throw { status: 400, message: "URL is required" };
  }

  // generate new short code
  const shortCode = nanoid(6);

  try {
    const result = await pool.query(
      `INSERT INTO urls (short_code, original_url)
            VALUES ($1, $2)
            ON CONFLICT (original_url) 
            DO UPDATE SET original_url = EXCLUDED.original_url
            RETURNING short_code`,
      [shortCode, originalUrl],
    );

    return result.rows[0].short_code;
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation (collision)
      return createShortUrl(originalUrl); // retry
    }

    throw err;
  }
}

async function getOriginalUrl(shortCode) {
  // check cache
  let cachedUrl = null;

  try {
    cachedUrl = await redisClient.get(shortCode);
  } catch (err) {
    console.error("Redis read error:", err);
  }

  if (cachedUrl) {
    // increment DB
    await redisClient.incr(`clicks:${shortCode}`);

    return cachedUrl;
  }

  // if not in cache, query DB
  const result = await pool.query(
    "SELECT original_url FROM urls WHERE short_code = $1",
    [shortCode],
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: "Short URL not found" };
  }

  const originalUrl = result.rows[0].original_url;

  // store in redis
  try {
    await redisClient.set(shortCode, originalUrl, {
      EX: 60 * 60, // 1 hr TTL
    });
  } catch (err) {}

  // increment clicks
  await redisClient.incr(`clicks:${shortCode}`);

  return originalUrl;
}

module.exports = {
  createShortUrl,
  getOriginalUrl,
};
