import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export const dynamic = 'force-dynamic';

function getRowByteSize(row: any): number {
  if (!row) return 0;
  return Buffer.byteLength(JSON.stringify(row), "utf8");
}

export async function GET(req: Request) {
  try {
    // 1. Basic Admin Authorization
    const authHeader = req.headers.get("Authorization");
    const userEmail = authHeader?.replace("Bearer ", "");
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    
    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Admin Supabase not configured" }, { status: 500 });
    }

    // 2. Calculate Database Text Sizes
    let wordsTextSize = 0;
    let progressTextSize = 0;
    let profilesTextSize = 0;
    let subscriptionTextSize = 0;

    let wordsCount = 0;
    let progressCount = 0;
    let profilesCount = 0;
    let subscriptionCount = 0;

    // Fetch Words
    const { data: dbWords } = await adminSupabase.from("words").select("*");
    if (dbWords) {
      wordsCount = dbWords.length;
      wordsTextSize = dbWords.reduce((sum, r) => sum + getRowByteSize(r), 0);
    }

    // Fetch Progress
    const { data: dbProgress } = await adminSupabase.from("user_progress").select("*");
    if (dbProgress) {
      progressCount = dbProgress.length;
      progressTextSize = dbProgress.reduce((sum, r) => sum + getRowByteSize(r), 0);
    }

    // Fetch Profiles
    const { data: dbProfiles } = await adminSupabase.from("user_profiles").select("*");
    if (dbProfiles) {
      profilesCount = dbProfiles.length;
      profilesTextSize = dbProfiles.reduce((sum, r) => sum + getRowByteSize(r), 0);
    }

    // Fetch Subscriptions
    const { data: dbSubs } = await adminSupabase.from("users_subscriptions").select("*");
    if (dbSubs) {
      subscriptionCount = dbSubs.length;
      subscriptionTextSize = dbSubs.reduce((sum, r) => sum + getRowByteSize(r), 0);
    }

    const totalTextSize = wordsTextSize + progressTextSize + profilesTextSize + subscriptionTextSize;

    // 3. Calculate Media Sizes from Cloudflare R2
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    let audioSize = 0;
    let imageSize = 0;
    let isFallbackMode = false;
    let audioCount = 0;
    let imageCount = 0;
    let audioFiles: { key: string; size: number }[] = [];

    if (accountId && accessKeyId && secretAccessKey && bucketName) {
      try {
        const s3 = new S3Client({
          region: "auto",
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });

        let isTruncated = true;
        let continuationToken: string | undefined = undefined;

        while (isTruncated) {
          const command: any = new ListObjectsV2Command({
            Bucket: bucketName,
            ContinuationToken: continuationToken,
          });
          const res: any = await s3.send(command);
          
          if (res.Contents) {
            for (const item of res.Contents) {
              const size = item.Size || 0;
              const key = item.Key || "";
              const lowerKey = key.toLowerCase();
              
              const isAudio = lowerKey.endsWith(".mp3") || 
                              lowerKey.endsWith(".wav") || 
                              lowerKey.endsWith(".m4a") || 
                              key.startsWith("audio/");
                              
              const isImageOrSvg = lowerKey.endsWith(".png") || 
                                   lowerKey.endsWith(".jpg") || 
                                   lowerKey.endsWith(".jpeg") || 
                                   lowerKey.endsWith(".svg") || 
                                   lowerKey.endsWith(".webp") || 
                                   key.startsWith("images/");

              if (isAudio) {
                audioSize += size;
                audioCount++;
                audioFiles.push({ key, size });
              } else if (isImageOrSvg) {
                imageSize += size;
                imageCount++;
              } else {
                // Other files inside bucket
                imageSize += size;
                imageCount++;
              }
            }
          }
          
          isTruncated = res.IsTruncated ?? false;
          continuationToken = res.NextContinuationToken;
        }
        
        // Sort audio files by size descending
        audioFiles.sort((a, b) => b.size - a.size);
        
      } catch (r2Err) {
        console.error("R2 List Storage error, using fallback simulation:", r2Err);
        isFallbackMode = true;
      }
    } else {
      isFallbackMode = true;
    }

    // Fallback Simulation if R2 is offline or not configured
    if (isFallbackMode && dbWords) {
      dbWords.forEach(w => {
        if (w.audio_url) {
          audioSize += 250 * 1024; // assume avg 250KB per audio
          audioCount++;
        }
        if (w.custom_image_url) {
          imageSize += 150 * 1024; // assume avg 150KB per image
          imageCount++;
        }
      });
    }

    return NextResponse.json({
      success: true,
      isFallbackMode,
      totalTextSize,
      audioSize,
      imageSize,
      bucketName: bucketName || null,
      textBreakdown: {
        words: { count: wordsCount, size: wordsTextSize },
        progress: { count: progressCount, size: progressTextSize },
        profiles: { count: profilesCount, size: profilesTextSize },
        subscriptions: { count: subscriptionCount, size: subscriptionTextSize },
      },
      mediaCount: {
        audio: audioCount,
        images: imageCount,
      },
      topAudioFiles: audioFiles.slice(0, 50) // Return top 50 largest audio files
    });

  } catch (err: any) {
    console.error("Storage calculate error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
