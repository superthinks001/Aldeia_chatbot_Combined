// components/AldeiaAdvisorChatbot.tsx
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  confidence?: number
  intent?: string
  sources?: Array<{ title: string; url: string }>
}

interface AldeiaAdvisorChatbotProps {
  currentStep?: string
  onStepNavigation?: (step: string) => void
  className?: string
}

const stepContextMap: Record<string, string> = {
  home: "User is on the home page starting their rebuild journey",
  location: "User is confirming their property location",
  style: "User is selecting architectural style preferences",
  inspiration: "User is browsing design inspiration",
  needs: "User is selecting specific needs for their rebuild",
  budget: "User is setting their budget range",
  matches: "User is viewing matched design options",
  details: "User is reviewing detailed design information"
}

const quickActions: Record<string, Array<{ label: string; query: string }>> = {
  home: [
    { label: "Start rebuild process", query: "How do I start the rebuild process?" },
    { label: "Required permits", query: "What permits do I need for rebuilding?" },
    { label: "Timeline information", query: "How long does rebuilding typically take?" }
  ],
  location: [
    { label: "Zoning requirements", query: "What are the zoning requirements for my area?" },
    { label: "Setback rules", query: "What are setback requirements?" },
    { label: "Fire zone regulations", query: "Are there special requirements for fire zones?" }
  ],
  style: [
    { label: "Popular styles", query: "What architectural styles are popular in my area?" },
    { label: "Fire-resistant designs", query: "Which styles are most fire-resistant?" },
    { label: "Cost differences", query: "How do style choices affect cost?" }
  ],
  budget: [
    { label: "Average costs", query: "What are typical rebuild costs per square foot?" },
    { label: "Insurance coverage", query: "How much will insurance typically cover?" },
    { label: "Financing options", query: "What financing options are available?" }
  ],
  needs: [
    { label: "ADU options", query: "Can I add an ADU to my rebuild?" },
    { label: "Solar requirements", query: "Are solar panels required?" },
    { label: "Accessibility features", query: "What accessibility features should I consider?" }
  ]
}

export function AldeiaAdvisorChatbot({ 
  currentStep = 'home',
  onStepNavigation,
  className = ''
}: AldeiaAdvisorChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>('')
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const confidenceThreshold = 0.7

  // Initialize conversation
  useEffect(() => {
    setConversationId(`conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  }, [])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send initial greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getStepSpecificGreeting(currentStep)
      setMessages([{
        id: `msg-${Date.now()}`,
        text: greeting,
        sender: 'bot',
        timestamp: new Date(),
        confidence: 1.0,
        intent: 'greeting'
      }])
    }
  }, [isOpen, currentStep, messages.length])

  const getStepSpecificGreeting = (step: string): string => {
    const greetings = {
      home: "👋 Welcome! I'm Aldeia Advisor, here to guide you through the rebuild process. How can I help you get started?",
      location: "I see you're confirming your property location. I can help with zoning requirements, setback rules, and local regulations.",
      style: "Looking at architectural styles? I can provide information about fire-resistant designs and popular styles in your area.",
      inspiration: "Browsing for inspiration? I can help you understand different design elements and their practical implications.",
      needs: "Let's discuss your specific needs. I can provide information about ADUs, solar requirements, and accessibility features.",
      budget: "Setting your budget? I can help with cost estimates, insurance coverage information, and financing options.",
      matches: "Great choices! I can explain details about these designs or help you compare options.",
      details: "Reviewing the details? I can clarify any technical aspects or help you understand the next steps."
    }
    return greetings[step as keyof typeof greetings] || greetings.home
  }

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationId,
          context: {
            step: currentStep,
            description: stepContextMap[currentStep]
          },
          pageUrl: window.location.pathname,
          isFirstMessage
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      
      const botMessage: Message = {
        id: `msg-${Date.now()}-bot`,
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
        confidence: data.confidence,
        intent: data.intent,
        sources: data.sources
      }

      setMessages(prev => [...prev, botMessage])
      setIsFirstMessage(false)

      // Check for navigation suggestions
      if (data.suggestedStep && onStepNavigation) {
        setTimeout(() => {
          if (window.confirm(`Would you like to go to the ${data.suggestedStep} step?`)) {
            onStepNavigation(data.suggestedStep)
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        text: "I apologize, but I'm having trouble connecting. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date(),
        confidence: 0
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (query: string) => {
    handleSendMessage(query)
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg transition-all hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className={`
        ${isMinimized ? 'h-14' : 'h-[600px]'} 
        w-[380px] flex flex-col shadow-2xl transition-all duration-300
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-orange-500 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Aldeia Advisor</h3>
              <p className="text-xs opacity-90">
                {stepContextMap[currentStep]?.split(' ').slice(0, 5).join(' ')}...
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-orange-600"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-orange-600"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Quick Actions */}
            {messages.length <= 1 && quickActions[currentStep] && (
              <div className="p-3 border-b bg-gray-50">
                <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions[currentStep].map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleQuickAction(action.query)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    
                    {message.sender === 'bot' && (
                      <>
                        {message.confidence !== undefined && message.confidence < confidenceThreshold && (
                          <div className="mt-2 flex items-center gap-1 text-xs opacity-70">
                            <AlertCircle className="h-3 w-3" />
                            <span>Low confidence response</span>
                          </div>
                        )}
                        
                        {message.intent && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {message.intent}
                          </Badge>
                        )}

                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium mb-1">Sources:</p>
                            {message.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline block"
                              >
                                {source.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-2"
              >
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about rebuilding..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
