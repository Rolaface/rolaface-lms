import { create } from 'zustand';
import type { ContractTemplate } from '../types/contractTemplate';

interface ContractTemplateState {
  templates: ContractTemplate[];
  activeTemplate: ContractTemplate | null;
  setActiveTemplate: (template: ContractTemplate) => void;
  clearActiveTemplate: () => void;
  updateTemplateMappings: (templateId: string, productIds: string[]) => void;
}

// Mock template that represents a freshly created template from the wizard
const mockCreatedTemplate: ContractTemplate = {
  id: 'tmpl-001',
  templateName: 'Standard Personal Loan Agreement',
  templateType: 'Loan Agreement',
  templateVersion: '1.0',
  status: 'Active',
  effectiveFrom: '2026-09-03',
  effectiveTo: '2030-12-31',
  description: 'Standard personal loan agreement template for retail banking.',
  mappedProductIds: [],
  createdAt: '2026-09-03T11:45:00Z',
  updatedAt: '2026-09-03T11:45:00Z',
};

export const useContractTemplateStore = create<ContractTemplateState>((set) => ({
  templates: [mockCreatedTemplate],
  activeTemplate: mockCreatedTemplate,

  setActiveTemplate: (template) => set({ activeTemplate: template }),

  clearActiveTemplate: () => set({ activeTemplate: null }),

  updateTemplateMappings: (templateId, productIds) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === templateId ? { ...t, mappedProductIds: productIds, updatedAt: new Date().toISOString() } : t
      ),
      activeTemplate:
        state.activeTemplate?.id === templateId
          ? { ...state.activeTemplate, mappedProductIds: productIds, updatedAt: new Date().toISOString() }
          : state.activeTemplate,
    })),
}));
