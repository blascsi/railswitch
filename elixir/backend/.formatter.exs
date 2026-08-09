[
  import_deps: [
    :ash_graphql,
    :absinthe,
    :ash_oban,
    :oban,
    :ash_authentication,
    :ash_postgres,
    :ash,
    :reactor,
    :ecto,
    :ecto_sql,
    :phoenix
  ],
  subdirectories: ["priv/*/migrations"],
  inputs: ["*.{ex,exs}", "{config,lib,test}/**/*.{ex,exs}", "priv/*/seeds.exs"],
  plugins: [Absinthe.Formatter, Spark.Formatter, Styler]
]
