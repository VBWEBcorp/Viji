import Link from "next/link";

type Logo = {
  name: string;
  href: string;
  external: boolean;
  Mark: () => React.ReactElement;
};

const LOGOS: Logo[] = [
  {
    name: "Ouest France",
    href: "#presse",
    external: false,
    Mark: OuestFranceMark,
  },
  {
    name: "L'essentiel",
    href: "https://www.lessentiel.fr/rennes/entreprises/2026-03-31/pres-de-rennes-des-box-culinaires-uniques-en-france-dediees-la",
    external: true,
    Mark: LessentielMark,
  },
];

export default function PressLogoBar() {
  return (
    <section
      aria-label="Ils parlent de nous"
      className="bg-white border-y border-gray-200/70 py-8 md:py-10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-6 md:mb-7">
          Ils parlent de nous
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14 md:gap-x-20">
          {LOGOS.map(({ name, href, external, Mark }, i) => {
            const inner = (
              <span
                aria-label={name}
                className="block opacity-55 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500 ease-out"
              >
                <Mark />
              </span>
            );
            return (
              <div key={name} className="flex items-center gap-10 sm:gap-14 md:gap-20">
                {external ? (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <Link href={href}>{inner}</Link>
                )}
                {i < LOGOS.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden sm:block h-6 w-px bg-gray-300/70"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────── Marques ───────── */

function OuestFranceMark() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="bg-[#e2231a] text-white px-1.5 py-0.5 leading-[0.95]">
        <p className="font-sans font-extrabold text-[12px] tracking-tight">
          ouest
        </p>
        <p className="font-sans font-extrabold text-[12px] tracking-tight">
          france
        </p>
      </div>
      <svg
        viewBox="0 0 40 40"
        className="w-6 h-6 text-[#e2231a]"
        aria-hidden="true"
      >
        <g fill="currentColor">
          <path d="M20 4 a16 16 0 0 1 16 16 h-5 a11 11 0 0 0 -11 -11 z" />
          <path d="M36 20 a16 16 0 0 1 -16 16 v-5 a11 11 0 0 0 11 -11 z" />
          <path d="M20 36 a16 16 0 0 1 -16 -16 h5 a11 11 0 0 0 11 11 z" />
        </g>
        <circle cx="20" cy="20" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}

function LessentielMark() {
  return (
    <span
      className="font-serif italic text-[26px] sm:text-[28px] md:text-[30px] leading-none tracking-tight text-gray-900"
      style={{ fontWeight: 600 }}
    >
      L<span className="text-[#c0282d]">’</span>essentiel
    </span>
  );
}
