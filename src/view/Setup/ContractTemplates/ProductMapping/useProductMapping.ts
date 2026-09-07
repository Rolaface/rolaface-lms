import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useContractTemplateStore } from '../../../../store/contractTemplateStore';
import { useLoanProductStore } from '../../../../store/loanProductStore';
import { saveProductMapping } from '../../../../api/contractTemplateService';

export function useProductMapping(templateId?: string) {
  const navigate = useNavigate();
  const { activeTemplate, updateTemplateMappings } = useContractTemplateStore();
  const { products, isLoading: productsLoading, fetchProducts } = useLoanProductStore();
  
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize with existing mappings when template loads
  useEffect(() => {
    if (activeTemplate?.mappedProductIds) {
      setSelectedProductIds([...activeTemplate.mappedProductIds]);
    }
  }, [activeTemplate]);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const toggleProduct = useCallback((productId: string) => {
    setValidationError(null);
    setSaveSuccess(false);
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setValidationError(null);
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedProductIds.length === 0) {
      setValidationError('Please select at least one loan product before saving.');
      return;
    }
    if (!activeTemplate) {
      setValidationError('No active template found.');
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    try {
      await saveProductMapping({
        templateId: activeTemplate.id,
        productIds: selectedProductIds,
      });
      updateTemplateMappings(activeTemplate.id, selectedProductIds);
      setSaveSuccess(true);
    } catch (error) {
      setValidationError('Failed to save product mapping. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedProductIds, activeTemplate, updateTemplateMappings]);

  const handleCancel = useCallback(() => {
    navigate({ to: '/setup/contract-templates' });
  }, [navigate]);

  return {
    activeTemplate,
    products,
    filteredProducts,
    selectedProductIds,
    searchQuery,
    setSearchQuery,
    toggleProduct,
    removeProduct,
    handleSave,
    handleCancel,
    isSaving,
    productsLoading,
    validationError,
    saveSuccess,
  };
}
