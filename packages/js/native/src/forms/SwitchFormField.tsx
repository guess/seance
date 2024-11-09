import { Switch } from 'react-native';
import { FormField, type FormFieldSpec } from './FormField';

type SwitchFormFieldProps = {
  field: FormFieldSpec;
  label: string;
};

export function SwitchFormField({ field, label }: SwitchFormFieldProps) {
  return (
    <FormField field={field} label={label}>
      {(value, onChange, _errors) => (
        <Switch
          value={value}
          onValueChange={(newValue) => {
            onChange(newValue);
          }}
        />
      )}
    </FormField>
  );
}
