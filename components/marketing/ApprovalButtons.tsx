// components/marketing/ApprovalButtons.tsx
"use client";

import { useState } from "react";

interface ApprovalButtonsProps {
  postId: string;
  onApproveSuccess?: () => void;
  onRejectSuccess?: () => void;
  disabled?: boolean;
}

export function ApprovalButtons({
  postId,
  onApproveSuccess,
  onRejectSuccess,
  disabled = false,
}: ApprovalButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    setAction("approve");
    setShowNotes(true);
  };

  const handleReject = async () => {
    setAction("reject");
    setShowNotes(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const endpoint =
        action === "approve"
          ? "/api/marketing/post/approve"
          : "/api/marketing/post/reject";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Action failed");
      }

      setShowNotes(false);
      setNotes("");
      setAction(null);

      if (action === "approve" && onApproveSuccess) {
        onApproveSuccess();
      } else if (action === "reject" && onRejectSuccess) {
        onRejectSuccess();
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!showNotes) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={disabled || loading}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded transition-colors"
        >
          ✓ Approve
        </button>
        <button
          onClick={handleReject}
          disabled={disabled || loading}
          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded transition-colors"
        >
          ✗ Reject
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
      <label className="block text-sm font-semibold">
        {action === "approve" ? "Approval" : "Rejection"} Notes (optional)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add any feedback..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={2}
      />
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`flex-1 text-white font-semibold py-2 rounded transition-colors ${
            action === "approve"
              ? "bg-green-500 hover:bg-green-600 disabled:bg-gray-300"
              : "bg-red-500 hover:bg-red-600 disabled:bg-gray-300"
          }`}
        >
          {loading
            ? "Processing..."
            : action === "approve"
              ? "Confirm Approval"
              : "Confirm Rejection"}
        </button>
        <button
          onClick={() => {
            setShowNotes(false);
            setNotes("");
            setAction(null);
          }}
          disabled={loading}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
