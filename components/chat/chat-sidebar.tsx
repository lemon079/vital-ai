'use client';

import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger
} from '@/components/ui/sheet';
import { useAgentContext } from '@/context/agent-context';
import { logout } from '@/lib/services/actions';

interface ChatSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile?: { name: string | null; age: number | null; gender: string | null };
}

export function ChatSidebar({ isOpen, onOpenChange, userProfile }: ChatSidebarProps) {
  const {
    chatHistory,
    currentChatId,
    loadChat,
    handleNewChat,
    deleteChat,
    renameChat,
  } = useAgentContext();

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-4 flex flex-col h-full bg-card border-r border-border">
        <SheetHeader className="pb-3 border-b border-border">
          <SheetTitle className="text-left font-bold text-lg text-foreground flex items-center justify-between">
            <span>Conversations</span>
            <Button
              onClick={() => {
                handleNewChat();
                onOpenChange(false);
              }}
              size="sm"
              className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              New Chat
            </Button>
          </SheetTitle>
          <SheetDescription className="text-left text-xs text-muted-foreground">
            Access previous lab analyses and health Q&A sessions
          </SheetDescription>
        </SheetHeader>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-1">
          {chatHistory.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">No saved conversations yet</p>
              <p className="text-[10px] text-muted-foreground/80 mt-1">Start a conversation to see history</p>
            </div>
          ) : (
            chatHistory.map((chat) => {
              const isActive = currentChatId === chat.id;
              const isEditing = editingChatId === chat.id;
              const isDeleting = deletingChatId === chat.id;

              const isPending = chat.isPending;

              if (isEditing) {
                return (
                  <div
                    key={chat.id}
                    className={`flex items-center gap-1 w-full px-2 py-1 bg-muted/50 rounded-lg border border-border transition-all duration-200 ${
                      isPending ? 'opacity-40 pointer-events-none cursor-wait' : ''
                    }`}
                  >
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-7 text-xs flex-1 bg-background px-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editTitle.trim()) {
                            renameChat(chat.id, editTitle.trim());
                            setEditingChatId(null);
                          }
                        } else if (e.key === 'Escape') {
                          setEditingChatId(null);
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      onClick={() => {
                        if (editTitle.trim()) {
                          renameChat(chat.id, editTitle.trim());
                          setEditingChatId(null);
                        }
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => setEditingChatId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              }

              if (isDeleting) {
                return (
                  <div
                    key={chat.id}
                    className={`flex items-center justify-between w-full px-2 py-1 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-xs transition-all duration-200 ${
                      isPending ? 'opacity-40 pointer-events-none cursor-wait' : ''
                    }`}
                  >
                    <span className="font-semibold px-1">Deleting...</span>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        onClick={() => {
                          deleteChat(chat.id);
                          setDeletingChatId(null);
                        }}
                        title="Confirm Delete"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingChatId(null)}
                        title="Cancel Delete"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between w-full rounded-lg text-left text-sm transition-all duration-200 ${
                    isPending ? 'opacity-40 pointer-events-none cursor-wait' : ''
                  } ${
                    isActive
                      ? 'bg-primary/5 text-primary border-l-2 border-l-primary font-semibold'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <button
                    onClick={() => {
                      loadChat(chat.id);
                      onOpenChange(false);
                    }}
                    className="flex-1 px-3 py-2 truncate text-left cursor-pointer"
                    title={chat.title}
                  >
                    {chat.title}
                  </button>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pr-2 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingChatId(chat.id);
                        setEditTitle(chat.title);
                      }}
                      title="Rename"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingChatId(chat.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Profile Footer */}
        <div className="mt-auto border-t border-border pt-4 pb-2 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar className="h-9 w-9 border border-border bg-primary/5 text-primary shrink-0 shadow-sm">
              <AvatarFallback className="font-semibold text-sm">
                {(userProfile?.name?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-sm font-semibold text-foreground truncate leading-tight">
                {userProfile?.name || 'User Profile'}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {userProfile?.age ? `${userProfile?.age} yrs` : 'Signed In'}
                {userProfile?.gender && userProfile?.gender !== 'Not Specified' ? ` • ${userProfile.gender}` : ''}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
