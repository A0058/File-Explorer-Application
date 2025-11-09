"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  File,
  Folder,
  MoreVertical,
  ArrowUpDown,
  Edit,
  Trash2,
  Lock,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { FileNode, formatPermissions, formatSize } from "@/lib/file-system";
import path from "path-browserify";

type SortKey = "name" | "size" | "modified";
type SortDirection = "asc" | "desc";

interface FileTableProps {
  files: FileNode[];
  onNavigate: (path: string) => void;
  onAction: (action: string, filePath: string, value?: any) => void;
  currentPath: string;
}

const PermissionCheckbox = ({ label, id, checked, onCheckedChange }: { label: string, id: string, checked: boolean, onCheckedChange: (c: boolean) => void }) => (
    <div className="flex items-center space-x-2">
        <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
        <Label htmlFor={id} className="text-sm font-normal">{label}</Label>
    </div>
)

export function FileTable({ files, onNavigate, onAction, currentPath }: FileTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [renameOpen, setRenameOpen] = useState(false);
    const [permissionsOpen, setPermissionsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
    const [newName, setNewName] = useState("");
    const [permissions, setPermissions] = useState(0);

    const sortedFiles = [...files].sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        let comparison = 0;
        if (valA > valB) comparison = 1;
        else if (valA < valB) comparison = -1;
        
        // Directories always first
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    const handleRename = () => {
        if (selectedFile && newName) {
            const newPath = path.join(path.dirname(path.join(currentPath, selectedFile.name)), newName);
            onAction('rename', path.join(currentPath, selectedFile.name), newPath);
        }
        setRenameOpen(false);
        setNewName("");
    };

    const handlePermissionsChange = () => {
        if (selectedFile) {
            onAction('permissions', path.join(currentPath, selectedFile.name), permissions);
        }
        setPermissionsOpen(false);
    };

    const parsePermissions = (mode: number) => {
        const s = mode.toString(8).padStart(3, '0');
        const [owner, group, others] = s.split('').map(Number);
        return {
            owner: { r: !!(owner & 4), w: !!(owner & 2), x: !!(owner & 1) },
            group: { r: !!(group & 4), w: !!(group & 2), x: !!(group & 1) },
            others: { r: !!(others & 4), w: !!(others & 2), x: !!(others & 1) },
        };
    };

    const buildPermissions = (perms: ReturnType<typeof parsePermissions>) => {
        const owner = (perms.owner.r ? 4 : 0) + (perms.owner.w ? 2 : 0) + (perms.owner.x ? 1 : 0);
        const group = (perms.group.r ? 4 : 0) + (perms.group.w ? 2 : 0) + (perms.group.x ? 1 : 0);
        const others = (perms.others.r ? 4 : 0) + (perms.others.w ? 2 : 0) + (perms.others.x ? 1 : 0);
        return parseInt(`${owner}${group}${others}`, 8);
    };

    const updatePermission = (user: 'owner'|'group'|'others', right: 'r'|'w'|'x', value: boolean) => {
        const currentPerms = parsePermissions(permissions);
        currentPerms[user][right] = value;
        setPermissions(buildPermissions(currentPerms));
    }
    
    const currentPermsObj = parsePermissions(permissions);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Type</TableHead>
            <TableHead onClick={() => handleSort('name')}>
              <Button variant="ghost" size="sm">Name <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
            </TableHead>
            <TableHead onClick={() => handleSort('modified')}>
              <Button variant="ghost" size="sm">Date Modified <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
            </TableHead>
            <TableHead onClick={() => handleSort('size')}>
              <Button variant="ghost" size="sm">Size <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
            </TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFiles.map((file) => (
            <TableRow key={file.id} onDoubleClick={() => file.type === 'directory' && onNavigate(path.join(currentPath, file.name))} className="cursor-pointer">
              <TableCell>
                {file.type === "directory" ? (
                  <Folder className="h-5 w-5 text-primary" />
                ) : (
                  <File className="h-5 w-5 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell className="font-medium">{file.name}</TableCell>
              <TableCell>{file.modified.toLocaleString()}</TableCell>
              <TableCell>{file.type === 'file' ? formatSize(file.size) : '-'}</TableCell>
              <TableCell className="font-mono">{formatPermissions(file.permissions)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => { setSelectedFile(file); setNewName(file.name); setRenameOpen(true); }}>
                      <Edit className="mr-2 h-4 w-4" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => { setSelectedFile(file); setPermissions(file.permissions); setPermissionsOpen(true); }}>
                      <Lock className="mr-2 h-4 w-4" /> Permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onAction('delete', path.join(currentPath, file.name))} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Rename {selectedFile?.name}</DialogTitle></DialogHeader>
                <Input value={newName} onChange={e => setNewName(e.target.value)} />
                <DialogFooter><Button onClick={handleRename}>Save</Button></DialogFooter>
            </DialogContent>
        </Dialog>
        <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Permissions for {selectedFile?.name}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-3 gap-4 p-4">
                    <div>
                        <h4 className="font-semibold mb-2">Owner</h4>
                        <PermissionCheckbox id="or" label="Read" checked={currentPermsObj.owner.r} onCheckedChange={(c) => updatePermission('owner', 'r', c)} />
                        <PermissionCheckbox id="ow" label="Write" checked={currentPermsObj.owner.w} onCheckedChange={(c) => updatePermission('owner', 'w', c)} />
                        <PermissionCheckbox id="ox" label="Execute" checked={currentPermsObj.owner.x} onCheckedChange={(c) => updatePermission('owner', 'x', c)} />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Group</h4>
                        <PermissionCheckbox id="gr" label="Read" checked={currentPermsObj.group.r} onCheckedChange={(c) => updatePermission('group', 'r', c)} />
                        <PermissionCheckbox id="gw" label="Write" checked={currentPermsObj.group.w} onCheckedChange={(c) => updatePermission('group', 'w', c)} />
                        <PermissionCheckbox id="gx" label="Execute" checked={currentPermsObj.group.x} onCheckedChange={(c) => updatePermission('group', 'x', c)} />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Others</h4>
                        <PermissionCheckbox id="tr" label="Read" checked={currentPermsObj.others.r} onCheckedChange={(c) => updatePermission('others', 'r', c)} />
                        <PermissionCheckbox id="tw" label="Write" checked={currentPermsObj.others.w} onCheckedChange={(c) => updatePermission('others', 'w', c)} />
                        <PermissionCheckbox id="tx" label="Execute" checked={currentPermsObj.others.x} onCheckedChange={(c) => updatePermission('others', 'x', c)} />
                    </div>
                </div>
                <p className="text-center font-mono text-lg">{formatPermissions(permissions)} ({permissions.toString(8)})</p>
                <DialogFooter><Button onClick={handlePermissionsChange}>Save Permissions</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
