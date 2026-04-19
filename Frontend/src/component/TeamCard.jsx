import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Tambahin props instagram & linkedin, hapus description
export default function TeamCard({
  name,
  position,
  imgUrl,
  instagram,
  linkedin,
}) {
  const initials = getInitials(name);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }} // spring-like
      // PERUBAHAN DI SINI: ganti w-[293px] jadi w-full h-full biar responsif ngikut grid
      className="group w-full h-full"
    >
      <div className="w-full h-full bg-[#100A19] flex flex-col items-center gap-3 rounded-[12px] border border-[#EDEDF3]/10 relative overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:border-[#EDEDF3]/20 hover:shadow-[inset_0_0_40px_rgba(14,17,43,0.9),inset_0_1px_0_rgba(255,255,255,0.05)]">
        {/* Hover overlay gradient */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-90 transition-opacity duration-300 ease-out rounded-[12px]"
          style={{
            background:
              "linear-gradient(160deg, #0e112b 0%, #0a0d22 60%, #07091a 100%)",
          }}
        />

        {/* Glass shimmer border on hover */}
        <div
          className="absolute inset-0 rounded-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center w-full pb-8 pt-8">
          <div className="w-28 h-28 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-transparent group-hover:ring-white/10 transition-all duration-300">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4] flex items-center justify-center text-white text-4xl font-bold font-poppins">
                {initials}
              </div>
            )}
          </div>

          <div className="bg-[#530D8E] px-4 h-[28px] mt-6 text-[11px] text-[#B19EEF] rounded-[3.6px] flex justify-center items-center font-bold tracking-widest uppercase">
            {position}
          </div>

          <p className="font-poppins font-semibold text-[22px] mt-4 mb-6 text-white group-hover:text-white/95 transition-colors duration-300 text-center px-4">
            {name}
          </p>

          <div className="flex flex-row gap-3">
            {/* Tombol Instagram dari Props */}
            {instagram && (
              <Link href={instagram} target="_blank">
                <div className="group/social rounded-full bg-[#060010] w-8 h-8 border border-[#EDEDF3]/25 flex justify-center items-center hover:bg-white transition-colors duration-300">
                  <Image
                    src="/images/instagram.svg"
                    width={16}
                    height={16}
                    alt="Instagram"
                    className="invert group-hover/social:invert-0 transition-all duration-300"
                  />
                </div>
              </Link>
            )}

            {/* Tombol LinkedIn dari Props (pastikan kamu punya file linkedin.svg di folder public/images) */}
            {linkedin && (
              <Link href={linkedin} target="_blank">
                <div className="group/social rounded-full bg-[#060010] w-8 h-8 border border-[#EDEDF3]/25 flex justify-center items-center hover:bg-white transition-colors duration-300">
                  <Image
                    src="/images/linkedin.svg" // Pastikan file ini ada
                    width={16}
                    height={16}
                    alt="LinkedIn"
                    className="invert group-hover/social:invert-0 transition-all duration-300"
                  />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
