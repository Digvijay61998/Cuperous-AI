// ** React Imports
import { useRef, useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

interface Props {
  /** e.g. ".zip" or "image/*" - passed straight to the hidden input's accept attr */
  accept: string;
  /** Icon shown in the idle state, e.g. "bx:archive" */
  icon: string;
  /** Primary label, e.g. "Drag & drop your template ZIP here" */
  label: string;
  /** Secondary hint, e.g. "or click to browse (max 50MB)" */
  hint: string;
  file: File | null;
  error?: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

/**
 * Drag-and-drop + click-to-browse file picker. Validation stays in the parent
 * (onFileSelect just hands back the raw File); this component only handles
 * the drag/drop/click UX and the selected-file preview state.
 */
const TemplateDropzone = (props: Props) => {
  const { accept, icon, label, hint, file, error, onFileSelect, onClear } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    const selected = fileList?.[0];
    if (selected) onFileSelect(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box>
      <Box
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        sx={{
          border: '1.5px dashed',
          borderColor: error
            ? 'error.main'
            : isDragging
            ? 'primary.main'
            : 'divider',
          borderRadius: 1.5,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragging ? 'action.hover' : 'transparent',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={accept}
          onChange={(e) => handleFiles(e.target.files)}
        />

        {file ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
              <Icon icon={icon} fontSize={28} />
              <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
                <Typography noWrap variant="body2" sx={{ fontWeight: 600 }}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatSize(file.size)}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              <Icon icon="bx:x" fontSize={18} />
            </IconButton>
          </Box>
        ) : (
          <>
            <Icon icon={icon} fontSize={32} />
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {hint}
            </Typography>
          </>
        )}
      </Box>
      {error && (
        <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default TemplateDropzone;
