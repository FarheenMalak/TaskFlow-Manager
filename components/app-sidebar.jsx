"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { ClipboardList, CheckCircle, LogOut, LayoutDashboard, } from "lucide-react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false, callbackUrl: '/login' });
    router.push('/login');
  };

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  if (status === "loading") {
    return (
      <Sidebar collapsible="icon" className="bg-white/98 backdrop-blur-sm border-r border-gray-100">
        <SidebarHeader className="sidebar-header p-4 font-bold text-xl">
          {state === "expanded" ? (
            <span className="bg-black bg-clip-text text-transparent">
              TaskFlow
            </span>
          ) : (
            <span className="bg-black bg-clip-text text-transparent">
              TF
            </span>
          )}
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 text-center text-gray-400">Loading...</div>
        </SidebarContent>
      </Sidebar>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" className="group bg-white/98 backdrop-blur-sm border-r border-gray-100 dark:bg-gray-900/98">
      <SidebarHeader className="p-5 flex flex-row items-start justify-between">
        {state === "expanded" ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#f2de37] flex items-center justify-center">
                <span className="text-black font-bold text-sm">TF</span>
              </div>
              <span className="font-bold text-xl bg-black bg-clip-text text-transparent">
                TaskFlow
              </span>
            </div>

            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-fullflex items-center justify-center transition"
            >
              <PanelLeftOpen className="h-4 w-4 text-black" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push("/dashboard")}
                isActive={pathname === "/dashboard"}
                className={`mb-1 group-data-[state=collapsed]:justify-center ${pathname === "/dashboard"
                  ? "!bg-[#fffde8] !border-l-4 !border-[#f2de37] text-black font-semibold"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"}
                `}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push("/tasks")}
                isActive={pathname === "/tasks"}
                className={`mb-1 group-data-[state=collapsed]:justify-center ${pathname === "/tasks"
                  ? "!bg-[#fffde8] !border-l-4 !border-[#f2de37] text-black font-semibold"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"}
                `}
              >
                <ClipboardList className="h-4 w-4" />
                <span>My Tasks</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push("/completed")}
                isActive={pathname === "/completed"}
                className={`
                 mb-1 group-data-[state=collapsed]:justify-center ${pathname === "/completed"
                    ? "!bg-[#fffde8] !border-l-4 !border-[#f2de37] text-black font-semibold"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"}
                 `}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Completed</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-100 dark:border-gray-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {state === "expanded" && (
          <div className="text-center text-xs text-gray-400 mt-3">
            © 2025 TaskFlow
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}