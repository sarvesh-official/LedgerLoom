"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconX } from "@tabler/icons-react";
import { useSidebar } from "./ui/SidebarLayout";
import Sidebar from "./Sidebar";

const MobileSidebar = () => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-[#1e1e1e] z-50 p-6"
          >
            <div
              className="absolute top-6 right-6 text-white cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <IconX />
            </div>
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileSidebar;
