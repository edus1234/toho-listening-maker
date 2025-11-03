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

// Google TTS voice mapping
const getGoogleTTSVoice = (accent: string) => {
  const voiceMap: Record<string, { languageCode: string, name: string }> = {
    'US': { languageCode: 'en-US', name: 'en-US-Journey-D' },
    'UK': { languageCode: 'en-GB', name: 'en-GB-Journey-D' },
    'Australian': { languageCode: 'en-AU', name: 'en-AU-Journey-D' },
    'Canadian': { languageCode: 'en-US', name: 'en-US-Journey-F' },
    'Indian': { languageCode: 'en-IN', name: 'en-IN-Journey-D' },
    'Irish': { languageCode: 'en-IE', name: 'en-IE-Standard-A' },
    'Scottish': { languageCode: 'en-GB', name: 'en-GB-Standard-B' }
  }
  return voiceMap[accent] || voiceMap['US']
}

// Parse script and extract speaker lines
const parseScript = (script: string) => {
  const lines: Array<{ speaker: string, text: string }> = []
  const scriptLines = script.split('\n').filter(line => line.trim())
  
  for (const line of scriptLines) {
    // Match "SpeakerName: text" or "[SpeakerName]" followed by text
    const dialogueMatch = line.match(/^([A-Za-z]+):\s*(.+)$/)
    const monologueMatch = line.match(/^\[([A-Za-z]+)\]$/)
    
    if (dialogueMatch) {
      const [, speaker, text] = dialogueMatch
      lines.push({ speaker: speaker.trim(), text: text.trim() })
    } else if (!monologueMatch && lines.length > 0) {
      // Continue previous speaker's line
      lines[lines.length - 1].text += ' ' + line.trim()
    } else if (!monologueMatch && !line.startsWith('[')) {
      // Monologue text without speaker prefix
      lines.push({ speaker: 'Speaker', text: line.trim() })
    }
  }
  
  return lines
}

// Audio generation endpoint
app.post('/api/generate-audio', async (c) => {
  try {
    const body = await c.req.json()
    const { script, speakers } = body
    
    if (!script || !speakers || speakers.length === 0) {
      return c.json({ success: false, error: 'スクリプトまたは話者情報が不足しています' }, 400)
    }
    
    // Google TTS API key
    const GOOGLE_TTS_API_KEY = 'AIzaSyBB5j4i5EPtmRu8S5CN40fUtkBRzLPW88Q'
    
    // Parse script into speaker lines
    const lines = parseScript(script)
    
    if (lines.length === 0) {
      return c.json({ success: false, error: 'スクリプトの解析に失敗しました' }, 400)
    }
    
    // Create speaker voice map
    const speakerVoiceMap: Record<string, any> = {}
    speakers.forEach((speaker: any) => {
      speakerVoiceMap[speaker.name] = {
        voice: getGoogleTTSVoice(speaker.accent),
        speed: speaker.speed
      }
    })
    
    // Generate audio for each line
    const audioSegments: Array<{ speaker: string, audio: string }> = []
    
    for (const line of lines) {
      const speakerConfig = speakerVoiceMap[line.speaker] || speakerVoiceMap[speakers[0].name]
      
      // Call Google TTS API
      const ttsRequest = {
        input: { text: line.text },
        voice: {
          languageCode: speakerConfig.voice.languageCode,
          name: speakerConfig.voice.name
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: speakerConfig.speed,
          pitch: 0
        }
      }
      
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ttsRequest)
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Google TTS error:', errorData)
        return c.json({ 
          success: false, 
          error: `Google TTS API エラー: ${errorData.error?.message || 'Unknown error'}` 
        }, 500)
      }
      
      const data = await response.json()
      audioSegments.push({
        speaker: line.speaker,
        audio: data.audioContent
      })
    }
    
    // Return all segments - client will handle playback
    return c.json({
      success: true,
      audioSegments: audioSegments,
      speakers: speakers,
      segmentCount: audioSegments.length,
      message: '音声生成が完了しました'
    })
    
  } catch (error: any) {
    console.error('Audio generation error:', error)
    return c.json({ 
      success: false, 
      error: `音声生成中にエラーが発生しました: ${error.message}` 
    }, 500)
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
