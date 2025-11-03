// State management
let currentState = {
  screen: 'input', // 'input', 'questionSettings', 'review', 'audioSettings'
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
  renderScreen();
}

// Render current screen
function renderScreen() {
  const appContainer = document.getElementById('app');
  
  switch(currentState.screen) {
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
      
      <form id="scriptForm" class="space-y-6">
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
    </div>
  `;
}

// Attach listeners for input screen
function attachInputScreenListeners() {
  const form = document.getElementById('scriptForm');
  const formatRadios = document.querySelectorAll('input[name="format"]');
  const numSpeakersSelect = document.getElementById('numSpeakersSelect');
  const dialogueSettings = document.getElementById('dialogueSettings');
  
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

// Generate script (mock for now)
async function generateScript() {
  // Show loading
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-12 text-center fade-in">
      <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">スクリプトを生成中...</h2>
      <p class="text-gray-600">しばらくお待ちください</p>
    </div>
  `;
  
  // Simulate API call (replace with real API later)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock generated script
  const numQuestions = currentState.formData.questionSettings === 'long' ? 3 : 1;
  const isLong = currentState.formData.questionSettings === 'long';
  
  // Use topic and keywords as-is (keep original input for reference only)
  const topicInput = currentState.formData.topic || 'environmental issues';
  const keywordsInput = currentState.formData.keywords || 'climate change, global warming';
  
  // For actual script generation, use English equivalents
  // This is a mock - in production, AI would translate/understand the intent
  const topic = 'environmental issues'; // Default English topic
  const keywords = 'climate change, global warming'; // Default English keywords
  const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
  
  // Use the explicitly set number of speakers from form data
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
  // Render parsed lines with pause settings
  const linesHTML = (currentState.parsedLines || []).map((line, index) => `
    <div class="border-l-4 border-${line.type === 'narration' ? 'purple' : 'blue'}-500 pl-4 mb-3 bg-gray-50 p-3 rounded">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="font-semibold text-sm text-gray-700">${line.type === 'narration' ? '📖 ナレーション' : '💬 ' + line.speaker}</div>
          <div class="text-gray-600 text-sm mt-1">${line.text}</div>
        </div>
        <div class="w-32">
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
        
        <!-- Pause After -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-clock mr-1"></i>セリフ後のブランク（秒）
          </label>
          <input type="number" min="0" max="10" step="0.5" value="${speaker.pauseAfter || 0}"
                 class="speaker-pause w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 data-speaker-index="${index}"
                 placeholder="例: 1.5">
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
  
  // Update speaker pause after
  document.querySelectorAll('.speaker-pause').forEach(input => {
    input.addEventListener('input', (e) => {
      const index = parseInt(e.target.dataset.speakerIndex);
      const pause = parseFloat(e.target.value) || 0;
      currentState.speakers[index].pauseAfter = pause;
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
      <div class="mb-2 border-l-4 border-${typeColor}-500 pl-3 py-2 bg-gray-50 rounded">
        <div class="flex items-start gap-2">
          <button class="play-segment-btn px-2 py-1 bg-indigo-100 hover:bg-indigo-200 rounded text-sm flex-shrink-0" data-index="${index}">
            <i class="fas fa-play"></i>
          </button>
          <div class="flex-1">
            <div class="text-xs font-semibold text-gray-600">${typeIcon} ${segment.speaker}</div>
            <div class="text-sm text-gray-700 mt-1">${segment.text || ''}</div>
            ${segment.pauseAfter ? `<div class="text-xs text-gray-500 mt-1">ブランク: ${segment.pauseAfter}秒</div>` : ''}
          </div>
          <audio class="audio-segment hidden" data-index="${index}">
            <source src="data:audio/mp3;base64,${segment.audio}" type="audio/mpeg">
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
