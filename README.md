### メモ
+ votingDBという名前のデータベースをつくってその中にStatusとVotesコレクションを作成
+ Lotteryというコレクションをつくって抽選番号の初期値をいれておく
+ データベースのパスワード
+ スコアが小数のときの処理
+ app.tsの64行目の審査員IDの設定
+ app.tsの108行目の管理者IDの設定
+ 27行目のcorsの設定
+ cookieの保存時間の設定（現在は8時間）

***
# API    
### <span style="color:yellow;">新規投票者ID取得</span>
#### API
`GET /voter/new`
#### レスポンス例
``` json
{
  "voter": "d48a8914-7a40-49b5-a024-d66aea816a56"
}
```
#### cookieに保存されているIDがあればそれを返す
***
### <span style="color:yellow;">投票者ステータス取得</span>
#### API
`GET /voter/:voter`
#### レスポンス例
``` json
{
  "voter": "000",
  "lottery": [
    "7"
  ]
}
``` 
***
### <span style="color:yellow;">作品へのスコア投票</span>
#### API
`POST /vote`   
#### ボディ例
``` json
{
  "voter": [uuID],
  "no": 1,
  "type": "0",
  "score": 5
}
```
+ voter 文字列　・・・　投票者ID
+ no 数値　・・・　作品番号
+ type 文字列　・・・　投票者タイプ
+ score 数値　・・・　１～５までの評価

#### レスポンス例
``` json
{
  "isActive": true,
  "_id": "6680db28ce652a023c039714",
  "voter": [uuID],
  "no": 1,
  "type": "0",
  "score": 5,
  "lottery": "7",
  "createdAt": "2024-06-30T04:12:24.130Z",
  "__v": 0
}
```
***
### <span style="color:yellow;">作品への投票結果取得</span>
#### API
`GET /vote?no=[作品番号]`   
#### レスポンス例
```json
{
  "no": 2,
  "score": 4.166666666666667,
  "each": [
    4.5,
    3,
    5
  ]
}
```
+ each [0] は観客の平均、 [1] 以降は審査員の評価
***
### <span style="color:yellow;">作品への投票 オープン/クローズのステータス取得</span>
#### API
`GET /vote_status?no=[作品番号]`
#### レスポンス例
``` json
{
  "no": 1,
  "status": 1
}
```
***
### <span style="color:yellow;">作品への投票 オープン/クローズ切り替え</span>
#### API
`POST /vote_status`
#### ボディ例
* テスト用に管理者IDはaaaaを使用
``` json
{
  "code": "aaaa",
  "no": 2,
  "status": 0
}
```
+ code 文字列　・・・　管理者ID
+ status 数値　・・・　投票受付ステータス   0: クローズ　 1: オープン
#### レスポンス例
``` json
{
  "isActive": true,
  "_id": "667a1b17592047bd9009f06c",
  "no": 2,
  "__v": 0,
  "status": 0,
  "createdAt": "2024-06-25T01:26:03.594Z"
}
```
***