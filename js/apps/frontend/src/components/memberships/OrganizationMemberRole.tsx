import { Token } from "@astryxdesign/core/Token";

import type { graphql } from "../../graphql/graphql";

type OrganizationMemberRoleProps = {
  role: ReturnType<typeof graphql.scalar<"MembershipRole">>;
};

export function OrganizationMemberRole({ role }: OrganizationMemberRoleProps) {
  switch (role) {
    case "MEMBER":
      return <Token label="Member" />;
    case "OWNER":
      return <Token label="Owner" color="green" />;
    default:
      <Token label="Unknown" />;
  }
}
