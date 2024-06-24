import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from "uuid";
import { Votes } from './models';
import { Status } from './models';

//MongoDBにつなぐ準備
mongoose.connect("mongodb://mongo:27017/votingDB", {
  poolSize: 10,
  authSource: "admin",
  user: "root",
  pass: "password",
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

//ネットワークの接続を受け付ける準備
const app = express();
const PORT = process.env.PORT || 3000;

//リクエストボディをJSONとして解釈する
app.use(bodyParser.json());

// 新規投票者ID取得
app.get('/voter/new', async (req, res) => {
  res.json({ voter: uuidv4() });
});


// 作品へのスコア投票
app.post('/vote', async (req, res) => {
  try {
    const newVotes = new Votes({
      voter: req.body.voter,
      no: req.body.no,
      type: req.body.type,
      score: req.body.score,
    });
    await newVotes.save();
    res.status(201).json(newVotes);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// 作品への投票結果取得
app.get('/vote', async (req, res) => {
  try {
    const noParam = req.query.no;
    const noNumber = Number(noParam);
    const votes = await Votes.find({no: noNumber}).exec();
    // audienceScore[観客の人数, 評価1の件数, 評価2の件数, ・・・]
    const audienceScore: number[] = [0, 0, 0, 0, 0, 0];
    // eachArray[観客の平均, 審査員Aの評価, 審査員Bの評価, ・・・]
    const eachArray: number [] = [];

    votes.forEach((vote) => {
      if(vote.type === "0") {
        audienceScore[vote.score]++;
        audienceScore[0]++;
      } else if(vote.type === "2ax5") {   // テスト用に審査員用のtypeを"2ax5"に
        eachArray.push(vote.score);
      }
    })
    // 観客のスコアの平均
    const audienceAverage: number = (audienceScore[1] * 1 + audienceScore[2] * 2 + audienceScore[3] * 3 + audienceScore[4] * 4 + audienceScore[5] * 5) / audienceScore[0];
    // 先頭に観客の平均を追加
    eachArray.unshift(audienceAverage);
    // 結果の計算
    let count: number = 0;
    let eachLength = eachArray.length;
    eachArray.forEach((score) => {
      count += score;
    })
    const result: number = count / eachLength;

    res.json({no: noNumber, score: result, each: eachArray});
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 作品への投票 オープン/クローズのステータス取得
app.get('/vote_status', async (req, res) => {
  try {
    const noParam = req.query.no;
    const noNumber = Number(noParam);
    const status = await Status.findOne({no: noNumber}).exec();
    if(!status) {
      return res.status(404).json("collection not found");
    }
    res.json({no: status.no, status: status.status});
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 作品への投票 オープン/クローズ切り替え
app.post('/vote_status', async (req, res) => {
  try {
    const newStatus = new Status({
      code: req.body.code,
      no: req.body.no,
      status: req.body.status,
    });
    await newStatus.save();
    res.status(201).json(newStatus);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
