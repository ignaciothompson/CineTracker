import { useId, useRef, useState } from 'react';
import './JsonFileSlot.css';

export interface JsonFileSlotProps {
  label: string;
  hint: string;
  icon?: string;
  file?: File;
  disabled?: boolean;
  accent?: string;
  onFileChange: (file: File | undefined) => void;
}

export function JsonFileSlot({
  label,
  hint,
  icon = '📄',
  file,
  disabled = false,
  accent = 'var(--seria)',
  onFileChange,
}: JsonFileSlotProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = () => {
    if (!disabled) inputRef.current?.click();
  };

  const acceptFile = (next: File | undefined) => {
    if (!next || disabled) return;
    const isJson =
      next.name.endsWith('.json') ||
      next.type === 'application/json' ||
      next.type === '';
    if (!isJson) return;
    onFileChange(next);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(undefined);
    if (inputRef.current) inputRef.current.value = '';
  };

  const stateClass = file ? 'has-file' : dragOver ? 'drag-over' : '';

  return (
    <div
      className={`json-file-slot ${stateClass}`}
      style={{ '--slot-accent': accent } as React.CSSProperties}
      onClick={pickFile}
      onKeyDown={(e) => e.key === 'Enter' && pickFile()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".json,application/json"
        disabled={disabled}
        className="json-file-slot-input"
        onChange={(e) => acceptFile(e.target.files?.[0])}
      />

      <div className="json-file-slot-icon" aria-hidden>{icon}</div>

      <div className="json-file-slot-body">
        <div className="json-file-slot-label">{label}</div>
        {file ? (
          <>
            <div className="json-file-slot-name">{file.name}</div>
            <div className="json-file-slot-meta">
              {(file.size / 1024).toFixed(0)} KB
            </div>
          </>
        ) : (
          <>
            <div className="json-file-slot-cta">Arrastrá o elegí archivo</div>
            <div className="json-file-slot-hint">{hint}</div>
          </>
        )}
      </div>

      {file ? (
        <button
          type="button"
          className="json-file-slot-clear"
          disabled={disabled}
          aria-label={`Quitar ${label}`}
          onClick={clear}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
