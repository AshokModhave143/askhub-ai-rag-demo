'use client';

import {
  Send,
  Add,
  ExpandMore,
  ExpandLess,
  DeleteOutlined,
  SmartToy,
  Person,
  ContentCopy,
} from '@mui/icons-material';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  Alert,
  Collapse,
  Button,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';

import AppShell from '../../components/AppShell';
import AuthGuard from '../../components/AuthGuard';
import {
  chatApi,
  type ChatSessionDto,
  type ChatMessageDto,
  type Citation,
  type SendMessageResponse,
  type ChatSession,
} from '../../lib/api-client';

// ─── Citation Card ────────────────────────────────────────────────────────────

function CitationCard({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mt: 1, borderRadius: 2, borderColor: 'divider' }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1 }}
        onClick={() => setOpen((o) => !o)}
      >
        <Chip
          label={`${Math.round(citation.score * 100)}%`}
          size="small"
          color="primary"
          variant="outlined"
        />
        <Typography variant="caption" sx={{ flex: 1 }} noWrap>
          {citation.filename}
          {citation.pageNumber !== undefined && citation.pageNumber !== null
            ? ` · p.${citation.pageNumber}`
            : ''}
          {' · chunk '}
          {citation.chunkIndex}
        </Typography>
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </Box>
      <Collapse in={open}>
        <Typography
          variant="caption"
          color="text.secondary"
          component="pre"
          sx={{
            mt: 1,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'inherit',
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          {citation.content}
        </Typography>
      </Collapse>
    </Paper>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessageDto }) {
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    void navigator.clipboard.writeText(msg.content);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 1.5,
        mb: 2,
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: isUser ? 'secondary.main' : 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.5,
        }}
      >
        {isUser ? (
          <Person sx={{ fontSize: 18, color: 'white' }} />
        ) : (
          <SmartToy sx={{ fontSize: 18, color: 'white' }} />
        )}
      </Box>

      <Box sx={{ maxWidth: '80%', minWidth: 0 }}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: isUser ? 'secondary.dark' : 'background.paper',
            border: isUser ? 'none' : '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="body2"
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              m: 0,
            }}
          >
            {msg.content}
          </Typography>
        </Paper>

        {msg.citations && msg.citations.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''}
            </Typography>
            {msg.citations.map((c, i) => (
              <CitationCard key={i} citation={c} />
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
          <Typography variant="caption" color="text.disabled">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </Typography>
          <Tooltip title="Copy">
            <IconButton size="small" onClick={handleCopy} sx={{ opacity: 0.5 }}>
              <ContentCopy sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const qc = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions = [] } = useQuery<ChatSessionDto[]>({
    queryKey: ['chat-sessions'],
    queryFn: chatApi.getSessions,
  });

  const { data: sessionDetail } = useQuery<ChatSession>({
    queryKey: ['chat-session', activeSessionId],
    queryFn: () => chatApi.getSession(activeSessionId!),
    enabled: !!activeSessionId,
  });

  useEffect(() => {
    if (sessionDetail) {
      setMessages(sessionDetail.messages ?? []);
    }
  }, [sessionDetail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation<
    SendMessageResponse,
    unknown,
    { message: string; sessionId?: string }
  >({
    mutationFn: chatApi.sendMessage,
    onSuccess: (data) => {
      setActiveSessionId(data.sessionId);
      const assistantMsg: ChatMessageDto = {
        id: data.messageId,
        role: 'assistant',
        content: data.answer,
        citations: data.citations,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      void qc.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onError: (err: unknown) => {
      setMessages((prev) => prev.slice(0, -1));
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Failed to send message.');
      } else {
        setError('An error occurred.');
      }
    },
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    setError('');
    const userMsg: ChatMessageDto = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    sendMutation.mutate({ message: trimmed, sessionId: activeSessionId ?? undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setError('');
  };

  const handleSelectSession = (session: ChatSessionDto) => {
    if (session.id === activeSessionId) return;
    setActiveSessionId(session.id);
    setMessages([]);
  };

  const deleteMutation = useMutation({
    mutationFn: chatApi.deleteSession,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat-sessions'] });
      setActiveSessionId(null);
      setMessages([]);
    },
  });

  const suggestions = [
    'Summarize all documents',
    'What are the key findings?',
    'Compare the main topics',
  ];

  return (
    <AuthGuard>
      <AppShell>
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
          {/* Session sidebar */}
          <Box
            sx={{
              width: 280,
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 2 }}>
              <Button fullWidth variant="outlined" startIcon={<Add />} onClick={handleNewChat}>
                New Chat
              </Button>
            </Box>
            <Divider />
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {sessions.length === 0 ? (
                <Typography variant="caption" color="text.disabled" sx={{ p: 2, display: 'block' }}>
                  No conversations yet
                </Typography>
              ) : (
                <List dense disablePadding>
                  {sessions.map((s) => (
                    <ListItem
                      key={s.id}
                      disablePadding
                      secondaryAction={
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(s.id);
                            }}
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemButton
                        selected={s.id === activeSessionId}
                        onClick={() => handleSelectSession(s)}
                        sx={{ borderRadius: 1, mx: 0.5 }}
                      >
                        <ListItemText primary={s.title} secondary={`${s.messageCount} messages`} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          {/* Chat area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {messages.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    opacity: 0.5,
                  }}
                >
                  <SmartToy sx={{ fontSize: 64 }} />
                  <Typography variant="h6">Ask anything about your documents</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                    {suggestions.map((suggestion) => (
                      <Chip
                        key={suggestion}
                        label={suggestion}
                        clickable
                        onClick={() => setInput(suggestion)}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
              )}

              {sendMutation.isPending && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Thinking…
                  </Typography>
                </Box>
              )}

              {error && (
                <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <div ref={messagesEndRef} />
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={6}
                  placeholder="Ask a question… (Shift+Enter for new line)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sendMutation.isPending}
                  variant="outlined"
                  size="small"
                />
                <IconButton
                  color="primary"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&:disabled': { bgcolor: 'action.disabled' },
                  }}
                >
                  <Send />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>
      </AppShell>
    </AuthGuard>
  );
}
