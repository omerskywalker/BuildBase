"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, ChevronUp, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PlaybookEntry } from "@/lib/types";

interface EntryFormData {
  title: string;
  content: string;
  category: string;
}

const EMPTY_FORM: EntryFormData = { title: "", content: "", category: "" };

export default function PlaybookPage() {
  const [entries, setEntries] = useState<PlaybookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EntryFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/coach/playbook");
      if (!res.ok) {
        throw new Error("Failed to fetch playbook entries");
      }
      const data = await res.json();
      setEntries(data);
    } catch {
      toast.error("Failed to load playbook entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const toggleEntry = (entryId: string) => {
    setExpandedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (entry: PlaybookEntry) => {
    setEditingId(entry.id);
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category ?? "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category.trim() || null,
      };

      let res: Response;
      if (editingId) {
        res = await fetch("/api/coach/playbook", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
      } else {
        res = await fetch("/api/coach/playbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(editingId ? "Entry updated" : "Entry created");
      closeForm();
      fetchEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/coach/playbook?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      toast.success("Entry deleted");
      fetchEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEntries = entries.filter(entry => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      entry.title.toLowerCase().includes(searchLower) ||
      entry.content.toLowerCase().includes(searchLower) ||
      (entry.category?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  // Group entries by category
  const categories = Array.from(
    new Set(filteredEntries.map(e => e.category || "Uncategorized"))
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-content-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary font-display mb-1">
            Coach&apos;s Playbook
          </h1>
          <p className="text-sm text-content-secondary">
            Coaching guides and reference material
          </p>
        </div>
        <Button onClick={openCreateForm} className="gap-2">
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="mb-6 border-accent/30">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">
              {editingId ? "Edit Entry" : "New Playbook Entry"}
            </CardTitle>
            <button onClick={closeForm} className="text-content-muted hover:text-content-primary">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="entry-title">Title</Label>
              <Input
                id="entry-title"
                placeholder="e.g. Squat Technique Guide"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="entry-category">Category</Label>
              <Input
                id="entry-category"
                placeholder="e.g. Movement Patterns, Programming, Coaching"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="entry-content">Content</Label>
              <Textarea
                id="entry-content"
                placeholder="Write your playbook content here..."
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeForm} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-content-muted w-4 h-4" />
        <Input
          placeholder="Search by title, content, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      {searchTerm && (
        <p className="text-sm text-content-secondary mb-4">
          Found {filteredEntries.length} entr{filteredEntries.length !== 1 ? "ies" : "y"} matching &quot;{searchTerm}&quot;
        </p>
      )}

      {/* Entries grouped by category */}
      {categories.length > 0 && (
        <div className="space-y-6">
          {categories.map(category => {
            const categoryEntries = filteredEntries.filter(
              e => (e.category || "Uncategorized") === category
            );
            return (
              <div key={category}>
                <h2 className="text-sm font-semibold text-content-muted uppercase tracking-wider mb-3">
                  {category}
                </h2>
                <div className="space-y-3">
                  {categoryEntries.map(entry => (
                    <Card key={entry.id}>
                      <CardHeader
                        className="cursor-pointer hover:bg-bg-hover transition-colors"
                        onClick={() => toggleEntry(entry.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <CardTitle className="text-lg truncate">{entry.title}</CardTitle>
                            {entry.category && (
                              <span className="text-xs px-2 py-1 bg-bg-surface rounded-full text-content-secondary flex-shrink-0">
                                {entry.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                openEditForm(entry);
                              }}
                              className="p-1.5 rounded hover:bg-bg-hover text-content-muted hover:text-content-primary"
                              title="Edit entry"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDelete(entry.id);
                              }}
                              disabled={deletingId === entry.id}
                              className={cn(
                                "p-1.5 rounded hover:bg-error/10 text-content-muted hover:text-error",
                                deletingId === entry.id && "opacity-50 cursor-not-allowed"
                              )}
                              title="Delete entry"
                            >
                              {deletingId === entry.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                            {expandedEntries[entry.id] ? (
                              <ChevronUp className="w-5 h-5 text-content-secondary" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-content-secondary" />
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {expandedEntries[entry.id] && (
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            <div className="text-content-secondary whitespace-pre-line">
                              {entry.content}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {entries.length === 0 && !loading && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-content-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No playbook entries yet</h3>
          <p className="text-content-secondary mb-4">
            Start building your coaching playbook by adding your first entry.
          </p>
          <Button onClick={openCreateForm} className="gap-2">
            <Plus className="w-4 h-4" />
            Create First Entry
          </Button>
        </div>
      )}

      {entries.length > 0 && filteredEntries.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-content-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No results found</h3>
          <p className="text-content-secondary">
            Try adjusting your search terms or browse all entries by clearing the search.
          </p>
        </div>
      )}
    </div>
  );
}
