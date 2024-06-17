import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from "uuid";
import { Result } from './models';

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


// 投票する（利用者）
app.post('/v1/voting/:clientId', async (req, res) => {
  try {
    const newResult = new Result({
      clientId: req.params.clientId,
      name: req.body.name,
      resultId: req.body.resultId,
    });
    await newResult.save();
    res.status(201).json(newResult);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


// 投票結果の表示 (運営)
app.get('/v1/voting', async (req, res) => {
  try {
    const results = await Result.find().exec();
    if (!results) return res.status(404).json({ message: "No result found." });
    const resultCount: {[key: string]: {count: number, name: string}} = {};
    results.forEach((result) => {
      if(!resultCount[result.resultId]) {
        resultCount[result.resultId] = {
          count: 0,
          name: result.name,
        }
      }
      resultCount[result.resultId].count++;
    })
    const totalResults = results.length;
    const resultSummary = Object.keys(resultCount).map((target) => ({
      response: target,
      name: resultCount[target].name,
      count: resultCount[target].count,
      percent: (resultCount[target].count / totalResults) * 100,
      
    }));
    res.json({results: resultSummary});
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
