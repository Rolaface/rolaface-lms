import type { ComponentType } from 'react';
import type { Icon } from '@tabler/icons-react';
import { createModalStore } from './createModalStore';
import { registerModal } from './modalRegistry';
import { useModalMinimizeStore } from '../modalMinimizeStore';

interface BaseModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

interface CreateModalConfig<TParams, TProps> {
  buildProps: (params: TParams, close: () => void) => Omit<TProps, 'opened' | 'onClose' | 'onMinimize'>;
  getTitle: (params: TParams) => string;
  icon: Icon;
}

export function createModal<TParams, TProps extends BaseModalProps>(
  id: string,
  Component: ComponentType<TProps>,
  config: CreateModalConfig<TParams, TProps>,
) {
  const useStore = createModalStore<TParams>();

  function close() {
    useStore.getState().close();
    useModalMinimizeStore.getState().remove(id);
  }

  function minimize() {
    const state = useStore.getState();
    if (!state.params) return;
    useModalMinimizeStore.getState().minimize(id, {
      title: config.getTitle(state.params),
      icon: config.icon,
      restore,
      close,
    });
    useStore.getState().minimize();
  }

  function restore() {
    useStore.getState().restore();
    useModalMinimizeStore.getState().remove(id);
  }

  function Host() {
    const isOpen = useStore((s) => s.isOpen);
    const isMinimized = useStore((s) => s.isMinimized);
    const params = useStore((s) => s.params);
      const openId = useStore((s) => s.openId);   


    if (!isOpen || !params) return null;

    const extraProps = config.buildProps(params, close);
    return (
      <Component
       key={openId}   
        {...(extraProps as TProps)}
        opened={!isMinimized}
        onClose={close}
        onMinimize={minimize}
      />
    );
  }

  registerModal(id, Host);

  return {
    open: (params: TParams) => useStore.getState().open(params, config.getTitle(params)),
    close,
    minimize,
    restore,
    useIsOpen: () => useStore((s) => s.isOpen),
    useIsMinimized: () => useStore((s) => s.isMinimized),
  };
}