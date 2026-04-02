import React from "react";
import { SidebarBody, SidebarLink } from "./ui/SidebarLayout";
import { IconBriefcase, IconChartBar, IconCreditCard, IconHome, IconLogout, IconSettings } from "@tabler/icons-react";

const Sidebar = () => {
  return (
    <SidebarBody>
      <div className="flex flex-col items-center justify-between h-full py-4">
        {/* Top Icons */}
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
              href: "/analytics",
              icon: <IconChartBar size={20} />,
              label: "Analytics",
            }}
          />
          <SidebarLink
            link={{
              href: "/billing",
              icon: <IconCreditCard size={20} />,
              label: "Billing",
            }}
          />
          <SidebarLink
            link={{
              href: "/jobs",
              icon: <IconBriefcase size={20} />,
              label: "Jobs",
            }}
          />
          <SidebarLink
            link={{
              href: "/settings",
              icon: <IconSettings size={20} />,
              label: "Settings",
            }}
          />
        </div>

        {/* Bottom Icon */}
        <SidebarLink
          link={{
            href: "/logout",
            icon: <IconLogout size={20} />,
            label: "Logout",
          }}
        />
      </div>
    </SidebarBody>
  );
};

export default Sidebar;
