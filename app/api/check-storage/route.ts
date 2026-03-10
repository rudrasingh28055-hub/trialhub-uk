import { createClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[check-storage] Checking storage configuration...");

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("[check-storage] Error listing buckets:", bucketsError);
      return NextResponse.json({ error: bucketsError.message }, { status: 500 });
    }

    const postMediaBucket = buckets?.find(b => b.name === 'post-media');
    
    if (!postMediaBucket) {
      console.error("[check-storage] post-media bucket not found");
      return NextResponse.json({ 
        error: "post-media bucket not found",
        buckets: buckets?.map(b => ({ name: b.name, public: b.public }))
      }, { status: 404 });
    }

    console.log("[check-storage] Bucket found:", {
      name: postMediaBucket.name,
      public: postMediaBucket.public,
      id: postMediaBucket.id
    });

    // Test file upload and signed URL generation
    const testPath = `${user.id}/test-file.txt`;
    const testContent = "test content";
    
    // Upload test file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(testPath, new Blob([testContent]), {
        contentType: "text/plain",
        upsert: true
      });

    if (uploadError) {
      console.error("[check-storage] Upload test failed:", uploadError);
      return NextResponse.json({ 
        error: `Upload test failed: ${uploadError.message}`,
        bucket: { name: postMediaBucket.name, public: postMediaBucket.public }
      }, { status: 500 });
    }

    console.log("[check-storage] Upload test successful");

    // Test signed URL
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from("post-media")
      .createSignedUrl(testPath, 60); // 1 minute

    if (signedError) {
      console.error("[check-storage] Signed URL test failed:", signedError);
      return NextResponse.json({ 
        error: `Signed URL test failed: ${signedError.message}`,
        bucket: { name: postMediaBucket.name, public: postMediaBucket.public },
        upload: { success: true, path: testPath }
      }, { status: 500 });
    }

    console.log("[check-storage] Signed URL test successful");

    // Test public URL
    const { data: { publicUrl } } = supabase.storage
      .from("post-media")
      .getPublicUrl(testPath);

    console.log("[check-storage] Public URL generated:", publicUrl);

    // Clean up test file
    await supabase.storage.from("post-media").remove([testPath]);

    return NextResponse.json({
      success: true,
      bucket: {
        name: postMediaBucket.name,
        public: postMediaBucket.public,
        id: postMediaBucket.id
      },
      tests: {
        upload: "✅ Success",
        signedUrl: "✅ Success",
        publicUrl: "✅ Generated",
        signedUrlSample: signedUrlData?.signedUrl,
        publicUrlSample: publicUrl
      }
    });

  } catch (error) {
    console.error("[check-storage] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
