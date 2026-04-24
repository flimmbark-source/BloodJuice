import type { PropsWithChildren } from 'react';

export function Modal({ children }: PropsWithChildren) {
  return (
    <div className="overlay">
      <div className="modal">{children}</div>
    </div>
  );
}
