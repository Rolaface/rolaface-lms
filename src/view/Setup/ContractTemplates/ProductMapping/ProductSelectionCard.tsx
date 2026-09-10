import { Paper, Box, Text, Badge, TextInput, Checkbox, Group, ScrollArea, Button } from '@mantine/core';
import { IconLink, IconSearch, IconX, IconPlus, IconInfoCircle } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import type { LoanProduct } from '../../../../types/loanProduct';

interface ProductSelectionCardProps {
  availableProducts: LoanProduct[];
  selectedProductIds: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleProduct: (productId: string) => void;
  onRemoveProduct: (productId: string) => void;
  isLoading?: boolean;
}

export function ProductSelectionCard({
  availableProducts,
  selectedProductIds,
  searchQuery,
  onSearchChange,
  onToggleProduct,
  onRemoveProduct,
  isLoading
}: ProductSelectionCardProps) {
  const selectedProducts = availableProducts.filter(p => selectedProductIds.includes(p.id));

  return (
    <Paper className="p-6 border border-slate-2 rounded-lg bg-white">
      <Group mb="xs">
        <Box className="p-2 rounded-md bg-gradient-to-br from-brand-7 to-brand-5" style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)' }}>
          <IconLink size={24} color="white" />
        </Box>
        <Text size="md" fw={700}>Product Mapping</Text>
      </Group>
      
      <Text size="sm" c="slate.5" mb="xl">
        Select one or more loan products to make this contract template available for contract generation.
      </Text>

      {selectedProductIds.length > 0 && (
        <Box mb="xl">
          <Text size="sm" fw={600} c="slate.7" mb="sm">Selected Products</Text>
          <Group gap="sm">
            {selectedProducts.map(product => (
              <Badge
                key={product.id}
                variant="light"
                color="brand"
                size="lg"
                className="rounded-full cursor-default"
                rightSection={
                  <IconX 
                    size={12} 
                    style={{ cursor: 'pointer', marginLeft: '4px' }} 
                    onClick={() => onRemoveProduct(product.id)}
                  />
                }
              >
                {product.name}
              </Badge>
            ))}
          </Group>
        </Box>
      )}

      <Box mb="xl">
        <Text size="sm" fw={600} c="slate.7" mb="sm">Available Products</Text>
        <TextInput
          leftSection={<IconSearch size={16} />}
          placeholder="Search products..."
          size="sm"
          radius="md"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          mb="md"
        />

        <ScrollArea h={340} type="auto" offsetScrollbars>
          {isLoading ? (
            <Text size="sm" c="slate.5" ta="center" py="md">Loading products...</Text>
          ) : availableProducts.length === 0 ? (
            <Text size="sm" c="slate.5" ta="center" py="md">No products match your search.</Text>
          ) : (
            <Box>
              {availableProducts.map(product => (
                <Group 
                  key={product.id} 
                  justify="space-between" 
                  className="hover:bg-slate-0 cursor-pointer"
                  style={{ padding: '10px 12px', borderBottom: '1px solid var(--mantine-color-slate-1)' }}
                  onClick={() => onToggleProduct(product.id)}
                >
                  <Checkbox
                    label={product.name}
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => {}}
                    styles={{ body: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                  />
                  <Badge variant="outline" color="slate" size="xs">
                    {product.category}
                  </Badge>
                </Group>
              ))}
            </Box>
          )}
        </ScrollArea>
        
        <Box mt="sm">
          <Button 
            component={Link} 
            to="/setup/product" 
            variant="subtle" 
            size="sm"
            leftSection={<IconPlus size={16} />}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      <Box className="bg-brand-0 border border-brand-1 rounded-md p-3" style={{ backgroundColor: 'var(--mantine-color-brand-0)', border: '1px solid var(--mantine-color-brand-1)', borderRadius: '6px', padding: '12px' }}>
        <Group gap="sm" wrap="nowrap">
          <IconInfoCircle size={20} color="var(--mantine-color-brand-6)" style={{ flexShrink: 0 }} />
          <Text size="sm" c="brand.7">
            This template can be reused across all selected loan products.
          </Text>
        </Group>
      </Box>
    </Paper>
  );
}
