'use client';

import {
  CloudUpload,
  DeleteOutlined,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  Memory,
  Description,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useCallback, useState } from 'react';

import AppShell from '../../components/AppShell';
import AuthGuard from '../../components/AuthGuard';
import { documentsApi, type DocumentDto } from '../../lib/api-client';

// ─── Status Chip ──────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const config: Record<
    string,
    { color: 'success' | 'error' | 'warning' | 'default' | 'info'; icon: React.ReactNode }
  > = {
    indexed: { color: 'success', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    error: { color: 'error', icon: <ErrorIcon sx={{ fontSize: 14 }} /> },
    uploaded: { color: 'default', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    parsing: { color: 'info', icon: <CircularProgress size={12} /> },
    parsed: { color: 'info', icon: <Description sx={{ fontSize: 14 }} /> },
    embedding: { color: 'warning', icon: <Memory sx={{ fontSize: 14 }} /> },
  };

  const { color, icon } = config[status] ?? { color: 'default', icon: null };
  return (
    <Chip
      label={status}
      color={color}
      size="small"
      icon={icon as React.ReactElement | undefined}
      variant="outlined"
    />
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onUpload,
  uploading,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onUpload(file);
    },
    [onUpload],
  );

  return (
    <Paper
      variant="outlined"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      sx={{
        p: 4,
        textAlign: 'center',
        borderStyle: 'dashed',
        borderColor: dragOver ? 'primary.main' : 'divider',
        bgcolor: dragOver ? 'action.hover' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderRadius: 3,
      }}
    >
      {uploading ? (
        <CircularProgress size={32} />
      ) : (
        <>
          <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" gutterBottom>
            Drag & drop a file here, or
          </Typography>
          <Button variant="contained" component="label" disabled={uploading}>
            Browse Files
            <input
              type="file"
              hidden
              accept=".pdf,.docx,.xlsx,.txt,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = '';
              }}
            />
          </Button>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
            Supported: PDF, DOCX, XLSX, TXT, CSV — max 50 MB
          </Typography>
        </>
      )}
    </Paper>
  );
}

// ─── Main Documents Page ──────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const {
    data: documents = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<DocumentDto[]>({
    queryKey: ['documents'],
    queryFn: documentsApi.list,
    refetchInterval: (query) => {
      // Auto-refresh while any document is being processed
      const docs = query.state.data ?? [];
      const processing = docs.some((d) =>
        ['uploaded', 'parsing', 'parsed', 'embedding'].includes(d.status),
      );
      return processing ? 5000 : false;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: (doc) => {
      setUploadSuccess(`"${doc.originalName}" uploaded — indexing in progress…`);
      setUploadError('');
      void qc.invalidateQueries({ queryKey: ['documents'] });
      setTimeout(() => setUploadSuccess(''), 5000);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        setUploadError(err.response?.data?.message ?? 'Upload failed.');
      } else {
        setUploadError('Upload failed.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Count by status for progress summary
  const processingCount = documents.filter((d) =>
    ['uploaded', 'parsing', 'parsed', 'embedding'].includes(d.status),
  ).length;

  return (
    <AuthGuard>
      <AppShell>
        <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Documents
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Refresh">
              <IconButton onClick={() => void refetch()} disabled={isFetching}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          <UploadZone
            onUpload={(file) => uploadMutation.mutate(file)}
            uploading={uploadMutation.isPending}
          />

          {uploadSuccess && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setUploadSuccess('')}>
              {uploadSuccess}
            </Alert>
          )}

          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setUploadError('')}>
              {uploadError}
            </Alert>
          )}

          {processingCount > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {processingCount} document{processingCount > 1 ? 's' : ''} being indexed…
              <LinearProgress sx={{ mt: 1 }} />
            </Alert>
          )}

          <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Chunks</TableCell>
                  <TableCell>Pages</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No documents uploaded yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc: DocumentDto) => (
                    <TableRow key={doc.id} hover>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                          {doc.originalName}
                        </Typography>
                        {doc.errorMessage && (
                          <Typography variant="caption" color="error" noWrap>
                            {doc.errorMessage}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {doc.mimeType.split('/')[1]?.toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatBytes(doc.size)}</Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={doc.status} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{doc.chunkCount ?? '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{doc.pageCount ?? '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Delete document">
                          <IconButton
                            size="small"
                            onClick={() => deleteMutation.mutate(doc.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </AppShell>
    </AuthGuard>
  );
}
