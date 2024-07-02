import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from "uuid";
import { Votes } from './models';
import { Status } from './models';
import { Lottery } from './models';
import cors from 'cors';
import cookieparser from 'cookie-parser';

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

// CORSを許可
app.use(cors({"origin": "http://localhost" ,"credentials": true}));

app.use(cookieparser());

//リクエストボディをJSONとして解釈する
app.use(bodyParser.json());

// 新規投票者ID取得
app.get('/voter/new', async (req, res) => {
    //cookie自体が存在する場合のみ、その中身を取得
    if (req.cookies) {
      //リクエストからclientIdという名前のcookieを取得
      const voter = req.cookies.voter;
      if (voter) {
        //clientIdがあればそのまま返す
        res.cookie('voter', voter, { maxAge: 28800 });      
        return res.json({ voter });
      }
    }
  
    const newId = uuidv4();
    //newIDをclientIdという名前でcookieに保存。有効期限は8時間
    res.cookie('voter', newId, { maxAge: 28800 });
    res.json({ voter: newId });
});

// 投票者ステータス取得
app.get('/voter/:voter', async (req, res) => {
  const voter = req.params.voter;
  const myVotes = await Votes.find({voter: voter}).sort({createdAt: 1}).exec();
  const myLottery: string[] = [];
  const no: number[] = [];
  myVotes.forEach((vote) => {
    myLottery.push(vote.lottery);
    no.push(vote.no);
  })
  res.json({voter: voter, lottery: myLottery, voted: no});
})


// 抽選番号の初期化
app.post('/lottery', async (req, res) => {
  try {
    const newLottery = new Lottery({
      lottery: 0
    });
    await newLottery.save();
    res.status(201).json(newLottery);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// 作品へのスコア投票
app.post('/vote', async (req, res) => {
  try {
    const status = await Status.findOne({no: req.body.no}).exec();
    if(status) {
      if(status.status === 0) {
        return res.status(400).json("Voting is closed");
      }
    }
    const lotteryNum = await Lottery.findOneAndUpdate({}, {$inc: {lottery: 1}}).exec();
    if(!lotteryNum) {
      return res.status(404).json("lottery not found");
    }
    const lottery = lotteryNum.lottery.toString()
    const newVotes = new Votes({
      voter: req.body.voter,
      no: req.body.no,
      type: req.body.type,
      score: req.body.score,
      lottery: lottery
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
    const reqCode: string = req.body.code;
    const reqNo: number = Number(req.body.no);
    const reqStatus: number = Number(req.body.status);
    // 管理者IDが一致するかチェック
    if(reqCode !== "aaaa") {   // 管理者IDを変更する
      return  res.status(400).json("The code is incorrect");
    }
    // statusが0または1以外のときエラーを返す
    if(reqStatus !== 1 && reqStatus !== 0) {
      return  res.status(400).json("The status is incorrect");
    }
    const status = await Status.findOneAndUpdate({no: reqNo}, {no: reqNo, status: reqStatus}, {returnDocument: 'after',upsert: true}).exec();
    // 変更後のデータを返す
    res.status(201).json(status);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
