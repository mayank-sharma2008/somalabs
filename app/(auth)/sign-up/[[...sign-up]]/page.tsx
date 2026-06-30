"use client"

import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import Image from "next/image"
import AuthBrandPanel from "@/components/AuthBrandPanel"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] flex">
      <style>{`
        /* Safety net: Clerk's appearance.elements prop has been inconsistent
           about which sub-elements actually pick up custom classes. These
           target Clerk's own stable, documented class names directly with
           !important so text renders at proper contrast regardless. */
        .cl-socialButtonsBlockButtonText { color: rgba(255,255,255,0.92) !important; }
        .cl-socialButtonsBlockButton {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.22) !important;
          border-radius: 0.75rem !important;
          transition: background 0.15s, border-color 0.15s;
        }
        .cl-socialButtonsBlockButton:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.38) !important;
        }
        .cl-dividerText { color: rgba(255,255,255,0.45) !important; }
        .cl-formFieldLabel { color: rgba(255,255,255,0.65) !important; }
        .cl-footerActionText, .cl-footerActionText * { color: rgba(255,255,255,0.45) !important; }
        .cl-footerActionLink { color: #A8C5FF !important; }
        .cl-identityPreviewText { color: rgba(255,255,255,0.85) !important; }
        .cl-formFieldInputShowPasswordButton { color: rgba(255,255,255,0.55) !important; }
        .cl-formFieldAction { color: #A8C5FF !important; }
      `}</style>

      {/* Form panel */}
      <div className="flex-1 lg:w-[38%] flex flex-col">

        <div className="flex items-center gap-2 px-10 pt-10">
          <div className="w-6 h-6 rounded-full overflow-hidden
          flex items-center justify-center">
            <Image
              src="/logo1.png"
              alt="SomaLabs"
              width={24}
              height={24}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="text-xs tracking-[0.25em] uppercase text-white/80">
            Soma Labs
          </span>
        </div>

        <div className="flex-1 flex items-center px-10 py-12">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-light text-white tracking-tight mb-1">
              Create your account
            </h1>
            <p className="text-sm text-white/40 mb-8">
              One studio. Every model.
            </p>

            <SignUp
              appearance={{
                baseTheme: dark,
                variables: {
                  colorPrimary: "#A8C5FF",
                  colorBackground: "#0c0c0c",
                  colorText: "#ffffff",
                  colorTextSecondary: "rgba(255,255,255,0.5)",
                  colorInputBackground: "rgba(255,255,255,0.06)",
                  colorInputText: "#ffffff",
                  borderRadius: "0.75rem",
                  fontFamily: "inherit",
                },
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none border border-white/15 " +
                    "rounded-2xl p-6 w-full",
                  header: "!hidden",
                  headerTitle: "!hidden",
                  headerSubtitle: "!hidden",
                  socialButtonsBlockButton:
                    "bg-white/[0.06] border border-white/20 text-white " +
                    "hover:bg-white/[0.12] hover:border-white/35 " +
                    "h-12 transition-colors justify-start px-4 gap-3",
                  socialButtonsBlockButtonText: "text-white text-sm font-medium",
                  socialButtonsProviderIcon__google: "w-5 h-5",
                  socialButtonsProviderIcon__github: "w-5 h-5 invert",
                  socialButtonsProviderIcon__apple: "w-5 h-5 invert",
                  dividerRow: "my-5",
                  dividerLine: "bg-white/15",
                  dividerText: "text-white/40 text-xs uppercase tracking-wide",
                  formFieldLabel: "text-white/60 text-xs",
                  formFieldInput:
                    "bg-white/[0.06] border border-white/20 text-white h-12 " +
                    "focus:border-[#A8C5FF]/60 focus:ring-1 focus:ring-[#A8C5FF]/40",
                  formButtonPrimary:
                    "bg-white text-black hover:bg-white/90 h-12 " +
                    "text-sm font-medium normal-case shadow-none",
                  footerActionText: "text-white/40 text-sm",
                  footerActionLink: "text-[#A8C5FF] hover:text-[#A8C5FF]/80",
                  identityPreviewText: "text-white/80",
                  identityPreviewEditButton: "text-[#A8C5FF]",
                  formFieldInputShowPasswordButton: "text-white/50",
                  otpCodeFieldInput: "bg-white/[0.06] border-white/20 text-white",
                  footer: "mt-6",
                },
              } as any}
            />
          </div>
        </div>

        <p className="text-xs text-white/20 px-10 pb-10 max-w-sm">
          By continuing, you agree to SomaLabs&apos;s Terms of Service and
          Privacy Policy.
        </p>
      </div>

      <AuthBrandPanel />
    </div>
  )
}