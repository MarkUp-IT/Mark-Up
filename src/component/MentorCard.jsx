function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MentorCard({ name, description, imgUrl }) {
  const initials = getInitials(name);

  return (
    <div className="w-[293px] h-[253px] bg-[#100A19] flex flex-col items-center gap-3 rounded-[12px] border border-[#EDEDF3]/10">
      <div className="w-28 h-28 rounded-full overflow-hidden mt-8 flex-shrink-0">
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

      <p className="font-poppins font-semibold text-base text-white">
        {name}
      </p>

      <p className="text-xs text-[#EDEDF3]/70 text-center px-4 mb-5 leading-5">
        {description}
      </p>
    </div>
  );
}