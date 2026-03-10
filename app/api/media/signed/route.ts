import { createClient } from "../../../../lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bucket, path, expiresIn = 600 } = await request.json();

    if (!bucket || !path) {
      return NextResponse.json(
        { error: "Bucket and path are required" },
        { status: 400 }
      );
    }

    console.log("[media/signed] Creating signed URL:", { bucket, path, expiresIn });

    // Create signed URL
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (signedError) {
      console.error("[media/signed] Signed URL error:", { bucket, path, status: signedError.name, message: signedError.message });
      return NextResponse.json(
        { error: `Failed to create signed URL: ${signedError.message}` },
        { status: 500 }
      );
    }

    if (!signedUrlData?.signedUrl) {
      console.error("[media/signed] No signed URL returned:", { bucket, path });
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    console.log("[media/signed] Success:", { bucket, path, urlLength: signedUrlData.signedUrl.length });

    return NextResponse.json({ 
      signedUrl: signedUrlData.signedUrl,
      bucket,
      path,
      expiresIn
    });

  } catch (error) {
    console.error("[media/signed] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
