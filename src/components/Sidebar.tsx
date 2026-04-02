import React from "react";
import { SidebarBody, SidebarLink } from "./ui/SidebarLayout";
import { IconBriefcase, IconChartBar, IconCreditCard, IconHome, IconLogout, IconSettings } from "@tabler/icons-react";
import { cn } from "@/libs/utils";

type SidebarContentProps = {
  className?: string;
};

export const SidebarContent = ({ className }: SidebarContentProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-between h-full py-4", className)}>
      <div className="flex flex-col items-center space-y-6 ">
        <SidebarLink
          link={{
            href: "/dashboard",
            icon: <IconHome size={20} />,
            label: "Dashboard",
          }}
          className="text-[var(--brand)]"
        />
        <SidebarLink
          link={{
            href: "/dashboard",
            icon: <IconChartBar size={20} />,
            label: "Analytics",
          }}
        />
        <SidebarLink
          link={{
            href: "/dashboard",
            icon: <IconCreditCard size={20} />,
            label: "Billing",
          }}
        />
        <SidebarLink
          link={{
            href: "/dashboard",
            icon: <IconBriefcase size={20} />,
            label: "Jobs",
          }}
        />
        <SidebarLink
          link={{
            href: "/dashboard",
            icon: <IconSettings size={20} />,
            label: "Settings",
          }}
        />
      </div>

      <SidebarLink
        link={{
          href: "/dashboard",
          icon: <IconLogout size={20} />,
          label: "Logout",
        }}
      />
    </div>
  );
};

const Sidebar = () => {
  return (
    <SidebarBody>
      <SidebarContent />
    </SidebarBody>
  );
};

export default Sidebar;
