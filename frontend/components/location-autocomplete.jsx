"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Kerala cities and towns - organized by districts
const KERALA_CITIES = [
  // Thiruvananthapuram District
  "Thiruvananthapuram, Kerala",
  "Neyyattinkara, Kerala",
  "Attingal, Kerala",
  "Varkala, Kerala",
  "Kovalam, Kerala",

  // Kollam District
  "Kollam, Kerala",
  "Punalur, Kerala",
  "Paravur, Kerala",
  "Karunagappally, Kerala",

  // Pathanamthitta District
  "Pathanamthitta, Kerala",
  "Adoor, Kerala",
  "Thiruvalla, Kerala",
  "Ranni, Kerala",

  // Alappuzha District
  "Alappuzha, Kerala",
  "Cherthala, Kerala",
  "Kayamkulam, Kerala",
  "Mavelikkara, Kerala",

  // Kottayam District
  "Kottayam, Kerala",
  "Changanassery, Kerala",
  "Pala, Kerala",
  "Ettumanoor, Kerala",

  // Idukki District
  "Thodupuzha, Kerala",
  "Munnar, Kerala",
  "Kumily, Kerala",
  "Painavu, Kerala",

  // Ernakulam District
  "Kochi, Kerala",
  "Ernakulam, Kerala",
  "Aluva, Kerala",
  "Perumbavoor, Kerala",
  "Muvattupuzha, Kerala",
  "Kothamangalam, Kerala",
  "Angamaly, Kerala",

  // Thrissur District
  "Thrissur, Kerala",
  "Chalakudy, Kerala",
  "Kodungallur, Kerala",
  "Irinjalakuda, Kerala",
  "Guruvayur, Kerala",

  // Palakkad District
  "Palakkad, Kerala",
  "Ottapalam, Kerala",
  "Shoranur, Kerala",
  "Mannarkkad, Kerala",
  "Chittur, Kerala",

  // Malappuram District
  "Malappuram, Kerala",
  "Manjeri, Kerala",
  "Perinthalmanna, Kerala",
  "Ponnani, Kerala",
  "Tirur, Kerala",
  "Tanur, Kerala",

  // Kozhikode District
  "Kozhikode, Kerala",
  "Vadakara, Kerala",
  "Koyilandy, Kerala",
  "Feroke, Kerala",

  // Wayanad District
  "Kalpetta, Kerala",
  "Mananthavady, Kerala",
  "Sulthan Bathery, Kerala",

  // Kannur District
  "Kannur, Kerala",
  "Thalassery, Kerala",
  "Payyanur, Kerala",
  "Mattannur, Kerala",

  // Kasaragod District
  "Kasaragod, Kerala",
  "Kanhangad, Kerala",
  "Nileshwar, Kerala",
  "Uppala, Kerala",
]

export default function LocationAutocomplete({ name, required = false, value = "", onChange }) {
  const [open, setOpen] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Filter cities based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = KERALA_CITIES.filter((city) => city.toLowerCase().includes(searchQuery.toLowerCase())).slice(
        0,
        15,
      ) // Show more results since it's a smaller dataset
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [searchQuery])

  const handleValueChange = (newValue) => {
    setLocalValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              name={name}
              value={localValue}
              onChange={(e) => {
                handleValueChange(e.target.value)
                setSearchQuery(e.target.value)
                if (!open) setOpen(true)
              }}
              placeholder="Search Kerala cities..."
              required={required}
              className="w-full"
              onClick={() => setOpen(true)}
            />
            <ChevronsUpDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]" align="start">
          <Command>
            <CommandInput
              placeholder="Search Kerala cities..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>No city found in Kerala.</CommandEmpty>
              <CommandGroup className="max-h-[250px] overflow-auto">
                {suggestions.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={(currentValue) => {
                      handleValueChange(currentValue)
                      setSearchQuery("")
                      setOpen(false)
                    }}
                  >
                    {city}
                    <Check className={cn("ml-auto h-4 w-4", localValue === city ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Hidden input to ensure the value is submitted with the form */}
      <input type="hidden" name={name} value={localValue} />
    </div>
  )
}
