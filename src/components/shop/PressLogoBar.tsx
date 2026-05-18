import Link from "next/link";
import Image from "next/image";

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
    name: "Actu Rennes",
    href: "#presse",
    external: false,
    Mark: ActuRennesMark,
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
    <Image
      src="https://i.ibb.co/PvNPqYJp/Ouest-france.png"
      alt="Ouest France"
      width={200}
      height={80}
      className="h-7 sm:h-8 md:h-9 w-auto object-contain"
      unoptimized
    />
  );
}

function ActuRennesMark() {
  return (
    <Image
      src="https://i.ibb.co/pq7xWvp/Actu-Rennes.webp"
      alt="Actu Rennes"
      width={280}
      height={120}
      className="h-12 sm:h-14 md:h-16 w-auto object-contain"
      unoptimized
    />
  );
}

