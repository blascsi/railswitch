import { Button } from "@astryxdesign/core/Button";
import {
  CheckboxInput,
  type CheckboxInputProps,
} from "@astryxdesign/core/CheckboxInput";
import { Icon } from "@astryxdesign/core/Icon";
import { Selector, type SelectorProps } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TextArea, type TextAreaProps } from "@astryxdesign/core/TextArea";
import { TextInput, type TextInputProps } from "@astryxdesign/core/TextInput";
import { colorVars } from "@astryxdesign/core/theme/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { errorMessages, fieldErrorStatus } from "./fieldStatus";
import { useFieldContext, useFormContext } from "./formContexts";

const styles = stylex.create({
  formErrorText: {
    color: colorVars["--color-error"],
  },
});

type BoundProps<T> = Omit<T, "value" | "onChange" | "onBlur" | "status">;

export function AppTextInput(props: BoundProps<TextInputProps>) {
  const field = useFieldContext<string>();

  return (
    <TextInput
      {...props}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      status={fieldErrorStatus(field.state.meta.errors)}
    />
  );
}

type AppTextAreaProps = BoundProps<TextAreaProps> & {
  formatOnBlur?: (value: string) => string;
};

export function AppTextArea({ formatOnBlur, ...props }: AppTextAreaProps) {
  const field = useFieldContext<string>();

  return (
    <TextArea
      {...props}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={() => {
        if (formatOnBlur != null) {
          field.handleChange(formatOnBlur(field.state.value));
        }

        field.handleBlur();
      }}
      status={fieldErrorStatus(field.state.meta.errors)}
    />
  );
}

export function AppCheckboxInput(props: BoundProps<CheckboxInputProps>) {
  const field = useFieldContext<boolean>();

  return (
    <CheckboxInput
      {...props}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      status={fieldErrorStatus(field.state.meta.errors)}
    />
  );
}

export function AppSelector(
  props: BoundProps<Extract<SelectorProps, { hasClear?: false }>>,
) {
  const field = useFieldContext<string>();

  return (
    <Selector
      {...props}
      value={field.state.value}
      onChange={field.handleChange}
      status={fieldErrorStatus(field.state.meta.errors)}
    />
  );
}

export function FormError() {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.errors}>
      {(errors) => {
        const message = errorMessages(errors).join(" ");

        if (message === "") {
          return null;
        }

        return (
          <Stack direction="horizontal" gap={1} vAlign="center" role="alert">
            <Icon icon="error" color="error" size="sm" />
            <Text type="supporting" xstyle={styles.formErrorText}>
              {message}
            </Text>
          </Stack>
        );
      }}
    </form.Subscribe>
  );
}

type SubmitButtonProps = {
  label: string;
  isPending?: boolean;
  requiresChanges?: boolean;
};

export function SubmitButton({
  label,
  isPending,
  requiresChanges = false,
}: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isDirty] as const}
    >
      {([canSubmit, isDirty]) => (
        <Button
          type="submit"
          variant="primary"
          label={label}
          isLoading={isPending}
          isDisabled={!canSubmit || (requiresChanges && !isDirty)}
        />
      )}
    </form.Subscribe>
  );
}
