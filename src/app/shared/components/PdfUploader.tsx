import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';

interface PdfUploaderProps {
  onFileAccepted: (file: File) => void;
  error?: string;
}

export default function PdfUploader({
  onFileAccepted,
  error,
}: PdfUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileAccepted(file);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      multiple: false,
      maxSize: 4 * 1024 * 1024,
      accept: { 'application/pdf': [] },
    });

  const fileError = fileRejections[0]?.errors[0]?.message ?? error;

  return (
    <div className="space-y-2">
      {!selectedFile && (
        <div
          {...getRootProps()}
          className={cn(
            'border-dashed border-2 rounded-lg p-6 text-center cursor-pointer transition-all',
            isDragActive ? 'border-primary bg-muted' : 'border-input'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? 'Suelta el archivo aquí...'
                : 'Arrastra y suelta un PDF aquí, o haz clic para seleccionar uno'}
            </p>
            <p className="text-xs text-muted-foreground">Máximo 4 MB</p>
          </div>
        </div>
      )}
      {selectedFile && (
        <div className="text-sm text-muted-foreground mt-2">
          <p className="font-medium">{selectedFile.name}</p>
          <p>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
      )}

      {fileError && <p className="text-sm text-destructive">{fileError}</p>}
    </div>
  );
}
