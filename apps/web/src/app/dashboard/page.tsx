'use client';

import {
  Description,
  Chat,
  CheckCircle,
  Error as ErrorIcon,
  Memory,
  Storage,
} from '@mui/icons-material';
import { Box, Typography, Card, CardContent, Chip, CircularProgress, Divider } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import AppShell from '../../components/AppShell';
import AuthGuard from '../../components/AuthGuard';
import {
  documentsApi,
  chatApi,
  healthApi,
  type DocumentStats,
  type ChatSessionDto,
} from '../../lib/api-client';

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: color ?? 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.9,
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DashboardPage() {
  const { data: docStats } = useQuery<DocumentStats>({
    queryKey: ['document-stats'],
    queryFn: documentsApi.stats,
    refetchInterval: 15_000,
  });

  const { data: sessions = [] } = useQuery<ChatSessionDto[]>({
    queryKey: ['chat-sessions'],
    queryFn: chatApi.getSessions,
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
    refetchInterval: 30_000,
  });

  const indexedCount = docStats?.byStatus?.['indexed'] ?? 0;
  const errorCount = docStats?.byStatus?.['error'] ?? 0;

  return (
    <AuthGuard>
      <AppShell>
        <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
            Dashboard
          </Typography>

          {/* System status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              System status:
            </Typography>
            {health ? (
              <Chip
                label={health.status === 'ok' ? 'Operational' : 'Degraded'}
                color={health.status === 'ok' ? 'success' : 'warning'}
                size="small"
              />
            ) : (
              <CircularProgress size={16} />
            )}
          </Box>

          {/* Stats cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 3,
              mb: 4,
            }}
          >
            <StatCard
              title="Total Documents"
              value={docStats?.total ?? '—'}
              icon={<Description sx={{ color: 'white', fontSize: 20 }} />}
              color="#5c9cf5"
              subtitle={`${formatBytes(docStats?.totalSizeBytes ?? 0)} total`}
            />
            <StatCard
              title="Indexed"
              value={indexedCount}
              icon={<CheckCircle sx={{ color: 'white', fontSize: 20 }} />}
              color="#4caf50"
              subtitle="Ready for queries"
            />
            <StatCard
              title="Chat Sessions"
              value={sessions.length}
              icon={<Chat sx={{ color: 'white', fontSize: 20 }} />}
              color="#9c7cf5"
              subtitle={`${sessions.reduce((sum, s) => sum + s.messageCount, 0)} messages`}
            />
            <StatCard
              title="Errors"
              value={errorCount}
              icon={<ErrorIcon sx={{ color: 'white', fontSize: 20 }} />}
              color={errorCount > 0 ? '#f44336' : '#616161'}
              subtitle="Processing errors"
            />
          </Box>

          {/* Document status breakdown */}
          {docStats && Object.keys(docStats.byStatus).length > 0 && (
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Storage sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">Document Pipeline</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {Object.entries(docStats.byStatus).map(([status, count]) => (
                    <Box key={status} sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {count}
                      </Typography>
                      <Chip label={status} size="small" sx={{ mt: 0.5 }} />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Recent sessions */}
          {sessions.length > 0 && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Memory sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">Recent Conversations</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {sessions.slice(0, 5).map((s) => (
                    <Box
                      key={s.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Chat sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {s.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.messageCount} messages
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </AppShell>
    </AuthGuard>
  );
}
