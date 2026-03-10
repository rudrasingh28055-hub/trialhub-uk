import { createClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    console.log("[refresh-video-url] Converting public URL to signed URL for path:", path);

    // Create signed URL for the video
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from("post-media")
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (signedError) {
      console.error("[refresh-video-url] Signed URL error:", signedError);
      return NextResponse.json(
        { error: `Failed to create signed URL: ${signedError.message}` },
        { status: 500 }
      );
    }

    if (!signedUrlData?.signedUrl) {
      console.error("[refresh-video-url] No signed URL returned");
      return NextResponse.json(
        { error: "Failed to generate video URL" },
        { status: 500 }
      );
    }

    console.log("[refresh-video-url] Success:", signedUrlData.signedUrl);

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl });
  } catch (error) {
    console.error("[refresh-video-url] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
