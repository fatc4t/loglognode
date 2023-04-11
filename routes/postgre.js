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
    const query = {
      text: `SELECT room_id , mst0011.user_nm, messages.user_cd, messages.shop_cd, TO_CHAR(messages.datesent, 'YYYY-MM-DD HH24:MI:SS.FF6') AS datesent      , messages.content
      , messages.seen, messages.sender FROM MESSAGES left join mst0011 on mst0011.user_cd = messages.user_cd WHERE room_id = $1 ORDER BY datesent desc`,
      values: [data.room_id],
    };
    const result = await client.query(query);
    //console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
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
      text: "Select mst0017.updatetime,mst0017.jan_no,mst0017.card_nm,mst0017.now_point,mst0010.card_image from mst0017 LEFT JOIN mst0010 ON mst0017.shop_cd = mst0010.shop_cd where user_cd = $1 order by updatetime",
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

//UserCard Login
router.post("/CardUserLogin", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  try {
    const query = {
      text: " SELECT * FROM trn0012 WHERE user_cd = '$1' AND DATE('$2') = CURRENT_DATE ",
      values: [
        data.user_cd, 
        data.dateNow
      ],
    };
    const result = await client.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

