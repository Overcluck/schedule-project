import express from 'express'
import supabase from '../supabase.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, nickname } = req.body
  if (!email || !password || !nickname) {
    return res.status(400).json({ message: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.' })
  }
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return res.status(400).json({ message: error.message })

  const { error: profileError } = await supabase.from('users').insert({
    user_id: data.user.id,
    email,
    nickname
  })
  if (profileError) {
    // Auth 계정은 생성됐지만 프로필 동기화에 실패한 경우. 그대로 두면
    // 이후 로그인/내 정보 조회가 전부 깨지므로 가입 자체를 실패로 응답합니다.
    return res.status(400).json({ message: '회원가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.' })
  }

  // Supabase 프로젝트에서 "Confirm email"이 켜져 있으면 가입 직후엔 세션이 없어
  // 별도의 이메일 인증 절차가 필요합니다. 프론트는 이 경우 곧바로 로그인 시도를 하므로 알려줍니다.
  const needsEmailConfirmation = !data.session
  res.status(201).json({
    message: '회원가입이 완료되었습니다.',
    needs_email_confirmation: needsEmailConfirmation
  })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' })
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return res.status(400).json({ message: error.message })

  const { data: userData, error: profileError } = await supabase
    .from('users')
    .select('nickname')
    .eq('user_id', data.user.id)
    .single()

  if (profileError || !userData) {
    // Auth 계정은 있지만 users 테이블에 프로필이 없는 경우(동기화 누락).
    // 프론트가 곧바로 me() 등을 호출하며 실패할 것이므로 여기서 명확히 알립니다.
    return res.status(400).json({ message: '계정 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.' })
  }

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