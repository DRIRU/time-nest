"use client"
import { Input } from "@/components/ui/input"

export default function LocationAutocomplete({ value, onChange, name }) {
  return (
    <Input
      name={name}
      value={value === "any" ? "" : value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter a location..."
    />
  )
}
