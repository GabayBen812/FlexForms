import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

type Props = {
  subTitle?: string;
  tabLabels: Record<string, string>;
};

export default function SettingsBreadcrumbs({ subTitle, tabLabels }: Props) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab");
  const { t } = useTranslation();

  const crumbs = [
    {
      label: t("organization_settings"),
      href: "/organization-settings?tab=general",
    },
    ...(tab && tabLabels[tab]
      ? [
          {
            label: tabLabels[tab],
            href: `/organization-settings?tab=${tab}`,
          },
        ]
      : []),
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map(
          (crumb, i) =>
            i !== crumbs.length - 1 && (
              <>
                <BreadcrumbItem key={crumb.href}>
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => navigate(crumb.href)}
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )
        )}
        {subTitle ? (
          <BreadcrumbItem>
            <BreadcrumbPage>{subTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          // Remove last separator if there's no subtitle
          crumbs.length > 0 && (
            <BreadcrumbItem>
              <BreadcrumbPage>{crumbs[crumbs.length - 1].label}</BreadcrumbPage>
            </BreadcrumbItem>
          )
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
