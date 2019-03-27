const redis = require('redis');
const client = redis.createClient(6379, "127.0.0.1");

client.on('error', function (err) {
  console.log("redis:" + err);
});

module.exports = client;