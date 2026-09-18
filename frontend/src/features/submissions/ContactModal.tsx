import { useState } from 'react';
import { submitContact } from '../../api/endpoints';
import { Modal } from '../../components/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ContactModal({ open, onClose, onSuccess, onError }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await submitContact({ name, email, subject: subject || undefined, message });
      onSuccess(`Message sent · ${res.request_id}`);
      setName(''); setEmail(''); setSubject(''); setMessage('');
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Talk to the analytics team" eyebrow="Contact"
           description="Questions about data, refresh timing, or a new build? Send us a note.">
      <form className="modal__body" onSubmit={onSubmit} noValidate>
        <div className="field--row">
          <div className="field">
            <label htmlFor="ct-name">Name <span className="req">*</span></label>
            <input id="ct-name" required maxLength={128} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" />
          </div>
          <div className="field">
            <label htmlFor="ct-email">Email <span className="req">*</span></label>
            <input id="ct-email" required type="email" maxLength={128} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@pfizer.com" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ct-subject">Subject</label>
          <input id="ct-subject" maxLength={256} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Data refresh question" />
        </div>
        <div className="field">
          <label htmlFor="ct-message">Message <span className="req">*</span></label>
          <textarea id="ct-message" required maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" />
        </div>
        <div className="modal__foot">
          <span className="contact-line">Or email <a href="mailto:analytics@pfizer.com">analytics@pfizer.com</a></span>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'}</button>
        </div>
      </form>
    </Modal>
  );
}
