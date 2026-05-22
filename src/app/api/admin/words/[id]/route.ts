import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    const userEmail = authHeader?.replace("Bearer ", "");
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    
    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Admin Supabase not configured" }, { status: 500 });
    }

    const { id } = await params;

    // Fetch the word to get media URLs
    const { data: wordData, error: fetchError } = await adminSupabase
      .from("words")
      .select("audio_url, custom_image_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    // Connect to Cloudflare R2
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (accountId && accessKeyId && secretAccessKey && bucketName) {
      const s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://pub-${accountId}.r2.dev`;

      const deleteFile = async (url: string) => {
        if (!url || !url.startsWith(publicDomain)) return;
        const key = url.replace(`${publicDomain}/`, "");
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          }));
        } catch (e) {
          console.error("Failed to delete R2 object:", key, e);
        }
      };

      if (wordData.audio_url) await deleteFile(wordData.audio_url);
      if (wordData.custom_image_url) await deleteFile(wordData.custom_image_url);
    }

    // Delete word from Supabase
    const { error: deleteError } = await adminSupabase
      .from("words")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Word Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
