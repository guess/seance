import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { FormField, type FormFieldSpec } from './FormField';

type TextFormFieldProps = TextInputProps & {
  field: FormFieldSpec;
  label?: string;
  placeholder?: string;
};

export function TextFormField({
  field,
  label,
  placeholder,
  style = {},
  ...props
}: TextFormFieldProps) {
  return (
    <FormField field={field} label={label}>
      {(value, onChange, _errors) => (
        <View style={[styles.container, style]}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            {...props}
          />
        </View>
      )}
    </FormField>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
  },
});
