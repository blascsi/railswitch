defmodule RailswitchBackend.Accounts.User do
  @moduledoc false

  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Accounts,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshGraphql.Resource, AshAuthentication]

  alias AshAuthentication.Strategy.Password.HashPasswordChange
  alias AshAuthentication.Strategy.Password.PasswordConfirmationValidation
  alias AshAuthentication.Strategy.RememberMe.MaybeGenerateTokenPreparation

  graphql do
    type :user
    # The User type is never list-queried, so deriving a filter only leaks a
    # meaningless `filter:` argument onto signIn/currentUser.
    derive_filter? false
  end

  authentication do
    add_ons do
      log_out_everywhere do
        apply_on_password_change? true
      end

      confirmation :confirm_new_user do
        monitor_fields [:email]
        confirm_on_create? true
        confirm_on_update? false
        require_interaction? true
        confirmed_at_field :confirmed_at
        auto_confirm_actions [:sign_in_with_magic_link, :reset_password_with_token]
        sender RailswitchBackend.Accounts.User.Senders.SendNewUserConfirmationEmail
      end
    end

    tokens do
      enabled? true
      token_resource RailswitchBackend.Accounts.Token
      signing_secret RailswitchBackend.Secrets
      store_all_tokens? true
      require_token_presence_for_authentication? true
      token_lifetime {12, :hours}
    end

    strategies do
      password :password do
        identity_field :email
        hash_provider AshAuthentication.BcryptProvider
        sign_in_tokens_enabled? false

        resettable do
          sender RailswitchBackend.Accounts.User.Senders.SendPasswordResetEmail
          # these configurations will be the default in a future release
          password_reset_action_name :reset_password_with_token
          request_password_reset_action_name :request_password_reset_token
        end
      end

      remember_me :remember_me do
        cookie_name :railswitch_remember_me
        token_lifetime {30, :days}
      end
    end
  end

  postgres do
    table "users"
    repo RailswitchBackend.Repo
  end

  actions do
    defaults [:read]

    read :current_user do
      description "The currently signed-in user."
      get? true
    end

    action :sign_out, RailswitchBackend.Accounts.User.Types.SignOutResult do
      description "Ends the current session, revoking its tokens."

      run fn _input, _context -> {:ok, :successful_signout} end
    end

    read :get_by_subject do
      description "Get a user by the subject claim in a JWT"
      argument :subject, :string, allow_nil?: false
      get? true
      prepare AshAuthentication.Preparations.FilterBySubject
    end

    update :change_password do
      # Use this action to allow users to change their password by providing
      # their current password and a new password.

      require_atomic? false
      accept []
      argument :current_password, :string, sensitive?: true, allow_nil?: false

      argument :password, :string,
        sensitive?: true,
        allow_nil?: false,
        constraints: [min_length: 8]

      argument :password_confirmation, :string, sensitive?: true, allow_nil?: false

      validate confirm(:password, :password_confirmation)

      validate {AshAuthentication.Strategy.Password.PasswordValidation,
                strategy_name: :password, password_argument: :current_password}

      change {HashPasswordChange, strategy_name: :password}

      # It seems that since this action is not atomic, HashPasswordChange changes the
      # password hash after `log_out_everywhere`'s check to see if the password hash changed
      # already ran. This means that the fact that the hashed_password changed is never
      # recognized by the add-on, so no tokens are revoked.
      # Adding this change explicitly forces a token revocation for the user.
      change AshAuthentication.AddOn.LogOutEverywhere.OnPasswordChange
    end

    read :sign_in_with_password do
      description "Attempt to sign in using a email and password."
      get? true

      argument :email, :ci_string do
        description "The email to use for retrieving the user."
        allow_nil? false
      end

      argument :password, :string do
        description "The password to check for the matching user."
        allow_nil? false
        sensitive? true
      end

      argument :remember_me, :boolean do
        description "Whether to generate a remember me token."
        allow_nil? true
      end

      # validates the provided email and password and generates a token
      prepare AshAuthentication.Strategy.Password.SignInPreparation

      prepare {MaybeGenerateTokenPreparation, strategy_name: :remember_me}
    end

    create :register_with_password do
      description "Register a new user with a email and password."

      argument :email, :ci_string do
        allow_nil? false
      end

      argument :password, :string do
        description "The proposed password for the user, in plain text."
        allow_nil? false
        constraints min_length: 8
        sensitive? true
      end

      argument :password_confirmation, :string do
        description "The proposed password for the user (again), in plain text."
        allow_nil? false
        sensitive? true
      end

      argument :remember_me, :boolean do
        description "Whether to generate a remember me token."
        allow_nil? true
      end

      # Sets the email from the argument
      change set_attribute(:email, arg(:email))

      # Hashes the provided password
      change HashPasswordChange

      # Generates an authentication token for the user
      change AshAuthentication.GenerateTokenChange

      # Generates remember me token, if required
      change {AshAuthentication.Strategy.RememberMe.MaybeGenerateTokenChange, strategy: :remember_me}

      # Creates a personal organization for each user
      change RailswitchBackend.Accounts.User.Changes.CreatePersonalOrganization

      # validates that the password matches the confirmation
      validate PasswordConfirmationValidation
    end

    read :sign_in_with_remember_me do
      description "Attempt to sign in using a remember me token."
      get? true

      argument :token, :string do
        description "The remember me token"
        allow_nil? false
        sensitive? true
      end

      argument :rotate_token, :boolean do
        description "Whether to also issue a fresh remember-me token."
        allow_nil? true
      end

      # validates the provided the remember me token and generates a token for the session
      prepare AshAuthentication.Strategy.RememberMe.SignInPreparation

      prepare {MaybeGenerateTokenPreparation, strategy_name: :remember_me, argument: :rotate_token}
    end

    action :request_password_reset_token do
      description "Send password reset instructions to a user if they exist."

      argument :email, :ci_string do
        allow_nil? false
      end

      # creates a reset token and invokes the relevant senders
      run {AshAuthentication.Strategy.Password.RequestPasswordReset, action: :get_by_email}
    end

    read :get_by_email do
      description "Looks up a user by their email"
      get_by :email
    end

    update :reset_password_with_token do
      argument :reset_token, :string do
        allow_nil? false
        sensitive? true
      end

      argument :password, :string do
        description "The proposed password for the user, in plain text."
        allow_nil? false
        constraints min_length: 8
        sensitive? true
      end

      argument :password_confirmation, :string do
        description "The proposed password for the user (again), in plain text."
        allow_nil? false
        sensitive? true
      end

      # validates the provided reset token
      validate AshAuthentication.Strategy.Password.ResetTokenValidation

      # validates that the password matches the confirmation
      validate PasswordConfirmationValidation

      # Hashes the provided password
      change HashPasswordChange

      # Generates an authentication token for the user
      change AshAuthentication.GenerateTokenChange
    end

    destroy :destroy do
      primary? true
      require_atomic? false

      change RailswitchBackend.Accounts.User.Changes.EnsureNoSolelyOwnedOrganizations
    end
  end

  policies do
    bypass AshAuthentication.Checks.AshAuthenticationInteraction do
      authorize_if always()
    end

    bypass action([:sign_in_with_password, :sign_in_with_remember_me, :register_with_password]) do
      description "Sign-in and registration is always public"
      authorize_if always()
    end

    policy action_type(:read) do
      description "Users can read themselves, and other members of their organizations"
      authorize_if expr(id == ^actor(:id))
      authorize_if accessing_from(RailswitchBackend.Orgs.Membership, :user)
    end

    policy action(:sign_out) do
      description "Signing out requires a session to sign out of"
      authorize_if actor_present()
    end

    policy action(:change_password) do
      description "Users can change their own password"
      authorize_if expr(id == ^actor(:id))
    end

    policy action_type(:destroy) do
      description "Users can delete their own accounts"
      authorize_if expr(id == ^actor(:id))
    end
  end

  attributes do
    uuid_v7_primary_key :id

    attribute :email, :ci_string do
      allow_nil? false
      public? true
    end

    attribute :hashed_password, :string do
      allow_nil? false
      sensitive? true
    end

    attribute :confirmed_at, :utc_datetime_usec

    timestamps()
  end

  identities do
    identity :unique_email, [:email]
  end
end
