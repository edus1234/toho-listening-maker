// State management
let currentState = {
  screen: 'login', // 'login', 'input', 'questionSettings', 'review', 'audioSettings'
  isAuthenticated: false,
  authToken: null,
  formData: {
    format: 'monologue',
    topic: '',
    keywords: '',
    cefrLevel: 'B1',
    otherConditions: '',
    createQuestions: false,
    questionSettings: 'long', // 'long' or 'short'
    numSpeakers: 2, // Number of speakers for dialogue
    speakerNationalities: ['US', 'UK'] // Nationalities for each speaker
  },
  generatedScript: '',
  generatedQuestions: [],
  speakers: [], // Array of speaker objects with name, accent, speed
  audioSegments: null // Array of {speaker, audio} objects
};

// Initialize app
function init() {
  // Check if token exists in localStorage
  const token = localStorage.getItem('authToken');
  if (token) {
    // Verify token
    verifyToken(token);
  } else {
    renderScreen();
  }
  
  // Setup logout button
  setupLogoutButton();
}

// Setup logout button
function setupLogoutButton() {
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      if (confirm('ログアウトしますか？')) {
        // Clear token
        localStorage.removeItem('authToken');
        
        // Reset state
        currentState.isAuthenticated = false;
        currentState.authToken = null;
        currentState.screen = 'login';
        
        // Hide logout button
        logoutButton.classList.add('hidden');
        
        // Render login screen
        renderScreen();
      }
    });
  }
}

// Verify token with backend
async function verifyToken(token) {
  try {
    const response = await axios.post('/api/verify-token', { token });
    if (response.data.valid) {
      currentState.isAuthenticated = true;
      currentState.authToken = token;
      currentState.screen = 'input';
      showLogoutButton();
      renderScreen();
    } else {
      localStorage.removeItem('authToken');
      currentState.screen = 'login';
      hideLogoutButton();
      renderScreen();
    }
  } catch (error) {
    localStorage.removeItem('authToken');
    currentState.screen = 'login';
    hideLogoutButton();
    renderScreen();
  }
}

// Show logout button
function showLogoutButton() {
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.classList.remove('hidden');
  }
}

// Hide logout button
function hideLogoutButton() {
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.classList.add('hidden');
  }
}

// Render current screen
function renderScreen() {
  const appContainer = document.getElementById('app');
  
  switch(currentState.screen) {
    case 'login':
      appContainer.innerHTML = renderLoginScreen();
      attachLoginScreenListeners();
      break;
    case 'input':
      appContainer.innerHTML = renderInputScreen();
      attachInputScreenListeners();
      break;
    case 'audioSettings':
      appContainer.innerHTML = renderAudioSettingsScreen();
      attachAudioSettingsListeners();
      break;
    case 'questionSettings':
      appContainer.innerHTML = renderQuestionSettingsScreen();
      attachQuestionSettingsListeners();
      break;
    case 'review':
      appContainer.innerHTML = renderReviewScreen();
      attachReviewScreenListeners();
      break;
  }
}

// Render login screen
function renderLoginScreen() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 -m-8">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md fade-in">
        <div class="text-center mb-8">
          <div class="inline-block bg-indigo-600 rounded-full p-4 mb-4">
            <i class="fas fa-headphones text-white text-4xl"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            リスニングテスト自動作成システム
          </h1>
          <p class="text-gray-600 text-sm">
            ログインしてご利用ください
          </p>
        </div>
        
        <form id="loginForm" class="space-y-6">
          <!-- Username -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-user mr-2"></i>ユーザー名
            </label>
            <input type="text" id="username" name="username" 
                   required
                   autocomplete="username"
                   placeholder="ユーザー名を入力"
                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
          </div>
          
          <!-- Password -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-lock mr-2"></i>パスワード
            </label>
            <input type="password" id="password" name="password" 
                   required
                   autocomplete="current-password"
                   placeholder="パスワードを入力"
                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
          </div>
          
          <!-- Error message -->
          <div id="loginError" class="hidden bg-red-50 border-2 border-red-200 rounded-lg p-3">
            <p class="text-red-800 text-sm flex items-center">
              <i class="fas fa-exclamation-circle mr-2"></i>
              <span id="loginErrorMessage"></span>
            </p>
          </div>
          
          <!-- Login button -->
          <button type="submit" id="loginButton"
                  class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            <i class="fas fa-sign-in-alt mr-2"></i>ログイン
          </button>
        </form>
        
        <!-- Demo credentials info (remove in production) -->
        <div class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p class="text-xs text-gray-600 text-center">
            <i class="fas fa-info-circle mr-1"></i>
            デモ用ログイン情報<br>
            <span class="font-mono">ユーザー名: admin / パスワード: listening2024</span>
          </p>
        </div>
      </div>
    </div>
  `;
}

// Attach listeners for login screen
function attachLoginScreenListeners() {
  const form = document.getElementById('loginForm');
  const loginButton = document.getElementById('loginButton');
  const loginError = document.getElementById('loginError');
  const loginErrorMessage = document.getElementById('loginErrorMessage');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Hide error
    loginError.classList.add('hidden');
    
    // Show loading
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>ログイン中...';
    
    try {
      const response = await axios.post('/api/login', {
        username,
        password
      });
      
      if (response.data.success) {
        // Save token to localStorage
        localStorage.setItem('authToken', response.data.token);
        
        // Update state
        currentState.isAuthenticated = true;
        currentState.authToken = response.data.token;
        currentState.screen = 'input';
        
        // Show logout button
        showLogoutButton();
        
        // Render main app
        renderScreen();
      } else {
        // Show error
        loginErrorMessage.textContent = response.data.error || 'ログインに失敗しました';
        loginError.classList.remove('hidden');
      }
    } catch (error) {
      // Show error
      loginErrorMessage.textContent = error.response?.data?.error || 'ログイン処理中にエラーが発生しました';
      loginError.classList.remove('hidden');
    } finally {
      // Restore button
      loginButton.disabled = false;
      loginButton.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>ログイン';
    }
  });
}

// Render nationality selectors
function renderNationalitySelectors(numSpeakers, nationalities) {
  const nationalityOptions = [
    { value: 'US', label: 'アメリカ' },
    { value: 'UK', label: 'イギリス' },
    { value: 'Australian', label: 'オーストラリア' },
    { value: 'Canadian', label: 'カナダ' },
    { value: 'Indian', label: 'インド' },
    { value: 'Irish', label: 'アイルランド' },
    { value: 'Scottish', label: 'スコットランド' },
    { value: 'South African', label: '南アフリカ' },
    { value: 'New Zealand', label: 'ニュージーランド' },
    { value: 'Singapore', label: 'シンガポール' }
  ];
  
  let html = '';
  for (let i = 0; i < numSpeakers; i++) {
    const selectedNationality = nationalities[i] || nationalityOptions[i % nationalityOptions.length].value;
    html += `
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-700 w-20">話者${i + 1}:</label>
        <select name="nationality_${i}" class="nationality-select flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          ${nationalityOptions.map(opt => `
            <option value="${opt.value}" ${selectedNationality === opt.value ? 'selected' : ''}>${opt.label}</option>
          `).join('')}
        </select>
      </div>
    `;
  }
  return html;
}

// Render input screen (メイン入力画面)
function renderInputScreen() {
  return `
    <div class="bg-white rounded-lg shadow-lg p-6 fade-in">
      <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <i class="fas fa-edit mr-3 text-indigo-600"></i>
        リスニングスクリプト設定
      </h2>
      
      <!-- Path selection: AI generation or paste script -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border-2 border-indigo-200 rounded-lg p-6 bg-gradient-to-br from-indigo-50 to-white hover:shadow-lg transition cursor-pointer" id="pathAiGeneration">
          <div class="text-center">
            <i class="fas fa-robot text-4xl text-indigo-600 mb-3"></i>
            <h3 class="font-bold text-lg text-gray-800 mb-2">AIでスクリプト生成</h3>
            <p class="text-sm text-gray-600">条件を指定してAIが自動生成します</p>
          </div>
        </div>
        <div class="border-2 border-green-200 rounded-lg p-6 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition cursor-pointer" id="pathPasteScript">
          <div class="text-center">
            <i class="fas fa-paste text-4xl text-green-600 mb-3"></i>
            <h3 class="font-bold text-lg text-gray-800 mb-2">原稿を貼り付け</h3>
            <p class="text-sm text-gray-600">すでにお持ちの原稿から音声作成</p>
          </div>
        </div>
      </div>
      
      <!-- AI Generation Form (hidden initially after selection) -->
      <form id="scriptForm" class="space-y-6" style="display: none;">
        <!-- 形式 -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-microphone mr-2"></i>形式
          </label>
          <div class="flex gap-4">
            <label class="flex items-center cursor-pointer">
              <input type="radio" name="format" value="monologue" checked 
                     class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
              <span class="ml-2 text-gray-700">モノローグ（1人）</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input type="radio" name="format" value="dialogue" 
                     class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
              <span class="ml-2 text-gray-700">ダイアローグ（複数人）</span>
            </label>
          </div>
        </div>

        <!-- トピック -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-comment mr-2"></i>トピック
          </label>
          <input type="text" name="topic" 
                 placeholder="例: 環境問題、テクノロジー、教育など"
                 value="${currentState.formData.topic}"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
        </div>

        <!-- 含めるべき単語 -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-key mr-2"></i>含めるべき単語
          </label>
          <input type="text" name="keywords" 
                 placeholder="例: global warming, climate change（カンマ区切り）"
                 value="${currentState.formData.keywords}"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          <p class="text-xs text-gray-500 mt-1">複数の単語はカンマで区切って入力してください</p>
        </div>

        <!-- CEFRレベル -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-layer-group mr-2"></i>CEFRレベル
          </label>
          <select name="cefrLevel" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="A1" ${currentState.formData.cefrLevel === 'A1' ? 'selected' : ''}>A1 (初級)</option>
            <option value="A2" ${currentState.formData.cefrLevel === 'A2' ? 'selected' : ''}>A2 (初級上)</option>
            <option value="B1" ${currentState.formData.cefrLevel === 'B1' ? 'selected' : ''}>B1 (中級)</option>
            <option value="B2" ${currentState.formData.cefrLevel === 'B2' ? 'selected' : ''}>B2 (中級上)</option>
            <option value="C1" ${currentState.formData.cefrLevel === 'C1' ? 'selected' : ''}>C1 (上級)</option>
            <option value="C2" ${currentState.formData.cefrLevel === 'C2' ? 'selected' : ''}>C2 (最上級)</option>
          </select>
        </div>

        <!-- 対話の人数設定 (ダイアログの場合のみ表示) -->
        <div id="dialogueSettings" style="display: ${currentState.formData.format === 'dialogue' ? 'block' : 'none'}">
          <div class="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-users mr-2 text-indigo-600"></i>対話設定
            </h3>
            
            <!-- 対話の人数 -->
            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-user-friends mr-2"></i>対話の人数
              </label>
              <select name="numSpeakers" id="numSpeakersSelect"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="2" ${currentState.formData.numSpeakers === 2 ? 'selected' : ''}>2人</option>
                <option value="3" ${currentState.formData.numSpeakers === 3 ? 'selected' : ''}>3人</option>
                <option value="4" ${currentState.formData.numSpeakers === 4 ? 'selected' : ''}>4人</option>
                <option value="5" ${currentState.formData.numSpeakers === 5 ? 'selected' : ''}>5人</option>
              </select>
            </div>
            
            <!-- 各話者の国籍 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-globe mr-2"></i>各話者の国籍
              </label>
              <div id="nationalitySelectors" class="space-y-2">
                ${renderNationalitySelectors(currentState.formData.numSpeakers, currentState.formData.speakerNationalities)}
              </div>
            </div>
          </div>
        </div>

        <!-- その他条件 -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-clipboard-list mr-2"></i>その他条件
          </label>
          <textarea name="otherConditions" rows="3"
                    placeholder="例: カジュアルな会話、ビジネスシーンなど"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">${currentState.formData.otherConditions}</textarea>
        </div>

        <!-- 問題作成チェックボックス -->
        <div class="border-t pt-6">
          <label class="flex items-center cursor-pointer bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition">
            <input type="checkbox" name="createQuestions" 
                   ${currentState.formData.createQuestions ? 'checked' : ''}
                   class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500">
            <span class="ml-3 text-gray-800 font-semibold">
              <i class="fas fa-question-circle mr-2"></i>併せてリスニング問題も作成する
            </span>
          </label>
        </div>

        <!-- 次へボタン -->
        <div class="flex gap-4">
          <button type="submit" 
                  class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md">
            <i class="fas fa-arrow-right mr-2"></i>次へ進む
          </button>
        </div>
      </form>
      
      <!-- Paste Script Form (hidden initially) -->
      <div id="pasteScriptForm" class="space-y-6" style="display: none;">
        <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
          <p class="text-sm text-green-800 flex items-center">
            <i class="fas fa-info-circle mr-2"></i>
            原稿を貼り付けて、直接音声作成に進みます
          </p>
        </div>
        
        <!-- Script textarea -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-file-alt mr-2"></i>リスニングスクリプト原稿
          </label>
          <textarea id="pastedScript" rows="12"
                    placeholder="ここに原稿を貼り付けてください。&#10;&#10;例：&#10;Alice: Good morning, Bob!&#10;Bob: Hi Alice, how are you?&#10;Alice: I'm doing great, thanks!&#10;&#10;※話者名がある場合は「話者名:」の形式で記載してください"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"></textarea>
          <p class="text-xs text-gray-500 mt-2">
            <i class="fas fa-lightbulb mr-1"></i>
            話者名がある場合は自動検出します（例：Alice: こんにちは）
          </p>
        </div>
        
        <!-- Action buttons -->
        <div class="flex gap-4">
          <button type="button" id="backToPathSelection"
                  class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
            <i class="fas fa-arrow-left mr-2"></i>戻る
          </button>
          <button type="button" id="proceedToAudioSettings"
                  class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md">
            <i class="fas fa-volume-up mr-2"></i>音声作成画面へ
          </button>
        </div>
      </div>
    </div>
  `;
}

// Attach listeners for input screen
function attachInputScreenListeners() {
  const form = document.getElementById('scriptForm');
  const pasteScriptForm = document.getElementById('pasteScriptForm');
  const pathAiGeneration = document.getElementById('pathAiGeneration');
  const pathPasteScript = document.getElementById('pathPasteScript');
  const backToPathSelection = document.getElementById('backToPathSelection');
  const proceedToAudioSettings = document.getElementById('proceedToAudioSettings');
  const formatRadios = document.querySelectorAll('input[name="format"]');
  const numSpeakersSelect = document.getElementById('numSpeakersSelect');
  const dialogueSettings = document.getElementById('dialogueSettings');
  
  // Path selection: AI Generation
  pathAiGeneration.addEventListener('click', () => {
    pathAiGeneration.parentElement.style.display = 'none';
    form.style.display = 'block';
  });
  
  // Path selection: Paste Script
  pathPasteScript.addEventListener('click', () => {
    pathAiGeneration.parentElement.style.display = 'none';
    pasteScriptForm.style.display = 'block';
  });
  
  // Back to path selection
  backToPathSelection.addEventListener('click', () => {
    pathAiGeneration.parentElement.style.display = 'grid';
    pasteScriptForm.style.display = 'none';
    form.style.display = 'none';
  });
  
  // Proceed to audio settings with pasted script
  proceedToAudioSettings.addEventListener('click', () => {
    const pastedScript = document.getElementById('pastedScript').value.trim();
    
    if (!pastedScript) {
      alert('原稿を入力してください');
      return;
    }
    
    // Parse the script and detect speakers
    currentState.generatedScript = pastedScript;
    
    // Parse script into lines and detect speakers
    const lines = pastedScript.split('\n').filter(line => line.trim());
    const speakerPattern = /^([A-Za-z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+)[:：]\s*(.+)$/;
    const detectedSpeakers = new Set();
    
    currentState.parsedLines = lines.map(line => {
      const match = line.match(speakerPattern);
      if (match) {
        const speaker = match[1].trim();
        const text = match[2].trim();
        detectedSpeakers.add(speaker);
        return { speaker, text, pauseAfter: 1.0, voiceInstructions: '', ssmlInstructions: '' };
      } else {
        return { speaker: 'Narrator', text: line.trim(), pauseAfter: 1.0, voiceInstructions: '', ssmlInstructions: '' };
      }
    });
    
    // Create speaker objects for detected speakers
    const speakerNames = Array.from(detectedSpeakers);
    if (speakerNames.length === 0) {
      speakerNames.push('Narrator');
    }
    
    currentState.speakers = speakerNames.map((name, index) => ({
      name: name,
      accent: ['US', 'UK', 'Australian', 'Canadian', 'Indian'][index % 5],
      gender: index % 2 === 0 ? 'FEMALE' : 'MALE',
      speed: 1.0
    }));
    
    // Move to audio settings screen
    currentState.screen = 'audioSettings';
    renderScreen();
  });
  
  // Toggle dialogue settings visibility based on format
  formatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'dialogue') {
        dialogueSettings.style.display = 'block';
      } else {
        dialogueSettings.style.display = 'none';
      }
    });
  });
  
  // Update nationality selectors when number of speakers changes
  if (numSpeakersSelect) {
    numSpeakersSelect.addEventListener('change', (e) => {
      const numSpeakers = parseInt(e.target.value);
      const nationalitySelectors = document.getElementById('nationalitySelectors');
      nationalitySelectors.innerHTML = renderNationalitySelectors(numSpeakers, currentState.formData.speakerNationalities);
    });
  }
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const format = formData.get('format');
    
    // Get speaker nationalities
    const numSpeakers = parseInt(formData.get('numSpeakers') || 2);
    const speakerNationalities = [];
    if (format === 'dialogue') {
      for (let i = 0; i < numSpeakers; i++) {
        speakerNationalities.push(formData.get(`nationality_${i}`) || 'US');
      }
    }
    
    currentState.formData = {
      format: format,
      topic: formData.get('topic'),
      keywords: formData.get('keywords'),
      cefrLevel: formData.get('cefrLevel'),
      otherConditions: formData.get('otherConditions'),
      createQuestions: formData.get('createQuestions') === 'on',
      questionSettings: currentState.formData.questionSettings,
      numSpeakers: numSpeakers,
      speakerNationalities: speakerNationalities
    };
    
    // Validation
    if (!currentState.formData.topic.trim()) {
      alert('トピックを入力してください');
      return;
    }
    
    // Navigate to next screen
    if (currentState.formData.createQuestions) {
      currentState.screen = 'questionSettings';
    } else {
      // Generate script directly
      generateScript();
    }
    
    renderScreen();
  });
}

// Render question settings screen
function renderQuestionSettingsScreen() {
  return `
    <div class="bg-white rounded-lg shadow-lg p-6 fade-in">
      <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <i class="fas fa-cog mr-3 text-indigo-600"></i>
        リスニング問題設定
      </h2>
      
      <form id="questionSettingsForm" class="space-y-6">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-4">
            問題の種類を選択してください
          </label>
          
          <div class="space-y-3">
            <label class="flex items-start cursor-pointer border-2 border-gray-200 p-4 rounded-lg hover:border-indigo-500 transition">
              <input type="radio" name="questionSettings" value="long" checked
                     class="w-5 h-5 text-indigo-600 mt-1 focus:ring-indigo-500">
              <div class="ml-3">
                <div class="font-semibold text-gray-800">長め + 問題2-3題</div>
                <div class="text-sm text-gray-600 mt-1">より詳細な内容のスクリプトと、複数の理解度確認問題を作成します</div>
              </div>
            </label>
            
            <label class="flex items-start cursor-pointer border-2 border-gray-200 p-4 rounded-lg hover:border-indigo-500 transition">
              <input type="radio" name="questionSettings" value="short"
                     class="w-5 h-5 text-indigo-600 mt-1 focus:ring-indigo-500">
              <div class="ml-3">
                <div class="font-semibold text-gray-800">短め + 問題1題</div>
                <div class="text-sm text-gray-600 mt-1">コンパクトなスクリプトと、基本的な理解度確認問題を1題作成します</div>
              </div>
            </label>
          </div>
        </div>

        <div class="flex gap-4 border-t pt-6">
          <button type="button" id="backButton"
                  class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
            <i class="fas fa-arrow-left mr-2"></i>戻る
          </button>
          <button type="submit"
                  class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md">
            <i class="fas fa-magic mr-2"></i>スクリプトを生成
          </button>
        </div>
      </form>
    </div>
  `;
}

// Attach listeners for question settings screen
function attachQuestionSettingsListeners() {
  const form = document.getElementById('questionSettingsForm');
  const backButton = document.getElementById('backButton');
  
  backButton.addEventListener('click', () => {
    currentState.screen = 'input';
    renderScreen();
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    currentState.formData.questionSettings = formData.get('questionSettings');
    
    // Generate script
    generateScript();
  });
}

// Character name pools for dialogue generation
const characterNames = {
  male: ['Alex', 'Ben', 'Chris', 'David', 'Eric', 'Frank', 'George', 'Henry', 'Ian', 'Jack', 'Kevin', 'Luke', 'Mark', 'Nathan', 'Oliver', 'Paul', 'Ryan', 'Sam', 'Tom', 'Victor'],
  female: ['Alice', 'Betty', 'Carol', 'Diana', 'Emma', 'Fiona', 'Grace', 'Hannah', 'Iris', 'Julia', 'Kate', 'Laura', 'Mary', 'Nancy', 'Olivia', 'Patricia', 'Rachel', 'Sarah', 'Tina', 'Victoria'],
  neutral: ['Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Skylar', 'Cameron', 'Drew']
};

// Generate random character names
function generateCharacterNames(count) {
  const allNames = [...characterNames.male, ...characterNames.female, ...characterNames.neutral];
  const shuffled = allNames.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Generate script with OpenAI API
async function generateScript() {
  // Show loading
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-12 text-center fade-in">
      <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">AIがスクリプトを生成中...</h2>
      <p class="text-gray-600" id="generation-status">GPT-4o mini を使用しています...</p>
    </div>
  `;
  
  const numQuestions = currentState.formData.questionSettings === 'long' ? 3 : 1;
  const isLong = currentState.formData.questionSettings === 'long';
  const numSpeakers = currentState.formData.numSpeakers || 2;
  const speakerNationalities = currentState.formData.speakerNationalities || ['US', 'UK'];
  
  try {
    // Call OpenAI API for script generation
    const scriptResponse = await axios.post('/api/generate-script-ai', {
      format: currentState.formData.format,
      topic: currentState.formData.topic || 'environmental issues',
      keywords: currentState.formData.keywords || 'climate change, global warming',
      cefrLevel: currentState.formData.cefrLevel || 'B1',
      otherConditions: currentState.formData.otherConditions || '',
      numSpeakers: numSpeakers,
      speakerNationalities: speakerNationalities,
      isLong: isLong
    });
    
    if (!scriptResponse.data.success) {
      alert('スクリプト生成エラー: ' + scriptResponse.data.error);
      currentState.screen = 'input';
      renderScreen();
      return;
    }
    
    currentState.generatedScript = scriptResponse.data.script;
    
    // Extract speaker names from generated script
    const speakerMatches = currentState.generatedScript.match(/^([A-Za-z]+):/gm);
    if (speakerMatches && speakerMatches.length > 0) {
      const uniqueSpeakers = [...new Set(speakerMatches.map(m => m.replace(':', '').trim()))];
      currentState.speakers = uniqueSpeakers.map((name, i) => ({
        name: name,
        accent: speakerNationalities[i] || 'US',
        speed: 1.0,
        gender: 'male'
      }));
    } else if (currentState.formData.format === 'monologue') {
      // For monologue, extract speaker name from [Name] format
      const nameMatch = currentState.generatedScript.match(/^\[([A-Za-z]+)\]/);
      if (nameMatch) {
        currentState.speakers = [{
          name: nameMatch[1],
          accent: 'US',
          speed: 1.0,
          gender: 'male'
        }];
      }
    }
    
    console.log(`✅ スクリプト生成完了 - トークン: ${scriptResponse.data.tokensUsed}, コスト: $${scriptResponse.data.estimatedCost}`);
    
    // Generate questions if requested
    if (currentState.formData.createQuestions) {
      document.getElementById('generation-status').textContent = '問題を生成中...';
      
      const questionsResponse = await axios.post('/api/generate-questions-ai', {
        script: currentState.generatedScript,
        topic: currentState.formData.topic,
        cefrLevel: currentState.formData.cefrLevel || 'B1',
        numQuestions: numQuestions
      });
      
      if (questionsResponse.data.success) {
        currentState.generatedQuestions = questionsResponse.data.questions;
        console.log(`✅ 問題生成完了 - トークン: ${questionsResponse.data.tokensUsed}, コスト: $${questionsResponse.data.estimatedCost}`);
      } else {
        console.warn('問題生成に失敗しました:', questionsResponse.data.error);
        // Fall back to mock questions
        currentState.generatedQuestions = [];
        for (let i = 1; i <= numQuestions; i++) {
          currentState.generatedQuestions.push({
            question: `Question ${i}: What is the main topic discussed in the listening?`,
            options: ['A) Environmental issues', 'B) Technology advancements', 'C) Education reform', 'D) Sports events'],
            correctAnswer: 'A'
          });
        }
      }
    } else {
      currentState.generatedQuestions = [];
    }
    
    // Move to review screen
    currentState.screen = 'review';
    renderScreen();
    
  } catch (error) {
    console.error('Generation error:', error);
    alert('生成中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
    currentState.screen = 'input';
    renderScreen();
  }
}

// Legacy mock generation function (kept for fallback)
async function generateScriptMock() {
  const numQuestions = currentState.formData.questionSettings === 'long' ? 3 : 1;
  const isLong = currentState.formData.questionSettings === 'long';
  const topic = 'environmental issues';
  const keywords = 'climate change, global warming';
  const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
  const numSpeakers = currentState.formData.numSpeakers || 2;
  const speakerNationalities = currentState.formData.speakerNationalities || ['US', 'UK'];
  
  console.log('Number of speakers:', numSpeakers);
  console.log('Speaker nationalities:', speakerNationalities);
  
  if (currentState.formData.format === 'monologue') {
    // Generate monologue
    const speakerName = generateCharacterNames(1)[0];
    
    // Store speaker info
    currentState.speakers = [{
      name: speakerName,
      accent: 'US',
      speed: 1.0
    }];
    
    if (isLong) {
      currentState.generatedScript = `[${speakerName}]

Good morning, everyone. Today, I'd like to talk about ${topic}.

This is a topic that has become increasingly important in recent years. ${keywordArray.length > 0 ? 'Terms like ' + keywordArray.join(', ') + ' are now part of our everyday vocabulary.' : 'We hear about it in the news almost every day.'}

Let me share some key points about this subject. First, we need to understand the scope of the issue. It affects not just our generation, but future generations as well. Second, there are concrete steps we can all take to make a difference. Small actions, when multiplied by millions of people, can have a significant impact.

In conclusion, this is a challenge that requires action from all of us. Whether it's through changing our daily habits, supporting relevant policies, or spreading awareness, everyone has a role to play.

Thank you for your attention, and I hope you'll think about what you can do to help address this important issue.`;
    } else {
      currentState.generatedScript = `[${speakerName}]

Hello, everyone. Today I want to briefly discuss ${topic}.

${keywordArray.length > 0 ? 'You may have heard terms like ' + keywordArray[0] + ' in the news.' : 'This is something that affects all of us.'} It's an important issue that we should all be aware of.

We all need to think about what we can do to make a positive impact. Every small action counts.

Thank you for listening.`;
    }
  } else {
    // Generate dialogue with character names
    const names = generateCharacterNames(numSpeakers);
    
    // Store speaker info with selected nationalities
    currentState.speakers = names.map((name, i) => ({
      name: name,
      accent: speakerNationalities[i] || 'US',
      speed: 1.0
    }));
    
    if (isLong) {
      if (numSpeakers >= 3) {
        // 3+ speakers conversation
        currentState.generatedScript = `[Conversation between ${names[0]}, ${names[1]}, and ${names[2]}]

${names[0]}: Hey guys, have you been following the news about ${topic} lately?

${names[1]}: Yeah, I have actually. It's quite concerning, isn't it?

${names[2]}: Absolutely. I was just reading an article about ${keywordArray[0] || 'the recent developments'}. It seems like things are getting more serious.

${names[0]}: That's exactly what worries me. What do you think we can do about it?

${names[1]}: Well, I think education is key. If more people understand the issue, they'll be more likely to take action.

${names[2]}: I agree. But we also need to look at practical solutions. ${keywordArray.length > 1 ? 'Issues like ' + keywordArray[1] + ' need immediate attention.' : 'We can\'t just talk about it - we need to act.'}

${names[0]}: You're both right. Maybe we could start a campus initiative or something?

${names[1]}: That's a great idea! We could organize awareness events and workshops.

${names[2]}: Count me in. If we work together, we can definitely make a difference.

${names[0]}: Excellent. Let's meet next week to plan this out properly.`;
      } else {
        // 2 speakers conversation
        currentState.generatedScript = `[Conversation between ${names[0]} and ${names[1]}]

${names[0]}: Hi ${names[1]}, have you heard about the recent developments in ${topic}?

${names[1]}: Yes, I have. It's been all over the news. ${keywordArray.length > 0 ? 'They keep talking about ' + keywordArray[0] + '.' : 'It\'s quite a serious matter.'}

${names[0]}: I think we need to pay more attention to this issue.

${names[1]}: I completely agree. What do you think we can do to help?

${names[0]}: Well, I've been researching some practical steps we can take. ${keywordArray.length > 1 ? 'For instance, addressing ' + keywordArray[1] + ' is something we can start with.' : 'There are several things we can do in our daily lives.'}

${names[1]}: That sounds promising. Maybe we could work together on this?

${names[0]}: Definitely. Two heads are better than one. Let's meet up and discuss our options.

${names[1]}: Great idea. I'm looking forward to it.`;
      }
    } else {
      // Short dialogue
      if (numSpeakers >= 3) {
        // 3+ speakers short conversation
        currentState.generatedScript = `[Conversation between ${names[0]}, ${names[1]}, and ${names[2]}]

${names[0]}: Did you hear about ${topic}?

${names[1]}: Yeah, it's quite serious. ${keywordArray.length > 0 ? 'Especially the part about ' + keywordArray[0] + '.' : 'We should pay attention to it.'}

${names[2]}: I think we all need to do something about it.

${names[0]}: Agreed. Let's discuss this more later.

${names[1]}: Sounds good to me.`;
      } else {
        // 2 speakers short conversation
        currentState.generatedScript = `[Conversation between ${names[0]} and ${names[1]}]

${names[0]}: Hey ${names[1]}, what do you think about ${topic}?

${names[1]}: ${keywordArray.length > 0 ? 'I\'ve been reading about ' + keywordArray[0] + '.' : 'It\'s definitely something important.'} It affects all of us.

${names[0]}: You're right. We should probably learn more about it.

${names[1]}: Definitely. Let's look into it together.`;
      }
    }
  }
  
  // Mock questions
  if (currentState.formData.createQuestions) {
    currentState.generatedQuestions = [];
    for (let i = 1; i <= numQuestions; i++) {
      currentState.generatedQuestions.push({
        question: `Question ${i}: What is the main topic discussed in the listening?`,
        options: [`A) ${topic}`, 'B) Technology advancements', 'C) Education reform', 'D) Sports events'],
        correctAnswer: 'A'
      });
    }
  }
  
  // Move to review screen
  currentState.screen = 'review';
  renderScreen();
}

// Render review screen
function renderReviewScreen() {
  const questionsHTML = currentState.generatedQuestions.length > 0 ? `
    <div class="bg-white rounded-lg shadow-lg p-6 mt-6 fade-in">
      <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <i class="fas fa-question-circle mr-3 text-indigo-600"></i>
        生成された問題
      </h2>
      <div class="space-y-6">
        ${currentState.generatedQuestions.map((q, i) => `
          <div class="border-l-4 border-indigo-500 pl-4">
            <h3 class="font-semibold text-gray-800 mb-2">${q.question}</h3>
            <div class="space-y-1 text-gray-700">
              ${q.options.map(opt => `<div>${opt}</div>`).join('')}
            </div>
            <p class="text-sm text-green-600 mt-2"><i class="fas fa-check mr-1"></i>正解: ${q.correctAnswer}</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  return `
    <div class="bg-white rounded-lg shadow-lg p-6 fade-in">
      <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <i class="fas fa-file-alt mr-3 text-indigo-600"></i>
        生成されたスクリプト
      </h2>
      
      <div class="mb-6">
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <textarea id="scriptEditor" rows="12"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">${currentState.generatedScript}</textarea>
        </div>
        <div class="mt-3 flex items-center gap-3">
          <button id="addNarrationButton" type="button"
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
            <i class="fas fa-book-open mr-2"></i>ナレーション追加
          </button>
          <p class="text-sm text-gray-600">
            <i class="fas fa-info-circle mr-1"></i>ナレーションは [Narration: テキスト] の形式で追加できます（英語・日本語対応）
          </p>
        </div>
      </div>

      <div class="flex gap-4">
        <button id="backToInputButton"
                class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
          <i class="fas fa-arrow-left mr-2"></i>最初から作成
        </button>
        <button id="regenerateButton"
                class="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition">
          <i class="fas fa-redo mr-2"></i>再生成
        </button>
        <button id="generateAudioButton"
                class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md">
          <i class="fas fa-volume-up mr-2"></i>音声生成
        </button>
      </div>
    </div>

    ${questionsHTML}
  `;
}

// Attach listeners for review screen
function attachReviewScreenListeners() {
  const backToInputButton = document.getElementById('backToInputButton');
  const regenerateButton = document.getElementById('regenerateButton');
  const generateAudioButton = document.getElementById('generateAudioButton');
  const scriptEditor = document.getElementById('scriptEditor');
  const addNarrationButton = document.getElementById('addNarrationButton');
  
  // Update script when edited
  scriptEditor.addEventListener('input', (e) => {
    currentState.generatedScript = e.target.value;
  });
  
  // Add narration (at the beginning)
  addNarrationButton.addEventListener('click', () => {
    const narrationText = prompt('ナレーションテキストを入力してください（英語または日本語）:', '');
    if (narrationText && narrationText.trim()) {
      const currentScript = scriptEditor.value;
      const newScript = '[Narration: ' + narrationText.trim() + ']\n\n' + currentScript;
      scriptEditor.value = newScript;
      currentState.generatedScript = newScript;
    }
  });
  
  backToInputButton.addEventListener('click', () => {
    currentState.screen = 'input';
    currentState.generatedScript = '';
    currentState.generatedQuestions = [];
    renderScreen();
  });
  
  regenerateButton.addEventListener('click', () => {
    generateScript();
  });
  
  generateAudioButton.addEventListener('click', () => {
    // Parse script to prepare for detailed settings
    const lines = parseScriptForSettings(currentState.generatedScript);
    currentState.parsedLines = lines;
    currentState.screen = 'audioSettings';
    renderScreen();
  });
}

// Parse script for detailed settings
function parseScriptForSettings(script) {
  const lines = [];
  const scriptLines = script.split('\n').filter(line => line.trim());
  
  for (const line of scriptLines) {
    // Match narration
    const narrationMatch = line.match(/^\[Narration:\s*(.+)\]$/i);
    if (narrationMatch) {
      lines.push({ 
        type: 'narration', 
        speaker: 'Narration', 
        text: narrationMatch[1].trim(),
        pauseAfter: 1.0 
      });
      continue;
    }
    
    // Match dialogue: "Speaker: text"
    const dialogueMatch = line.match(/^([A-Za-z]+):\s*(.+)$/);
    if (dialogueMatch) {
      lines.push({ 
        type: 'dialogue', 
        speaker: dialogueMatch[1].trim(), 
        text: dialogueMatch[2].trim(),
        pauseAfter: 0.5 
      });
      continue;
    }
    
    // Continue previous line if no match and not a header
    if (!line.startsWith('[') && lines.length > 0 && lines[lines.length - 1].type !== 'narration') {
      lines[lines.length - 1].text += ' ' + line.trim();
    }
  }
  
  return lines;
}

// Render audio settings screen
function renderAudioSettingsScreen() {
  // Render parsed lines with pause settings and SSML instructions
  const linesHTML = (currentState.parsedLines || []).map((line, index) => `
    <div class="border-l-4 border-${line.type === 'narration' ? 'purple' : 'blue'}-500 pl-4 mb-4 bg-gray-50 p-3 rounded">
      <div class="flex items-start justify-between gap-3 mb-2">
        <div class="flex-1">
          <div class="font-semibold text-sm text-gray-700">${line.type === 'narration' ? '📖 ナレーション' : '💬 ' + line.speaker}</div>
          <div class="text-gray-600 text-sm mt-1">${line.text}</div>
        </div>
        <div class="w-32 flex-shrink-0">
          <label class="text-xs text-gray-600">後のブランク（秒）</label>
          <input type="number" min="0" max="10" step="0.5" value="${line.pauseAfter || 0}"
                 class="line-pause w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                 data-line-index="${index}">
        </div>
      </div>
    </div>
  `).join('');
  
  // Render question settings if questions exist
  const questionsHTML = currentState.generatedQuestions.length > 0 ? `
    <div class="border-2 border-purple-200 rounded-lg p-4 mb-4 bg-purple-50">
      <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
        <i class="fas fa-question-circle mr-2 text-purple-600"></i>
        問題読み上げ設定
      </h3>
      
      <div class="space-y-4 mb-4">
        <!-- Question Reader Gender -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-venus-mars mr-1"></i>性別
          </label>
          <select id="questionGender" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option value="male">男声</option>
            <option value="female">女声</option>
          </select>
        </div>
        
        <!-- Question Reader Accent -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-globe mr-1"></i>アクセント
          </label>
          <select id="questionAccent" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option value="US">アメリカ英語 (US)</option>
            <option value="UK">イギリス英語 (UK)</option>
            <option value="Australian">オーストラリア英語</option>
            <option value="Canadian">カナダ英語</option>
            <option value="Indian">インド英語</option>
          </select>
        </div>
        
        <!-- Question Reader Speed -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-tachometer-alt mr-1"></i>速度: <span id="questionSpeedValue">1.0x</span>
          </label>
          <input type="range" min="0.5" max="1.5" step="0.1" value="1.0"
                 id="questionSpeed" class="w-full h-2 bg-gray-200 rounded-lg">
        </div>
        
        <!-- Pause settings -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              問題後のブランク（秒）
            </label>
            <input type="number" min="0" max="10" step="0.5" value="2"
                   id="questionPause" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              選択肢間のブランク（秒）
            </label>
            <input type="number" min="0" max="5" step="0.5" value="0.5"
                   id="optionPause" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
          </div>
        </div>
      </div>
    </div>
  ` : '';
  
  const speakersHTML = currentState.speakers.map((speaker, index) => `
    <div class="border-2 border-gray-200 rounded-lg p-4 mb-4">
      <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
        <i class="fas fa-user mr-2 text-indigo-600"></i>
        話者${index + 1}: ${speaker.name}
      </h3>
      
      <div class="space-y-4">
        <!-- Gender Selection -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-venus-mars mr-1"></i>性別
          </label>
          <select class="speaker-gender w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" data-speaker-index="${index}">
            <option value="male" ${(speaker.gender || 'male') === 'male' ? 'selected' : ''}>男声</option>
            <option value="female" ${(speaker.gender || 'male') === 'female' ? 'selected' : ''}>女声</option>
          </select>
        </div>
        
        <!-- Accent Selection -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-globe mr-1"></i>アクセント
          </label>
          <select class="speaker-accent w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" data-speaker-index="${index}">
            <option value="US" ${speaker.accent === 'US' ? 'selected' : ''}>アメリカ英語 (US)</option>
            <option value="UK" ${speaker.accent === 'UK' ? 'selected' : ''}>イギリス英語 (UK)</option>
            <option value="Australian" ${speaker.accent === 'Australian' ? 'selected' : ''}>オーストラリア英語</option>
            <option value="Canadian" ${speaker.accent === 'Canadian' ? 'selected' : ''}>カナダ英語</option>
            <option value="Indian" ${speaker.accent === 'Indian' ? 'selected' : ''}>インド英語</option>
            <option value="Irish" ${speaker.accent === 'Irish' ? 'selected' : ''}>アイルランド英語</option>
            <option value="Scottish" ${speaker.accent === 'Scottish' ? 'selected' : ''}>スコットランド英語</option>
          </select>
        </div>
        
        <!-- Speed Control -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-tachometer-alt mr-1"></i>速度: <span class="speed-value">${speaker.speed}x</span>
          </label>
          <input type="range" min="0.5" max="1.5" step="0.1" value="${speaker.speed}"
                 class="speaker-speed w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                 data-speaker-index="${index}">
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>遅い (0.5x)</span>
            <span>標準 (1.0x)</span>
            <span>速い (1.5x)</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  return `
    <div class="bg-white rounded-lg shadow-lg p-6 fade-in">
      <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <i class="fas fa-microphone-alt mr-3 text-indigo-600"></i>
        音声設定
      </h2>
      
      <p class="text-gray-600 mb-6">
        スクリプトの各セリフのブランク、話者のアクセント、速度、問題読み上げ設定を調整してください。
      </p>
      
      <!-- Script Lines with Pause Controls -->
      <div class="mb-6">
        <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
          <i class="fas fa-align-left mr-2 text-blue-600"></i>
          スクリプトとブランク設定
        </h3>
        <div class="space-y-2">
          ${linesHTML}
        </div>
      </div>
      
      <!-- Question Reader Settings -->
      ${questionsHTML}
      
      <!-- Speaker Settings -->
      <div class="mb-6">
        <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
          <i class="fas fa-users mr-2 text-indigo-600"></i>
          話者設定
        </h3>
        ${speakersHTML}
      </div>
      
      <div class="flex gap-4">
        <button id="backToReviewButton"
                class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
          <i class="fas fa-arrow-left mr-2"></i>スクリプトに戻る
        </button>
        <button id="startAudioGenerationButton"
                class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md">
          <i class="fas fa-magic mr-2"></i>音声を生成
        </button>
      </div>
    </div>
  `;
}

// Attach listeners for audio settings screen
function attachAudioSettingsListeners() {
  const backToReviewButton = document.getElementById('backToReviewButton');
  const startAudioGenerationButton = document.getElementById('startAudioGenerationButton');
  
  // Initialize question reader config if not exists
  if (!currentState.questionReader) {
    currentState.questionReader = {
      gender: 'male',
      accent: 'US',
      speed: 1.0,
      questionPause: 2.0,
      optionPause: 0.5
    };
  }
  
  // Update line pause settings
  document.querySelectorAll('.line-pause').forEach(input => {
    input.addEventListener('input', (e) => {
      const index = parseInt(e.target.dataset.lineIndex);
      const pause = parseFloat(e.target.value) || 0;
      currentState.parsedLines[index].pauseAfter = pause;
    });
  });
  
  // Update question reader gender
  const questionGender = document.getElementById('questionGender');
  if (questionGender) {
    questionGender.addEventListener('change', (e) => {
      currentState.questionReader.gender = e.target.value;
    });
  }
  
  // Update question reader accent
  const questionAccent = document.getElementById('questionAccent');
  if (questionAccent) {
    questionAccent.addEventListener('change', (e) => {
      currentState.questionReader.accent = e.target.value;
    });
  }
  
  // Update question reader speed
  const questionSpeed = document.getElementById('questionSpeed');
  const questionSpeedValue = document.getElementById('questionSpeedValue');
  if (questionSpeed && questionSpeedValue) {
    questionSpeed.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      currentState.questionReader.speed = speed;
      questionSpeedValue.textContent = speed.toFixed(1) + 'x';
    });
  }
  
  // Update question pause
  const questionPause = document.getElementById('questionPause');
  if (questionPause) {
    questionPause.addEventListener('input', (e) => {
      currentState.questionReader.questionPause = parseFloat(e.target.value) || 0;
    });
  }
  
  // Update option pause
  const optionPause = document.getElementById('optionPause');
  if (optionPause) {
    optionPause.addEventListener('input', (e) => {
      currentState.questionReader.optionPause = parseFloat(e.target.value) || 0;
    });
  }
  
  // Update speaker gender
  document.querySelectorAll('.speaker-gender').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.speakerIndex);
      currentState.speakers[index].gender = e.target.value;
    });
  });
  
  // Update speaker accent
  document.querySelectorAll('.speaker-accent').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.speakerIndex);
      currentState.speakers[index].accent = e.target.value;
    });
  });
  
  // Update speaker speed
  document.querySelectorAll('.speaker-speed').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const index = parseInt(e.target.dataset.speakerIndex);
      const speed = parseFloat(e.target.value);
      currentState.speakers[index].speed = speed;
      
      // Update display
      const valueSpan = e.target.closest('.space-y-4').querySelector('.speed-value');
      valueSpan.textContent = speed.toFixed(1) + 'x';
    });
  });
  
  backToReviewButton.addEventListener('click', () => {
    currentState.screen = 'review';
    renderScreen();
  });
  
  startAudioGenerationButton.addEventListener('click', async () => {
    // Show loading
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-12 text-center fade-in">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mb-4"></div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">音声を生成中...</h2>
        <p class="text-gray-600">しばらくお待ちください</p>
      </div>
    `;
    
    try {
      // Prepare API request with parsed lines and question reader config
      const requestData = {
        script: currentState.generatedScript,
        speakers: currentState.speakers,
        parsedLines: currentState.parsedLines || [],
        questions: currentState.generatedQuestions || [],
        questionReader: currentState.questionReader || {
          gender: 'male',
          accent: 'US',
          speed: 1.0,
          questionPause: 2.0,
          optionPause: 0.5
        }
      };
      
      // Call API to generate audio
      const response = await axios.post('/api/generate-audio', requestData);
      
      if (response.data.success) {
        currentState.audioSegments = response.data.audioSegments;
        showAudioResult();
      } else {
        alert('音声生成に失敗しました: ' + response.data.error);
        currentState.screen = 'audioSettings';
        renderScreen();
      }
    } catch (error) {
      alert('音声生成エラー: ' + error.message);
      currentState.screen = 'audioSettings';
      renderScreen();
    }
  });
}

// Play audio segments sequentially
let currentAudioIndex = 0;
let audioElements = [];

function playNextSegment() {
  if (currentAudioIndex < audioElements.length) {
    audioElements[currentAudioIndex].play();
  }
}

// Show audio generation result
function showAudioResult() {
  const appContainer = document.getElementById('app');
  
  const segmentsHTML = currentState.audioSegments.map((segment, index) => {
    const typeIcon = segment.type === 'narration' ? '📖' : 
                    segment.type === 'question' ? '❓' :
                    segment.type === 'option' ? '📝' : '💬';
    const typeColor = segment.type === 'narration' ? 'purple' : 
                     segment.type === 'question' ? 'orange' :
                     segment.type === 'option' ? 'yellow' : 'blue';
    
    return `
      <div class="mb-3 border-l-4 border-${typeColor}-500 pl-3 py-2 bg-gray-50 rounded" data-segment-index="${index}">
        <div class="flex items-start gap-2">
          <button class="play-segment-btn px-2 py-1 bg-indigo-100 hover:bg-indigo-200 rounded text-sm flex-shrink-0" data-index="${index}">
            <i class="fas fa-play"></i>
          </button>
          <div class="flex-1">
            <div class="text-xs font-semibold text-gray-600">${typeIcon} ${segment.speaker}</div>
            <div class="text-sm text-gray-700 mt-1">${segment.text || ''}</div>
            ${segment.pauseAfter ? `<div class="text-xs text-gray-500 mt-1">ブランク: ${segment.pauseAfter}秒</div>` : ''}
            ${segment.ssmlInstructions ? `<div class="text-xs text-purple-600 mt-1 font-mono">SSML: ${segment.ssmlInstructions}</div>` : ''}
            
            <!-- Voice instructions editor (collapsed by default) -->
            <div class="mt-2">
              <button type="button" class="text-xs text-indigo-600 hover:text-indigo-800 toggle-audio-voice-instructions" data-segment-index="${index}">
                <i class="fas fa-magic mr-1"></i>音声指示を編集
              </button>
              <div class="audio-voice-instructions-container hidden mt-2" data-segment-index="${index}">
                <textarea 
                  class="audio-voice-instruction w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  data-segment-index="${index}"
                  rows="2"
                  placeholder="自然な言葉で指示してください。例：&#10;• noticedの前に0.5秒のブランク&#10;• ？を上げ調子のイントネーションで読む&#10;• 笑いながら"
                >${segment.voiceInstructions || ''}</textarea>
                
                <div class="flex gap-2 mt-2">
                  <button type="button" class="convert-audio-to-ssml-btn flex-1 bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 transition" data-segment-index="${index}">
                    <i class="fas fa-magic mr-1"></i>SSMLに変換
                  </button>
                  <button type="button" class="regenerate-audio-btn flex-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition" data-segment-index="${index}">
                    <i class="fas fa-redo mr-1"></i>音声再生成
                  </button>
                  <button type="button" class="clear-audio-instruction-btn bg-gray-400 text-white px-3 py-1 rounded text-xs hover:bg-gray-500 transition" data-segment-index="${index}">
                    <i class="fas fa-times mr-1"></i>クリア
                  </button>
                </div>
                
                <div class="audio-ssml-preview hidden bg-gray-50 p-2 rounded border border-gray-200 mt-2" data-segment-index="${index}">
                  <div class="text-xs font-semibold text-gray-700 mb-1">変換されたSSML:</div>
                  <div class="audio-ssml-preview-text text-xs font-mono text-gray-600 whitespace-pre-wrap">${segment.ssmlInstructions || ''}</div>
                </div>
              </div>
            </div>
          </div>
          <audio class="audio-segment hidden" data-index="${index}" src="data:audio/mp3;base64,${segment.audio}">
          </audio>
        </div>
      </div>
    `;
  }).join('');
  
  appContainer.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 fade-in">
      <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <i class="fas fa-check-circle mr-3 text-green-600"></i>
        音声生成完了
      </h2>
      
      <div class="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
        <p class="text-green-800 mb-4 flex items-center">
          <i class="fas fa-info-circle mr-2"></i>
          音声ファイルが正常に生成されました（${currentState.audioSegments.length}セグメント）
        </p>
        
        <div class="mb-4">
          <button id="playAllButton" class="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition">
            <i class="fas fa-play mr-2"></i>全て連続再生
          </button>
          <button id="stopAllButton" class="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition ml-2">
            <i class="fas fa-stop mr-2"></i>停止
          </button>
        </div>
        
        <div class="border-t pt-4">
          <p class="text-sm font-semibold text-gray-700 mb-2">セグメント別再生:</p>
          ${segmentsHTML}
        </div>
        
        <div class="text-sm text-gray-600 mt-4">
          <p><strong>話者情報:</strong></p>
          <ul class="list-disc list-inside mt-2">
            ${currentState.speakers.map(s => `
              <li>${s.name}: ${s.accent}アクセント、速度 ${s.speed}x</li>
            `).join('')}
          </ul>
        </div>
      </div>
      
      <div class="flex gap-4">
        <button id="downloadMp3Button"
                class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
          <i class="fas fa-download mr-2"></i>MP3ダウンロード（結合済み）
        </button>
        <button id="backToInputFromAudioButton"
                class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
          <i class="fas fa-home mr-2"></i>最初に戻る
        </button>
      </div>
    </div>
  `;
  
  // Setup audio elements
  audioElements = Array.from(document.querySelectorAll('.audio-segment'));
  audioElements.forEach((audio, index) => {
    audio.addEventListener('ended', () => {
      currentAudioIndex++;
      playNextSegment();
    });
  });
  
  // Play all button
  document.getElementById('playAllButton').addEventListener('click', () => {
    currentAudioIndex = 0;
    // Stop all audio first
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    playNextSegment();
  });
  
  // Stop all button
  document.getElementById('stopAllButton').addEventListener('click', () => {
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    currentAudioIndex = 0;
  });
  
  // Individual segment play buttons
  document.querySelectorAll('.play-segment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      // Stop all others
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      // Play selected
      audioElements[index].play();
    });
  });
  
  // Toggle voice instructions editor
  document.querySelectorAll('.toggle-audio-voice-instructions').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.closest('button').dataset.segmentIndex);
      const container = document.querySelector(`.audio-voice-instructions-container[data-segment-index="${index}"]`);
      container.classList.toggle('hidden');
    });
  });
  
  // Convert natural language to SSML (in audio page)
  document.querySelectorAll('.convert-audio-to-ssml-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const index = parseInt(e.target.closest('button').dataset.segmentIndex);
      const segment = currentState.audioSegments[index];
      const textarea = document.querySelector(`.audio-voice-instruction[data-segment-index="${index}"]`);
      const instructions = textarea.value;
      
      if (!instructions || !instructions.trim()) {
        alert('音声指示を入力してください');
        return;
      }
      
      // Show loading
      e.target.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>変換中...';
      e.target.disabled = true;
      
      try {
        const response = await axios.post('/api/convert-to-ssml', {
          text: segment.text,
          instructions: instructions
        });
        
        if (response.data.success) {
          // Update segment SSML instructions
          currentState.audioSegments[index].ssmlInstructions = response.data.ssml;
          currentState.audioSegments[index].voiceInstructions = instructions;
          
          // Show preview
          const preview = document.querySelector(`.audio-ssml-preview[data-segment-index="${index}"]`);
          const previewText = preview.querySelector('.audio-ssml-preview-text');
          previewText.textContent = response.data.ssml;
          preview.classList.remove('hidden');
          
          console.log(`✅ SSML変換完了（音声ページ） - トークン: ${response.data.tokensUsed}, コスト: $${response.data.estimatedCost}`);
        } else {
          alert('SSML変換エラー: ' + response.data.error);
        }
      } catch (error) {
        alert('SSML変換中にエラーが発生しました: ' + error.message);
      } finally {
        // Restore button
        e.target.innerHTML = '<i class="fas fa-magic mr-1"></i>SSMLに変換';
        e.target.disabled = false;
      }
    });
  });
  
  // Clear voice instructions (in audio page)
  document.querySelectorAll('.clear-audio-instruction-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.closest('button').dataset.segmentIndex);
      const textarea = document.querySelector(`.audio-voice-instruction[data-segment-index="${index}"]`);
      const preview = document.querySelector(`.audio-ssml-preview[data-segment-index="${index}"]`);
      
      textarea.value = '';
      preview.classList.add('hidden');
      
      // Clear from state
      currentState.audioSegments[index].ssmlInstructions = '';
      currentState.audioSegments[index].voiceInstructions = '';
    });
  });
  
  // Regenerate single audio segment
  document.querySelectorAll('.regenerate-audio-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const index = parseInt(e.target.closest('button').dataset.segmentIndex);
      const segment = currentState.audioSegments[index];
      
      if (!segment.text) {
        alert('テキストがありません');
        return;
      }
      
      // Confirm regeneration
      if (!confirm(`「${segment.text.substring(0, 30)}...」の音声を再生成しますか？`)) {
        return;
      }
      
      // Show loading
      e.target.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>生成中...';
      e.target.disabled = true;
      
      try {
        // Find speaker settings
        const speaker = currentState.speakers.find(s => s.name === segment.speaker);
        if (!speaker) {
          throw new Error('話者が見つかりません');
        }
        
        // Prepare text with SSML if available
        const textToSpeak = segment.ssmlInstructions || segment.text;
        
        // Generate audio
        const response = await axios.post('/api/generate-audio', {
          text: textToSpeak,
          accent: speaker.accent,
          gender: speaker.gender,
          speed: speaker.speed
        });
        
        if (response.data.success) {
          // Update audio in state
          currentState.audioSegments[index].audio = response.data.audio;
          
          // Update audio element
          const audioElement = document.querySelector(`.audio-segment[data-index="${index}"]`);
          audioElement.src = `data:audio/mp3;base64,${response.data.audio}`;
          audioElement.load();
          
          // Play the new audio
          audioElement.play();
          
          alert('✅ 音声を再生成しました');
        } else {
          alert('音声生成エラー: ' + response.data.error);
        }
      } catch (error) {
        alert('音声再生成中にエラーが発生しました: ' + error.message);
      } finally {
        // Restore button
        e.target.innerHTML = '<i class="fas fa-redo mr-1"></i>音声再生成';
        e.target.disabled = false;
      }
    });
  });
  
  // Download MP3 button
  document.getElementById('downloadMp3Button').addEventListener('click', async () => {
    const btn = document.getElementById('downloadMp3Button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>結合中...';
    
    try {
      // Call API to merge audio segments
      const response = await axios.post('/api/merge-audio', {
        audioSegments: currentState.audioSegments
      }, { responseType: 'blob' });
      
      // Download the merged MP3
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'listening-test-' + Date.now() + '.mp3';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download mr-2"></i>MP3ダウンロード（結合済み）';
    } catch (error) {
      alert('MP3結合エラー: ' + error.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download mr-2"></i>MP3ダウンロード（結合済み）';
    }
  });
  
  document.getElementById('backToInputFromAudioButton').addEventListener('click', () => {
    currentState.screen = 'input';
    currentState.generatedScript = '';
    currentState.generatedQuestions = [];
    currentState.speakers = [];
    currentState.audioSegments = null;
    renderScreen();
  });
}

// Start the app
init();
