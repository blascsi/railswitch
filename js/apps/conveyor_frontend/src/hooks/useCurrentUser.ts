import { useQuery } from "@tanstack/react-query";
import { getUsersMeOptions } from "../generated/client/@tanstack/react-query.gen";

export function useCurrentUser() {
  return useQuery(getUsersMeOptions());
}
