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
  Select,
  Modal,
  SimpleGrid,
  Stack,
  Divider,
  Avatar,
} from '@mantine/core';
import {
  IconSearch,
  IconArrowRight,
  IconStack2,
  IconLink,
  IconFileText,
  IconEye,
  IconTrash,
  IconBuildingBank,
  IconCalendar,
  IconClock,
  IconCheck,
} from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useLoanProductStore } from '../../../store/loanProductStore';
import { useContractTemplateStore, type TemplateItem } from '../../../store/contractTemplateStore';
import { openCommonModal } from '../../../components/Modal/AlertModal';

const PAGE_SIZE = 6;

export function MapLoanProducts() {
  const navigate = useNavigate();
  const { products, fetchProducts } = useLoanProductStore();
  const {
    templates,
    activeTemplateId,
    setActiveTemplateId,
    updateTemplateMappings,
  } = useContractTemplateStore();

  // Get template ID from URL search params or active template from store or first template
  const urlTemplateId = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('templateId');
    }
    return null;
  }, []);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    if (urlTemplateId && templates.some((t) => String(t.id) === String(urlTemplateId))) {
      return String(urlTemplateId);
    }
    if (activeTemplateId && templates.some((t) => String(t.id) === String(activeTemplateId))) {
      return String(activeTemplateId);
    }
    return templates[0]?.id ? String(templates[0].id) : 'tmpl-1';
  });

  const currentTemplate: TemplateItem | undefined = useMemo(() => {
    return (
      templates.find((t) => String(t.id) === String(selectedTemplateId)) ||
      templates[0]
    );
  }, [templates, selectedTemplateId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [viewModalOpened, setViewModalOpened] = useState(false);

  // Sync selectedTemplateId whenever activeTemplateId or URL changes
  useEffect(() => {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const qId = searchParams?.get('templateId');
    const targetId = qId || activeTemplateId;
    if (targetId && templates.some((t) => String(t.id) === String(targetId))) {
      setSelectedTemplateId(String(targetId));
    }
  }, [activeTemplateId, templates]);

  // Sync selectedIds whenever template changes
  useEffect(() => {
    if (currentTemplate) {
      setSelectedIds(currentTemplate.mappedProductIds || []);
    }
  }, [currentTemplate]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filters = ['All', 'Personal', 'Vehicle', 'Business', 'Home', 'Education'];

  const getDisplayType = (category: string, name: string) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('personal')) return 'Personal';
    if (lowerName.includes('vehicle') || lowerName.includes('car')) return 'Vehicle';
    if (lowerName.includes('business')) return 'Business';
    if (lowerName.includes('home')) return 'Home';
    if (lowerName.includes('education')) return 'Education';
    return category || 'Loan';
  };

  const availableProducts = useMemo(() => {
    let filtered = products;
    if (activeFilter !== 'All') {
      filtered = filtered.filter((p) => getDisplayType(p.category, p.name) === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.id || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [products, activeFilter, searchQuery]);

  // Reset to page 1 whenever the filtered set changes
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

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.includes(p.id));
  }, [products, selectedIds]);

  const addProduct = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeProduct = (id: string) => {
    setSelectedIds((prev) => prev.filter((pid) => pid !== id));
  };

  const getCode = (product: { id: string; name: string }) => {
    const prefix = product.name.split(' ').map((w) => w[0]).join('').toUpperCase();
    return `${prefix}-00${product.id.replace(/\D/g, '') || '1'}`;
  };

  const handleBack = () => {
    navigate({ to: '/setup/contract-templates' });
  };

  const handleTemplateChange = (val: string | null) => {
    if (!val) return;
    setSelectedTemplateId(val);
    setActiveTemplateId(val);
  };

  const handleSubmit = () => {
    if (!currentTemplate) return;
    setIsSaving(true);
    updateTemplateMappings(String(currentTemplate.id), selectedIds);
    setIsSaving(false);

    openCommonModal({
      heading: 'Loan Products Mapped Successfully',
      subtitle: 'The contract template mapping has been saved.',
      body: `Template: ${currentTemplate.name}\n${selectedIds.length} loan product(s) mapped. This template is now assigned to the selected loan products.`,
      color: 'green',
      buttons: [
        {
          label: 'View Contract Templates',
          variant: 'default',
          onClick: () => {
            navigate({ to: '/setup/contract-templates' });
          },
        },
        {
          label: 'Done',
          color: 'green',
        },
      ],
    });
  };

  const templateOptions = useMemo(() => {
    return templates.map((t) => ({
      value: String(t.id),
      label: `${t.name} (v${t.version}) - ${t.bank || t.type}`,
    }));
  }, [templates]);

  return (
    <Box className="w-full px-6 pt-0 pb-2">
      {/* Page header */}
      <Box className="mb-2">
        <Text size="xl" fw={700} c="slate.9">
          Map Loan Products
        </Text>
        <Text size="sm" c="slate.5" className="mt-0.5">
          Select the loan products from the available list and map them to the selected contract template.
        </Text>
      </Box>

      {/* Contract Template Selector & Details Card */}
      <Paper
        radius="lg"
        p="sm"
        px="md"
        mb="sm"
        className="border border-slate-200 shadow-xs bg-white"
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          {/* Left: Template Selector Input with Icon and Label */}
          <Group gap="sm" align="center" style={{ flex: '1 1 360px', maxWidth: 520 }}>
            <Box
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--mantine-radius-md)',
                background:
                  'linear-gradient(135deg, var(--mantine-color-brand-0) 0%, var(--mantine-color-brand-1) 100%)',
                border: '1px solid var(--mantine-color-brand-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mantine-color-brand-7)',
                flexShrink: 0,
              }}
            >
              <IconFileText size={20} />
            </Box>
            <Box style={{ flex: 1, minWidth: 260 }}>
              <Group gap={6} align="center" mb={2}>
                <Text size="11px" fw={700} c="brand.7" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                  Select Contract Template
                </Text>
                <Badge size="xs" variant="light" color="brand" radius="sm">
                  {templates.length} Available
                </Badge>
              </Group>
              <Select
                size="xs"
                radius="md"
                data={templateOptions}
                value={String(currentTemplate?.id || '')}
                onChange={handleTemplateChange}
                placeholder="Choose template to map..."
                leftSection={<IconBuildingBank size={14} className="text-slate-400" />}
                searchable
                styles={{
                  input: {
                    fontWeight: 600,
                    fontSize: '13px',
                    backgroundColor: 'var(--mantine-color-slate-0)',
                    borderColor: 'var(--mantine-color-slate-2)',
                  },
                }}
              />
            </Box>
          </Group>

          {/* Right: Template Context Badges and View Details Button */}
          {currentTemplate && (
            <Group gap="xs" align="center" wrap="wrap">
              <Box
                px="sm"
                py={4}
                style={{
                  backgroundColor: 'var(--mantine-color-slate-0)',
                  border: '1px solid var(--mantine-color-slate-2)',
                  borderRadius: 8,
                }}
              >
                <Group gap={6} align="center">
                  <Avatar size={20} radius="sm" color="brand" variant="light">
                    <IconBuildingBank size={12} />
                  </Avatar>
                  <Text size="xs" fw={700} c="slate.8">
                    {currentTemplate.bank || 'Standard'}
                  </Text>
                  <Text size="10px" c="slate.5">
                    • v{currentTemplate.version}
                  </Text>
                </Group>
              </Box>

              <Badge variant="light" color="indigo" size="sm" radius="sm">
                {currentTemplate.type || 'Loan Agreement'}
              </Badge>

              <Badge
                variant="light"
                color={currentTemplate.status === 'Active' ? 'green' : 'gray'}
                size="sm"
                radius="sm"
                leftSection={
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor:
                        currentTemplate.status === 'Active'
                          ? 'var(--mantine-color-green-6)'
                          : 'var(--mantine-color-gray-5)',
                    }}
                  />
                }
              >
                {currentTemplate.status}
              </Badge>

              <Badge variant="outline" color="brand" size="sm" radius="sm">
                {selectedIds.length} Mapped
              </Badge>

              <Button
                variant="default"
                size="xs"
                radius="md"
                leftSection={<IconEye size={14} />}
                onClick={() => setViewModalOpened(true)}
              >
                View Details
              </Button>
            </Group>
          )}
        </Group>
      </Paper>

      {/* Body: Two-column layout */}
      <div className="flex gap-3 items-start">
        {/* Left Column: Available Loan Products */}
        <Paper className="flex-[1.3] border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <Box className="p-3 border-b border-slate-100">
            <Group gap="xs" mb="xs" wrap="nowrap">
              <ThemeIcon size={30} radius="xl" variant="light" color="brand">
                <IconStack2 size={16} />
              </ThemeIcon>
              <Box>
                <Text fw={600} size="sm" c="slate.9">
                  Available Loan Products
                </Text>
              </Box>
            </Group>

            <TextInput
              placeholder="Search loan products by name or code..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              mb="xs"
              radius="md"
              size="sm"
            />

            <Group gap={6} wrap="wrap">
              {filters.map((f) => (
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
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">
                Product Name
              </Text>
            </Box>
            <Box className="w-24">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">
                Loan Type
              </Text>
            </Box>
            <Box className="w-24 pl-2">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">
                Status
              </Text>
            </Box>
          </Box>

          {/* Products List */}
          <div className="px-2 py-1 bg-white">
            {paginatedProducts.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                No products found.
              </Text>
            ) : (
              <div className="flex flex-col">
                {paginatedProducts.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const type = getDisplayType(product.category, product.name);
                  const code = getCode(product);

                  return (
                    <Box
                      key={product.id}
                      className={`px-3 py-1.5 border-b border-slate-100 flex items-center transition-colors cursor-pointer ${
                        isSelected ? 'bg-brand-0' : 'hover:bg-slate-50'
                      }`}
                      onClick={() =>
                        isSelected ? removeProduct(product.id) : addProduct(product.id)
                      }
                    >
                      <Box style={{ width: 32 }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() =>
                            isSelected ? removeProduct(product.id) : addProduct(product.id)
                          }
                          color="brand"
                          radius="sm"
                          size="xs"
                        />
                      </Box>
                      <div className="flex-1 min-w-0 pr-4">
                        <Text size="sm" fw={600} c="slate.8" truncate>
                          {product.name}
                        </Text>
                        <Text size="xs" c="slate.5" truncate>
                          {code}
                        </Text>
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

        {/* Right Column: Products Using This Template */}
        <Paper className="flex-1 border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
          <Box className="p-3 border-b border-slate-100">
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon size={30} radius="xl" variant="light" color="brand">
                  <IconLink size={16} />
                </ThemeIcon>
                <Box>
                  <Text fw={600} size="sm" c="slate.9">
                    Products Using This Template
                  </Text>
                </Box>
              </Group>
              <Badge variant="light" color="brand" size="md" radius="sm">
                {selectedIds.length} {selectedIds.length === 1 ? 'Product' : 'Products'} Mapped
              </Badge>
            </Group>
          </Box>

          <Box className="px-4 py-1.5 border-b border-slate-100 flex items-center bg-slate-0">
            <Box className="flex-1 min-w-0 pr-4">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">
                Product Name
              </Text>
            </Box>
            <Box className="w-24">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">
                Loan Type
              </Text>
            </Box>
            <Box className="w-24 pl-2">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">
                Status
              </Text>
            </Box>
            <Box className="w-16 flex justify-end">
              <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider">
                Action
              </Text>
            </Box>
          </Box>

          <div className="px-2 py-1 bg-white flex-1 min-h-[280px]">
            <div className="flex flex-col">
              {selectedProducts.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No products mapped yet. Check products from the left to map them.
                </Text>
              ) : (
                selectedProducts.map((product) => {
                  const type = getDisplayType(product.category, product.name);
                  const code = getCode(product);

                  return (
                    <Box
                      key={product.id}
                      className="px-3 py-1.5 border-b border-slate-100 flex items-center transition-colors hover:bg-slate-50"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <Text size="sm" fw={600} c="slate.8" truncate>
                          {product.name}
                        </Text>
                        <Text size="xs" c="slate.5" truncate>
                          {code}
                        </Text>
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
                          variant="subtle"
                          color="red"
                          onClick={() => removeProduct(product.id)}
                          size="sm"
                          title="Unmap product"
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
      <Paper
        radius="xl"
        p="xs"
        px="md"
        mt="sm"
        className="border border-slate-200 shadow-sm bg-white"
      >
        <Group justify="space-between">
          <Button variant="default" size="sm" radius="xl" onClick={handleBack}>
            Back to Templates
          </Button>
          <Group>
            <Button variant="default" size="sm" radius="xl" onClick={handleBack}>
              Cancel
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={handleSubmit}
              loading={isSaving}
              rightSection={<IconArrowRight size={14} />}
            >
              Save Mapping
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Template Details Modal */}
      {currentTemplate && (
        <Modal
          opened={viewModalOpened}
          onClose={() => setViewModalOpened(false)}
          title={
            <Group gap="sm" align="center">
              <ThemeIcon size={38} radius="md" variant="light" color="brand">
                <IconFileText size={20} />
              </ThemeIcon>
              <Box>
                <Text fw={700} size="md" c="slate.9">
                  Contract Template Details
                </Text>
                <Text size="xs" c="slate.5">
                  Complete overview, metadata, and mapped loan products
                </Text>
              </Box>
            </Group>
          }
          size={740}
          radius="lg"
          padding="lg"
        >
          <Stack gap="md">
            {/* Template Hero Banner */}
            <Paper
              p="md"
              radius="md"
              style={{
                background:
                  'linear-gradient(135deg, rgba(238, 242, 255, 0.7) 0%, rgba(245, 243, 255, 0.5) 100%)',
                border: '1px solid var(--mantine-color-brand-2)',
              }}
            >
              <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                <Box>
                  <Group gap="xs" mb={4}>
                    <Badge variant="filled" color="brand" size="sm" radius="sm">
                      v{currentTemplate.version}
                    </Badge>
                    <Badge
                      variant="light"
                      color={currentTemplate.status === 'Active' ? 'green' : 'gray'}
                      size="sm"
                      radius="sm"
                      leftSection={
                        <Box
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor:
                              currentTemplate.status === 'Active'
                                ? 'var(--mantine-color-green-6)'
                                : 'var(--mantine-color-gray-5)',
                          }}
                        />
                      }
                    >
                      {currentTemplate.status}
                    </Badge>
                    <Badge variant="dot" color="indigo" size="sm">
                      {currentTemplate.type || 'Loan Agreement'}
                    </Badge>
                  </Group>
                  <Text size="lg" fw={800} c="slate.9">
                    {currentTemplate.name}
                  </Text>
                  <Group gap="xs" mt={4} c="slate.6">
                    <IconBuildingBank size={15} />
                    <Text size="sm" fw={600} c="slate.7">
                      {currentTemplate.bank || 'HDFC Bank'}
                    </Text>
                    <Text size="xs" c="slate.4">
                      •
                    </Text>
                    <Text size="xs" c="slate.5">
                      Template ID: {currentTemplate.id}
                    </Text>
                  </Group>
                </Box>

                <Box ta={{ base: 'left', sm: 'right' }}>
                  <Text size="xs" c="slate.5" fw={600} tt="uppercase">
                    Total Mapped
                  </Text>
                  <Text size="xl" fw={800} c="brand.7">
                    {selectedProducts.length} {selectedProducts.length === 1 ? 'Product' : 'Products'}
                  </Text>
                </Box>
              </Group>
            </Paper>

            {/* Key Information 3-Column Grid */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <Paper p="sm" withBorder radius="md" bg="white">
                <Group gap="xs" mb={4}>
                  <ThemeIcon size={24} radius="sm" variant="light" color="indigo">
                    <IconFileText size={14} />
                  </ThemeIcon>
                  <Text size="11px" fw={700} c="slate.5" tt="uppercase">
                    Contract Type
                  </Text>
                </Group>
                <Text size="sm" fw={700} c="slate.8">
                  {currentTemplate.type || 'Loan Agreement'}
                </Text>
              </Paper>

              <Paper p="sm" withBorder radius="md" bg="white">
                <Group gap="xs" mb={4}>
                  <ThemeIcon size={24} radius="sm" variant="light" color="blue">
                    <IconBuildingBank size={14} />
                  </ThemeIcon>
                  <Text size="11px" fw={700} c="slate.5" tt="uppercase">
                    Bank / Institution
                  </Text>
                </Group>
                <Text size="sm" fw={700} c="slate.8">
                  {currentTemplate.bank || '—'}
                </Text>
              </Paper>

              <Paper p="sm" withBorder radius="md" bg="white">
                <Group gap="xs" mb={4}>
                  <ThemeIcon size={24} radius="sm" variant="light" color="teal">
                    <IconCalendar size={14} />
                  </ThemeIcon>
                  <Text size="11px" fw={700} c="slate.5" tt="uppercase">
                    Effective Date
                  </Text>
                </Group>
                <Text size="sm" fw={700} c="slate.8">
                  {currentTemplate.effectiveDate || currentTemplate.effectiveFrom || '—'}
                </Text>
              </Paper>

              <Paper p="sm" withBorder radius="md" bg="white">
                <Group gap="xs" mb={4}>
                  <ThemeIcon size={24} radius="sm" variant="light" color="grape">
                    <IconClock size={14} />
                  </ThemeIcon>
                  <Text size="11px" fw={700} c="slate.5" tt="uppercase">
                    Uploaded Date
                  </Text>
                </Group>
                <Text size="sm" fw={700} c="slate.8">
                  {currentTemplate.uploadDate || '—'}
                  {currentTemplate.uploadTime ? ` (${currentTemplate.uploadTime})` : ''}
                </Text>
              </Paper>

              <Paper p="sm" withBorder radius="md" bg="white">
                <Group gap="xs" mb={4}>
                  <ThemeIcon size={24} radius="sm" variant="light" color="orange">
                    <IconStack2 size={14} />
                  </ThemeIcon>
                  <Text size="11px" fw={700} c="slate.5" tt="uppercase">
                    Base Loan Product
                  </Text>
                </Group>
                <Text size="sm" fw={700} c="slate.8">
                  {currentTemplate.product || 'Standard'}
                </Text>
              </Paper>

              <Paper p="sm" withBorder radius="md" bg="white">
                <Group gap="xs" mb={4}>
                  <ThemeIcon size={24} radius="sm" variant="light" color="green">
                    <IconCheck size={14} />
                  </ThemeIcon>
                  <Text size="11px" fw={700} c="slate.5" tt="uppercase">
                    Status
                  </Text>
                </Group>
                <Badge
                  variant="light"
                  color={currentTemplate.status === 'Active' ? 'green' : 'gray'}
                  size="sm"
                >
                  {currentTemplate.status}
                </Badge>
              </Paper>
            </SimpleGrid>

            {/* Description / Notes if available */}
            {currentTemplate.description && (
              <Paper p="sm" px="md" radius="md" bg="slate.0" withBorder>
                <Text size="11px" fw={700} c="slate.5" tt="uppercase" mb={4}>
                  Description / Notes
                </Text>
                <Text size="xs" c="slate.7" style={{ lineHeight: 1.5 }}>
                  {currentTemplate.description}
                </Text>
              </Paper>
            )}

            {/* Mapped Loan Products Preview Card */}
            <Paper p="md" withBorder radius="md" bg="white">
              <Group justify="space-between" align="center" mb="xs">
                <Group gap="xs">
                  <ThemeIcon size={24} radius="sm" variant="light" color="brand">
                    <IconLink size={14} />
                  </ThemeIcon>
                  <Text size="xs" fw={700} c="slate.8" tt="uppercase" style={{ letterSpacing: '0.4px' }}>
                    Mapped Loan Products ({selectedProducts.length})
                  </Text>
                </Group>
                <Text size="xs" c="slate.5">
                  Products currently assigned to this template
                </Text>
              </Group>

              {selectedProducts.length === 0 ? (
                <Box py="lg" ta="center" bg="slate.0" style={{ borderRadius: 8 }}>
                  <Text size="xs" c="slate.5">
                    No products currently mapped. Check products from the available list on this page to map them.
                  </Text>
                </Box>
              ) : (
                <Group gap={8} wrap="wrap">
                  {selectedProducts.map((p) => (
                    <Badge
                      key={p.id}
                      variant="light"
                      color="brand"
                      size="md"
                      radius="md"
                      style={{ height: 'auto', padding: '6px 12px' }}
                    >
                      <Group gap={6}>
                        <Text size="xs" fw={700}>
                          {p.name}
                        </Text>
                        <Text size="10px" c="dimmed">
                          ({getCode(p)})
                        </Text>
                      </Group>
                    </Badge>
                  ))}
                </Group>
              )}
            </Paper>

            {/* Modal Footer Actions */}
            <Divider my={2} />
            <Group justify="space-between" align="center">
              <Text size="xs" c="slate.5">
                Viewing template details for <strong className="text-slate-700">{currentTemplate.name}</strong>
              </Text>
              <Group gap="xs">
                <Button
                  variant="default"
                  size="sm"
                  radius="md"
                  onClick={() => setViewModalOpened(false)}
                >
                  Close
                </Button>
                <Button
                  variant="filled"
                  color="brand"
                  size="sm"
                  radius="md"
                  leftSection={<IconLink size={15} />}
                  onClick={() => setViewModalOpened(false)}
                >
                  Continue Mapping
                </Button>
              </Group>
            </Group>
          </Stack>
        </Modal>
      )}
    </Box>
  );
}