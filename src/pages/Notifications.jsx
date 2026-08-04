import { useState } from 'react';
import Layout from '../components/Layout';
import { sendNotification } from '../api/admin';

export default function Notifications() {
  const [audience, setAudience] = useState('ALL'); // 'ALL' | 'USER'
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim() || !message.trim()) {
      setError('Please fill in both the title and message.');
      return;
    }
    if (audience === 'USER' && !email.trim()) {
      setError('Enter the recipient’s email address.');
      return;
    }

    setSending(true);
    try {
      await sendNotification({
        audience,
        email: audience === 'USER' ? email.trim() : undefined,
        title: title.trim(),
        message: message.trim(),
      });
      setSuccess(
        audience === 'ALL'
          ? 'Announcement sent to all users.'
          : `Notification sent to ${email.trim()}.`
      );
      setTitle('');
      setMessage('');
      if (audience === 'USER') setEmail('');
    } catch {
      setError('Could not send the notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout title="Notifications">
      <div className="mx-auto max-w-xl">
        <form onSubmit={handleSend} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-bold text-gray-900">Send a Notification</h2>
          <p className="mb-5 text-sm text-gray-500">
            Broadcast an announcement to every user, or send a message to one person.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Recipient</label>
          <div className="mb-4 flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setAudience('ALL')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition ${
                audience === 'ALL' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Users
            </button>
            <button
              type="button"
              onClick={() => setAudience('USER')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition ${
                audience === 'USER' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Specific User
            </button>
          </div>

          {audience === 'USER' && (
            <>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700" htmlFor="notif-email">
                Recipient Email
              </label>
              <input
                id="notif-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@agrochain.com"
                className="mb-4 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </>
          )}

          <label className="mb-1.5 block text-sm font-semibold text-gray-700" htmlFor="notif-title">
            Title
          </label>
          <input
            id="notif-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled maintenance tonight"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <label className="mb-1.5 block text-sm font-semibold text-gray-700" htmlFor="notif-message">
            Message
          </label>
          <textarea
            id="notif-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write the notification message…"
            rows={5}
            className="mb-6 w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <button
            type="submit"
            disabled={sending}
            className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'Sending…' : audience === 'ALL' ? 'Send to All Users' : 'Send Notification'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
