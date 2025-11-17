import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from '@mui/material';

interface JsonImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (json: any) => void;
  error?: string;
}

const JsonImportDialog: React.FC<JsonImportDialogProps> = ({ open, onClose, onImport, error }) => {
  const [rawJson, setRawJson] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setRawJson(event.target?.result as string || '');
        setFileError(null);
      } catch (err) {
        setFileError('Could not read file');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(rawJson);
      onImport(parsed);
    } catch (err) {
      setFileError('Invalid JSON');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import JSON</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Paste your JSON below or select a file to import.
        </Typography>
        <TextField
          label="Raw JSON"
          multiline
          minRows={8}
          fullWidth
          value={rawJson}
          onChange={e => setRawJson(e.target.value)}
          error={!!fileError || !!error}
          helperText={fileError || error}
        />
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" component="label">
            Select File
            <input type="file" accept="application/json" hidden onChange={handleFileChange} />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleImport} variant="contained">Import</Button>
      </DialogActions>
    </Dialog>
  );
};

export default JsonImportDialog;
