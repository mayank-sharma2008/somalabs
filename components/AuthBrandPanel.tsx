import Image from "next/image"

export default function AuthBrandPanel() {
  return (
    <div className="hidden lg:block lg:w-[62%] relative overflow-hidden
    bg-black">
      <Image
        src="/soma-auth-bg.png"
        alt=""
        fill
        sizes="54vw"
        className="object-cover"
        priority
      />

      {/* Light bottom vignette so any future overlay text stays legible */}
      <div className="absolute inset-0 bg-gradient-to-b
      from-transparent via-transparent to-black/40" />
    </div>
  )
}