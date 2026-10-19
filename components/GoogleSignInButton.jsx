"use client";

export default function GoogleSignInButton({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-[#d8d9d2] bg-white px-5 py-3 text-sm font-600 text-[#26332d] shadow-sm transition-colors hover:border-[#bdc5bd] hover:bg-[#f9f8f5] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="h-6 w-6 shrink-0">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.25 5.48-4.73 7.18l7.63 5.92c4.45-4.11 7.17-10.17 7.17-17.57Z" />
        <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" />
        <path fill="#34A853" d="M24 48c6.47 0 11.9-2.13 15.87-5.8l-7.63-5.92c-2.12 1.42-4.84 2.27-8.24 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
      </svg>
      Continue with Google
    </button>
  );
}
