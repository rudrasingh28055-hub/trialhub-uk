import { createClient } from "../../../lib/supabase/server";
import { parseSupabaseStorageUrl } from "../../../lib/utils/storage";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mediaUrl, expiresIn = 3600 } = await request.json();

    if (!mediaUrl) {
      return NextResponse.json(
        { error: "Media URL is required" },
        { status: 400 }
      );
    }

    console.log("[get-fresh-url] Processing URL:", mediaUrl.substring(0, 100) + "...");

    // Parse the URL to get bucket and path
    const parsed = parseSupabaseStorageUrl(mediaUrl);
    
    if (!parsed) {
      console.log("[get-fresh-url] Not a Supabase URL, using as-is");
      return NextResponse.json({ signedUrl: mediaUrl });
    }

    console.log("[get-fresh-url] Parsed:", parsed);

    // Create fresh signed URL
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.path, expiresIn);

    if (signedError) {
      console.error("[get-fresh-url] Signed URL error:", signedError);
      return NextResponse.json(
        { error: `Failed to create signed URL: ${signedError.message}` },
        { status: 500 }
      );
    }

    if (!signedUrlData?.signedUrl) {
      console.error("[get-fresh-url] No signed URL returned");
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    console.log("[get-fresh-url] Success:", signedUrlData.signedUrl.substring(0, 100) + "...");

    return NextResponse.json({ 
      signedUrl: signedUrlData.signedUrl,
      bucket: parsed.bucket,
      path: parsed.path
    });

  } catch (error) {
    console.error("[get-fresh-url] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
