import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Copy, Check, RotateCcw } from 'lucide-react';

interface ResultSectionProps {
  content: string;
  onReset: () => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({ content, onReset }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Minutes_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Biên Bản Hoàn Chỉnh</h2>
          <p className="text-slate-500 text-sm">Được tạo tự động bởi Gemini AI</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onReset}
            className="px-4 py-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm font-medium flex items-center transition-colors"
          >
            <RotateCcw size={16} className="mr-2" /> Tạo mới
          </button>
          <button 
            onClick={handleCopy}
            className="px-4 py-2 text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg shadow-sm font-medium flex items-center transition-colors"
          >
            {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </button>
          <button 
            onClick={handleDownload}
            className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md font-medium flex items-center transition-colors"
          >
            <Download size={16} className="mr-2" /> Tải về (.md)
          </button>
        </div>
      </div>

      <div className="flex-grow bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="h-[600px] overflow-y-auto p-8 custom-markdown">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-slate-900 mb-6 border-b pb-2" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-slate-700 mt-6 mb-3" {...props} />,
              p: ({node, ...props}) => <p className="text-slate-600 leading-relaxed mb-4" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-600" {...props} />,
              li: ({node, ...props}) => <li className="pl-1" {...props} />,
              table: ({node, ...props}) => <div className="overflow-x-auto my-6 rounded-lg border border-slate-200"><table className="min-w-full divide-y divide-slate-200" {...props} /></div>,
              thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
              th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" {...props} />,
              tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-slate-200" {...props} />,
              tr: ({node, ...props}) => <tr className="hover:bg-slate-50" {...props} />,
              td: ({node, ...props}) => <td className="px-6 py-4 whitespace-normal text-sm text-slate-600" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-slate-500 my-4" {...props} />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
