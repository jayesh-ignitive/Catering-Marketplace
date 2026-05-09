"use client";

/**
 * Select2-style searchable single-select for admin screens.
 * Uses react-select (no jQuery) so it works cleanly with Next.js App Router.
 */

import { useMemo } from "react";
import Select, {
  components as RSComponents,
  type DropdownIndicatorProps,
  type GroupBase,
  type StylesConfig,
} from "react-select";

export type AdminSelectOption = { value: string; label: string };

const BRAND_RED = "#e53935";
const BRAND_PAGE = "#f8f9fa";
const BRAND_TEXT = "#232d42";
const BRAND_MUTED = "#8a92a6";
const BRAND_RED_LIGHT = "#ffebee";
/** Above admin modal (z-200), headers, and sticky table heads — portaled menus must win stacking. */
const MENU_Z = 99999;

function DropdownIndicator(props: DropdownIndicatorProps<AdminSelectOption, false, GroupBase<AdminSelectOption>>) {
  return (
    <RSComponents.DropdownIndicator {...props}>
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="text-brand-text-muted">
        <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
      </svg>
    </RSComponents.DropdownIndicator>
  );
}

function buildStyles(): StylesConfig<AdminSelectOption, false> {
  return {
    control: (base, state) => ({
      ...base,
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: state.isFocused ? BRAND_RED : "transparent",
      boxShadow: state.isFocused ? `0 0 0 1px ${BRAND_RED}` : "none",
      backgroundColor: state.isFocused ? "#fff" : BRAND_PAGE,
      cursor: "pointer",
      "&:hover": {
        borderColor: state.isFocused ? BRAND_RED : "#e5e7eb",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      paddingLeft: 12,
      paddingRight: 8,
      paddingTop: 6,
      paddingBottom: 6,
    }),
    singleValue: (base) => ({
      ...base,
      color: BRAND_TEXT,
      fontWeight: 600,
      fontSize: "0.875rem",
    }),
    placeholder: (base) => ({
      ...base,
      color: BRAND_MUTED,
      fontWeight: 600,
      fontSize: "0.875rem",
    }),
    input: (base) => ({
      ...base,
      color: BRAND_TEXT,
      fontWeight: 600,
    }),
    menu: (base) => ({
      ...base,
      zIndex: MENU_Z,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 10px 30px -5px rgb(0 0 0 / 0.12)",
      border: "1px solid #f1f1f1",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: MENU_Z,
    }),
    menuList: (base) => ({
      ...base,
      padding: 4,
      maxHeight: 280,
    }),
    option: (base, state) => ({
      ...base,
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "0.875rem",
      backgroundColor: state.isSelected ? BRAND_RED : state.isFocused ? BRAND_RED_LIGHT : "transparent",
      color: state.isSelected ? "#fff" : BRAND_TEXT,
      "&:active": {
        backgroundColor: state.isSelected ? BRAND_RED : BRAND_RED_LIGHT,
      },
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
      ...base,
      paddingRight: 10,
      color: BRAND_MUTED,
      "&:hover": { color: BRAND_TEXT },
    }),
  };
}

export type AdminSearchableSelectProps = {
  /** Stable id for react-select (accessibility / SSR warnings). */
  instanceId: string;
  options: AdminSelectOption[];
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Default true — type to filter options (Select2-like). */
  isSearchable?: boolean;
  disabled?: boolean;
  /**
   * Render the menu in `document.body` with fixed positioning.
   * Default true — required above `.admin-datatable-shell` which uses `overflow-hidden`.
   */
  menuPortal?: boolean;
  className?: string;
};

export function AdminSearchableSelect({
  instanceId,
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
  isSearchable = true,
  disabled,
  menuPortal = true,
  className,
}: AdminSearchableSelectProps) {
  const styles = useMemo(() => buildStyles(), []);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  return (
    <div className={className}>
      <Select<AdminSelectOption, false>
        instanceId={instanceId}
        inputId={`${instanceId}-input`}
        aria-label={ariaLabel}
        options={options}
        value={selected}
        onChange={(opt) => onChange(opt?.value ?? "")}
        placeholder={placeholder}
        isSearchable={isSearchable}
        isClearable={false}
        isDisabled={disabled}
        menuPortalTarget={menuPortal && typeof document !== "undefined" ? document.body : undefined}
        menuPosition={menuPortal ? "fixed" : "absolute"}
        styles={styles}
        components={{
          DropdownIndicator,
          IndicatorSeparator: () => null,
        }}
        theme={(t) => ({
          ...t,
          borderRadius: 12,
          colors: {
            ...t.colors,
            primary: BRAND_RED,
            primary25: BRAND_RED_LIGHT,
          },
        })}
      />
    </div>
  );
}
