import express from 'express'
import supabase from '../supabase.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, nickname } = req.body
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return res.status(400).json({ message: error.message })
  await supabase.from('users').insert({
    user_id: data.user.id,
    email,
    nickname
  })
  res.status(201).json({ message: '회원가입이 완료되었습니다.' })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return res.status(400).json({ message: error.message })
  const { data: userData } = await supabase
    .from('users')
    .select('nickname')
    .eq('user_id', data.user.id)
    .single()
  res.json({
    token: data.session.access_token,
    nickname: userData.nickname
  })
})

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, email, nickname, created_at')
    .eq('user_id', req.user.id)
    .single()
  if (error) return res.status(400).json({ message: error.message })
  res.json(data)
})

// PATCH /api/users/me
router.patch('/me', authMiddleware, async (req, res) => {
  const { nickname } = req.body
  const { error } = await supabase
    .from('users')
    .update({ nickname })
    .eq('user_id', req.user.id)
  if (error) return res.status(400).json({ message: error.message })
  res.json({ message: '닉네임이 변경되었습니다.' })
})

// PATCH /api/users/password
router.patch('/password', authMiddleware, async (req, res) => {
  const { password } = req.body
  if (!password || password.length < 6) {
    return res.status(400).json({ message: '비밀번호는 6자 이상이어야 합니다.' })
  }
  const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password })
  if (error) return res.status(400).json({ message: error.message })
  res.json({ message: '비밀번호가 변경되었습니다.' })
})

export default router

