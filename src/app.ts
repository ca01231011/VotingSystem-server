import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from "uuid";
import { Votes } from './models';
import { Status } from './models';
import { promises as fs } from 'fs';
import { Mutex } from 'async-mutex';
import path from 'path';
import cors from 'cors';
import cookieparser from 'cookie-parser';
import {corsOrigin, mongoServer} from '../systemconfig';


//MongoDBにつなぐ準備
mongoose.connect("mongodb://"+mongoServer+"/votingDB", {
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

const mutex = new Mutex();  //排他処理用のmutex
const lotteryFilePath = path.join(__dirname, './lottery.json');

// CORSを許可
app.use(cors({"origin": corsOrigin ,"credentials": true}));

app.use(cookieparser());

//リクエストボディをJSONとして解釈する
app.use(bodyParser.json());


// 新規投票者ID取得
app.get('/voter/new', async (req, res) => {
    //cookie自体が存在する場合のみ、その中身を取得
    if (req.cookies) {
      //リクエストからclientIdという名前のcookieを取得
      const voter = req.cookies.voter;
      console.log("voter:"+voter);
      if (voter) {
        //clientIdがあればそのまま返す
        res.cookie('voter', voter, { maxAge: 28800, secure: true, sameSite: 'none' });      
        return res.json({ voter });
      }
    }
  
    const newId = uuidv4();
    console.log("new id:" + newId);
    //newIDをclientIdという名前でcookieに保存。有効期限は8時間
    res.cookie('voter', newId, { maxAge: 28800, secure: true, sameSite: 'none' });
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

// 懸賞番号のリセット
app.post('/reset/lottery', async (req, res) => {
  try {
    const lottery = JSON.parse(await fs.readFile(lotteryFilePath, 'utf8'));
    lottery.id = 0;
    await fs.writeFile(lotteryFilePath, JSON.stringify(lottery, null, 2), 'utf8');
    res.status(201).json({ message: "reset lottery id"});
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// 投票データを削除する
app.delete('/delete/votes', async (req, res) => {
  try {
    await Votes.deleteMany({});
    res.status(200).json({ message: 'delete votes' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 作品へのスコア投票
app.post('/vote', async (req, res) => {
  try {
    const status = await Status.findOne({no: req.body.no}).exec();
    if(status) {
      if(status.status === 0) {
        return res.status(400).json({ message: "Voting is closed" });
      }
    }

    let oldId;
    // 審査員は懸賞番号を9999に固定
    if (req.body.type === "2ax5") {
      oldId = 9999;
    } else {
      // 投票履歴から懸賞番号を取り出す
      const voted = await Votes.findOne({ voter: req.body.voter}).exec();
      if(voted) {
        oldId = voted.lottery;
      } else {
        const release = await mutex.acquire(); 
        try {
          //懸賞番号を読む
          const lottery = JSON.parse(await fs.readFile(lotteryFilePath, 'utf8'));
          oldId = lottery.id; 
          lottery.id += 1;
          
          //データ書き込み
          await fs.writeFile(lotteryFilePath, JSON.stringify(lottery, null, 2), 'utf8');
        } catch (error: any) {
          res.status(400).json({ message: error.message });
        } finally {
          release();  //mutexを解放
        }
      }
    }
    const newVotes = new Votes({
      voter: req.body.voter,
      no: req.body.no,
      type: req.body.type,
      score: req.body.score,
      lottery: oldId
    });
    // 重複投票を防ぐ
    const same = await Votes.findOne({voter: req.body.voter, no: req.body.no}).exec();
    if(same) {
      return res.status(400).json({ message: "You have already voted" });
    }
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
    // const result: number = count / eachLength;  平均から合計に変更したためコメントアウトにしてます

    res.json({no: noNumber, score: count, each: eachArray});
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
      console.log(noNumber);
      return res.status(404).json({ message: "collection status not found" });
    }
    res.json({no: status.no, status: status.status});
  } catch (error: any) {
    console.log(error);
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
      return  res.status(400).json({ message: "The code is incorrect" });
    }
    // statusが0または1以外のときエラーを返す
    if(reqStatus !== 1 && reqStatus !== 0) {
      return  res.status(400).json({ message: "The status is incorrect" });
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
