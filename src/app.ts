import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from "uuid";
import { Votes } from './models';

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
app.get('/v1/voter/new', async (req, res) => {
  res.json({ voter: uuidv4() });
});


// 投票する（利用者）
app.post('/v1/voting/:voter', async (req, res) => {
  try {
    const newVotes = new Votes({
      voter: req.params.voter,
      contestant: req.body.contestant,
    });
    await newVotes.save();
    res.status(201).json(newVotes);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


// 投票結果の表示 (運営)
app.get('/v1/result', async (req, res) => {
  try {
    const result = await Votes.find().exec();
    if (!result) return res.status(404).json({ message: "No result found." });
    const resultCount: {[key: string]: {count: number, contestant: string}} = {};
    result.forEach((votes) => {
      if(!resultCount[votes.contestant]) {
        resultCount[votes.contestant] = {
          count: 0,
          contestant: votes.contestant,
        }
      }
      resultCount[votes.contestant].count++;
    })
    const totalVotes = result.length;
    const resultSummary = Object.keys(resultCount).map((target) => ({
      contestant: resultCount[target].contestant,
      count: resultCount[target].count,
      percent: (resultCount[target].count / totalVotes) * 100,  
    }));
    res.json({result: resultSummary});
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});





app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
