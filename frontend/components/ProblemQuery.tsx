"use client"

import { useState } from "react"
import { Search, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ProblemQueryProps {
  onSearch?: (query: string) => void
  onChange?: (value: string) => void // <-- add this
  initialQuery?: string
  className?: string
  placeholder?: string
}

export default function ProblemQuery(props: ProblemQueryProps) {
  const {
    onSearch,
    onChange,
    initialQuery = "",
    className = "",
    placeholder = "Describe your problem..."
  } = props;
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center rounded-full border bg-background shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary overflow-hidden">
          <div className="flex items-center pl-4">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder={placeholder}
            className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            value={searchQuery}
            onChange={handleInputChange}
          />
          <Button type="submit" size="sm" className="rounded-full m-1" variant="default">
            <Send className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
