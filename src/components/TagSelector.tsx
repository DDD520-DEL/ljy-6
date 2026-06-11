import { useState, useEffect, useRef } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import api from '../lib/api';
import type { Tag } from '../../shared/types';
import { useT } from '../i18n';

interface Props {
  selected: string[];
  onChange: (names: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagSelector({ selected, onChange, placeholder, maxTags = 10 }: Props) {
  const t = useT();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadTags = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/tags');
        setAllTags(data.data || []);
      } finally {
        setLoading(false);
      }
    };
    loadTags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = allTags.filter(
    (tag) => !selected.includes(tag.name) && tag.name.toLowerCase().includes(inputValue.toLowerCase().trim()),
  );

  const canCreateNew = inputValue.trim().length > 0 && !allTags.some(
    (t) => t.name.toLowerCase() === inputValue.trim().toLowerCase(),
  ) && !selected.includes(inputValue.trim());

  const addTag = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (selected.includes(trimmed)) return;
    if (selected.length >= maxTags) return;
    onChange([...selected, trimmed]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeTag = (name: string) => {
    onChange(selected.filter((n) => n !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
      removeTag(selected[selected.length - 1]);
    }
  };

  const getTagColor = (name: string): string => {
    const existing = allTags.find((t) => t.name === name);
    return existing?.color || '#2D6A4F';
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="input-base !min-h-[44px] !py-2 flex flex-wrap items-center gap-1.5 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getTagColor(name) }}
          >
            <TagIcon className="w-3 h-3" />
            {name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(name);
              }}
              className="hover:bg-white/20 rounded-full p-0.5 -mr-1 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {selected.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? (placeholder || t('tag_placeholder')) : ''}
            className="flex-1 min-w-[100px] outline-none bg-transparent text-sm"
          />
        )}
      </div>
      <div className="mt-1 text-[11px] text-sage-400">
        {t('tag_input_hint')} · {selected.length}/{maxTags}
      </div>

      {showDropdown && (inputValue.trim() || filteredSuggestions.length > 0 || loading) && (
        <div className="absolute left-0 right-0 mt-1.5 card !rounded-xl z-50 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-sage-500">...</div>
          ) : (
            <>
              {filteredSuggestions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => addTag(tag.name)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-forest-50 transition text-left"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm text-forest-800 font-medium">{tag.name}</span>
                </button>
              ))}
              {canCreateNew && (
                <button
                  type="button"
                  onClick={() => addTag(inputValue)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-sage-50 transition text-left border-t border-sage-100"
                >
                  <Plus className="w-4 h-4 text-forest-600" />
                  <span className="text-sm text-sage-600">
                    {t('tag_create_new')}<strong className="text-forest-700">{inputValue.trim()}</strong>
                  </span>
                </button>
              )}
              {filteredSuggestions.length === 0 && !canCreateNew && (
                <div className="px-4 py-3 text-sm text-sage-400">{t('tag_no_result')}</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
