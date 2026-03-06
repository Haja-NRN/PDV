import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
}

const FileUploadZone = ({ onFileSelect }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  return (
    <label
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
        isDragging
          ? "border-primary bg-primary/10"
          : fileName
          ? "border-success/50 bg-success/5"
          : "border-border hover:border-muted-foreground/50 bg-muted/30"
      }`}
    >
      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={handleChange}
        className="hidden"
      />
      {fileName ? (
        <>
          <FileSpreadsheet className="w-10 h-10 text-success mb-2" />
          <p className="text-sm font-medium text-foreground">{fileName}</p>
          <p className="text-xs text-muted-foreground mt-1">Cliquez pour changer</p>
        </>
      ) : (
        <>
          <Upload className="w-10 h-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Cliquez</span> ou glissez-déposez
          </p>
          <p className="text-xs text-muted-foreground mt-1">.csv ou .xlsx</p>
        </>
      )}
    </label>
  );
};

export default FileUploadZone;
