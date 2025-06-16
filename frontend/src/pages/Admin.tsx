import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  if (!user?.is_admin) {
    return (
      <Box maxW="xl" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg">
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You do not have permission to view this page.</AlertDescription>
        </Alert>
      </Box>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/import-items', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Import failed');
      } else {
        setResult(data);
        toast({ title: 'Import complete', status: 'success', duration: 3000, isClosable: true });
      }
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Box maxW="xl" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg">
      <Heading mb={6}>Admin: Import Items from CSV</Heading>
      <VStack spacing={4} align="stretch">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          ref={fileInputRef}
          isDisabled={uploading}
        />
        {uploading && <Spinner label="Uploading..." />}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Import Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {result && (
          <Box>
            <Text fontWeight="bold">Import Result:</Text>
            <Text>Imported: {result.imported}</Text>
            <Text>Failed: {result.failed}</Text>
            {result.errors && result.errors.length > 0 && (
              <Box mt={2} maxH="200px" overflowY="auto" borderWidth={1} borderRadius="md" p={2} bg="gray.50">
                <Text fontWeight="bold">Errors:</Text>
                {result.errors.map((err: any, idx: number) => (
                  <Text key={idx} fontSize="sm" color="red.500">{err.error}</Text>
                ))}
              </Box>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default Admin; 