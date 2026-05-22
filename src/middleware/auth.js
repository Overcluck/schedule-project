import supabase from '../supabase.js'

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) return res.status(401).json({ message: '토큰이 없습니다.' })

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) return res.status(401).json({ message: '유효하지 않은 토큰입니다.' })

  req.user = data.user
  next()
}

export default authMiddleware