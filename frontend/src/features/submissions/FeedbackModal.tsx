import { useState } from 'react';
import { submitFeedback } from '../../api/endpoints';
import { Modal } from '../../components/Modal';
import type { Dashboard } from '../../types/api';

interface Props {
  open: boolean;
  onClose: () => void;
  dashboards: Dashboard[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function FeedbackModal({ open, onClose, dashboards, onSuccess, onError }: Props) {
  const [dashboardId, setDashboardId] = useState('');
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await submitFeedback({
        dashboard_id: dashboardId || undefined,
        rating: rating || 0,
        email: email || undefined,
        message,
      });
      onSuccess(`Thanks for the feedback · ${res.request_id}`);
      setDashboardId(''); setRating(0); setEmail(''); setMessage('');
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not submit feedback.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Help us improve" eyebrow="Feedback"
           description="Rate a dashboard and tell us what's working — or what isn't.">
      <form className="modal__body" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="fb-dashboard">Which dashboard?</label>
          <select id="fb-dashboard" value={dashboardId} onChange={(e) => setDashboardId(e.target.value)}>
            <option value="">— Overall portal —</option>
            {dashboards.map((d) => <option key={d.dashboard_id} value={d.dashboard_id}>{d.dashboard_name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>How's it working for you?</label>
          <div className="stars" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={n <= rating ? 'on' : ''}
                aria-checked={n === rating}
                role="radio"
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                onClick={() => setRating(n === rating ? 0 : n)}
              >★</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="fb-email">Your email (optional)</label>
          <input id="fb-email" type="email" maxLength={128} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@pfizer.com" />
        </div>
        <div className="field">
          <label htmlFor="fb-message">Your thoughts <span className="req">*</span></label>
          <textarea id="fb-message" required maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What would make this dashboard more useful?" />
        </div>
        <div className="modal__foot">
          <span className="contact-line">Optional: leave your email if you'd like a reply.</span>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Sending…' : 'Send feedback'}</button>
        </div>
      </form>
    </Modal>
  );
}
