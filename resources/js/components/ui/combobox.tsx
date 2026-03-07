"use client"

import * as React from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type ComboboxItem = string | { value: string; label: string; disabled?: boolean }

type NormalizedItem = { value: string; label: string; disabled?: boolean }

type ComboboxValueType = string | string[]

type ComboboxContextValue = {
  items: NormalizedItem[]
  multiple: boolean
  values: string[]
  setValues: (next: string[]) => void
  open: boolean
  setOpen: (open: boolean) => void
  inputValue: string
  setInputValue: (next: string) => void
  filteredItems: NormalizedItem[]
  selectValue: (value: string) => void
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)

function useComboboxContext() {
  const ctx = React.useContext(ComboboxContext)
  if (!ctx) {
    throw new Error("Combobox components must be used within <Combobox>.")
  }
  return ctx
}

function normalizeItems(items: ComboboxItem[]): NormalizedItem[] {
  return items.map((item) =>
    typeof item === "string" ? { value: item, label: item } : item
  )
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement>(null)
}

function Combobox({
  items,
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  autoHighlight = true,
  children,
}: {
  items: ComboboxItem[]
  multiple?: boolean
  value?: ComboboxValueType
  defaultValue?: ComboboxValueType
  onValueChange?: (value: ComboboxValueType) => void
  autoHighlight?: boolean
  children: React.ReactNode
}) {
  const normalized = React.useMemo(() => normalizeItems(items), [items])

  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const isControlled = value !== undefined
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(
    typeof defaultValue === "string"
      ? [defaultValue]
      : Array.isArray(defaultValue)
        ? defaultValue
        : []
  )

  const values = React.useMemo(() => {
    if (isControlled) {
      if (typeof value === "string") return value ? [value] : []
      if (Array.isArray(value)) return value
      return []
    }
    return uncontrolled
  }, [isControlled, value, uncontrolled])

  const setValues = React.useCallback(
    (next: string[]) => {
      if (!isControlled) {
        setUncontrolled(next)
      }

      if (onValueChange) {
        onValueChange(multiple ? next : next[0] ?? "")
      }
    },
    [isControlled, multiple, onValueChange]
  )

  const selectValue = React.useCallback(
    (val: string) => {
      if (multiple) {
        if (values.includes(val)) {
          setValues(values.filter((v) => v !== val))
        } else {
          setValues([...values, val])
        }
        return
      }

      setValues([val])
      setOpen(false)
    },
    [multiple, setValues, values]
  )

  const filteredItems = React.useMemo(() => {
    const q = inputValue.trim().toLowerCase()
    if (!q) return normalized
    return normalized.filter((item) =>
      item.label.toLowerCase().includes(q)
    )
  }, [inputValue, normalized])

  const ctx: ComboboxContextValue = {
    items: normalized,
    multiple,
    values,
    setValues,
    open,
    setOpen,
    inputValue,
    setInputValue,
    filteredItems,
    selectValue,
  }

  return (
    <ComboboxContext.Provider value={ctx}>
      <Popover open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false} className="bg-transparent">
          {children}
        </Command>
      </Popover>
    </ComboboxContext.Provider>
  )
}

const ComboboxChips = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, onClick, ...props }, ref) => {
    const { setOpen } = useComboboxContext()
    return (
      <PopoverTrigger asChild>
        <div
          ref={ref}
          role="combobox"
          aria-expanded
          onClick={(event) => {
            setOpen(true)
            onClick?.(event)
          }}
          className={cn(
            "border-input focus-within:ring-ring/40 flex min-h-10 w-full cursor-text flex-wrap items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus-within:ring-2",
            className
          )}
          {...props}
        />
      </PopoverTrigger>
    )
  }
)
ComboboxChips.displayName = "ComboboxChips"

function ComboboxChip({
  children,
  value,
  onRemove,
}: {
  children: React.ReactNode
  value?: string
  onRemove?: (value?: string) => void
}) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs">
      {children}
      <button
        type="button"
        className="hover:text-foreground inline-flex"
        onClick={(event) => {
          event.stopPropagation()
          onRemove?.(value)
        }}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

function ComboboxChipsInput({
  className,
  placeholder,
}: {
  className?: string
  placeholder?: string
}) {
  const { inputValue, setInputValue, setOpen } = useComboboxContext()
  return (
    <input
      value={inputValue}
      onChange={(event) => setInputValue(event.target.value)}
      onFocus={() => setOpen(true)}
      className={cn(
        "placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none",
        className
      )}
      placeholder={placeholder}
    />
  )
}

function ComboboxValue({
  children,
}: {
  children: (values: string[]) => React.ReactNode
}) {
  const { values } = useComboboxContext()
  return <>{children(values)}</>
}

function ComboboxContent({
  anchor: _anchor,
  className,
  children,
}: {
  anchor?: React.RefObject<HTMLDivElement>
  className?: string
  children: React.ReactNode
}) {
  return (
    <PopoverContent
      className={cn("w-[--radix-popover-trigger-width] p-2", className)}
      sideOffset={6}
      align="start"
    >
      {children}
    </PopoverContent>
  )
}

function ComboboxEmpty({ children }: { children: React.ReactNode }) {
  const { filteredItems } = useComboboxContext()
  if (filteredItems.length > 0) return null
  return <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>
}

function ComboboxList({
  children,
}: {
  children: (item: NormalizedItem) => React.ReactNode
}) {
  const { filteredItems } = useComboboxContext()
  return <CommandList>{filteredItems.map(children)}</CommandList>
}

function ComboboxItem({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const { values, selectValue } = useComboboxContext()
  const isSelected = values.includes(value)
  return (
    <CommandItem
      value={value}
      onSelect={() => selectValue(value)}
      className={cn("flex items-center justify-between gap-2", className)}
    >
      <span>{children}</span>
      {isSelected ? <Check className="h-4 w-4" /> : null}
    </CommandItem>
  )
}

export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
}
