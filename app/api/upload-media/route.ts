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
    console.error("[upload-media] FAIL", {
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
    console.log("[upload-media] Starting upload", {
      at: new Date().toISOString(),
      bucket: POST_MEDIA_BUCKET,
    });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return fail(500, "Missing NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return fail(500, "Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = await createClient();

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

    console.log("[upload-media] Authenticated user", {
      userId: user.id,
      email: user.email,
    });

    let adminSupabase;
    try {
      adminSupabase = getAdminSupabase();
    } catch (error) {
      return fail(
        500,
        "Failed to initialize admin Supabase client",
        error instanceof Error ? error.message : String(error)
      );
    }

    const bucket = POST_MEDIA_BUCKET;

    // Ensure bucket exists
    const { data: buckets, error: listBucketsError } =
      await adminSupabase.storage.listBuckets();

    if (listBucketsError) {
      return fail(500, "Failed to list storage buckets", {
        message: listBucketsError.message,
        name: listBucketsError.name,
      });
    }

    const bucketExists = buckets?.some((b) => b.name === bucket || b.id === bucket);

    if (!bucketExists) {
      console.log("[upload-media] Creating bucket", { bucket });

      const { error: createBucketError } = await adminSupabase.storage.createBucket(
        bucket,
        {
          public: false,
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
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail(400, "No valid file provided");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/webm",
    ];

    if (!allowedTypes.includes(file.type)) {
      return fail(400, "Invalid file type", {
        fileType: file.type,
        allowedTypes,
      });
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return fail(400, "File too large", {
        fileSize: file.size,
        maxSize,
      });
    }

    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${user.id}/${timestamp}-${safeFilename}`;

    console.log("[upload-media] Uploading file", {
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

    let url = "";

    if (file.type.startsWith("video/")) {
      const { data: signedUrlData, error: signedUrlError } =
        await adminSupabase.storage.from(bucket).createSignedUrl(fileName, 3600);

      if (signedUrlError) {
        return fail(500, "Failed to create signed URL for video", {
          message: signedUrlError.message,
          name: signedUrlError.name,
          bucket,
          fileName,
        });
      }

      url = signedUrlData?.signedUrl ?? "";
    } else {
      const {
        data: { publicUrl },
      } = adminSupabase.storage.from(bucket).getPublicUrl(fileName);

      url = publicUrl;
    }

    if (!url) {
      return fail(500, "Upload succeeded but no media URL was generated", {
        bucket,
        fileName,
      });
    }

    const duration = Date.now() - startTime;
    console.log("[upload-media] Upload successful", {
      bucket,
      fileName,
      url,
      mediaType: file.type.startsWith("video") ? "video" : "image",
      duration,
    });

    return NextResponse.json({
      url,
      bucket,
      path: fileName,
      mediaType: file.type.startsWith("video") ? "video" : "image",
      userId: user.id,
      uploadTime: duration,
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
