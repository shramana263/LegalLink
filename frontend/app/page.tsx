"use client"

import Link from "next/link"
import { useState, useEffect } from 'react'
import { ArrowRight, Scale, Users, MessageSquare, Shield, Search, Zap, Award, BookOpen, Gavel, Sun, Moon, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LegalLandingPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800' : 'bg-transparent'}`}>
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                <Scale className="text-white dark:text-slate-900 h-6 w-6" />
              </div>
              <div>
                <span className="font-bold text-xl text-slate-900 dark:text-white">LegalLink</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">Professional Legal Services</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-5 w-5 text-slate-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
              </button>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>Trusted by 10,000+ Legal Professionals</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Professional Legal Services
              <span className="block text-slate-600 dark:text-slate-300">Made Simple</span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Connect with verified advocates, get AI-powered legal assistance, and access justice through our comprehensive legal platform designed for modern India.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/consultation">
                <Button size="lg" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-8 py-3 text-lg">
                  Start Legal Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/advocate-signup">
                <Button size="lg" variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-8 py-3 text-lg">
                  Join as Advocate
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">50,000+</div>
                <div className="text-slate-600 dark:text-slate-400">Cases Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">2,500+</div>
                <div className="text-slate-600 dark:text-slate-400">Verified Advocates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">98%</div>
                <div className="text-slate-600 dark:text-slate-400">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Why Choose LegalLink?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Our platform combines advanced technology with legal expertise to provide comprehensive legal services.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-6">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">AI Legal Assistant</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Get instant answers to your legal queries with our advanced AI system trained on Indian law and legal precedents.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-6">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Verified Advocates</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Connect with Bar Council verified advocates specializing in your specific legal needs and practice areas.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-6">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Smart Matching</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Our algorithm matches you with advocates based on location, specialization, and case type for optimal results.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-6">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Secure Communication</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Communicate with advocates through our secure messaging system with end-to-end encryption and privacy protection.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-6">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Trust & Safety</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Advanced fraud detection and verification systems ensure a safe and trusted platform for all users.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-6">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Legal Resources</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Access comprehensive legal resources, case studies, and real-time updates on legal developments in India.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Get legal assistance in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Describe Your Case</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Share your legal query or case details through our secure platform and get instant AI-powered guidance.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Get Matched</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Our smart algorithm connects you with the most suitable verified advocates based on your specific needs.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Resolve Your Case</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Work directly with your matched advocate through our secure platform to resolve your legal matter efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex justify-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
            </div>
            <blockquote className="text-2xl font-medium text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
              "LegalLink has revolutionized how I connect with clients and manage my practice. The platform's efficiency and professionalism have significantly enhanced my legal services."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <Gavel className="text-slate-600 dark:text-slate-400 h-6 w-6" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-white">Adv. Rajesh Kumar</div>
                <div className="text-slate-600 dark:text-slate-400 text-sm">Senior Advocate, Mumbai High Court</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust LegalLink for their legal needs. Start your legal journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/consultation">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 text-lg">
                  Start Free Consultation
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-slate-600 text-slate-900 hover:bg-slate-800 hover:text-slate-400 px-8 py-3 text-lg dark:text-slate-400  ">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto">
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                <Scale className="text-white dark:text-slate-900 h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">LegalLink</span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              © 2024 LegalLink. All rights reserved.
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              Professional legal services platform • Regulated by Bar Council of India
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}