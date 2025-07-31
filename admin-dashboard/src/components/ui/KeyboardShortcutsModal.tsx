import React, { useEffect, useState } from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { keyboardNavigationManager, type KeyboardShortcut } from '../../utils/keyboardNavigation';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: KeyboardShortcut[];
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);

  useEffect(() => {
    if (isOpen) {
      setShortcuts(keyboardNavigationManager.getShortcuts());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Trap focus within modal
      const modal = document.getElementById('keyboard-shortcuts-modal');
      if (modal) {
        const cleanup = keyboardNavigationManager.trapFocus(modal);
        return () => {
          document.removeEventListener('keydown', handleEscape);
          cleanup();
        };
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groupShortcuts = (shortcuts: KeyboardShortcut[]): ShortcutGroup[] => {
    const groups: { [key: string]: KeyboardShortcut[] } = {
      'Navigation': [],
      'Actions': [],
      'Utilities': [],
      'Other': []
    };

    shortcuts.forEach(shortcut => {
      if (shortcut.description.toLowerCase().includes('go to')) {
        groups['Navigation'].push(shortcut);
      } else if (shortcut.description.toLowerCase().includes('show') || 
                 shortcut.description.toLowerCase().includes('close') ||
                 shortcut.description.toLowerCase().includes('skip')) {
        groups['Utilities'].push(shortcut);
      } else if (shortcut.description.toLowerCase().includes('start') ||
                 shortcut.description.toLowerCase().includes('add') ||
                 shortcut.description.toLowerCase().includes('generate')) {
        groups['Actions'].push(shortcut);
      } else {
        groups['Other'].push(shortcut);
      }
    });

    return Object.entries(groups)
      .filter(([_, shortcuts]) => shortcuts.length > 0)
      .map(([title, shortcuts]) => ({ title, shortcuts }));
  };

  const renderKeyCombo = (shortcut: KeyboardShortcut) => {
    const keys = shortcut.key.split('+');
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => {
          let displayKey = key;
          let Icon = null;

          // Replace key names with symbols on Mac
          if (isMac) {
            switch (key.toLowerCase()) {
              case 'ctrl':
              case 'control':
                displayKey = '⌃';
                break;
              case 'cmd':
              case 'meta':
                Icon = Command;
                displayKey = '';
                break;
              case 'alt':
              case 'option':
                Icon = Command;
                displayKey = '';
                break;
              case 'shift':
                Icon = Keyboard;
                displayKey = '';
                break;
            }
          } else {
            // Windows/Linux key display
            switch (key.toLowerCase()) {
              case 'meta':
                displayKey = 'Win';
                break;
              case 'alt':
                displayKey = 'Alt';
                break;
              case 'ctrl':
              case 'control':
                displayKey = 'Ctrl';
                break;
              case 'shift':
                displayKey = 'Shift';
                break;
            }
          }

          return (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-tertiary mx-1">+</span>}
              <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-mono bg-surface-secondary border border-primary rounded text-primary">
                {Icon ? <Icon className="w-3 h-3" /> : displayKey}
              </kbd>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const shortcutGroups = groupShortcuts(shortcuts);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      aria-describedby="shortcuts-modal-description"
    >
      <div 
        id="keyboard-shortcuts-modal"
        className="bg-surface-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Keyboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" className="text-lg font-semibold text-primary">
                Keyboard Shortcuts
              </h2>
              <p id="shortcuts-modal-description" className="text-sm text-secondary">
                Navigate the dashboard efficiently with these keyboard shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
            aria-label="Close keyboard shortcuts modal"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {shortcutGroups.length === 0 ? (
            <div className="text-center py-8">
              <Keyboard className="w-12 h-12 text-tertiary mx-auto mb-4" />
              <p className="text-secondary">No keyboard shortcuts available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {shortcutGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-secondary transition-colors"
                      >
                        <span className="text-sm text-primary">
                          {shortcut.description}
                        </span>
                        {renderKeyCombo(shortcut)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-primary bg-surface-secondary">
          <div className="flex items-center justify-between text-xs text-tertiary">
            <div className="flex items-center gap-4">
              <span>Press <kbd className="px-1.5 py-0.5 bg-surface-primary border border-primary rounded text-primary font-mono">Alt + /</kbd> to show this dialog</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Press <kbd className="px-1.5 py-0.5 bg-surface-primary border border-primary rounded text-primary font-mono">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;