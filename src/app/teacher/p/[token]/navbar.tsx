"use client";

import Link from "next/link";

import {
  Navbar as BaseNavbar,
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
  NavbarBrand,
  NavbarContent,
} from "@olinfo/react-components";

import logoDark from "~/app/logo-dark.svg";
import logoLight from "~/app/logo-light.svg";

export function TeacherNavbar({
  instituteName,
  instituteCity,
}: {
  instituteName: string;
  instituteCity: string;
}) {
  return (
    <BaseNavbar color="bg-base-300 text-base-content">
      <NavbarBrand>
        <Link href="/" className="flex h-full items-center">
          <picture className="h-full">
            <source media="(prefers-color-scheme: dark)" srcSet={logoDark.src} />
            <img
              src={logoLight.src}
              width={logoLight.width}
              height={logoLight.height}
              alt="OIS Logo"
              className="h-full w-auto"
            />
          </picture>
        </Link>
      </NavbarBrand>
      <NavbarContent>
        <InstituteDropdown name={instituteName} city={instituteCity} />
      </NavbarContent>
    </BaseNavbar>
  );
}

function InstituteDropdown({ name, city }: { name: string; city: string }) {
  const label = city ? `${name}, ${city}` : name;

  return (
    <Dropdown className="dropdown-end">
      <DropdownButton ariaLabel="Menu istituto">
        <div className="max-w-[200px] truncate sm:max-w-xs md:max-w-md font-medium" title={label}>
          {label}
        </div>
      </DropdownButton>
      <DropdownMenu>
        <DropdownItem>
          <Link href="/">Esci</Link>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
