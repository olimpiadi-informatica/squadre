"use client";

import { type ComponentPropsWithRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Modal as BaseModal } from "@olinfo/react-components";

type ModalProps = ComponentPropsWithRef<typeof BaseModal>;

export function Modal(props: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<BaseModal {...props} />, document.body);
}
