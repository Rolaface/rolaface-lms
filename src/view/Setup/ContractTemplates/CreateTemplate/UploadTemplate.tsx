import React, { useRef, useState } from 'react';
import { Box, Button, Group, Text, Paper, Divider, Stack, Center, Modal } from '@mantine/core';
import { IconCloudUpload, IconEye, IconRefresh, IconCircleCheck } from '@tabler/icons-react';

interface UploadTemplateProps {
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
}

export const UploadTemplate: React.FC<UploadTemplateProps> = ({
  onNext,
  onPrev,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewOpened, setPreviewOpened] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setFileUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setFileUrl(URL.createObjectURL(e.dataTransfer.files[0]));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormattedDate = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' });
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  return (
    <Box className="flex flex-col bg-white">
      <Box className="p-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />

        <Paper
          mb="xl"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ 
            border: '1px dashed var(--mantine-color-brand-4)', 
            backgroundColor: 'white',
            borderRadius: '12px',
            cursor: 'pointer'
          }}
          onClick={handleBrowseClick}
        >
          <Stack align="center" justify="center" gap="sm" py={30}>
            <IconCloudUpload size={54} stroke={1.5} color="var(--mantine-color-brand-6)" />
            <Text fw={600} size="lg" c="slate.8">
              Drag & drop PDF or DOCX here
            </Text>
            <Text c="slate.5" size="sm">
              or
            </Text>
            <Button color="brand" radius="md" size="md" onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}>
              Browse File
            </Button>
            <Text c="slate.5" size="sm" mt="xs">
              Only PDF/DOCX files allowed. Max size 20MB
            </Text>
          </Stack>
        </Paper>

        {file && (
          <>
            <Text fw={600} size="sm" c="slate.9" mb="md">
              Uploaded Document
            </Text>
            
            <Paper p="md" style={{ border: '1px solid var(--mantine-color-slate-2)', borderRadius: '12px', backgroundColor: 'white' }}>
              <Group justify="space-between" wrap="nowrap">
                <Group gap="lg">
                  <Center className="w-12 h-14 bg-red-50 rounded-md" style={{ border: '1px solid #fee2e2' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <text x="9" y="18" fontSize="6" fontWeight="bold" fill="#ef4444" stroke="none">PDF</text>
                    </svg>
                  </Center>
                  <Box>
                    <Text fw={600} size="sm" c="slate.9" mb={2} style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.name}
                    </Text>
                    <Text c="slate.5" size="xs">{formatFileSize(file.size)} &bull; Uploaded on {getFormattedDate()}</Text>
                  </Box>
                </Group>

                <Group gap="md">
                  <Button variant="outline" color="brand" size="sm" style={{ borderColor: 'var(--mantine-color-slate-2)' }} leftSection={<IconEye size={16} />} onClick={() => setPreviewOpened(true)}>
                    Preview
                  </Button>
                  <Button variant="outline" color="brand" size="sm" style={{ borderColor: 'var(--mantine-color-slate-2)' }} leftSection={<IconRefresh size={16} />} onClick={handleBrowseClick}>
                    Replace File
                  </Button>
                  <IconCircleCheck size={28} color="var(--mantine-color-green-6)" style={{ marginLeft: 8 }} />
                </Group>
              </Group>
            </Paper>
          </>
        )}
      </Box>


      <Modal opened={previewOpened} onClose={() => setPreviewOpened(false)} title="Document Preview" size="80%" withCloseButton closeButtonProps={{ size: 'lg' }}>
        {fileUrl && (
          <iframe src={fileUrl} width="100%" height="70vh" style={{ border: 'none', minHeight: '600px' }} title="Preview" />
        )}
      </Modal>

      <Divider color="slate.2" />

      <Group justify="space-between" p="lg" px={32}>
        <Button variant="default" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Group>
          <Button variant="default" size="md">
            Save as Draft
          </Button>
          <Button color="brand" size="md" onClick={onNext} rightSection={<span dangerouslySetInnerHTML={{ __html: '&rarr;' }} />} disabled={!file}>
            Next: Configure Template
          </Button>
        </Group>
      </Group>
    </Box>
  );
};

