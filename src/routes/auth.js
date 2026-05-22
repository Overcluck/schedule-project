import express from 'express'
import supabase from '../supabase.js'

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

import authMiddleware from '../middleware/auth.js'

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

export default router

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