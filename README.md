# API    
+ contestant・・・競技者
+ voter・・・投票する人
***
### 新規投票者ID取得
#### API
`GET /v1/voter/new`
#### レスポンス例
``` json
{
  "voter": "d48a8914-7a40-49b5-a024-d66aea816a56"
}
```
***
### 投票する（利用者）
#### API
`POST /v1/voting/[voter]`   
#### ボディ例
``` json
{
  "contestant": 1,
}
```
#### レスポンス例
``` json
{
  "isActive": true,
  "_id": "667184307baa1b65f4ae0046",
  "voter": "d48a8914-7a40-49b5-a024-d66aea816a56",
  "contestant": "1",
  "createdAt": "2024-06-18T12:57:20.862Z",
  "__v": 0
}
```
***
### 投票結果の表示（運営）
#### API
`GET /v1/voting/`   
#### レスポンス例
```json
{
  "result": [
    {
      "contestant": "1",
      "count": 3,
      "percent": 75
    },
    {
      "contestant": "2",
      "count": 1,
      "percent": 25
    }
  ]
}