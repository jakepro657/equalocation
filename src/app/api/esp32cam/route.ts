// app/api/esp32cam/route.ts

import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { Storage } from "@google-cloud/storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const storage = new Storage({
  projectId: process.env.CREDENTIALS_PROJECT_ID,
  credentials: {
    type: process.env.CREDENTIALS_TYPE,
    project_id: process.env.CREDENTIALS_PROJECT_ID,
    private_key_id: process.env.CREDENTIALS_PRIVATE_KEY_ID,
    private_key: process.env.CREDENTIALS_PRIVATE_KEY,
    client_email: process.env.CREDENTIALS_CLIENT_EMAIL,
    client_id: process.env.CREDENTIALS_CLIENT_ID,
  },
});

// let isEnabled = true;
// let lastAnalysisTime = 0;
// const ANALYSIS_INTERVAL = 60000; // 1 minute

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }
  // if (action === "enable") {
  //   isEnabled = true;
  //   return NextResponse.json({ message: "Camera enabled" });
  // } else if (action === "disable") {
  //   isEnabled = false;
  //   return NextResponse.json({ message: "Camera disabled" });
  // } else if (action === "analyze") {
  //   if (!isEnabled) {
  //     return NextResponse.json({ message: "Camera is disabled" });
  //   }

  //   const currentTime = Date.now();
  //   if (currentTime - lastAnalysisTime < ANALYSIS_INTERVAL) {
  //     return NextResponse.json({ message: "Analysis not due yet" });
  //   }

  //   lastAnalysisTime = currentTime;

  try {
    const bucketName = process.env.GCS_BUCKET_NAME as string;
    const fileName = "esp32cam_image.jpg";

    // Download the file from Google Cloud Storage
    const [fileContents] = await storage
      .bucket(bucketName)
      .file(fileName)
      .download();

    // Convert to base64
    const base64Image = fileContents.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "What do you see in this image?",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      analysis: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
  // } else {
  //   return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  // }
}
