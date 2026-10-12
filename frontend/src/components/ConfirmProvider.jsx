"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Modal, Btn } from "@/components/kit";

const ConfirmCtx = createContext(null);

/**
 * Confirmación y avisos 100% in-app (sin diálogos nativos del navegador).
 * - confirm({ title, message, confirmText, cancelText, danger }) => Promise<boolean>
 * - notify({ title, message }) => Promise<void>  (se resuelve al pulsar Aceptar)
 */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setDialog({ kind: "confirm", ...opts, resolve });
    });
  }, []);

  const notify = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setDialog({ kind: "notify", ...opts, resolve });
    });
  }, []);

  const close = (result) => {
    dialog?.resolve?.(result === undefined ? false : result);
    setDialog(null);
  };

  return (
    <ConfirmCtx.Provider value={{ confirm, notify }}>
      {children}
      {dialog ? (
        <Modal
          open
          size="sm"
          title={dialog.title || (dialog.kind === "notify" ? "Aviso" : "Confirmar acción")}
          sub={dialog.sub}
          onClose={() => close(dialog.kind === "notify" ? true : false)}
          footer={
            dialog.kind === "notify" ? (
              <Btn variant="primary" onClick={() => close(true)}>Aceptar</Btn>
            ) : (
              <>
                <Btn variant="secondary" onClick={() => close(false)}>{dialog.cancelText || "Cancelar"}</Btn>
                <Btn variant={dialog.danger === false ? "primary" : "danger"} onClick={() => close(true)}>
                  {dialog.confirmText || "Confirmar"}
                </Btn>
              </>
            )
          }
        >
          <p className="text-sm text-foreground leading-relaxed">{dialog.message}</p>
        </Modal>
      ) : null}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  return ctx;
}