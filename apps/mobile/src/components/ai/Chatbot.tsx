import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, Keyboard, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { chatWithAI, AIChatMessage } from '@/services/ai';
import {
  getSupportPhoneNumber,
  getOrCreateSupportThread,
  getSupportMessages,
  sendSupportMessage,
  subscribeToSupportMessages,
} from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';

const SUPPORT_PHONE = getSupportPhoneNumber();

interface ChatbotProps {
  userId?: string;
  orderId?: string;
  onClose?: () => void;
}

type Mode = 'robot' | 'live';

interface LiveMessage {
  id: string;
  sender_type: 'user' | 'admin';
  content: string;
  created_at: string;
}

export default function Chatbot({ userId, orderId, onClose }: ChatbotProps) {
  const [mode, setMode] = useState<Mode>('robot');
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m here to help you with orders, products, returns, and more. You can also switch to "Live" to chat with a human, or call us anytime.',
    },
  ]);
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const loadLiveThread = async () => {
    if (!userId) return;
    setLiveLoading(true);
    try {
      const id = await getOrCreateSupportThread(userId);
      setThreadId(id);
      const list = await getSupportMessages(id);
      setLiveMessages(list);
    } catch (e) {
      console.error('Load support thread:', e);
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'live' && userId) {
      loadLiveThread();
    }
  }, [mode, userId]);

  useEffect(() => {
    if (threadId && mode === 'live') {
      const unsub = subscribeToSupportMessages(threadId, () => {
        getSupportMessages(threadId).then(setLiveMessages);
      });
      return unsub;
    }
  }, [threadId, mode]);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, liveMessages]);

  useEffect(() => {
    const sub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    );
    return () => sub.remove();
  }, []);

  const handleCallSupport = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`);
  };

  const handleSendRobot = async () => {
    if (!input.trim() || loading) return;
    const userMessage: AIChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await chatWithAI([...messages, userMessage], { userId, orderId });
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Samahani, jaribu tena au piga msaada: ' + SUPPORT_PHONE },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendLive = async () => {
    if (!input.trim() || !threadId || !userId || liveLoading) return;
    const text = input.trim();
    setInput('');
    setLiveLoading(true);
    try {
      await sendSupportMessage(threadId, userId, text);
      const list = await getSupportMessages(threadId);
      setLiveMessages(list);
    } catch (e) {
      console.error('Send support message:', e);
    } finally {
      setLiveLoading(false);
    }
  };

  const handleSend = mode === 'robot' ? handleSendRobot : handleSendLive;
  const isRobot = mode === 'robot';
  const data = isRobot ? messages : liveMessages.map((m) => ({ role: m.sender_type === 'user' ? 'user' as const : 'assistant' as const, content: m.content }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="chatbubbles" size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>Msaada</Text>
          </View>
          {onClose && (
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          )}
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, isRobot && styles.tabActive]}
            onPress={() => setMode('robot')}
          >
            <Ionicons name="hardware-chip-outline" size={18} color={isRobot ? colors.surface : colors.textSecondary} />
            <Text style={[styles.tabText, isRobot && styles.tabTextActive]}>Robot</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, !isRobot && styles.tabActive]}
            onPress={() => setMode('live')}
          >
            <Ionicons name="person-outline" size={18} color={!isRobot ? colors.surface : colors.textSecondary} />
            <Text style={[styles.tabText, !isRobot && styles.tabTextActive]}>Live (mtu)</Text>
          </Pressable>
        </View>

        {isRobot ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, i) => `msg-${i}`}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            renderItem={({ item }) => (
              <View style={[styles.message, item.role === 'user' ? styles.userMessage : styles.assistantMessage]}>
                <Text style={[styles.messageText, item.role === 'user' ? styles.userMessageText : styles.assistantMessageText]}>{item.content}</Text>
              </View>
            )}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={liveMessages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListEmptyComponent={
              !liveLoading ? (
                <View style={styles.emptyLive}>
                  <Text style={styles.emptyLiveText}>Andika ujumbe hapa. Mtu atakujibu. Ikiwa hajibu, piga: {SUPPORT_PHONE}</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={[styles.message, item.sender_type === 'user' ? styles.userMessage : styles.assistantMessage]}>
                <Text style={[styles.messageText, item.sender_type === 'user' ? styles.userMessageText : styles.assistantMessageText]}>{item.content}</Text>
              </View>
            )}
          />
        )}

        <View style={styles.callBar}>
          <Pressable style={styles.callBtn} onPress={handleCallSupport}>
            <Ionicons name="call" size={20} color={colors.surface} />
            <Text style={styles.callBtnText}>Piga msaada: {SUPPORT_PHONE}</Text>
          </Pressable>
        </View>

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={isRobot ? 'Andika ujumbe...' : 'Ujumbe kwa msaada...'}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              editable={!(loading || liveLoading)}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || loading || liveLoading}
              style={[styles.sendBtn, (!input.trim() || loading || liveLoading) && styles.sendBtnDisabled]}
            >
              {(loading || liveLoading) ? (
                <Ionicons name="hourglass-outline" size={20} color={colors.surface} />
              ) : (
                <Ionicons name="send" size={20} color={colors.surface} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.subheading, color: colors.textPrimary, fontWeight: '600' },
  closeBtn: { padding: spacing.xs },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.surface },
  messagesList: { padding: spacing.md, flexGrow: 1 },
  message: {
    maxWidth: '80%',
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  userMessage: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  messageText: { ...typography.body, lineHeight: 20 },
  userMessageText: { color: colors.surface },
  assistantMessageText: { color: colors.textPrimary },
  emptyLive: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyLiveText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  callBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  callBtnText: { ...typography.subheading, color: colors.surface, fontWeight: '600' },
  inputWrapper: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
});
