import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Text,
  Button,
  Paper,
  Group,
  TextInput,
  Checkbox,
  Badge,
  ActionIcon,
  ThemeIcon,
} from '@mantine/core';
import { IconSearch, IconX, IconGripVertical, IconInfoCircle, IconArrowRight, IconStack2, IconLink } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useLoanProductStore } from '../../../store/loanProductStore';
import { ModalFooter } from '../../../components/shared/ModalFooter';

export function MapLoanProducts() {
  const navigate = useNavigate();
  const { products, fetchProducts } = useLoanProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const filters = ['All', 'Personal', 'Vehicle', 'Business', 'Home', 'Education'];

  const getDisplayType = (category: string, name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('personal')) return 'Personal';
    if (lowerName.includes('vehicle') || lowerName.includes('car')) return 'Vehicle';
    if (lowerName.includes('business')) return 'Business';
    if (lowerName.includes('home')) return 'Home';
    if (lowerName.includes('education')) return 'Education';
    return category;
  };

  // NOTE: list kept short for now — showing only the first 6 products.
  // Remove the .slice(0, 6) once the full list should come back.
  const availableProducts = useMemo(() => {
    let filtered = products; // selected products stay visible here too, not removed
    if (activeFilter !== 'All') {
      filtered = filtered.filter(p => getDisplayType(p.category, p.name) === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return filtered.slice(0, 6);
  }, [products, activeFilter, searchQuery]);

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));

  const addProduct = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeProduct = (id: string) => {
    setSelectedIds(prev => prev.filter(pid => pid !== id));
  };

  const getCode = (product: { id: string; name: string }) => {
    const prefix = product.name.split(' ').map(w => w[0]).join('').toUpperCase();
    return `${prefix}-00${product.id.replace(/\D/g, '') || '1'}`;
  };

  const handleBack = () => {
    navigate({ to: '..' });
  };

  const handleSaveDraft = () => {
    // TODO: wire actual save-as-draft API call
    console.log('Saving as draft', selectedIds);
  };

  const handleSubmit = () => {
    setIsSaving(true);
    // TODO: wire actual save & continue API call
    console.log('Saving & continuing', selectedIds);
    setIsSaving(false);
  };

  return (
    <Box className="w-full px-6 pt-0 pb-3">      {/* Page header */}
      <Box className="mb-3">
        <Text size="xl" fw={700} c="slate.9">
          Map Loan Products
        </Text>
        <Text size="sm" c="slate.5" className="mt-1">
          Select the loan products from the available list and map them to the selected contract template.
        </Text>
      </Box>

      {/* Body */}
      <div className="flex gap-4 items-start">
        {/* Left Column: Available Products */}
        <Paper className="flex-[1.3] border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <Box className="p-5 border-b border-slate-100">
            <Group gap="sm" mb="md" wrap="nowrap">
              <ThemeIcon size={38} radius="xl" variant="light" color="brand">
                <IconStack2 size={19} />
              </ThemeIcon>
              <Box>
                <Text fw={600} size="sm" c="slate.9">Available Loan Products</Text>
                <Text size="xs" c="slate.5">
                  Browse and select loan products to map with this template.
                </Text>
              </Box>
            </Group>

            <TextInput
              placeholder="Search loan products..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              mb="sm"
              radius="md"
              size="sm"
            />

            <Group gap={8} wrap="wrap" pb={2}>
              {filters.map(f => (
                <Button
                  key={f}
                  variant={activeFilter === f ? 'filled' : 'default'}
                  color={activeFilter === f ? 'brand' : 'gray'}
                  size="xs"
                  radius="xl"
                  onClick={() => setActiveFilter(f)}
                  style={{ fontWeight: activeFilter === f ? 600 : 500 }}
                >
                  {f}
                </Button>
              ))}
            </Group>
          </Box>

          {/* List Header — checkbox column placeholder kept for alignment, no checkbox rendered */}
          <Box className="px-5 py-2.5 border-b border-slate-100 flex items-center bg-slate-0">
            <Box style={{ width: 32 }} />
            <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider flex-1">Product Name</Text>
            <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider w-24">Loan Type</Text>
            <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider w-24 pl-2">Status</Text>
            <Box style={{ width: 60 }} className="shrink-0" />
          </Box>

          <div className="px-2 py-1 bg-white">
            {availableProducts.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">No products found.</Text>
            ) : (
              <div className="flex flex-col">
                {availableProducts.map(product => {
                  const isSelected = selectedIds.includes(product.id);
                  const type = getDisplayType(product.category, product.name);
                  const code = getCode(product);

                  return (
                    <Box
                      key={product.id}
                      className={`px-3 py-3 border-b border-slate-100 flex items-center transition-colors ${
                        isSelected ? 'bg-brand-0' : 'hover:bg-slate-50'
                      }`}
                    >
                      <Box style={{ width: 32 }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => (isSelected ? removeProduct(product.id) : addProduct(product.id))}
                          color="brand"
                          radius="sm"
                          size="xs"
                        />
                      </Box>
                      <div className="flex-1 min-w-0 pr-4">
                        <Text size="sm" fw={600} c="slate.8" truncate>{product.name}</Text>
                        <Text size="xs" c="slate.5" truncate>{code} · {product.name}</Text>
                      </div>
                      <Box className="w-24">
                        <Badge variant="light" color="brand" size="sm">
                          {type}
                        </Badge>
                      </Box>
                      <Box className="w-24 flex items-center pl-2">
                        <Badge
                          variant="light"
                          color={product.status === 'Active' ? 'success' : 'warning'}
                          size="sm"
                          leftSection={
                            <Box
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  product.status === 'Active'
                                    ? 'var(--mantine-color-success-6)'
                                    : 'var(--mantine-color-warning-6)',
                              }}
                            />
                          }
                        >
                          {product.status}
                        </Badge>
                      </Box>
                    </Box>
                  );
                })}
              </div>
            )}
          </div>

          <Box className="p-4 bg-white border-t border-slate-100">
          </Box>
        </Paper>

        {/* Right Column: Mapped Products */}
        <Paper className="flex-1 border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <Box className="p-5 border-b border-slate-100">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size={38} radius="xl" variant="light" color="brand">
                <IconLink size={19} />
              </ThemeIcon>
              <Box>
                <Text fw={600} size="sm" c="slate.9">Mapped Loan Products</Text>
                <Text size="xs" c="slate.5">
                  These products will use this contract template.
                </Text>
              </Box>
            </Group>
          </Box>

          <div className="p-5 bg-white">
            <Text size="sm" c="slate.5" mb="md">
              {selectedIds.length} products mapped
            </Text>

            <div className="flex flex-col gap-3 mb-5">
              {selectedProducts.map(product => {
                const type = getDisplayType(product.category, product.name);
                const code = getCode(product);

                return (
                  <Paper
                    key={product.id}
                    className="p-3 border border-slate-200 bg-white flex flex-col gap-2 rounded-lg overflow-hidden relative"
                  >
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <div className="flex-1 min-w-0 pr-2">
                        <Text size="sm" fw={600} c="slate.8" truncate>{product.name}</Text>
                        <Text size="xs" c="slate.5" truncate>{type} Loan · {code} · Secured</Text>
                      </div>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => removeProduct(product.id)}
                        size="sm"
                      >
                        <IconX size={16} stroke={1.5} />
                      </ActionIcon>
                    </Group>

                    <div>
                      <Badge variant="light" color="brand" size="sm" className="shrink-0">
                        Mapped
                      </Badge>
                    </div>
                  </Paper>
                );
              })}
            </div>
          </div>
        </Paper>
      </div>

      {/* Footer */}
      <Box className="mt-6 pt-4 border-t border-slate-200">
        <Group justify="space-between">
          <Button variant="default" size="md" onClick={handleBack}>
            Cancel
          </Button>
          <Group>
            <Button variant="default" size="md" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button size="md" color="brand" onClick={handleSubmit} loading={isSaving} rightSection={<IconArrowRight size={16} />}>
              Save & Continue
            </Button>
          </Group>
        </Group>
      </Box>
    </Box>
  );
}