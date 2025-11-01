import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const ModalPortal = ({ children }) => {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return createPortal(children, document.body);
};

export default ModalPortal;
