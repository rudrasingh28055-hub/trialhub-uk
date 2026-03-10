import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { POST_MEDIA_BUCKET } from "../../../../lib/storage/constants";

export async function GET() {
  try {
    // Use direct Supabase client to bypass any issues with our server client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    
    console.log("Debug: Testing direct Supabase connection");
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    console.log("Test query result:", { testData, testError });
    
    // Get profiles with minimal fields
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .limit(3);
    
    console.log("Profiles query result:", { profiles, profilesError });

    // Test storage buckets
    let buckets: any[] = [];
    let bucketError = null;
    let postMediaBucketExists = false;
    
    try {
      const { data: bucketData, error: bucketErr } = await supabase.storage.listBuckets();
      buckets = bucketData || [];
      bucketError = bucketErr?.message;
      postMediaBucketExists = buckets.some(b => b.name === POST_MEDIA_BUCKET);
      console.log("Storage buckets result:", { buckets, bucketError, postMediaBucketExists });
    } catch (storageErr) {
      bucketError = storageErr instanceof Error ? storageErr.message : String(storageErr);
      console.error("Storage buckets error:", storageErr);
    }

    // Test upload permissions (simulate)
    let uploadTest = "not_tested";
    if (postMediaBucketExists) {
      try {
        // Try to test if we can create a signed URL (tests permissions)
        const testPath = `${POST_MEDIA_BUCKET}/test-file.txt`;
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(POST_MEDIA_BUCKET)
          .createSignedUrl(testPath, 60);
        
        if (signedUrlError) {
          uploadTest = `permission_error: ${signedUrlError.message}`;
        } else {
          uploadTest = "permissions_ok";
        }
      } catch (uploadErr) {
        uploadTest = `upload_error: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`;
      }
    }

    return NextResponse.json({
      test: { data: testData, error: testError?.message },
      profiles: profiles || profilesError?.message || 'No data',
      profileCount: profiles?.length || 0,
      storage: {
        buckets: buckets.map(b => ({ name: b.name, public: b.public })),
        bucketCount: buckets.length,
        postMediaBucketExists,
        bucketError,
        uploadTest
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
