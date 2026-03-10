import { createClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[setup-bucket] Setting up post-media bucket...");

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("[setup-bucket] Error listing buckets:", bucketsError);
      return NextResponse.json({ error: bucketsError.message }, { status: 500 });
    }

    const postMediaBucket = buckets?.find(b => b.name === 'post-media');

    if (!postMediaBucket) {
      console.log("[setup-bucket] Creating post-media bucket...");

      const { error: createError } = await supabase.storage.createBucket('post-media', {
        public: false, // Private bucket - requires signed URLs
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      });

      if (createError) {
        console.error("[setup-bucket] Error creating bucket:", createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      console.log("[setup-bucket] Bucket created successfully");
    } else {
      console.log("[setup-bucket] Bucket already exists:", postMediaBucket);
    }

    // Test upload and signed URL generation
    const testPath = `${user.id}/test-video.mp4`;
    const testContent = new Blob(['test video content'], { type: 'video/mp4' });

    // Upload test file
    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(testPath, testContent, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      console.error("[setup-bucket] Upload test failed:", uploadError);
      return NextResponse.json({ 
        error: `Upload test failed: ${uploadError.message}`,
        bucket: postMediaBucket
      }, { status: 500 });
    }

    // Test signed URL generation
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('post-media')
      .createSignedUrl(testPath, 600);

    if (signedError) {
      console.error("[setup-bucket] Signed URL test failed:", signedError);
      return NextResponse.json({ 
        error: `Signed URL test failed: ${signedError.message}`,
        bucket: postMediaBucket,
        upload: { success: true, path: testPath }
      }, { status: 500 });
    }

    // Clean up test file
    await supabase.storage.from('post-media').remove([testPath]);

    return NextResponse.json({
      success: true,
      bucket: postMediaBucket || { name: 'post-media' },
      tests: {
        upload: true,
        signedUrl: true,
        signedUrlSample: signedUrlData?.signedUrl?.substring(0, 100) + '...'
      }
    });

  } catch (error) {
    console.error("[setup-bucket] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
