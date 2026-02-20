'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Thread = {
  id: string;
  user_id: string;
  status: string;
  updated_at: string;
  display_name?: string;
  phone?: string;
};

type Message = {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
};

export default function SupportChat() {
  const { session } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: rows, error } = await supabase
        .from('support_threads')
        .select('id, user_id, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error || !mounted) return;
      const userIds = [...new Set((rows || []).map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profile')
        .select('id, display_name, phone')
        .in('id', userIds);
      const byId = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});
      setThreads((rows || []).map((r: any) => ({
        ...r,
        display_name: byId[r.user_id]?.display_name || 'Customer',
        phone: byId[r.user_id]?.phone || '',
      })));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('id, sender_type, content, created_at')
        .eq('thread_id', selectedId)
        .order('created_at', { ascending: true });
      if (!mounted) return;
      if (error) return;
      setMessages(data || []);
    })();
    return () => { mounted = false; };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`support-admin-${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `thread_id=eq.${selectedId}`,
      }, () => {
        supabase
          .from('support_messages')
          .select('id, sender_type, content, created_at')
          .eq('thread_id', selectedId)
          .order('created_at', { ascending: true })
          .then(({ data }) => data && setMessages(data));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [selectedId]);

  const sendReply = async () => {
    if (!selectedId || !reply.trim() || !session?.user?.id || sending) return;
    setSending(true);
    const { error } = await supabase.from('support_messages').insert({
      thread_id: selectedId,
      sender_type: 'admin',
      sender_id: session.user.id,
      content: reply.trim(),
    });
    if (!error) {
      setReply('');
      const { data } = await supabase
        .from('support_messages')
        .select('id, sender_type, content, created_at')
        .eq('thread_id', selectedId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
      await supabase.from('support_threads').update({ updated_at: new Date().toISOString() }).eq('id', selectedId);
    }
    setSending(false);
  };

  const selected = threads.find((t) => t.id === selectedId);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live chat</h1>
        <p className="mt-1 text-sm text-slate-500">Jibu watumiaji wa mobile. Ikiwa hauna jibu, wamwambie kupiga: +255 792 108 835</p>
      </header>
      <div className="flex min-h-[480px] gap-4 rounded-panel border border-slate-200 bg-white shadow-card overflow-hidden">
        <div className="w-72 shrink-0 border-r border-slate-200 flex flex-col">
          <div className="border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50">Mazungumzo</div>
          {loading ? (
            <div className="p-4 text-slate-500 text-sm">Inapakia...</div>
          ) : threads.length === 0 ? (
            <div className="p-4 text-slate-500 text-sm">Hakuna mazungumzo bado.</div>
          ) : (
            <ul className="flex-1 overflow-y-auto">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 ${selectedId === t.id ? 'bg-primary/10 text-primary' : 'text-slate-700'}`}
                  >
                    <div className="font-medium truncate">{t.display_name || t.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-slate-500 truncate">{t.phone || t.user_id}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          {selected ? (
            <>
              <div className="border-b border-slate-200 px-4 py-2 bg-slate-50">
                <p className="font-medium text-slate-900">{selected.display_name}</p>
                <p className="text-sm text-slate-500">{selected.phone || selected.user_id}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      m.sender_type === 'admin'
                        ? 'ml-auto bg-primary text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    <p className="text-xs mt-1 opacity-80">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 p-3 flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  placeholder="Andika jibu..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {sending ? 'Inatumwa...' : 'Tuma'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Chagua mazungumzo kushoto.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
