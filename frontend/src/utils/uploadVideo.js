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

export const uploadAssignmentFile = async ({
  file,
  assignmentId,
  token
}) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const response = await fetch(`${API_URL}/api/uploads/assignment`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        assignmentId,
        contentType: file.type,
        fileSize: file.size
    })
  });

  const data = await response.json();

  if (!response.ok) {
      throw new Error(data.message || "Unable to prepare assignment upload");
  }

  const { key, token: uploadToken } = data.data;

  const { error } = await supabase.storage
      .from("assignments")
      .uploadToSignedUrl(key, uploadToken, file);

  if (error) {
      throw new Error(error.message || "Assignment file upload failed");
  }

  return {
      fileKey: key,
      fileName: file.name
  };
};


export const uploadProfileImage = async ({ file, token }) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
      throw new Error("Please choose a JPG, PNG or WebP image");
  }

  if (file.size > 5 * 1024 * 1024) {
      throw new Error("Profile image must be 5 MB or smaller");
  }

  const response = await fetch(`${API}/api/uploads/profile-image`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
          contentType: file.type,
          fileSize: file.size
      })
  });

  const data = await response.json();

  if (!response.ok) {
      throw new Error(data.message || "Unable to prepare profile image upload");
  }

  const { key, token: uploadToken } = data.data;

  const { error } = await supabase.storage
      .from("profiles")
      .uploadToSignedUrl(key, uploadToken, file, {
          contentType: file.type
      });

  if (error) {
      throw new Error(error.message || "Profile image upload failed");
  }

  const { data: imageData } = supabase.storage
      .from("profiles")
      .getPublicUrl(key);

  return imageData.publicUrl;
};
