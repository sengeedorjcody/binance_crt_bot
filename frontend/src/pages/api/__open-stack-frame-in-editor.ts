import { spawn } from "child_process";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  success: boolean;
  message: string;
  editor?: string;
  file?: string;
  error?: string;
};

// Detect which editor to use
function detectEditor(): string {
  // Check for common editors in order of preference
  const editors = [
    { name: 'code', env: 'VSCODE' },      // VS Code
    { name: 'cursor', env: 'CURSOR' },     // Cursor
    { name: 'code-insiders', env: null },  // VS Code Insiders
    { name: 'webstorm', env: null },       // WebStorm
    { name: 'idea', env: null },           // IntelliJ IDEA
    { name: 'subl', env: null },           // Sublime Text
    { name: 'atom', env: null },           // Atom
  ];

  // Check if LAUNCH_EDITOR is set (commonly used by react-dev-inspector)
  if (process.env.LAUNCH_EDITOR) {
    return process.env.LAUNCH_EDITOR;
  }

  // Check if CODE_EDITOR is set
  if (process.env.CODE_EDITOR) {
    return process.env.CODE_EDITOR;
  }

  // Default to VS Code - most common for React development
  return 'code';
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      success: false,
      message: "Only available in development mode",
    });
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const { fileName, lineNumber, colNumber } = req.query;

  if (!fileName || typeof fileName !== "string") {
    return res.status(400).json({
      success: false,
      message: "fileName is required",
    });
  }

  try {
    const projectRoot = process.cwd();
    
    // Handle both absolute and relative paths
    let filePath: string;
    if (path.isAbsolute(fileName)) {
      filePath = fileName;
    } else {
      filePath = path.resolve(projectRoot, fileName);
    }

    // Use VS Code by default, not system EDITOR
    const editor = detectEditor();
    const line = (lineNumber as string) || "1";
    const col = (colNumber as string) || "1";

    let command: string;
    let args: string[];
    
    if (editor === "code" || editor === "code-insiders" || editor.includes("code")) {
      // VS Code / VS Code Insiders
      command = editor;
      args = [
        "--reuse-window",
        "--goto",
        `${filePath}:${line}:${col}`,
      ];
    } else if (editor === "cursor") {
      // Cursor editor (VS Code fork)
      command = "cursor";
      args = [
        "--reuse-window",
        "--goto",
        `${filePath}:${line}:${col}`,
      ];
    } else if (editor === "webstorm" || editor === "idea" || editor === "phpstorm" || editor === "pycharm") {
      // JetBrains IDEs
      command = editor;
      args = [
        "--line",
        line,
        "--column",
        col,
        filePath,
      ];
    } else if (editor === "sublime" || editor === "subl") {
      // Sublime Text
      command = "subl";
      args = [`${filePath}:${line}:${col}`];
    } else if (editor === "atom") {
      // Atom
      command = "atom";
      args = [`${filePath}:${line}:${col}`];
    } else if (editor === "emacs" || editor === "emacsclient") {
      // Emacs
      command = "emacsclient";
      args = ["-n", `+${line}:${col}`, filePath];
    } else if (editor === "vim" || editor === "nvim" || editor === "vi") {
      // Vim/Neovim - open in new terminal (macOS)
      if (process.platform === "darwin") {
        command = "open";
        args = ["-a", "Terminal", filePath];
      } else {
        // Fallback to VS Code for non-terminal editors
        command = "code";
        args = ["--reuse-window", "--goto", `${filePath}:${line}:${col}`];
      }
    } else {
      // Default fallback to VS Code
      command = "code";
      args = ["--reuse-window", "--goto", `${filePath}:${line}:${col}`];
    }

    console.log(`[React Inspector] Opening ${filePath}:${line}:${col}`);
    console.log(`[React Inspector] Command: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      stdio: "ignore",
      detached: true,
      cwd: projectRoot,
      shell: process.platform === "win32", // Use shell on Windows
      env: {
        ...process.env,
        // Ensure VS Code can find its dependencies
        PATH: process.env.PATH,
      },
    });

    child.unref();

    // Handle spawn errors
    child.on("error", (err) => {
      console.error(`[React Inspector] Failed to spawn editor:`, err);
    });

    res.status(200).json({
      success: true,
      message: `Opened ${fileName}:${line}:${col}`,
      editor: command,
      file: fileName,
    });
  } catch (error) {
    console.error("[React Inspector] Error opening file in editor:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Failed to open file in editor",
      error: errorMessage,
    });
  }
}
