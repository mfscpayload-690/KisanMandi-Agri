import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, ExternalLink } from 'lucide-react';
import { createSharePayload, type DeepLinkParams } from '../utils/deepLinks';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  params: DeepLinkParams;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  params,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const payload = createSharePayload(title, description, params);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(payload.url);
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = payload.url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: payload.title,
          text: payload.text,
          url: payload.url,
        });
        onClose();
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/60 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative my-auto bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Share with Farmers</h3>
              <p className="text-xs text-slate-500">Direct link to this live page or analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          {/* Preview Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-900 block text-sm">{title}</span>
            <p className="text-slate-600 leading-relaxed">{description}</p>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* WhatsApp Share Button */}
            <a
              href={payload.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all text-center"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Share on WhatsApp</span>
            </a>

            {/* Native Mobile Share if supported */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>More Apps...</span>
              </button>
            )}
          </div>

          {/* URL Copy Bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Direct Link</label>
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
              <input
                type="text"
                readOnly
                value={payload.url}
                className="w-full bg-transparent px-2 text-xs font-mono text-slate-700 select-all focus:outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Link copied to clipboard! Ready to paste in messages or WhatsApp groups.</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
