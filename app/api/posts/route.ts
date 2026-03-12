import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { getAdminSupabase } from "../../../lib/adapters/supabase/admin";
import { POST_MEDIA_BUCKET } from "../../../lib/storage/constants";

export async function POST(request: Request) {
  const startTime = Date.now();

  const fail = (
    status: number,
    error: string,
    details?: Record<string, unknown> | string
  ) => {
    const duration = Date.now() - startTime;
    console.error("[posts] FAIL", {
      status,
      error,
      details,
      duration,
    });

    return NextResponse.json(
      {
        error,
        details,
        duration,
      },
      { status }
    );
  };

  try {
    console.log("[posts] Starting post creation at", new Date().toISOString());

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return fail(500, "Missing NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return fail(500, "Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = await createClient();
    const adminSupabase = getAdminSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return fail(401, "Authentication failed", {
        message: authError.message,
        code: authError.code,
      });
    }

    if (!user) {
      return fail(401, "Authentication required");
    }

    console.log("[posts] Authenticated user", {
      userId: user.id,
      email: user.email,
    });

    const body = await request.formData();
    console.log("[posts] Request formData keys:", Array.from(body.keys()));

    const mediaFile = body.get("mediaFile") as File;
    const caption = body.get("caption") as string;
    const contentType = body.get("contentType") as string;
    const composerMode = body.get("composerMode") as string;
    const mediaType = body.get("mediaType") as string;
    const visibility = body.get("visibility") as string;
    
    // Quick Post fields
    const postType = body.get("postType") as string;
    
    // Highlight Builder fields
    const clipType = body.get("clipType") as string;
    const position = body.get("position") as string;
    const actionType = body.get("actionType") as string;
    const opponent = body.get("opponent") as string;
    const minute = body.get("minute") as string;
    const competition = body.get("competition") as string;
    const result = body.get("result") as string;
    const footUsed = body.get("footUsed") as string;
    const matchDate = body.get("matchDate") as string;
    const sessionName = body.get("sessionName") as string;
    const location = body.get("location") as string;
    const trimStart = body.get("trimStart") as string;
    const trimEnd = body.get("trimEnd") as string;
    const coverFrameTime = body.get("coverFrameTime") as string;
    const spotlightTime = body.get("spotlightTime") as string;
    const spotlightLabel = body.get("spotlightLabel") as string;
    const spotlightX = body.get("spotlightX") as string;
    const spotlightY = body.get("spotlightY") as string;
    const spotlightDuration = body.get("spotlightDuration") as string;
    
    // New advanced spotlight fields
    const spotlightStyle = body.get("spotlightStyle") as string;
    const spotlightKeyframes = body.get("spotlightKeyframes") as string;
    
    // Mux video fields
    const muxPlaybackId = body.get("muxPlaybackId") as string;
    const muxAssetId = body.get("muxAssetId") as string;

    // Validate required fields
    if (!(mediaFile instanceof File) || !caption || !contentType || !mediaType || !visibility || !composerMode) {
      return fail(400, "Missing or invalid required fields", {
        missing: {
          mediaFile: !(mediaFile instanceof File),
          caption: !caption,
          contentType: !contentType,
          mediaType: !mediaType,
          visibility: !visibility,
          composerMode: !composerMode,
        },
      });
    }

    // Convert string fields to correct types
    const minuteNum = minute ? parseInt(minute, 10) : undefined;
    const trimStartNum = trimStart ? parseFloat(trimStart) : undefined;
    const trimEndNum = trimEnd ? parseFloat(trimEnd) : undefined;
    const coverFrameTimeNum = coverFrameTime ? parseFloat(coverFrameTime) : undefined;
    const spotlightTimeNum = spotlightTime ? parseFloat(spotlightTime) : undefined;

    // Validate highlight-specific required fields
    if (composerMode === "highlight") {
      if (!position || !actionType) {
        return fail(400, "Missing required highlight fields", {
          missing: {
            position: !position,
            actionType: !actionType,
          },
        });
      }
    }

    // Ensure bucket exists
    const { data: buckets, error: listBucketsError } =
      await adminSupabase.storage.listBuckets();

    if (listBucketsError) {
      return fail(500, "Failed to list storage buckets", {
        message: listBucketsError.message,
        name: listBucketsError.name,
      });
    }

    const bucket = POST_MEDIA_BUCKET;
    const bucketExists = buckets?.some((b) => b.name === bucket || b.id === bucket);

    if (!bucketExists) {
      console.log("[posts] Creating bucket:", bucket);
      const { error: createBucketError } = await adminSupabase.storage.createBucket(
        bucket,
        {
          public: true,
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "video/mp4",
            "video/webm",
          ],
          fileSizeLimit: 50 * 1024 * 1024,
        }
      );

      if (createBucketError) {
        return fail(500, "Failed to create storage bucket", {
          message: createBucketError.message,
          name: createBucketError.name,
          bucket,
        });
      }
      console.log("[posts] Bucket created successfully:", bucket);
    }

    // Upload media file
    const file = mediaFile as File;
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${user.id}/${timestamp}-${safeFilename}`;

    console.log("[posts] Uploading file:", {
      bucket,
      fileName,
      type: file.type,
      size: file.size,
    });

    const { error: uploadError } = await adminSupabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return fail(500, "Storage upload failed", {
        message: uploadError.message,
        name: uploadError.name,
        bucket,
        fileName,
        userId: user.id,
      });
    }

    // Store stable media reference and generate appropriate URLs
    const mediaReference = {
      bucket,
      path: fileName,
      type: file.type,
    };

    console.log("[posts] Media reference stored:", mediaReference);

    // Generate appropriate URL for media_url field (backward compatible)
    let mediaUrl: string | null = null;
    if (file.type.startsWith("video/")) {
      // For videos: keep media_url null (will be resolved on-demand)
      mediaUrl = null;
    } else {
      // For images: store public URL (backward compatible)
      const {
        data: { publicUrl },
      } = adminSupabase.storage.from(bucket).getPublicUrl(fileName);
      mediaUrl = publicUrl;
    }

    // Create post in database
    const postData: any = {
      author_id: user.id,
      content_type: contentType,
      caption,
      media_url: mediaUrl, // Backward compatible: null for videos, public URL for images
      media_bucket: bucket,
      media_path: fileName,
      media_mime_type: file.type,
      media_type: mediaType,
      visibility,
      composer_mode: composerMode,
      created_at: new Date().toISOString(),
    };

    // Add Quick Post specific fields
    if (composerMode === "quick" && postType) {
      postData.post_type = postType;
    }

    // Add Highlight Builder specific fields
    if (composerMode === "highlight") {
      postData.position_tag = position;
      postData.action_type = actionType;
      
      // Optional fields
      if (opponent) postData.opponent = opponent;
      if (minuteNum !== undefined) postData.minute = minuteNum;
      if (competition) postData.competition = competition;
      if (result) postData.result = result;
      if (footUsed) postData.foot_used = footUsed;
      if (matchDate) postData.match_date = matchDate;
      if (sessionName) postData.session_name = sessionName;
      if (location) postData.location = location;
      if (clipType) postData.clip_type = clipType;
      
      // Editing metadata
      if (trimStartNum !== undefined) postData.trim_start = trimStartNum;
      if (trimEndNum !== undefined) postData.trim_end = trimEndNum;
      if (coverFrameTimeNum !== undefined) postData.cover_frame_time = coverFrameTimeNum;
      if (spotlightTimeNum !== undefined) postData.spotlight_time = spotlightTimeNum;
      if (spotlightLabel) postData.spotlight_label = spotlightLabel;
      
      // New advanced spotlight fields
      if (spotlightStyle) postData.spotlight_style = spotlightStyle;
      
      // Parse and validate spotlight keyframes JSON
      if (spotlightKeyframes) {
        try {
          const parsedKeyframes = JSON.parse(spotlightKeyframes);
          // Basic validation - ensure it's an array with required structure
          if (Array.isArray(parsedKeyframes) && parsedKeyframes.every(kf => 
            typeof kf === 'object' && 
            kf !== null && 
            typeof kf.id === 'string' && 
            typeof kf.progress === 'number' && 
            typeof kf.x === 'number' && 
            typeof kf.y === 'number'
          )) {
            postData.spotlight_keyframes = parsedKeyframes;
          } else {
            console.warn('[posts] Invalid spotlight keyframes format, skipping');
          }
        } catch (error) {
          console.warn('[posts] Failed to parse spotlight keyframes JSON:', error);
        }
      }
      
      // Add Mux video fields if available
      if (muxPlaybackId) postData.mux_playback_id = muxPlaybackId;
      if (muxAssetId) postData.mux_asset_id = muxAssetId;
      
      // Spotlight position fields (legacy compatibility)
      const spotlightXNum = spotlightX ? parseFloat(spotlightX) : undefined;
      const spotlightYNum = spotlightY ? parseFloat(spotlightY) : undefined;
      const spotlightDurationNum = spotlightDuration ? parseInt(spotlightDuration, 10) : undefined;
      
      if (spotlightXNum !== undefined) postData.spotlight_x = spotlightXNum;
      if (spotlightYNum !== undefined) postData.spotlight_y = spotlightYNum;
      if (spotlightDurationNum !== undefined) postData.spotlight_duration = spotlightDurationNum;
    }

    console.log("[posts] Creating post with data:", postData);

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert(postData)
      .select()
      .single();

    if (postError) {
      return fail(500, "Failed to create post", {
        message: postError.message,
        details: postError.details,
      });
    }

    const duration = Date.now() - startTime;
    console.log("[posts] Post created successfully:", {
      postId: post.id,
      duration,
    });

    return NextResponse.json({
      success: true,
      post,
      duration,
    });

  } catch (error) {
    return fail(
      500,
      "Internal server error",
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : String(error)
    );
  }
}
