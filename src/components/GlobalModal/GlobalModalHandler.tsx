import React, { Suspense, lazy } from "react";
import { useModalStore } from "../../store/ModalStore";

const CollateralTypeModal = lazy(() =>
  import("../Modal/CollateralTypeModal").then((m) => ({
    default: m.CollateralTypeModal,
  }))
);

export const GlobalModalHandler: React.FC = () => {
  const modals = useModalStore((s) => s.modals);
  const closeModal = useModalStore((s) => s.closeModal);
  const getModalContext = useModalStore((s) => s.getModalContext);

  const renderModal = (modal: (typeof modals)[number]) => {
    const context = modal.context || getModalContext(modal.id);
    const handleClose = () => closeModal(modal.id);

    switch (modal.type) {
      case "collateralType":
        return (
          <Suspense key={modal.id} fallback={null}>
            <CollateralTypeModal
              modalId={modal.id}
              opened={true}
              onClose={handleClose}
              editId={modal.isEdit ? (modal.initialData as any)?.id : null}
              isView={context?.isViewMode ?? false}
            />
          </Suspense>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {modals.map((modal) => (
        <React.Fragment key={modal.id}>{renderModal(modal)}</React.Fragment>
      ))}
    </>
  );
};

export default GlobalModalHandler;