import { z } from "zod";

export const uploadFileSchema = z.object({
  body: z.object({
    filename: z
      .string()
      .trim()
      .min(1, "Filename is required")
      .max(255, "Filename cannot exceed 255 characters"),
    mimeType: z.enum(
      [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
        "text/plain",
        "text/markdown",
      ],
      {
        errorMap: () => ({
          message:
            "Supported formats: PDF (.pdf), Images (.png, .jpeg, .webp), Text (.txt, .md)",
        }),
      },
    ),
    dataBase64: z
      .string()
      .min(1, "File content data is required")
      .max(14000000, "File exceeds 10MB limit"),
  }),
});
