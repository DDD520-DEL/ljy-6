import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, CheckCircle, Loader, Send, ArrowLeft, Trash2, User } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../i18n';
import type { Feedback } from '../../shared/types';
import { formatDateShort } from '../lib/format';

export default function FeedbackAdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const t = useT();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMap, setReplyMap] = useState<Record<number, string>>({});
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedbacks');
      setFeedbacks(res.data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/feedbacks/${id}`, { status, reply: replyMap[id] || '' });
      setReplyMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      fetchAll();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/feedbacks/${id}`);
      fetchAll();
    } catch {}
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

  const pendingCount = feedbacks.filter((f) => f.status === 'pending').length;
  const processingCount = feedbacks.filter((f) => f.status === 'processing').length;
  const resolvedCount = feedbacks.filter((f) => f.status === 'resolved').length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="card p-8 animate-pulse space-y-4">
          <div className="h-8 bg-sage-100 rounded w-1/3" />
          <div className="h-32 bg-sage-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
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
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-forest-800">{t('feedback_admin_title')}</h1>
            <p className="text-sage-500 text-sm">{t('feedback_admin_subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-display font-bold text-sage-600">{pendingCount}</div>
          <div className="text-xs text-sage-500 flex items-center justify-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {t('feedback_status_pending')}
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-display font-bold text-amber-600">{processingCount}</div>
          <div className="text-xs text-sage-500 flex items-center justify-center gap-1 mt-1">
            <Loader className="w-3 h-3" />
            {t('feedback_status_processing')}
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-display font-bold text-forest-600">{resolvedCount}</div>
          <div className="text-xs text-sage-500 flex items-center justify-center gap-1 mt-1">
            <CheckCircle className="w-3 h-3" />
            {t('feedback_status_resolved')}
          </div>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <div className="card py-16 text-center text-sage-400">
          <Shield className="w-12 h-12 mx-auto mb-3 text-sage-300" />
          <p className="text-sm">{t('feedback_admin_no_feedback')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb, i) => (
            <div
              key={fb.id}
              className="card p-5 animate-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {fb.user ? (
                    <img
                      src={fb.user.avatar}
                      alt={fb.user.username}
                      className="w-9 h-9 rounded-full border border-sage-200 bg-white"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-sage-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-sage-800 truncate">
                      {fb.user?.username || `User #${fb.userId}`}
                    </div>
                    <div className="text-xs text-sage-400">{formatDateShort(fb.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`chip text-[11px] !py-0.5 !px-2 flex items-center gap-1 ${statusColor(fb.status)}`}>
                    <StatusIcon status={fb.status} />
                    {statusLabel(fb.status)}
                  </span>
                  <button
                    onClick={() => handleDelete(fb.id)}
                    className="p-1.5 rounded-lg text-sage-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-sage-700 whitespace-pre-wrap mb-2 bg-sage-50 rounded-xl p-3">
                {fb.content}
              </div>

              {fb.contact && (
                <div className="text-xs text-sage-500 mb-3">
                  📧 {fb.contact}
                </div>
              )}

              {fb.reply && (
                <div className="bg-forest-50 border border-forest-100 rounded-xl p-3 mb-3">
                  <div className="text-xs font-medium text-forest-700 mb-1">{t('feedback_reply_label')}</div>
                  <p className="text-sm text-forest-800 whitespace-pre-wrap">{fb.reply}</p>
                </div>
              )}

              <div className="flex items-end gap-3 pt-3 border-t border-sage-100">
                <div className="flex-1">
                  <textarea
                    value={replyMap[fb.id] || ''}
                    onChange={(e) => setReplyMap((prev) => ({ ...prev, [fb.id]: e.target.value }))}
                    placeholder={t('feedback_admin_reply_placeholder')}
                    rows={2}
                    className="w-full rounded-xl border border-sage-200 bg-sage-50/50 px-3 py-2 text-sm text-sage-800 placeholder:text-sage-400 focus:border-forest-400 focus:ring-2 focus:ring-forest-100 focus:outline-none transition resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <select
                    value={statusMap[fb.id] || fb.status}
                    onChange={(e) => setStatusMap((prev) => ({ ...prev, [fb.id]: e.target.value }))}
                    className="rounded-xl border border-sage-200 bg-sage-50/50 px-3 py-2 text-xs text-sage-700 focus:border-forest-400 focus:outline-none"
                  >
                    <option value="pending">{t('feedback_status_pending')}</option>
                    <option value="processing">{t('feedback_status_processing')}</option>
                    <option value="resolved">{t('feedback_status_resolved')}</option>
                  </select>
                  <button
                    onClick={() => handleUpdateStatus(fb.id, statusMap[fb.id] || fb.status)}
                    className="btn-primary flex items-center justify-center gap-1.5 text-xs py-2 px-3"
                  >
                    <Send className="w-3 h-3" />
                    {t('feedback_admin_reply')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
