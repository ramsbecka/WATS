import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatWithAI, AIChatMessage } from '@/services/ai';
import { colors, spacing, typography, radius } from '@/theme/tokens';

interface ChatbotProps {
  userId?: string;
  orderId?: string;
  onClose?: () => void;
}

export default function Chatbot({ userId, orderId, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m here to help you with your questions about orders, products, returns, and more. How can I assist you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: AIChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithAI([...messages, userMessage], {
        userId,
        orderId,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again or contact our support team.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="chatbubbles" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Customer Support</Text>
        </View>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => `msg-${index}`}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.role === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
              ]}
            >
              {item.content}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          editable={!loading}
        />
        <Pressable
          onPress={handleSend}
          disabled={!input.trim() || loading}
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
        >
          {loading ? (
            <Ionicons name="hourglass-outline" size={20} color={colors.surface} />
          ) : (
            <Ionicons name="send" size={20} color={colors.surface} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  messagesList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  message: {
    maxWidth: '80%',
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  messageText: {
    ...typography.body,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.surface,
  },
  assistantMessageText: {
    color: colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
  sendBtnDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
});
