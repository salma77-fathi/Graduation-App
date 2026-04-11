import * as fs from "fs";
import * as path from "path";

const ROBOFLOW_API_URL = "https://serverless.roboflow.com";
const ROBOFLOW_API_KEY = "ja6kzVolRFwRRlyj6AuF";
const WORKSPACE_NAME = "student-uuswc";
const WORKFLOW_ID = "detect-count-and-visualize-2";

const UPLOADS_FOLDER = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "Uploads",
  "product",
);

export async function 
detectProductIdFromImage(
  folderName: string,
  imageName: string,
): Promise<number> {
  // 1. Build the full path
  const absolutePath = path.join(UPLOADS_FOLDER, folderName, imageName);
    console.log(imageName);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Image not found in uploads folder: ${imageName}`);
    
  }

  // 2. Convert image to Base64
  const fileBuffer = fs.readFileSync(absolutePath);
  const base64Image = fileBuffer.toString("base64");

  // 3. Send as JSON with Base64
  const url = `${ROBOFLOW_API_URL}/${WORKSPACE_NAME}/workflows/${WORKFLOW_ID}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: ROBOFLOW_API_KEY,
      inputs: {
        image: {
          type: "base64",
          value: base64Image,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Roboflow API error ${response.status}: ${errorText}`);
  }

  // 4. Parse the response and extract class_id
  const rawResult = await response.json() as any;

  console.log("roboflow raw response:", JSON.stringify(rawResult, null, 2)); 

  if (
    Array.isArray(rawResult?.outputs) &&
    rawResult.outputs.length > 0 &&
    rawResult.outputs[0]?.predictions?.predictions?.length > 0
  ) {
    const firstDetection = rawResult.outputs[0].predictions.predictions[0];
    if (firstDetection?.class_id !== undefined) {
      return firstDetection.class_id as number;
    }
  }

  throw new Error("No predictions found in Roboflow response");
}

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
  };
  return mimeTypes[ext] ?? "application/octet-stream";
}