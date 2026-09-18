"use client";

import clsx from "clsx";
import type { ProductVariant } from "lib/insforge/types";
import { useRouter, useSearchParams } from "next/navigation";

function extractOptions(variants: ProductVariant[]): { name: string; values: string[] }[] {
  const optionMap = new Map<string, Set<string>>();

  for (const v of variants) {
    const opts = v.options ?? null;
    if (!opts) continue;
    for (const [name, value] of Object.entries(opts)) {
      if (!optionMap.has(name)) optionMap.set(name, new Set());
      optionMap.get(name)!.add(value);
    }
  }

  return Array.from(optionMap.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }));
}

type Combination = {
  id: string;
  available: boolean;
  optionMap: Record<string, string>;
};

export function VariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
}: {
  variants: ProductVariant[];
  selectedVariantId?: string;
  onVariantChange?: (variant: ProductVariant) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const options = extractOptions(variants);

  if (options.length === 0) return null;

  const combinations: Combination[] = variants.map((variant) => {
    const opts = variant.options ?? {};
    return {
      id: variant.id,
      available: variant.is_active ?? true,
      optionMap: opts,
    };
  });

  const updateOption = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return options.map((option) => (
    <form key={option.name}>
      <dl className="mb-8">
        <dt className="mb-4 text-sm uppercase tracking-wide text-neutral-400">{option.name}</dt>
        <dd className="flex flex-wrap gap-3">
          {option.values.map((value) => {
            const optionNameLowerCase = option.name.toLowerCase();

            const optionParams: Record<string, string> = {};
            searchParams.forEach((v, k) => (optionParams[k] = v));
            optionParams[optionNameLowerCase] = value;

            const filtered = Object.entries(optionParams).filter(
              ([key, val]) =>
                options.find(
                  (o) =>
                    o.name.toLowerCase() === key &&
                    o.values.includes(val),
                ),
            );

            const matchingCombo = combinations.find((combo) =>
              filtered.every(([key, val]) => combo.optionMap[key] === val),
            );
            const isAvailable = matchingCombo?.available ?? false;

            const isActive = searchParams.get(optionNameLowerCase) === value;

            return (
              <button
                formAction={() => {
                  updateOption(optionNameLowerCase, value);
                  if (matchingCombo) {
                    const variant = variants.find((v) => v.id === matchingCombo.id);
                    if (variant) onVariantChange?.(variant);
                  }
                }}
                key={value}
                aria-disabled={!isAvailable}
                disabled={!isAvailable}
                title={`${option.name} ${value}${!isAvailable ? " (Out of Stock)" : ""}`}
                className={clsx(
                  "flex min-w-[48px] items-center justify-center rounded-full border bg-neutral-100 px-2 py-1 text-sm dark:border-neutral-800 dark:bg-neutral-900",
                  {
                    "cursor-default ring-2 ring-[var(--color-gold-400)]": isActive,
                    "ring-1 ring-transparent transition duration-300 ease-in-out hover:ring-[var(--color-gold-400)]":
                      !isActive && !!isAvailable,
                    "relative z-10 cursor-not-allowed overflow-hidden bg-neutral-100 text-neutral-500 ring-1 ring-neutral-300 before:absolute before:inset-x-0 before:-z-10 before:h-px before:-rotate-45 before:bg-neutral-300 before:transition-transform dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700 dark:before:bg-neutral-700":
                      !isAvailable,
                  },
                )}
              >
                {value}
              </button>
            );
          })}
        </dd>
      </dl>
    </form>
  ));
}
