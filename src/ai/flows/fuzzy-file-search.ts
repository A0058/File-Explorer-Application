'use server';

/**
 * @fileOverview Implements fuzzy file search using Genkit and LLM.
 *
 * - fuzzyFileSearch - A function that performs fuzzy file search.
 * - FuzzyFileSearchInput - The input type for the fuzzyFileSearch function.
 * - FuzzyFileSearchOutput - The return type for the fuzzyFileSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FuzzyFileSearchInputSchema = z.object({
  filename: z.string().describe('The filename to search for (supports partial and fuzzy matching).'),
  directory: z.string().describe('The directory to search in.'),
});
export type FuzzyFileSearchInput = z.infer<typeof FuzzyFileSearchInputSchema>;

const FuzzyFileSearchOutputSchema = z.object({
  filepaths: z.array(z.string()).describe('A list of filepaths that match the search query.'),
});
export type FuzzyFileSearchOutput = z.infer<typeof FuzzyFileSearchOutputSchema>;


export async function fuzzyFileSearch(input: FuzzyFileSearchInput): Promise<FuzzyFileSearchOutput> {
  return fuzzyFileSearchFlow(input);
}

const findFiles = ai.defineTool({
  name: 'findFiles',
  description: 'Recursively searches for files in a directory that match a given name. Supports partial and case-insensitive matching.',
  inputSchema: z.object({
    filename: z.string().describe('The filename to search for (supports partial matching).'),
    directory: z.string().describe('The directory to search in.'),
  }),
  outputSchema: z.array(z.string()).describe('A list of filepaths that match the search query.'),
}, async (input) => {
  const { filename, directory } = input;
  const fs = require('fs');
  const path = require('path');

  const results: string[] = [];

  function walkSync(dir: string, filelist: string[] = []) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        filelist = walkSync(filePath, filelist);
      } else {
        if (file.toLowerCase().includes(filename.toLowerCase())) {
          filelist.push(filePath);
        }
      }
    });
    return filelist;
  }

  const filepaths = walkSync(directory);
  return filepaths;
});

const fuzzyFileSearchPrompt = ai.definePrompt({
  name: 'fuzzyFileSearchPrompt',
  tools: [findFiles],
  input: {schema: FuzzyFileSearchInputSchema},
  output: {schema: FuzzyFileSearchOutputSchema},
  prompt: `You are a file search assistant. The user will provide a filename and directory.
Use the findFiles tool to search for files that match the given filename in the specified directory.

Filename: {{{filename}}}
Directory: {{{directory}}}

Return a list of filepaths that match the search query.
`,
});

const fuzzyFileSearchFlow = ai.defineFlow(
  {
    name: 'fuzzyFileSearchFlow',
    inputSchema: FuzzyFileSearchInputSchema,
    outputSchema: FuzzyFileSearchOutputSchema,
  },
  async input => {
    const {output} = await fuzzyFileSearchPrompt(input);
    return output!;
  }
);
