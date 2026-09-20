import { createFormHook } from "@tanstack/react-form";

import {
  AppCheckboxInput,
  AppSelector,
  AppTextArea,
  AppTextInput,
  FormError,
  SubmitButton,
} from "./fields";
import { fieldContext, formContext } from "./formContexts";

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextInput: AppTextInput,
    TextArea: AppTextArea,
    CheckboxInput: AppCheckboxInput,
    Selector: AppSelector,
  },
  formComponents: {
    FormError,
    SubmitButton,
  },
});
