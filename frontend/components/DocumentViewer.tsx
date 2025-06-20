import React from "react";

interface DocumentViewerProps {
  url: string;
  type?: string; // e.g. 'pdf', 'image', etc.
}

const isPdf = (url: string) => url.endsWith(".pdf");
const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);

const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, type }) => {
  if (!url) return null;
  if (type === "pdf" || isPdf(url)) {
    return (
      <iframe
        src={url}
        title="Document PDF"
        className="w-full h-96 border rounded"
        style={{ background: "#fff" }}
      />
    );
  }
  if (type === "image" || isImage(url)) {
    return (
      <img
        src={url}
        alt="Document Preview"
        className="w-full max-h-96 object-contain border rounded bg-white"
      />
    );
  }
  // fallback: just a link
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-primary">
      View Document
    </a>
  );
};

export default DocumentViewer;
