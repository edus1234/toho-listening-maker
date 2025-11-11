// State management
let currentState = {
  screen: 'login', // 'login', 'menu', 'input', 'questionSettings', 'review', 'userManagement', 'folders', 'folderView'
  isAuthenticated: false,
  authToken: null,
  isAdmin: false,
  currentFolderId: null, // Currently selected folder ID
  currentFolderName: '', // Currently selected folder name
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
  audioSegments: null, // Array of {speaker, audio} objects
  useGeminiTTS: false, // Flag to use Gemini TTS instead of Google TTS
  narratorSettings: { // Default narrator settings
    language: 'en', // 'en' for English, 'ja' for Japanese
    accent: 'US',
    gender: 'male',
    voiceStyle: 'neutral'
  }
};

// Initialize app
function init() {
  // Check if token exists in localStorage
  const token = localStorage.getItem('authToken');
  const isAdmin = localStorage.getItem('isAdmin') === '1';
  
  if (token) {
    // Restore state
    currentState.isAdmin = isAdmin;
    // Verify token
    verifyToken(token);
  } else {
    renderScreen();
  }
  
  // Setup logout button
  setupLogoutButton();
  
  // Setup user management button
  setupUserManagementButton();
}

// Setup user management button
function setupUserManagementButton() {
  const userManagementButton = document.getElementById('userManagementButton');
  if (userManagementButton) {
    userManagementButton.addEventListener('click', () => {
      currentState.screen = 'userManagement';
      renderScreen();
    });
  }
}

// Setup logout button
function setupLogoutButton() {
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      if (confirm('ログアウトしますか？')) {
        // Clear token
        localStorage.removeItem('authToken');
        localStorage.removeItem('isAdmin');
        
        // Reset state
        currentState.isAuthenticated = false;
        currentState.authToken = null;
        currentState.isAdmin = false;
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
      currentState.screen = 'menu'; // Show menu after login
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
  
  // Show user management button ONLY if admin
  const userManagementButton = document.getElementById('userManagementButton');
  if (userManagementButton) {
    if (currentState.isAdmin) {
      userManagementButton.classList.remove('hidden');
    } else {
      // Ensure button is hidden for non-admin users
      userManagementButton.classList.add('hidden');
    }
  }
}

// Hide logout button
function hideLogoutButton() {
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.classList.add('hidden');
  }
  
  // Hide user management button
  const userManagementButton = document.getElementById('userManagementButton');
  if (userManagementButton) {
    userManagementButton.classList.add('hidden');
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
    case 'menu':
      appContainer.innerHTML = renderMenuScreen();
      attachMenuScreenListeners();
      break;
    case 'input':
      appContainer.innerHTML = renderInputScreen();
      attachInputScreenListeners();
      break;
    case 'questionSettings':
      appContainer.innerHTML = renderQuestionSettingsScreen();
      attachQuestionSettingsListeners();
      break;
    case 'review':
      appContainer.innerHTML = renderReviewScreen();
      attachReviewScreenListeners();
      break;
    case 'speakerSettings':
      appContainer.innerHTML = renderSpeakerSettingsScreen();
      attachSpeakerSettingsListeners();
      break;
    case 'folders':
      renderFoldersScreen();
      break;
    case 'folderView':
      renderFolderViewScreen();
      break;
    case 'userManagement':
      renderUserManagementScreen();
      break;
  }
}

// Render login screen
function renderLoginScreen() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 -m-8 relative overflow-hidden">
      <!-- Background decorative elements -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>
      
      <div class="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 w-full max-w-md fade-in border border-purple-100">
        <div class="text-center mb-8">
          <!-- Larger, more prominent Toho title -->
          <h1 class="text-6xl font-bold bg-gradient-to-r from-purple-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4 tracking-tight">
            Toho Listening Maker
          </h1>
          <div class="h-1 w-24 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4"></div>
          <p class="text-gray-600 text-sm font-medium">
            桐朋中学校・桐朋高等学校
          </p>
          <p class="text-gray-500 text-xs mt-1">
            Professional Listening Test Creation System
          </p>
        </div>
        
        <form id="loginForm" class="space-y-5">
          <!-- Username -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center">
              <i class="fas fa-user mr-2 text-purple-600"></i>Username
            </label>
            <input type="text" id="username" name="username" 
                   required
                   autocomplete="username"
                   placeholder="Enter your username"
                   class="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50 focus:bg-white">
          </div>
          
          <!-- Password -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center">
              <i class="fas fa-lock mr-2 text-purple-600"></i>Password
            </label>
            <input type="password" id="password" name="password" 
                   required
                   autocomplete="current-password"
                   placeholder="Enter your password"
                   class="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50 focus:bg-white">
          </div>
          
          <!-- Error message -->
          <div id="loginError" class="hidden bg-red-50 border-l-4 border-red-500 rounded-lg p-3">
            <p class="text-red-800 text-sm flex items-center">
              <i class="fas fa-exclamation-circle mr-2"></i>
              <span id="loginErrorMessage"></span>
            </p>
          </div>
          
          <!-- Login button -->
          <button type="submit" id="loginButton"
                  class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0">
            <i class="fas fa-sign-in-alt mr-2"></i>Sign In
          </button>
        </form>
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
        localStorage.setItem('isAdmin', response.data.is_admin ? '1' : '0');
        
        // Update state
        currentState.isAuthenticated = true;
        currentState.authToken = response.data.token;
        currentState.isAdmin = response.data.is_admin;
        currentState.screen = 'menu'; // Show menu after login
        
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

// Render nationality, gender, and voice style selectors
function renderNationalitySelectors(numSpeakers, speakerSettings) {
  const nationalityOptions = [
    { value: 'US', label: 'アメリカ' },
    { value: 'UK', label: 'イギリス' },
    { value: 'Australian', label: 'オーストラリア' },
    { value: 'Canadian', label: 'カナダ' },
    { value: 'Indian', label: 'インド' },
    { value: 'Irish', label: 'アイルランド' },
    { value: 'Scottish', label: 'スコットランド' }
  ];
  
  const genderOptions = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' }
  ];
  
  const voiceStyleOptions = [
    { value: 'neutral', label: '標準' },
    { value: 'warm', label: '明るい' },
    { value: 'calm', label: '落ち着いた' }
  ];
  
  let html = '';
  for (let i = 0; i < numSpeakers; i++) {
    const settings = speakerSettings?.[i] || {};
    const selectedNationality = settings.nationality || nationalityOptions[i % nationalityOptions.length].value;
    const selectedGender = settings.gender || 'male';
    const selectedVoiceStyle = settings.voiceStyle || 'neutral';
    
    html += `
      <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <label class="text-sm font-semibold text-gray-700 mb-2 block">話者${i + 1}</label>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="text-xs text-gray-600">アクセント</label>
            <select name="nationality_${i}" class="nationality-select w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500">
              ${nationalityOptions.map(opt => `
                <option value="${opt.value}" ${selectedNationality === opt.value ? 'selected' : ''}>${opt.label}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-600">性別</label>
            <select name="gender_${i}" class="gender-select w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500">
              ${genderOptions.map(opt => `
                <option value="${opt.value}" ${selectedGender === opt.value ? 'selected' : ''}>${opt.label}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-600">声質</label>
            <select name="voiceStyle_${i}" class="voiceStyle-select w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500">
              ${voiceStyleOptions.map(opt => `
                <option value="${opt.value}" ${selectedVoiceStyle === opt.value ? 'selected' : ''}>${opt.label}</option>
              `).join('')}
            </select>
          </div>
        </div>
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
                ${renderNationalitySelectors(currentState.formData.numSpeakers, currentState.formData.speakerSettings)}
              </div>
            </div>
          </div>
        </div>

        <!-- モノローグのスピーカー設定 (モノローグの場合のみ表示) -->
        <div id="monologueSettings" style="display: ${currentState.formData.format === 'monologue' ? 'block' : 'none'}">
          <div class="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-user mr-2 text-green-600"></i>話者設定
            </h3>
            
            <!-- 話者の音声設定 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-microphone mr-2"></i>話者の音声設定
              </label>
              <div id="monologueNationalitySelector" class="space-y-2">
                ${renderNationalitySelectors(1, currentState.formData.speakerSettings)}
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
    
    // Move to review screen (skip audio settings)
    currentState.generatedQuestions = []; // No questions for pasted scripts
    currentState.screen = 'review';
    renderScreen();
  });
  
  // Toggle dialogue/monologue settings visibility based on format
  const monologueSettings = document.getElementById('monologueSettings');
  formatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'dialogue') {
        dialogueSettings.style.display = 'block';
        monologueSettings.style.display = 'none';
      } else {
        dialogueSettings.style.display = 'none';
        monologueSettings.style.display = 'block';
      }
    });
  });
  
  // Update nationality selectors when number of speakers changes
  if (numSpeakersSelect) {
    numSpeakersSelect.addEventListener('change', (e) => {
      const numSpeakers = parseInt(e.target.value);
      const nationalitySelectors = document.getElementById('nationalitySelectors');
      nationalitySelectors.innerHTML = renderNationalitySelectors(numSpeakers, currentState.formData.speakerSettings);
    });
  }
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const format = formData.get('format');
    
    // Get speaker settings (nationality, gender, voice style)
    const numSpeakers = parseInt(formData.get('numSpeakers') || 2);
    const speakerSettings = [];
    if (format === 'dialogue') {
      for (let i = 0; i < numSpeakers; i++) {
        speakerSettings.push({
          nationality: formData.get(`nationality_${i}`) || 'US',
          gender: formData.get(`gender_${i}`) || 'male',
          voiceStyle: formData.get(`voiceStyle_${i}`) || 'neutral'
        });
      }
    } else if (format === 'monologue') {
      // For monologue, use first speaker's settings (or defaults)
      speakerSettings.push({
        nationality: formData.get(`nationality_0`) || 'US',
        gender: formData.get(`gender_0`) || 'male',
        voiceStyle: formData.get(`voiceStyle_0`) || 'neutral'
      });
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
      speakerSettings: speakerSettings
    };
    
    // Validation
    if (!currentState.formData.topic.trim()) {
      alert('トピックを入力してください');
      return;
    }
    
    // Navigate to next screen
    if (currentState.formData.createQuestions) {
      currentState.screen = 'questionSettings';
      renderScreen();
    } else {
      // Disable submit button to prevent double submission
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>生成準備中...';
      }
      // Generate script directly
      generateScript();
    }
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
    
    // Disable submit button to prevent double submission
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>生成準備中...';
    }
    
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
      <h2 class="text-2xl font-bold text-gray-800 mb-4">原稿を生成中です</h2>
      <p class="text-gray-600 mb-2" id="generation-status">AIがスクリプトを作成しています...</p>
      <p class="text-sm text-orange-600 font-semibold mt-4">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        このまましばらくお待ちください。画面を閉じたり戻ったりしないでください。
      </p>
    </div>
  `;
  
  const numQuestions = currentState.formData.questionSettings === 'long' ? 3 : 1;
  const isLong = currentState.formData.questionSettings === 'long';
  const numSpeakers = currentState.formData.numSpeakers || 2;
  const speakerSettings = currentState.formData.speakerSettings || [];
  
  try {
    // Call OpenAI API for script generation
    const scriptResponse = await axios.post('/api/generate-script-ai', {
      format: currentState.formData.format,
      topic: currentState.formData.topic || 'environmental issues',
      keywords: currentState.formData.keywords || 'climate change, global warming',
      cefrLevel: currentState.formData.cefrLevel || 'B1',
      otherConditions: currentState.formData.otherConditions || '',
      numSpeakers: numSpeakers,
      speakerSettings: speakerSettings,
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
    // speakerSettings is already defined at line 852
    const speakerMatches = currentState.generatedScript.match(/^([A-Za-z]+):/gm);
    if (speakerMatches && speakerMatches.length > 0) {
      const uniqueSpeakers = [...new Set(speakerMatches.map(m => m.replace(':', '').trim()))];
      currentState.speakers = uniqueSpeakers.map((name, i) => {
        const settings = speakerSettings[i] || {};
        return {
          name: name,
          accent: settings.nationality || 'US',
          speed: 1.0,
          gender: settings.gender || 'male',
          voiceStyle: settings.voiceStyle || 'neutral'
        };
      });
    } else if (currentState.formData.format === 'monologue') {
      // For monologue, extract speaker name from [Name] format
      const nameMatch = currentState.generatedScript.match(/^\[([A-Za-z]+)\]/);
      if (nameMatch) {
        const settings = speakerSettings[0] || {};
        currentState.speakers = [{
          name: nameMatch[1],
          accent: settings.nationality || 'US',
          speed: 1.0,
          gender: settings.gender || 'male',
          voiceStyle: settings.voiceStyle || 'neutral'
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
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center">
          <i class="fas fa-question-circle mr-3 text-indigo-600"></i>
          生成された問題
        </h2>
        <button id="addQuestionButton" type="button"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
          <i class="fas fa-plus mr-2"></i>問題を追加
        </button>
      </div>
      <div class="space-y-6">
        ${currentState.generatedQuestions.map((q, i) => `
          <div class="border-l-4 border-indigo-500 pl-4 bg-indigo-50 p-3 rounded" data-question-index="${i}">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold text-gray-800 flex-1">問題 ${i + 1}</h3>
              <div class="flex gap-2">
                <button type="button" class="edit-question-btn text-blue-600 hover:text-blue-800 text-sm" data-question-index="${i}">
                  <i class="fas fa-edit"></i> 編集
                </button>
                <button type="button" class="delete-question-btn text-red-600 hover:text-red-800 text-sm" data-question-index="${i}">
                  <i class="fas fa-trash"></i> 削除
                </button>
              </div>
            </div>
            <div class="question-display" data-question-index="${i}">
              <p class="font-medium text-gray-800 mb-2">${q.question}</p>
              <div class="space-y-1 text-gray-700 text-sm">
                ${q.options.map(opt => `<div>${opt}</div>`).join('')}
              </div>
              <p class="text-sm text-green-600 mt-2"><i class="fas fa-check mr-1"></i>正解: ${q.correctAnswer}</p>
            </div>
            <div class="question-editor hidden" data-question-index="${i}">
              <div class="space-y-2">
                <div>
                  <label class="text-xs text-gray-600">問題文:</label>
                  <input type="text" class="question-text-input w-full px-2 py-1 text-sm border rounded" value="${q.question}" data-question-index="${i}">
                </div>
                <div>
                  <label class="text-xs text-gray-600">選択肢 (1行1つ):</label>
                  <textarea class="question-options-input w-full px-2 py-1 text-sm border rounded" rows="4" data-question-index="${i}">${q.options.join('\n')}</textarea>
                </div>
                <div>
                  <label class="text-xs text-gray-600">正解:</label>
                  <input type="text" class="question-answer-input w-full px-2 py-1 text-sm border rounded" value="${q.correctAnswer}" data-question-index="${i}">
                </div>
                <button type="button" class="save-question-btn bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700" data-question-index="${i}">
                  <i class="fas fa-save mr-1"></i>保存
                </button>
              </div>
            </div>
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

      <!-- Narrator Settings -->
      <div class="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <i class="fas fa-book-reader mr-2 text-purple-600"></i>ナレーター設定
        </h3>
        <p class="text-sm text-purple-700 mb-3">
          <i class="fas fa-info-circle mr-1"></i>ナレーションが日本語の場合は「言語」を日本語に設定してください
        </p>
        <div class="grid grid-cols-4 gap-3">
          <div>
            <label class="text-sm text-gray-700 mb-1 block">言語</label>
            <select id="narratorLanguage" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="en" ${(currentState.narratorSettings?.language || 'en') === 'en' ? 'selected' : ''}>英語</option>
              <option value="ja" ${(currentState.narratorSettings?.language || 'en') === 'ja' ? 'selected' : ''}>日本語</option>
            </select>
          </div>
          <div id="narratorAccentDiv">
            <label class="text-sm text-gray-700 mb-1 block">アクセント</label>
            <select id="narratorAccent" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="US" ${(currentState.narratorSettings?.accent || 'US') === 'US' ? 'selected' : ''}>アメリカ</option>
              <option value="UK" ${(currentState.narratorSettings?.accent || 'US') === 'UK' ? 'selected' : ''}>イギリス</option>
              <option value="Australian" ${(currentState.narratorSettings?.accent || 'US') === 'Australian' ? 'selected' : ''}>オーストラリア</option>
              <option value="Canadian" ${(currentState.narratorSettings?.accent || 'US') === 'Canadian' ? 'selected' : ''}>カナダ</option>
              <option value="Indian" ${(currentState.narratorSettings?.accent || 'US') === 'Indian' ? 'selected' : ''}>インド</option>
              <option value="Irish" ${(currentState.narratorSettings?.accent || 'US') === 'Irish' ? 'selected' : ''}>アイルランド</option>
              <option value="Scottish" ${(currentState.narratorSettings?.accent || 'US') === 'Scottish' ? 'selected' : ''}>スコットランド</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-700 mb-1 block">性別</label>
            <select id="narratorGender" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="male" ${(currentState.narratorSettings?.gender || 'male') === 'male' ? 'selected' : ''}>男性</option>
              <option value="female" ${(currentState.narratorSettings?.gender || 'male') === 'female' ? 'selected' : ''}>女性</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-700 mb-1 block">声質</label>
            <select id="narratorVoiceStyle" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="neutral" ${(currentState.narratorSettings?.voiceStyle || 'neutral') === 'neutral' ? 'selected' : ''}>標準</option>
              <option value="warm" ${(currentState.narratorSettings?.voiceStyle || 'neutral') === 'warm' ? 'selected' : ''}>明るい</option>
              <option value="calm" ${(currentState.narratorSettings?.voiceStyle || 'neutral') === 'calm' ? 'selected' : ''}>落ち着いた</option>
            </select>
          </div>
        </div>
        <p class="text-xs text-gray-600 mt-2">
          <i class="fas fa-info-circle mr-1"></i>スクリプトに [Narration: テキスト] がある場合、この設定が適用されます
        </p>
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
  const narratorAccent = document.getElementById('narratorAccent');
  const narratorGender = document.getElementById('narratorGender');
  const narratorVoiceStyle = document.getElementById('narratorVoiceStyle');
  
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
  
  // Narrator settings listeners
  const narratorLanguage = document.getElementById('narratorLanguage');
  const narratorAccentDiv = document.getElementById('narratorAccentDiv');
  
  // Language change handler - hide accent selector for Japanese
  narratorLanguage.addEventListener('change', (e) => {
    if (!currentState.narratorSettings) currentState.narratorSettings = {};
    currentState.narratorSettings.language = e.target.value;
    
    // Show/hide accent selector based on language
    if (e.target.value === 'ja') {
      narratorAccentDiv.style.display = 'none';
    } else {
      narratorAccentDiv.style.display = 'block';
    }
  });
  
  // Initialize accent visibility based on current language
  if (currentState.narratorSettings?.language === 'ja') {
    narratorAccentDiv.style.display = 'none';
  }
  
  narratorAccent.addEventListener('change', (e) => {
    if (!currentState.narratorSettings) currentState.narratorSettings = {};
    currentState.narratorSettings.accent = e.target.value;
  });
  
  narratorGender.addEventListener('change', (e) => {
    if (!currentState.narratorSettings) currentState.narratorSettings = {};
    currentState.narratorSettings.gender = e.target.value;
  });
  
  narratorVoiceStyle.addEventListener('change', (e) => {
    if (!currentState.narratorSettings) currentState.narratorSettings = {};
    currentState.narratorSettings.voiceStyle = e.target.value;
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
  
  // Question editing handlers
  const addQuestionButton = document.getElementById('addQuestionButton');
  if (addQuestionButton) {
    addQuestionButton.addEventListener('click', () => {
      const newQuestion = {
        question: '新しい問題を入力してください',
        options: ['A) 選択肢1', 'B) 選択肢2', 'C) 選択肢3', 'D) 選択肢4'],
        correctAnswer: 'A'
      };
      currentState.generatedQuestions.push(newQuestion);
      renderScreen();
    });
  }
  
  // Edit question buttons
  document.querySelectorAll('.edit-question-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.questionIndex);
      const display = document.querySelector(`.question-display[data-question-index="${index}"]`);
      const editor = document.querySelector(`.question-editor[data-question-index="${index}"]`);
      display.classList.add('hidden');
      editor.classList.remove('hidden');
    });
  });
  
  // Save question buttons
  document.querySelectorAll('.save-question-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.questionIndex);
      const questionText = document.querySelector(`.question-text-input[data-question-index="${index}"]`).value;
      const optionsText = document.querySelector(`.question-options-input[data-question-index="${index}"]`).value;
      const correctAnswer = document.querySelector(`.question-answer-input[data-question-index="${index}"]`).value;
      
      currentState.generatedQuestions[index] = {
        question: questionText,
        options: optionsText.split('\n').filter(o => o.trim()),
        correctAnswer: correctAnswer
      };
      
      renderScreen();
    });
  });
  
  // Delete question buttons
  document.querySelectorAll('.delete-question-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.questionIndex);
      if (confirm('この問題を削除しますか？')) {
        currentState.generatedQuestions.splice(index, 1);
        renderScreen();
      }
    });
  });
  
  generateAudioButton.addEventListener('click', () => {
    // Parse script to detect speakers
    const lines = parseScriptForSettings(currentState.generatedScript);
    currentState.parsedLines = lines;
    
    // Show speaker settings screen before generating audio
    currentState.screen = 'speakerSettings';
    renderScreen();
  });
}

// Render speaker settings screen
function renderSpeakerSettingsScreen() {
  // Detect speakers from parsed lines
  const speakerNames = [...new Set(currentState.parsedLines
    .filter(line => line.speaker && line.speaker !== 'Narration')
    .map(line => line.speaker))];
  
  // Check if there are narration lines
  const hasNarration = currentState.parsedLines.some(line => 
    line.type === 'narration' || line.isNarration || line.speaker === 'Narration'
  );
  
  // Initialize speakers with existing settings or defaults
  if (!currentState.speakers || currentState.speakers.length === 0) {
    currentState.speakers = speakerNames.map((name, index) => ({
      name: name,
      language: 'en',
      accent: ['US', 'UK', 'Australian', 'Canadian'][index % 4],
      gender: index % 2 === 0 ? 'male' : 'female',
      voiceStyle: 'neutral',
      speed: 1.0
    }));
  }
  
  const speakersHTML = currentState.speakers.map((speaker, index) => `
    <div class="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 mb-4">
      <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
        <i class="fas fa-user mr-2 text-blue-600"></i>${speaker.name}
      </h4>
      <div class="grid grid-cols-5 gap-3">
        <div>
          <label class="text-xs text-gray-700 mb-1 block">言語</label>
          <select class="speaker-language-select w-full px-2 py-1.5 text-sm border border-gray-300 rounded" data-speaker-index="${index}">
            <option value="en" ${speaker.language === 'en' ? 'selected' : ''}>英語</option>
            <option value="ja" ${speaker.language === 'ja' ? 'selected' : ''}>日本語</option>
          </select>
        </div>
        <div class="speaker-accent-div" data-speaker-index="${index}" style="display: ${speaker.language === 'ja' ? 'none' : 'block'}">
          <label class="text-xs text-gray-700 mb-1 block">アクセント</label>
          <select class="speaker-accent-select w-full px-2 py-1.5 text-sm border border-gray-300 rounded" data-speaker-index="${index}">
            <option value="US" ${speaker.accent === 'US' ? 'selected' : ''}>アメリカ</option>
            <option value="UK" ${speaker.accent === 'UK' ? 'selected' : ''}>イギリス</option>
            <option value="Australian" ${speaker.accent === 'Australian' ? 'selected' : ''}>オーストラリア</option>
            <option value="Canadian" ${speaker.accent === 'Canadian' ? 'selected' : ''}>カナダ</option>
            <option value="Indian" ${speaker.accent === 'Indian' ? 'selected' : ''}>インド</option>
            <option value="Irish" ${speaker.accent === 'Irish' ? 'selected' : ''}>アイルランド</option>
            <option value="Scottish" ${speaker.accent === 'Scottish' ? 'selected' : ''}>スコットランド</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-700 mb-1 block">性別</label>
          <select class="speaker-gender-select w-full px-2 py-1.5 text-sm border border-gray-300 rounded" data-speaker-index="${index}">
            <option value="male" ${speaker.gender === 'male' ? 'selected' : ''}>男性</option>
            <option value="female" ${speaker.gender === 'female' ? 'selected' : ''}>女性</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-700 mb-1 block">声質</label>
          <select class="speaker-voiceStyle-select w-full px-2 py-1.5 text-sm border border-gray-300 rounded" data-speaker-index="${index}">
            <option value="neutral" ${speaker.voiceStyle === 'neutral' ? 'selected' : ''}>標準</option>
            <option value="warm" ${speaker.voiceStyle === 'warm' ? 'selected' : ''}>明るい</option>
            <option value="calm" ${speaker.voiceStyle === 'calm' ? 'selected' : ''}>落ち着いた</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-700 mb-1 block">速度</label>
          <input type="number" min="0.5" max="2.0" step="0.1" value="${speaker.speed || 1.0}"
                 class="speaker-speed-input w-full px-2 py-1.5 text-sm border border-gray-300 rounded" data-speaker-index="${index}">
        </div>
      </div>
    </div>
  `).join('');
  
  const narratorHTML = hasNarration ? `
    <div class="border-2 border-purple-200 rounded-lg p-4 bg-purple-50 mb-4">
      <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
        <i class="fas fa-book-reader mr-2 text-purple-600"></i>ナレーター
      </h4>
      <div class="grid grid-cols-5 gap-3">
        <div>
          <label class="text-xs text-gray-700 mb-1 block">言語</label>
          <select id="finalNarratorLanguage" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded">
            <option value="en" ${(currentState.narratorSettings?.language || 'en') === 'en' ? 'selected' : ''}>英語</option>
            <option value="ja" ${(currentState.narratorSettings?.language || 'en') === 'ja' ? 'selected' : ''}>日本語</option>
          </select>
        </div>
        <div id="finalNarratorAccentDiv" style="display: ${(currentState.narratorSettings?.language || 'en') === 'ja' ? 'none' : 'block'}">
          <label class="text-xs text-gray-700 mb-1 block">アクセント</label>
          <select id="finalNarratorAccent" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded">
            <option value="US" ${(currentState.narratorSettings?.accent || 'US') === 'US' ? 'selected' : ''}>アメリカ</option>
            <option value="UK" ${(currentState.narratorSettings?.accent || 'US') === 'UK' ? 'selected' : ''}>イギリス</option>
            <option value="Australian" ${(currentState.narratorSettings?.accent || 'US') === 'Australian' ? 'selected' : ''}>オーストラリア</option>
            <option value="Canadian" ${(currentState.narratorSettings?.accent || 'US') === 'Canadian' ? 'selected' : ''}>カナダ</option>
            <option value="Indian" ${(currentState.narratorSettings?.accent || 'US') === 'Indian' ? 'selected' : ''}>インド</option>
            <option value="Irish" ${(currentState.narratorSettings?.accent || 'US') === 'Irish' ? 'selected' : ''}>アイルランド</option>
            <option value="Scottish" ${(currentState.narratorSettings?.accent || 'US') === 'Scottish' ? 'selected' : ''}>スコットランド</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-700 mb-1 block">性別</label>
          <select id="finalNarratorGender" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded">
            <option value="male" ${(currentState.narratorSettings?.gender || 'male') === 'male' ? 'selected' : ''}>男性</option>
            <option value="female" ${(currentState.narratorSettings?.gender || 'male') === 'female' ? 'selected' : ''}>女性</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-700 mb-1 block">声質</label>
          <select id="finalNarratorVoiceStyle" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded">
            <option value="neutral" ${(currentState.narratorSettings?.voiceStyle || 'neutral') === 'neutral' ? 'selected' : ''}>標準</option>
            <option value="warm" ${(currentState.narratorSettings?.voiceStyle || 'neutral') === 'warm' ? 'selected' : ''}>明るい</option>
            <option value="calm" ${(currentState.narratorSettings?.voiceStyle || 'neutral') === 'calm' ? 'selected' : ''}>落ち着いた</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-700 mb-1 block">速度</label>
          <input type="number" min="0.5" max="2.0" step="0.1" value="1.0"
                 id="finalNarratorSpeed" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded">
        </div>
      </div>
    </div>
  ` : '';
  
  return `
    <div class="bg-white rounded-lg shadow-lg p-6 fade-in">
      <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <i class="fas fa-microphone-alt mr-3 text-green-600"></i>
        音声設定
      </h2>
      
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p class="text-sm text-blue-800 mb-2">
          <i class="fas fa-info-circle mr-2"></i>
          各話者とナレーターの音声特性を設定してください
        </p>
        <p class="text-sm text-red-600 font-semibold">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          ※セリフを編集後には、前の画面に戻って「音声再調整」ボタンを押してください！
        </p>
      </div>
      
      ${speakersHTML}
      ${narratorHTML}
      
      <div class="flex gap-4 mt-6">
        <button id="backToReviewButton"
                class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
          <i class="fas fa-arrow-left mr-2"></i>戻る
        </button>
        <button id="startAudioGenerationButton"
                class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md">
          <i class="fas fa-magic mr-2"></i>音声生成開始
        </button>
      </div>
    </div>
  `;
}

// Attach listeners for speaker settings screen
function attachSpeakerSettingsListeners() {
  const backToReviewButton = document.getElementById('backToReviewButton');
  const startAudioGenerationButton = document.getElementById('startAudioGenerationButton');
  
  // Initialize narrator settings from current form values to ensure they're set
  const finalNarratorLanguage = document.getElementById('finalNarratorLanguage');
  const finalNarratorAccent = document.getElementById('finalNarratorAccent');
  const finalNarratorGender = document.getElementById('finalNarratorGender');
  const finalNarratorVoiceStyle = document.getElementById('finalNarratorVoiceStyle');
  const finalNarratorSpeed = document.getElementById('finalNarratorSpeed');
  
  if (finalNarratorLanguage) {
    if (!currentState.narratorSettings) currentState.narratorSettings = {};
    currentState.narratorSettings.language = finalNarratorLanguage.value;
    if (finalNarratorAccent) currentState.narratorSettings.accent = finalNarratorAccent.value;
    if (finalNarratorGender) currentState.narratorSettings.gender = finalNarratorGender.value;
    if (finalNarratorVoiceStyle) currentState.narratorSettings.voiceStyle = finalNarratorVoiceStyle.value;
    if (finalNarratorSpeed) currentState.narratorSettings.speed = parseFloat(finalNarratorSpeed.value);
    
    console.log('🎙️ Initialized narrator settings:', currentState.narratorSettings);
  }
  
  // Language selectors for speakers
  document.querySelectorAll('.speaker-language-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.speakerIndex);
      const language = e.target.value;
      currentState.speakers[index].language = language;
      
      // Show/hide accent selector based on language
      const accentDiv = document.querySelector(`.speaker-accent-div[data-speaker-index="${index}"]`);
      if (language === 'ja') {
        accentDiv.style.display = 'none';
      } else {
        accentDiv.style.display = 'block';
      }
    });
  });
  
  // Accent selectors for speakers
  document.querySelectorAll('.speaker-accent-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.speakerIndex);
      currentState.speakers[index].accent = e.target.value;
    });
  });
  
  // Gender selectors for speakers
  document.querySelectorAll('.speaker-gender-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.speakerIndex);
      currentState.speakers[index].gender = e.target.value;
    });
  });
  
  // Voice style selectors for speakers
  document.querySelectorAll('.speaker-voiceStyle-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.speakerIndex);
      currentState.speakers[index].voiceStyle = e.target.value;
    });
  });
  
  // Speed inputs for speakers
  document.querySelectorAll('.speaker-speed-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.speakerIndex);
      currentState.speakers[index].speed = parseFloat(e.target.value);
    });
  });
  
  // Narrator settings event listeners
  const finalNarratorAccentDiv = document.getElementById('finalNarratorAccentDiv');
  
  if (finalNarratorLanguage) {
    finalNarratorLanguage.addEventListener('change', (e) => {
      if (!currentState.narratorSettings) currentState.narratorSettings = {};
      currentState.narratorSettings.language = e.target.value;
      console.log('🔄 Narrator language changed to:', e.target.value);
      
      if (e.target.value === 'ja') {
        finalNarratorAccentDiv.style.display = 'none';
      } else {
        finalNarratorAccentDiv.style.display = 'block';
      }
    });
    
    if (finalNarratorAccent) {
      finalNarratorAccent.addEventListener('change', (e) => {
        if (!currentState.narratorSettings) currentState.narratorSettings = {};
        currentState.narratorSettings.accent = e.target.value;
        console.log('🔄 Narrator accent changed to:', e.target.value);
      });
    }
    
    if (finalNarratorGender) {
      finalNarratorGender.addEventListener('change', (e) => {
        if (!currentState.narratorSettings) currentState.narratorSettings = {};
        currentState.narratorSettings.gender = e.target.value;
        console.log('🔄 Narrator gender changed to:', e.target.value);
      });
    }
    
    if (finalNarratorVoiceStyle) {
      finalNarratorVoiceStyle.addEventListener('change', (e) => {
        if (!currentState.narratorSettings) currentState.narratorSettings = {};
        currentState.narratorSettings.voiceStyle = e.target.value;
        console.log('🔄 Narrator voiceStyle changed to:', e.target.value);
      });
    }
    
    if (finalNarratorSpeed) {
      finalNarratorSpeed.addEventListener('change', (e) => {
        if (!currentState.narratorSettings) currentState.narratorSettings = {};
        currentState.narratorSettings.speed = parseFloat(e.target.value);
        console.log('🔄 Narrator speed changed to:', e.target.value);
      });
    }
  }
  
  backToReviewButton.addEventListener('click', () => {
    currentState.screen = 'review';
    renderScreen();
  });
  
  startAudioGenerationButton.addEventListener('click', () => {
    // Initialize question reader if needed
    if (!currentState.questionReader) {
      currentState.questionReader = {
        gender: 'male',
        accent: 'US',
        speed: 1.0,
        questionPause: 2.0,
        optionPause: 0.5
      };
    }
    
    console.log('🚀 Starting audio generation with narrator settings:', currentState.narratorSettings);
    console.log('🚀 Starting audio generation with speakers:', JSON.stringify(currentState.speakers, null, 2));
    console.log('🚀 Parsed lines:', JSON.stringify(currentState.parsedLines, null, 2));
    
    generateAudioFromParsedLines();
  });
}

// Generate audio from parsed lines (extracted from audio settings)
async function generateAudioFromParsedLines() {
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
    // Prepare API request with parsed lines, question reader, and narrator config
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
      },
      narratorSettings: currentState.narratorSettings || {
        accent: 'US',
        gender: 'male',
        voiceStyle: 'neutral'
      },
      useGeminiTTS: currentState.useGeminiTTS || false
    };
    
    // Call API to generate audio
    const response = await axios.post('/api/generate-audio', requestData);
    
    if (response.data.success) {
      currentState.audioSegments = response.data.audioSegments;
      // CRITICAL: Preserve speakers information from response
      if (response.data.speakers) {
        currentState.speakers = response.data.speakers;
      }
      console.log('✅ Audio generated, speakers:', currentState.speakers);
      showAudioResult();
    } else {
      alert('音声生成に失敗しました: ' + response.data.error);
      currentState.screen = 'review';
      renderScreen();
    }
  } catch (error) {
    alert('音声生成エラー: ' + error.message);
    currentState.screen = 'review';
    renderScreen();
  }
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


// Old attachAudioSettingsListeners function removed - audio settings screen no longer exists

// Play audio segments sequentially
let currentAudioIndex = 0;
let audioElements = [];

function playNextSegment() {
  if (currentAudioIndex < audioElements.length) {
    const currentAudio = audioElements[currentAudioIndex];
    const segment = currentState.audioSegments[currentAudioIndex];
    const pauseAfter = segment.pauseAfter || 0;
    
    // Play current segment
    currentAudio.play();
    
    // Remove old event listener to avoid duplicates
    const oldEndedHandler = currentAudio._endedHandler;
    if (oldEndedHandler) {
      currentAudio.removeEventListener('ended', oldEndedHandler);
    }
    
    // Add new event listener with pause handling
    const endedHandler = () => {
      // Wait for pauseAfter duration before playing next segment
      if (pauseAfter > 0) {
        console.log(`⏸️ Waiting ${pauseAfter} seconds before next segment...`);
        setTimeout(() => {
          currentAudioIndex++;
          playNextSegment();
        }, pauseAfter * 1000);
      } else {
        // No pause, play next immediately
        currentAudioIndex++;
        playNextSegment();
      }
    };
    
    // Store handler reference for cleanup
    currentAudio._endedHandler = endedHandler;
    currentAudio.addEventListener('ended', endedHandler, { once: true });
  }
}

// Show audio generation result
function showAudioResult() {
  const appContainer = document.getElementById('app');
  
  // Filter out silence segments from display (but keep them for download)
  const visibleSegments = currentState.audioSegments.filter(seg => seg.type !== 'silence');
  
  const segmentsHTML = visibleSegments.map((segment, displayIndex) => {
    // Find original index in currentState.audioSegments
    const index = currentState.audioSegments.indexOf(segment);
    
    const typeIcon = segment.type === 'narration' ? '📖' : 
                    segment.type === 'question' ? '❓' :
                    segment.type === 'option' ? '📝' : '💬';
    const typeColor = segment.type === 'narration' ? 'purple' : 
                     segment.type === 'question' ? 'orange' :
                     segment.type === 'option' ? 'yellow' : 'blue';
    
    return `
      <div class="mb-3 border-l-4 border-${typeColor}-500 pl-3 py-2 bg-gray-50 rounded draggable-segment cursor-move" data-segment-index="${index}" draggable="true">
        <div class="flex items-start gap-2">
          <!-- Move up/down buttons -->
          <div class="flex flex-col gap-1">
            <button class="move-segment-up-btn px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs flex-shrink-0 ${displayIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}" data-index="${index}" ${displayIndex === 0 ? 'disabled' : ''} title="上に移動">
              <i class="fas fa-chevron-up"></i>
            </button>
            <button class="move-segment-down-btn px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs flex-shrink-0 ${displayIndex === visibleSegments.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}" data-index="${index}" ${displayIndex === visibleSegments.length - 1 ? 'disabled' : ''} title="下に移動">
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
          <button class="play-segment-btn px-2 py-1 bg-indigo-100 hover:bg-indigo-200 rounded text-sm flex-shrink-0" data-index="${index}">
            <i class="fas fa-play"></i>
          </button>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <div class="text-xs font-semibold text-gray-600">${typeIcon} ${segment.speaker}</div>
              ${segment.type === 'narration' || segment.isNarration ? `
                <select class="segment-narrator-language-select text-xs px-2 py-0.5 border border-purple-300 rounded bg-purple-50" data-segment-index="${index}">
                  <option value="en" ${(segment.narratorLanguage || currentState.narratorSettings?.language || 'en') === 'en' ? 'selected' : ''}>英語</option>
                  <option value="ja" ${(segment.narratorLanguage || currentState.narratorSettings?.language || 'en') === 'ja' ? 'selected' : ''}>日本語</option>
                </select>
              ` : (segment.type === 'question' || segment.type === 'option') ? `
                <select class="segment-question-language-select text-xs px-2 py-0.5 border border-orange-300 rounded bg-orange-50" data-segment-index="${index}">
                  <option value="en" ${(segment.language || currentState.questionReader?.language || 'en') === 'en' ? 'selected' : ''}>英語</option>
                  <option value="ja" ${(segment.language || currentState.questionReader?.language || 'en') === 'ja' ? 'selected' : ''}>日本語</option>
                </select>
              ` : `
                <select class="segment-speaker-language-select text-xs px-2 py-0.5 border border-blue-300 rounded bg-blue-50" data-segment-index="${index}">
                  <option value="en" ${(segment.language || 'en') === 'en' ? 'selected' : ''}>英語</option>
                  <option value="ja" ${(segment.language || 'en') === 'ja' ? 'selected' : ''}>日本語</option>
                </select>
              `}
              <select class="segment-gender-select text-xs px-2 py-0.5 border border-gray-300 rounded" data-segment-index="${index}">
                <option value="male" ${(segment.gender || (segment.type === 'question' || segment.type === 'option' ? currentState.questionReader?.gender || 'male' : 'male')) === 'male' ? 'selected' : ''}>男性</option>
                <option value="female" ${(segment.gender || (segment.type === 'question' || segment.type === 'option' ? currentState.questionReader?.gender || 'male' : 'male')) === 'female' ? 'selected' : ''}>女性</option>
              </select>
              <select class="segment-voiceStyle-select text-xs px-2 py-0.5 border border-gray-300 rounded" data-segment-index="${index}">
                <option value="neutral" ${(segment.voiceStyle || 'neutral') === 'neutral' ? 'selected' : ''}>標準</option>
                <option value="warm" ${(segment.voiceStyle || 'neutral') === 'warm' ? 'selected' : ''}>明るい</option>
                <option value="calm" ${(segment.voiceStyle || 'neutral') === 'calm' ? 'selected' : ''}>落ち着いた</option>
              </select>
            </div>
            <!-- Editable script text -->
            <div class="mt-1">
              <textarea 
                class="segment-text-editor w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 resize-none"
                data-segment-index="${index}"
                rows="2"
                placeholder="セリフを編集...">${segment.text || ''}</textarea>
            </div>
            
            <!-- Speed and Pause controls -->
            <div class="flex items-center gap-4 mt-2">
              <!-- Speed control -->
              <div class="flex items-center gap-2">
                <label class="text-xs text-gray-600">速度:</label>
                <input type="range" min="0.75" max="1.5" step="0.05" value="${segment.overallSpeed || 1.0}"
                       class="segment-speed-slider w-24"
                       data-segment-index="${index}">
                <span class="text-xs text-gray-700 font-mono segment-speed-value">${(segment.overallSpeed || 1.0).toFixed(2)}x</span>
              </div>
              <!-- Pause control -->
              <div class="flex items-center gap-2">
                <label class="text-xs text-gray-600">後のブランク（秒）:</label>
                <input type="number" min="0" max="10" step="0.5" value="${segment.pauseAfter || 0}"
                       class="segment-pause-input w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                       data-segment-index="${index}">
              </div>
            </div>
            
            ${segment.ssmlInstructions ? `<div class="text-xs text-purple-600 mt-1 font-mono bg-purple-50 p-1 rounded">適用済み音声調整: ${segment.ssmlInstructions}</div>` : ''}
            
            <!-- Voice instructions editor (collapsed by default) -->
            <div class="mt-2">
              <button type="button" class="text-xs text-indigo-600 hover:text-indigo-800 toggle-audio-voice-instructions" data-segment-index="${index}">
                <i class="fas fa-sliders-h mr-1"></i>音声を調整する
              </button>
              <div class="audio-voice-instructions-container hidden mt-2" data-segment-index="${index}">
                <div class="bg-blue-50 p-2 rounded mb-2 text-xs">
                  <div class="font-semibold text-blue-800 mb-1">クイック挿入:</div>
                  
                  <!-- Pause marks -->
                  <div class="mb-2">
                    <div class="text-xs text-gray-600 mb-1">⏸️ ポーズ:</div>
                    <div class="flex flex-wrap gap-1">
                      <button type="button" class="insert-mark-btn px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs" data-segment-index="${index}" data-mark="[0.2秒間]">
                        [0.2秒間]
                      </button>
                      <button type="button" class="insert-mark-btn px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs" data-segment-index="${index}" data-mark="[0.5秒間]">
                        [0.5秒間]
                      </button>
                      <button type="button" class="insert-mark-btn px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs" data-segment-index="${index}" data-mark="[1秒間]">
                        [1秒間]
                      </button>
                      <button type="button" class="insert-mark-btn px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs" data-segment-index="${index}" data-mark="[2秒間]">
                        [2秒間]
                      </button>
                    </div>
                  </div>
                  
                  <div class="text-xs text-gray-600 mt-2">
                    💡 カーソル位置にマークを挿入します。単語の前後に配置してください。
                  </div>
                </div>
                
                <div class="mb-2 p-2 bg-green-50 rounded text-xs border border-green-300">
                  <div class="font-semibold text-green-800 mb-1">✨ すべての変更は自動的に音声に反映されます</div>
                  <div class="text-gray-700 text-xs">テキスト編集、マーク挿入、速度・アクセント・性別などの変更を行うと、即座に音声が自動再生成されます。</div>
                </div>
                
                <textarea 
                  class="audio-voice-instruction w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  data-segment-index="${index}"
                  rows="3"
                  placeholder="マークを挿入すると自動的に音声が再生成されます"
                >${segment.voiceInstructions || segment.text || ''}</textarea>
                
                <div class="flex gap-2 mt-2">
                  <button type="button" class="clear-audio-instruction-btn w-full bg-gray-400 text-white px-3 py-1 rounded text-xs hover:bg-gray-500 transition" data-segment-index="${index}">
                    <i class="fas fa-times mr-1"></i>クリア
                  </button>
                </div>
                
                <div class="audio-ssml-preview hidden bg-gray-50 p-2 rounded border border-gray-200 mt-2" data-segment-index="${index}">
                  <div class="text-xs font-semibold text-gray-700 mb-1">生成された調整コード:</div>
                  <div class="audio-ssml-preview-text text-xs font-mono text-gray-600 whitespace-pre-wrap">${segment.ssmlInstructions || ''}</div>
                </div>
              </div>
            </div>
          </div>
          <audio class="audio-segment hidden" data-index="${index}" data-raw-audio="${segment.audio}">
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
        <div class="mb-4">
          <p class="text-green-800 mb-2 flex items-center font-semibold">
            <i class="fas fa-check-circle mr-2"></i>
            音声ファイルが正常に生成されました（${visibleSegments.length}セグメント）
          </p>
          <p class="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded p-3 mt-2">
            <i class="fas fa-info-circle mr-1 text-blue-600"></i>
            <strong>編集方法：</strong>セリフのテキストは直接編集できます。音声調整のマークを挿入すると、自動的に音声が再生成されます。セグメントの順序を変更するには、ドラッグ＆ドロップするか、上下の矢印ボタンを使用してください。
          </p>
        </div>
        
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
      
      <div class="mb-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
        <p class="text-sm text-blue-800 mb-2 font-semibold">
          <i class="fas fa-info-circle mr-1"></i>
          ブランク（間隔）を変更した場合は、ダウンロード前に「ブランクを反映」ボタンをクリックしてください
        </p>
        <button id="updateBlanksButton"
                class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
          <i class="fas fa-sync-alt mr-2"></i>ブランクを反映（サイレンス再生成）
        </button>
      </div>
      
      <div class="flex gap-4 mb-4">
        <button id="downloadMp3Button"
                class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
          <i class="fas fa-download mr-2"></i>WAVダウンロード（結合済み）
        </button>
        <button id="backToScriptButton"
                class="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition">
          <i class="fas fa-arrow-left mr-2"></i>スクリプト編集に戻る
        </button>
        <button id="backToInputFromAudioButton"
                class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
          <i class="fas fa-home mr-2"></i>最初に戻る
        </button>
      </div>
      
      <div class="border-t-2 pt-4">
        <button id="saveToFolderButton"
                class="w-full bg-green-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-green-700 transition text-lg">
          <i class="fas fa-save mr-2"></i>フォルダに保存
        </button>
      </div>
    </div>
  `;
  
  // Setup audio elements
  audioElements = Array.from(document.querySelectorAll('.audio-segment'));
  let isPlayingAll = false; // Flag to track if playing all segments
  
  // Debounce timers for auto-regeneration
  const regenerationTimers = {};
  
  // Auto-regeneration function
  async function autoRegenerateSegment(index, delay = 1000) {
    // Clear existing timer for this segment
    if (regenerationTimers[index]) {
      clearTimeout(regenerationTimers[index]);
    }
    
    // Set new timer
    regenerationTimers[index] = setTimeout(async () => {
      console.log(`🔄 Auto-regenerating segment ${index}...`);
      await regenerateSegmentAudio(index, false); // false = no confirmation dialog
    }, delay);
  }
  
  // Shared regeneration function
  async function regenerateSegmentAudio(index, showConfirmation = true) {
    const segment = currentState.audioSegments[index];
    
    if (!segment.text) {
      alert('テキストがありません');
      return;
    }
    
    // Show confirmation if requested
    if (showConfirmation) {
      if (!confirm(`「${segment.text.substring(0, 30)}...」の音声を再生成しますか？`)) {
        return;
      }
    }
    
    // Find the segment container and show loading indicator
    const segmentContainer = document.querySelector(`.draggable-segment[data-segment-index="${index}"]`);
    const playButton = segmentContainer?.querySelector('.play-segment-btn');
    const originalPlayButtonHTML = playButton?.innerHTML;
    
    if (playButton) {
      playButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      playButton.disabled = true;
    }
    
    try {
      // Read current textarea value with marks
      const textarea = document.querySelector(`.audio-voice-instruction[data-segment-index="${index}"]`);
      const currentTextWithMarks = textarea ? textarea.value : segment.text;
      
      // Read current segment text (may have been edited)
      const textEditor = document.querySelector(`.segment-text-editor[data-segment-index="${index}"]`);
      if (textEditor) {
        segment.text = textEditor.value;
      }
      
      // Check if text contains marks that need conversion
      const hasMarks = /\[(0\.2秒間|0\.5秒間|1秒間|2秒間|速く|ゆっくり)\]/.test(currentTextWithMarks);
      
      let ssmlToUse = segment.ssmlInstructions || '';
      
      // If marks are present, convert them to SSML first
      if (hasMarks) {
        try {
          const conversionResponse = await axios.post('/api/convert-to-ssml', {
            text: segment.text,
            instructions: currentTextWithMarks
          });
          
          if (conversionResponse.data.success) {
            ssmlToUse = conversionResponse.data.ssml;
            segment.ssmlInstructions = ssmlToUse;
            segment.voiceInstructions = currentTextWithMarks;
          }
        } catch (convError) {
          console.error('Mark conversion error:', convError);
        }
      }
      
      // Find speaker settings
      let speaker = null;
      let speakerWithSpeed = null;
      
      if (segment.type === 'narration' || segment.isNarration || segment.speaker === 'Narration') {
        const narratorLanguage = segment.narratorLanguage || currentState.narratorSettings?.language || 'en';
        
        speaker = {
          name: 'Narration',
          language: narratorLanguage,
          accent: currentState.narratorSettings?.accent || 'US',
          gender: segment.gender || currentState.narratorSettings?.gender || 'male',
          voiceStyle: segment.voiceStyle || currentState.narratorSettings?.voiceStyle || 'neutral',
          speed: segment.overallSpeed || 1.0
        };
        speakerWithSpeed = speaker;
        
        if (!currentState.narratorSettings) currentState.narratorSettings = {};
        currentState.narratorSettings.language = narratorLanguage;
        currentState.narratorSettings.gender = speaker.gender;
        currentState.narratorSettings.voiceStyle = speaker.voiceStyle;
      } else {
        speaker = currentState.speakers.find(s => s.name === segment.speaker);
        if (!speaker) {
          throw new Error(`話者が見つかりません: ${segment.speaker}`);
        }
        
        speakerWithSpeed = { ...speaker };
        
        if (segment.gender) speakerWithSpeed.gender = segment.gender;
        if (segment.voiceStyle) speakerWithSpeed.voiceStyle = segment.voiceStyle;
        if (segment.language) speakerWithSpeed.language = segment.language;
        if (segment.accent) speakerWithSpeed.accent = segment.accent;
        if (segment.overallSpeed && segment.overallSpeed !== 1.0) {
          speakerWithSpeed.speed = segment.overallSpeed;
        }
      }
      
      const parsedLine = {
        speaker: segment.speaker,
        text: segment.text,
        type: segment.type || 'dialogue',
        isNarration: segment.type === 'narration' || segment.isNarration,
        pauseAfter: segment.pauseAfter || 0.5,
        ssmlInstructions: ssmlToUse,
        voiceInstructions: currentTextWithMarks
      };
      
      // Generate audio
      const response = await axios.post('/api/generate-audio', {
        script: segment.text,
        speakers: [speakerWithSpeed],
        narratorSettings: currentState.narratorSettings,
        parsedLines: [parsedLine],
        questions: [],
        questionReader: null,
        useGeminiTTS: currentState.useGeminiTTS || false
      });
      
      if (response.data.success && response.data.audioSegments && response.data.audioSegments.length > 0) {
        // Update audio in state
        const newAudio = response.data.audioSegments[0].audio;
        currentState.audioSegments[index].audio = newAudio;
        
        // Update audio element
        const audioElement = document.querySelector(`.audio-segment[data-index="${index}"]`);
        if (audioElement) {
          audioElement.src = `data:audio/mp3;base64,${newAudio}`;
          audioElement.dataset.rawAudio = newAudio;
          audioElement.load();
        }
        
        console.log(`✅ Segment ${index} audio regenerated`);
      } else {
        throw new Error(response.data.error || '音声セグメントが生成されませんでした');
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      alert('音声再生成中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
    } finally {
      // Restore button
      if (playButton && originalPlayButtonHTML) {
        playButton.innerHTML = originalPlayButtonHTML;
        playButton.disabled = false;
      }
    }
  }
  
  // Play all button
  document.getElementById('playAllButton').addEventListener('click', () => {
    isPlayingAll = true; // Enable continuous playback
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
    isPlayingAll = false; // Disable continuous playback
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
      // Remove event listeners to stop auto-play
      if (audio._endedHandler) {
        audio.removeEventListener('ended', audio._endedHandler);
        audio._endedHandler = null;
      }
    });
    currentAudioIndex = 0;
  });
  
  // Initialize audio sources - Google TTS returns MP3
  const audioElementsOnPage = document.querySelectorAll('.audio-segment');
  console.log('🎵 Found', audioElementsOnPage.length, 'audio elements');
  audioElementsOnPage.forEach((audioEl, index) => {
    const rawAudio = audioEl.dataset.rawAudio;
    console.log(`🎵 Audio ${index}: data length =`, rawAudio ? rawAudio.length : 0);
    if (rawAudio && rawAudio.length > 0) {
      audioEl.src = `data:audio/mp3;base64,${rawAudio}`;
      console.log(`✅ Audio ${index}: src set, first 50 chars:`, rawAudio.substring(0, 50));
      // Load the audio to ensure it's ready to play
      audioEl.load();
      console.log(`✅ Audio ${index}: load() called`);
    } else {
      console.error(`❌ Audio ${index}: no data!`);
    }
  });

  // Individual segment play buttons
  document.querySelectorAll('.play-segment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      isPlayingAll = false; // Disable continuous playback for individual play
      const index = parseInt(e.currentTarget.dataset.index);
      console.log('🎵 Play button clicked, segment index:', index);
      
      // Find the audio element with matching data-index (not array index)
      const audioElement = document.querySelector(`.audio-segment[data-index="${index}"]`);
      console.log('🎵 Found audio element:', audioElement);
      console.log('🎵 Audio src:', audioElement?.src);
      
      if (!audioElement) {
        console.error(`❌ Audio element with data-index ${index} not found!`);
        return;
      }
      
      // Stop all other audio elements
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      
      // Play the selected segment
      console.log(`🎵 Attempting to play audio segment ${index}...`);
      console.log(`🎵 Audio ready state:`, audioElement.readyState);
      console.log(`🎵 Audio src exists:`, !!audioElement.src);
      console.log(`🎵 Audio duration:`, audioElement.duration);
      
      audioElement.play().then(() => {
        console.log('✅ Audio playing successfully');
      }).catch(err => {
        console.error('❌ Play failed:', err);
        console.error('❌ Error name:', err.name);
        console.error('❌ Error message:', err.message);
      });
    });
  });
  
  // Narrator language selector for narration segments
  document.querySelectorAll('.segment-narrator-language-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.segmentIndex);
      const language = e.target.value;
      currentState.audioSegments[index].narratorLanguage = language;
      
      // Update global narrator settings
      if (!currentState.narratorSettings) currentState.narratorSettings = {};
      currentState.narratorSettings.language = language;
      
      console.log(`ナレーション言語変更: セグメント${index} → ${language}`);
      
      // Auto-regenerate
      autoRegenerateSegment(index);
    });
  });
  
  // Speaker language selector for dialogue segments
  document.querySelectorAll('.segment-speaker-language-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.segmentIndex);
      const language = e.target.value;
      currentState.audioSegments[index].language = language;
      
      // Update speaker info if this segment has a speaker
      const segment = currentState.audioSegments[index];
      if (segment.speaker && segment.speaker !== 'Narration') {
        const speaker = currentState.speakers.find(s => s.name === segment.speaker);
        if (speaker) {
          speaker.language = language;
        }
      }
      
      console.log(`話者言語変更: セグメント${index} → ${language}`);
      
      // Auto-regenerate
      autoRegenerateSegment(index);
    });
  });
  
  // Question language selector for question/option segments
  document.querySelectorAll('.segment-question-language-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.segmentIndex);
      const language = e.target.value;
      currentState.audioSegments[index].language = language;
      
      // Update questionReader settings
      if (!currentState.questionReader) currentState.questionReader = {};
      currentState.questionReader.language = language;
      
      console.log(`問題言語変更: セグメント${index} → ${language}`);
      
      // Auto-regenerate
      autoRegenerateSegment(index);
    });
  });
  
  // Gender selector for each segment
  document.querySelectorAll('.segment-gender-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.segmentIndex);
      const gender = e.target.value;
      currentState.audioSegments[index].gender = gender;
      
      // Update speaker info if this segment has a speaker
      const segment = currentState.audioSegments[index];
      if (segment.speaker && segment.speaker !== 'Narration') {
        const speaker = currentState.speakers.find(s => s.name === segment.speaker);
        if (speaker) {
          speaker.gender = gender;
        }
      }
      
      // Auto-regenerate
      autoRegenerateSegment(index);
    });
  });
  
  // Voice style selector for each segment
  document.querySelectorAll('.segment-voiceStyle-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.segmentIndex);
      const voiceStyle = e.target.value;
      currentState.audioSegments[index].voiceStyle = voiceStyle;
      
      // Update speaker info if this segment has a speaker
      const segment = currentState.audioSegments[index];
      if (segment.speaker && segment.speaker !== 'Narration') {
        const speaker = currentState.speakers.find(s => s.name === segment.speaker);
        if (speaker) {
          speaker.voiceStyle = voiceStyle;
        }
      }
      
      // Auto-regenerate
      autoRegenerateSegment(index);
    });
  });
  
  // Speed slider for each segment
  document.querySelectorAll('.segment-speed-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const index = parseInt(e.target.dataset.segmentIndex);
      const speed = parseFloat(e.target.value);
      currentState.audioSegments[index].overallSpeed = speed;
      
      // Update display value
      const valueDisplay = e.target.closest('.flex').querySelector('.segment-speed-value');
      valueDisplay.textContent = speed.toFixed(2) + 'x';
    });
    
    // Auto-regenerate on change (when user releases slider)
    slider.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.segmentIndex);
      autoRegenerateSegment(index);
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
  
  // Note: "Convert to SSML" button removed - users can directly regenerate audio with marks
  
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
  
  // Insert mark buttons - moved to end of function with auto-regenerate feature
  
  // ===== AUTO-REGENERATE FUNCTION =====
  // Shared function to regenerate audio for a segment automatically
  async function autoRegenerateSegment(index) {
    const segment = currentState.audioSegments[index];
      
      if (!segment.text) {
        console.warn('テキストがないため、音声を再生成できません');
        return;
      }
      
      // Show loading indicator in segment
      const segmentDiv = document.querySelector(`.draggable-segment[data-segment-index="${index}"]`);
      if (segmentDiv) {
        segmentDiv.style.opacity = '0.6';
        segmentDiv.style.pointerEvents = 'none';
      }
      
      try {
        // ★★★ CRITICAL FIX: Read current textarea value with marks ★★★
        const textarea = document.querySelector(`.audio-voice-instruction[data-segment-index="${index}"]`);
        const currentTextWithMarks = textarea ? textarea.value : segment.text;
        
        // Check if text contains marks that need conversion
        const hasMarks = /\[(0\.2秒間|0\.5秒間|1秒間|2秒間|速く|ゆっくり)\]/.test(currentTextWithMarks);
        
        let ssmlToUse = segment.ssmlInstructions || '';
        
        // If marks are present, convert them to SSML first
        if (hasMarks) {
          try {
            const conversionResponse = await axios.post('/api/convert-to-ssml', {
              text: segment.text,
              instructions: currentTextWithMarks
            });
            
            if (conversionResponse.data.success) {
              ssmlToUse = conversionResponse.data.ssml;
              // Update the segment state with converted SSML
              segment.ssmlInstructions = ssmlToUse;
              segment.voiceInstructions = currentTextWithMarks;
            }
          } catch (convError) {
            console.error('Mark conversion error:', convError);
            // Continue with old SSML if conversion fails
          }
        }
        
        // Find speaker settings (if not narration)
        let speaker = null;
        let speakerWithSpeed = null;
        
        if (segment.type === 'narration' || segment.isNarration || segment.speaker === 'Narration') {
          // For narration, create a default speaker with narrator settings
          // Use segment-specific language if available, otherwise use global narrator settings
          const narratorLanguage = segment.narratorLanguage || currentState.narratorSettings?.language || 'en';
          
          console.log('🎙️ Regenerating narration segment:', {
            segmentGender: segment.gender,
            globalGender: currentState.narratorSettings?.gender,
            narratorLanguage: narratorLanguage,
            segmentVoiceStyle: segment.voiceStyle
          });
          
          speaker = {
            name: 'Narration',
            language: narratorLanguage,  // ← CRITICAL: Added language field
            accent: currentState.narratorSettings?.accent || 'US',
            gender: segment.gender || currentState.narratorSettings?.gender || 'male',
            voiceStyle: segment.voiceStyle || currentState.narratorSettings?.voiceStyle || 'neutral',
            speed: segment.overallSpeed || 1.0
          };
          speakerWithSpeed = speaker;
          
          console.log('🎯 Final narrator speaker config:', speakerWithSpeed);
          
          // Update narrator settings with current segment language
          if (!currentState.narratorSettings) currentState.narratorSettings = {};
          currentState.narratorSettings.language = narratorLanguage;
          currentState.narratorSettings.gender = speaker.gender;  // ← Also update gender
          currentState.narratorSettings.voiceStyle = speaker.voiceStyle;  // ← Also update voiceStyle
        } else if (segment.type === 'question' || segment.type === 'option') {
          // For questions/options, use questionReader settings
          const questionLanguage = segment.language || currentState.questionReader?.language || 'en';
          
          console.log('❓ Regenerating question/option segment:', {
            segmentGender: segment.gender,
            globalGender: currentState.questionReader?.gender,
            questionLanguage: questionLanguage,
            segmentVoiceStyle: segment.voiceStyle
          });
          
          speaker = {
            name: 'Question Reader',
            language: questionLanguage,
            accent: currentState.questionReader?.accent || 'US',
            gender: segment.gender || currentState.questionReader?.gender || 'male',
            voiceStyle: segment.voiceStyle || currentState.questionReader?.voiceStyle || 'neutral',
            speed: segment.overallSpeed || currentState.questionReader?.speed || 1.0
          };
          speakerWithSpeed = speaker;
          
          console.log('🎯 Final question reader config:', speakerWithSpeed);
          
          // Update questionReader settings
          if (!currentState.questionReader) currentState.questionReader = {};
          currentState.questionReader.language = questionLanguage;
          currentState.questionReader.gender = speaker.gender;
          currentState.questionReader.voiceStyle = speaker.voiceStyle;
        } else {
          // For dialogue, find the speaker
          console.log('DEBUG: Looking for speaker:', segment.speaker);
          console.log('DEBUG: Available speakers:', currentState.speakers);
          
          speaker = currentState.speakers.find(s => s.name === segment.speaker);
          if (!speaker) {
            console.error('話者が見つかりません。Segment speaker:', segment.speaker, 'Available:', currentState.speakers.map(s => s.name));
            throw new Error(`話者が見つかりません: ${segment.speaker}`);
          }
          
          // Apply segment-specific settings (gender, voiceStyle, speed) if changed
          speakerWithSpeed = { ...speaker };
          
          // Use segment-specific gender if set (from UI selector)
          if (segment.gender) {
            speakerWithSpeed.gender = segment.gender;
            console.log(`✏️ Using segment-specific gender: ${segment.gender}`);
          }
          
          // Use segment-specific voiceStyle if set (from UI selector)
          if (segment.voiceStyle) {
            speakerWithSpeed.voiceStyle = segment.voiceStyle;
            console.log(`✏️ Using segment-specific voiceStyle: ${segment.voiceStyle}`);
          }
          
          // Use segment-specific language if set (from UI selector)
          if (segment.language) {
            speakerWithSpeed.language = segment.language;
            console.log(`✏️ Using segment-specific language: ${segment.language}`);
          }
          
          // Use segment-specific accent if set (from UI selector)
          if (segment.accent) {
            speakerWithSpeed.accent = segment.accent;
            console.log(`✏️ Using segment-specific accent: ${segment.accent}`);
          }
          
          // Apply overall speed to speaker if set
          if (segment.overallSpeed && segment.overallSpeed !== 1.0) {
            speakerWithSpeed.speed = segment.overallSpeed;
          }
          
          console.log('🎤 Final speaker config for regeneration:', speakerWithSpeed);
        }
        
        // Prepare parsedLine for single segment regeneration
        const parsedLine = {
          speaker: segment.speaker,
          text: segment.text,
          type: segment.type || 'dialogue',
          isNarration: segment.type === 'narration' || segment.isNarration,
          pauseAfter: segment.pauseAfter || 0.5,
          ssmlInstructions: ssmlToUse,
          voiceInstructions: currentTextWithMarks
        };
        
        // Generate audio using the full API with single segment
        const response = await axios.post('/api/generate-audio', {
          script: segment.text,
          speakers: [speakerWithSpeed],
          narratorSettings: currentState.narratorSettings,
          parsedLines: [parsedLine],
          questions: [],
          questionReader: null,
          useGeminiTTS: currentState.useGeminiTTS || false
        });
        
        if (response.data.success && response.data.audioSegments && response.data.audioSegments.length > 0) {
          // Update audio in state
          const newAudio = response.data.audioSegments[0].audio;
          currentState.audioSegments[index].audio = newAudio;
          
          // Update audio element
          const audioElement = document.querySelector(`.audio-segment[data-index="${index}"]`);
          audioElement.src = `data:audio/mp3;base64,${newAudio}`;
          audioElement.dataset.rawAudio = newAudio;
          audioElement.load();
          
          // Play the new audio automatically
          audioElement.play();
          
          console.log('✅ 音声を自動再生成しました (セグメント ' + index + ')');
        } else {
          console.error('音声生成エラー:', response.data.error || '音声セグメントが生成されませんでした');
        }
      } catch (error) {
        console.error('Regeneration error:', error);
        console.error('音声再生成中にエラーが発生しました:', error.response?.data?.error || error.message);
      } finally {
        // Restore segment opacity
        if (segmentDiv) {
          segmentDiv.style.opacity = '1';
          segmentDiv.style.pointerEvents = 'auto';
        }
      }
  }
  
  // Download MP3 button - Call backend to merge audio with blanks, then use Web Audio API
  document.getElementById('downloadMp3Button').addEventListener('click', async () => {
    const btn = document.getElementById('downloadMp3Button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>ブランクを挿入中...';
    
    console.log('🎵 Downloading audio with', currentState.audioSegments.length, 'segments');
    
    try {
      // Step 1: Call backend to merge audio segments with silence blocks
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>サーバーで統合中...';
      
      // Filter out silence segments (only send audio segments to backend)
      const audioOnlySegments = currentState.audioSegments.filter(seg => seg.type !== 'silence');
      console.log(`📤 Sending ${audioOnlySegments.length} audio segments to backend (excluding existing silence)`);
      
      const mergeResponse = await axios.post('/api/merge-audio', {
        audioSegments: audioOnlySegments
      });
      
      if (!mergeResponse.data.success) {
        throw new Error(mergeResponse.data.error || 'サーバーでの統合に失敗しました');
      }
      
      const mergedSegments = mergeResponse.data.mergedSegments;
      console.log(`✅ Server merged into ${mergedSegments.length} blocks (audio + silence)`);
      
      // Step 2: Use Web Audio API to decode and concatenate all blocks
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>デコード中...';
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffers = [];
      
      // Decode all blocks (including silence blocks)
      for (let i = 0; i < mergedSegments.length; i++) {
        const block = mergedSegments[i];
        const base64Audio = block.audio;
        
        // Convert base64 to ArrayBuffer
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        
        // Decode MP3 to AudioBuffer
        try {
          const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
          audioBuffers.push(audioBuffer);
          const blockType = block.type === 'silence' ? '⏸️ Silence' : '🎤 Audio';
          console.log(`✅ Decoded block ${i+1}/${mergedSegments.length} (${blockType}): ${audioBuffer.duration.toFixed(2)}s`);
        } catch (decodeError) {
          console.error(`❌ Failed to decode block ${i}:`, decodeError);
          throw new Error(`ブロック ${i+1} のデコードに失敗しました`);
        }
      }
      
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>連結中...';
      
      // Calculate total length
      const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.length, 0);
      const totalDuration = audioBuffers.reduce((sum, buf) => sum + buf.duration, 0);
      console.log(`📊 Total duration: ${totalDuration.toFixed(2)}s, Total samples: ${totalLength}`);
      
      // Create a single merged AudioBuffer
      const numberOfChannels = audioBuffers[0].numberOfChannels;
      const sampleRate = audioBuffers[0].sampleRate;
      const mergedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);
      
      // Copy all audio data into merged buffer
      let offset = 0;
      for (const buffer of audioBuffers) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          mergedBuffer.getChannelData(channel).set(buffer.getChannelData(channel), offset);
        }
        offset += buffer.length;
      }
      
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>エンコード中...';
      
      // Convert AudioBuffer to WAV (we'll use WAV instead of MP3 for now)
      const wavBlob = audioBufferToWav(mergedBuffer);
      
      // Download the merged audio
      const url = window.URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'listening-test-' + Date.now() + '.wav';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download mr-2"></i>MP3ダウンロード（結合済み）';
      
      console.log('✅ Download complete');
    } catch (error) {
      console.error('MP3結合エラー:', error);
      alert('MP3結合エラー: ' + error.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download mr-2"></i>MP3ダウンロード（結合済み）';
    }
  });
  
  // Helper function to convert AudioBuffer to WAV Blob
  function audioBufferToWav(buffer) {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;
    
    // Write WAV header
    const setUint16 = (data) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data) => { view.setUint32(pos, data, true); pos += 4; };
    
    // "RIFF" chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(36 + length); // file length - 8
    setUint32(0x45564157); // "WAVE"
    
    // "fmt " sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // fmt chunk size
    setUint16(1); // audio format (1 = PCM)
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * buffer.numberOfChannels * 2); // byte rate
    setUint16(buffer.numberOfChannels * 2); // block align
    setUint16(16); // bits per sample
    
    // "data" sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length);
    
    // Write audio data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    while (pos < arrayBuffer.byteLength) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = channels[i][offset];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
      offset++;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
  
  // Pause/blank input change handler
  document.querySelectorAll('.segment-pause-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.segmentIndex);
      const pauseValue = parseFloat(e.target.value) || 0;
      
      // Find the actual non-silence segment
      const segment = currentState.audioSegments[index];
      if (segment && segment.type !== 'silence') {
        segment.pauseAfter = pauseValue;
        console.log(`✅ ブランク更新: セグメント${index} (${segment.speaker}) → ${pauseValue}秒`);
        console.log(`   セグメントタイプ: ${segment.type}`);
      } else {
        console.error(`❌ セグメント${index}が見つからないか、サイレンスセグメントです`);
      }
    });
  });
  
  // Update blanks button - Regenerate silence segments based on current pauseAfter values
  document.getElementById('updateBlanksButton').addEventListener('click', async () => {
    const btn = document.getElementById('updateBlanksButton');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>サイレンスを再生成中...';
    
    try {
      console.log('🔄 Regenerating silence segments...');
      
      // Log current state before processing
      console.log('📊 Current audioSegments before filtering:');
      currentState.audioSegments.forEach((seg, idx) => {
        console.log(`  [${idx}] ${seg.speaker} (${seg.type}) - pauseAfter: ${seg.pauseAfter || 0}s`);
      });
      
      // STEP 1: Remove all existing silence segments FIRST
      currentState.audioSegments = currentState.audioSegments.filter(seg => seg.type !== 'silence');
      console.log(`✅ Removed old silence segments. Remaining: ${currentState.audioSegments.length} segments`);
      
      // Log segments after filtering
      console.log('📊 Segments after removing silence:');
      currentState.audioSegments.forEach((seg, idx) => {
        console.log(`  [${idx}] ${seg.speaker} (${seg.type}) - pauseAfter: ${seg.pauseAfter || 0}s`);
      });
      
      // STEP 2: Read current pauseAfter values from UI input fields (now without silence segments)
      // We need to map visible segment display index to actual array index after silence removal
      console.log('📝 Reading pauseAfter values from UI inputs...');
      const pauseInputs = document.querySelectorAll('.segment-pause-input');
      const visibleSegments = currentState.audioSegments.filter(seg => seg.type !== 'silence');
      
      pauseInputs.forEach((input, displayIndex) => {
        const pauseValue = parseFloat(input.value) || 0;
        // Use displayIndex to access the correct visible segment
        const segment = visibleSegments[displayIndex];
        if (segment) {
          segment.pauseAfter = pauseValue;
          console.log(`  📝 Updated visible segment ${displayIndex} (${segment.speaker}): pauseAfter = ${pauseValue}s`);
        }
      });
      
      // Insert new silence segments based on current pauseAfter values
      const newSegments = [];
      for (let i = 0; i < currentState.audioSegments.length; i++) {
        const segment = currentState.audioSegments[i];
        newSegments.push(segment);
        
        const pauseAfter = segment.pauseAfter || 0;
        console.log(`🔍 Checking segment ${i} (${segment.speaker}): pauseAfter = ${pauseAfter}s`);
        
        if (pauseAfter > 0) {
          // Request silence from backend
          console.log(`⏸️ Generating ${pauseAfter}s silence after segment ${i} (${segment.speaker})...`);
          
          const silenceResponse = await axios.post('/api/generate-silence', {
            duration: pauseAfter
          });
          
          if (silenceResponse.data.success) {
            newSegments.push({
              speaker: 'Silence',
              audio: silenceResponse.data.silenceBase64,
              pauseAfter: 0,
              type: 'silence',
              text: `[Silence: ${pauseAfter}s]`
            });
            console.log(`✅ Added ${pauseAfter}s silence after ${segment.speaker}`);
          } else {
            console.error(`❌ Failed to generate silence for segment ${i}`);
          }
        } else {
          console.log(`⏭️ No silence needed after segment ${i} (${segment.speaker})`);
        }
      }
      
      currentState.audioSegments = newSegments;
      console.log(`✅ Total segments after update: ${currentState.audioSegments.length}`);
      
      // Re-render the screen to update all data-segment-index attributes
      console.log('🔄 Re-rendering screen to update UI...');
      showAudioResult();
      
      alert('ブランクの反映が完了しました。ダウンロードできます。');
    } catch (error) {
      console.error('Silence regeneration error:', error);
      alert('サイレンス再生成エラー: ' + error.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>ブランクを反映（サイレンス再生成）';
    }
  });
  
  // Save to folder button
  document.getElementById('saveToFolderButton').addEventListener('click', async () => {
    await showSaveToFolderDialog();
  });
  
  // Move segment up button
  document.querySelectorAll('.move-segment-up-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      if (index > 0) {
        // Swap segments
        const temp = currentState.audioSegments[index];
        currentState.audioSegments[index] = currentState.audioSegments[index - 1];
        currentState.audioSegments[index - 1] = temp;
        
        // Re-render audio result screen
        showAudioResult();
        
        console.log(`✅ Segment ${index} moved up`);
      }
    });
  });
  
  // Move segment down button
  document.querySelectorAll('.move-segment-down-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      if (index < currentState.audioSegments.length - 1) {
        // Swap segments
        const temp = currentState.audioSegments[index];
        currentState.audioSegments[index] = currentState.audioSegments[index + 1];
        currentState.audioSegments[index + 1] = temp;
        
        // Re-render audio result screen
        showAudioResult();
        
        console.log(`✅ Segment ${index} moved down`);
      }
    });
  });
  
  // Back to script editing button
  document.getElementById('backToScriptButton').addEventListener('click', () => {
    currentState.screen = 'scriptResult';
    renderScreen();
  });
  
  document.getElementById('backToInputFromAudioButton').addEventListener('click', () => {
    currentState.screen = 'input';
    currentState.generatedScript = '';
    currentState.generatedQuestions = [];
    currentState.speakers = [];
    currentState.audioSegments = null;
    renderScreen();
  });
  
  // ===== NEW: Segment text editor listeners =====
  document.querySelectorAll('.segment-text-editor').forEach(textarea => {
    textarea.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.segmentIndex);
      const newText = e.target.value;
      
      // Update segment text in state
      currentState.audioSegments[index].text = newText;
      
      // Also update voiceInstructions if it exists
      const voiceInstructionTextarea = document.querySelector(`.audio-voice-instruction[data-segment-index="${index}"]`);
      if (voiceInstructionTextarea && !voiceInstructionTextarea.value.includes('[')) {
        // Only update if no marks have been added yet
        voiceInstructionTextarea.value = newText;
      }
      
      console.log(`✏️ Segment ${index} text updated to: ${newText.substring(0, 50)}...`);
      
      // Auto-regenerate with updated text
      autoRegenerateSegment(index);
    });
  });
  
  // ===== NEW: Drag and drop functionality =====
  let draggedIndex = null;
  
  document.querySelectorAll('.draggable-segment').forEach(segment => {
    segment.addEventListener('dragstart', (e) => {
      draggedIndex = parseInt(e.currentTarget.dataset.segmentIndex);
      e.currentTarget.style.opacity = '0.5';
      console.log('Drag started:', draggedIndex);
    });
    
    segment.addEventListener('dragend', (e) => {
      e.currentTarget.style.opacity = '1';
    });
    
    segment.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.currentTarget.style.borderTop = '3px solid blue';
    });
    
    segment.addEventListener('dragleave', (e) => {
      e.currentTarget.style.borderTop = '';
    });
    
    segment.addEventListener('drop', (e) => {
      e.preventDefault();
      e.currentTarget.style.borderTop = '';
      
      const dropIndex = parseInt(e.currentTarget.dataset.segmentIndex);
      
      if (draggedIndex !== null && draggedIndex !== dropIndex) {
        // Reorder segments
        const draggedSegment = currentState.audioSegments[draggedIndex];
        currentState.audioSegments.splice(draggedIndex, 1);
        currentState.audioSegments.splice(dropIndex, 0, draggedSegment);
        
        console.log(`Moved segment ${draggedIndex} to ${dropIndex}`);
        
        // Re-render
        showAudioResult();
      }
      
      draggedIndex = null;
    });
  });
  
  // ===== NEW: Auto-regenerate audio when marks are inserted =====
  document.querySelectorAll('.insert-mark-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const index = parseInt(e.currentTarget.dataset.segmentIndex);
      const mark = e.currentTarget.dataset.mark;
      const textarea = document.querySelector(`.audio-voice-instruction[data-segment-index="${index}"]`);
      
      // Insert mark at cursor position
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      textarea.value = before + mark + after;
      
      // Move cursor after inserted mark
      const newPos = start + mark.length;
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
      textarea.focus();
      
      // Auto-trigger regeneration immediately
      console.log(`マーク「${mark}」を挿入しました。音声を自動再生成します...`);
      setTimeout(() => {
        autoRegenerateSegment(index);
      }, 500);
    });
  });
}

// ========================================
// User Management Admin Screen
// ========================================

function renderUserManagementScreen() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-users mr-2"></i>ユーザー管理
        </h2>
        <div class="space-x-2">
          <button id="addUserButton" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
            <i class="fas fa-user-plus mr-2"></i>新規ユーザー追加
          </button>
          <button id="backToMainButton" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            <i class="fas fa-arrow-left mr-2"></i>戻る
          </button>
        </div>
      </div>
      
      <div id="usersTableContainer">
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
          <p class="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    </div>
    
    <!-- Add/Edit User Modal -->
    <div id="userModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 id="modalTitle" class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-user-plus mr-2"></i>新規ユーザー追加
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ユーザー名 *</label>
            <input type="text" id="modalUsername" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="3文字以上">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">パスワード *</label>
            <input type="password" id="modalPassword" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="6文字以上">
            <p id="passwordHint" class="text-xs text-gray-500 mt-1">新規作成時は必須、編集時は変更する場合のみ入力</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input type="email" id="modalEmail" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="例: user@example.com">
          </div>
          
          <div class="flex items-center space-x-4">
            <label class="flex items-center">
              <input type="checkbox" id="modalIsAdmin" class="mr-2">
              <span class="text-sm text-gray-700">管理者権限</span>
            </label>
            
            <label class="flex items-center">
              <input type="checkbox" id="modalIsActive" class="mr-2" checked>
              <span class="text-sm text-gray-700">有効</span>
            </label>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2 mt-6">
          <button id="modalCancelButton" class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors">
            キャンセル
          </button>
          <button id="modalSaveButton" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            <i class="fas fa-save mr-2"></i>保存
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Load users
  loadUsers();
  
  // Event listeners
  document.getElementById('addUserButton').addEventListener('click', () => {
    openUserModal();
  });
  
  document.getElementById('backToMainButton').addEventListener('click', () => {
    currentState.screen = 'input';
    renderScreen();
  });
  
  document.getElementById('modalCancelButton').addEventListener('click', () => {
    closeUserModal();
  });
  
  document.getElementById('modalSaveButton').addEventListener('click', () => {
    saveUser();
  });
}

async function loadUsers() {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await axios.get('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      displayUsersTable(response.data.users);
    } else {
      throw new Error(response.data.error || 'ユーザー一覧の取得に失敗しました');
    }
  } catch (error) {
    console.error('Load users error:', error);
    document.getElementById('usersTableContainer').innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
        <p class="mt-2 text-red-600">${error.response?.data?.error || error.message}</p>
        <button onclick="loadUsers()" class="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
          再読み込み
        </button>
      </div>
    `;
  }
}

function displayUsersTable(users) {
  const container = document.getElementById('usersTableContainer');
  
  if (users.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-users text-4xl text-gray-400"></i>
        <p class="mt-2 text-gray-600">ユーザーがまだ登録されていません</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー名</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">権限</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最終ログイン</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${users.map(user => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.id}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.username}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${user.is_admin ? '<span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">管理者</span>' : '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">一般</span>'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${user.is_active ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">有効</span>' : '<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">無効</span>'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.last_login_at ? new Date(user.last_login_at).toLocaleString('ja-JP') : '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <button onclick="editUser(${user.id})" class="text-blue-600 hover:text-blue-800">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteUser(${user.id}, '${user.username}')" class="text-red-600 hover:text-red-800">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openUserModal(userId = null) {
  const modal = document.getElementById('userModal');
  const title = document.getElementById('modalTitle');
  const usernameInput = document.getElementById('modalUsername');
  const passwordInput = document.getElementById('modalPassword');
  const emailInput = document.getElementById('modalEmail');
  const isAdminCheckbox = document.getElementById('modalIsAdmin');
  const isActiveCheckbox = document.getElementById('modalIsActive');
  const passwordHint = document.getElementById('passwordHint');
  
  if (userId) {
    // Edit mode
    title.innerHTML = '<i class="fas fa-user-edit mr-2"></i>ユーザー編集';
    passwordHint.textContent = '変更する場合のみ入力してください';
    
    // Load user data
    const token = localStorage.getItem('authToken');
    axios.get('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(response => {
      if (response.data.success) {
        const user = response.data.users.find(u => u.id === userId);
        if (user) {
          usernameInput.value = user.username;
          usernameInput.disabled = true; // Cannot change username
          emailInput.value = user.email || '';
          isAdminCheckbox.checked = user.is_admin === 1;
          isActiveCheckbox.checked = user.is_active === 1;
          passwordInput.value = '';
          
          modal.dataset.userId = userId;
        }
      }
    });
  } else {
    // Add mode
    title.innerHTML = '<i class="fas fa-user-plus mr-2"></i>新規ユーザー追加';
    passwordHint.textContent = '6文字以上で入力してください';
    usernameInput.value = '';
    usernameInput.disabled = false;
    passwordInput.value = '';
    emailInput.value = '';
    isAdminCheckbox.checked = false;
    isActiveCheckbox.checked = true;
    delete modal.dataset.userId;
  }
  
  modal.classList.remove('hidden');
}

function closeUserModal() {
  const modal = document.getElementById('userModal');
  modal.classList.add('hidden');
}

async function saveUser() {
  const modal = document.getElementById('userModal');
  const userId = modal.dataset.userId;
  const username = document.getElementById('modalUsername').value.trim();
  const password = document.getElementById('modalPassword').value;
  const email = document.getElementById('modalEmail').value.trim();
  const isAdmin = document.getElementById('modalIsAdmin').checked;
  const isActive = document.getElementById('modalIsActive').checked;
  
  // Validation
  if (!userId && !username) {
    alert('ユーザー名を入力してください');
    return;
  }
  
  if (!userId && !password) {
    alert('パスワードを入力してください');
    return;
  }
  
  if (!userId && username.length < 3) {
    alert('ユーザー名は3文字以上で入力してください');
    return;
  }
  
  if (password && password.length < 6) {
    alert('パスワードは6文字以上で入力してください');
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const saveButton = document.getElementById('modalSaveButton');
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
    
    let response;
    
    if (userId) {
      // Update user
      response = await axios.put(`/api/admin/users/${userId}`, {
        email,
        is_admin: isAdmin,
        is_active: isActive,
        password: password || undefined
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } else {
      // Create user
      response = await axios.post('/api/admin/users', {
        username,
        password,
        email,
        is_admin: isAdmin
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    
    if (response.data.success) {
      closeUserModal();
      loadUsers();
      alert(response.data.message);
    } else {
      throw new Error(response.data.error || '保存に失敗しました');
    }
  } catch (error) {
    console.error('Save user error:', error);
    alert(error.response?.data?.error || error.message);
  } finally {
    const saveButton = document.getElementById('modalSaveButton');
    saveButton.disabled = false;
    saveButton.innerHTML = '<i class="fas fa-save mr-2"></i>保存';
  }
}

async function deleteUser(userId, username) {
  if (!confirm(`ユーザー「${username}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await axios.delete(`/api/admin/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      loadUsers();
      alert(response.data.message);
    } else {
      throw new Error(response.data.error || '削除に失敗しました');
    }
  } catch (error) {
    console.error('Delete user error:', error);
    alert(error.response?.data?.error || error.message);
  }
}

window.editUser = function(userId) {
  openUserModal(userId);
};

window.deleteUser = deleteUser;

// ============================================
// Menu Screen (after login)
// ============================================

function renderMenuScreen() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 -m-8 relative overflow-hidden">
      <!-- Background decorative elements -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <div class="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 w-full max-w-4xl fade-in border border-purple-100">
        <div class="text-center mb-12">
          <!-- Larger, more prominent Toho title -->
          <h1 class="text-7xl font-bold bg-gradient-to-r from-purple-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-5 tracking-tight">
            Toho Listening Maker
          </h1>
          <div class="h-1.5 w-32 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-6"></div>
          <p class="text-xl text-gray-700 font-bold mb-2">
            桐朋中学校・桐朋高等学校
          </p>
          <p class="text-gray-500 text-sm font-medium">
            Professional Listening Test Creation System
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Create New Test -->
          <button id="createTestButton" class="group relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 text-white rounded-2xl p-10 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-purple-400/30">
            <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative z-10">
              <div class="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <i class="fas fa-plus-circle text-5xl"></i>
              </div>
              <h2 class="text-2xl font-bold mb-3">Create New Test</h2>
              <p class="text-sm opacity-90 font-medium">新規リスニングテスト作成</p>
            </div>
          </button>
          
          <!-- Access Folders -->
          <button id="accessFoldersButton" class="group relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-600 hover:from-blue-700 hover:via-indigo-800 hover:to-purple-700 text-white rounded-2xl p-10 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-blue-400/30">
            <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative z-10">
              <div class="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <i class="fas fa-folder-open text-5xl"></i>
              </div>
              <h2 class="text-2xl font-bold mb-3">Folder Management</h2>
              <p class="text-sm opacity-90 font-medium">保存済みテストを閲覧・管理</p>
            </div>
            <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </div>
  `;
}

function attachMenuScreenListeners() {
  const createTestButton = document.getElementById('createTestButton');
  const accessFoldersButton = document.getElementById('accessFoldersButton');
  
  if (createTestButton) {
    createTestButton.addEventListener('click', () => {
      currentState.screen = 'input';
      renderScreen();
    });
  }
  
  if (accessFoldersButton) {
    accessFoldersButton.addEventListener('click', () => {
      currentState.screen = 'folders';
      renderScreen();
    });
  }
}

// ============================================
// Folders Screen
// ============================================

async function renderFoldersScreen() {
  const appContainer = document.getElementById('app');
  
  appContainer.innerHTML = `
    <div class="max-w-6xl mx-auto p-8 fade-in">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center">
          <button id="backToMenuButton" class="mr-4 text-gray-600 hover:text-indigo-600 transition">
            <i class="fas fa-arrow-left text-2xl"></i>
          </button>
          <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-folder text-indigo-600 mr-3"></i>フォルダ管理
          </h1>
        </div>
        <button id="createFolderButton" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center">
          <i class="fas fa-plus mr-2"></i>新規フォルダ
        </button>
      </div>
      
      <div id="foldersContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="text-center py-12 col-span-full">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p class="text-gray-600">読み込み中...</p>
        </div>
      </div>
    </div>
  `;
  
  // Attach listeners
  document.getElementById('backToMenuButton').addEventListener('click', () => {
    currentState.screen = 'menu';
    renderScreen();
  });
  
  document.getElementById('createFolderButton').addEventListener('click', () => {
    createNewFolder();
  });
  
  // Load folders
  await loadFolders();
}

async function loadFolders() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('/api/folders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const folders = response.data.folders;
      const foldersContainer = document.getElementById('foldersContainer');
      
      if (folders.length === 0) {
        foldersContainer.innerHTML = `
          <div class="col-span-full text-center py-12">
            <i class="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-600 text-lg">フォルダがありません</p>
            <p class="text-gray-500 text-sm mt-2">「新規フォルダ」ボタンから作成してください</p>
          </div>
        `;
      } else {
        foldersContainer.innerHTML = folders.map(folder => `
          <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 cursor-pointer" onclick="openFolder(${folder.id}, '${folder.name.replace(/'/g, "\\'")}')">
            <div class="flex items-start justify-between mb-4">
              <div class="bg-indigo-100 rounded-lg p-3">
                <i class="fas fa-folder text-indigo-600 text-3xl"></i>
              </div>
              <div class="flex space-x-2">
                <button onclick="event.stopPropagation(); renameFolderPrompt(${folder.id}, '${folder.name.replace(/'/g, "\\'")}');" class="text-gray-400 hover:text-blue-600 transition">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="event.stopPropagation(); deleteFolderPrompt(${folder.id}, '${folder.name.replace(/'/g, "\\'")}');" class="text-gray-400 hover:text-red-600 transition">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${folder.name}</h3>
            <p class="text-sm text-gray-500">
              <i class="far fa-calendar-alt mr-2"></i>${new Date(folder.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Load folders error:', error);
    const foldersContainer = document.getElementById('foldersContainer');
    foldersContainer.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
        <p class="text-red-600">フォルダの読み込みに失敗しました</p>
      </div>
    `;
  }
}

async function createNewFolder() {
  const folderName = prompt('新しいフォルダの名前を入力してください:');
  
  if (!folderName || folderName.trim() === '') {
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post('/api/folders', {
      name: folderName.trim()
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      await loadFolders();
    } else {
      alert(response.data.error || 'フォルダの作成に失敗しました');
    }
  } catch (error) {
    console.error('Create folder error:', error);
    alert(error.response?.data?.error || 'フォルダの作成に失敗しました');
  }
}

async function renameFolderPrompt(folderId, currentName) {
  const newName = prompt('新しいフォルダ名を入力してください:', currentName);
  
  if (!newName || newName.trim() === '' || newName === currentName) {
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`/api/folders/${folderId}`, {
      name: newName.trim()
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      await loadFolders();
    } else {
      alert(response.data.error || 'フォルダ名の変更に失敗しました');
    }
  } catch (error) {
    console.error('Rename folder error:', error);
    alert(error.response?.data?.error || 'フォルダ名の変更に失敗しました');
  }
}

async function deleteFolderPrompt(folderId, folderName) {
  if (!confirm(`フォルダ「${folderName}」を削除してもよろしいですか？\n\nフォルダ内のすべてのリスニングテストも削除されます。\nこの操作は取り消せません。`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`/api/folders/${folderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      await loadFolders();
    } else {
      alert(response.data.error || 'フォルダの削除に失敗しました');
    }
  } catch (error) {
    console.error('Delete folder error:', error);
    alert(error.response?.data?.error || 'フォルダの削除に失敗しました');
  }
}

window.openFolder = function(folderId, folderName) {
  currentState.currentFolderId = folderId;
  currentState.currentFolderName = folderName;
  currentState.screen = 'folderView';
  renderScreen();
};

window.renameFolderPrompt = renameFolderPrompt;
window.deleteFolderPrompt = deleteFolderPrompt;

// ============================================
// Folder View Screen (List of tests in folder)
// ============================================

async function renderFolderViewScreen() {
  const appContainer = document.getElementById('app');
  
  appContainer.innerHTML = `
    <div class="max-w-6xl mx-auto p-8 fade-in">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center">
          <button id="backToFoldersButton" class="mr-4 text-gray-600 hover:text-indigo-600 transition">
            <i class="fas fa-arrow-left text-2xl"></i>
          </button>
          <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-folder-open text-indigo-600 mr-3"></i>${currentState.currentFolderName}
          </h1>
        </div>
      </div>
      
      <div id="testsContainer" class="space-y-4">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p class="text-gray-600">読み込み中...</p>
        </div>
      </div>
    </div>
  `;
  
  // Attach listeners
  document.getElementById('backToFoldersButton').addEventListener('click', () => {
    currentState.screen = 'folders';
    renderScreen();
  });
  
  // Load tests
  await loadTestsInFolder();
}

async function loadTestsInFolder() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`/api/folders/${currentState.currentFolderId}/tests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const tests = response.data.tests;
      const testsContainer = document.getElementById('testsContainer');
      
      if (tests.length === 0) {
        testsContainer.innerHTML = `
          <div class="text-center py-12 bg-white rounded-xl shadow">
            <i class="fas fa-file-audio text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-600 text-lg">このフォルダには保存されたテストがありません</p>
          </div>
        `;
      } else {
        testsContainer.innerHTML = tests.map(test => {
          const audioUrl = `/api/tests/${test.id}/audio`;
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + audioUrl)}`;
          
          return `
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center mb-3">
                    <span class="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full mr-2">
                      ${test.format === 'monologue' ? 'モノローグ' : 'ダイアローグ'}
                    </span>
                    <span class="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                      ${test.cefr_level}
                    </span>
                  </div>
                  <h3 class="text-xl font-bold text-gray-800 mb-2">${test.title}</h3>
                  <p class="text-gray-600 mb-3">${test.topic || ''}</p>
                  ${test.keywords ? `<p class="text-sm text-gray-500 mb-3"><i class="fas fa-tags mr-2"></i>${test.keywords}</p>` : ''}
                  <p class="text-sm text-gray-500">
                    <i class="far fa-calendar-alt mr-2"></i>${new Date(test.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                
                <div class="flex flex-col items-center space-y-3 ml-6">
                  <!-- QR Code -->
                  <div class="bg-gray-50 p-2 rounded-lg">
                    <img src="${qrCodeUrl}" alt="QR Code" class="w-24 h-24" title="音声ファイルのQRコード">
                  </div>
                  
                  <!-- Action Buttons -->
                  <div class="flex space-x-2">
                    <a href="${audioUrl}" download="${test.title}.mp3" class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition" title="音声をダウンロード">
                      <i class="fas fa-download"></i>
                    </a>
                    <button onclick="playAudio(${test.id}, '${test.title.replace(/'/g, "\\'")}');" class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition" title="音声を再生">
                      <i class="fas fa-play"></i>
                    </button>
                    <button onclick="downloadQRCode('${qrCodeUrl}', '${test.title.replace(/'/g, "\\'")}');" class="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition" title="QRコードをダウンロード">
                      <i class="fas fa-qrcode"></i>
                    </button>
                    <button onclick="deleteTestPrompt(${test.id}, '${test.title.replace(/'/g, "\\'")}');" class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition" title="削除">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (error) {
    console.error('Load tests error:', error);
    const testsContainer = document.getElementById('testsContainer');
    testsContainer.innerHTML = `
      <div class="text-center py-12 bg-white rounded-xl shadow">
        <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
        <p class="text-red-600">テストの読み込みに失敗しました</p>
      </div>
    `;
  }
}

window.playAudio = function(testId, title) {
  const audioUrl = `/api/tests/${testId}/audio`;
  const audio = new Audio(audioUrl);
  audio.play();
  
  // Show notification
  alert(`「${title}」を再生します`);
};

window.downloadQRCode = async function(qrCodeUrl, title) {
  try {
    const response = await fetch(qrCodeUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}_QR.png`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download QR code error:', error);
    alert('QRコードのダウンロードに失敗しました');
  }
};

async function deleteTestPrompt(testId, title) {
  if (!confirm(`リスニングテスト「${title}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`/api/tests/${testId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      await loadTestsInFolder();
    } else {
      alert(response.data.error || 'テストの削除に失敗しました');
    }
  } catch (error) {
    console.error('Delete test error:', error);
    alert(error.response?.data?.error || 'テストの削除に失敗しました');
  }
}

window.deleteTestPrompt = deleteTestPrompt;

// ============================================
// Save to Folder Dialog
// ============================================

async function showSaveToFolderDialog() {
  try {
    // Get all folders
    const token = localStorage.getItem('authToken');
    const response = await axios.get('/api/folders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.data.success) {
      alert('フォルダの取得に失敗しました');
      return;
    }
    
    const folders = response.data.folders;
    
    if (folders.length === 0) {
      // No folders - create one first
      if (confirm('フォルダがありません。新しいフォルダを作成しますか？')) {
        const folderName = prompt('フォルダ名を入力してください:');
        if (!folderName || folderName.trim() === '') {
          return;
        }
        
        const createResponse = await axios.post('/api/folders', {
          name: folderName.trim()
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (createResponse.data.success) {
          // Use the newly created folder
          await saveTestToFolder(createResponse.data.folder_id);
        } else {
          alert(createResponse.data.error || 'フォルダの作成に失敗しました');
        }
      }
      return;
    }
    
    // Show folder selection dialog
    const folderOptions = folders.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
    const selection = prompt(
      `保存先のフォルダを選択してください:\n\n${folderOptions}\n\n番号を入力してください (1-${folders.length}):`
    );
    
    if (!selection) {
      return;
    }
    
    const selectedIndex = parseInt(selection) - 1;
    if (selectedIndex < 0 || selectedIndex >= folders.length) {
      alert('無効な選択です');
      return;
    }
    
    const selectedFolder = folders[selectedIndex];
    await saveTestToFolder(selectedFolder.id);
    
  } catch (error) {
    console.error('Show save dialog error:', error);
    alert('フォルダ情報の取得に失敗しました');
  }
}

async function saveTestToFolder(folderId) {
  try {
    // Ask for test title
    const defaultTitle = currentState.formData.topic || 'リスニングテスト';
    const title = prompt('テストのタイトルを入力してください:', defaultTitle);
    
    if (!title || title.trim() === '') {
      return;
    }
    
    // Merge audio segments into single base64 string
    const btn = document.getElementById('saveToFolderButton');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
    
    try {
      console.log('💾 Saving test with audioSegments:', currentState.audioSegments.length, 'segments');
      console.log('💾 Saving test with speakers:', JSON.stringify(currentState.speakers, null, 2));
      
      // Call API to merge audio segments
      const mergeResponse = await axios.post('/api/merge-audio', {
        audioSegments: currentState.audioSegments
      }, { responseType: 'blob' });
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(mergeResponse.data);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        
        // Save to database
        const token = localStorage.getItem('authToken');
        const saveResponse = await axios.post('/api/tests', {
          folder_id: folderId,
          title: title.trim(),
          topic: currentState.formData.topic || '',
          format: currentState.formData.format,
          cefr_level: currentState.formData.cefrLevel,
          keywords: currentState.formData.keywords || '',
          script: currentState.generatedScript,
          questions: currentState.generatedQuestions,
          audio_settings: {
            speakers: currentState.speakers,
            questionReader: currentState.questionReader || null
          },
          audio_data: base64Audio
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (saveResponse.data.success) {
          alert('保存しました！フォルダから確認できます。');
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save mr-2"></i>フォルダに保存';
        } else {
          throw new Error(saveResponse.data.error || '保存に失敗しました');
        }
      };
      
    } catch (error) {
      console.error('Save test error:', error);
      alert(error.response?.data?.error || '保存に失敗しました');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save mr-2"></i>フォルダに保存';
    }
    
  } catch (error) {
    console.error('Save test error:', error);
    alert('保存に失敗しました');
  }
}

// Start the app
init();
