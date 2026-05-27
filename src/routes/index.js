import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import authRouter from './routes/authRouter.js'

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:3000'
]

const corsOptions = {
  origin(origin, callback) {
    // Postman 허용
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS 차단: ${origin}`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

// 요청 로그 확인용
app.use((req, res, next) => {
  console.log(req.method, req.headers.origin)
  next()
})

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

app.use(express.json())

app.get('/', (req, res) => {
  res.send('서버 정상 동작')
})

// 라우터
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
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})