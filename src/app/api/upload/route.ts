import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getValidatedUser } from "@/lib/serverAuth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getValidatedUser();
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    
    // Only admins should upload files to the primary R2 bucket for VocabPod lessons
    if (!user?.email || !adminEmails.includes(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Filename and contentType are required" }, { status: 400 });
    }

    // Validate content type to prevent malicious uploads
    if (!contentType.startsWith("image/") && !contentType.startsWith("audio/")) {
      return NextResponse.json({ error: "Invalid content type. Only images and audio allowed." }, { status: 400 });
    }

    // Generate secure randomized filename to prevent directory traversal / overwriting
    const secureFilename = `${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

    // Connect to Cloudflare R2
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    // Graceful Fallback if Cloudflare is not configured
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return NextResponse.json({
        uploadUrl: "fallback-mode",
        finalUrl: `https://mock.vocabpod.com/${filename}`
      });
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Generate Presigned URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: secureFilename,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Assume public R2.dev or custom domain is configured in env
    const publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://pub-${accountId}.r2.dev`;
    const finalUrl = `${publicDomain}/${secureFilename}`;

    return NextResponse.json({
      uploadUrl,
      finalUrl,
    });

  } catch (err: any) {
    console.error("Presigned URL Generation Error:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
