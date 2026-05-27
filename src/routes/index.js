import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import authRouter from './authRouter.js'

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS 차단: ${origin}`))
    }
  },
  credentials: true
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

app.use(express.json())

// 테스트용 루트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '백엔드 정상 동작'
  })
})

// 라우터 등록
app.use('/api/users', authRouter)

// 에러 로그
app.use((err, req, res, next) => {
  console.error(err.stack)

  res.status(500).json({
    success: false,
    message: err.message
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`서버 실행 중: ${PORT}`)
})