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
  Pagination,
} from '@mantine/core';
import { IconSearch, IconX, IconGripVertical, IconInfoCircle, IconArrowRight, IconStack2, IconLink, IconFileText, IconEye, IconTrash } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useLoanProductStore } from '../../../store/loanProductStore';
import { ModalFooter } from '../../../components/shared/ModalFooter';

const PAGE_SIZE = 6;

export function MapLoanProducts() {
  const navigate = useNavigate();
  const { products, fetchProducts } = useLoanProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);

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

  const availableProducts = useMemo(() => {
    let filtered = products; // selected products stay visible here too, not removed
    if (activeFilter !== 'All') {
      filtered = filtered.filter(p => getDisplayType(p.category, p.name) === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return filtered;
  }, [products, activeFilter, searchQuery]);

  // Reset to page 1 whenever the filtered set changes (new search/filter)
  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

  const totalProducts = availableProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstRow = totalProducts === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(totalProducts, currentPage * PAGE_SIZE);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return availableProducts.slice(start, start + PAGE_SIZE);
  }, [availableProducts, currentPage]);

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



  const handleSubmit = () => {
    setIsSaving(true);
    // TODO: wire actual save & continue API call
    console.log('Saving & continuing', selectedIds);
    setIsSaving(false);
  };

  return (
    <Box className="w-full px-6 pt-0 pb-2">      {/* Page header */}
      <Box className="mb-2">
        <Text size="xl" fw={700} c="slate.9">
          Map Loan Products
        </Text>
        <Text size="sm" c="slate.5" className="mt-0.5">
          Select the loan products from the available list and map them to the selected contract template.        </Text>
      </Box>

      {/* Contract Template Card */}
      <Paper radius="md" p={8} px="sm" mb="xs" style={{ border: "1px solid var(--mantine-color-brand-2)", background: "var(--mantine-color-brand-0)" }}>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--mantine-radius-md)",
                background: "var(--mantine-color-brand-1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--mantine-color-brand-7)"
              }}
            >
              <IconFileText size={16} />
            </Box>
            <Box>
              <Text size="9px" fw={700} c="brand.6" className="uppercase tracking-wider">
                Contract Template
              </Text>
              <Group gap={6} align="center" wrap="nowrap">
                <Text size="sm" fw={700} c="slate.9" mt={0}>
                  Standard Personal Loan Agreement
                </Text>
                <Text size="xs" fw={500} c="slate.5">· Agreement Version: 1.0</Text>
                <Badge variant="light" color="success" size="xs" radius="sm">Active</Badge>
              </Group>
            </Box>
          </Group>
          <Button variant="default" size="xs" radius="md" leftSection={<IconEye size={14} />}>
            View Template
          </Button>
        </Group>
      </Paper>

      {/* Body */}
      <div className="flex gap-3 items-start">
        {/* Left Column: Available Products */}
        <Paper className="flex-[1.3] border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <Box className="p-3 border-b border-slate-100">
            <Group gap="xs" mb="xs" wrap="nowrap">
              <ThemeIcon size={30} radius="xl" variant="light" color="brand">
                <IconStack2 size={16} />
              </ThemeIcon>
              <Box>
                <Text fw={600} size="sm" c="slate.9">Available Loan Products</Text>
              </Box>
            </Group>

            <TextInput
              placeholder="Search loan products..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              mb="xs"
              radius="md"
              size="sm"
            />

            <Group gap={6} wrap="wrap">
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

          {/* List Header */}
          <Box className="px-4 py-1.5 border-b border-slate-100 flex items-center bg-slate-0">
            <Box style={{ width: 32 }} />
            <Box className="flex-1 min-w-0 pr-4">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">Product Name</Text>
            </Box>
            <Box className="w-24">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">Loan Type</Text>
            </Box>
            <Box className="w-24 pl-2">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">Status</Text>
            </Box>
          </Box>

          <div className="px-2 py-1 bg-white">
            {paginatedProducts.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">No products found.</Text>
            ) : (
              <div className="flex flex-col">
                {paginatedProducts.map(product => {
                  const isSelected = selectedIds.includes(product.id);
                  const type = getDisplayType(product.category, product.name);
                  const code = getCode(product);

                  return (
                    <Box
                      key={product.id}
                      className={`px-3 py-1.5 border-b border-slate-100 flex items-center transition-colors ${isSelected ? 'bg-brand-0' : 'hover:bg-slate-50'
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

          {/* Pagination Footer */}
          <Box className="px-4 py-2 bg-white border-t border-slate-100 flex items-center justify-between">
            <Text size="xs" c="slate.5">
              {totalProducts === 0
                ? 'Showing 0 of 0 products'
                : `Showing ${firstRow}-${lastRow} of ${totalProducts} products`}
            </Text>
            {totalPages > 1 && (
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={setPage}
                color="brand"
                size="sm"
                radius="xl"
              />
            )}
          </Box>
        </Paper>

        {/* Right Column: Mapped Products */}
        <Paper className="flex-1 border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
          <Box className="p-3 border-b border-slate-100">
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon size={30} radius="xl" variant="light" color="brand">
                  <IconLink size={16} />
                </ThemeIcon>
                <Box>
                  <Text fw={600} size="sm" c="slate.9">Products Using This Template</Text>
                </Box>
              </Group>
              <Badge variant="light" color="brand" size="md" radius="sm">
                {selectedIds.length} {selectedIds.length === 1 ? 'Product' : 'Products'} Mapped
              </Badge>
            </Group>
          </Box>

          <Box className="px-4 py-1.5 border-b border-slate-100 flex items-center bg-slate-0">
            <Box className="flex-1 min-w-0 pr-4">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">Product Name</Text>
            </Box>
            <Box className="w-24">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">Loan Type</Text>
            </Box>
            <Box className="w-24 pl-2">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">Status</Text>
            </Box>
            <Box className="w-16 flex justify-end">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">Action</Text>
            </Box>
          </Box>

          <div className="px-2 py-1 bg-white flex-1">
            <div className="flex flex-col">
              {selectedProducts.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">No products mapped yet.</Text>
              ) : (
                selectedProducts.map(product => {
                  const type = getDisplayType(product.category, product.name);
                  const code = getCode(product);

                  return (
                    <Box
                      key={product.id}
                      className="px-3 py-1.5 border-b border-slate-100 flex items-center transition-colors hover:bg-slate-50"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <Text size="sm" fw={600} c="slate.8" truncate>{product.name}</Text>
                        <Text size="xs" c="slate.5" truncate>{code}</Text>
                      </div>
                      <Box className="w-24">
                        <Badge variant="light" color="brand" size="sm" radius="sm">
                          {type}
                        </Badge>
                      </Box>
                      <Box className="w-24 flex items-center pl-2">
                        <Badge
                          variant="light"
                          color={product.status === 'Active' ? 'success' : 'warning'}
                          size="sm"
                          radius="sm"
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
                      <Box className="w-16 flex justify-end">
                        <ActionIcon
                          variant="outline"
                          color="red"
                          onClick={() => removeProduct(product.id)}
                          size="sm"
                        >
                          <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                      </Box>
                    </Box>
                  );
                })
              )}
            </div>
          </div>
        </Paper>
      </div>

      {/* Footer */}
      <Paper radius="xl" p="xs" px="md" mt="xs" className="border border-slate-200 shadow-sm bg-white">
        <Group justify="space-between">
          <Button variant="default" size="md" radius="xl" onClick={handleBack}>
            Back
          </Button>
          <Group>
            <Button variant="default" size="md" radius="xl" onClick={handleBack}>
              Cancel
            </Button>
            <Button size="md" radius="xl" color="brand" onClick={handleSubmit} loading={isSaving} rightSection={<IconArrowRight size={16} />}>
              Save Mapping
            </Button>
          </Group>
        </Group>
      </Paper>
    </Box>
  );
}