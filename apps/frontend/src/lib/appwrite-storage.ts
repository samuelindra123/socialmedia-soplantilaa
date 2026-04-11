import { Client, Storage, ID } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

const client = new Client().setEndpoint(endpoint).setProject(projectId);
const storage = new Storage(client);

export interface UploadResult {
  fileId: string;
  fileUrl: string;
}

/**
 * Upload a File directly to Appwrite Storage from the browser.
 * Returns the public view URL immediately — no presigned URL needed.
 */
export async function uploadToAppwrite(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const fileId = ID.unique();

  await storage.createFile(bucketId, fileId, file, undefined, (progress) => {
    if (onProgress && progress.chunksTotal > 0) {
      onProgress(Math.round((progress.chunksUploaded / progress.chunksTotal) * 100));
    }
  });

  const fileUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
  return { fileId, fileUrl };
}
