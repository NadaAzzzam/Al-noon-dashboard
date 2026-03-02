import { useState } from "react";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";
import i18n from "../i18n";

type ToastProps = { id: string; message: string; onResolve: (v: boolean) => void };

function ConfirmToastContent({ id, message, onResolve }: ToastProps) {
  const [closed, setClosed] = useState(false);

  const handleClick = (value: boolean) => {
    if (closed) return;
    setClosed(true);
    onResolve(value);
    toast.dismiss(id);
  };

  const overlay = (
    <div
      className={`confirm-toast-overlay${closed ? " confirm-toast-overlay--closed" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-toast-message"
    >
      <div className="confirm-toast">
        <p id="confirm-toast-message" className="confirm-toast-message">{message}</p>
        <div className="confirm-toast-actions">
          <button type="button" className="button secondary confirm-toast-btn" onClick={() => handleClick(false)}>
            {i18n.t("common.cancel")}
          </button>
          <button type="button" className="button confirm-toast-btn confirm-toast-btn-danger" onClick={() => handleClick(true)}>
            {i18n.t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(overlay, document.body);
}

/** Shows a toast confirmation with "Are you sure that you want to remove?" message and Confirm/Cancel buttons. */
export function confirmRemove(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    toast.custom(
      (t) => <ConfirmToastContent id={t.id} message={message} onResolve={resolve} />,
      { duration: Infinity }
    );
  });
}
