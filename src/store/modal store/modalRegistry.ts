
import type { ComponentType } from 'react';

interface RegisteredModal {
  id: string;
  Component: ComponentType;
}

const registry: RegisteredModal[] = [];

export function registerModal(id: string, Component: ComponentType) {
  if (registry.some((m) => m.id === id)) {
    if (import.meta.env?.DEV) {
      console.warn(
        `[modalRegistry] Duplicate modal id "${id}" — ignoring re-registration. ` +
        `Check that createModal() ids are unique across the project.`
      );
    }
    return;
  }
  registry.push({ id, Component });
}

export function getRegisteredModals() {
  return registry;
}