"use client"

import { useState, useEffect } from "react"
import { X, Copy, Share2 } from "lucide-react"
import { useBackHandler } from "@/hooks/use-back-handler"

interface ShareFavoritesModalProps {
  isOpen: boolean
  onClose: () => void
  favoriteIds: string[]
}

export default function ShareFavoritesModal({ isOpen, onClose, favoriteIds }: ShareFavoritesModalProps) {
  const [wallpaperLinks, setWallpaperLinks] = useState<{ name: string; url: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Handle browser back button when modal is open
  useBackHandler({
    isActive: isOpen,
    onBack: onClose,
    priority: 1
  })

  useEffect(() => {
    if (isOpen && favoriteIds.length > 0) {
      setIsLoading(true)
      fetchWallpaperData()
    }
  }, [isOpen, favoriteIds])

  const fetchWallpaperData = async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/not-ayan/storage/main/index.json')
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallpaper data')
      }
      
      const data = await response.json()
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data format')
      }
      
      const links = data
        .filter((item: any) => favoriteIds.includes(item.file_name))
        .map((item: any) => ({
          name: item.file_name,
          url: `${window.location.origin}/wallpaper/${encodeURIComponent(item.file_name)}`
        }))
      
      setWallpaperLinks(links)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching wallpaper data:", error)
      setIsLoading(false)
    }
  }

  const copyAllLinks = async () => {
    try {
      // Create formatted text with each wallpaper on a new line
      const linksText = wallpaperLinks.map(link => `${link.name}: ${link.url}`).join('\n');
      
      // Use the Clipboard API with fallback
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(linksText);
        showNotification("All links copied to clipboard!");
      } else {
        // Fallback method using a temporary textarea element
        const textArea = document.createElement('textarea');
        textArea.value = linksText;
        textArea.style.position = 'fixed';  // Avoid scrolling to bottom
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          showNotification("All links copied to clipboard!");
        } else {
          throw new Error('Fallback copy method failed');
        }
      }
    } catch (error) {
      console.error("Failed to copy links:", error);
      showNotification("Failed to copy links to clipboard");
    }
  }

  const shareLinks = async () => {
    try {
      // Create formatted text with each wallpaper on a new line
      const linksText = wallpaperLinks.map(link => `${link.name}: ${link.url}`).join('\n\n');
      
      // Create a more descriptive title and message
      const title = "My Favorite Wallpapers";
      const message = `Check out my collection of ${wallpaperLinks.length} favorite wallpapers from WallWidgy:\n\n${linksText}`;
      
      if (navigator.share) {
        try {
          // First try to share the full list (works best on mobile)
          await navigator.share({
            title: title,
            text: message,
            url: window.location.href // Fallback URL to the favorites page
          });
          showNotification("Shared successfully!");
        } catch (shareError) {
          console.error("Share API error:", shareError);
          
          // If the full list was too large, try a more compact version
          if (linksText.length > 1500) {
            try {
              const compactMessage = `Check out my collection of ${wallpaperLinks.length} favorite wallpapers!`;
              await navigator.share({
                title: title,
                text: compactMessage,
                url: window.location.href
              });
              showNotification("Shared successfully!");
            } catch (compactShareError) {
              // If even compact sharing fails, fall back to clipboard
              await copyToClipboard(linksText);
            }
          } else {
            // Otherwise just fall back to clipboard
            await copyToClipboard(linksText);
          }
        }
      } else {
        // No Web Share API support, use clipboard
        await copyToClipboard(linksText);
        showNotification("Links copied to clipboard! (Share API not available on this device)");
      }
    } catch (error) {
      console.error("Error in share function:", error);
      showNotification("Failed to share links");
    }
  };

  // Helper function for clipboard operations
  const copyToClipboard = async (text: string) => {
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showNotification("Links copied to clipboard!");
        return;
      }
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showNotification("Links copied to clipboard!");
      } else {
        throw new Error('Fallback copy method failed');
      }
    } catch (error) {
      console.error("Clipboard error:", error);
      showNotification("Failed to copy to clipboard");
      throw error; // Re-throw to handle in the calling function
    }
  };

  const showNotification = (message: string) => {
    const notification = document.createElement("div")
    notification.className =
      "fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm z-50"
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161616] rounded-2xl max-w-2xl w-[90%] max-h-[80vh] overflow-hidden flex flex-col shadow-xl border border-white/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-medium">Share Favorites</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-white/70 mb-4">
                Share these {wallpaperLinks.length} wallpapers with others:
              </p>
              <div className="border border-white/10 rounded-lg divide-y divide-white/10 mb-6 overflow-hidden">
                {wallpaperLinks.map((link, index) => (
                  <div key={index} className="p-4 bg-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-sm text-white/80 truncate">{link.name}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline truncate block mt-1"
                    >
                      {link.url}
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="border-t border-white/10 px-6 py-4 flex justify-end gap-4">
          <button
            onClick={copyAllLinks}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>
        </div>
      </div>
    </div>
  )
}
