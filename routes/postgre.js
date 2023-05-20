var router = require("express").Router();
const multer = require('multer');
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

let posts = [];
readRaiten();

router.get("/todo", function (req, res) {
  res.render("todo.ejs", { posts: posts });
});

router.delete("/delete", async function (req, res) {
  console.log(req.body);
  try {
    await deleteRaiten(req.body.trn_seq_id);
    res.status(200).send({ message: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "failed" });
  }
});

router.get("/todoAPI", async function (req, res) {
  try {
    const users = [
      "00000039",
      "00000001",
      "00000054",
      "00000081",
      "00000129",
      "00000100",
      "00000056",
      "00000051",
      "00000043",
    ];
    const query = `
      SELECT mst0011.user_nm, trn0012.user_cd, to_char(raiten_time, 'YYYY-MM-DD HH24:MI:SS') as raiten_time,
      
      nikki_title, nikki_text, thumbnail1
      FROM trn0012
      LEFT JOIN mst0011 ON trn0012.user_cd = mst0011.user_cd
      WHERE shop_cd = '0000' AND trn0012.user_cd IN (${users
        .map((u) => `'${u}'`)
        .join(", ")})
      order by raiten_time desc
      `;
    const result = await client.query(query);
    posts = result.rows;

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "failed" });
  }
});

router.post("/todoAPIDelete", async function (req, res) {
  const data = req.body;
  console.log(data);
  res.send("Data received");
  try {
    const query = {
      text: " DELETE FROM trn0012 WHERE raiten_time = $1 and user_cd = $2 ",
      values: [data.raiten_time, data.user_cd],
    };
    const result = await client.query(query);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
});

async function readRaiten() {
  const users = [
    "00000039",
    "00000001",
    "00000054",
    "00000081",
    "00000129",
    "00000100",
    "00000056",
    "00000051",
  ];
  const query = `SELECT mst0011.user_nm, trn0012.user_cd, raiten_time, nikki_title, nikki_text, thumbnail1
    FROM trn0012
    LEFT JOIN mst0011 ON trn0012.user_cd = mst0011.user_cd
    WHERE shop_cd = '0000' AND trn0012.user_cd IN (${users
      .map((u) => `'${u}'`)
      .join(", ")})
    order by raiten_time desc
    `;
  try {
    const result = await client.query(query);
    posts = result.rows;
  } catch (error) {
    console.error(error.stack);
  }
}

async function deleteRaiten(trn_seq_id) {
  try {
    const query = {
      text: "DELETE FROM trn0012 WHERE trn_seq_id = $1",
      values: [trn_seq_id],
    };
    const result = await client.query(query);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

router.post("/roomcheck", async function (req, res) {
  const data = req.body;
  console.log(data.shop_cd);
  try {
    const query = {
      text: ` SELECT DISTINCT rooms.room_id, mst0011.user_nm
    FROM rooms LEFT JOIN mst0011  ON rooms.user_cd = mst0011.user_cd LEFT JOIN messages ON rooms.user_cd = messages.user_cd
    WHERE rooms.shop_cd =$1 AND sender ='user' `,
      values: [data.shop_cd],
    };
    const result = await client.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

//GET MESSAGES 1v1 rooms
router.post("/getMessagesAPI", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  console.log(data.room_id);
  try {
    //--add message thumbnail K(2023/05)
    const query = {
      text:
        `SELECT room_id , mst0011.user_nm, messages.user_cd, messages.shop_cd, TO_CHAR(messages.datesent, 'YYYY- MM - DD HH24: MI: SS.FF6') AS datesent, messages.content, messages.seen, messages.sender , 
        msgmain.thumbnail1  
      FROM MESSAGES LEFT JOIN mst0011 ON mst0011.user_cd = messages.user_cd 
        LEFT JOIN(select distinct on(msg_text) * from mst0013) msgmain ON msgmain.msg_text = messages.content
        WHERE room_id = $1 ORDER BY datesent ASC`,
      values: [data.room_id],
    };


    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

//Update LIKED Message
router.post("/updateLikedRooms", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: "UPDATE rooms SET liked = $3  WHERE room_id= $1 and user_cd = $2 ",
      values: [
        data.room_id,
        data.user_cd,
        data.liked,
      ],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

//INSERT LIKED COUPONS
router.post("/likeCoupon", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: `INSERT INTO coupons_liked (unique_coupon_cd, user_cd) 
             VALUES ($1,$2) 
             ON CONFLICT (unique_coupon_cd, user_cd) DO NOTHING`, // sanggi add
      values: [
        data.unique_coupon_cd,
        data.user_cd,
      ],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json({ message: 'Coupon liked!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while liking the coupon.' });
  }
});

//DELETE LIKED COUPONS
router.post("/unlikeCoupon", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: "DELETE FROM coupons_liked WHERE unique_coupon_cd =$1 AND user_cd =$2",
      values: [
        data.unique_coupon_cd,
        data.user_cd,
      ],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json({ message: 'Coupon unliked!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while unliking the coupon.' });
  }
});

router.post("/getraitenAPI", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: " SELECT TO_CHAR(trn0012.raiten_time, 'YYYY-MM-DD HH24:MI:SS.FF6') AS raiten_time FROM trn0012 WHERE user_cd = $1 AND shop_cd = $2 ORDER BY raiten_time DESC LIMIT 1",
      values: [data.user_cd, data.shop_cd],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

router.post("/getMapAPI", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: " SELECT TO_CHAR(trn0012.raiten_time, 'YYYY-MM-DD HH24:MI:SS.FF6') AS raiten_time FROM trn0012 WHERE user_cd = $1 AND shop_cd = $2 ORDER BY raiten_time DESC LIMIT 1",
      values: [data.user_cd, data.shop_cd],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

router.post("/getUserInfo", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: " select *,case when gender = '01' then '男性' when gender = '02' then '女性' end as gender_text from mst0011 where user_cd = $1 ",
      values: [data.user_cd],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

router.post("/getUserName", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: " select user_nm from mst0011 where user_cd = $1 ",
      values: [data.user_cd],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

router.post("/updateUserInfo", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  var gender;
  if (data.gender_text == "男性") {
    gender = "01";
  } else {
    gender = "02";
  }

  try {
    const query = {
      text: "SELECT user_phone FROM mst0011 WHERE user_phone = $1 AND user_cd != $2",
      values: [
        data.user_phone,
        data.user_cd,
      ],
    };
    const result = await client.query(query);

    if (result.rowCount > 0) {
      console.log("already have");
      res.status(400).json({ error: "already have" });
    } else {
      try {
        const query2 = {
          text: "UPDATE mst0011 SET user_nm = $2,user_kn = $3,user_phone = $4,user_pw = $5,add2 = $6,user_mail = $7,gender = $8,add1 = $9,birthday = $10 WHERE user_cd = $1",
          values: [
            data.user_cd,
            data.user_nm,
            data.user_kn,
            data.user_phone,
            data.user_pw,
            data.add2,
            data.user_mail,
            gender,
            data.add1,
            data.birthday,
          ],
        };
        const result2 = await client.query(query2);
        res.status(200).json({ message: "Ok" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "server error" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "server error" });
  }
});


router.post("/GetCardImage", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  var gender;
  if (data.gender_text == "男性") {
    gender = "01";
  } else {
    gender = "02";
  }
  try {
    const query = {
      text: "UPDATE mst0011 SET user_nm = $2,user_kn = $3,user_phone = $4,user_pw = $5,add2 = $6,user_mail = $7,gender = $8,add1 = $9,birthday = $10 WHERE user_cd = $1",
      values: [
        data.user_cd,
        data.user_nm,
        data.user_kn,
        data.user_phone,
        data.user_pw,
        data.add2,
        data.user_mail,
        gender,
        data.add1,
        data.birthday,
      ],
    };
    const result = await client.query(query);
  } catch (error) {
    console.error(error);
  }
});

//モバイル側 Home Page
router.post("/getNikkidata", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: " SELECT raiten_time,nikki_title,nikki_text FROM trn0012 WHERE user_cd = $1 And shop_nm ='memo' AND raiten_time > CURRENT_TIMESTAMP ORDER BY raiten_time LIMIT 4",
      values: [
        data.user_cd,
      ],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

//CardList
router.post("/GetCardList", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: `Select mst0017.updatetime, mst0017.jan_no, mst0017.shop_cd, mst0017.card_nm, mst0017.e_date, mst0017.up_date,mst0017.now_point, mst0017.card_image, mst0010.barcode_kbn 
      from mst0017 LEFT JOIN mst0010 ON mst0017.shop_cd = mst0010.shop_cd where user_cd = $1 order by updatetime desc`,
      values: [
        data.user_cd,
      ],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

//make new card
router.post("/MakeCard", async function (req, res) {
  console.log(req.body);
  const data = req.body;

  try {
    const checkQuery = {
      text: 'SELECT * FROM mst0017 WHERE jan_no = $1 AND card_nm = $2 AND user_cd = $3',
      values: [data.jan_no, data.card_nm, data.user_cd],
    };
    const checkResult = await client.query(checkQuery);

    if (checkResult.rowCount > 0) {
      res.status(400).json({ error: 'Card with the same name and number already exists' });
    } else {
      const query = {
        text: `INSERT INTO mst0017 (insuser_cd,insdatetime,upduser_cd,updatetime,jan_no, card_nm, user_cd) 
                          VALUES  ($3,CURRENT_TIMESTAMP,$3,CURRENT_TIMESTAMP, $1 , $2 ,$3 )`,
        values: [
          data.jan_no,
          data.card_nm,
          data.user_cd,
        ],
      };
      const result = await client.query(query);
      console.log(result.rows);
      res.status(200).json({ message: 'Card created successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//make new Tempo card
router.post("/MakeTempoCard", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = { 
      text: 'select jan_no from mst0017 where jan_no = $1 and shop_cd IS NOT NULL and up_date = $2 and user_cd IS NULL  ',
      values: [data.jan_no, data.up_date,],
    };
    const result = await client.query(query);
    console.log(result.rows);
    if (result.rows.length > 0) {
      try {
        const query2 = { 
          text: 'update mst0017 set user_cd = $1 where jan_no = $2 and shop_cd IS NOT NULL and up_date = $3 and user_cd IS NULL  ',
          values: [data.user_cd,data.jan_no, data.up_date,],
        };
        const result2 = await client.query(query2);
        console.log(result2.rows);
      } catch (error) {
        console.error(error);
        
      }
      res.status(200).json({ message: 'Card created successfully' });
    } else {
      res.status(200).json({ message: 'No results found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//delete card
const fs = require('fs');

router.post("/DeleteCard", async function (req, res) {
  const originalname = req.body.filename;

  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: "delete from mst0017 where user_cd= $1 and jan_no = $2 and card_nm = $3",
      values: [data.user_cd, data.jan_no, data.card_nm],
    };
    const result = await client.query(query);
    console.log(result.rows);

    // File deletion
    const imagePath = `image/CardImage/${originalname}`;
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${originalname}`, err);
      } else {
        console.log(`File deleted: ${originalname}`);
      }
    });

    res.status(200).json({ message: 'Card and image deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



//CardUpdate
router.post("/UpdateCard", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: "UPDATE mst0017 SET jan_no = $1 ,card_nm = $2, updatetime=CURRENT_TIMESTAMP WHERE user_cd= $3 and jan_no= $4 and card_nm = $5",
      values: [
        data.jan_no,
        data.card_nm,
        data.user_cd,
        data.where_jan_no,
        data.where_card_nm,
      ],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

//Login
router.post("/UserLogin", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: " SELECT * FROM mst0011 WHERE (cust_cd IS NOT NULL AND jan_no = $1) OR (cust_cd IS NULL AND user_phone = $1) AND user_pw = $2",
      values: [data.id, data.password],
    };
    const result = await client.query(query);
    if (result.rows.length > 0) {
      console.log(result.rows);
      res.status(200).json(result.rows);
    } else {
      res.status(401).json({ message: "Invalid ID or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

//Get TempoInfo
router.post("/GetTempoInfo", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: "SELECT shop_nm,url_sns1,url_sns2,url_sns3,url_sns4,url_hp,thumbnail1,thumbnail2,thumbnail3,holiday1,holiday2,holiday3,free_text,logo,opentime1,closetime1,opentime2,closetime2,shop_add3,shop_add2,shop_add1,shop_postcd FROM mst0010 WHERE mst0010.shop_cd = $1 ",
      values: [
        data.shop_cd,
      ],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

//Get TempoLogo
router.post("/GetTempoLogo", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: "SELECT raiten_time, shop_cd FROM trn0012 WHERE shop_cd <> '0000' and user_cd = $1 ORDER BY raiten_time DESC LIMIT 1",
      values: [
        data.user_cd,
      ],
    };
    const result = await client.query(query);
    console.log(result.rows[0].shop_cd);
    try {
      const query2 = {
        text: "Select logo,shop_cd from mst0010 where shop_cd= $1 ",
        values: [
          result.rows[0].shop_cd,
        ],
      };
      const result2 = await client.query(query2);
      console.log(result2.rows);
      res.status(200).json(result2.rows);
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.error(error);
  }
});

// card Image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'image/CardImage/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

const throttleMap = new Map();

router.post('/upload', upload.single('file'), async (req, res) => {
  console.log(req.file);

  const originalname = req.file.originalname;
  const user_cd = originalname.substring(0, 8);
  const jan_no = originalname.substring(8, originalname.lastIndexOf('.'));

  // Throttling
  const throttleKey = `${user_cd}-${jan_no}`;
  const now = Date.now();
  const lastRequestTime = throttleMap.get(throttleKey) || 0;
  const throttleInterval = 10000; // 10 seconds

  if (now - lastRequestTime < throttleInterval) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }

  throttleMap.set(throttleKey, now);

  try {
    const query = {
      text: "UPDATE mst0017 SET card_image = $1, updatetime = CURRENT_TIMESTAMP WHERE user_cd = $2 and jan_no = $3",
      values: [
        originalname,
        user_cd,
        jan_no,
      ],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//recode raiten
router.post("/RecodeRaiten", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: "select * from mst0010 where shop_cd = $1 ",
      values: [data.shop_cd],
    };
    const result = await client.query(query);
    const shop_nm = await result.rows[0].shop_nm;
    //lastdate
    const latestDateQuery = {
      text: "SELECT raiten_time FROM trn0012 WHERE shop_cd = $1 and user_cd = $2 ORDER BY raiten_time DESC LIMIT 1",
      values: [data.shop_cd, data.user_cd],
    };
    const latestDateResult = await client.query(latestDateQuery);
    const latestDate = latestDateResult.rows[0]?.raiten_time;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (!latestDate || latestDate.setHours(0, 0, 0, 0) < currentDate) {
      try {
        const query2 = {
          text: `INSERT INTO trn0012 (insuser_cd,insdatetime,upduser_cd,updatetime,user_cd,shop_cd,shop_nm,raiten_time)
                              VALUES ( $1 ,CURRENT_TIMESTAMP, $1 ,CURRENT_TIMESTAMP, $1 , $2 ,$3,CURRENT_TIMESTAMP) `,
          values: [data.user_cd, data.shop_cd, shop_nm],
        };

        const result2 = await client.query(query2);
        res.status(200).json('raiten ok');

      } catch (error) {
        console.error(error);
      }
    } else {
      res.status(200).json('already done');
    }
  }
  catch (error) {
    console.error(error);
  }
});

// likesList function

router.post("/GetLikesList", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query1 = {
      text: `SELECT c.*, cu.*, mst0010.* FROM coupons AS c JOIN (SELECT unique_coupon_cd FROM coupons_liked WHERE user_cd = $1) AS cl ON c.unique_coupon_cd = cl.unique_coupon_cd
      LEFT JOIN coupons_used AS cu ON c.unique_coupon_cd = cu.unique_coupon_cd
      LEFT JOIN mst0010 ON mst0010.shop_cd = c.shop_cd;`,
      values: [
        data.user_cd,
      ],
    };
    const result1 = await client.query(query1);

    const query2 = {
      text: `SELECT m.* FROM messages AS m JOIN (SELECT room_id FROM rooms WHERE user_cd = $1 AND liked = '1') AS r ON m.room_id = r.room_id;`,
      values: [
        data.user_cd,
      ],
    };
    const result2 = await client.query(query2);

    const response = {
      coupons: result1.rows,
      messages: result2.rows
    };

    console.log(response);
    res.status(200).json(response);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
});


