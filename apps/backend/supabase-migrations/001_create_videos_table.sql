-- Tabel videos untuk metadata video
-- Jalankan di Supabase SQL Editor atau psql

-- Drop table jika sudah ada (hati-hati di production!)
DROP TABLE IF EXISTS videos CASCADE;

-- Buat tabel videos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  video_id TEXT, -- Appwrite file ID
  thumbnail_id TEXT, -- Appwrite file ID
  original_size BIGINT, -- ukuran asli dalam bytes
  compressed_size BIGINT, -- ukuran setelah kompresi
  duration FLOAT, -- durasi video dalam detik
  width INT, -- lebar video
  height INT, -- tinggi video
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);

-- Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update updated_at
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (jika menggunakan RLS, uncomment baris di bawah)
-- ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own videos" ON videos FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own videos" ON videos FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update own videos" ON videos FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can delete own videos" ON videos FOR DELETE USING (auth.uid() = user_id);

-- Verify table created
SELECT 'Table videos created successfully!' as message;
SELECT * FROM videos LIMIT 0;
