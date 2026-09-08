import { useState, useMemo } from 'react';
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
  const { products } = useLoanProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [selectedIds, setSelectedIds] = useState<string[]>(['prod-005', 'prod-006']);
  const [isSaving, setIsSaving] = useState(false);

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
                      <Box style={{ width: 60 }} className="flex justify-end shrink-0">
                        <Button
                          variant={isSelected ? 'light' : 'subtle'}
                          color={isSelected ? 'gray' : 'brand'}
                          size="xs"
                          px={8}
                          onClick={() => (isSelected ? removeProduct(product.id) : addProduct(product.id))}
                        >
                          {isSelected ? 'Added' : 'Add'}
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </div>
            )}
          </div>

          <Box className="p-4 bg-white border-t border-slate-100">
            <Button
              variant="light"
              color="brand"
              fullWidth
              radius="md"
              leftSection={<Text size="sm" fw={700}>+</Text>}
            >
              Add More Products
            </Button>
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
                    className="p-3 border border-slate-200 bg-white flex items-center gap-2 rounded-lg flex-nowrap overflow-hidden"
                  >
                    <IconGripVertical size={18} color="var(--mantine-color-slate-4)" className="cursor-grab shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Text size="sm" fw={600} c="slate.8" truncate>{product.name}</Text>
                      <Text size="xs" c="slate.5" truncate>{type} Loan · {code} · Secured</Text>
                    </div>
                    <Badge variant="light" color="brand" size="sm" className="shrink-0">
                      Mapped
                    </Badge>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => removeProduct(product.id)}
                      className="shrink-0"
                    >
                      <IconX size={16} stroke={1.5} />
                    </ActionIcon>
                  </Paper>
                );
              })}
            </div>

            {selectedIds.length > 0 && (
              <Box className="bg-brand-0 border border-brand-1 rounded-lg p-4 flex gap-3">
                <IconInfoCircle size={20} color="var(--mantine-color-brand-6)" className="shrink-0 mt-0.5" />
                <Text size="sm" c="brand.8" lh={1.4}>
                  This template can be reused across all mapped products. Removing a product here won't delete it — it only unlinks it from this template.
                </Text>
              </Box>
            )}
          </div>
        </Paper>
      </div>

      {/* Footer — shared ModalFooter component (theme variant), same as CollateralTypeModal */}
      <ModalFooter
        variant="theme"
        onClose={handleBack}
        onSaveDraft={handleSaveDraft}
        saveDraftLabel="Save as Draft"
        onSubmit={handleSubmit}
        submitLabel="Save & Continue"
        submitLoading={isSaving}
        submitIcon={<IconArrowRight size={14} />}
      />
    </Box>
  );
}