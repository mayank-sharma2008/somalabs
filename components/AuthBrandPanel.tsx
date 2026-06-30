import Image from "next/image"

export default function AuthBrandPanel() {
  return (
    <div className="hidden lg:block lg:w-[54%] relative overflow-hidden
    bg-black">

      {/* Soft light wash behind the centered mark */}
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "70%",
          height: "70%",
          background:
            "radial-gradient(ellipse, rgba(168,197,255,0.20) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Moon-phase mark, filling the entire panel edge-to-edge — object-cover
          crops the square source image to fill the rectangular panel, which
          is what actually removes the visible square boundary (object-contain
          on any smaller container always shows the source image's own square
          black edge against the panel, no matter how large you scale it). */}
      <div className="absolute inset-0">
        <Image
          src="/logo1.png"
          alt=""
          fill
          sizes="54vw"
          className="object-cover"
          style={{
            opacity: 0.9,
            filter: "drop-shadow(0 0 100px rgba(168,197,255,0.2))",
          }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b
      from-black/30 via-transparent to-black/50" />

      {/* Quiet brand line, bottom-left — present but not competing with the mark */}
      <div className="absolute bottom-12 left-12 right-12">
        <p className="text-xl font-light text-white/70 tracking-tight">
          One studio. Every model.
        </p>
      </div>
    </div>
  )
}