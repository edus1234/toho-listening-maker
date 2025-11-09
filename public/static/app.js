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
    console.log('🚀 Starting audio generation with speakers:', currentState.speakers);
    
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
            <div class="flex items-center gap-2 mb-1">
              <div class="text-xs font-semibold text-gray-600">${typeIcon} ${segment.speaker}</div>
              ${segment.type !== 'question' && segment.type !== 'option' ? `
                ${segment.type === 'narration' || segment.isNarration ? `
                  <select class="segment-narrator-language-select text-xs px-2 py-0.5 border border-purple-300 rounded bg-purple-50" data-segment-index="${index}">
                    <option value="en" ${(segment.narratorLanguage || currentState.narratorSettings?.language || 'en') === 'en' ? 'selected' : ''}>英語</option>
                    <option value="ja" ${(segment.narratorLanguage || currentState.narratorSettings?.language || 'en') === 'ja' ? 'selected' : ''}>日本語</option>
                  </select>
                ` : `
                  <select class="segment-speaker-language-select text-xs px-2 py-0.5 border border-blue-300 rounded bg-blue-50" data-segment-index="${index}">
                    <option value="en" ${(segment.language || 'en') === 'en' ? 'selected' : ''}>英語</option>
                    <option value="ja" ${(segment.language || 'en') === 'ja' ? 'selected' : ''}>日本語</option>
                  </select>
                `}
                <select class="segment-gender-select text-xs px-2 py-0.5 border border-gray-300 rounded" data-segment-index="${index}">
                  <option value="male" ${(segment.gender || 'male') === 'male' ? 'selected' : ''}>男性</option>
                  <option value="female" ${(segment.gender || 'male') === 'female' ? 'selected' : ''}>女性</option>
                </select>
                <select class="segment-voiceStyle-select text-xs px-2 py-0.5 border border-gray-300 rounded" data-segment-index="${index}">
                  <option value="neutral" ${(segment.voiceStyle || 'neutral') === 'neutral' ? 'selected' : ''}>標準</option>
                  <option value="warm" ${(segment.voiceStyle || 'neutral') === 'warm' ? 'selected' : ''}>明るい</option>
                  <option value="calm" ${(segment.voiceStyle || 'neutral') === 'calm' ? 'selected' : ''}>落ち着いた</option>
                </select>
              ` : ''}
            </div>
            <div class="text-sm text-gray-700 mt-1">${segment.text || ''}</div>
            
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
                
                <div class="mb-2 p-2 bg-gray-100 rounded text-xs">
                  <div class="font-semibold text-gray-700 mb-1">元のテキスト:</div>
                  <div class="text-gray-800">${segment.text || ''}</div>
                </div>
                
                <textarea 
                  class="audio-voice-instruction w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  data-segment-index="${index}"
                  rows="3"
                  placeholder="上のテキストをコピーして、マークを挿入してください"
                >${segment.voiceInstructions || segment.text || ''}</textarea>
                
                <div class="flex gap-2 mt-2">
                  <button type="button" class="regenerate-audio-btn flex-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition" data-segment-index="${index}">
                    <i class="fas fa-redo mr-1"></i>音声再生成
                  </button>
                  <button type="button" class="clear-audio-instruction-btn bg-gray-400 text-white px-3 py-1 rounded text-xs hover:bg-gray-500 transition" data-segment-index="${index}">
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
      
      <div class="flex gap-4 mb-4">
        <button id="backToReviewFromAudioButton"
                class="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition">
          <i class="fas fa-arrow-left mr-2"></i>１つ前に戻る
        </button>
        <button id="downloadMp3Button"
                class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
          <i class="fas fa-download mr-2"></i>MP3ダウンロード（結合済み）
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
  
  audioElements.forEach((audio, index) => {
    audio.addEventListener('ended', () => {
      // Only auto-play next segment if "Play All" mode is active
      if (isPlayingAll) {
        currentAudioIndex++;
        playNextSegment();
      }
    });
  });
  
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
      console.log('🎵 Play button clicked, index:', index);
      console.log('🎵 audioElements length:', audioElements.length);
      console.log('🎵 Audio element:', audioElements[index]);
      console.log('🎵 Audio src:', audioElements[index]?.src);
      // Stop all others
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      // Play selected segment only
      if (audioElements[index]) {
        console.log(`🎵 Attempting to play audio ${index}...`);
        console.log(`🎵 Audio ready state:`, audioElements[index].readyState);
        console.log(`🎵 Audio src exists:`, !!audioElements[index].src);
        console.log(`🎵 Audio duration:`, audioElements[index].duration);
        
        audioElements[index].play().then(() => {
          console.log('✅ Audio playing successfully');
        }).catch(err => {
          console.error('❌ Play failed:', err);
          console.error('❌ Error name:', err.name);
          console.error('❌ Error message:', err.message);
        });
      } else {
        console.error(`❌ Audio element ${index} not found!`);
      }
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
  
  // Insert mark buttons
  document.querySelectorAll('.insert-mark-btn').forEach(button => {
    button.addEventListener('click', (e) => {
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
          
          // Play the new audio
          audioElement.play();
          
          alert('✅ 音声を再生成しました');
        } else {
          alert('音声生成エラー: ' + (response.data.error || '音声セグメントが生成されませんでした'));
        }
      } catch (error) {
        console.error('Regeneration error:', error);
        alert('音声再生成中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
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
  
  // Pause/blank input change handler
  document.querySelectorAll('.segment-pause-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.segmentIndex);
      const pauseValue = parseFloat(e.target.value) || 0;
      currentState.audioSegments[index].pauseAfter = pauseValue;
      console.log(`ブランク更新: セグメント${index} → ${pauseValue}秒`);
    });
  });
  
  // Save to folder button
  document.getElementById('saveToFolderButton').addEventListener('click', async () => {
    await showSaveToFolderDialog();
  });
  
  // Back to review screen button
  document.getElementById('backToReviewFromAudioButton').addEventListener('click', () => {
    currentState.screen = 'review';
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
