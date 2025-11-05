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

// Login endpoint
app.post('/api/login', async (c) => {
  try {
    const body = await c.req.json()
    const { username, password } = body
    
    const AUTH_USERNAME = c.env?.AUTH_USERNAME || 'admin'
    const AUTH_PASSWORD = c.env?.AUTH_PASSWORD || 'listening2024'
    
    if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
      // Simple token generation (in production, use JWT or proper session)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64')
      return c.json({ 
        success: true, 
        token: token,
        message: 'ログイン成功'
      })
    } else {
      return c.json({ 
        success: false, 
        error: 'ユーザー名またはパスワードが正しくありません'
      }, 401)
    }
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'ログイン処理中にエラーが発生しました'
    }, 500)
  }
})

// Verify token endpoint
app.post('/api/verify-token', async (c) => {
  try {
    const body = await c.req.json()
    const { token } = body
    
    if (!token) {
      return c.json({ valid: false }, 401)
    }
    
    // Simple token validation (in production, use proper JWT validation)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      if (decoded.includes(':')) {
        return c.json({ valid: true })
      }
    } catch (e) {
      return c.json({ valid: false }, 401)
    }
    
    return c.json({ valid: false }, 401)
  } catch (error: any) {
    return c.json({ valid: false }, 500)
  }
})

// OpenAI API - Generate Script
app.post('/api/generate-script-ai', async (c) => {
  try {
    const body = await c.req.json()
    const { format, topic, keywords, cefrLevel, otherConditions, numSpeakers, speakerNationalities, isLong } = body
    
    const OPENAI_API_KEY = c.env?.OPENAI_API_KEY
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      return c.json({ 
        success: false, 
        error: 'OpenAI APIキーが設定されていません。.dev.varsファイルにOPENAI_API_KEYを設定してください。' 
      }, 400)
    }
    
    // Build prompt based on format
    let prompt = ''
    
    if (format === 'monologue') {
      prompt = `You are an English listening test creator for ${cefrLevel} level students.

Create a ${isLong ? 'detailed (200-250 words)' : 'brief (80-120 words)'} monologue about "${topic}".

Requirements:
- CEFR Level: ${cefrLevel} (adjust vocabulary and grammar complexity accordingly)
- Must include these keywords naturally: ${keywords}
${otherConditions ? `- Additional conditions: ${otherConditions}` : ''}
- Format: [Speaker Name] followed by the speech content
- Use a single English name for the speaker (e.g., James, Sarah)
- Write in pure English only (no Japanese)
- Make it natural and conversational

Example format:
[James]

Hello, everyone. Today I want to discuss...

(Continue the speech naturally)`
    } else {
      // Dialogue
      prompt = `You are an English listening test creator for ${cefrLevel} level students.

Create a ${isLong ? 'detailed (200-250 words)' : 'brief (80-120 words)'} dialogue between ${numSpeakers} people about "${topic}".

Requirements:
- CEFR Level: ${cefrLevel} (adjust vocabulary and grammar complexity accordingly)
- Number of speakers: ${numSpeakers}
- Must include these keywords naturally: ${keywords}
${otherConditions ? `- Additional conditions: ${otherConditions}` : ''}
- Format: [Conversation between Name1, Name2${numSpeakers >= 3 ? ', Name3' : ''}] followed by dialogue lines
- Use English names for speakers
- Format each line as "Name: dialogue text"
- Write in pure English only (no Japanese)
- Make it natural and conversational

Example format:
[Conversation between Alice, Bob${numSpeakers >= 3 ? ', Charlie' : ''}]

Alice: Have you heard about...

Bob: Yes, I think...

${numSpeakers >= 3 ? 'Charlie: I agree, and...\n\n' : ''}(Continue the conversation naturally)`
    }
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert English listening test creator. Always output in pure English without any Japanese text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 800
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return c.json({ 
        success: false, 
        error: `OpenAI API エラー: ${errorData.error?.message || 'Unknown error'}` 
      }, 500)
    }
    
    const data = await response.json()
    const generatedScript = data.choices[0].message.content.trim()
    
    return c.json({
      success: true,
      script: generatedScript,
      model: 'gpt-4o-mini',
      tokensUsed: data.usage?.total_tokens || 0,
      estimatedCost: ((data.usage?.prompt_tokens || 0) * 0.15 / 1000000 + (data.usage?.completion_tokens || 0) * 0.60 / 1000000).toFixed(6)
    })
    
  } catch (error: any) {
    console.error('Script generation error:', error)
    return c.json({ 
      success: false, 
      error: `スクリプト生成中にエラーが発生しました: ${error.message}` 
    }, 500)
  }
})

// OpenAI API - Generate Questions
app.post('/api/generate-questions-ai', async (c) => {
  try {
    const body = await c.req.json()
    const { script, topic, cefrLevel, numQuestions } = body
    
    const OPENAI_API_KEY = c.env?.OPENAI_API_KEY
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      return c.json({ 
        success: false, 
        error: 'OpenAI APIキーが設定されていません。' 
      }, 400)
    }
    
    const prompt = `Based on the following English listening script, create ${numQuestions} comprehension questions.

Script:
${script}

Requirements:
- CEFR Level: ${cefrLevel}
- Create ${numQuestions} multiple-choice questions
- Each question should have 4 options (A, B, C, D)
- Questions should test comprehension of the main ideas and details
- Format each question exactly as:

Question 1: [question text]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Correct Answer: [A/B/C/D]

Question 2: ...

(Use this exact format for all questions)`
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert at creating English listening comprehension questions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return c.json({ 
        success: false, 
        error: `OpenAI API エラー: ${errorData.error?.message || 'Unknown error'}` 
      }, 500)
    }
    
    const data = await response.json()
    const generatedText = data.choices[0].message.content.trim()
    
    // Parse questions from response
    const questions = []
    const questionBlocks = generatedText.split(/Question \d+:/i).filter(block => block.trim())
    
    for (const block of questionBlocks) {
      const lines = block.trim().split('\n').filter(line => line.trim())
      
      if (lines.length >= 5) {
        const questionText = lines[0].trim()
        const options = []
        let correctAnswer = ''
        
        for (const line of lines.slice(1)) {
          if (line.match(/^[A-D]\)/i)) {
            options.push(line.trim())
          } else if (line.match(/correct answer/i)) {
            const match = line.match(/[A-D]/i)
            if (match) correctAnswer = match[0].toUpperCase()
          }
        }
        
        if (questionText && options.length === 4 && correctAnswer) {
          questions.push({
            question: `Question ${questions.length + 1}: ${questionText}`,
            options: options,
            correctAnswer: correctAnswer
          })
        }
      }
    }
    
    return c.json({
      success: true,
      questions: questions,
      model: 'gpt-4o-mini',
      tokensUsed: data.usage?.total_tokens || 0,
      estimatedCost: ((data.usage?.prompt_tokens || 0) * 0.15 / 1000000 + (data.usage?.completion_tokens || 0) * 0.60 / 1000000).toFixed(6)
    })
    
  } catch (error: any) {
    console.error('Question generation error:', error)
    return c.json({ 
      success: false, 
      error: `問題生成中にエラーが発生しました: ${error.message}` 
    }, 500)
  }
})

// OpenAI API - Convert Natural Language to SSML
app.post('/api/convert-to-ssml', async (c) => {
  try {
    const body = await c.req.json()
    const { text, instructions } = body
    
    const OPENAI_API_KEY = c.env?.OPENAI_API_KEY
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      return c.json({ 
        success: false, 
        error: 'OpenAI APIキーが設定されていません。' 
      }, 400)
    }
    
    if (!text || !instructions) {
      return c.json({ 
        success: false, 
        error: 'テキストと指示の両方が必要です。' 
      }, 400)
    }
    
    const prompt = `あなたはSSML（Speech Synthesis Markup Language）の専門家です。

元のテキスト:
"${text}"

ユーザーの自然言語での指示:
"${instructions}"

この指示に基づいて、元のテキストにSSMLタグを適切に挿入してください。

【重要な変換ルール】

1. ブレイク（間）の指示:
   - "noticedの前に2秒のブランク" → I <break time="2s"/>noticed that...
   - "カンマの後に0.5秒の間" → word,<break time="0.5s"/> next word
   - "ピリオドの後に1秒の間" → sentence.<break time="1s"/> Next sentence
   - ブレイクは必ず指定された単語や記号の**直前または直後**に配置

2. ピッチ（イントネーション）の指示:
   - "？を上げ調子で読む" → word<prosody pitch="+10%">?</prosody>
   - "最後を下げ調子で" → 最後の単語を <prosody pitch="-10%">word</prosody>
   - 疑問文は pitch="+10%" 以上を使用

3. 速度の指示:
   - "fastという単語を速く読む" → <prosody rate="150%">fast</prosody>
   - "全体をゆっくり読む" → <prosody rate="80%">全テキスト</prosody>
   - rate="fast" より rate="120%" のような数値指定を優先

4. 強調の指示:
   - "importantを強調" → <emphasis level="strong">important</emphasis>

5. 感情・雰囲気の指示:
   - "笑いながら" → <prosody rate="120%" pitch="+5%">全テキスト</prosody>
   - "悲しそうに" → <prosody rate="80%" pitch="-5%">全テキスト</prosody>

【出力形式】
- 元のテキストにSSMLタグを埋め込んだもののみを出力
- <speak>タグは不要（自動で追加される）
- 説明文は一切不要
- 元のテキストの単語は一切変更しない

例:
入力テキスト: "I noticed something important."
指示: "noticedの前に2秒のブランク、importantを強調"
出力: I <break time="2s"/>noticed something <emphasis level="strong">important</emphasis>.

変換後のテキストのみを出力:`

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SSML expert. Convert natural language instructions into proper SSML tags. CRITICAL: Only output the original text with SSML tags embedded. Do NOT add explanations, do NOT add <speak> tags, do NOT change any words. Output format: original_text_with_ssml_tags_only' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return c.json({ 
        success: false, 
        error: `OpenAI API エラー: ${errorData.error?.message || 'Unknown error'}` 
      }, 500)
    }
    
    const data = await response.json()
    const convertedText = data.choices[0].message.content.trim()
    
    // Log for debugging
    console.log('SSML Conversion:')
    console.log('  Original:', text)
    console.log('  Instructions:', instructions)
    console.log('  Converted:', convertedText)
    
    return c.json({
      success: true,
      ssml: convertedText,
      originalText: text,
      instructions: instructions,
      model: 'gpt-4o-mini',
      tokensUsed: data.usage?.total_tokens || 0,
      estimatedCost: ((data.usage?.prompt_tokens || 0) * 0.15 / 1000000 + (data.usage?.completion_tokens || 0) * 0.60 / 1000000).toFixed(6)
    })
    
  } catch (error: any) {
    console.error('SSML conversion error:', error)
    return c.json({ 
      success: false, 
      error: `SSML変換中にエラーが発生しました: ${error.message}` 
    }, 500)
  }
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
    
    // Google TTS API key from environment variable
    const GOOGLE_TTS_API_KEY = c.env?.GOOGLE_TTS_API_KEY || 'AIzaSyBB5j4i5EPtmRu8S5CN40fUtkBRzLPW88Q'
    
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
        
        // Check for quota exhausted error
        if (errorData.error?.code === 429 || errorData.error?.status === 'RESOURCE_EXHAUSTED') {
          throw new Error('Google TTS APIの無料枠を使い切りました。新しいAPIキーが必要です。月1M文字（約1万分の音声）まで無料です。')
        }
        
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
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-indigo-700 mb-2 flex items-center">
                            <i class="fas fa-headphones mr-3"></i>
                            リスニングテスト自動作成システム
                        </h1>
                        <p class="text-gray-600">英語のリスニング原稿・音声・問題を自動で作成</p>
                    </div>
                    <button id="logoutButton" class="hidden bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                        <i class="fas fa-sign-out-alt mr-2"></i>ログアウト
                    </button>
                </div>
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
