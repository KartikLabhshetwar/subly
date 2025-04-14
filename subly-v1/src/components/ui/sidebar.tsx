'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { NavSection } from "@/components/ui/nav-section"
import { NavItem } from "@/components/ui/nav-item"
import { cn } from "@/lib/utils"
import { ChevronRight, LayoutDashboard, CreditCard, FileText, Settings, LogOut, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface SidebarProps {
  className?: string
  onExpandedChange?: (expanded: boolean) => void
}

interface User {
  id: string
  email?: string
  user_metadata?: {
    avatar_url?: string
    full_name?: string
  }
}

export function Sidebar({ className, onExpandedChange }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    onExpandedChange?.(isExpanded)
  }, [isExpanded, onExpandedChange])

  useEffect(() => {
    // Get current user on component mount
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'SIGNED_IN') {
        getUser()
      }
    })
    
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const toggleExpanded = (expanded: boolean) => {
    setIsExpanded(expanded)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className={cn(
      "flex flex-col gap-4 p-4 border-r border-border/50 bg-background/50 backdrop-blur-sm",
      isExpanded ? "w-64" : "w-[80px]",
      "transition-all duration-300",
      className
    )}>
      <div className="flex items-center gap-3 px-2">
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-lg text-white">S</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold">Subly</h3>
                <p className="text-xs text-muted-foreground">Subscription Manager</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => toggleExpanded(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={() => toggleExpanded(true)}
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-lg text-white">S</span>
            </div>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <NavSection title="Menu" isExpanded={isExpanded}>
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
            isExpanded={isExpanded}
          />
          <NavItem
            href="/dashboard/subscriptions"
            icon={<CreditCard className="h-4 w-4" />}
            label="Subscriptions"
            isExpanded={isExpanded}
          />
          <NavItem
            href="/dashboard/reports"
            icon={<FileText className="h-4 w-4" />}
            label="Reports"
            isExpanded={isExpanded}
          />
          <NavItem
            href="/dashboard/calendar"
            icon={<Calendar className="h-4 w-4" />}
            label="Calendar"
            isExpanded={isExpanded}
          />
        </NavSection>

        <NavSection title="Account" className="mt-6" isExpanded={isExpanded}>
          <NavItem
            href="/dashboard/settings"
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            isExpanded={isExpanded}
          />
          <div 
            className={cn(
              "flex items-center text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60 cursor-pointer transition-colors",
              isExpanded ? "py-2 px-3" : "py-2 px-2 justify-center"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-3" />
            {isExpanded && <span>Sign out</span>}
          </div>
        </NavSection>
      </div>

      {user && (
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg border border-border/50",
          !isExpanded && "justify-center"
        )}>
          <Avatar>
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>{user.email?.substring(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
          </Avatar>
          {isExpanded && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 