"use client"

import React from 'react'
import { Globe, Check, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useLanguage, supportedLanguages, type Language } from '@/contexts/LanguageContext'

export default function LanguageDropdown() {
  const { currentLanguage, setCurrentLanguage, isTranslating } = useLanguage()

  const handleLanguageChange = (language: Language) => {
    if (isTranslating) return
    console.log('Changing language to:', language.name)
    setCurrentLanguage(language)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 h-8 px-3 w-full sm:w-auto justify-start sm:justify-center hover:bg-accent transition-colors"
          title={isTranslating ? "Translating..." : "Change Language"}
          disabled={isTranslating}
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="text-sm">{currentLanguage.flag}</span>
          <span className="text-sm">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            className="flex items-center justify-between cursor-pointer hover:bg-accent focus:bg-accent transition-colors"
            disabled={isTranslating}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm font-medium">{language.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              {isTranslating && currentLanguage.code === language.code && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {currentLanguage.code === language.code && !isTranslating && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
