import { useEffect, useRef, useState } from 'react';
import {
  createCollectionOrder,
  getCollectionOrderById,
  updateCollectionOrder,
} from '../../api/collectionOrderApi';
import type { CollectionOrderComponent, CollectionOrderListItem } from '../../types/collectionOrder';
import { notifySuccess, notifyError, notifyValidationError } from '../../utils/notify';

export interface ComponentItem {
  id: string;
  name: string;
}

const DEFAULT_COMPONENTS: ComponentItem[] = [
  { id: '1', name: 'Principal' },
  { id: '2', name: 'Interest' },
  { id: '3', name: 'Penalty' },
  { id: '4', name: 'Charges' },
];

interface UseCollectionOrderFormArgs {
  opened: boolean;
  mode: 'add' | 'edit' | 'view';
  data: CollectionOrderListItem | null;
  onSaved: () => void;
  onClose: () => void;
}

export function useCollectionOrderForm({ opened, mode, data, onSaved, onClose }: UseCollectionOrderFormArgs) {
  const [sequenceName, setSequenceName] = useState('');
  const [components, setComponents] = useState<ComponentItem[]>(DEFAULT_COMPONENTS);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const requestId = useRef(0);

  const isNameEditable = mode === 'add';

  const resetForm = () => {
    setSequenceName('');
    setComponents(DEFAULT_COMPONENTS);
  };

  useEffect(() => {
    if (mode === 'add') {
      resetForm();
      return;
    }

    if (!data?.name) return;

    setSequenceName(data.title);
    setComponents(data.components.map((c, index) => ({ id: String(index + 1), name: c.demand_type })));

    const currentRequest = ++requestId.current;
    setLoadingDetail(true);

    getCollectionOrderById(data.name)
      .then((res) => {
        if (currentRequest !== requestId.current) return;
        setSequenceName(res.data.title);
        setComponents(
          res.data.components
            .slice()
            .sort((a, b) => a.idx - b.idx)
            .map((c) => ({ id: c.name, name: c.demand_type }))
        );
      })
      .catch((err) => {
        if (currentRequest !== requestId.current) return;
        notifyError(err, 'Unable to refresh sequence details');
      })
      .finally(() => {
        if (currentRequest !== requestId.current) return;
        setLoadingDetail(false);
      });
  }, [mode, data]);

  const reorder = (from: number, to: number) => {
    setComponents((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const handleSave = async () => {
    // Client-side check — never reached the backend, so this is
    // necessarily frontend copy, not a "real backend message".
    if (isNameEditable && !sequenceName.trim()) {
      notifyValidationError('Please enter a collection order name.', 'Name required');
      return;
    }

    const orderedComponents: CollectionOrderComponent[] = components.map((c, index) => ({
      idx: index + 1,
      demand_type: c.name,
    }));

    setIsSaving(true);
    try {
      if (mode === 'edit' && data?.name) {
        // Backend's update endpoint only accepts { name, components } —
        // the sequence name itself cannot be changed after creation.
        await updateCollectionOrder({ name: data.name, components: orderedComponents });
        notifySuccess('Collection sequence updated successfully.');
      } else {
        await createCollectionOrder({ title: sequenceName.trim(), components: orderedComponents });
        notifySuccess('Collection sequence saved successfully.');
      }
      onSaved();
      onClose();
    } catch (err) {
      notifyError(err, mode === 'edit' ? 'Unable to update sequence' : 'Unable to save sequence');
    } finally {
      setIsSaving(false);
    }
  };

  return { sequenceName, setSequenceName, components, reorder, loadingDetail, isSaving, handleSave, isNameEditable, resetForm };
}