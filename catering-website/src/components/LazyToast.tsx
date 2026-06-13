"use client";

import dynamic from "next/dynamic";
import "react-toastify/dist/ReactToastify.css";

const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false },
);

export function LazyToast() {
  return (
    <ToastContainer position="top-right" theme="colored" hideProgressBar closeOnClick />
  );
}
