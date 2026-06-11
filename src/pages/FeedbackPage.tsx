import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Clock, CheckCircle, Loader, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../i18n';
import type { Feedback } from '../../shared/types';
import { formatDateShort } from '../lib/format';

export default function FeedbackPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const t = useT();

  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [history, setHistory] = useState<Feedback[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/feedbacks/mine');
      setHistory(res.data.data || []);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setSuccessMsg('');
    try {
      await api.post('/feedbacks', { content: content.trim(), contact: contact.trim() });
      setContent('');
      setContact('');
      setSuccessMsg(t('feedback_success'));
      fetchHistory();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'resolved') return 'bg-forest-100 text-forest-700';
    if (status === 'processing') return 'bg-amber-100 text-amber-700';
    return 'bg-sage-100 text-sage-600';
  };

  const statusLabel = (status: string) => {
    if (status === 'resolved') return t('feedback_status_resolved');
    if (status === 'processing') return t('feedback_status_processing');
    return t('feedback_status_pending');
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'resolved') return <CheckCircle className="w-3.5 h-3.5" />;
    if (status === 'processing') return <Loader className="w-3.5 h-3.5 animate-spin" />;
    return <Clock className="w-3.5 h-3.5" />;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sage-500 hover:text-forest-600 transition text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('obs_back')}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center shadow-card">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-forest-800">{t('feedback_title')}</h1>
            <p className="text-sage-500 text-sm">{t('feedback_subtitle')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 mb-6 animate-fade-in">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              {t('feedback_content_label')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('feedback_content_placeholder')}
              rows={5}
              className="w-full rounded-xl border border-sage-200 bg-sage-50/50 px-4 py-3 text-sm text-sage-800 placeholder:text-sage-400 focus:border-forest-400 focus:ring-2 focus:ring-forest-100 focus:outline-none transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              {t('feedback_contact_label')}
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t('feedback_contact_placeholder')}
              className="w-full rounded-xl border border-sage-200 bg-sage-50/50 px-4 py-2.5 text-sm text-sage-800 placeholder:text-sage-400 focus:border-forest-400 focus:ring-2 focus:ring-forest-100 focus:outline-none transition"
            />
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-forest-50 border border-forest-200 px-4 py-3 text-sm text-forest-700 animate-slide-up">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t('feedback_submitting')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t('feedback_submit')}
              </>
            )}
          </button>
        </div>
      </form>

      {user && history.length > 0 && (
        <div className="animate-fade-in">
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-forest-600" />
            {t('feedback_my_history')}
          </h2>
          <div className="space-y-3">
            {history.map((fb) => (
              <div key={fb.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === fb.id ? null : fb.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-sage-50/50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`chip text-[11px] !py-0.5 !px-2 flex items-center gap-1 ${statusColor(fb.status)}`}>
                        <StatusIcon status={fb.status} />
                        {statusLabel(fb.status)}
                      </span>
                      <span className="text-xs text-sage-400">{formatDateShort(fb.createdAt)}</span>
                    </div>
                    <p className="text-sm text-sage-700 truncate">{fb.content}</p>
                  </div>
                  {expandedId === fb.id ? (
                    <ChevronUp className="w-4 h-4 text-sage-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-sage-400 shrink-0" />
                  )}
                </button>
                {expandedId === fb.id && (
                  <div className="px-4 pb-4 border-t border-sage-100 pt-3 animate-slide-up">
                    <p className="text-sm text-sage-700 whitespace-pre-wrap mb-3">{fb.content}</p>
                    {fb.contact && (
                      <div className="text-xs text-sage-500 mb-2">
                        📧 {fb.contact}
                      </div>
                    )}
                    {fb.reply && (
                      <div className="bg-forest-50 border border-forest-100 rounded-xl p-3">
                        <div className="text-xs font-medium text-forest-700 mb-1">{t('feedback_reply_label')}</div>
                        <p className="text-sm text-forest-800 whitespace-pre-wrap">{fb.reply}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {user && history.length === 0 && (
        <div className="card py-12 text-center text-sage-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-sage-300" />
          <p className="text-sm">{t('feedback_no_history')}</p>
        </div>
      )}
    </div>
  );
}
