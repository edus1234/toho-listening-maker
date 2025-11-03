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

// Google TTS voice mapping with gender support
const getGoogleTTSVoice = (accent: string, gender: string = 'male') => {
  const voiceMap: Record<string, Record<string, { languageCode: string, name: string }>> = {
    'US': {
      'male': { languageCode: 'en-US', name: 'en-US-Journey-D' },
      'female': { languageCode: 'en-US', name: 'en-US-Journey-F' }
    },
    'UK': {
      'male': { languageCode: 'en-GB', name: 'en-GB-Journey-D' },
      'female': { languageCode: 'en-GB', name: 'en-GB-Journey-F' }
    },
    'Australian': {
      'male': { languageCode: 'en-AU', name: 'en-AU-Journey-D' },
      'female': { languageCode: 'en-AU', name: 'en-AU-Journey-F' }
    },
    'Canadian': {
      'male': { languageCode: 'en-US', name: 'en-US-Journey-D' },
      'female': { languageCode: 'en-US', name: 'en-US-Journey-F' }
    },
    'Indian': {
      'male': { languageCode: 'en-IN', name: 'en-IN-Journey-D' },
      'female': { languageCode: 'en-IN', name: 'en-IN-Journey-F' }
    },
    'Irish': {
      'male': { languageCode: 'en-IE', name: 'en-IE-Standard-A' },
      'female': { languageCode: 'en-IE', name: 'en-IE-Standard-A' }
    },
    'Scottish': {
      'male': { languageCode: 'en-GB', name: 'en-GB-Standard-B' },
      'female': { languageCode: 'en-GB', name: 'en-GB-Standard-A' }
    }
  }
  return voiceMap[accent]?.[gender] || voiceMap['US']['male']
}

// Detect if text is Japanese
const isJapanese = (text: string): boolean => {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
}

// Parse script and extract speaker lines
const parseScript = (script: string) => {
  const lines: Array<{ speaker: string, text: string, isNarration?: boolean }> = []
  const scriptLines = script.split('\n').filter(line => line.trim())
  
  for (const line of scriptLines) {
    // Match narration: [Narration: text]
    const narrationMatch = line.match(/^\[Narration:\s*(.+)\]$/i)
    if (narrationMatch) {
      lines.push({ speaker: 'Narration', text: narrationMatch[1].trim(), isNarration: true })
      continue
    }
    
    // Match "SpeakerName: text" or "[SpeakerName]" followed by text
    const dialogueMatch = line.match(/^([A-Za-z]+):\s*(.+)$/)
    const monologueMatch = line.match(/^\[([A-Za-z]+)\]$/)
    
    if (dialogueMatch) {
      const [, speaker, text] = dialogueMatch
      lines.push({ speaker: speaker.trim(), text: text.trim() })
    } else if (!monologueMatch && lines.length > 0 && !lines[lines.length - 1].isNarration) {
      // Continue previous speaker's line (but not narration)
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
    const { script, speakers, parsedLines, questions, questionReader } = body
    
    if (!script || !speakers || speakers.length === 0) {
      return c.json({ success: false, error: 'スクリプトまたは話者情報が不足しています' }, 400)
    }
    
    // Google TTS API key
    const GOOGLE_TTS_API_KEY = 'AIzaSyBB5j4i5EPtmRu8S5CN40fUtkBRzLPW88Q'
    
    // Use parsedLines if provided, otherwise parse script
    let lines = parsedLines && parsedLines.length > 0 ? parsedLines : parseScript(script)
    
    if (lines.length === 0) {
      return c.json({ success: false, error: 'スクリプトの解析に失敗しました' }, 400)
    }
    
    // Create speaker voice map
    const speakerVoiceMap: Record<string, any> = {}
    speakers.forEach((speaker: any) => {
      speakerVoiceMap[speaker.name] = {
        voice: getGoogleTTSVoice(speaker.accent, speaker.gender || 'male'),
        speed: speaker.speed || 1.0,
        pauseAfter: speaker.pauseAfter || 0,
        gender: speaker.gender || 'male'
      }
    })
    
    // Generate audio for each line
    const audioSegments: Array<{ speaker: string, audio: string, pauseAfter: number, type?: string, text?: string }> = []
    
    // Helper function to apply SSML instructions to text
    const applySSMLInstructions = (text: string, ssmlInstructions?: string): string => {
      if (!ssmlInstructions || ssmlInstructions.trim() === '') {
        return text
      }
      
      // If already wrapped in <speak> tags, return as-is
      if (ssmlInstructions.trim().startsWith('<speak>')) {
        return ssmlInstructions
      }
      
      // If instructions contain the original text, user is providing full SSML
      // Wrap it with <speak> tags
      if (ssmlInstructions.includes(text)) {
        return `<speak>${ssmlInstructions}</speak>`
      } else {
        // If instructions don't contain text, user is only providing SSML tags
        // Return the instructions wrapped in <speak> tags
        // User should write the full text with embedded SSML tags
        return `<speak>${ssmlInstructions}</speak>`
      }
    }
    
    // Helper function to generate TTS audio with SSML support
    const generateTTS = async (text: string, voiceConfig: any, speakingRate: number, ssmlInstructions?: string) => {
      let inputContent: any
      
      // Check if we should use SSML
      if (ssmlInstructions && ssmlInstructions.trim() !== '') {
        // Use SSML input
        const ssmlText = applySSMLInstructions(text, ssmlInstructions)
        inputContent = { ssml: ssmlText }
      } else {
        // Use plain text input
        inputContent = { text }
      }
      
      const ttsRequest = {
        input: inputContent,
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: speakingRate,
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
        throw new Error(`Google TTS API エラー: ${errorData.error?.message || 'Unknown error'}`)
      }
      
      const data = await response.json()
      return data.audioContent
    }
    
    // Generate audio for script lines
    for (const line of lines) {
      let voiceConfig: any
      let speakingRate = 1.0
      let pauseAfter = line.pauseAfter !== undefined ? line.pauseAfter : 0
      
      // Handle narration
      if (line.type === 'narration' || line.isNarration) {
        const textIsJapanese = isJapanese(line.text)
        if (textIsJapanese) {
          // Japanese narration
          voiceConfig = { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-D' }
        } else {
          // English narration (US neutral voice)
          voiceConfig = { languageCode: 'en-US', name: 'en-US-Journey-D' }
        }
        speakingRate = 1.0
      } else {
        // Regular speaker
        const speakerConfig = speakerVoiceMap[line.speaker] || speakerVoiceMap[speakers[0]?.name]
        if (!speakerConfig) {
          console.warn(`Speaker ${line.speaker} not found, using default`)
          voiceConfig = getGoogleTTSVoice('US', 'male')
          speakingRate = 1.0
        } else {
          voiceConfig = speakerConfig.voice
          speakingRate = speakerConfig.speed
        }
      }
      
      // Generate audio with SSML instructions if provided
      const audioContent = await generateTTS(line.text, voiceConfig, speakingRate, line.ssmlInstructions)
      audioSegments.push({
        speaker: line.speaker,
        audio: audioContent,
        pauseAfter: pauseAfter,
        type: line.type || 'dialogue',
        text: line.text,
        ssmlInstructions: line.ssmlInstructions
      })
    }
    
    // Generate audio for questions if provided
    if (questions && questions.length > 0 && questionReader) {
      const qReaderVoice = getGoogleTTSVoice(
        questionReader.accent || 'US',
        questionReader.gender || 'male'
      )
      const qReaderSpeed = questionReader.speed || 1.0
      const qPause = questionReader.questionPause || 2.0
      const oPause = questionReader.optionPause || 0.5
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        
        // Use question text as-is (already contains "Question N:" prefix from generation)
        const questionText = question.question
        const questionAudio = await generateTTS(questionText, qReaderVoice, qReaderSpeed)
        audioSegments.push({
          speaker: 'Question Reader',
          audio: questionAudio,
          pauseAfter: qPause,
          type: 'question',
          text: questionText
        })
        
        // Generate audio for each option (already contain labels like "A) Text")
        for (let j = 0; j < question.options.length; j++) {
          const optionText = question.options[j]
          const optionAudio = await generateTTS(optionText, qReaderVoice, qReaderSpeed)
          audioSegments.push({
            speaker: 'Question Reader',
            audio: optionAudio,
            pauseAfter: j === question.options.length - 1 ? 2.0 : oPause, // Longer pause after last option
            type: 'option',
            text: optionText
          })
        }
      }
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

// Audio merging endpoint
app.post('/api/merge-audio', async (c) => {
  try {
    const body = await c.req.json()
    const { audioSegments } = body
    
    if (!audioSegments || audioSegments.length === 0) {
      return c.json({ success: false, error: '音声セグメントがありません' }, 400)
    }
    
    // For Cloudflare Workers, we can't use ffmpeg or native audio processing
    // Instead, we'll concatenate the base64 MP3 data and let the client handle it
    // In a real implementation, you'd use a service like FFmpeg API or AWS Lambda
    
    // Simple concatenation (this works for MP3 files in many cases)
    let mergedAudioBase64 = ''
    
    for (const segment of audioSegments) {
      mergedAudioBase64 += segment.audio
      
      // Add silence for pause (if pauseAfter > 0)
      if (segment.pauseAfter && segment.pauseAfter > 0) {
        // Generate silence MP3 (this is a simplified approach)
        // In production, use proper audio processing
        const silenceDuration = Math.floor(segment.pauseAfter * 1000) // convert to ms
        // For now, we'll skip adding silence programmatically
        // A proper solution would use ffmpeg or similar
      }
    }
    
    // Convert base64 to binary
    const binaryString = atob(mergedAudioBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    // Return as MP3 file
    return new Response(bytes, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="listening-test.mp3"'
      }
    })
    
  } catch (error: any) {
    console.error('Audio merging error:', error)
    return c.json({ 
      success: false, 
      error: `音声結合中にエラーが発生しました: ${error.message}` 
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
