"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileNode, fileSystem } from "@/lib/file-system";
import { FileExplorerHeader } from "./file-explorer-header";
import { FileTable } from "./file-table";
import { Terminal } from "./terminal";
import { useToast } from "@/hooks/use-toast";
import path from "path-browserify";

export function CommandeeringInterface() {
  const [currentPath, setCurrentPath] = useState("/");
  const [files, setFiles] = useState<FileNode[]>([]);
  const [history, setHistory] = useState<
    { command: string; output: React.ReactNode }[]
  >([]);
  const { toast } = useToast();

  const loadFiles = useCallback((p: string) => {
    const sanitizedPath = path.resolve('/', p);
    const node = fileSystem.getNode(sanitizedPath);
    if (node && node.type === "directory") {
      setCurrentPath(sanitizedPath);
      setFiles(fileSystem.list(sanitizedPath));
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: `cd: no such file or directory: ${p}`,
      });
    }
  }, [toast]);

  useEffect(() => {
    loadFiles(currentPath);
  }, []);

  const addToHistory = (command: string, output: React.ReactNode) => {
    setHistory((prev) => [...prev, { command, output }]);
  };

  const handleCommand = (command: string) => {
    const [cmd, ...args] = command.trim().split(" ");
    addToHistory(command, null);

    switch (cmd) {
      case "ls":
        // This is handled by the UI, but we can show a message
        addToHistory("", `Listed files in ${currentPath}`);
        break;
      case "pwd":
        addToHistory("", currentPath);
        break;
      case "cd": {
        const target = args[0] || "/";
        if (target === "..") {
          loadFiles(path.dirname(currentPath));
        } else if (target === "home") {
          loadFiles("/");
        } else {
          const newPath = path.resolve(currentPath, target);
          loadFiles(newPath);
        }
        break;
      }
      case "mkdir":
      case "touch": {
        if (args.length === 0) {
          addToHistory("", `Usage: ${cmd} <name>`);
          return;
        }
        const newPath = path.resolve(currentPath, args[0]);
        const result = fileSystem.create(newPath, cmd === 'mkdir' ? 'directory' : 'file');
        if (result) {
          addToHistory("", `${cmd === 'mkdir' ? 'Directory' : 'File'} created: ${args[0]}`);
          loadFiles(currentPath);
        } else {
          addToHistory("", `Error: Could not create. File or directory may already exist.`);
        }
        break;
      }
      case "rm": {
        if (args.length === 0) {
          addToHistory("", "Usage: rm <path>");
          return;
        }
        const targetPath = path.resolve(currentPath, args[0]);
        if (fileSystem.remove(targetPath)) {
          addToHistory("", `Removed: ${targetPath}`);
          loadFiles(currentPath);
        } else {
          addToHistory("", `Error: Could not remove ${targetPath}.`);
        }
        break;
      }
      case "mv":
      case "cp": {
        if (args.length !== 2) {
          addToHistory("", `Usage: ${cmd} <source> <destination>`);
          return;
        }
        const sourcePath = path.resolve(currentPath, args[0]);
        const destPath = path.resolve(currentPath, args[1]);
        const op = cmd === 'mv' ? fileSystem.rename : fileSystem.copy;

        if (op(sourcePath, destPath)) {
          addToHistory("", `Success: ${sourcePath} -> ${destPath}`);
          loadFiles(currentPath);
        } else {
          addToHistory("", `Error: Operation failed.`);
        }
        break;
      }
      case "chmod": {
        if (args.length !== 2) {
            addToHistory("", "Usage: chmod <mode> <path>");
            return;
        }
        const mode = parseInt(args[0], 8);
        const targetPath = path.resolve(currentPath, args[1]);

        if (isNaN(mode)) {
            addToHistory("", "Error: Invalid mode.");
            return;
        }

        if (fileSystem.chmod(targetPath, mode)) {
            addToHistory("", `Permissions changed for ${targetPath}`);
            loadFiles(currentPath);
        } else {
            addToHistory("", `Error: Could not change permissions for ${targetPath}.`);
        }
        break;
      }
      case 'find':
        addToHistory("", `Searching for "${args.join(' ')}"... This will open a dialog with results.`);
        // The actual search is triggered from the UI, so this is just feedback.
        break;
      case "help":
        const helpText = (
          <pre className="text-sm whitespace-pre-wrap">
            Available commands:\n
            ls - List files\n
            pwd - Print working directory\n
            cd [path|..|home] - Change directory\n
            mkdir [name] - Create directory\n
            touch [name] - Create file\n
            rm [path] - Remove file/directory\n
            mv [src] [dest] - Move/Rename\n
            cp [src] [dest] - Copy\n
            chmod [mode] [path] - Change permissions (e.g., 755)\n
            find [query] - Search for files (opens dialog)\n
            clear - Clear terminal history\n
            exit - Close the application
          </pre>
        );
        addToHistory("", helpText);
        break;
      case "clear":
        setHistory([]);
        break;
      case "exit":
        addToHistory("", "Goodbye!");
        // In a real terminal this would exit. Here we can just show a message.
        break;
      default:
        addToHistory("", `${cmd}: command not found`);
    }
  };

  const handleFileAction = (action: string, filePath: string, value?: any) => {
    switch (action) {
        case 'delete':
            if (fileSystem.remove(filePath)) {
                toast({ title: 'Success', description: `Deleted ${filePath}` });
                loadFiles(currentPath);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: `Could not delete ${filePath}` });
            }
            break;
        case 'rename':
            if (fileSystem.rename(filePath, value)) {
                toast({ title: 'Success', description: `Renamed to ${value}` });
                loadFiles(currentPath);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: `Could not rename.` });
            }
            break;
        case 'permissions':
            if (fileSystem.chmod(filePath, value)) {
                toast({ title: 'Success', description: `Permissions updated for ${path.basename(filePath)}` });
                loadFiles(currentPath);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: `Could not update permissions.` });
            }
            break;
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 gap-4">
      <FileExplorerHeader
        currentPath={currentPath}
        onNavigate={loadFiles}
        onUpdate={() => loadFiles(currentPath)}
      />
      <div className="flex-grow overflow-auto border border-border rounded-lg">
        <FileTable
          files={files}
          onNavigate={loadFiles}
          onAction={handleFileAction}
          currentPath={currentPath}
        />
      </div>
      <div className="h-1/3 flex-shrink-0">
        <Terminal
          history={history}
          onCommand={handleCommand}
          currentPath={currentPath}
        />
      </div>
    </div>
  );
}
