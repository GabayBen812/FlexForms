import { useNavigation } from "react-router-dom";
import { PageLoader } from "@/components/ui/page-loader";

export function NavigationLoader() {
  const navigation = useNavigation();

  // Show loader when navigating between routes
  if (navigation.state === "loading") {
    return <PageLoader />;
  }

  return null;
}

