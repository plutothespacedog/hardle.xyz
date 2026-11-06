import React from 'react'

// Short in-game message (e.g. "Not a word") that fades out on its own.
// `toast` is { message, id }; a new id restarts the animation.
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className='toastWrap' role='status' aria-live='polite'>
      <div key={toast.id} className='toast'>{toast.message}</div>
    </div>
  );
}

export default Toast
