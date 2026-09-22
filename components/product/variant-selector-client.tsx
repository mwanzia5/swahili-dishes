"use client";

import clsx from "clsx";
import type { ProductVariant } from "lib/insforge/types";
import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useState } from "react";

type VariantContextType = {
  selectedVariant: ProductVariant | null;
  setSelectedVariant: (v: ProductVariant | null) => void;
};

const VariantContext = createContext<VariantContextType>({
  selectedVariant: null,
  setSelectedVariant: () => {},
});

export function useSelectedVariant() {
  return useContext(VariantContext);
}

function getVariantOptionKey(variant: ProductVariant): string {
  const opts = variant.options;
  if (opts && Object.keys(opts).length > 0) {
    return Object.keys(opts)[0] as string;
  }
  return "portion";
}

function getVariantOptionValue(variant: ProductVariant): string {
  const opts = variant.options;
  if (opts && Object.keys(opts).length > 0) {
    return Object.values(opts)[0] as string;
  }
  return variant.title;
}

function buildVariantOptionMap(variant: ProductVariant): Record<string, string> {
  if (variant.options && Object.keys(variant.options).length > 0) return variant.options;
  return { [getVariantOptionKey(variant)]: getVariantOptionValue(variant) };
}

export function VariantSelectorClient({
  variants,
  productId,
  productPrice,
}: {
  variants: ProductVariant[];
  productId: string;
  productPrice: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const findVariantFromParams = (): ProductVariant | null => {
    if (variants.length === 0) return null;
    if (variants.length === 1) return variants[0] ?? null;

    const params = new URLSearchParams(searchParams.toString());
    for (const v of variants) {
      const opts = buildVariantOptionMap(v);
      let match = true;
      for (const [key, val] of Object.entries(opts)) {
        if (params.get(key.toLowerCase()) !== val) {
          match = false;
          break;
        }
      }
      if (match) return v;
    }
    return variants.length === 1 ? (variants[0] ?? null) : null;
  };

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(findVariantFromParams);

  const extractOptions = (variants: ProductVariant[]): { name: string; values: string[] }[] => {
    const optionMap = new Map<string, Set<string>>();
    for (const v of variants) {
      const opts = buildVariantOptionMap(v);
      for (const [name, value] of Object.entries(opts)) {
        if (!optionMap.has(name)) optionMap.set(name, new Set());
        optionMap.get(name)!.add(value);
      }
    }
    return Array.from(optionMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  };

  const options = extractOptions(variants);
  if (options.length === 0) return null;

  const combinations = variants.map((variant) => ({
    id: variant.id,
    available: variant.is_active ?? true,
    optionMap: buildVariantOptionMap(variant),
  }));

  const updateOption = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    router.replace(`?${params.toString()}`, { scroll: false });

    const params2 = new URLSearchParams(params.toString());
    const matching = combinations.find((combo) =>
      Object.entries(combo.optionMap).every(([key, val]) => params2.get(key) === val)
    );
    if (matching) {
      const variant = variants.find((v) => v.id === matching.id);
      if (variant) setSelectedVariant(variant);
    }
  };

  return (
    <VariantContext.Provider value={{ selectedVariant, setSelectedVariant }}>
      {options.map((option) => (
        <div key={option.name} className="mb-8">
          <p className="mb-4 text-sm uppercase tracking-wide text-neutral-400">{option.name}</p>
          <div className="flex flex-wrap gap-3">
            {option.values.map((value) => {
              const optionNameLowerCase = option.name.toLowerCase();
              const isActive = searchParams.get(optionNameLowerCase) === value;

              const optionParams: Record<string, string> = {};
              searchParams.forEach((v, k) => (optionParams[k] = v));
              optionParams[optionNameLowerCase] = value;

              const filtered = Object.entries(optionParams).filter(
                ([key, val]) =>
                  options.find(
                    (o) => o.name.toLowerCase() === key && o.values.includes(val),
                  ),
              );

              const matchingCombo = combinations.find((combo) =>
                filtered.every(([key, val]) => combo.optionMap[key] === val),
              );
              const isAvailable = matchingCombo?.available ?? false;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateOption(optionNameLowerCase, value)}
                  aria-disabled={!isAvailable}
                  disabled={!isAvailable}
                  title={`${option.name} ${value}${!isAvailable ? " (Out of Stock)" : ""}`}
                  className={clsx(
                    "flex min-w-[48px] items-center justify-center rounded-full border bg-neutral-100 px-3 py-1.5 text-sm dark:border-neutral-800 dark:bg-neutral-900",
                    {
                      "cursor-default ring-2 ring-[var(--color-gold-400)]": isActive,
                      "ring-1 ring-transparent transition duration-300 ease-in-out hover:ring-[var(--color-gold-400)]":
                        !isActive && !!isAvailable,
                      "relative z-10 cursor-not-allowed overflow-hidden bg-neutral-100 text-neutral-500 ring-1 ring-neutral-300 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700":
                        !isAvailable,
                    },
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </VariantContext.Provider>
  );
}
