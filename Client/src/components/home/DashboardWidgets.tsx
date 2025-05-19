import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DoorOpen, Users as UsersIcon, CreditCard, FileText } from "lucide-react";

const iconMap = {
  DoorOpen: DoorOpen,
  Users: UsersIcon,
  CreditCard: CreditCard,
  FileText: FileText,
};

export default function DashboardWidgets({ cards }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
      {cards.map((card) => {
        const Icon = iconMap[card.icon] || DoorOpen;
        return (
          <Card
            key={card.key}
            className="cursor-pointer transition-all duration-150 shadow-md hover:scale-105 bg-muted/80"
            onClick={card.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
              <Icon className="w-8 h-8 text-primary" />
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