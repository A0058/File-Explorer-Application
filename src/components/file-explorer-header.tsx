"use client";

import React, { useState } from "react";
import {
  FolderPlus,
  FilePlus,
  Search,
  Home,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { CommandeerIcon } from "./icons";
import { fileSystem } from "@/lib/file-system";
import path from "path-browserify";
import { searchFilesAi } from "@/app/actions";

interface FileExplorerHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onUpdate: () => void;
}

export function FileExplorerHeader({
  currentPath,
  onNavigate,
  onUpdate,
}: FileExplorerHeaderProps) {
  const { toast } = useToast();
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isFileOpen, setIsFileOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleCreateFile = () => {
    if (!newFileName) {
      toast({ variant: "destructive", title: "Error", description: "File name cannot be empty." });
      return;
    }
    const newPath = path.join(currentPath, newFileName);
    const result = fileSystem.create(newPath, 'file');
    if (result) {
      toast({ title: "Success", description: `File "${newFileName}" created.` });
      onUpdate();
      setNewFileName("");
      setIsFileOpen(false);
    } else {
      toast({ variant: "destructive", title: "Error", description: "File already exists or path is invalid." });
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName) {
      toast({ variant: "destructive", title: "Error", description: "Folder name cannot be empty." });
      return;
    }
    const newPath = path.join(currentPath, newFolderName);
    const result = fileSystem.create(newPath, 'directory');
    if (result) {
      toast({ title: "Success", description: `Folder "${newFolderName}" created.` });
      onUpdate();
      setNewFolderName("");
      setIsFolderOpen(false);
    } else {
      toast({ variant: "destructive", title: "Error", description: "Folder already exists or path is invalid." });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
        const results = await searchFilesAi(currentPath, searchQuery);
        setSearchResults(results);
    } catch (error) {
        toast({ variant: "destructive", title: "Search Failed", description: "An error occurred during search." });
    }
    setIsSearching(false);
  };
  
  const breadcrumbParts = currentPath.split("/").filter((p) => p);

  return (
    <header className="flex items-center justify-between p-2 border-b border-border">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <CommandeerIcon className="h-7 w-7 text-primary" />
        <h1 className="font-headline">Commandeer</h1>
      </div>
      <div className="flex-1 flex justify-center items-center gap-1 text-sm text-muted-foreground">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("/")}><Home className="h-4 w-4" /></Button>
        <ChevronRight className="h-4 w-4" />
        {currentPath === "/" ? (<span>(root)</span>) :
          breadcrumbParts.map((part, index) => {
            const pathSlice = "/" + breadcrumbParts.slice(0, index + 1).join("/");
            return (
              <React.Fragment key={index}>
                <button onClick={() => onNavigate(pathSlice)} className="hover:text-foreground">{part}</button>
                <ChevronRight className="h-4 w-4" />
              </React.Fragment>
            );
          })}
      </div>
      <div className="flex items-center gap-2">
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>File Search</DialogTitle>
              <DialogDescription>
                Search for files recursively from the current directory. Supports fuzzy matching.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g., 'report' or 'image'" />
                <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                </Button>
            </div>
            <div className="mt-4 max-h-64 overflow-y-auto">
                <h3 className="font-semibold mb-2">Results:</h3>
                {isSearching && <p>Searching...</p>}
                {!isSearching && searchResults.length === 0 && <p className="text-muted-foreground">No results found.</p>}
                <ul>
                    {searchResults.map((res, i) => (
                        <li key={i} className="text-sm p-1 rounded hover:bg-muted cursor-pointer" onClick={() => { onNavigate(path.dirname(res)); setIsSearchOpen(false); }}>{res}</li>
                    ))}
                </ul>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isFileOpen} onOpenChange={setIsFileOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FilePlus className="mr-2 h-4 w-4" />
              New File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New File</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file-name" className="text-right">File Name</Label>
                <Input id="file-name" value={newFileName} onChange={e => setNewFileName(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateFile}>Create File</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isFolderOpen} onOpenChange={setIsFolderOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="folder-name" className="text-right">Folder Name</Label>
                <Input id="folder-name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateFolder}>Create Folder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
