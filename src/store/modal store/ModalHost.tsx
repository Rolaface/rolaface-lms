
import { getRegisteredModals } from '../modal store/modalRegistry';

export function ModalHost() {
  const modals = getRegisteredModals();
  return (
    <>
      {modals.map(({ id, Component }) => (
        <Component key={id} />
      ))}
    </>
  );
}