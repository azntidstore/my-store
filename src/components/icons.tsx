import type {SVGProps} from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 20"
      width="150"
      height="30"
      {...props}
    >
      <defs>
        <linearGradient id="saffron-teal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <text
        x="50"
        y="15"
        fontFamily="Belleza, sans-serif"
        fontSize="18"
        fill="url(#saffron-teal)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        Marhaba Market
      </text>
    </svg>
  );
}
