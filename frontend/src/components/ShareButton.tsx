import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';
import type { DeepLinkParams } from '../utils/deepLinks';

interface ShareButtonProps {
  title: string;
  description: string;
  params: DeepLinkParams;
  variant?: 'icon' | 'button' | 'badge';
  label?: string;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  description,
  params,
  variant = 'button',
  label = 'Share',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={`p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer ${className}`}
          title="Share direct link"
        >
          <Share2 className="w-4 h-4" />
        </button>
      ) : variant === 'badge' ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 transition-colors cursor-pointer ${className}`}
          title="Share direct link"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{label}</span>
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 transition-all cursor-pointer ${className}`}
          title="Share direct link"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{label}</span>
        </button>
      )}

      <ShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        description={description}
        params={params}
      />
    </>
  );
};
