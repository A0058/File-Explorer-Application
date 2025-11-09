"use server";
import { ai } from "@/ai/genkit";
import { z } from "zod";
import { fileSystem } from "@/lib/file-system";

const matchingFilesSchema = z.object({
  filepaths: z
    .array(z.string())
    .describe(
      "A list of filepaths that are a semantic or fuzzy match for the search query."
    ),
});

export async function searchFilesAi(
  currentPath: string,
  query: string
): Promise<string[]> {
  const allFiles = fileSystem.getAllFilePaths();
  try {
    const result = await ai.generate({
      model: ai.model,
      prompt: `
        You are a file search assistant. Given a list of file paths, find all paths that are a fuzzy, partial, or semantic match for the user's search query within the current directory and its subdirectories.
        For example, if the user searches for "doc", you should match "document.txt", "docs", and "mydoc.pdf".
        If the user searches for "image", you could match "photo.jpg", "picture.png", etc.

        User search query: "${query}"
        Current directory: "${currentPath}"

        List of all available file paths:
        ${allFiles.join("\n")}

        Return only file paths that are within the current directory or its subdirectories.
        Respond with only a JSON object containing the matching file paths.
      `,
      output: {
        format: "json",
        schema: matchingFilesSchema,
      },
      config: {
        temperature: 0.1,
      },
    });

    const output = result.output;
    return output?.filepaths ?? [];
  } catch (error) {
    console.error("AI search failed:", error);
    // Fallback to simple search
    return allFiles.filter(
      (p) =>
        p.toLowerCase().includes(query.toLowerCase()) && p.startsWith(currentPath)
    );
  }
}
