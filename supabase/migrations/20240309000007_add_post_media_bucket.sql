-- Create storage bucket for post media uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for post-media bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'post-media');

CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);
