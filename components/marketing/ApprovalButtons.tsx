// components/marketing/ApprovalButtons.tsx
'use client';

import { useState } from 'react';

interface ApprovalButtonsProps {
  postId: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isLoading?: boolean;
}

export default function ApprovalButtons({
  postId,
  onApprove,
  onReject,
  isLoading = false,
}: ApprovalButtonsProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, ingresa una razón para el rechazo');
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(rejectionReason);
      setShowRejectForm(false);
      setRejectionReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showRejectForm) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Razón del rechazo
        </label>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Explica por qué se rechaza este post..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          rows={3}
          disabled={isSubmitting}
        />
        <div className="flex gap-3">
          <button
            onClick={handleRejectSubmit}
            disabled={isSubmitting || !rejectionReason.trim()}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Rechazando...' : 'Rechazar'}
          </button>
          <button
            onClick={() => {
              setShowRejectForm(false);
              setRejectionReason('');
            }}
            disabled={isSubmitting}
            className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 disabled:opacity-50 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={onApprove}
        disabled={isLoading || isSubmitting}
        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        <span>✅</span>
        <span>{isLoading ? 'Aprobando...' : 'Aprobar'}</span>
      </button>
      <button
        onClick={() => setShowRejectForm(true)}
        disabled={isLoading || isSubmitting}
        className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        <span>❌</span>
        <span>{isLoading ? 'Procesando...' : 'Rechazar'}</span>
      </button>
    </div>
  );
}
