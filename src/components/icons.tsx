import type { SVGProps } from "react";

export function CommandeerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 8.16288V15.8371" />
      <path d="M10.25 8.16288L7 12L10.25 15.8371" />
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M14 12h3" />
    </svg>
  );
}
