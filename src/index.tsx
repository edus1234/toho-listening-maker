import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getSilenceBase64 } from './silence-base64'

// Type definitions
type Bindings = {
  DB: D1Database;
  AUTH_USERNAME?: string;
  AUTH_PASSWORD?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_TTS_API_KEY?: string;
}

type User = {
  id: number;
  username: string;
  password_hash: string;
  email: string | null;
  is_admin: number;
  is_active: number;
  created_at: string;
  last_login_at: string | null;
  updated_at: string;
}

// Password hashing utilities using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Serve favicon at root level
app.get('/favicon.svg', async (c) => {
  return c.redirect('/static/favicon.svg')
})
app.get('/favicon.ico', async (c) => {
  return c.redirect('/static/favicon.svg')
})

// API routes
app.get('/api/health', (c) => {
  const hasOpenAI = !!c.env?.OPENAI_API_KEY
  const hasGoogleTTS = !!c.env?.GOOGLE_TTS_API_KEY
  
  return c.json({ 
    status: 'ok', 
    message: 'Toho Listening Test Maker',
    apiKeys: {
      openai: hasOpenAI ? 'configured' : 'missing',
      googleTTS: hasGoogleTTS ? 'configured' : 'missing'
    }
  })
})

// Login endpoint
app.post('/api/login', async (c) => {
  try {
    const body = await c.req.json()
    const { username, password } = body
    
    // Query user from database
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE username = ? AND is_active = 1'
    ).bind(username).first<User>()
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'ユーザー名またはパスワードが正しくありません'
      }, 401)
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    
    if (!isValid) {
      return c.json({ 
        success: false, 
        error: 'ユーザー名またはパスワードが正しくありません'
      }, 401)
    }
    
    // Update last login time
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run()
    
    // Generate token with user info
    const token = Buffer.from(`${username}:${user.id}:${Date.now()}`).toString('base64')
    
    return c.json({ 
      success: true, 
      token: token,
      is_admin: user.is_admin === 1,
      message: 'ログイン成功'
    })
  } catch (error: any) {
    console.error('Login error:', error)
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
    const { format, topic, keywords, cefrLevel, otherConditions, numSpeakers, speakerNationalities, speakerSettings, isLong } = body
    
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
      const speakerGender = speakerSettings?.[0]?.gender || 'male'
      const genderExample = speakerGender === 'female' ? 'Sarah' : 'James'
      prompt = `You are an English listening test creator for ${cefrLevel} level students.

Create a ${isLong ? 'detailed (200-250 words)' : 'brief (80-120 words)'} monologue about "${topic}".

Requirements:
- CEFR Level: ${cefrLevel} (adjust vocabulary and grammar complexity accordingly)
- Must include these keywords naturally: ${keywords}
${otherConditions ? `- Additional conditions: ${otherConditions}` : ''}
- Format: [Speaker Name] followed by the speech content
- Use a single English ${speakerGender === 'female' ? 'female' : 'male'} name for the speaker (e.g., ${genderExample})
- Write in pure English only (no Japanese)
- Make it natural and conversational

Example format:
[${genderExample}]

Hello, everyone. Today I want to discuss...

(Continue the speech naturally)`
    } else {
      // Dialogue - generate names based on speaker genders
      const speakerGenders = speakerSettings?.map((s: any) => s.gender || 'male') || []
      const exampleNames = speakerGenders.map((gender: string, i: number) => {
        if (gender === 'female') {
          return ['Alice', 'Sarah', 'Emma', 'Lisa', 'Mary'][i] || 'Jane'
        } else {
          return ['Bob', 'James', 'John', 'Michael', 'David'][i] || 'Tom'
        }
      })
      
      const speakerGenderInstructions = speakerGenders.map((gender: string, i: number) => 
        `Speaker ${i + 1}: ${gender === 'female' ? 'female' : 'male'} name`
      ).join(', ')
      
      prompt = `You are an English listening test creator for ${cefrLevel} level students.

Create a ${isLong ? 'detailed (200-250 words)' : 'brief (80-120 words)'} dialogue between ${numSpeakers} people about "${topic}".

Requirements:
- CEFR Level: ${cefrLevel} (adjust vocabulary and grammar complexity accordingly)
- Number of speakers: ${numSpeakers}
- Speaker genders: ${speakerGenderInstructions}
- Must include these keywords naturally: ${keywords}
${otherConditions ? `- Additional conditions: ${otherConditions}` : ''}
- Format: [Conversation between Name1, Name2${numSpeakers >= 3 ? ', Name3' : ''}] followed by dialogue lines
- Use appropriate English names matching the specified genders
- Format each line as "Name: dialogue text"
- Write in pure English only (no Japanese)
- Make it natural and conversational

Example format:
[Conversation between ${exampleNames.join(', ')}]

${exampleNames[0]}: Have you heard about...

${exampleNames[1]}: Yes, I think...

${numSpeakers >= 3 ? `${exampleNames[2]}: I agree, and...\n\n` : ''}(Continue the conversation naturally)`
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
    
    // Check if instructions contain marks (simple pattern-based conversion)
    const hasMarks = /\[(0\.2秒間|0\.5秒間|1秒間|2秒間|速く|ゆっくり)\]/.test(instructions)
    
    if (hasMarks) {
      // Direct mark-to-SSML conversion without AI
      let convertedText = instructions
      
      // STEP 1: Convert speed marks (with closing tags)
      convertedText = convertedText.replace(/\[速く\]\s*([^[\]]+?)\s*\[\/速く\]/g, '<prosody rate="140%">$1</prosody>')
      convertedText = convertedText.replace(/\[ゆっくり\]\s*([^[\]]+?)\s*\[\/ゆっくり\]/g, '<prosody rate="75%">$1</prosody>')
      // Auto-close if no closing tag found
      convertedText = convertedText.replace(/\[速く\]\s*([^[\]。、！？\.,!?\n]+)/g, '<prosody rate="140%">$1</prosody>')
      convertedText = convertedText.replace(/\[ゆっくり\]\s*([^[\]。、！？\.,!?\n]+)/g, '<prosody rate="75%">$1</prosody>')
      
      // STEP 2: Convert pause marks last (they don't interfere with other tags)
      convertedText = convertedText.replace(/\[0\.2秒間\]/g, '<break time="0.2s"/>')
      convertedText = convertedText.replace(/\[0\.5秒間\]/g, '<break time="0.5s"/>')
      convertedText = convertedText.replace(/\[1秒間\]/g, '<break time="1s"/>')
      convertedText = convertedText.replace(/\[2秒間\]/g, '<break time="2s"/>')
      
      // STEP 3: Fix consecutive breaks (Google TTS doesn't support this)
      // Replace multiple consecutive breaks with a single break of summed duration
      convertedText = convertedText.replace(/<break time="0\.2s"\/>\s*<break time="0\.2s"\/>/g, '<break time="0.4s"/>')
      convertedText = convertedText.replace(/<break time="0\.2s"\/>\s*<break time="0\.5s"\/>/g, '<break time="0.7s"/>')
      convertedText = convertedText.replace(/<break time="0\.5s"\/>\s*<break time="0\.2s"\/>/g, '<break time="0.7s"/>')
      convertedText = convertedText.replace(/<break time="0\.5s"\/>\s*<break time="0\.5s"\/>/g, '<break time="1s"/>')
      convertedText = convertedText.replace(/<break time="1s"\/>\s*<break time="1s"\/>/g, '<break time="2s"/>')
      convertedText = convertedText.replace(/<break time="1s"\/>\s*<break time="2s"\/>/g, '<break time="3s"/>')
      convertedText = convertedText.replace(/<break time="2s"\/>\s*<break time="1s"\/>/g, '<break time="3s"/>')
      convertedText = convertedText.replace(/<break time="2s"\/>\s*<break time="2s"\/>/g, '<break time="4s"/>')
      // Remove triple or more consecutive breaks - replace with longest single break
      convertedText = convertedText.replace(/(<break time="[^"]+"\/>[\s]*){3,}/g, '<break time="3s"/>')
      
      // Remove any remaining closing marks that weren't matched
      convertedText = convertedText.replace(/\[\/速く\]/g, '')
      convertedText = convertedText.replace(/\[\/ゆっくり\]/g, '')
      convertedText = convertedText.replace(/\[\/怒る\]/g, '')
      convertedText = convertedText.replace(/\[\/ワクワク\]/g, '')
      
      // Remove any remaining unconverted marks to prevent SSML errors
      convertedText = convertedText.replace(/\[↑\]/g, '')
      convertedText = convertedText.replace(/\[↓\]/g, '')
      convertedText = convertedText.replace(/\[強調\]/g, '')
      convertedText = convertedText.replace(/\[速く\]/g, '')
      convertedText = convertedText.replace(/\[ゆっくり\]/g, '')
      convertedText = convertedText.replace(/\[笑う\]/g, '')
      convertedText = convertedText.replace(/\[怒る\]/g, '')
      convertedText = convertedText.replace(/\[ワクワク\]/g, '')
      convertedText = convertedText.replace(/\[0\.2秒間\]/g, '')
      convertedText = convertedText.replace(/\[0\.5秒間\]/g, '')
      convertedText = convertedText.replace(/\[1秒間\]/g, '')
      convertedText = convertedText.replace(/\[2秒間\]/g, '')
      
      // ★★★ CRITICAL FIX: Remove ALL remaining brackets (single or empty) ★★★
      // This fixes cases like [1秒間]] → ]  or [ ] remaining after conversion
      convertedText = convertedText.replace(/\[\s*\]/g, '')  // Remove empty brackets [ ]
      convertedText = convertedText.replace(/\]/g, '')       // Remove stray closing brackets ]
      convertedText = convertedText.replace(/\[/g, '')       // Remove stray opening brackets [
      
      // Validate SSML structure - ensure all tags are properly closed
      const openProsodyCount = (convertedText.match(/<prosody[^>]*>/g) || []).length
      const closeProsodyCount = (convertedText.match(/<\/prosody>/g) || []).length
      const openEmphasisCount = (convertedText.match(/<emphasis[^>]*>/g) || []).length
      const closeEmphasisCount = (convertedText.match(/<\/emphasis>/g) || []).length
      
      // This shouldn't happen with the new logic, but just in case
      if (openProsodyCount > closeProsodyCount) {
        convertedText += '</prosody>'.repeat(openProsodyCount - closeProsodyCount)
      }
      if (openEmphasisCount > closeEmphasisCount) {
        convertedText += '</emphasis>'.repeat(openEmphasisCount - closeEmphasisCount)
      }
      
      return c.json({
        success: true,
        ssml: convertedText,
        tokensUsed: 0,
        estimatedCost: 0
      })
    }
    
    // If no marks, use AI-based conversion
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

// Gemini TTS voice mapping (30 prebuilt voices)
// Voice characteristics based on Google's recommendations
const getGeminiTTSVoice = (accent: string, gender: string = 'male') => {
  const voiceMap: Record<string, Record<string, string>> = {
    'US': {
      'male': 'Puck',      // Upbeat, energetic (US accent)
      'female': 'Kore'     // Clear, professional (US accent)
    },
    'UK': {
      'male': 'Charon',    // Firm, authoritative (UK accent)
      'female': 'Leda'     // Warm, friendly (UK accent)
    },
    'Australian': {
      'male': 'Fenrir',    // Casual, approachable
      'female': 'Aoede'    // Bright, cheerful
    },
    'Canadian': {
      'male': 'Puck',      // Same as US
      'female': 'Kore'
    },
    'Indian': {
      'male': 'Orus',      // Clear, articulate
      'female': 'Callirhoe' // Soft, pleasant
    },
    'Irish': {
      'male': 'Autonoe',   // Distinctive, expressive
      'female': 'Enceladus'
    },
    'Scottish': {
      'male': 'Iapetus',   // Strong, distinctive
      'female': 'Umbriel'
    }
  }
  return voiceMap[accent]?.[gender] || 'Puck'
}

// Convert emotion marks to Gemini TTS prompt instructions
const convertEmotionToPrompt = (text: string, voiceInstructions?: string): string => {
  if (!voiceInstructions) return text
  
  // Check for emotion marks
  const hasLaugh = /\[笑う\]/.test(voiceInstructions)
  const hasAngry = /\[怒る\]/.test(voiceInstructions)
  const hasExcited = /\[ワクワク\]/.test(voiceInstructions)
  const hasPitchUp = /\[↑\]/.test(voiceInstructions)
  const hasPitchDown = /\[↓\]/.test(voiceInstructions)
  const hasEmphasis = /\[強調\]/.test(voiceInstructions)
  
  let prompt = ''
  
  if (hasLaugh) {
    prompt = 'Say cheerfully with a happy tone: '
  } else if (hasAngry) {
    prompt = 'Say in an angry, forceful tone: '
  } else if (hasExcited) {
    prompt = 'Say with excitement and enthusiasm: '
  } else if (hasPitchUp) {
    prompt = 'Say with rising intonation and upbeat tone: '
  } else if (hasPitchDown) {
    prompt = 'Say with falling intonation and serious tone: '
  } else if (hasEmphasis) {
    prompt = 'Say with strong emphasis: '
  }
  
  return prompt + text
}

// Google TTS voice mapping with gender support
// Returns { standard: ..., ssml: ... } where ssml is SSML-compatible voice
const getGoogleTTSVoice = (accent: string, gender: string = 'male', voiceStyle: string = 'neutral') => {
  // voiceStyle: 'neutral' (standard), 'warm' (friendly/bright), 'calm' (professional/deep)
  const voiceMap: Record<string, Record<string, Record<string, { languageCode: string, standard: string, ssml: string }>>> = {
    'US': {
      'male': {
        'neutral': { 
          languageCode: 'en-US', 
          standard: 'en-US-Journey-D',  // Journey for plain text (best quality)
          ssml: 'en-US-Wavenet-D'        // WaveNet for SSML (SSML-compatible)
        },
        'warm': {
          languageCode: 'en-US',
          standard: 'en-US-Journey-D',
          ssml: 'en-US-Wavenet-A'  // Brighter, friendlier tone
        },
        'calm': {
          languageCode: 'en-US',
          standard: 'en-US-Journey-D',
          ssml: 'en-US-Wavenet-B'  // Deeper, more professional
        }
      },
      'female': {
        'neutral': { 
          languageCode: 'en-US', 
          standard: 'en-US-Journey-F', 
          ssml: 'en-US-Wavenet-F' 
        },
        'warm': {
          languageCode: 'en-US',
          standard: 'en-US-Journey-F',
          ssml: 'en-US-Wavenet-C'  // Brighter, friendlier tone
        },
        'calm': {
          languageCode: 'en-US',
          standard: 'en-US-Journey-F',
          ssml: 'en-US-Wavenet-E'  // Calmer, more professional
        }
      }
    },
    'UK': {
      'male': {
        'neutral': { 
          languageCode: 'en-GB', 
          standard: 'en-GB-Journey-D', 
          ssml: 'en-GB-Wavenet-D' 
        },
        'warm': {
          languageCode: 'en-GB',
          standard: 'en-GB-Journey-D',
          ssml: 'en-GB-Wavenet-B'
        },
        'calm': {
          languageCode: 'en-GB',
          standard: 'en-GB-Journey-D',
          ssml: 'en-GB-Wavenet-D'
        }
      },
      'female': {
        'neutral': { 
          languageCode: 'en-GB', 
          standard: 'en-GB-Journey-F', 
          ssml: 'en-GB-Wavenet-F' 
        },
        'warm': {
          languageCode: 'en-GB',
          standard: 'en-GB-Journey-F',
          ssml: 'en-GB-Wavenet-A'
        },
        'calm': {
          languageCode: 'en-GB',
          standard: 'en-GB-Journey-F',
          ssml: 'en-GB-Wavenet-C'
        }
      }
    },
    'Australian': {
      'male': {
        'neutral': { 
          languageCode: 'en-AU', 
          standard: 'en-AU-Journey-D', 
          ssml: 'en-AU-Wavenet-B' 
        },
        'warm': {
          languageCode: 'en-AU',
          standard: 'en-AU-Journey-D',
          ssml: 'en-AU-Wavenet-D'
        },
        'calm': {
          languageCode: 'en-AU',
          standard: 'en-AU-Journey-D',
          ssml: 'en-AU-Wavenet-B'
        }
      },
      'female': {
        'neutral': { 
          languageCode: 'en-AU', 
          standard: 'en-AU-Journey-F', 
          ssml: 'en-AU-Wavenet-A' 
        },
        'warm': {
          languageCode: 'en-AU',
          standard: 'en-AU-Journey-F',
          ssml: 'en-AU-Wavenet-C'
        },
        'calm': {
          languageCode: 'en-AU',
          standard: 'en-AU-Journey-F',
          ssml: 'en-AU-Wavenet-A'
        }
      }
    },
    'Canadian': {
      'male': {
        'neutral': { 
          languageCode: 'en-US', 
          standard: 'en-US-Journey-D', 
          ssml: 'en-US-Wavenet-D' 
        },
        'warm': {
          languageCode: 'en-US',
          standard: 'en-US-Journey-D',
          ssml: 'en-US-Wavenet-A'
        },
        'calm': {
          languageCode: 'en-US',
          standard: 'en-US-Journey-D',
          ssml: 'en-US-Wavenet-B'
        }
      },
      'female': {
        'neutral': { 
          languageCode: 'en-US', 
          standard: 'en-US-Journey-F', 
          ssml: 'en-US-Wavenet-F' 
        },
        'warm': {
          languageCode: 'en-US',
          standard: 'en-US-Journey-F',
          ssml: 'en-US-Wavenet-C'
        },
        'calm': {
          languageCode: 'en-US',
          standard: 'en-US-Journey-F',
          ssml: 'en-US-Wavenet-E'
        }
      }
    },
    'Indian': {
      'male': {
        'neutral': { 
          languageCode: 'en-IN', 
          standard: 'en-IN-Journey-D', 
          ssml: 'en-IN-Wavenet-B' 
        },
        'warm': {
          languageCode: 'en-IN',
          standard: 'en-IN-Journey-D',
          ssml: 'en-IN-Wavenet-C'
        },
        'calm': {
          languageCode: 'en-IN',
          standard: 'en-IN-Journey-D',
          ssml: 'en-IN-Wavenet-D'
        }
      },
      'female': {
        'neutral': { 
          languageCode: 'en-IN', 
          standard: 'en-IN-Journey-F', 
          ssml: 'en-IN-Wavenet-A' 
        },
        'warm': {
          languageCode: 'en-IN',
          standard: 'en-IN-Journey-F',
          ssml: 'en-IN-Wavenet-D'
        },
        'calm': {
          languageCode: 'en-IN',
          standard: 'en-IN-Journey-F',
          ssml: 'en-IN-Wavenet-A'
        }
      }
    },
    'Irish': {
      'male': {
        'neutral': { 
          languageCode: 'en-IE', 
          standard: 'en-IE-Standard-A', 
          ssml: 'en-IE-Standard-A' 
        },
        'warm': {
          languageCode: 'en-IE',
          standard: 'en-IE-Standard-A',
          ssml: 'en-IE-Standard-A'
        },
        'calm': {
          languageCode: 'en-IE',
          standard: 'en-IE-Standard-A',
          ssml: 'en-IE-Standard-A'
        }
      },
      'female': {
        'neutral': { 
          languageCode: 'en-IE', 
          standard: 'en-IE-Standard-A', 
          ssml: 'en-IE-Standard-A' 
        },
        'warm': {
          languageCode: 'en-IE',
          standard: 'en-IE-Standard-A',
          ssml: 'en-IE-Standard-A'
        },
        'calm': {
          languageCode: 'en-IE',
          standard: 'en-IE-Standard-A',
          ssml: 'en-IE-Standard-A'
        }
      }
    },
    'Scottish': {
      'male': {
        'neutral': { 
          languageCode: 'en-GB', 
          standard: 'en-GB-Standard-B', 
          ssml: 'en-GB-Standard-B' 
        },
        'warm': {
          languageCode: 'en-GB',
          standard: 'en-GB-Standard-B',
          ssml: 'en-GB-Standard-B'
        },
        'calm': {
          languageCode: 'en-GB',
          standard: 'en-GB-Standard-B',
          ssml: 'en-GB-Standard-B'
        }
      },
      'female': {
        'neutral': { 
          languageCode: 'en-GB', 
          standard: 'en-GB-Standard-A', 
          ssml: 'en-GB-Standard-A' 
        },
        'warm': {
          languageCode: 'en-GB',
          standard: 'en-GB-Standard-A',
          ssml: 'en-GB-Standard-A'
        },
        'calm': {
          languageCode: 'en-GB',
          standard: 'en-GB-Standard-A',
          ssml: 'en-GB-Standard-A'
        }
      }
    }
  }
  return voiceMap[accent]?.[gender]?.[voiceStyle] || voiceMap['US']?.['male']?.['neutral'] || voiceMap['US']['male']['neutral']
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

// Gemini TTS generation helper
const generateGeminiTTS = async (text: string, voiceName: string, emotionPrompt: string, GEMINI_API_KEY: string) => {
  const fullPrompt = emotionPrompt ? `${emotionPrompt} ${text}` : text
  
  const requestBody = {
    contents: [
      {
        parts: [
          { text: fullPrompt }
        ]
      }
    ],
    generationConfig: {
      response_modalities: ['AUDIO'],
      speech_config: {
        voice_config: {
          prebuilt_voice_config: {
            voice_name: voiceName
          }
        }
      }
    }
  }
  
  console.log('🎙️ Gemini TTS Request:', JSON.stringify(requestBody, null, 2))
  
  // Gemini 2.5 Flash Preview TTS モデルを使用（感情表現対応）
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    }
  )
  
  if (!response.ok) {
    const errorData = await response.json()
    console.error('Gemini TTS error:', errorData)
    throw new Error(`Gemini TTS API エラー: ${errorData.error?.message || 'Unknown error'}`)
  }
  
  const data = await response.json()
  
  console.log('🎙️ Gemini TTS Response structure:', JSON.stringify(data, null, 2).substring(0, 500))
  
  // Extract base64 audio from response
  // Try multiple possible paths
  let audioData = data.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data
  
  if (!audioData) {
    // Try alternative path
    audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
  }
  
  if (!audioData) {
    console.error('Full Gemini TTS response:', JSON.stringify(data, null, 2))
    throw new Error('Gemini TTS: 音声データが見つかりません')
  }
  
  console.log('✅ Gemini TTS: Audio data extracted successfully')
  
  return audioData
}

// Audio generation endpoint
app.post('/api/generate-audio', async (c) => {
  console.log('🎵 === /api/generate-audio endpoint called ===')
  try {
    console.log('🔍 Step 1: Parsing request body...')
    const body = await c.req.json()
    const { script, speakers, parsedLines, questions, questionReader, narratorSettings, useGeminiTTS } = body
    
    console.log('🔍 Step 2: Validating inputs...')
    console.log('   - Script length:', script?.length || 0)
    console.log('   - Speakers count:', speakers?.length || 0)
    console.log('   - Parsed lines count:', parsedLines?.length || 0)
    
    if (!script || !speakers || speakers.length === 0) {
      console.error('❌ Validation failed: Missing script or speakers')
      return c.json({ success: false, error: 'スクリプトまたは話者情報が不足しています' }, 400)
    }
    
    console.log('🔍 Step 3: Loading API keys...')
    // API keys from environment variables
    const GOOGLE_TTS_API_KEY = c.env?.GOOGLE_TTS_API_KEY || 'AIzaSyBB5j4i5EPtmRu8S5CN40fUtkBRzLPW88Q'
    const GEMINI_API_KEY = c.env?.GEMINI_API_KEY || c.env?.GOOGLE_TTS_API_KEY
    
    console.log('   - GOOGLE_TTS_API_KEY:', GOOGLE_TTS_API_KEY ? `${GOOGLE_TTS_API_KEY.substring(0, 10)}...` : 'NOT SET')
    console.log('   - GEMINI_API_KEY:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET')
    
    // Use parsedLines if provided, otherwise parse script
    let lines = parsedLines && parsedLines.length > 0 ? parsedLines : parseScript(script)
    
    if (lines.length === 0) {
      return c.json({ success: false, error: 'スクリプトの解析に失敗しました' }, 400)
    }
    
    // Create speaker voice map
    const speakerVoiceMap: Record<string, any> = {}
    speakers.forEach((speaker: any) => {
      const speakerLanguage = speaker.language || 'en'
      let voiceConfig: any
      
      if (speakerLanguage === 'ja') {
        // Japanese speaker - use Japanese voice based on gender
        const speakerGender = speaker.gender || 'male'
        if (speakerGender === 'female') {
          voiceConfig = { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-B' } // Female
          console.log(`✅ Speaker ${speaker.name}: Japanese FEMALE voice (ja-JP-Wavenet-B)`)
        } else {
          voiceConfig = { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-D' } // Male
          console.log(`✅ Speaker ${speaker.name}: Japanese MALE voice (ja-JP-Wavenet-D)`)
        }
        console.log(`   → Full config:`, JSON.stringify(speaker))
      } else {
        // English speaker - use accent, gender, voiceStyle
        voiceConfig = getGoogleTTSVoice(speaker.accent, speaker.gender || 'male', speaker.voiceStyle || 'neutral')
        console.log(`✅ Speaker ${speaker.name}: English ${speaker.gender || 'male'} voice`)
        console.log(`   → Voice config:`, JSON.stringify(voiceConfig))
        console.log(`   → Full speaker:`, JSON.stringify(speaker))
      }
      
      speakerVoiceMap[speaker.name] = {
        voice: voiceConfig,
        speed: speaker.speed || 1.0,
        pauseAfter: speaker.pauseAfter || 0,
        gender: speaker.gender || 'male',
        voiceStyle: speaker.voiceStyle || 'neutral',
        language: speakerLanguage
      }
    })
    
    // Generate audio for each line
    const audioSegments: Array<{ speaker: string, audio: string, pauseAfter: number, type?: string, text?: string }> = []
    
    // Helper function to apply SSML instructions to text with optional speaking rate
    const applySSMLInstructions = (text: string, ssmlInstructions?: string, speakingRate?: number): string => {
      if (!ssmlInstructions || ssmlInstructions.trim() === '') {
        return text
      }
      
      // If already wrapped in <speak> tags, return as-is
      if (ssmlInstructions.trim().startsWith('<speak>')) {
        return ssmlInstructions
      }
      
      // SSML instructions should already be the full converted text with SSML tags
      // Escape XML special characters that are not part of tags
      let escapedSSML = ssmlInstructions
        .replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;') // Escape & not already part of entity
        // Don't escape < and > as they are part of SSML tags
      
      // Apply overall speaking rate if provided and not 1.0
      if (speakingRate && speakingRate !== 1.0) {
        const ratePercent = Math.round(speakingRate * 100)
        escapedSSML = `<prosody rate="${ratePercent}%">${escapedSSML}</prosody>`
      }
      
      // Wrap with <speak> tags
      return `<speak>${escapedSSML}</speak>`
    }
    
    // Helper function to generate TTS audio with SSML support
    const generateTTS = async (text: string, voiceConfig: any, speakingRate: number, ssmlInstructions?: string) => {
      let inputContent: any
      const useSSML = ssmlInstructions && ssmlInstructions.trim() !== ''
      
      // Check if we should use SSML
      if (useSSML) {
        // Use SSML input with speaking rate applied
        const ssmlText = applySSMLInstructions(text, ssmlInstructions, speakingRate)
        console.log('🔍 Using SSML:', ssmlText)
        inputContent = { ssml: ssmlText }
      } else {
        // Use plain text input
        inputContent = { text }
      }
      
      // Determine voice name based on voice config structure
      let voiceName: string
      if (voiceConfig.name) {
        // Japanese or other direct voice config (only has 'name' field)
        voiceName = voiceConfig.name
      } else {
        // English voice config (has 'ssml' and 'standard' fields)
        voiceName = useSSML ? voiceConfig.ssml : voiceConfig.standard
      }
      
      const ttsRequest = {
        input: inputContent,
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceName
        },
        audioConfig: {
          audioEncoding: 'MP3',
          // When using SSML, speakingRate should be 1.0 (use prosody rate in SSML instead)
          speakingRate: useSSML ? 1.0 : speakingRate,
          pitch: 0
        }
      }
      
      console.log('📤 TTS Request:', JSON.stringify(ttsRequest, null, 2))
      console.log('🎤 Voice Name Used:', voiceName, '| Language:', voiceConfig.languageCode)
      console.log('📝 Text length:', ttsRequest.input.text?.length || ttsRequest.input.ssml?.length || 0, 'characters')
      
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ttsRequest)
        }
      )
      
      console.log('📥 TTS Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Google TTS error response:', JSON.stringify(errorData, null, 2))
        console.error('❌ Response status:', response.status, response.statusText)
        
        // Check for quota exhausted error
        if (errorData.error?.code === 429 || errorData.error?.status === 'RESOURCE_EXHAUSTED') {
          throw new Error('Google TTS APIの無料枠を使い切りました。新しいAPIキーが必要です。月100万文字（約1万分の音声）まで無料です。')
        }
        
        // Check for rate limit error
        if (response.status === 429) {
          throw new Error('Google TTS APIのレート制限に達しました。少し時間をおいてから再度お試しください。')
        }
        
        // Generic error with detailed message
        const errorMessage = errorData.error?.message || errorData.message || 'Unknown error'
        throw new Error(`Google TTS API エラー (${response.status}): ${errorMessage}`)
      }
      
      const data = await response.json()
      return data.audioContent
    }
    
    console.log('🔍 Step 4: Starting audio generation for', lines.length, 'lines...')
    
    // Generate audio for script lines
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      console.log(`🎤 Processing line ${lineIndex + 1}/${lines.length}: "${line.text?.substring(0, 50)}..."`)
      
      let voiceConfig: any
      let speakingRate = 1.0
      let pauseAfter = line.pauseAfter !== undefined ? line.pauseAfter : 0
      let audioContent: string
      
      // Handle narration
      if (line.type === 'narration' || line.isNarration) {
        console.log('🎙️ Narration detected for line:', line.speaker)
        console.log('🎙️ Checking if Narration speaker exists in map:', !!speakerVoiceMap['Narration'])
        
        // Check if Narration speaker is in the speakerVoiceMap (for regeneration)
        if (speakerVoiceMap['Narration']) {
          console.log('✅ Using Narration speaker from speakerVoiceMap')
          const narratorConfig = speakerVoiceMap['Narration']
          voiceConfig = narratorConfig.voice
          speakingRate = narratorConfig.speed
          console.log('🎯 Narrator config from map:', JSON.stringify(narratorConfig))
        } else {
          // Fallback to narratorSettings (for initial generation)
          const narratorLanguage = narratorSettings?.language || 'en'
          
          console.log('🎙️ Using narratorSettings (fallback):', {
            language: narratorLanguage,
            gender: narratorSettings?.gender,
            fullSettings: narratorSettings
          })
          
          if (narratorLanguage === 'ja') {
            // Japanese narration - use Japanese voice based on gender
            const narratorGender = narratorSettings?.gender || 'male'
            if (narratorGender === 'female') {
              voiceConfig = { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-B' } // Female
              console.log('✅ Using Japanese FEMALE voice: ja-JP-Wavenet-B')
            } else {
              voiceConfig = { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-D' } // Male
              console.log('✅ Using Japanese MALE voice: ja-JP-Wavenet-D')
            }
          } else {
            // English narration - use narrator settings if provided
            const narratorAccent = narratorSettings?.accent || 'US'
            const narratorGender = narratorSettings?.gender || 'male'
            const narratorVoiceStyle = narratorSettings?.voiceStyle || 'neutral'
            voiceConfig = getGoogleTTSVoice(narratorAccent, narratorGender, narratorVoiceStyle)
            console.log('✅ Using English voice:', voiceConfig)
          }
          speakingRate = 1.0
        }
      } else {
        // Regular speaker
        console.log(`🔍 Looking for speaker: "${line.speaker}"`)
        console.log(`🔍 Available speakers in map:`, Object.keys(speakerVoiceMap))
        
        const speakerConfig = speakerVoiceMap[line.speaker] || speakerVoiceMap[speakers[0]?.name]
        if (!speakerConfig) {
          console.warn(`⚠️ Speaker ${line.speaker} not found, using default`)
          voiceConfig = getGoogleTTSVoice('US', 'male', 'neutral')
          speakingRate = 1.0
        } else {
          console.log(`✅ Found speaker config:`, JSON.stringify(speakerConfig))
          voiceConfig = speakerConfig.voice
          speakingRate = speakerConfig.speed
        }
      }
      
      console.log(`🎯 Final voice config for line:`, JSON.stringify(voiceConfig))
      
      console.log(`🎤 Calling TTS API for line ${lineIndex + 1}...`)
      try {
        // Always use Google TTS with SSML instructions
        audioContent = await generateTTS(line.text, voiceConfig, speakingRate, line.ssmlInstructions)
        console.log(`✅ TTS API call successful for line ${lineIndex + 1}`)
      } catch (ttsError: any) {
        console.error(`❌ TTS API call failed for line ${lineIndex + 1}:`, ttsError.message)
        throw ttsError
      }
      
      audioSegments.push({
        speaker: line.speaker,
        audio: audioContent,
        pauseAfter: pauseAfter,
        type: line.type || 'dialogue',
        text: line.text,
        ssmlInstructions: line.ssmlInstructions,
        ttsEngine: 'google'
      })
      
      // Add default 0.5s silence after dialogue segments (not narration/question/option)
      const shouldAddDefaultBlank = (line.type === 'dialogue' || !line.type) && pauseAfter === 0
      const finalPauseAfter = shouldAddDefaultBlank ? 0.5 : pauseAfter
      
      // Add silence after this segment if pauseAfter > 0 or default blank
      if (finalPauseAfter > 0) {
        const silenceBase64 = getSilenceBase64(finalPauseAfter)
        if (silenceBase64) {
          console.log(`⏸️ Adding ${finalPauseAfter}s silence after segment${shouldAddDefaultBlank ? ' (default)' : ''}`)
          audioSegments.push({
            speaker: 'Silence',
            audio: silenceBase64,
            pauseAfter: finalPauseAfter,
            duration: finalPauseAfter,
            type: 'silence',
            text: `[Silence: ${finalPauseAfter}s]`
          })
        }
      }
    }
    
    console.log('🔍 Step 5: Checking for questions...')
    console.log('   - Questions:', questions?.length || 0)
    console.log('   - Has questionReader:', !!questionReader)
    
    // Generate audio for questions if provided
    if (questions && questions.length > 0 && questionReader) {
      console.log('🔍 Step 6: Starting question audio generation...')
      const qReaderVoice = getGoogleTTSVoice(
        questionReader.accent || 'US',
        questionReader.gender || 'male',
        questionReader.voiceStyle || 'neutral'
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
        
        // Add silence after question
        if (qPause > 0) {
          const silenceBase64 = getSilenceBase64(qPause)
          if (silenceBase64) {
            console.log(`⏸️ Adding ${qPause}s silence after Question ${i + 1}`)
            audioSegments.push({
              speaker: 'Silence',
              audio: silenceBase64,
              pauseAfter: 0,
              type: 'silence',
              text: `[Silence: ${qPause}s]`
            })
          }
        }
        
        // Generate audio for each option (already contain labels like "A) Text")
        for (let j = 0; j < question.options.length; j++) {
          const optionText = question.options[j]
          const optionAudio = await generateTTS(optionText, qReaderVoice, qReaderSpeed)
          const optionPause = j === question.options.length - 1 ? 2.0 : oPause
          audioSegments.push({
            speaker: 'Question Reader',
            audio: optionAudio,
            pauseAfter: optionPause,
            type: 'option',
            text: optionText
          })
          
          // Add silence after option
          if (optionPause > 0) {
            const silenceBase64 = getSilenceBase64(optionPause)
            if (silenceBase64) {
              console.log(`⏸️ Adding ${optionPause}s silence after Option ${j + 1}`)
              audioSegments.push({
                speaker: 'Silence',
                audio: silenceBase64,
                pauseAfter: 0,
                type: 'silence',
                text: `[Silence: ${optionPause}s]`
              })
            }
          }
        }
      }
    }
    
    console.log('✅ Step 7: All audio generation completed successfully!')
    console.log('   - Total segments:', audioSegments.length)
    
    // Return all segments - client will handle playback
    console.log('🎵 === Returning successful response ===')
    return c.json({
      success: true,
      audioSegments: audioSegments,
      speakers: speakers,
      segmentCount: audioSegments.length,
      message: '音声生成が完了しました'
    })
    
  } catch (error: any) {
    console.error('❌ === CAUGHT ERROR IN /api/generate-audio ===')
    console.error('❌ Audio generation error:', error)
    console.error('❌ Error stack:', error.stack)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error message:', error.message)
    
    // Provide more detailed error message
    let errorMessage = error.message || 'Unknown error'
    
    // Check if it's a quota/limit error
    if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('無料枠')) {
      errorMessage = '⚠️ Google TTS APIの無料枠を使い切りました。新しいAPIキーが必要です。\n月100万文字（約1万分の音声）まで無料です。'
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      errorMessage = '⚠️ Google TTS APIのレート制限に達しました。少し時間をおいてから再度お試しください。'
    }
    
    console.log('🎵 === Returning error response ===')
    return c.json({ 
      success: false, 
      error: `音声生成中にエラーが発生しました:\n${errorMessage}` 
    }, 500)
  }
})

// Generate silence segment endpoint
app.post('/api/generate-silence', async (c) => {
  try {
    const body = await c.req.json()
    const { duration } = body
    
    if (!duration || duration <= 0) {
      return c.json({ success: false, error: '無効なサイレンス長です' }, 400)
    }
    
    // Get pre-generated silence base64
    const silenceBase64 = getSilenceBase64(duration)
    
    if (!silenceBase64) {
      return c.json({ success: false, error: 'サイレンスデータが見つかりません' }, 500)
    }
    
    console.log(`✅ Generated ${duration}s silence`)
    
    return c.json({
      success: true,
      silenceBase64: silenceBase64,
      duration: duration
    })
  } catch (error: any) {
    console.error('Silence generation error:', error)
    return c.json({ 
      success: false, 
      error: `サイレンス生成中にエラーが発生しました: ${error.message}` 
    }, 500)
  }
})

// Audio merging endpoint with blank insertion
app.post('/api/merge-audio', async (c) => {
  try {
    const body = await c.req.json()
    const { audioSegments } = body
    
    if (!audioSegments || audioSegments.length === 0) {
      return c.json({ success: false, error: '音声セグメントが提供されていません' }, 400)
    }
    
    console.log(`🔗 Merging ${audioSegments.length} audio segments with blanks...`)
    
    // Build merged segments array: audio blocks + silence blocks
    const mergedSegments: Array<{ audio: string, duration?: number, type: string, speaker?: string, text?: string }> = []
    
    for (const segment of audioSegments) {
      // Skip silence segments that are already in the array (from previous operations)
      if (segment.type === 'silence') {
        continue
      }
      
      // Add the audio segment (発言ブロック)
      mergedSegments.push({
        audio: segment.audio,
        type: segment.type || 'dialogue',
        speaker: segment.speaker,
        text: segment.text
      })
      
      // Add silence block (ブランクブロック) after this segment if pauseAfter > 0
      const pauseAfter = segment.pauseAfter || 0
      if (pauseAfter > 0) {
        const silenceBase64 = getSilenceBase64(pauseAfter)
        if (silenceBase64) {
          console.log(`⏸️ Adding ${pauseAfter}s silence after ${segment.speaker}`)
          mergedSegments.push({
            audio: silenceBase64,
            duration: pauseAfter,
            type: 'silence',
            speaker: 'Silence',
            text: `[Silence: ${pauseAfter}s]`
          })
        }
      }
    }
    
    console.log(`✅ Merged into ${mergedSegments.length} blocks (audio + silence)`)
    
    return c.json({
      success: true,
      mergedSegments: mergedSegments,
      totalSegments: mergedSegments.length
    })
  } catch (error: any) {
    console.error('Merge audio error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Old merge endpoint for backward compatibility (deprecated)
app.post('/api/merge-audio-old', async (c) => {
  try {
    const body = await c.req.json()
    const { audioSegments } = body
    
    if (!audioSegments || audioSegments.length === 0) {
      return c.json({ success: false, error: '音声セグメントがありません' }, 400)
    }
    
    console.log('Merging audio segments (old method):', audioSegments.length);
    
    // Prepare merged audio data
    const mergedAudio = [];
    
    for (let i = 0; i < audioSegments.length; i++) {
      const segment = audioSegments[i];
      mergedAudio.push(segment.audio);
      console.log(`Segment ${i}: pauseAfter = ${segment.pauseAfter || 0}s`);
    }
    
    // Simple concatenation
    const mergedAudioBase64 = mergedAudio.join('');
    
    // Convert base64 to binary
    try {
      const binaryString = atob(mergedAudioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('Successfully merged audio, size:', bytes.length, 'bytes');
      
      // Return as MP3 file
      return new Response(bytes, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="listening-test.mp3"'
        }
      });
    } catch (decodeError: any) {
      console.error('Base64 decode error:', decodeError);
      return c.json({ 
        success: false, 
        error: `Base64デコードエラー: ${decodeError.message}` 
      }, 500);
    }
    
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
        <title>Toho Listening Maker - 桐朋中学校・桐朋高等学校</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .fade-in { animation: fadeIn 0.3s ease-in; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            /* Fix for gradient text descender clipping */
            .gradient-text-fix {
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                display: inline-block;
                padding-bottom: 0.1em;
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-4xl">
            <!-- Header -->
            <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border-t-4 border-gradient-to-r from-purple-600 to-blue-600">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div>
                            <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-800 to-blue-800 gradient-text-fix mb-1" style="line-height: 1.3;">
                                Toho Listening Maker
                            </h1>
                            <p class="text-base text-gray-600 font-medium">桐朋中学校・桐朋高等学校</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button id="userManagementButton" class="hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg font-semibold">
                            <i class="fas fa-users mr-2"></i>ユーザー管理
                        </button>
                        <button id="logoutButton" class="hidden bg-white text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all shadow-md border border-gray-200 font-semibold">
                            <i class="fas fa-sign-out-alt mr-2"></i>ログアウト
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div id="app"></div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js?hash=a3b30bac6e66bd179ec22ef5ba905d3d"></script>
    </body>
    </html>
  `)
})

// ========================================
// User Management API Routes
// ========================================

// Middleware to check if user is admin
async function requireAdmin(c: any, next: any) {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    const token = authHeader.substring(7)
    
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [username, userId] = decoded.split(':')
      
      // Check if user exists and is admin
      const user = await c.env.DB.prepare(
        'SELECT * FROM users WHERE id = ? AND is_admin = 1 AND is_active = 1'
      ).bind(userId).first<User>()
      
      if (!user) {
        return c.json({ success: false, error: '管理者権限が必要です' }, 403)
      }
      
      c.set('currentUser', user)
      await next()
    } catch (e) {
      return c.json({ success: false, error: '無効なトークンです' }, 401)
    }
  } catch (error: any) {
    return c.json({ success: false, error: '認証エラーが発生しました' }, 500)
  }
}

// Get all users (admin only)
app.get('/api/admin/users', requireAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, username, email, is_admin, is_active, created_at, last_login_at FROM users ORDER BY created_at DESC'
    ).all()
    
    return c.json({ success: true, users: results })
  } catch (error: any) {
    console.error('Get users error:', error)
    return c.json({ success: false, error: 'ユーザー一覧の取得に失敗しました' }, 500)
  }
})

// Create new user (admin only)
app.post('/api/admin/users', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { username, password, email, is_admin } = body
    
    // Validate input
    if (!username || !password) {
      return c.json({ success: false, error: 'ユーザー名とパスワードは必須です' }, 400)
    }
    
    if (username.length < 3) {
      return c.json({ success: false, error: 'ユーザー名は3文字以上である必要があります' }, 400)
    }
    
    if (password.length < 6) {
      return c.json({ success: false, error: 'パスワードは6文字以上である必要があります' }, 400)
    }
    
    // Check if username already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first()
    
    if (existingUser) {
      return c.json({ success: false, error: 'このユーザー名は既に使用されています' }, 400)
    }
    
    // Hash password
    const passwordHash = await hashPassword(password)
    
    // Insert user
    const result = await c.env.DB.prepare(
      'INSERT INTO users (username, password_hash, email, is_admin, is_active) VALUES (?, ?, ?, ?, 1)'
    ).bind(username, passwordHash, email || null, is_admin ? 1 : 0).run()
    
    return c.json({ 
      success: true, 
      message: 'ユーザーを作成しました',
      user_id: result.meta.last_row_id
    })
  } catch (error: any) {
    console.error('Create user error:', error)
    return c.json({ success: false, error: 'ユーザーの作成に失敗しました' }, 500)
  }
})

// Update user (admin only)
app.put('/api/admin/users/:id', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id')
    const body = await c.req.json()
    const { email, is_admin, is_active, password } = body
    
    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }
    
    // Update user fields
    if (password) {
      // Update password if provided
      if (password.length < 6) {
        return c.json({ success: false, error: 'パスワードは6文字以上である必要があります' }, 400)
      }
      const passwordHash = await hashPassword(password)
      await c.env.DB.prepare(
        'UPDATE users SET password_hash = ?, email = ?, is_admin = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(passwordHash, email || null, is_admin ? 1 : 0, is_active ? 1 : 0, userId).run()
    } else {
      // Update without changing password
      await c.env.DB.prepare(
        'UPDATE users SET email = ?, is_admin = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(email || null, is_admin ? 1 : 0, is_active ? 1 : 0, userId).run()
    }
    
    return c.json({ 
      success: true, 
      message: 'ユーザー情報を更新しました'
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    return c.json({ success: false, error: 'ユーザー情報の更新に失敗しました' }, 500)
  }
})

// Delete user (admin only)
app.delete('/api/admin/users/:id', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id')
    const currentUser = c.get('currentUser')
    
    // Prevent deleting self
    if (currentUser.id === parseInt(userId)) {
      return c.json({ success: false, error: '自分自身を削除することはできません' }, 400)
    }
    
    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }
    
    // Delete user
    await c.env.DB.prepare(
      'DELETE FROM users WHERE id = ?'
    ).bind(userId).run()
    
    return c.json({ 
      success: true, 
      message: 'ユーザーを削除しました'
    })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return c.json({ success: false, error: 'ユーザーの削除に失敗しました' }, 500)
  }
})

// ============================================
// Folder and Listening Test Management APIs
// ============================================

// Get all folders for current user
app.get('/api/folders', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const userId = parseInt(decoded.split(':')[1])
    
    const folders = await c.env.DB.prepare(
      'SELECT * FROM folders WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all()
    
    return c.json({ success: true, folders: folders.results })
  } catch (error: any) {
    console.error('Get folders error:', error)
    return c.json({ success: false, error: 'フォルダの取得に失敗しました' }, 500)
  }
})

// Create new folder
app.post('/api/folders', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const userId = parseInt(decoded.split(':')[1])
    
    const body = await c.req.json()
    const { name } = body
    
    if (!name || name.trim() === '') {
      return c.json({ success: false, error: 'フォルダ名を入力してください' }, 400)
    }
    
    const result = await c.env.DB.prepare(
      'INSERT INTO folders (name, user_id) VALUES (?, ?)'
    ).bind(name.trim(), userId).run()
    
    return c.json({ 
      success: true, 
      message: 'フォルダを作成しました',
      folder_id: result.meta.last_row_id
    })
  } catch (error: any) {
    console.error('Create folder error:', error)
    return c.json({ success: false, error: 'フォルダの作成に失敗しました' }, 500)
  }
})

// Update folder name
app.put('/api/folders/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const userId = parseInt(decoded.split(':')[1])
    
    const folderId = c.req.param('id')
    const body = await c.req.json()
    const { name } = body
    
    if (!name || name.trim() === '') {
      return c.json({ success: false, error: 'フォルダ名を入力してください' }, 400)
    }
    
    // Check if folder belongs to user
    const folder = await c.env.DB.prepare(
      'SELECT id FROM folders WHERE id = ? AND user_id = ?'
    ).bind(folderId, userId).first()
    
    if (!folder) {
      return c.json({ success: false, error: 'フォルダが見つかりません' }, 404)
    }
    
    await c.env.DB.prepare(
      'UPDATE folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(name.trim(), folderId).run()
    
    return c.json({ 
      success: true, 
      message: 'フォルダ名を変更しました'
    })
  } catch (error: any) {
    console.error('Update folder error:', error)
    return c.json({ success: false, error: 'フォルダ名の変更に失敗しました' }, 500)
  }
})

// Delete folder
app.delete('/api/folders/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const userId = parseInt(decoded.split(':')[1])
    
    const folderId = c.req.param('id')
    
    // Check if folder belongs to user
    const folder = await c.env.DB.prepare(
      'SELECT id FROM folders WHERE id = ? AND user_id = ?'
    ).bind(folderId, userId).first()
    
    if (!folder) {
      return c.json({ success: false, error: 'フォルダが見つかりません' }, 404)
    }
    
    // Delete folder (CASCADE will delete all tests in it)
    await c.env.DB.prepare(
      'DELETE FROM folders WHERE id = ?'
    ).bind(folderId).run()
    
    return c.json({ 
      success: true, 
      message: 'フォルダを削除しました'
    })
  } catch (error: any) {
    console.error('Delete folder error:', error)
    return c.json({ success: false, error: 'フォルダの削除に失敗しました' }, 500)
  }
})

// Get all tests in a folder
app.get('/api/folders/:id/tests', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const userId = parseInt(decoded.split(':')[1])
    
    const folderId = c.req.param('id')
    
    // Check if folder belongs to user
    const folder = await c.env.DB.prepare(
      'SELECT id, name FROM folders WHERE id = ? AND user_id = ?'
    ).bind(folderId, userId).first()
    
    if (!folder) {
      return c.json({ success: false, error: 'フォルダが見つかりません' }, 404)
    }
    
    // Get all tests in folder (without audio_data for performance)
    const tests = await c.env.DB.prepare(
      'SELECT id, title, topic, format, cefr_level, keywords, created_at FROM listening_tests WHERE folder_id = ? ORDER BY created_at DESC'
    ).bind(folderId).all()
    
    return c.json({ 
      success: true, 
      folder: folder,
      tests: tests.results 
    })
  } catch (error: any) {
    console.error('Get tests error:', error)
    return c.json({ success: false, error: 'テストの取得に失敗しました' }, 500)
  }
})

// Save listening test
app.post('/api/tests', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const userId = parseInt(decoded.split(':')[1])
    
    const body = await c.req.json()
    const { 
      folder_id, 
      title, 
      topic, 
      format, 
      cefr_level, 
      keywords, 
      script, 
      questions, 
      audio_settings, 
      audio_data 
    } = body
    
    if (!folder_id || !title || !script) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }
    
    // Check if folder belongs to user
    const folder = await c.env.DB.prepare(
      'SELECT id FROM folders WHERE id = ? AND user_id = ?'
    ).bind(folder_id, userId).first()
    
    if (!folder) {
      return c.json({ success: false, error: 'フォルダが見つかりません' }, 404)
    }
    
    // Generate audio URL
    const testId = Date.now() // Temporary ID, will be replaced
    const audio_url = `/api/tests/${testId}/audio`
    
    const result = await c.env.DB.prepare(
      `INSERT INTO listening_tests 
       (folder_id, title, topic, format, cefr_level, keywords, script, questions, audio_settings, audio_data, audio_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      folder_id, 
      title, 
      topic || '', 
      format || 'monologue', 
      cefr_level || 'B1', 
      keywords || '', 
      script, 
      JSON.stringify(questions || []), 
      JSON.stringify(audio_settings || {}), 
      audio_data || '', 
      audio_url
    ).run()
    
    const insertedId = result.meta.last_row_id
    
    // Update audio URL with actual ID
    await c.env.DB.prepare(
      'UPDATE listening_tests SET audio_url = ? WHERE id = ?'
    ).bind(`/api/tests/${insertedId}/audio`, insertedId).run()
    
    return c.json({ 
      success: true, 
      message: 'テストを保存しました',
      test_id: insertedId,
      audio_url: `/api/tests/${insertedId}/audio`
    })
  } catch (error: any) {
    console.error('Save test error:', error)
    return c.json({ success: false, error: 'テストの保存に失敗しました' }, 500)
  }
})

// Get listening test by ID
app.get('/api/tests/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const userId = parseInt(decoded.split(':')[1])
    
    const testId = c.req.param('id')
    
    // Get test and verify ownership through folder
    const test = await c.env.DB.prepare(
      `SELECT lt.*, f.user_id 
       FROM listening_tests lt 
       JOIN folders f ON lt.folder_id = f.id 
       WHERE lt.id = ? AND f.user_id = ?`
    ).bind(testId, userId).first()
    
    if (!test) {
      return c.json({ success: false, error: 'テストが見つかりません' }, 404)
    }
    
    // Parse JSON fields
    const testData: any = { ...test }
    testData.questions = JSON.parse(test.questions as string || '[]')
    testData.audio_settings = JSON.parse(test.audio_settings as string || '{}')
    delete testData.user_id // Don't expose user_id
    
    return c.json({ 
      success: true, 
      test: testData
    })
  } catch (error: any) {
    console.error('Get test error:', error)
    return c.json({ success: false, error: 'テストの取得に失敗しました' }, 500)
  }
})

// Get audio file for a test
app.get('/api/tests/:id/audio', async (c) => {
  try {
    const testId = c.req.param('id')
    
    // Get audio data (public access - no auth required for sharing)
    const test = await c.env.DB.prepare(
      'SELECT audio_data, title FROM listening_tests WHERE id = ?'
    ).bind(testId).first()
    
    if (!test || !test.audio_data) {
      return c.json({ success: false, error: '音声ファイルが見つかりません' }, 404)
    }
    
    // Decode base64 audio data
    const audioData = test.audio_data as string
    
    // Detect content type from data URL
    let contentType = 'audio/mpeg'
    if (audioData.startsWith('data:audio/wav')) {
      contentType = 'audio/wav'
    } else if (audioData.startsWith('data:audio/mpeg')) {
      contentType = 'audio/mpeg'
    } else if (audioData.startsWith('data:application/json')) {
      // This is a corrupted entry, return error
      return c.json({ success: false, error: '音声データが破損しています' }, 500)
    }
    
    const base64Data = audioData.replace(/^data:[^;]+;base64,/, '')
    const audioBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    
    // Return audio file for inline playback
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error: any) {
    console.error('Get audio error:', error)
    return c.json({ success: false, error: '音声ファイルの取得に失敗しました' }, 500)
  }
})

// Generate QR code for audio URL
app.get('/api/tests/:id/qr', async (c) => {
  try {
    const testId = c.req.param('id')
    
    // Verify test exists
    const test = await c.env.DB.prepare(
      'SELECT id, title FROM listening_tests WHERE id = ?'
    ).bind(testId).first()
    
    if (!test) {
      return c.json({ success: false, error: 'テストが見つかりません' }, 404)
    }
    
    // Get base URL from request
    const url = new URL(c.req.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const audioUrl = `${baseUrl}/api/tests/${testId}/audio`
    
    // Generate QR code using qrcode.js CDN API
    // We'll use Google Charts API as a fallback
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(audioUrl)}`
    
    return c.json({
      success: true,
      qr_code_url: qrCodeUrl,
      audio_url: audioUrl
    })
  } catch (error: any) {
    console.error('Generate QR error:', error)
    return c.json({ success: false, error: 'QRコードの生成に失敗しました' }, 500)
  }
})

// Delete listening test
app.delete('/api/tests/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const userId = parseInt(decoded.split(':')[1])
    
    const testId = c.req.param('id')
    
    // Verify ownership through folder
    const test = await c.env.DB.prepare(
      `SELECT lt.id 
       FROM listening_tests lt 
       JOIN folders f ON lt.folder_id = f.id 
       WHERE lt.id = ? AND f.user_id = ?`
    ).bind(testId, userId).first()
    
    if (!test) {
      return c.json({ success: false, error: 'テストが見つかりません' }, 404)
    }
    
    // Delete test
    await c.env.DB.prepare(
      'DELETE FROM listening_tests WHERE id = ?'
    ).bind(testId).run()
    
    return c.json({ 
      success: true, 
      message: 'テストを削除しました'
    })
  } catch (error: any) {
    console.error('Delete test error:', error)
    return c.json({ success: false, error: 'テストの削除に失敗しました' }, 500)
  }
})

export default app
