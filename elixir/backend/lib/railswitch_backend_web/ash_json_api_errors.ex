# JSON:API renderings for AshAuthentication's error types.
#
# Without these, AshJsonApi has no `ToJsonApiError` implementation for these
# errors, so it logs a warning (with a full stacktrace) and falls back to a
# generic response on *every* failed login/token check. These impls give each
# a clean, non-leaky body and a semantically correct status code.
#
# Deliberately omitted: `AshAuthentication.Errors.{MissingSecret,InvalidSecret}`.
# Those signal server misconfiguration, not a client auth failure — they should
# keep surfacing as loud 500s so a broken deployment is noticed, not disguised
# as "your credentials are wrong".

defimpl AshJsonApi.ToJsonApiError, for: AshAuthentication.Errors.AuthenticationFailed do
  def to_json_api_error(_error) do
    %AshJsonApi.Error{
      id: Ash.UUID.generate(),
      status_code: 401,
      code: "authentication_failed",
      title: "Authentication failed",
      detail: "Authentication failed"
    }
  end
end

defimpl AshJsonApi.ToJsonApiError, for: AshAuthentication.Errors.InvalidToken do
  def to_json_api_error(_error) do
    %AshJsonApi.Error{
      id: Ash.UUID.generate(),
      status_code: 401,
      code: "invalid_token",
      title: "Invalid token",
      detail: "The provided token is invalid"
    }
  end
end

defimpl AshJsonApi.ToJsonApiError, for: AshAuthentication.Errors.UnconfirmedUser do
  def to_json_api_error(_error) do
    %AshJsonApi.Error{
      id: Ash.UUID.generate(),
      status_code: 403,
      code: "unconfirmed_user",
      title: "Unconfirmed user",
      detail: "You must confirm your account before continuing"
    }
  end
end

defimpl AshJsonApi.ToJsonApiError, for: AshAuthentication.Errors.CannotConfirmUnconfirmedUser do
  def to_json_api_error(_error) do
    %AshJsonApi.Error{
      id: Ash.UUID.generate(),
      status_code: 403,
      code: "cannot_confirm_unconfirmed_user",
      title: "Cannot confirm user",
      detail: "Unable to confirm this user"
    }
  end
end
