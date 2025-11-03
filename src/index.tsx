import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'リスニングテスト自動作成システム' })
})

// Audio generation endpoint
app.post('/api/generate-audio', async (c) => {
  try {
    const body = await c.req.json()
    const { script, speakers } = body
    
    if (!script || !speakers || speakers.length === 0) {
      return c.json({ success: false, error: 'スクリプトまたは話者情報が不足しています' }, 400)
    }
    
    // TODO: Implement actual audio generation using TTS service
    // For now, return mock response
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock audio URL (replace with actual TTS API integration)
    const mockAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    
    return c.json({
      success: true,
      audioUrl: mockAudioUrl,
      speakers: speakers,
      message: '音声生成が完了しました（現在はモックデータです）'
    })
    
  } catch (error) {
    console.error('Audio generation error:', error)
    return c.json({ success: false, error: '音声生成中にエラーが発生しました' }, 500)
  }
})

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>リスニングテスト自動作成システム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .fade-in { animation: fadeIn 0.3s ease-in; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-4xl">
            <!-- Header -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h1 class="text-3xl font-bold text-indigo-700 mb-2 flex items-center">
                    <i class="fas fa-headphones mr-3"></i>
                    リスニングテスト自動作成システム
                </h1>
                <p class="text-gray-600">英語のリスニング原稿・音声・問題を自動で作成</p>
            </div>

            <!-- Main Content -->
            <div id="app"></div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
