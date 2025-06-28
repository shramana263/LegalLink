"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, MessageCircle, PlusCircle, Moon, Sun, User, LogOut, Scale, Menu, X, Home } from "lucide-react"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { useTheme } from "../components/theme-provider"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "./ui/badge"
import CreatePostSection from "./CreatePostSection"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { API } from "@/lib/api"
import LanguageDropdown from "./LanguageDropdown"

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Debounced advocate suggestions for navbar search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }
    const handler = setTimeout(async () => {
      try {
        const res = await API.Advocate.searchAdvocates({ location_city: searchQuery })
        console.log('API result for suggestions:', res.data); // Debug log
        setSuggestions(
          Array.isArray(res.data)
            ? res.data.map((a: any) => ({ name: a.name || a.user?.name, id: a.advocate_id }))
            : []
        )
      } catch (err) {
        console.error('API error for suggestions:', err);
        setSuggestions([])
      }
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])

  if (!user) return null

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/feed" className="flex items-center space-x-2 logo-container">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                <Scale className="text-white dark:text-slate-900 h-6 w-6" />
              </span>
            </div>
            <span className="font-bold text-xl text-primary">LegalLink</span>
          </Link>

          {/* Hamburger for mobile */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Desktop: Nav Items at the end */}
          <div className="hidden lg:flex items-center space-x-4 ml-auto">
            {/* Navigation Items */}
            <Link href="/feed">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <Home className="h-5 w-5" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>

            {/* <Link href="/notifications">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 relative">
                <Bell className="h-5 w-5" />
                <span className="hidden sm:inline">Notifications</span>
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>
            </Link>

            <Link href="/messages">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 relative">
                <MessageCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Messages</span>
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                >
                  2
                </Badge>
              </Button>
            </Link> */}

            {user.userType == "advocate" && (
              <>
                <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center space-x-1">
                      <PlusCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Create Post</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl form-modal-bg">
                    <DialogHeader>
                      <DialogTitle>Create a Post</DialogTitle>
                    </DialogHeader>
                    <CreatePostSection forceExpanded onPostCreated={() => setCreatePostOpen(false)} />
                    {/* <CreatePostSection/> */}
                  </DialogContent>
                </Dialog>
              </>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              title={`Switch theme (current: ${theme})`}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* Language Dropdown */}
            <LanguageDropdown />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as any).image || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user.id}`} className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile: Slide-out menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex-1 bg-black/20 transition-all duration-300" onClick={() => setMobileMenuOpen(false)} />
          <div className="bg-white dark:bg-zinc-900 w-64 max-w-full h-full shadow-lg p-4 flex flex-col z-50 transition-transform duration-300 translate-x-0 animate-slide-in-left relative">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg text-zinc-900 dark:text-white">Menu</span>
              <button
                className="p-2 rounded border text-xs"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Mobile nav items (reuse desktop nav, but stacked) */}
            <div className="flex flex-col gap-2">
              <Link href="/feed">
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 w-full justify-start">
                  <Home className="h-5 w-5" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>

              {/* <Link href="/notifications">
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 w-full justify-start relative">
                  <Bell className="h-5 w-5" />
                  <span className="hidden sm:inline">Notifications</span>
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                  >
                    3
                  </Badge>
                </Button>
              </Link>

              <Link href="/messages">
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 w-full justify-start relative">
                  <MessageCircle className="h-5 w-5" />
                  <span className="hidden sm:inline">Messages</span>
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                  >
                    2
                  </Badge>
                </Button>
              </Link> */}

              {user.userType == "advocate" && (
                <Button
                  size="sm"
                  className="flex items-center space-x-1 w-full justify-start"
                  onClick={() => setCreatePostOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Post</span>
                </Button>
              )}

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                title={`Switch theme (current: ${theme})`}
                className="w-full justify-start"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="ml-2">{theme === "light" ? "Dark" : "Light"} Mode</span>
              </Button>

              {/* Language Dropdown for Mobile */}
              <div className="w-full">
                <LanguageDropdown />
              </div>

              {/* Profile & Logout */}
              <div className="border-t border-muted-foreground/20 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(user as any).image || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-zinc-900 dark:text-white">{user.name}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="rounded-full"
                    title="Log out"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
