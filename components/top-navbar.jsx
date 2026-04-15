"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function TopNavbar() {
  const { data: session } = useSession();
  const { toggleSidebar, isMobile } = useSidebar();

  if (!session) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b bg-white dark:bg-gray-900">
      {/* Mobile menu button - only visible on mobile */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-3 p-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {session.user?.name}
            </span>
            <span className="text-xs text-gray-500">
              {session.user?.email}
            </span>
          </div>
          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-[#f2de37]">
            <User className="h-5 w-5 text-black" />
          </div>
        </div>
      </div>
    </div>
  );
}