-- Folders table for organizing listening tests
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Listening tests table
CREATE TABLE IF NOT EXISTS listening_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  topic TEXT,
  format TEXT, -- monologue/dialogue
  cefr_level TEXT,
  keywords TEXT,
  script TEXT NOT NULL,
  questions TEXT, -- JSON array
  audio_settings TEXT, -- JSON object (speakers, questionReader, etc.)
  audio_data TEXT, -- Base64 encoded MP3 audio
  audio_url TEXT, -- Public URL for audio file
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_tests_folder_id ON listening_tests(folder_id);
CREATE INDEX IF NOT EXISTS idx_listening_tests_created_at ON listening_tests(created_at DESC);
