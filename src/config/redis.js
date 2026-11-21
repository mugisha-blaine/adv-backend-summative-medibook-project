
const { createClient } = require("redis");

const redis = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: false
    }
});

redis.on("error", (error) => {
    console.error("Redis error:", error.message);
});

redis.connect().catch((error) => {
    console.error("Redis connection failed:", error.message);
});

module.exports = redis;
