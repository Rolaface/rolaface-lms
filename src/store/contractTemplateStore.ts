import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TemplateItem {
  id: string;
  bank: string;
  color: string;
  product: string;
  type: string;
  name: string;
  version: string;
  uploadDate: string;
  uploadTime: string;
  effectiveDate: string;
  effectiveTo?: string;
  status: 'Active' | 'Inactive' | 'Draft';
  description?: string;
  mappedProductIds: string[];
  fileUrl?: string;
  placeholders?: string[];

  // Compatibility aliases
  templateName?: string;
  templateType?: string;
  templateVersion?: string;
  effectiveFrom?: string;
}

export type ContractTemplate = TemplateItem;

export const BANK_OPTIONS = [
  'HDFC Bank',
  'ICICI Bank',
  'SBI Bank',
  'Axis Bank',
  'Bajaj Finserv',
  'Kotak Mahindra Bank',
  'Bank of Baroda',
  'Punjab National Bank',
  'IndusInd Bank',
];

export const BANK_COLORS: Record<string, string> = {
  'HDFC Bank': 'red',
  'ICICI Bank': 'orange',
  'SBI Bank': 'blue',
  'Axis Bank': 'pink',
  'Bajaj Finserv': 'cyan',
  'Kotak Mahindra Bank': 'grape',
  'Bank of Baroda': 'orange',
  'Punjab National Bank': 'yellow',
  'IndusInd Bank': 'teal',
};

export const INITIAL_TEMPLATES: TemplateItem[] = [
  {
    id: 'tmpl-1',
    bank: 'HDFC Bank',
    color: 'red',
    product: 'Business Loan',
    type: 'Loan Agreement',
    name: 'HDFC Business Loan Agreement',
    version: '2.0',
    uploadDate: '01-May-2024',
    uploadTime: '10:30 AM',
    effectiveDate: '01-May-2024',
    status: 'Active',
    description: 'Standard commercial & business lending agreement for corporate clients.',
    mappedProductIds: [],
    templateName: 'HDFC Business Loan Agreement',
    templateType: 'Loan Agreement',
    templateVersion: '2.0',
    effectiveFrom: '2024-05-01',
  },
  {
    id: 'tmpl-2',
    bank: 'HDFC Bank',
    color: 'red',
    product: 'Education Loan',
    type: 'Sanction Letter',
    name: 'HDFC Education Sanction Letter',
    version: '1.0',
    uploadDate: '15-Apr-2024',
    uploadTime: '02:15 PM',
    effectiveDate: '15-Apr-2024',
    status: 'Active',
    description: 'Formal sanction letter for higher education loan applicants.',
    mappedProductIds: [],
    templateName: 'HDFC Education Sanction Letter',
    templateType: 'Sanction Letter',
    templateVersion: '1.0',
    effectiveFrom: '2024-04-15',
  },
  {
    id: 'tmpl-3',
    bank: 'ICICI Bank',
    color: 'orange',
    product: 'Personal Loan',
    type: 'Loan Agreement',
    name: 'ICICI Personal Loan Agreement',
    version: '1.0',
    uploadDate: '10-Apr-2024',
    uploadTime: '11:45 AM',
    effectiveDate: '10-Apr-2024',
    status: 'Inactive',
    description: 'Unsecured personal loan borrower contract template.',
    mappedProductIds: [],
    templateName: 'ICICI Personal Loan Agreement',
    templateType: 'Loan Agreement',
    templateVersion: '1.0',
    effectiveFrom: '2024-04-10',
  },
  {
    id: 'tmpl-4',
    bank: 'SBI Bank',
    color: 'blue',
    product: 'Home Loan',
    type: 'Loan Agreement',
    name: 'SBI Home Loan Agreement',
    version: '1.1',
    uploadDate: '20-Mar-2024',
    uploadTime: '09:05 AM',
    effectiveDate: '20-Mar-2024',
    status: 'Active',
    description: 'Mortgage loan agreement for residential housing finance.',
    mappedProductIds: [],
    templateName: 'SBI Home Loan Agreement',
    templateType: 'Loan Agreement',
    templateVersion: '1.1',
    effectiveFrom: '2024-03-20',
  },
];

interface ContractTemplateState {
  templates: TemplateItem[];
  activeTemplateId: string | null;
  activeTemplate: TemplateItem | null;
  setActiveTemplate: (template: TemplateItem) => void;
  setActiveTemplateId: (id: string) => void;
  clearActiveTemplate: () => void;
  addTemplate: (template: TemplateItem) => void;
  updateTemplate: (id: string, updates: Partial<TemplateItem>) => void;
  deleteTemplate: (id: string) => void;
  toggleTemplateStatus: (id: string) => void;
  updateTemplateMappings: (templateId: string, productIds: string[]) => void;
  resetToDefaults: () => void;
}

export const useContractTemplateStore = create<ContractTemplateState>()(
  persist(
    (set, get) => ({
      templates: INITIAL_TEMPLATES,
      activeTemplateId: INITIAL_TEMPLATES[0].id,
      activeTemplate: INITIAL_TEMPLATES[0],

      setActiveTemplate: (template) =>
        set({
          activeTemplate: template,
          activeTemplateId: String(template.id),
        }),

      setActiveTemplateId: (id) => {
        const found = get().templates.find((t) => String(t.id) === String(id)) || null;
        set({ activeTemplateId: id, activeTemplate: found });
      },

      clearActiveTemplate: () =>
        set({ activeTemplate: null, activeTemplateId: null }),

      addTemplate: (template) =>
        set((state) => ({
          templates: [template, ...state.templates],
          activeTemplate: template,
          activeTemplateId: String(template.id),
        })),

      updateTemplate: (id, updates) =>
        set((state) => {
          const updatedTemplates = state.templates.map((t) =>
            String(t.id) === String(id)
              ? {
                  ...t,
                  ...updates,
                  templateName: updates.name ?? t.templateName ?? t.name,
                  templateType: updates.type ?? t.templateType ?? t.type,
                  templateVersion: updates.version ?? t.templateVersion ?? t.version,
                  effectiveFrom: updates.effectiveDate ?? t.effectiveFrom ?? t.effectiveDate,
                }
              : t
          );
          const updatedActive =
            state.activeTemplate && String(state.activeTemplate.id) === String(id)
              ? {
                  ...state.activeTemplate,
                  ...updates,
                  templateName: updates.name ?? state.activeTemplate.templateName ?? state.activeTemplate.name,
                  templateType: updates.type ?? state.activeTemplate.templateType ?? state.activeTemplate.type,
                  templateVersion: updates.version ?? state.activeTemplate.templateVersion ?? state.activeTemplate.version,
                  effectiveFrom: updates.effectiveDate ?? state.activeTemplate.effectiveFrom ?? state.activeTemplate.effectiveDate,
                }
              : state.activeTemplate;
          return { templates: updatedTemplates, activeTemplate: updatedActive };
        }),

      deleteTemplate: (id) =>
        set((state) => {
          const remaining = state.templates.filter((t) => String(t.id) !== String(id));
          return {
            templates: remaining,
            activeTemplate:
              state.activeTemplate && String(state.activeTemplate.id) === String(id)
                ? remaining[0] || null
                : state.activeTemplate,
            activeTemplateId:
              state.activeTemplateId && String(state.activeTemplateId) === String(id)
                ? (remaining[0]?.id ? String(remaining[0].id) : null)
                : state.activeTemplateId,
          };
        }),

      toggleTemplateStatus: (id) =>
        set((state) => {
          const updatedTemplates = state.templates.map((t) =>
            String(t.id) === String(id)
              ? {
                  ...t,
                  status: (t.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
                }
              : t
          );
          const updatedActive =
            state.activeTemplate && String(state.activeTemplate.id) === String(id)
              ? {
                  ...state.activeTemplate,
                  status: (state.activeTemplate.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
                }
              : state.activeTemplate;
          return { templates: updatedTemplates, activeTemplate: updatedActive };
        }),

      updateTemplateMappings: (templateId, productIds) =>
        set((state) => {
          const updatedTemplates = state.templates.map((t) =>
            String(t.id) === String(templateId)
              ? { ...t, mappedProductIds: productIds }
              : t
          );
          const updatedActive =
            state.activeTemplate && String(state.activeTemplate.id) === String(templateId)
              ? { ...state.activeTemplate, mappedProductIds: productIds }
              : state.activeTemplate;
          return { templates: updatedTemplates, activeTemplate: updatedActive };
        }),

      resetToDefaults: () =>
        set({
          templates: INITIAL_TEMPLATES,
          activeTemplate: INITIAL_TEMPLATES[0],
          activeTemplateId: INITIAL_TEMPLATES[0].id,
        }),
    }),
    {
      name: 'lms-contract-templates-storage',
    }
  )
);
