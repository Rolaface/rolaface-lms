import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Group,
  Text,
  Paper,
  Divider,
  Stack,
  Center,
  Modal,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import {
  IconCloudUpload,
  IconEye,
  IconRefresh,
  IconCircleCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { uploadAndExtractTemplate } from '../../../../api/ContractTemplateApi';

interface UploadTemplateProps {
  uploadedData?: any;
  onNext: (uploadedData?: any) => void;
  onPrev: () => void;
  onCancel: () => void;
  isView?: boolean;
}

const DEFAULT_EXTRACTED_PLACEHOLDERS = [
  'customer_name',
  'customer_number',
  'loan_account_no',
  'sanctioned_amount',
  'interest_rate',
  'tenure_months',
  'branch_name',
  'branch_code',
];

export const UploadTemplate: React.FC<UploadTemplateProps> = ({
  uploadedData,
  onNext,
  onPrev,
  onCancel,
  isView = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewOpened, setPreviewOpened] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(
    uploadedData?.local_file_url || uploadedData?.file_url || null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (f: File) => uploadAndExtractTemplate(f),
    onSuccess: (data) => {
      onNext({
        ...data,
        fileName: file?.name,
        local_file_url: fileUrl,
      });
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.message || 'Failed to extract placeholders from template document.'
      );
    },
  });

  const isUploading = uploadMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setFileUrl(URL.createObjectURL(selected));
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
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setFileUrl(URL.createObjectURL(dropped));
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

  const handleNextClick = () => {
    if (file) {
      setErrorMsg(null);
      uploadMutation.mutate(file);
    } else {
      // Allow moving forward even with demo template if no file selected
      onNext({
        status: 'success',
        fileName: 'Standard_Loan_Agreement.pdf',
        local_file_url: null,
        message: {
          file_name: 'Standard_Loan_Agreement.pdf',
          file_url: null,
          placeholders: DEFAULT_EXTRACTED_PLACEHOLDERS,
        },
      });
    }
  };

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        position: 'relative',
      }}
      bg="white"
    >
      <LoadingOverlay
        visible={isUploading}
        overlayProps={{ blur: 2 }}
        loaderProps={{ type: 'dots' }}
      />

      <Box px="xl" py="xl" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {errorMsg && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            mb="md"
            withCloseButton
            onClose={() => setErrorMsg(null)}
          >
            {errorMsg}
          </Alert>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />

        {!file && !uploadedData?.file_name && !uploadedData?.fileName && !uploadedData?.local_file_url && !isView ? (
          <Paper
            p={36}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-center"
            onClick={handleBrowseClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Center>
              <Stack align="center" gap="sm">
                <Box className="w-14 h-14 rounded-full flex items-center justify-center bg-brand-1 text-brand-7">
                  <IconCloudUpload size={32} />
                </Box>
                <Text fw={600} size="md" c="slate.8">
                  Click to upload or drag and drop
                </Text>
                <Text size="xs" c="slate.5">
                  PDF or DOCX (Max 10MB)
                </Text>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Paper p="lg" className="border border-slate-200 rounded-xl bg-slate-50">
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Box className="w-12 h-12 rounded-lg flex items-center justify-center bg-brand-1 text-brand-7">
                  <IconCloudUpload size={24} />
                </Box>
                <Box>
                  <Text fw={600} size="sm" c="slate.8">
                    {file?.name || uploadedData?.file_name || uploadedData?.fileName || 'Standard_Personal_Loan_Agreement.pdf'}
                  </Text>
                  <Text c="slate.5" size="xs">
                    {file ? `${formatFileSize(file.size)} • ` : ''}Standard contract template document (PDF)
                  </Text>
                </Box>
              </Group>

              <Group gap="xs">
                {(fileUrl || uploadedData?.local_file_url || uploadedData?.file_url) && (
                  <Button
                    variant="outline"
                    color="brand"
                    size="xs"
                    leftSection={<IconEye size={14} />}
                    onClick={() => {
                      const url = fileUrl || uploadedData?.local_file_url || uploadedData?.file_url;
                      if (url) {
                        setFileUrl(url);
                        setPreviewOpened(true);
                      }
                    }}
                  >
                    Preview
                  </Button>
                )}
                {!isView && (
                  <Button
                    variant="outline"
                    color="brand"
                    size="xs"
                    leftSection={<IconRefresh size={14} />}
                    onClick={handleBrowseClick}
                  >
                    Replace File
                  </Button>
                )}
                <IconCircleCheck size={24} color="var(--mantine-color-green-6)" />
              </Group>
            </Group>
          </Paper>
        )}
      </Box>

      <Modal
        opened={previewOpened}
        onClose={() => setPreviewOpened(false)}
        title="Document Preview"
        size="80%"
        withCloseButton
        closeButtonProps={{ size: 'lg' }}
      >
        {fileUrl && (
          <iframe
            src={fileUrl}
            width="100%"
            height="70vh"
            style={{ border: 'none', minHeight: '550px' }}
            title="Preview"
          />
        )}
      </Modal>

      {/* Footer Pinned to Bottom */}
      <Box style={{ flexShrink: 0 }}>
        <Divider color="slate.2" />
        <Group justify="space-between" px="xl" py="md" bg="white">
          <Button variant="default" size="sm" radius="md" onClick={onPrev}>
            Back
          </Button>
          <Group gap="sm">
            <Button variant="default" size="sm" radius="md" onClick={onCancel}>
              {isView ? 'Close' : 'Cancel'}
            </Button>
            <Button
              color="brand"
              size="sm"
              radius="md"
              onClick={
                isView
                  ? () => onNext(uploadedData)
                  : handleNextClick
              }
              disabled={!isView && isUploading}
              loading={!isView && isUploading}
            >
              Next: Configure Template
            </Button>
          </Group>
        </Group>
      </Box>
    </Box>
  );
};
