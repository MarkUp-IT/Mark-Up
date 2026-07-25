"use client";

import { Fragment } from "react";

// Regex nangkep URL http(s):// maupun yang diawali www. -- dipakai buat
// nge-render teks bebas (deskripsi produk, bio mentor) di mana URL-nya
// otomatis jadi link yang bisa diklik & kebuka di tab baru.
const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
// Tanda baca di ujung URL (mis. "cek https://a.com." atau "(https://a.com)")
// jangan ikut jadi bagian link.
const TRAILING_PUNCT = /[.,;:!?)\]]+$/;

export default function Linkify({ text }) {
  if (!text) return null;

  const parts = String(text).split(URL_RE);

  return parts.map((part, i) => {
    if (!part) return null;
    if (i % 2 === 1) {
      // Bagian ganjil dari split = hasil tangkapan grup URL.
      const trailing = part.match(TRAILING_PUNCT)?.[0] || "";
      const url = trailing ? part.slice(0, -trailing.length) : part;
      const href = url.startsWith("http") ? url : `https://${url}`;
      return (
        <Fragment key={i}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            // stopPropagation biar klik link gak ikut nge-trigger onClick
            // container (mis. kartu mentor yang bisa dipilih di checkout).
            onClick={(e) => e.stopPropagation()}
            className="text-[#148F89] underline underline-offset-2 hover:text-[#1AB3AC] break-words"
          >
            {url}
          </a>
          {trailing}
        </Fragment>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
