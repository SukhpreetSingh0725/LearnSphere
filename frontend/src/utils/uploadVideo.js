import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MAX_SIZE_MB = 50;

export async function uploadLessonVideo({ file, lessonId, token }) {
  if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
    throw new Error("Please choose an MP4, WebM or MOV video");
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Video must be ${MAX_SIZE_MB} MB or smaller`);
  }


  const res = await fetch(`${API}/api/uploads/video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ lessonId, contentType: file.type }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Upload not allowed");


  const { key, token: uploadToken } = body.data;
  const { error } = await supabase.storage
    .from("videos")
    .uploadToSignedUrl(key, uploadToken, file, { contentType: file.type });
  if (error) throw new Error(error.message);

  return key;
}

const RESOURCE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export async function uploadLessonResource({ file, lessonId, token }) {
  if (!RESOURCE_TYPES.includes(file.type)) {
    throw new Error("Please choose a PDF, DOC, DOCX, PPT or PPTX file");
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Resource must be 20 MB or smaller");
  }

  const res = await fetch(`${API}/api/uploads/resource`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      lessonId,
      contentType: file.type,
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.message || "Resource upload not allowed");
  }

  const { key, token: uploadToken } = body.data;

  const { error } = await supabase.storage
    .from("resources")
    .uploadToSignedUrl(key, uploadToken, file, {
      contentType: file.type,
    });

  if (error) throw new Error(error.message);

  return key;
}