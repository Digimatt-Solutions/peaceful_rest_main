import { useUserRole } from "@/hooks/useUserRole";
import Fundraising from "./Fundraising";
import GuestFundraising from "./GuestFundraising";

/** Admins manage fundraisers; everyone else gets the supporter view. */
const FundraisingRoute = () => {
  const { role } = useUserRole();
  const isAdmin = role === "super_admin" || role === "memorial_admin";
  return isAdmin ? <Fundraising /> : <GuestFundraising />;
};

export default FundraisingRoute;
