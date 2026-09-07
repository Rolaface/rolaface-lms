import { useState, useMemo } from 'react';
import { Box, Text, Button, Paper, Group, TextInput, Checkbox, Badge, ScrollArea, ActionIcon } from '@mantine/core';
import { IconSearch, IconX, IconGripVertical, IconInfoCircle, IconArrowRight } from '@tabler/icons-react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useContractTemplateStore } from '../../../../store/contractTemplateStore';
import { useLoanProductStore } from '../../../../store/loanProductStore';
import type { LoanProduct } from '../../../../types/loanProduct';

export function ProductMappingPage() {
  const { templateId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { activeTemplate } = useContractTemplateStore();
  const { products } = useLoanProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Use local state for selection to avoid saving until "Save & Continue" is clicked
  const [selectedIds, setSelectedIds] = useState<string[]>(activeTemplate?.mappedProductIds || []);

  const templateName = activeTemplate?.templateName || 'Standard Personal Loan Agreement';
  const templateVersion = activeTemplate?.templateVersion || '1.0';

  const filters = ['All', 'Personal', 'Vehicle', 'Business', 'Home', 'Education'];

  // Filter available products
  const availableProducts = useMemo(() => {
    let filtered = products;
    if (activeFilter !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase().includes(activeFilter.toLowerCase()) || p.name.toLowerCase().includes(activeFilter.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return filtered;
  }, [products, activeFilter, searchQuery]);

  // Group by category
  const groupedProducts = useMemo(() => {
    return availableProducts.reduce((acc, product) => {
      const category = product.category.toUpperCase();
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, LoanProduct[]>);
  }, [availableProducts]);

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  return (
    <Box className="max-w-[1200px] w-full">
      {/* Header */}
      <Box className="mb-6">
        <Text size="xl" fw={700} c="slate.9" className="text-2xl">
          Product Mapping
        </Text>
        <Text size="sm" c="slate.5" className="mt-1">
          Choose which loan products can use <Text span fw={600} c="slate.8">{templateName}</Text> - v{templateVersion}
        </Text>
      </Box>

      <div className="flex gap-6 items-start h-[600px]">
        {/* Left Column: Available Products */}
        <Paper className="flex-1 flex flex-col h-full border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <Box className="p-5 border-b border-slate-100">
            <Group gap="xs" mb="xs">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-brand-6 text-white text-sm font-bold">1</div>
              <Text fw={600} size="md">Available Products</Text>
            </Group>
            <Text size="sm" c="slate.5" mb="md">
              Browse and select products to map to this template.
            </Text>
            
            <TextInput
              placeholder="Search products..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              mb="md"
              radius="md"
            />

            <ScrollArea type="never">
              <Group gap={8} wrap="nowrap" pb={4}>
                {filters.map(f => (
                  <Button
                    key={f}
                    variant={activeFilter === f ? 'light' : 'subtle'}
                    color={activeFilter === f ? 'brand' : 'gray'}
                    size="xs"
                    radius="xl"
                    onClick={() => setActiveFilter(f)}
                    className={activeFilter !== f ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200' : ''}
                    style={{ fontWeight: 500 }}
                  >
                    {f}
                  </Button>
                ))}
              </Group>
            </ScrollArea>
          </Box>

          <ScrollArea className="flex-1 p-5 pt-2 bg-slate-50/30">
            {Object.entries(groupedProducts).length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">No products found.</Text>
            ) : (
              Object.entries(groupedProducts).map(([category, items]) => (
                <Box key={category} mb="xl">
                  <Text size="xs" fw={700} c="slate.4" className="uppercase tracking-wider mb-3">
                    {category} LOANS
                  </Text>
                  <div className="flex flex-col gap-2">
                    {items.map(product => (
                      <Paper key={product.id} className="p-3 border border-slate-200 hover:border-brand-3 transition-colors bg-white flex items-center justify-between cursor-pointer" onClick={() => toggleProduct(product.id)}>
                        <Group gap="sm">
                          <Checkbox
                            checked={selectedIds.includes(product.id)}
                            onChange={() => {}} // handled by parent onClick
                            color="brand"
                            size="md"
                            styles={{ body: { pointerEvents: 'none' } }}
                          />
                          <div>
                            <Text size="sm" fw={600} c="slate.8">{product.name}</Text>
                            <Text size="xs" c="slate.5">{product.id} · Secured</Text>
                          </div>
                        </Group>
                        <Badge color={product.status === 'Active' ? 'green' : 'orange'} variant="light" size="sm">
                          {product.status}
                        </Badge>
                      </Paper>
                    ))}
                  </div>
                </Box>
              ))
            )}
          </ScrollArea>
          
          <Box className="p-4 border-t border-slate-100 bg-white">
            <Button variant="light" fullWidth radius="md" style={{ borderStyle: 'dashed', borderWidth: 1 }}>
              + Add New Product
            </Button>
          </Box>
        </Paper>

        {/* Right Column: Selected Products */}
        <Paper className="flex-1 h-full flex flex-col border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <Box className="p-5 border-b border-slate-100">
            <Group gap="xs" mb="xs">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-brand-6 text-white text-sm font-bold">2</div>
              <Text fw={600} size="md">Selected Products</Text>
            </Group>
            <Text size="sm" c="slate.5">
              These products will use this contract template.
            </Text>
          </Box>

          <ScrollArea className="flex-1 p-5 bg-slate-50/30">
            <Text size="sm" fw={600} c="slate.7" mb="md">
              {selectedIds.length} products mapped
            </Text>

            <div className="flex flex-col gap-3 mb-6">
              {selectedProducts.map(product => (
                <Paper key={product.id} className="p-3 border border-slate-200 bg-white flex items-center gap-3 shadow-sm">
                  <IconGripVertical size={16} color="var(--mantine-color-slate-3)" className="cursor-grab" />
                  <div className="flex-1">
                    <Text size="sm" fw={600} c="slate.8">{product.name}</Text>
                    <Text size="xs" c="slate.5">Vehicle Loan · {product.id} · Secured</Text>
                  </div>
                  <ActionIcon variant="subtle" color="gray" onClick={() => toggleProduct(product.id)}>
                    <IconX size={16} />
                  </ActionIcon>
                </Paper>
              ))}
            </div>

            {selectedIds.length > 0 && (
              <Box className="bg-brand-0 border border-brand-1 rounded-md p-4 flex gap-3">
                <IconInfoCircle size={20} color="var(--mantine-color-brand-5)" className="shrink-0 mt-0.5" />
                <Text size="sm" c="brand.8" lh={1.4}>
                  This template can be reused across all mapped products. Removing a product here won't delete it — it only unlinks it from this template.
                </Text>
              </Box>
            )}
          </ScrollArea>
        </Paper>
      </div>

      {/* Footer Actions */}
      <Box className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
        <Button variant="default" size="md" onClick={() => navigate({ to: '/setup/contract-templates' })}>
          Back
        </Button>
        <Button variant="default" size="md">
          Save as Draft
        </Button>
        <Button 
          size="md" 
          rightSection={<IconArrowRight size={16} />}
          onClick={() => navigate({ to: '/setup/contract-templates' })}
        >
          Save & Continue
        </Button>
      </Box>
    </Box>
  );
}
