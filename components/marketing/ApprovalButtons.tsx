// components/marketing/ApprovalButtons.tsx
'use client';

import { useState } from 'react';
import { useLocale } from '@/components/LocaleProvider';

interface ApprovalButtonsProps {
  postId: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isLoading?: boolean;
}

export default function ApprovalButtons({
  postId: _postId,
  onApprove,
  onReject,
  isLoading = false,
}: ApprovalButtonsProps) {
  const { t } = useLocale();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) return;

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
      <div className="approval-reject-form">
        <label className="approval-reject-label">{t('marketing.rejectReason')}</label>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder={t('marketing.rejectPlaceholder')}
          className="approval-reject-textarea"
          rows={2}
          disabled={isSubmitting}
        />
        <div className="approval-btn-row">
          <button
            type="button"
            onClick={handleRejectSubmit}
            disabled={isSubmitting || !rejectionReason.trim()}
            className="approval-btn approval-btn--reject"
          >
            {isSubmitting ? t('marketing.rejecting') : t('marketing.reject')}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowRejectForm(false);
              setRejectionReason('');
            }}
            disabled={isSubmitting}
            className="approval-btn approval-btn--ghost"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="approval-btn-row">
      <button
        type="button"
        onClick={onApprove}
        disabled={isLoading || isSubmitting}
        className="approval-btn approval-btn--approve"
      >
        {isLoading ? t('marketing.approving') : t('marketing.approve')}
      </button>
      <button
        type="button"
        onClick={() => setShowRejectForm(true)}
        disabled={isLoading || isSubmitting}
        className="approval-btn approval-btn--reject-outline"
      >
        {t('marketing.reject')}
      </button>
    </div>
  );
}
