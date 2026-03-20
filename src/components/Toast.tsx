interface ToastProps {
  message: string | null;
}

function Toast({ message }: ToastProps): JSX.Element | null {
  if (!message) {
    return null;
  }

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

export default Toast;
