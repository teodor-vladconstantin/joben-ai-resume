import { reconstructLines, parseResumeTextToData } from "@/lib/resume-parser";
import type { ResumeTemplateData } from "@/components/templates/types";
import { join } from "path";

type PdfjsTextItem = {
  str: string;
  transform?: number[];
};

/**
 * Server-side PDF parsing for Node.js.
 * Uses pdfjs-dist with explicit worker path for Node.
 */
export async function parsePdfBuffer(
  buffer: Buffer,
): Promise<ResumeTemplateData> {
  const pdfjsLib = await import("pdfjs-dist");

  // Configure worker for Node.js environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "build",
    "pdf.worker.min.js",
  );

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const allLines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const items = (content.items as PdfjsTextItem[])
      .filter((item) => item.str.trim())
      .map((item) => ({
        str: item.str,
        x: item.transform?.[4] ?? 0,
        y: item.transform?.[5] ?? 0,
      }));

    allLines.push(...reconstructLines(items), "");
  }

  const lines = allLines.filter(
    (line, i, arr) => line !== "" || arr[i - 1] !== "",
  );
  const textContent = lines.filter(Boolean).join(" ");

  if (textContent.length < 50) {
    throw new Error(
      "PDF appears to be a scanned image — text extraction is not possible",
    );
  }

  return parseResumeTextToData(lines);
}
