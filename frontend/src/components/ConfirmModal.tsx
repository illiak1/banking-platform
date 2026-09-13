// frontend/src/components/ConfirmModal.tsx
//
// Generic yes/no confirmation dialog. Dashboard uses it to make sure a
// transfer's recipient and amount are intentional before any money moves —
// there is no undo once the request is sent.

import React from 'react';
import styles from '../styles/Modal.module.css';

interface ConfirmModalProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        // Stop the click from bubbling to the overlay, which would close the
        // dialog out from under whatever the user just clicked inside it.
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className={styles.title}>
          {title}
        </h3>
        <div className={styles.body}>{message}</div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={busy}
            autoFocus
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
