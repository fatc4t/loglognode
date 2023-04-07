var router = require("express").Router();

const server = require("http").createServer();
const io = require("socket.io")(server);

var { Client } = require("pg"); // postgresql
var client = new Client({
  user: "postgres",
  host: "153.126.145.215",
  database: "loglog",
  password: "masterkey",
  Port: 5432,
});
client.connect();
module.exports = router;


//get ALL shop id  and coupon_id 使用期間過ぎた物

// Define a function to delete expired coupons and their corresponding entries in the couponsused table
async function deleteExpiredCoupons() {
    try {
      const query1 = {
        text: "SELECT coupon_cd FROM coupons WHERE effect_end < to_char(now(),'YYYYMMDD')",
      };
      const result1 = await client.query(query1);
      const couponIds = result1.rows.map((row) => row.coupon_id);
      console.log(`Expired coupons: ${couponIds}`);
  
      const query2 = {
        text: "DELETE FROM coupons_used WHERE coupon_id = ANY($1::uuid[])",
        values: [couponIds],
      };

      await client.query(query2);
      console.log(`Deleted ${couponIds.length} coupons from the coupons table`);
  
      couponIds.forEach((couponId) => {
        io.emit("couponDeleted", couponId); // Notify clients about the deleted coupons
      });
    } catch (error) {
      console.error(error);
    }
  }
  

  // Schedule the deleteExpiredCoupons function to run every hour using cron
  const cron = require("node-cron");
  cron.schedule("* * * * *", () => {
    //deleteExpiredCoupons();
  });
  
  module.exports = router;