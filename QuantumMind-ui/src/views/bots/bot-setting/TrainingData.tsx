// ** Training Data manager: upload documents / scrape a website into the bot's
// ** AI knowledge base, then list / view / delete ingested sources.
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@mui/lab';
import Icon from 'src/@core/components/icon';

interface TrainingDoc {
  _id: string;
  filename: string;
  status: string; // processing | completed | failed
  chunksIngested: number;
  mimeType?: string;
  error?: string;
  createdAt?: string;
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL as string; // .../api

const statusColor = (status: string) => {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  return 'warning';
};

export default function TrainingData({ botId }: { botId: string }) {
  const [docs, setDocs] = useState<TrainingDoc[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewDoc, setViewDoc] = useState<{ filename: string; content: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    if (!botId) return;
    setLoadingList(true);
    try {
      const res = await axios.post(`${BACKEND}/trainingdata/bot/${botId}`, {});
      setDocs(Array.isArray(res.data) ? res.data : []);
    } catch (error: any) {
      console.error('Failed to load training data', error);
    } finally {
      setLoadingList(false);
    }
  }, [botId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const loadingId = toast.loading(`Uploading ${files.length} file(s)...`);
    try {
      const formData = new FormData();
      formData.append('userId', '12345');
      formData.append('botId', `${botId}`);
      Array.from(files).forEach((f) => formData.append('file', f));

      const res = await axios.post(`${BACKEND}/trainingdata/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const results = Array.isArray(res.data) ? res.data : [];
      const ok = results.filter((r: any) => r.status === 'completed').length;
      const failed = results.length - ok;

      toast.dismiss(loadingId);
      if (ok > 0) toast.success(`${ok} file(s) processed and added to the knowledge base.`);
      if (failed > 0) toast.error(`${failed} file(s) could not be processed.`);

      await fetchDocs();
    } catch (error: any) {
      toast.dismiss(loadingId);
      toast.error(error?.response?.data?.message || error?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleScrape = async () => {
    const url = scrapeUrl.trim();
    if (!url) return;

    setScraping(true);
    const loadingId = toast.loading('Scraping website... this runs in the background.');
    try {
      // 1. Kick off the scrape.
      const res = await axios.post(`${BACKEND}/scraper`, {
        url,
        clientId: botId,
        botId,
      });

      // 2. Ingest the scraped content into the knowledge base.
      const scrapeId = res.data?._id || res.data?.id;
      if (scrapeId) {
        await axios.post(`${BACKEND}/scraper/${scrapeId}/ingest`, {
          clientId: botId,
          botId,
        });
      }

      toast.dismiss(loadingId);
      toast.success('Website content added to the knowledge base.');
      setScrapeUrl('');
      await fetchDocs();
    } catch (error: any) {
      toast.dismiss(loadingId);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Scraping failed. Please check the URL and that the scraper service is running.'
      );
    } finally {
      setScraping(false);
    }
  };

  const handleView = async (doc: TrainingDoc) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewDoc(null);
    try {
      const res = await axios.get(`${BACKEND}/trainingdata/view/${doc._id}`);
      setViewDoc({ filename: res.data.filename, content: res.data.content || '(no extracted text)' });
    } catch (error: any) {
      setViewDoc({ filename: doc.filename, content: 'Failed to load document content.' });
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async (doc: TrainingDoc) => {
    if (!window.confirm(`Remove "${doc.filename}" from the knowledge base?`)) return;
    const loadingId = toast.loading('Removing...');
    try {
      await axios.delete(`${BACKEND}/trainingdata/${doc._id}`);
      toast.dismiss(loadingId);
      toast.success('Removed from the knowledge base.');
      await fetchDocs();
    } catch (error: any) {
      toast.dismiss(loadingId);
      toast.error(error?.response?.data?.message || error?.message || 'Delete failed');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* ---- Upload documents ---- */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        Upload Documents
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Upload PDF, DOCX, or TXT files. Their text is extracted and used to train your bot's AI answers.
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <input
          ref={fileInputRef}
          id="training-file-input"
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <LoadingButton
          variant="contained"
          loading={uploading}
          startIcon={<Icon icon="mdi:upload" />}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? 'Processing...' : 'Choose & Upload Files'}
        </LoadingButton>
        {uploading && (
          <Typography variant="caption" color="text.secondary">
            Extracting text and building the knowledge base...
          </Typography>
        )}
      </Stack>

      <Divider sx={{ my: 3 }} />

      {/* ---- Scrape website ---- */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        Scrape a Website
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Enter your website URL. We fetch the content and add it to the knowledge base. Processing runs in
        the background, so you can keep working.
      </Typography>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            size="small"
            placeholder="https://www.yourwebsite.com"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            disabled={scraping}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LoadingButton
            fullWidth
            variant="contained"
            loading={scraping}
            disabled={!scrapeUrl.trim()}
            startIcon={<Icon icon="mdi:web" />}
            onClick={handleScrape}
          >
            {scraping ? 'Processing...' : 'Scrape Website'}
          </LoadingButton>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ---- Ingested documents list ---- */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Knowledge Base ({docs.length})</Typography>
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={fetchDocs}>
            <Icon icon="mdi:refresh" />
          </IconButton>
        </Tooltip>
      </Stack>

      {loadingList ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : docs.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
          No documents yet. Upload a file or scrape a website to get started.
        </Typography>
      ) : (
        <List>
          {docs.map((doc) => (
            <ListItem
              key={doc._id}
              divider
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View extracted text">
                    <span>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleView(doc)}
                        disabled={doc.status !== 'completed'}
                      >
                        <Icon icon="mdi:eye-outline" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton edge="end" size="small" color="error" onClick={() => handleDelete(doc)}>
                      <Icon icon="mdi:delete-outline" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            >
              <Box sx={{ mr: 2 }}>
                <Icon
                  icon={doc.mimeType?.includes('pdf') ? 'mdi:file-pdf-box' : 'mdi:file-document-outline'}
                  fontSize={28}
                />
              </Box>
              <ListItemText
                primary={doc.filename}
                secondary={
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip label={doc.status} size="small" color={statusColor(doc.status) as any} />
                    {doc.status === 'completed' && (
                      <Typography variant="caption" color="text.secondary">
                        {doc.chunksIngested} chunk(s)
                      </Typography>
                    )}
                    {doc.status === 'failed' && doc.error && (
                      <Typography variant="caption" color="error">
                        {doc.error}
                      </Typography>
                    )}
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* ---- View dialog ---- */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <span>{viewDoc?.filename || 'Document'}</span>
            <IconButton size="small" onClick={() => setViewOpen(false)}>
              <Icon icon="mdi:close" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Typography
              component="pre"
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}
            >
              {viewDoc?.content}
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
