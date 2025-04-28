import { useSearchParams } from "react-router-dom";
import RoleList from "./RoleList"; // split your list into this if needed
import Permissions from "./Permissions";
const Roles = () => {
  const [searchParams] = useSearchParams();
  // const navigate = useNavigate();
  const roleId = searchParams.get("id");

  if (roleId) return <Permissions />;

  return <RoleList />;
};

export default Roles;
