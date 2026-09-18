export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  const sizeClasses = size === "sm" ? "h-[30px] w-[30px] rounded-lg" : "h-[40px] w-[40px] rounded-xl";

  return (
    <div
      className={`flex flex-none items-center justify-center ${sizeClasses}`}
      style={{ background: "linear-gradient(160deg, var(--color-gold-400), var(--color-rust-600))" }}
    >
      <span
        className="font-bold text-indigo-950"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size === "sm" ? "0.7rem" : "1rem",
        }}
      >
        SD
      </span>
    </div>
  );
}
