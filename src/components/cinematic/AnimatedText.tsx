"use client";

import { motion } from "framer-motion";

export function AnimatedText({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  const base = align === "center" ? "items-center text-center" : "items-start text-left";
  return (
    <div className={["relative z-10 flex flex-col gap-4", base].join(" ")}>
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-xs tracking-[0.24em] text-white/70 gpu gpu-opacity"
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.55 }}
        transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-balance text-3xl font-semibold leading-tight text-white sm:text-5xl gpu gpu-opacity"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
          className="max-w-xl text-pretty text-base leading-7 text-white/70 sm:text-lg gpu gpu-opacity"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

