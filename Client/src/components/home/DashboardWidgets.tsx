import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DoorOpen, Users as UsersIcon, CreditCard, FileText } from "lucide-react";
import PeopleIcon from "@/assets/icons/PeopleIcon";
import TasksIcon from "@/assets/icons/TasksIcon";
import EmployeesIcon from "@/assets/icons/EmployeesIcon";

const iconMap = {
  DoorOpen: DoorOpen,
  Users: UsersIcon,
  CreditCard: CreditCard,
  FileText: FileText,
  PeopleIcon: PeopleIcon,
  TasksIcon: TasksIcon,
  EmployeesIcon: EmployeesIcon,
};

export default function DashboardWidgets({ cards }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
      {cards.map((card) => {
        const IconComponent = iconMap[card.icon] || DoorOpen;
        const isCustomIcon = card.icon === "PeopleIcon" || card.icon === "TasksIcon" || card.icon === "EmployeesIcon";
        return (
          <Card
            key={card.key}
            className="cursor-pointer transition-all duration-150 shadow-md hover:scale-105 bg-muted/80"
            onClick={card.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
              {isCustomIcon ? (
                <div className="w-8 h-8 text-primary">
                  <IconComponent isActive={false} />
                </div>
              ) : (
                <IconComponent className="w-8 h-8 text-primary" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{card.value}</div>
              <div className="text-muted-foreground text-sm">{card.description}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 