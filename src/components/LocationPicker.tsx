import { useState } from "react";
import { MapPin, Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

// Abhi ke liye common cities — baad mein API se dynamic bhi kar sakte ho
const locations = [
  "Kanpur, India", "Lucknow, India", "Delhi, India", "Mumbai, India",
  "Bangalore, India", "Pune, India", "New York, USA", "London, UK",
  "Dubai, UAE", "Singapore",
];

export const LocationPicker = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Kanpur, India");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[#14213D]/15 px-3 py-2 text-sm font-medium text-[#14213D] hover:bg-[#14213D]/5 md:flex dark:text-white dark:border-white/15 dark:hover:bg-white/5">
          <MapPin className="h-4 w-4 text-[#0F5257]" />
          <span>{selected.split(",")[0]}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search city or country..." />
          <CommandList>
            <CommandEmpty>No location found.</CommandEmpty>
            {locations.map((loc) => (
              <CommandItem
                key={loc}
                onSelect={() => {
                  setSelected(loc);
                  setOpen(false);
                }}
              >
                <Check className={`mr-2 h-4 w-4 ${selected === loc ? "opacity-100" : "opacity-0"}`} />
                {loc}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};