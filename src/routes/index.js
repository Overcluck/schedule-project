import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('서버 정상 동작')
})

app.listen(process.env.PORT, () => {
  console.log('서버 실행 중: http://localhost:' + process.env.PORT)
})