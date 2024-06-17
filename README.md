# API    
+ resultId・・・投票される側
+ name・・・投票される側の氏名
+ clientId・・・投票する側
***
### 投票する（利用者）
#### API
`v1/voting/[clientID]`   
#### アクセスメソッド
`POST`
#### ボディ例
``` json
{
      "name": "山田太郎",
      "resultId": "007"
}
```
#### レスポンス例
``` json
{
  "isActive": true,
  "_id": "666fd2f558cf13e77f853ca6",
  "clientId": "000",
  "name": "山田太郎",
  "resultId": "007",
  "createdAt": "2024-06-17T06:08:53.204Z",
  "__v": 0
}
```
***
### 投票結果の表示（運営）
#### API
`v1/voting/`   
#### アクセスメソッド
`GET`
#### レスポンス例
```json
{
  "results": [
    {
      "response": "007",
      "name": "山田太郎",
      "count": 1,
      "percent": 25
    },
    {
      "response": "006",
      "name": "上田太郎",
      "count": 2,
      "percent": 50
    },
    {
      "response": "005",
      "name": "前田太郎",
      "count": 1,
      "percent": 25
    }
  ]
}