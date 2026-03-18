"use client";

import { useState } from "react";

import type { PersonalityTrait } from "@/types/agent-config";
import {
  useAgentPersonality,
  useAddPersonalityTraits,
  useUpdatePersonalityTraits,
  useDeletePersonalityTraits,
} from "@/hooks/useAgentConfig";
import { ConfirmModal } from "@/components/common/Modal";

interface PersonalityTabProps {
  agentId: string;
}

export function PersonalityTab({ agentId }: PersonalityTabProps) {
  const { data, isLoading } = useAgentPersonality(agentId);
  const addTraits = useAddPersonalityTraits();
  const updateTraits = useUpdatePersonalityTraits();
  const deleteTraits = useDeletePersonalityTraits();

  const [newSection, setNewSection] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingTrait, setEditingTrait] = useState<PersonalityTrait | null>(null);
  const [editSection, setEditSection] = useState("");
  const [editContent, setEditContent] = useState("");
  const [deleteConfirmTraitId, setDeleteConfirmTraitId] = useState<string | null>(null);

  const handleAdd = async () => {
    const section = newSection.trim();
    const content = newContent.trim();
    if (!section || !content) return;

    await addTraits.mutateAsync({
      agentId,
      traits: [{ section, content }],
    });
    setNewSection("");
    setNewContent("");
  };

  const startEdit = (trait: PersonalityTrait) => {
    setEditingTrait(trait);
    setEditSection(trait.section);
    setEditContent(trait.content);
  };

  const handleUpdate = async () => {
    if (!editingTrait || !editSection.trim() || !editContent.trim()) return;
    await updateTraits.mutateAsync({
      agentId,
      traits: [
        {
          id: editingTrait.id,
          section: editSection.trim(),
          content: editContent.trim(),
        },
      ],
    });
    setEditingTrait(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirmTraitId) return;
    await deleteTraits.mutateAsync({ agentId, traitIds: [deleteConfirmTraitId] });
    setDeleteConfirmTraitId(null);
  };

  if (isLoading) {
    return <span className="loading loading-spinner loading-md" />;
  }

  const sections = data?.sections ?? {};
  const totalTraits = data?.total_traits ?? 0;
  const TRAIT_LIMIT = 30;
  const atLimit = totalTraits >= TRAIT_LIMIT;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Personality Traits ({totalTraits}/{TRAIT_LIMIT})</h3>
        {atLimit && (
          <span className="badge badge-warning badge-sm">Limit reached</span>
        )}
      </div>

      {/* Traits by section */}
      {Object.entries(sections).map(([section, traits]) => (
        <div key={section} className="border border-base-300 rounded-lg p-3">
          <h4 className="font-medium text-sm mb-2 text-primary">{section}</h4>
          <div className="space-y-2">
            {traits.map((trait) => (
              <div
                key={trait.id}
                className="flex items-start gap-2 p-2 bg-base-300 rounded"
              >
                {editingTrait?.id === trait.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      className="input input-bordered input-xs w-full"
                      value={editSection}
                      onChange={(e) => setEditSection(e.target.value)}
                      placeholder="Section"
                    />
                    <textarea
                      className="textarea textarea-bordered textarea-xs w-full"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-1">
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={handleUpdate}
                        disabled={updateTraits.isPending}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => setEditingTrait(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="flex-1 text-sm whitespace-pre-wrap">
                      {trait.content}
                    </p>
                    <div className="flex gap-1 shrink-0">
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => startEdit(trait)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-xs btn-error btn-outline"
                        onClick={() => setDeleteConfirmTraitId(trait.id)}
                        disabled={deleteTraits.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {totalTraits === 0 && (
        <p className="text-base-content/40 text-sm">
          No personality traits configured
        </p>
      )}

      {/* Add new trait */}
      <div className="border border-base-300 rounded-lg p-3">
        <h4 className="text-sm font-medium mb-2">Add Trait</h4>
        <div className="space-y-2">
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            placeholder="Section (e.g. core_identity, communication_style)"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
          />
          <textarea
            className="textarea textarea-bordered w-full text-sm"
            placeholder="Trait content..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={handleAdd}
            disabled={
              !newSection.trim() || !newContent.trim() || addTraits.isPending || atLimit
            }
          >
            {addTraits.isPending ? "Adding..." : atLimit ? "Limit Reached" : "Add Trait"}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirmTraitId}
        onClose={() => setDeleteConfirmTraitId(null)}
        onConfirm={handleDelete}
        title="Delete Trait"
        message="Delete this personality trait?"
        confirmText="Delete"
        variant="error"
        loading={deleteTraits.isPending}
      />
    </div>
  );
}
