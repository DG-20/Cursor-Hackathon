import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import sessionRoutes from './routes/session'
import authRoutes from './routes/auth'
// import journalRoutes from './routes/journal.js'

const app = express()
const PORT = process.env.PORT || 8080

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
}))
app.use(express.json())

// Routes — frontend calls POST /processSpeech with { transcript }
app.use('/', sessionRoutes)
app.use('/api/auth', authRoutes)
// app.use('/api/journal', journalRoutes)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`AfterThought server running on http://localhost:${PORT}`)
})