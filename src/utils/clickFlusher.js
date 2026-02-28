const pool = require("../db/pool");
const { redisClient } = require("../cache/redisClient");

function startClickFlusher() {
  setInterval(async () => {
    try {
      const keys = await redisClient.keys("clicks:*");

      for (const key of keys) {
        const shortCode = key.split(":")[1];

        const count = await redisClient.get(key);

        if (count && parseInt(count) > 0) {
          await pool.query(
            "UPDATE urls SET clicks=clicks+$1 WHERE short_code = $2",
            [parseInt(count), shortCode],
          );

          await redisClient.del(key);
        }
      }

      if (keys.length > 0) {
        console.log("Flushed click counters");
      }
    } catch (err) {
      console.error("Click flush error :", err);
    }
  }, 10000); // every 10 seconds
}

module.exports = startClickFlusher;
