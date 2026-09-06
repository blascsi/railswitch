# GraphQL renderings for error types AshGraphql doesn't cover out of the box.
#
# AshGraphql replaces any error lacking an AshGraphql.Error implementation
# with a generic "something went wrong" response. These impls give clients a
# stable `code` and a useful message to match on instead.
#
# ash_graphql ships impls for AuthenticationFailed and InvalidToken, but they
# are guarded by a compile-time check for ash_authentication — which is never
# on the load path while ash_graphql compiles (Mix prunes code paths to a
# dependency's own deps, and ash_graphql doesn't depend on ash_authentication).
# So they are permanently compiled out and must be defined here.
#
# Deliberately omitted: AshAuthentication.Errors.MissingSecret and
# InvalidSecret. Those signal server misconfiguration, not a client auth
# failure — they should stay masked as internal errors so a broken deployment
# is noticed, not disguised as "your credentials are wrong".

defimpl AshGraphql.Error, for: AshAuthentication.Errors.AuthenticationFailed do
  def to_error(_error) do
    %{
      message: "Authentication failed",
      short_message: "Authentication failed",
      code: "authentication_failed",
      vars: %{},
      fields: []
    }
  end
end

defimpl AshGraphql.Error, for: AshAuthentication.Errors.InvalidToken do
  def to_error(_error) do
    %{
      message: "The provided token is invalid",
      short_message: "Invalid token",
      code: "invalid_token",
      vars: %{},
      fields: []
    }
  end
end

defimpl AshGraphql.Error, for: AshAuthentication.Errors.UnconfirmedUser do
  def to_error(_error) do
    %{
      message: "You must confirm your account before continuing",
      short_message: "Unconfirmed user",
      code: "unconfirmed_user",
      vars: %{},
      fields: []
    }
  end
end

defimpl AshGraphql.Error, for: AshAuthentication.Errors.CannotConfirmUnconfirmedUser do
  def to_error(_error) do
    %{
      message: "Unable to confirm this user",
      short_message: "Cannot confirm user",
      code: "cannot_confirm_unconfirmed_user",
      vars: %{},
      fields: []
    }
  end
end

defimpl AshGraphql.Error, for: Ash.Error.Invalid.TenantRequired do
  def to_error(_error) do
    %{
      message: "Unable to process request without the x-organization-id header",
      short_message: "Tenant not provided",
      code: "tenant_not_provided",
      vars: %{},
      fields: []
    }
  end
end

defimpl AshGraphql.Error, for: RailswitchBackend.Orgs.Errors.NotOrganizationMember do
  def to_error(_error) do
    %{
      message: "You are not a member of this organization",
      short_message: "Not a member",
      code: "not_organization_member",
      vars: %{},
      fields: []
    }
  end
end
